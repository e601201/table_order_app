require "test_helper"

# テイクアウト面の LINE ログインゲート（ADR-0008）。takeout モードの全アクションを
# require_line_login! で守る。order_type の判定は既存ヘルパーと同じく params 優先 —
# session のみ参照すると、セッション未確立の初回 GET /order?order_type=takeout が
# 未ログインのまま takeout メニューを描画してすり抜けるため。
# In-store（客席タブレット）は従来どおり完全未認証で無風であること（回帰）。
class OrdersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @item = menu_items(:classic_burger)
  end

  # --- 未ログイン takeout はログイン誘導へ ---

  test "未ログインの初回 GET /order?order_type=takeout はログイン誘導へ（params 優先判定）" do
    get "/order", params: { order_type: "takeout" }

    assert_redirected_to line_login_path
  end

  test "セッションが takeout のままの GET /order もログイン誘導へ" do
    get "/order", params: { order_type: "takeout" } # session に takeout が焼かれる

    get "/order"
    assert_redirected_to line_login_path
  end

  test "未ログイン takeout は商品詳細・カート閲覧もログイン誘導へ" do
    get "/order", params: { order_type: "takeout" }

    get "/order/item/#{@item.id}"
    assert_redirected_to line_login_path

    get "/order/cart"
    assert_redirected_to line_login_path
  end

  test "未ログイン takeout はカート操作・checkout もログイン誘導へ" do
    get "/order", params: { order_type: "takeout" }

    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    assert_redirected_to line_login_path

    assert_no_difference "Order.count" do
      post "/order/checkout"
    end
    assert_redirected_to line_login_path
  end

  test "未ログイン takeout はカート明細の数量変更・削除もログイン誘導へ" do
    # ゲートは明細の解決より先に効くため、line_id は実在しなくてよい
    get "/order", params: { order_type: "takeout" }

    patch "/order/cart/abc123", params: { quantity: 2 }
    assert_redirected_to line_login_path

    delete "/order/cart/abc123"
    assert_redirected_to line_login_path
  end

  # --- ログイン済み takeout は通れる ---

  test "LINE ログイン済みなら takeout のメニュー閲覧ができる" do
    line_login_as(line_accounts(:taro))

    get "/order", params: { order_type: "takeout" }
    assert_response :success
    assert_inertia_component "orders/Home"
  end

  # --- In-store 無風の回帰 ---

  test "in_store は未ログインのままメニュー閲覧・カート閲覧できる（従来どおり）" do
    get "/order", params: { order_type: "in_store", table_number: 5 }
    assert_response :success

    get "/order/cart"
    assert_response :success
  end

  test "in_store は未ログインのままカート操作・checkout できる（従来どおり）" do
    get "/order", params: { order_type: "in_store", table_number: 5 }
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }

    assert_difference "Order.count" => 1 do
      post "/order/checkout"
    end
  end

  # --- 販売不可品はカートに入らない（ADR-0011） ---

  test "売り切れ商品はカートに追加されない" do
    get "/order", params: { order_type: "in_store", table_number: 5 }
    @item.update!(stock: 0)
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }

    get "/order/cart"
    assert_empty inertia.props[:cart_items]
  end

  test "販売停止商品はカートに追加されない" do
    get "/order", params: { order_type: "in_store", table_number: 5 }
    @item.update!(suspended: true)
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }

    get "/order/cart"
    assert_empty inertia.props[:cart_items]
  end

  # --- テーブル番号の入口指定（デモ入口で必須。イシュー #41） ---

  test "in_store は入口で渡した table_number で描画する" do
    get "/order", params: { order_type: "in_store", table_number: 7 }

    assert_response :success
    assert_inertia_component "orders/Home"
    assert_equal 7, inertia.props[:table_number]
  end

  test "in_store で table_number 未指定の /order は入口へ戻す" do
    get "/order", params: { order_type: "in_store" }

    assert_redirected_to root_path
  end

  test "in_store で不正な table_number（0）は入口へ戻し session を汚さない" do
    get "/order", params: { order_type: "in_store", table_number: 0 }
    assert_redirected_to root_path

    # 0 は session に焼かれない → 続けて番号無しで来ても未確定のまま入口へ戻る
    get "/order", params: { order_type: "in_store" }
    assert_redirected_to root_path
  end

  test "in_store で table_number 未確定のまま checkout すると入口へ戻し注文を作らない" do
    # 入口を経由せず table_number を確定させないままカートだけ積む
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }

    assert_no_difference "Order.count" do
      post "/order/checkout"
    end
    assert_redirected_to root_path
  end

  # --- サービス通知トークンの発行（Checkout 時。ADR-0008） ---

  test "takeout の checkout はサービス通知トークンを発行して Order に保存する" do
    takeout_cart_for(line_accounts(:taro))

    LineServiceMessenger.stub(:issue_token, "notif-token-123") do
      post "/order/checkout", params: { liff_access_token: "liff-at" }
    end

    assert_equal "notif-token-123", Order.last.service_notification_token
  end

  test "サービス通知トークンの発行失敗は注文を止めない（通知なしで続行）" do
    takeout_cart_for(line_accounts(:taro))

    raiser = ->(_liff_access_token) { raise "LINE API down" }
    assert_difference "Order.count" => 1 do
      LineServiceMessenger.stub(:issue_token, raiser) do
        post "/order/checkout", params: { liff_access_token: "liff-at" }
      end
    end

    order = Order.last
    assert_nil order.service_notification_token
    assert_redirected_to "/order/complete/#{order.id}"
  end

  test "in_store の checkout はサービス通知トークン発行を呼ばない" do
    get "/order", params: { order_type: "in_store", table_number: 5 }
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }

    called = false
    LineServiceMessenger.stub(:issue_token, ->(_t) { called = true }) do
      post "/order/checkout"
    end

    assert_not called
    assert_nil Order.last.service_notification_token
  end

  # --- 完了画面の所有ガード（#29 の Takeout 側解消） ---

  test "takeout 注文の完了画面は本人だけが見える" do
    order = create_takeout_order(line_accounts(:taro), number: "#O-1")
    line_login_as(line_accounts(:taro))

    get "/order/complete/#{order.id}"
    assert_response :success
    assert_inertia_component "orders/OrderComplete"
  end

  test "他人の takeout 注文の完了画面は /order へ退避する" do
    order = create_takeout_order(line_accounts(:taro), number: "#O-2")
    line_login_as(line_accounts(:hanako))

    get "/order/complete/#{order.id}"
    assert_redirected_to "/order"
  end

  test "未ログインでは takeout 注文の完了画面は見えない" do
    order = create_takeout_order(line_accounts(:taro), number: "#O-3")

    # in_store セッションのためゲートには掛からないが、所有チェックで /order へ退避する
    get "/order/complete/#{order.id}"
    assert_redirected_to "/order"
  end

  # --- 注文履歴（本人限定。現在進行中＋過去のスナップショット） ---

  test "未ログインの /order/history はログイン誘導へ" do
    get "/order/history"
    assert_redirected_to line_login_path
  end

  test "履歴は自分の注文だけを新しい順に返す" do
    taro = line_accounts(:taro)
    old_order = create_takeout_order(taro, number: "#H-1", placed_at: 2.days.ago)
    new_order = create_takeout_order(taro, number: "#H-2", placed_at: 1.hour.ago, status: :in_progress)
    create_takeout_order(line_accounts(:hanako), number: "#H-3") # 他人の注文は含まれない

    line_login_as(taro)
    get "/order/history"

    assert_response :success
    assert_inertia_component "orders/History"
    assert_equal [ new_order.id, old_order.id ], inertia.props[:orders].map { |o| o[:id] }
  end

  test "履歴では打ち切られた注文に closed が立つ（表示はフロントの「キャンセル」バッジ）" do
    taro = line_accounts(:taro)
    closed_order = create_takeout_order(taro, number: "#H-5", status: :ready)
    closed_order.update!(closed_at: Time.current, closure_reason: :no_show)
    open_order = create_takeout_order(taro, number: "#H-6", status: :ready)

    line_login_as(taro)
    get "/order/history"

    rows = inertia.props[:orders].index_by { |o| o[:id] }
    assert rows[closed_order.id][:closed]
    assert_not rows[open_order.id][:closed]
  end

  test "履歴の各注文は kitchen progress の現在状態と明細・合計を持つ" do
    order = create_takeout_order(line_accounts(:taro), number: "#H-4", status: :ready)
    line_login_as(line_accounts(:taro))

    get "/order/history"

    row = inertia.props[:orders].find { |o| o[:id] == order.id }
    assert_equal "ready", row[:status]
    assert_equal order.display_number, row[:order_number]
    assert_equal 1, row[:items].length
    assert_equal order.total, row[:total]
  end

  # --- 注文状況（In-store・session 紐付け・調理軸のみ。ADR-0012） ---

  test "in_store の checkout 後 /order/status はその注文を出す" do
    get "/order", params: { order_type: "in_store", table_number: 5 }
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    post "/order/checkout"
    order = Order.last

    get "/order/status"
    assert_response :success
    assert_inertia_component "orders/Status"
    assert_equal [ order.id ], inertia.props[:orders].map { |o| o[:id] }
  end

  test "/order/status は自 session が出した注文だけを出す（他 session の注文は出さない）" do
    # 別 session の in_store 注文（DB には在るが自分のリストには無い）
    stranger = Order.create!(
      order_number: "20991231-001", order_type: :in_store, table_number: 9,
      status: :pending, subtotal: 1000, tax: 100, total: 1100, placed_at: Time.current
    )

    get "/order", params: { order_type: "in_store", table_number: 5 }

    # まだ注文していない → 空
    get "/order/status"
    assert_empty inertia.props[:orders]

    # 自分が1件 checkout → 自分のだけが出る（stranger は出ない）
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    post "/order/checkout"
    mine = Order.last

    get "/order/status"
    ids = inertia.props[:orders].map { |o| o[:id] }
    assert_equal [ mine.id ], ids
    assert_not_includes ids, stranger.id
  end

  test "/order/status は複数ラウンドをラウンド順（古い順）で出す" do
    get "/order", params: { order_type: "in_store", table_number: 5 }

    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    travel_to Time.current do
      post "/order/checkout"
    end
    first = Order.last

    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    travel_to 1.minute.from_now do
      post "/order/checkout"
    end
    second = Order.last

    get "/order/status"
    assert_equal [ first.id, second.id ], inertia.props[:orders].map { |o| o[:id] }
  end

  test "/order/status は提供前クローズを unavailable に畳み、walkout は提供済みのまま出す" do
    get "/order", params: { order_type: "in_store", table_number: 5 }

    # 提供前クローズ（品切れ）: pending のまま打ち切り → unavailable
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    post "/order/checkout"
    out_of_stock = Order.last
    out_of_stock.update!(closed_at: Time.current, closure_reason: :out_of_stock)

    # walkout: 提供済み + 打ち切り → 調理軸は served のまま、unavailable ではない
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    post "/order/checkout"
    walkout = Order.last
    walkout.update!(status: :served, closed_at: Time.current, closure_reason: :walkout)

    get "/order/status"
    rows = inertia.props[:orders].index_by { |o| o[:id] }

    assert rows[out_of_stock.id][:unavailable], "提供前クローズは unavailable: true"
    assert_not rows[walkout.id][:unavailable], "walkout は unavailable: false（提供済みは真実）"
    assert_equal "served", rows[walkout.id][:status]
  end

  test "/order/status の行は会計軸キーを一切含まない（CONTEXT.md / ADR-0012 の不変条件）" do
    get "/order", params: { order_type: "in_store", table_number: 5 }
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    post "/order/checkout"
    # walkout に打ち切っても、客向けには会計軸（Closed / 理由）を一切出さない
    Order.last.update!(status: :served, closed_at: Time.current, closure_reason: :walkout)

    get "/order/status"
    row = inertia.props[:orders].first
    %i[paid closed payment_status closure_reason paid_at closed_at].each do |key|
      assert_not row.key?(key), "会計軸キー #{key} を漏らしている"
    end
  end

  test "/order/status は本日の注文だけを出す（session に残る昨日の注文は出さない）" do
    get "/order", params: { order_type: "in_store", table_number: 5 }

    # 昨日 checkout（id は session に残るが本日スコープ外）
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    travel_to 1.day.ago do
      post "/order/checkout"
    end
    yesterday = Order.last

    # 本日 checkout
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    post "/order/checkout"
    today = Order.last

    get "/order/status"
    ids = inertia.props[:orders].map { |o| o[:id] }
    assert_includes ids, today.id
    assert_not_includes ids, yesterday.id
  end

  test "新セッション入場（welcome 経由）で前の客の注文状況が消える" do
    get "/order", params: { order_type: "in_store", table_number: 5 }
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    post "/order/checkout"

    get "/order/status"
    assert_equal 1, inertia.props[:orders].length

    # 次の客が welcome 入口から再入場（order_type param 付き）→ placed-order がクリアされる
    get "/order", params: { order_type: "in_store", table_number: 8 }
    get "/order/status"
    assert_empty inertia.props[:orders]
  end

  test "takeout セッションの /order/status は注文履歴へ誘導する（注文状況は In-store 限定。ADR-0012）" do
    line_login_as(line_accounts(:taro))
    get "/order", params: { order_type: "takeout" } # session を takeout に焼く

    get "/order/status"
    assert_redirected_to "/order/history"
  end

  test "/order/status の各注文は表示用の order_number と明細を持つ" do
    get "/order", params: { order_type: "in_store", table_number: 5 }
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 2 }
    post "/order/checkout"
    order = Order.last

    get "/order/status"
    row = inertia.props[:orders].first
    assert_equal order.display_number, row[:order_number]
    assert_equal 2, row[:item_count]
    assert_equal 1, row[:items].length
    assert_equal @item.name, row[:items].first[:name]
    assert_equal 2, row[:items].first[:quantity]
  end

  # --- 来店境界: 会計は来店を終える（ADR-0013 / イシュー #55） ---

  test "全注文が会計済みになると注文状況は空になる（会計は来店を終える。ADR-0013）" do
    get "/order", params: { order_type: "in_store", table_number: 5 }
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    post "/order/checkout"
    order = Order.last

    # レジが会計を終える（Settlement）→ この来店の全注文が payment 終端かつ ≥1 Paid
    order.update!(status: :served, paid_at: Time.current)

    get "/order/status"
    assert_empty inertia.props[:orders]
  end

  test "打ち切りだけでは来店は終わらない（「ご用意できませんでした」は消えない。ADR-0013）" do
    get "/order", params: { order_type: "in_store", table_number: 5 }
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    post "/order/checkout"
    order = Order.last

    # 唯一の注文が品切れで打ち切られた — 客はまだ席にいて代替注文をするはず。
    # 全終端だが Paid が1件もない → 来店は終わらず、中立文言の行は残り続ける。
    order.update!(closed_at: Time.current, closure_reason: :out_of_stock)

    get "/order/status"
    rows = inertia.props[:orders]
    assert_equal [ order.id ], rows.map { |o| o[:id] }
    assert rows.first[:unavailable]
  end

  test "未会計の注文が1件でも残る間は来店は終わらない（部分会計では消えない）" do
    get "/order", params: { order_type: "in_store", table_number: 5 }
    2.times do
      post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
      post "/order/checkout"
    end
    settled, still_eating = Order.order(:id).last(2)
    settled.update!(status: :served, paid_at: Time.current)

    get "/order/status"
    assert_equal [ settled.id, still_eating.id ], inertia.props[:orders].map { |o| o[:id] }
  end

  test "Paid と Closed の混在でも全終端なら来店は終わる（何かしら払って退店）" do
    get "/order", params: { order_type: "in_store", table_number: 5 }
    2.times do
      post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
      post "/order/checkout"
    end
    settled, withdrawn = Order.order(:id).last(2)
    settled.update!(status: :served, paid_at: Time.current)
    withdrawn.update!(closed_at: Time.current, closure_reason: :customer_request)

    get "/order/status"
    assert_empty inertia.props[:orders]
  end

  test "会計終端で前客のカート残骸も消え、table_number は残る（次客は Welcome 不要。ADR-0013）" do
    get "/order", params: { order_type: "in_store", table_number: 5 }
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    post "/order/checkout"
    # 前客がカートに入れたまま Checkout しなかった残骸（幽霊注文の種）
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 2 }
    Order.last.update!(status: :served, paid_at: Time.current)

    # 次客が Welcome を経由せずメニューを開く — カートは空、テーブルはそのまま使える
    get "/order"
    assert_response :success
    assert_equal 5, inertia.props[:table_number]
    assert_equal 0, inertia.props[:cart_count]

    get "/order/status"
    assert_empty inertia.props[:orders]
  end

  test "会計終端後はカート画面を直接開いても残骸は見えない（幽霊 Checkout の遮断）" do
    get "/order", params: { order_type: "in_store", table_number: 5 }
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    post "/order/checkout"
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 2 }
    Order.last.update!(status: :served, paid_at: Time.current)

    # タブレットがカート画面に置き去り → 次客が home を経ずに直接カートを開く
    get "/order/cart"
    assert_empty inertia.props[:cart_items]
  end

  test "session に残る昨日の未終端注文は当日刈り込みで落ち、来店境界を塞がない（ADR-0013）" do
    get "/order", params: { order_type: "in_store", table_number: 5 }

    # 昨日の注文が未終端のまま滞留（walkout 未処理など）。id は session に残る
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    travel_to 1.day.ago do
      post "/order/checkout"
    end

    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
    post "/order/checkout"
    today = Order.last

    # status の読み出しが session の id 配列を当日分へ刈り込む（表示フィルタと同じ母集合）
    get "/order/status"
    assert_equal [ today.id ], inertia.props[:orders].map { |o| o[:id] }

    # 本日分が全て会計されれば、昨日の未終端 id が邪魔をせず来店は終わる
    today.update!(status: :served, paid_at: Time.current)
    get "/order/status"
    assert_empty inertia.props[:orders]
  end

  private

  # takeout モードでログイン済みのカートを用意する（checkout 系テストの前段）
  def takeout_cart_for(account)
    line_login_as(account)
    get "/order", params: { order_type: "takeout" }
    post "/order/cart", params: { item_id: @item.id, size_id: "regular", addon_ids: [], quantity: 1 }
  end

  def create_takeout_order(account, number:, placed_at: Time.current, status: :pending)
    order = Order.create!(
      order_number: number, order_type: :takeout, line_account: account,
      status: status, subtotal: 1000, tax: 100, total: 1100, placed_at: placed_at
    )
    order.order_items.create!(
      menu_item_id: @item.id, name: @item.name, quantity: 1,
      unit_price: 1000, line_total: 1000, addons: []
    )
    order
  end
end
