# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Table ordering app (POC) for restaurants — mobile-first interface for tabletop ordering. Japanese-language commit messages are the convention.

## 技術スタック

- **Backend**: Rails 8.1.3 / Ruby 4.0.4 / PostgreSQL
- **Frontend**: React 19 + TypeScript + Inertia.js (server-driven SPA)
- **Styling**: Tailwind CSS 4.3 via Vite plugin
- **Build**: Vite 8.0 with vite-plugin-ruby
- **Testing**: Minitest（Rails、`bin/rails test`）＋ Vitest（フロントの純粋ロジックを単体テスト、`app/frontend/**/*.test.ts`、`npm test`）
- **Icons**: lucide-react
- **Auth**: `has_secure_password`（Staffアカウント、bcrypt）
- **Storage**: Active Storage（MenuItem画像、`:thumb` / `:detail` variant）
- **Deployment**: Kamal + Docker

## 開発コマンド

```bash
bin/dev                  # 開発サーバー一括起動（Rails + Vite + Tailwindウォッチャー）
bin/rails server         # Railsのみ起動（ポート3000）
bin/vite dev             # Viteのみ起動（ポート3036）
bin/setup                # プロジェクト初期セットアップ
npm run check            # TypeScript型チェック
npm test                 # フロントのユニットテスト（Vitest）
bin/rails test           # Railsテスト実行（Minitest）
bin/rubocop              # Rubyリンター
bin/brakeman             # セキュリティスキャン
```

## アーキテクチャ

### Inertia.jsパターン
Rails controllers render React pages via Inertia — no REST API or separate SPA routing. Controllers pass props directly to React components:

```
Controller (render inertia: 'PageName', props: {...})
  → app/frontend/pages/PageName.tsx
```

### 主要ディレクトリ
- `app/controllers/` — Inertiaページを描画するRailsコントローラー
  - `orders_controller.rb` — 客の注文系ページ（メニュー、商品詳細、カート、注文確定、注文完了）
  - `kitchen_controller.rb` — キッチン向けダッシュボード（注文ステータス進行）
  - `cashier_controller.rb` — レジ向け画面（ダッシュボード、決済確認、決済完了）
  - `sessions_controller.rb` — スタッフのログイン／ログアウト
  - `line_sessions_controller.rb` — 客（Takeout）のLINEログイン／ログアウト（ADR-0008）
  - `welcome_controller.rb` — ウェルカム（入口）ページ
  - `admin/` — Admin専用（`dashboard` / `staffs` / `menu_items` / `orders` / `settings` / `payment_methods`）
  - `concerns/` — `menu_catalog`（メニュー取得）、`cart_session`（セッションカート）、`staff_authentication`（ログイン必須・ロール認可）、`line_authentication`（LINEログイン必須 — ADR-0008）
- `app/models/` — Active Recordモデル
  - `order.rb` / `order_item.rb` — 注文と明細（二軸状態: `status` enum ＋ `paid_at`）
  - `menu_item.rb` — DB化されたメニュー（Active Storage画像、jsonbの`sizes`/`addons`。ADR-0004）
  - `staff.rb` — スタッフ認証アカウント（`has_secure_password`、`role` enum: kitchen/cashier/admin）
  - `payment_method.rb` — 決済方法マスタ（name＋有効フラグ。Order へは FK ではなく会計時の名前スナップショット。ADR-0014）
- `app/frontend/pages/` — Reactページコンポーネント（Inertia renderと1対1で対応）
  - `orders/` — Home, ItemDetail, CartReview, OrderComplete
  - `kitchen/` — Dashboard
  - `cashier/` — Dashboard, PaymentConfirm, PaymentComplete
  - `admin/` — Dashboard, Staffs/StaffNew/StaffEdit, MenuItems/MenuItemNew/MenuItemEdit, Orders/OrderDetail, Settings
  - `Login.tsx` / `Welcome.tsx`
- `app/frontend/lib/` — 共有ロジック（`orderStatus.ts` など）
- `app/frontend/entrypoints/` — Viteエントリーポイント（`inertia.tsx`がReactを起動）
- `app/frontend/types/` — 共有TypeScript型定義（FlashData, SharedProps, MenuItem, CartLine ほか）
- `config/initializers/inertia_rails.rb` — Inertia設定

### ルーティング
```
GET    /                              → welcome#index            (ウェルカム)
GET/POST /login                       → sessions#new / #create   (スタッフログイン)
DELETE /logout                        → sessions#destroy         (ログアウト)

# 客（未認証。Takeout は入口から LINE ログイン必須 — ADR-0008）
GET/POST /order/line_login            → line_sessions#new / #create  (LINEログイン)
GET    /order                         → orders#home              (メニュー一覧)
GET    /order/item/:id                → orders#item_detail       (商品詳細)
GET    /order/cart                    → orders#cart_review       (カート確認)
POST   /order/cart                    → orders#add_to_cart
PATCH  /order/cart/:line_id           → orders#update_cart_item
DELETE /order/cart/:line_id           → orders#remove_cart_item
POST   /order/checkout                → orders#checkout          (注文確定)
GET    /order/complete/:id            → orders#order_complete    (注文完了。:id で永続Orderを読む — ADR-0007)
GET    /order/complete                → redirect → /order        (bareパスは退避)
GET    /order/history                 → orders#history           (注文履歴。LINEログイン必須・本人の注文のみ — ADR-0008)

# キッチン（要ログイン: kitchen / admin）
GET    /kitchen                       → kitchen#dashboard
PATCH  /kitchen/orders/:id            → kitchen#update_order_status

# レジ（要ログイン: cashier / admin）
GET    /cashier                       → cashier#dashboard
GET    /cashier/payment/:id           → cashier#payment_confirm
POST   /cashier/payment/:id           → cashier#process_payment
GET    /cashier/payment/:id/complete  → cashier#payment_complete
POST   /cashier/orders/:id/close      → cashier#close_order      (打ち切り — ADR-0010)
POST   /cashier/orders/:id/reopen     → cashier#reopen_order     (打ち切り解除 — ADR-0010)

# Admin（要ログイン: admin）
GET    /admin/dashboard               → admin/dashboard#index
       /admin/staffs                  → admin/staffs       (index/new/create/edit/update/destroy)
       /admin/menu_items              → admin/menu_items   (index/new/create/edit/update/destroy)
       /admin/orders                  → admin/orders       (index/show — 閲覧専用)
GET    /admin/settings                → admin/settings#index (設定 — 決済方法マスタのインライン管理。ADR-0014)
       /admin/payment_methods         → admin/payment_methods (create/update/destroy — 設定ページ内操作専用)
```

### TypeScriptパスエイリアス
- `@/*` and `~/*` both resolve to `app/frontend/*`

### デザイン制約
- Mobile-first, max-width 390px
- Custom "Outfit" font (Google Fonts)
- Warm color scheme: primary red `#E53935`, accent orange `#FB8C00`, background `#FFF8F0`
- Modern browsers only (WebP, CSS nesting required)

### 画面構成（ロールと認証境界）
- **客席タブレット（/order）** — お客様がメニュー閲覧・注文するモバイル画面。**未認証**（`Customer` はログインしない）
- **キッチン（/kitchen）** — 調理スタッフが注文ステータスを進めるダッシュボード。要ログイン（`Kitchen` / `Admin`）
- **レジ（/cashier）** — 会計スタッフが決済処理を行う画面。要ログイン（`Cashier` / `Admin`）
- **Admin（/admin）** — スタッフ管理・メニュー管理・注文の閲覧専用俯瞰（ADR-0004 / ADR-0005）。要ログイン（`Admin`）

ロールの正確な定義は `CONTEXT.md` を参照（`Customer` は未認証、`Staff` は `Kitchen` / `Cashier` / `Admin` のいずれか1つの role を持つ認証アカウント）。

### データベース
PostgreSQL with Active Record models. `Order` / `OrderItem`（注文と明細、二軸状態 = `status` enum ＋ `paid_at`）、`MenuItem`（DB化メニュー、画像は Active Storage。ADR-0004）、`Staff`（認証アカウント）、`PaymentMethod`（決済方法マスタ。ADR-0014）。`Cart` はセッションのみで永続化されず、Checkout で `Order` / `OrderItem` に永続化される。キッチン／レジ／Admin は実 `Order` 行を読む。ドメインモデルの詳細は `CONTEXT.md` と `docs/adr/` を参照。

### サーフェスごとの並行 read model（意図的な重複）
注文状況／注文履歴／キッチン／レジ／Admin の各サーフェスは、同じ `Order` を映す**独立した read model**。TypeScript 型（`StatusOrder` / `HistoryOrder` / `KitchenOrder` / `CashierOrder` / `AdminOrderRow`）とコントローラのシリアライザ（`serialize_status_order` 等）はサーフェスごとに並行定義し、**共有 base を導入しない**。「何を送らないか」がサーフェスの意味そのもの（例: 注文状況は会計軸キーを一切含めない — ADR-0012）であり、この分離は物理的に別のシリアライザ・型であることで担保されているため。コードレビューでこの並行定義を DRY 違反として指摘しない（イシュー #56 の決定）。共有してよいのはドメインと無関係な配管のみ — `@/lib` のユーティリティ、テストヘルパー、客向けページの見た目の枠。

## Agent skills

### Issue tracker

GitHub Issues in `e601201/table_order_app` via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical names (`needs-triage` / `needs-info` / `ready-for-agent` / `ready-for-human` / `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
