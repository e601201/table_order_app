Rails.application.routes.draw do
  # Redirect to localhost from 127.0.0.1 to use same IP address with Vite server
  constraints(host: "127.0.0.1") do
    get "(*path)", to: redirect { |params, req| "#{req.protocol}localhost:#{req.port}/#{params[:path]}" }
  end
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # スタッフ認証（ログイン/ログアウト）
  get    "login",  to: "sessions#new",     as: :login
  post   "login",  to: "sessions#create"
  delete "logout", to: "sessions#destroy", as: :logout

  # 管理画面（Admin のみ）— ダッシュボード / Staff 管理 / Menu 管理（一覧・新規登録・編集・削除）
  namespace :admin do
    get "dashboard", to: "dashboard#index" # 管理者コンソールの入口ハブ（導線のみ）
    resources :staffs, only: %i[index new create edit update destroy]
    resources :menu_items, only: %i[index new create edit update destroy]
    resources :orders, only: %i[index show] # 閲覧専用の注文管理（ADR-0005）
  end

  # for POC: Kitchen dashboard
  get "kitchen", to: "kitchen#dashboard"
  patch "kitchen/orders/:id", to: "kitchen#update_order_status", as: :kitchen_order

  # for POC: Cashier dashboard
  get  "cashier",                      to: "cashier#dashboard"
  get  "cashier/payment/:id",          to: "cashier#payment_confirm",  as: :cashier_payment
  post "cashier/payment/:id",          to: "cashier#process_payment",  as: :cashier_process_payment
  get  "cashier/payment/:id/complete", to: "cashier#payment_complete", as: :cashier_payment_complete

  # 客（Takeout）の LINE ログイン（ADR-0008）。テイクアウト面は入口から全面ログイン必須。
  get  "order/line_login", to: "line_sessions#new", as: :line_login
  post "order/line_login", to: "line_sessions#create"

  # for POC: Order pages
  get "order", to: "orders#home"
  get "order/item/:id", to: "orders#item_detail"
  get "order/cart", to: "orders#cart_review"
  post "order/cart", to: "orders#add_to_cart"
  patch "order/cart/:line_id", to: "orders#update_cart_item"
  delete "order/cart/:line_id", to: "orders#remove_cart_item"
  post "order/checkout", to: "orders#checkout"
  # 完了画面は永続 Order を :id で読む（ADR-0007）。bare パスは /order へ退避。
  get "order/complete/:id", to: "orders#order_complete", as: :order_complete
  get "order/complete", to: redirect("/order")

  # Defines the root path route ("/")
  root "welcome#index"
end
