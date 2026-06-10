# テイクアウトの手渡し＝会計 統合（受取済み） 実装計画

## Context

テイクアウトのカウンターでは手渡しと会計が同一瞬間に起きる。これを状態機械に反映し、注文履歴の終端表示を「受取済み」にする。グリルで確定した決定（詳細は ADR-0009 と CONTEXT.md）:

1. **状態遷移ごと統合**: `Ready` のテイクアウト注文をレジが会計すると、1アクション（同一トランザクション）で `Served + Paid` に同時遷移する
2. **キッチンの終点は `Ready`**: テイクアウトの `Ready → Served` はレジの会計経由のみ。`kitchen#update_order_status` でテイクアウトの `served` 指定をサーバー側で拒否し、盤面 UI でもテイクアウトカードに「提供済み」ボタンを出さない
3. **レジの前提を order type で分岐**: 会計待ちキュー = In-store `Served + Unpaid` / Takeout `Ready + Unpaid`。会計ガード = In-store `served?` / Takeout `ready?`。旧フローの `Served + Unpaid` テイクアウト行はリセット容認（救済分岐なし）
4. **「受取済み」は Takeout の客向けコピー限定**: 注文履歴の `served` 表示のみ「受取済み」。スタッフ面（キッチン/レジ/Admin）は order type を問わず「提供済み」のまま。履歴の他3状態（受付/調理中/提供待ち）も正準コピーのまま

## 変更点

### 1. モデル（Order スコープ）

- `awaiting_payment`: `served.where(paid_at: nil)` → order type 分岐に変更（In-store は `served`、Takeout は `ready`、いずれも `paid_at: nil`）
- `for_cashier_today`: 上記キュー ∪ 当日の `Paid` を返す形を維持しつつ Takeout の `Ready + Unpaid` を含める
- スコープの分岐は SQL（`where(order_type:)` の OR）で書く。アプリ側 filter にしない

### 2. レジ（cashier_controller）

- `payment_confirm` / `process_payment` のガード `unless order.served?` を order type 分岐に: In-store → `served?` / Takeout → `ready?`
- `process_payment`: Takeout の場合は `status: :served` を `paid_at` / `payment_method` と**同一 `update!`** で書く（`Served + Unpaid` の中間状態を作らない）
- 会計時に LINE 通知は送らない（`OrderReadyNotifier` はキッチン経由のみ。回帰テストで担保）

### 3. キッチン（kitchen_controller + Dashboard.tsx）

- `update_order_status`: テイクアウト注文への `status: "served"` 指定を拒否して盤面へ差し戻す（サーバー側が境界）
- `kitchen/Dashboard.tsx`: テイクアウトカードの遷移ボタンを `Ready` 止まりに（「提供済み」ボタン非表示）。`Ready` レーンのテイクアウトカードは「会計待ち（レジで受け渡し）」であることが分かる表示にする
- テイクアウトの `served` レーン入りは会計の結果としてのみ起きる（盤面には引き続き表示される — ラベルは「提供済み」のまま）

### 4. 注文履歴の表示（History.tsx + orderStatus.ts）

- `orderStatus.ts` に **Takeout 客向けの served コピー「受取済み」を1箇所だけ**定義（例: `customerKitchenStatusMeta` か served のみのオーバーライドを export）。History.tsx 内のハードコードはしない（第3の表記揺れ防止）
- `History.tsx`: served バッジを「受取済み」で表示。他3状態は `kitchenStatusMeta` のまま

### 5. テスト（Minitest）

- モデル: `awaiting_payment` / `for_cashier_today` が Takeout `Ready + Unpaid` を含み、In-store `Ready` を含まない回帰
- レジ: Takeout `Ready + Unpaid` が会計確認・会計処理を通る / 会計で `served?` かつ `paid?` になる（同時遷移）/ In-store は従来どおり `Ready` で差し戻し（回帰）/ 旧フロー相当の `Served + Unpaid` Takeout はガードを通らない
- キッチン: Takeout への `served` 指定が拒否される / In-store の `served` は従来どおり通る（回帰）/ 会計経由の遷移で `OrderReadyNotifier` が呼ばれない
- 履歴: Takeout の `served`（=会計済み）行が「受取済み」相当の status を返す（表示コピーはフロント側のため、props の status キーの検証＋tsc）

### 6. seeds

- デモ注文の整合確認: `Served + Unpaid` のテイクアウト行を作らない。レジキュー確認用に `Ready + Unpaid` のテイクアウトデモを1件追加

## 非対象

- キャンセル / no-show 対応（`Ready + Unpaid` の滞留はキャンセル概念なしのまま。ADR-0005）
- 会計時の LINE 追加通知（「お支払いありがとうございました」等は送らない）
- In-store の挙動・コピーの変更（完全無風）
- 履歴の `Ready` 表示文言の変更（「提供待ち」のまま。変えるなら別議論）

## 受け入れ基準

- レジで `Ready` のテイクアウト注文を会計すると、1アクションで `Served + Paid` になる（中間の `Served + Unpaid` を経ない）
- キッチン盤面からテイクアウトを `Served` にできない（サーバー側拒否）。In-store は従来どおり
- レジの会計待ちに Takeout `Ready + Unpaid` が並ぶ。In-store のキュー・ガードは無風
- 注文履歴でテイクアウトの終端が「受取済み」と表示される。スタッフ面は「提供済み」のまま
- `bin/rails test` / `bin/rubocop` / `npm run check` / `bin/rails db:seed` がパス

## 参照

- ADR-0009（docs/adr/0009-takeout-handover-at-settlement.md）
- CONTEXT.md: `Order type` / `Served` / `Kitchen` / `Cashier` / `OrderServed`
- ADR-0001（二軸）/ ADR-0008（LINE 基盤）/ PR #34（#33 実装 — 本変更はこの上に積む）
