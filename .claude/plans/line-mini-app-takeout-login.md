# テイクアウトの LINE ミニアプリログイン必須化 実装計画

## Context

テイクアウト（モバイルオーダー）を LINE ミニアプリに載せ、**テイクアウトに限り LINE 認証を必須**にする。テーブルオーダー（In-store / 客席タブレット）は従来どおり未認証のまま、コード上も無風であること。

グリルセッションで確定した決定事項（詳細は ADR-0008 と CONTEXT.md）:

1. `Customer` は1ロールのまま。認証の有無は `Order type` に従属（In-store = 未認証、Takeout = LINE 認証必須）。会員概念は作らない
2. 新エンティティ **`LineAccount`**（LINEアカウント）を永続化。Takeout `Order` は必ず1つの `LineAccount` を持ち、In-store は決して持たない
3. **`OrderReady`** イベントを公開イベントに昇格。購読者は「Takeout → `LineAccount` への LINE サービスメッセージ」のみ
4. スコープ = 持ち主識別（#29 の Takeout 側）+ Ready 通知 + 注文履歴閲覧。**リピート注文・事前オンライン決済はスコープ外**（会計は店頭で Served → Paid のまま）
5. 履歴画面は「現在進行中＋過去」を兼ねる一覧。ページロード時スナップショット（リアルタイム更新なし）
6. 既存 `/order` 4ページを LIFF WebView 内で再利用。Welcome のテイクアウトリンクは廃止
7. テイクアウト面は入口から全面ログイン必須（サーバー側強制）
8. プラットフォームは**認証済み LINE ミニアプリ + サービスメッセージ**。Checkout 時にサービス通知トークンを取得して `Order` に保存、Ready で「お作りできました」を1通のみ送信
9. 既存 takeout データはリセット容認。バリデーションは新ルールで一本化
10. 開発中から実 LIFF 接続（自動テストのみスタブ）

## 事前準備（コード外・要ユーザー作業）

- LINE Developers でミニアプリチャネル作成、**認証済みミニアプリの審査申請**（リードタイムあり）
- サービスメッセージのテンプレート登録（チャネルごと20個まで。「お作りできました」相当の1つでよい）
- LIFF エンドポイント URL の設定（開発中は実機到達可能な HTTPS が必要）
- 環境変数: チャネル ID / チャネルシークレット / LIFF ID（`credentials` か `.env` 系に）

## DB・モデル

### 1. `line_accounts` テーブル（新規）

- `line_user_id`（string, null: false, unique index）— LINE の userId
- `display_name`（string）— LINE プロフィール表示名
- モデル `LineAccount`: `has_many :orders`

### 2. `orders` への列追加

- `line_account_id`（FK, nullable）
- `service_notification_token`（string, nullable）— Checkout 時に取得したサービス通知トークン
- バリデーション（既存の `table_number` 相互排他と同じ形）:
  - `takeout` → `line_account` 必須
  - `in_store` → `line_account` 不在
- 既存 takeout 行はリセット前提（seeds 作り直し）。マイグレーションに後方互換の条件分岐は入れない

## 認証（客側）

### 3. LINE ログインの concern + セッション

- `app/controllers/concerns/line_authentication.rb`（新規）: `current_line_account` / `require_line_login!`
- セッションキーは `session[:line_account_id]`（Staff の `session[:staff_id]` とは独立。スタッフ認証には一切触れない）
- ログインエンドポイント（例 `POST /order/line_login`）: LIFF が `liff.getIDToken()` で取った ID トークンを受け、LINE の検証 API（`https://api.line.me/oauth2/v2.1/verify`）でチャネル ID と照合 → `line_user_id` で `LineAccount` を find_or_create → セッション確立
- ID トークン検証はアダプタクラスに切り出し、テストではスタブ

### 4. テイクアウト面のゲート

- `orders_controller` で `session[:order_type] == "takeout"` の全アクション（home / item_detail / cart 系 / checkout / order_complete / 履歴）に `require_line_login!` を適用
- 未ログイン時は Inertia でログイン誘導ページ（LIFF 内なら `liff.login()` → ID トークン POST で即復帰）
- in_store フローは認証コードを一切通らないこと（回帰テストで担保）

### 5. フロント（LIFF SDK）

- `@line/liff` を導入。テイクアウトモードのときだけ `liff.init()` → ID トークンをサーバーへ POST
- Welcome のテイクアウトリンクを削除（テイクアウト到達は LIFF URL のみ）

## 持ち主識別・履歴

### 6. Checkout の紐づけと完了画面ガード

- Checkout 時、takeout なら `order.line_account = current_line_account` をセット
- `order_complete`（GET `/order/complete/:id`）: takeout 注文は `current_line_account` の所有チェックを追加（他人の注文なら `/order` へ）。in_store は従来どおり未ガード（#29 の In-store 側は残存負債として明記）

### 7. 注文履歴ページ（新規）

- ルート例: `GET /order/history` → `orders#history`（`require_line_login!`）
- `current_line_account.orders` を新しい順に一覧。各注文に kitchen progress の現在状態（注文受付 / 調理中 / お渡し準備完了 / 提供済み）と明細・合計を表示
- React ページ `orders/History.tsx`（モバイルファースト 390px、既存トンマナ踏襲）
- 更新はリロード時スナップショット。polling は入れない

## Ready 通知（サービスメッセージ）

### 8. 通知トークンの取得（Checkout 時）

- Checkout トランザクション成功後、LIFF アクセストークン（フロントから ID トークンと併せて送る）を使ってサービス通知トークンを発行し `order.service_notification_token` に保存
- 発行失敗は注文を止めない（通知なしで続行、ログのみ）

### 9. `OrderReady` 送信（キッチンの Ready 遷移時）

- `kitchen#update_order_status` で `In progress → Ready` に遷移したとき、takeout かつトークンありなら notifier 経由でサービスメッセージ送信（テンプレート「お作りできました。カウンターでお受け取りください」+ ミニアプリ履歴への導線）
- notifier はクラスに切り出し、テストではスタブ。**送信失敗でステータス遷移を失敗させない**（通知はベストエフォート）
- 送信は1注文1通のみ（トークン更新値の保存は不要だが、API 仕様上返ってくる更新トークンは保存しておくと後日拡張が楽）

## テスト

- モデル: `LineAccount`、`Order` の order_type × line_account 相互排他バリデーション
- コントローラ: takeout 面の未ログイン拒否 / in_store 無風の回帰 / order_complete の所有ガード / 履歴の本人限定
- 通知: Ready 遷移で notifier が呼ばれる（takeout のみ・スタブ検証）、送信失敗でも遷移成功
- ID トークン検証・サービスメッセージ送信は自動テストでは常にスタブ（実 LINE には接続しない）

## 要確認事項（着手前）

- LIFF → ミニアプリ統合の最新状況（LINE 社アナウンス）を確認し、SDK・チャネル種別の前提を最新化する
- 認証済みミニアプリ審査の所要期間とサービスメッセージテンプレート審査の有無
- サービス通知トークン発行 API の正確なリクエスト仕様（LIFF アクセストークンの受け渡し方法）

## 参照

- ADR-0008（docs/adr/0008-line-mini-app-takeout-identity.md）
- CONTEXT.md: `Customer` / `LineAccount` / `Order type` / `OrderReady`
- イシュー #29（注文 ID 列挙可能の負債 — 本対応で Takeout 側のみ解消）
- LINE Developers: サービスメッセージ仕様（トークン1年有効・最大5通・送信ごと更新）
