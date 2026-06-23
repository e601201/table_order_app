Rails.application.routes.draw do
  # Redirect to localhost from 127.0.0.1 to use same IP address with Vite server
  constraints(host: "127.0.0.1") do
    get "(*path)", to: redirect { |params, req| "#{req.protocol}localhost:#{req.port}/#{params[:path]}" }
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # スタッフ認証（ログイン / ログアウト）
  get    "login",  to: "sessions#new",     as: :login
  post   "login",  to: "sessions#create"
  delete "logout", to: "sessions#destroy", as: :logout

  # Admin（要ログイン: admin）— ダッシュボード / Staff 管理 / Menu 管理 / 注文の閲覧専用俯瞰
  namespace :admin do
    get "dashboard", to: "dashboard#index" # 管理者コンソールの入口ハブ（導線のみ）
    resources :staffs,     except: %i[show] # 詳細ページは持たず一覧から直接 edit へ
    resources :menu_items, except: %i[show] do # 同上
      # サービス中の素早い在庫操作（補充＝絶対値 / 売切トグル）。重い編集フォームを再送しない（ADR-0011）。
      member { patch :availability }
    end
    resources :orders,     only:   %i[index show] # 閲覧専用の注文管理（ADR-0005）
  end

  # キッチン（要ログイン: kitchen / admin）
  get   "kitchen",            to: "kitchen#dashboard"
  patch "kitchen/orders/:id", to: "kitchen#update_order_status", as: :kitchen_order

  # レジ（要ログイン: cashier / admin）
  get "cashier", to: "cashier#dashboard"
  scope "cashier", as: :cashier do
    get  "payment/:id",          to: "cashier#payment_confirm",  as: :payment
    post "payment/:id",          to: "cashier#process_payment",  as: :process_payment
    get  "payment/:id/complete", to: "cashier#payment_complete", as: :payment_complete
    # 打ち切り / 打ち切り解除（ADR-0010）。payment 軸の両終端を書くのはレジだけ。
    post "orders/:id/close",  to: "cashier#close_order",  as: :order_close
    post "orders/:id/reopen", to: "cashier#reopen_order", as: :order_reopen
  end

  # 客（Takeout）の LINE ログイン（ADR-0008）。テイクアウト面は入口から全面ログイン必須。
  get  "order/line_login", to: "line_sessions#new",    as: :line_login
  post "order/line_login", to: "line_sessions#create", as: :order_line_login

  # 客（未認証）の注文系ページ
  get "order", to: "orders#home"
  scope "order", as: :order do
    get    "item/:id",      to: "orders#item_detail"
    get    "cart",          to: "orders#cart_review", as: :cart
    post   "cart",          to: "orders#add_to_cart"
    patch  "cart/:line_id", to: "orders#update_cart_item"
    delete "cart/:line_id", to: "orders#remove_cart_item"
    post   "checkout",      to: "orders#checkout", as: :checkout
    # 完了画面は永続 Order を :id で読む（ADR-0007）。bare パスは /order へ退避。
    get "complete/:id", to: "orders#order_complete", as: :complete
    get "complete",     to: redirect("/order")
    # 注文履歴（ADR-0008）。LINE ログイン必須・本人の注文だけを返す。
    get "history", to: "orders#history", as: :history
  end

  # Defines the root path route ("/")
  root "welcome#index"
end
