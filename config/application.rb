require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module TableOrderApp
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.1

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks])

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # 単一の日本店舗。「本日」境界（placed_today / 日次採番 / 各 KPI）は JST 暦日とする。
    # DB 保存は既定どおり UTC（active_record.default_timezone = :utc）のまま。CONTEXT.md「本日 / 営業日」参照。
    config.time_zone = "Tokyo"
    # config.eager_load_paths << Rails.root.join("extras")
  end
end
