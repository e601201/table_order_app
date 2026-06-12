module Admin
  # Admin の一覧・プレビューで使う注文行のシリアライズ。注文管理（OrdersController）と
  # ダッシュボード（DashboardController）の「最近の注文」が同じ行形を共有する（ADR-0005）。
  module OrderRows
    extend ActiveSupport::Concern

    private

    # 一覧行。明細は件数とサマリ文字列に集約し、ペイロードを小さく保つ。
    def serialize_row(order)
      {
        id: order.id,
        order_number: order.order_number,
        table_number: order.table_number,
        order_type: order.order_type,
        status: order.status,
        payment_status: order.payment_status,
        # 打ち切り理由（ADR-0010）。Closed 以外は nil。閲覧専用の表示にだけ使う。
        closure_reason: order.closure_reason,
        total: order.total,
        placed_at: order.placed_at.iso8601,
        item_count: order.order_items.sum(&:quantity),
        items_summary: items_summary(order.order_items)
      }
    end

    # 例: 単品 "テリヤキバーガー ×2" / 複数 "カフェラテ, チーズケーキ"。
    def items_summary(items)
      return "" if items.empty?

      if items.one?
        item = items.first
        item.quantity > 1 ? "#{item.name} ×#{item.quantity}" : item.name
      else
        items.map(&:name).join(", ")
      end
    end
  end
end
