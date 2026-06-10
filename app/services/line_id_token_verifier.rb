require "net/http"

# LIFF の ID トークンを LINE の検証 API（https://api.line.me/oauth2/v2.1/verify）で
# チャネル ID と照合するアダプタ（ADR-0008）。自動テストでは常にスタブし、実 LINE には接続しない。
class LineIdTokenVerifier
  VERIFY_ENDPOINT = URI("https://api.line.me/oauth2/v2.1/verify").freeze

  # 検証成功でクレーム Hash（"sub" = LINE userId、"name" = 表示名）を返す。
  # 失敗（不正・期限切れ・チャネル不一致・通信エラー）は nil（呼び出し側でログイン誘導へ戻す）。
  def self.verify(id_token)
    return nil if id_token.blank?

    response = Net::HTTP.post_form(
      VERIFY_ENDPOINT,
      "id_token"  => id_token,
      "client_id" => ENV.fetch("LINE_CHANNEL_ID", nil)
    )
    unless response.is_a?(Net::HTTPSuccess)
      # 失敗理由（expired / aud 不一致 / client_id 不正など）は LINE のレスポンスに入っている
      Rails.logger.error("LINE ID トークン検証が拒否された (HTTP #{response.code}): #{response.body}")
      return nil
    end

    JSON.parse(response.body)
  rescue StandardError => e
    Rails.logger.error("LINE ID トークン検証に失敗: #{e.class}: #{e.message}")
    nil
  end
end
