# OrderReady イベントの購読者: Takeout の LineAccount への LINE サービスメッセージ
# 「お作りできました」（ADR-0008 / CONTEXT.md: OrderReady）。今日の購読者はこれだけ。
# 通知はベストエフォート — 送信失敗でキッチンのステータス遷移を失敗させない。
# 送信後に API が返す更新後トークンを保存する（将来拡張用。再送は通常フローでは起きない）。
class OrderReadyNotifier
  def self.call(order)
    return unless order.takeout?
    return if order.service_notification_token.blank?

    # テンプレート（order_remind_s_o_ja）の変数: number = 本文中の「注文番号 ${number}」、
    # btn1_url = 「詳細はこちら」ボタンの飛び先。ボタンは1つ以上必須（buttonItems 1..4）なので、
    # ミニアプリの LIFF URL を渡してテイクアウト画面（履歴導線あり）へ誘導する。
    params = { number: order.display_number }
    params[:btn1_url] = "https://liff.line.me/#{ENV['LINE_LIFF_ID']}" if ENV["LINE_LIFF_ID"].present?
    updated_token = LineServiceMessenger.send_ready_message(order.service_notification_token, params)
    order.update!(service_notification_token: updated_token) if updated_token.present?
  rescue StandardError => e
    Rails.logger.error("OrderReady 通知の送信に失敗 (order=#{order.id}): #{e.class}: #{e.message}")
  end
end
