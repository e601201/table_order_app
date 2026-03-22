# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Table ordering app (POC) for restaurants — mobile-first interface for tabletop ordering. Japanese-language commit messages are the convention.

## 技術スタック

- **Backend**: Rails 8.1.2 / Ruby 4.0.1 / PostgreSQL
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
- `app/frontend/pages/` — Reactページコンポーネント（Inertia renderと1対1で対応）
- `app/frontend/entrypoints/` — Viteエントリーポイント（`inertia.tsx`がReactを起動）
- `app/frontend/types/` — 共有TypeScript型定義
- `config/initializers/inertia_rails.rb` — Inertia設定

### ルーティング
```
GET /               → welcome#index      (ウェルカムページ)
GET /order          → orders#home        (メニュー一覧)
GET /order/item/:id → orders#item_detail (商品詳細)
```

### TypeScriptパスエイリアス
- `@/*` and `~/*` both resolve to `app/frontend/*`

### デザイン制約
- Mobile-first, max-width 390px
- Custom "Outfit" font (Google Fonts)
- Warm color scheme: primary red `#E53935`, accent orange `#FB8C00`, background `#FFF8F0`
- Modern browsers only (WebP, CSS nesting required)

### データベース
PostgreSQL. No migrations or models defined yet — currently using mock data in frontend components.
