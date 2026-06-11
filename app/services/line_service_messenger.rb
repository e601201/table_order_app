require "net/http"

# LINE ミニアプリのサービスメッセージ API アダプタ（ADR-0008）。
# - issue_token: Checkout（ユーザー操作）時に LIFF アクセストークンからサービス通知トークンを発行
# - send_ready_message: OrderReady の「お作りできました」を1通送信し、更新後トークンを返す
# サービス通知トークンは操作1回につき発行・1年有効・最大5通・送信ごとに値が更新される。
# 自動テストでは常にスタブし、実 LINE には接続しない。
# NOTE: リクエスト仕様の細部（イシュー #33 の要確認事項）は実チャネル開通後の実機検証で確定する。
class LineServiceMessenger
  TOKEN_ENDPOINT         = URI("https://api.line.me/message/v3/notifier/token").freeze
  SEND_ENDPOINT          = URI("https://api.line.me/message/v3/notifier/send?target=service").freeze
  CHANNEL_TOKEN_ENDPOINT = URI("https://api.line.me/v2/oauth/accessToken").freeze

  # サービス通知トークンを発行する。発行できなければ nil（呼び出し側は通知なしで続行する）。
  def self.issue_token(liff_access_token)
    return nil if liff_access_token.blank?

    response = post_json(TOKEN_ENDPOINT, { liffAccessToken: liff_access_token })
    response && response["notificationToken"]
  end

  # 「お作りできました」テンプレートを1通送信し、API が返す更新後トークンを返す（将来拡張用）。
  def self.send_ready_message(notification_token, template_params = {})
    response = post_json(SEND_ENDPOINT, {
      templateName:      ENV.fetch("LINE_READY_TEMPLATE_NAME", "order_ready"),
      params:            template_params,
      notificationToken: notification_token
    })
    response && response["notificationToken"]
  end

  # チャネルアクセストークン（client_credentials）。POC のため都度発行（キャッシュしない）。
  def self.channel_access_token
    response = Net::HTTP.post_form(
      CHANNEL_TOKEN_ENDPOINT,
      "grant_type"    => "client_credentials",
      "client_id"     => ENV.fetch("LINE_CHANNEL_ID", nil),
      "client_secret" => ENV.fetch("LINE_CHANNEL_SECRET", nil)
    )
    unless response.is_a?(Net::HTTPSuccess)
      Rails.logger.error("LINE チャネルアクセストークンの発行が拒否された (HTTP #{response.code}): #{response.body}")
      return nil
    end

    JSON.parse(response.body)["access_token"]
  end

  def self.post_json(uri, payload)
    token = channel_access_token
    return nil if token.blank?

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    request = Net::HTTP::Post.new(uri.request_uri, {
      "Content-Type"  => "application/json",
      "Authorization" => "Bearer #{token}"
    })
    request.body = payload.to_json
    response = http.request(request)
    unless response.is_a?(Net::HTTPSuccess)
      # 失敗理由（未認証ミニアプリ・テンプレート未登録・トークン使用上限など）はレスポンスに入っている
      Rails.logger.error("LINE サービスメッセージ API が拒否した (#{uri.path} HTTP #{response.code}): #{response.body}")
      return nil
    end

    JSON.parse(response.body)
  end

  private_class_method :channel_access_token, :post_json
end
