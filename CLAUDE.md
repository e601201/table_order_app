# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Table ordering app (POC) for restaurants — mobile-first interface for tabletop ordering. Japanese-language commit messages are the convention.

## 技術スタック

- **Backend**: Rails 8.1.3 / Ruby 4.0.1 / PostgreSQL
- **Frontend**: React 19 + TypeScript + Inertia.js (server-driven SPA)
- **Styling**: Tailwind CSS 4.2.2 via Vite plugin
- **Build**: Vite 8.0 with vite-plugin-ruby
- **Icons**: lucide-react
- **Deployment**: Kamal + Docker

## 開発コマンド

```bash
bin/dev                  # 開発サーバー一括起動（Rails + Vite + Tailwindウォッチャー）
bin/rails server         # Railsのみ起動（ポート3000）
bin/vite dev             # Viteのみ起動（ポート3036）
bin/setup                # プロジェクト初期セットアップ
npm run check            # TypeScript型チェック
bin/rails test           # テスト実行
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
  - `orders_controller.rb` — 注文系ページ（メニュー、商品詳細、カート、注文完了）
  - `kitchen_controller.rb` — キッチン向けダッシュボード
  - `cashier_controller.rb` — レジ向け画面（ダッシュボード、決済確認、決済完了）
- `app/frontend/pages/` — Reactページコンポーネント（Inertia renderと1対1で対応）
  - `orders/` — Home, ItemDetail, CartReview, OrderComplete
  - `kitchen/` — Dashboard
  - `cashier/` — Dashboard, PaymentConfirm, PaymentComplete
- `app/frontend/entrypoints/` — Viteエントリーポイント（`inertia.tsx`がReactを起動）
- `app/frontend/types/` — 共有TypeScript型定義（FlashData, SharedProps）
- `config/initializers/inertia_rails.rb` — Inertia設定

### ルーティング
```
GET /                        → welcome#index             (ウェルカムページ)
GET /order                   → orders#home               (メニュー一覧)
GET /order/item/:id          → orders#item_detail        (商品詳細)
GET /order/cart               → orders#cart_review        (カート確認)
GET /order/complete           → orders#order_complete     (注文完了)
GET /kitchen                  → kitchen#dashboard         (キッチンダッシュボード)
GET /cashier                  → cashier#dashboard         (レジダッシュボード)
GET /cashier/payment          → cashier#payment_confirm   (決済確認)
GET /cashier/payment/complete → cashier#payment_complete  (決済完了)
```

### TypeScriptパスエイリアス
- `@/*` and `~/*` both resolve to `app/frontend/*`

### デザイン制約
- Mobile-first, max-width 390px
- Custom "Outfit" font (Google Fonts)
- Warm color scheme: primary red `#E53935`, accent orange `#FB8C00`, background `#FFF8F0`
- Modern browsers only (WebP, CSS nesting required)

### 画面構成（3つのロール）
- **客席タブレット（/order）** — お客様がメニュー閲覧・注文するモバイル画面
- **キッチン（/kitchen）** — 調理スタッフが注文を確認するダッシュボード
- **レジ（/cashier）** — 会計スタッフが決済処理を行う画面

### データベース
PostgreSQL. No migrations or models defined yet — currently using mock data in frontend components.

## Agent skills

### Issue tracker

GitHub Issues in `e601201/table_order_app` via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical names (`needs-triage` / `needs-info` / `ready-for-agent` / `ready-for-human` / `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
