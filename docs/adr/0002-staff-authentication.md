---
status: accepted
---

# Staff 認証と Customer 非認証の境界

`/kitchen` と `/cashier`、および将来の管理画面は `Staff`（認証済みアカウント）のログインを必須とする一方、`/order`（客席タブレット）は公開のまま据え置く。Customer は認証しない。理由は、店内タブレットにログインを挟むと客側の運用が破綻するためであり、保護対象は店舗オペレーション側の画面に限定される。

## Considered Options

- **全画面に認証をかける** — 却下。客にログインを強いることになり、テーブルオーダーの体験を壊す。`/order` は意図的に公開。
- **1人1ロール（`role` enum 単一カラム）+ Admin が全画面アクセス** を採用。「キッチンもレジもやる人」は Admin で吸収する。複数ロール（多対多）は POC には過剰として却下。
- **`has_secure_password`（bcrypt）手書き + Inertia の React ログインページ + 暗号化 cookie セッション** を採用。Rails 8 の `generate authentication` ジェネレータは `User` モデルと ERB ビューを生成し、本プロジェクトの `Staff` 命名・Inertia 構成と噛み合わないため不採用。Devise も POC には重すぎるため不採用。
- **初回 Admin は `db/seeds.rb` / console で投入**。公開サインアップは持たない（Staff は Admin だけが発行する）。鶏卵問題を初回起動セットアップ画面で解くより単純なため。

## Consequences

- ロールを跨いだアクセス（例: Kitchen が `/cashier`）は自ロールのホームへリダイレクト + flash で弾く。専用 403 ページは作らない。
- Menu 管理は Admin の概念上の責務であり、本 ADR 時点では未実装だった（`Menu` は静的定数のまま）。その後 ADR-0004 で DB 化し、Admin が管理画面から CRUD できるようにして解決済み。
