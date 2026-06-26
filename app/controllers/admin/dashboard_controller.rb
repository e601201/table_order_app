module Admin
  # 管理者の統計ダッシュボード（ADR-0005 更新）。本日の KPI（売上 / 注文数 / 平均注文単価＋前日比）、
  # 直近7日の売上推移、本日の人気メニュー TOP5、最近の注文プレビューを実データで描画する。
  # 集計の母集団は指標ごとに意図して異なる: 売上系は会計済み（Paid）基準、注文数・人気メニューは
  # 受注（Placed）基準。新規ルート・ページは作らず本アクションの中身のみを統計版に置換している。
  class DashboardController < ApplicationController
    include Admin::OrderRows

    before_action :require_login!
    before_action -> { authorize_roles!(:admin) }

    TREND_DAYS = 7
    POPULAR_LIMIT = 5
    RECENT_ORDERS_LIMIT = 5

    def index
      render inertia: "admin/Dashboard", props: {
        # KPI は above the fold。初期描画で即時に返す。
        kpi: kpi,
        # グラフ・ランキング・最近の注文は初期描画後に遅延ロード。
        # 同一グループ（secondary）にまとめ、1回の追従リクエストで並行取得する。
        sales_trend: InertiaRails.defer(group: "secondary") { sales_trend },
        popular_items: InertiaRails.defer(group: "secondary") { popular_items },
        recent_orders: InertiaRails.defer(group: "secondary") { recent_orders }
      }
    end

    private

    # KPI 3枚。各値と前日比%（前日の同定義の全日確定値が分母）。分母 0・paid 0件は nil で返し、
    # フロントは「—」を表示する（NaN/Infinity をテンプレートに出さないガードはここで保証）。
    def kpi
      today = Time.zone.today
      yesterday = today - 1
      today_paid = paid_scope(today)
      yesterday_paid = paid_scope(yesterday)

      today_sales = today_paid.sum(:total)
      yesterday_sales = yesterday_paid.sum(:total)
      today_orders = placed_scope(today).count
      yesterday_orders = placed_scope(yesterday).count
      today_aov = average_order_value(today_paid)
      yesterday_aov = average_order_value(yesterday_paid)

      {
        sales: { value: today_sales, change_pct: change_pct(today_sales, yesterday_sales) },
        orders: { value: today_orders, change_pct: change_pct(today_orders, yesterday_orders) },
        average_order_value: { value: today_aov, change_pct: change_pct(today_aov, yesterday_aov) }
      }
    end

    # paid 注文の total を paid_at で日割り、今日を末尾とする直近7日（実日付ラベル・単一系列）。
    # gem もチャートライブラリも使わず、Ruby 側で7日分の枠を作りゼロ埋めする。
    def sales_trend
      today = Time.zone.today
      days = ((today - (TREND_DAYS - 1))..today).to_a

      buckets = Hash.new(0)
      Order.where.not(paid_at: nil)
           .where(paid_at: days.first.beginning_of_day..today.end_of_day)
           .pluck(:paid_at, :total)
           .each { |paid_at, total| buckets[paid_at.in_time_zone.to_date] += total }

      days.map { |day| { date: day.iso8601, label: "#{day.month}/#{day.day}", amount: buckets[day] } }
    end

    # 本日 placed の全注文を母集団に order_items.name × Σquantity を降順・上位5、同数は name 昇順。
    # 需要指標なので売上の paid 基準とは別系統。集計キーはスナップショット名（結合不要）。
    def popular_items
      Order.placed_today
           .joins(:order_items)
           .group("order_items.name")
           .sum("order_items.quantity")
           .sort_by { |name, quantity| [ -quantity, name ] }
           .first(POPULAR_LIMIT)
           .map { |name, quantity| { name: name, quantity: quantity } }
    end

    # 最近の注文プレビュー（閲覧専用）。一覧と同じ行形（2バッジ用の状態を含む）を上位N件のみ。
    def recent_orders
      Order.placed_today
           .includes(:order_items)
           .order(placed_at: :desc)
           .limit(RECENT_ORDERS_LIMIT)
           .map { |order| serialize_row(order) }
    end

    def placed_scope(date)
      Order.where(placed_at: date.all_day)
    end

    def paid_scope(date)
      placed_scope(date).where.not(paid_at: nil)
    end

    # paid売上 ÷ paid注文数（円・整数丸め）。paid 0件は nil（ゼロ除算ガード）。
    def average_order_value(scope)
      count = scope.count
      return nil if count.zero?

      (scope.sum(:total).to_f / count).round
    end

    # 前日比%。今日 or 前日が未確定（nil）/ 前日が 0 のときは nil（ゼロ除算ガード）。
    def change_pct(today_value, yesterday_value)
      return nil if today_value.nil? || yesterday_value.nil? || yesterday_value.zero?

      (((today_value - yesterday_value).to_f / yesterday_value) * 100).round(1)
    end
  end
end
