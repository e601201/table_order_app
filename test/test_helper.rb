ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"
require "inertia_rails/minitest"
require "minitest/mock"

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Add more helper methods to be used by all tests here...
  end
end

module ActionDispatch
  class IntegrationTest
    # LIFF の ID トークン検証をスタブして LINE ログインセッションを確立する
    # （ADR-0008: 自動テストは実 LINE に接続しない）。
    def line_login_as(account)
      LineIdTokenVerifier.stub(:verify, { "sub" => account.line_user_id, "name" => account.display_name }) do
        post "/order/line_login", params: { id_token: "stub-id-token" }
      end
    end
  end
end
