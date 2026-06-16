class OrdersController < ApplicationController
  include MenuCatalog
  include CartSession
  include LineAuthentication

  # テイクアウト面は入口から全面ログイン必須（ADR-0008）。order_type は既存ヘルパーの
  # params 優先で解決する — session のみ参照すると、セッション未確立の初回
  # GET /order?order_type=takeout が未ログインのまま描画されてすり抜けるため。
  # 履歴は LineAccount に紐づくページなので、モードを問わず常にログイン必須。
  # In-store はこの before_action ごとスキップされ、認証コードを一切通らない。
  # NOTE: 同名メソッドの before_action は二重登録すると後勝ちで上書きされるため、1つに束ねる。
  before_action :require_line_login!, if: -> { order_type == "takeout" || action_name == "history" }

  def home
    # In-store はテーブル番号が確定していなければ入口へ戻す（デモ入口で必須。イシュー #41）。
    # table_number は正の整数だけを session に焼くため、ここで nil なら未確定。
    return redirect_to(root_path) if order_type == "in_store" && table_number.blank?

    # ウェルカム画面からの遷移は「新しい客のセッション開始」として Cart をクリアする
    clear_cart if params[:order_type].present?

    lines = cart_lines
    render inertia: "orders/Home", props: {
      table_number: table_number,
      order_type: order_type,
      restaurant_name: "Burger House",
      menu_items: MenuItem.with_attached_image.order(:id).map { |item| item.as_customer_json(image_variant: :thumb) },
      cart_count: lines.sum { |l| l[:quantity] }
    }
  end

  def item_detail
    item = find_menu_item(params[:id])
    return redirect_to("/order") unless item

    render inertia: "orders/ItemDetail", props: { item: item.as_customer_json(image_variant: :detail) }
  end

  def cart_review
    lines = cart_lines
    render inertia: "orders/CartReview", props: {
      table_number: table_number,
      order_type: order_type,
      # takeout の checkout は LIFF アクセストークンを同送するため LIFF ID を渡す（ADR-0008）
      liff_id: ENV["LINE_LIFF_ID"],
      cart_items: lines,
      totals: cart_totals(lines)
    }
  end

  def add_to_cart
    item = find_menu_item(params[:item_id])
    return redirect_to("/order") unless item

    add_to_cart!(
      item_id: item.id,
      size_id: params[:size_id],
      addon_ids: Array(params[:addon_ids]),
      quantity: params[:quantity].to_i.clamp(1, item.max_quantity)
    )
    redirect_to "/order"
  end

  def update_cart_item
    update_cart_quantity(params[:line_id], params[:quantity].to_i)
    redirect_to "/order/cart"
  end

  def remove_cart_item
    remove_cart_line(params[:line_id])
    redirect_to "/order/cart"
  end

  # Checkout = `OrderPlaced` 書き込み境界（ADR-0007）。Cart の Line をここで
  # 永続 Order / OrderItem に書き出す。客が完了画面に到達しなくても注文は残り、
  # キッチンキューに現れる。order_number は採番＋INSERT を同一トランザクションに
  # 包み、当日キーの advisory lock で直列化する（Order.next_order_number 参照）。
  def checkout
    lines = cart_lines
    return redirect_to("/order/cart") if lines.empty?
    # In-store はテーブル番号未確定なら入口へ（numericality 例外の手前で握る保険。イシュー #41）
    return redirect_to(root_path) if order_type == "in_store" && table_number.blank?

    totals = cart_totals(lines)
    order = Order.transaction do
      new_order = Order.create!(
        order_number: Order.next_order_number,
        order_type:   order_type,
        table_number: table_number,
        # takeout の持ち主識別（ADR-0008）。ゲート済みなので current_line_account は必ずいる
        line_account: order_type == "takeout" ? current_line_account : nil,
        subtotal:     totals[:subtotal],
        tax:          totals[:tax],
        total:        totals[:total],
        placed_at:    Time.current
      )
      lines.each do |line|
        new_order.order_items.create!(
          menu_item_id: line[:item_id],
          name:         line[:name],
          size_id:      line[:size_id],
          size_label:   line[:size_label],
          addons:       line[:addons],
          unit_price:   line[:unit_price],
          quantity:     line[:quantity],
          line_total:   line[:line_total]
        )
      end
      new_order
    end

    attach_service_notification_token(order)
    clear_cart
    redirect_to "/order/complete/#{order.id}"
  end

  # 完了画面は永続 Order を :id で読むだけ（副作用なし）。再表示可能。
  # takeout は本人（LineAccount）しか見えない（#29 の Takeout 側を解消。ADR-0008）。
  # 備忘録（ADR-0007 / イシュー #29）: in_store は :id 連番で列挙可能なまま（残存負債）。
  def order_complete
    order = Order.includes(:order_items).find_by(id: params[:id])
    return redirect_to("/order") unless order
    return redirect_to("/order") if order.takeout? && order.line_account_id != current_line_account&.id

    render inertia: "orders/OrderComplete", props: { order: serialize_placed_order(order) }
  end

  # 注文履歴（ADR-0008）: 現在進行中＋過去を兼ねる本人限定の一覧。
  # ページロード時スナップショット（polling なし）。状態の表示文言はフロントの
  # orderStatus.ts 正準コピーが status キーから引く（第3の表記揺れを作らない）。
  def history
    orders = current_line_account.orders.includes(:order_items).order(placed_at: :desc)
    render inertia: "orders/History", props: {
      display_name: current_line_account.display_name,
      orders: orders.map { |order| serialize_history_order(order) }
    }
  end

  private

  # サービス通知トークンは Checkout（ユーザー操作）時にしか発行できない（ADR-0008）。
  # 発行失敗は注文を止めない — OrderReady の通知なしで続行し、ログだけ残す。
  def attach_service_notification_token(order)
    return unless order.takeout?

    token = LineServiceMessenger.issue_token(params[:liff_access_token])
    order.update!(service_notification_token: token) if token.present?
  rescue StandardError => e
    Rails.logger.error("サービス通知トークンの発行に失敗 (order=#{order.id}): #{e.class}: #{e.message}")
  end

  def serialize_history_order(order)
    {
      id:           order.id,
      order_number: order.display_number,
      status:       order.status,
      # 打ち切り済み（ADR-0010）。客向け表示は理由を問わず「キャンセル」バッジ1種のため
      # closure_reason は送らない（walkout は In-store 限定で履歴に現れ得ない）。
      closed:       order.closed?,
      placed_at:    order.placed_at.iso8601,
      total:        order.total,
      item_count:   order.order_items.sum(&:quantity),
      items: order.order_items.map do |item|
        {
          id:            item.id,
          name:          item.name,
          quantity:      item.quantity,
          customization: order_item_customization(item),
          line_total:    item.line_total
        }
      end
    }
  end

  def serialize_placed_order(order)
    {
      id:           order.id,
      order_number: order.display_number,
      table_number: order.table_number,
      order_type:   order.order_type,
      placed_at:    order.placed_at.iso8601,
      items: order.order_items.map do |item|
        {
          id:            item.id,
          name:          item.name,
          size_label:    item.size_label,
          addons:        item.addons,
          customization: order_item_customization(item),
          unit_price:    item.unit_price,
          quantity:      item.quantity,
          line_total:    item.line_total
        }
      end,
      totals: {
        subtotal:   order.subtotal,
        tax:        order.tax,
        total:      order.total,
        item_count: order.order_items.sum(&:quantity)
      }
    }
  end

  # 永続 OrderItem の size_label + addon ラベルを " · " 連結（CartSession と対称）。
  def order_item_customization(item)
    parts = []
    parts << item.size_label if item.size_label.present?
    labels = Array(item.addons).filter_map { |a| a["label"] || a[:label] }
    parts << labels.join(", ") if labels.any?
    parts.join(" · ")
  end

  def order_type
    if params[:order_type].present? && Order.order_types.key?(params[:order_type])
      session[:order_type] = params[:order_type]
    end
    session[:order_type] || "in_store"
  end

  # In-store の所在を示す正の整数ラベル（CONTEXT.md: Table number / イシュー #41）。
  # 正の整数のときだけ session に焼き、不正値（空・0・負）では session を汚さない。
  # 未確定なら nil を返し、home / checkout のガードが入口へ退避させる。
  def table_number
    if params[:table_number].present?
      n = params[:table_number].to_i
      session[:table_number] = n if n.positive?
    end
    return nil if order_type == "takeout"
    session[:table_number]
  end
end
