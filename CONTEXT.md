# Table Order

A POC table-ordering system for a restaurant. Three roles share the same `Order` aggregate: the customer (places orders from a tablet at the table), the kitchen (cooks and signals readiness), and the cashier (takes payment).

## Language

An `Order` carries two independent state axes: **kitchen progress** (where the food is in the cooking flow) and **payment status** (whether money has been collected). The two are tracked separately because the responsible role and the triggering events differ. The combination `Served + Unpaid` is a meaningful and common state for an `In-store` order — it is exactly the cashier's work queue. For a `Takeout` order the handover itself happens at the register, so `Served + Unpaid` never exists: the cashier's queue holds its `Ready + Unpaid` orders instead (see `Order type`).

### Roles

Roles share the system. The **Customer** is unauthenticated and uses the public `/order` tablet surface. Everyone else is a **Staff** — an authenticated account that must log in before reaching its surface (`/kitchen`, `/cashier`, and admin screens). A Staff carries exactly one role that names its responsibility.

**Customer** (canonical Japanese: **客**):
The person assembling a `Cart` and placing an `Order`. Raises `OrderPlaced`. Does not advance kitchen progress and does not settle payment. Not a `Staff`. Whether a Customer is authenticated depends on the `Order type`: an `In-store` Customer uses the in-table tablet and never logs in; a `Takeout` Customer orders through the LINE Mini App and must be LINE-authenticated before placing an `Order`. There is only one Customer role either way — the kitchen and cashier see the same Customer regardless of authentication.
_Avoid_: Guest, diner, patron, お客様, ゲスト (acceptable as customer-facing UI copy aliases only; canonical name remains "Customer / 客"); 会員 / Member (there is no membership concept — authentication is a property of the Takeout flow, not a separate role)

**LineAccount** (canonical Japanese: **LINEアカウント**):
The persisted LINE identity a `Customer` presents when ordering `Takeout` through the LINE Mini App. Identified by the LINE user ID. A `LineAccount` is not a role and not a `Staff` — it is the durable name for "which Customer placed this Takeout Order," enabling order ownership, order history, and LINE notifications. Every `Takeout` `Order` is tied to exactly one `LineAccount`; an `In-store` `Order` never is (the in-table tablet has no identity). One `LineAccount` may own many `Order`s over time.
_Avoid_: User, Member / 会員 (no membership concept), Account alone, Customer (that is the role — a `LineAccount` is the identity a Customer authenticates with, not the person)

**Staff** (canonical Japanese: **スタッフ**):
An authenticated, persisted account for a non-customer person who logs in to operate the system. Identified by a login credential and carrying exactly one `role` (`Kitchen`, `Cashier`, or `Admin`). The role gates which surfaces the Staff may reach. A `Customer` is never a `Staff`.
_Avoid_: User (too overloaded — the Customer is also a system user), Account, Member, Employee

**Kitchen** (canonical Japanese: **キッチン**):
The role that advances kitchen progress: `Pending → In progress → Ready` for every order, and `Ready → Served` for `In-store` orders only. A `Takeout` order leaves the kitchen's hands at `Ready` — its `Served` transition is raised by the `Cashier`'s `Settlement`, because the register handover and the payment are one act. Receives `OrderPlaced`; raises `OrderServed` for `In-store` orders. Does not touch the payment axis.
_Avoid_: Chef, cook, galley, 厨房, 調理場, 調理 (the act of cooking is "preparing"; the role surface is "Kitchen / キッチン")

**Cashier** (canonical Japanese: **レジ**):
The role that ends the payment axis — and the only role that writes either of its terminals: `Unpaid → Paid` via `Settlement`, or `Unpaid → Closed` via `打ち切り` (Close). Works against the queue of `Served + Unpaid` `In-store` orders and `Ready + Unpaid` `Takeout` orders. For an `In-store` order it never touches the kitchen-progress axis; for a `Takeout` order its `Settlement` doubles as the handover, advancing `Ready → Served` and `Unpaid → Paid` in the same act. The `Kitchen` never closes an order — an out-of-stock discovery travels by voice to the register, where the Cashier closes it.
_Avoid_: Register, checkout, 会計係, 会計スタッフ, 会計 (the **role** name is "レジ"; "会計" is reserved for the act of settling — see the Flagged ambiguities)

**Admin** (canonical Japanese: **管理者**):
A `Staff` role for system administration rather than `Order` operation. Unlike `Kitchen` and `Cashier`, it advances neither order axis. Conceptually an `Admin` may manage `Staff` accounts, manage the `Menu`, and reach every staff surface. Today an `Admin` can manage `Staff` accounts, log in, and manage the `Menu` (create / edit / delete `MenuItem`s, including images) via `/admin/menu_items` (ADR-0004) — including each `MenuItem`'s availability (`Stock`, `Suspended`, and the derived `Sold out`; `Restock`), which **only** an `Admin` may change — and read-only-monitor the day's `Order`s via `/admin/orders` — viewing both state axes and totals without advancing either (ADR-0005). The order screen is a single-restaurant daily oversight view: there is no Store/Shop concept and no cancellation state (ADR-0005). An `Admin`'s home is a statistics dashboard at `/admin/dashboard` showing the day's KPIs (sales / order count / 平均注文単価, each with a day-over-day change), a 7-day sales trend, the day's top-5 popular `MenuItem`s by sold quantity, and a read-only preview of recent `Order`s that links to `/admin/orders`; navigation is delegated to the admin sidebar and the staff-surface switcher, not link cards. An admin-only switcher in each staff surface's header lets it move between `Kitchen`, `Cashier`, and the admin console (ADR-0005 update).
_Avoid_: Superuser, root, owner, オーナー, 店長

### Menu

**Menu**:
The catalog of all `MenuItem`s currently offered. It is stored in the `menu_items` table and managed by an `Admin` (ADR-0004); the customer reads it via `/order`. The kitchen does not interact with the Menu — only with the `Line`s that resulted from customer selections.
_Avoid_: Catalog (acceptable in casual conversation, but the canonical name is "Menu")

**MenuItem**:
A single entry in the `Menu` — a name, description, base price, image, and the available `Size`s and `Addon`s for that entry. Identified by an integer `id`. A `MenuItem` is a **template**; it is never what the customer "ordered" — that is a `Line`.
_Avoid_: Dish, product, "item" alone (collides with `Line`)

**Category**:
A grouping of `MenuItem`s in the `Menu`, used to organise the customer surface. Today's values: `burgers`, `sides`, `drinks`, `kids`. A `MenuItem` belongs to exactly one `Category`.
_Avoid_: Section, group, tag

**Size**:
A variant of a `MenuItem` that may change the price (e.g. レギュラー / ラージ / セット). Each `MenuItem` declares its own `Size` set. The price contribution is stored as `extra` and added on top of the `MenuItem`'s `base_price`.
_Avoid_: Variant, portion

**Addon**:
An optional extra applied to a configured `Line` (e.g. チーズ追加, パティ追加). Multiple `Addon`s may be selected per `Line`; each contributes its `extra` to the price.
_Avoid_: Topping, modifier, option (acceptable in UI copy; canonical is "Addon")

### Inventory

A `MenuItem` becomes unsellable through two independent gates: it runs **out of supply** (`Stock` reaches 0) or an `Admin` **stops selling it** (`Suspended`). Both block new sales; the customer sees a single 売り切れ badge for either. Inventory is a property of the `MenuItem` template only — it never appears on a `Line` or `Order` (those snapshot name / price / size / addons at `Checkout` and are unaffected by later stock changes).

**Stock** (canonical Japanese: **在庫**):
A `MenuItem`'s remaining sellable quantity, held as a **nullable** integer. `nil` means **untracked** — the item is effectively unlimited and never reaches `Sold out` from supply (e.g. ドリンク); a non-negative integer means **tracked** (e.g. 本日20食限定). Decremented at `Checkout` by the ordered quantity — never reserved while in a `Cart` (a `Cart` has no consequence until `Checkout`). Distinct from `max_quantity`, which caps how many of one `Line` a single `Order` may contain, not how many remain to sell.
_Avoid_: Quantity (collides with a `Line`'s quantity), 在庫数 as a field separate from 在庫, a standalone inventory entity (it is a column on `MenuItem`)

**Sold out** (canonical Japanese: **売り切れ**):
A **derived** state of a *tracked* `MenuItem`, true exactly when `Stock == 0`. Not a stored flag — it is computed from `Stock`. An *untracked* item (`Stock == nil`) is never `Sold out`. A `Sold out` `MenuItem` cannot be added to a `Cart` and is rejected at `Checkout`. Lifted only by `Restock`.
_Avoid_: 在庫切れ as a stored flag (it is derived from `Stock`); `out_of_stock` (that is a `Closed` closure reason — a per-`Order` settling outcome raised when an *already-placed* order cannot be fulfilled; `Sold out` is the *preventive* `MenuItem` state that stops new orders — the two are complementary, not the same concept); unavailable (the broader sellability concept that also covers `Suspended`)

**Suspended** (canonical Japanese: **販売停止**):
A manual boolean an `Admin` sets on a `MenuItem` to stop new sales regardless of `Stock`. Independent of `Sold out`: an item with stock remaining can be `Suspended`, and `Restock` does not lift it (only the `Admin` does). A `MenuItem` is sellable iff it is **not** `Suspended` **and** not `Sold out` (`Stock` is `nil` or `> 0`).
_Avoid_: Sold out / 売り切れ (that is the supply-driven, derived state — `Suspended` is manual and stock-independent), 取扱停止 / 一時停止 (acceptable casual aliases; canonical is 販売停止), hidden / 非表示 (a `Suspended` item is still shown to the customer, marked unsellable — it is not removed from the `Menu`), delete (physical deletion is a separate, permanent `Admin` act — ADR-0003-style hard delete)

**Restock** (canonical Japanese: **補充**):
The `Admin` act of raising a *tracked* `MenuItem`'s `Stock` back above 0, which clears the derived `Sold out` state. Operates on the supply gate only — it does not touch `Suspended`.
_Avoid_: 入荷 (acceptable casual alias), refill, replenish as a separate event (there is no `Restock` domain event — it is a plain `Admin` edit of `Stock`)

### Order

**Cart**:
The collection of `Line`s a customer is assembling but has not yet placed. Lives only on the customer's tablet session — never persisted to the database, never visible to the kitchen, never the target of any `Order*` event. A `Cart` becomes an `Order` exactly at `Checkout`, when `OrderPlaced` is raised. Until that moment, nothing the customer does has consequences outside their own screen.
_Avoid_: Draft order, pending order (clashes with the lifecycle state `Pending`), basket

**Line**:
A configured instance of a `MenuItem` — a specific `MenuItem` with a chosen `Size`, selected `Addon`s, and a quantity. The same `Line` exists first inside a `Cart` (session-only) and is persisted into the `Order` at `Checkout`; checkout does not transform it conceptually, only persists it. Unit price is `MenuItem.base_price + Size.extra + Σ Addon.extra`; line total is unit price × quantity.
_Avoid_: "Item" alone (collides with `MenuItem`), order item, cart entry, cart line (these are implementation-side names for the same `Line` at different lifecycle stages — the conceptual name is `Line`)

**Checkout** (canonical Japanese: **注文確定**):
The customer's act of finalizing their `Cart` into an `Order`. Raises `OrderPlaced` and writes the first persistent row of the Order's existence. Mirror of `Settlement` on the customer side — both are the two boundary acts that bracket an Order's lifecycle.
_Avoid_: お会計 (means Settlement, not Checkout), 注文する (too vague — used for the cumulative act of building the cart), 決定 / 確定 alone (ambiguous; always say "注文確定")

**Order**:
A customer's request consisting of one or more `Line`s, identified by an `order_number`. Created at `Checkout` from the customer's `Cart`, then progresses through the kitchen-progress axis and (separately) the payment axis.
_Avoid_: Purchase, ticket, transaction

**Order type**:
A property of `Order` that distinguishes how the food is handed over. Two values: `In-store` (customer eats at a table inside the restaurant; an `Order` must carry a `table_number` and is never tied to a `LineAccount`) and `Takeout` (customer orders through the LINE Mini App and picks up at the counter; `table_number` is absent and the `Order` must carry the placing `LineAccount`). `Order type` does not change the meaning of `Served` (in both cases it means "the customer has the food in hand") — but it does change **who raises it and when**: an `In-store` order is served at the table first and settled later (`Served → Paid`), while a `Takeout` order is handed over at the register, so the `Cashier`'s `Settlement` raises `Served` and `Paid` in the same act (`Ready → Served + Paid`; `Served + Unpaid` never exists for `Takeout`).
_Avoid_: Dine-in / dine-out (acceptable as UI copy aliases only; canonical names remain `In-store` and `Takeout`)

**Table number** (canonical Japanese: **テーブル番号**):
In-store な `Order` の所在を示す正の整数ラベル。`Table` という独立エンティティも、「有効なテーブルの母集合（1..N）」も存在しない — `Order` に焼き込まれる自由なラベルにすぎない。`In-store` の `Order` は必ず持ち（正の整数）、`Takeout` は持たない（所在の代わりに `LineAccount`）。デモのウェルカム入口でオペレーターが任意に指定する自由ラベルであり、席・卓の在庫管理や着席ワークフローを表すものではない。
_Avoid_: Table / テーブル（席や卓を表す独立モデルは存在しない）, seat, 卓番号 as an entity, テーブルの母集合 / 有効テーブル一覧（存在しない）

### Kitchen progress (axis 1)

**Pending**:
Order has been placed by the customer but the kitchen has not started cooking yet.
_Avoid_: New, open, received

**In progress**:
Kitchen has started cooking. At least one `Line` on the order is being prepared.
_Avoid_: Cooking, preparing (use these in UI copy, but the canonical state name is "in progress")

**Ready**:
Kitchen has finished cooking. The food is waiting to be handed to the customer (sitting on the pass / counter). Not yet delivered.
_Avoid_: Done, prepared, plated

**Served**:
Staff has handed the food to the customer. For an `In-store` order this happens at the table and the order then becomes eligible for payment — it is **not** "fully done", the order is still unpaid. For a `Takeout` order the handover happens at the register as part of `Settlement`, so `Served` and `Paid` arrive together (see `Order type`). Customer-facing copy splits by `Order type`: **提供済み** for `In-store`, **受取済み** for `Takeout` (the customer picked the food up at the counter). Staff surfaces use 提供済み for both.
_Avoid_: Completed, done, finished (these all wrongly imply the transaction is over); 受取済み on staff surfaces (staff vocabulary stays 提供済み regardless of `Order type`). The kitchen-axis enum is spelled `served` in code (integer value `3`).

### Payment status (axis 2)

**Unpaid**:
The order has not yet been settled at the cashier. Default for every newly placed order. An order remains `Unpaid` regardless of how far it has progressed on the kitchen axis — a `Pending + Unpaid` order is a freshly placed unstarted order, and a `Served + Unpaid` order is one waiting at the cashier. `Unpaid` ends in exactly one of two ways, both written at the register: `Paid` (via `Settlement`) or `Closed` (via `打ち切り`).
_Avoid_: Outstanding, owed, open

**Paid**:
The cashier has settled the order. Represented today by a non-null `paid_at` timestamp; an order becomes `Paid` only after it is `Served` (the cashier surface enforces this guard).
_Avoid_: Settled, closed, completed (clashes with the kitchen-axis name; never use "completed" for the payment side)

**Closed** (canonical Japanese: **打ち切り済み**):
The second terminal of the payment axis: staff has closed the order without payment. A closed order never progresses — the only way out is `Reopen` (see `Close`), which is a correction of a premature closure, not a progression: it returns the order to `Unpaid` as if the closure had not happened. `Unpaid` ends in exactly one of two ways — `Paid` (via `Settlement`) or `Closed` (via `打ち切り`). It is **one concept** regardless of why; the why is carried by a mandatory closure reason with exactly four values, each naming a distinct kind of loss: `no_show` (food was made and discarded — the `Takeout` customer never came), `out_of_stock` (the kitchen could not make it — supply failure), `customer_request` (the customer asked staff to withdraw the order, mis-taps included — there is no staff order entry in this system, so an "entry error" is always a customer request), and `walkout` (the food was served and consumed but never settled — an uncollected receivable). There is no `other` and no free-text note. Closing never touches the kitchen-progress axis — the order freezes wherever it stood, preserving true history: a no-show `Takeout` order freezes at `Ready` (the food really was made), a walkout `In-store` order freezes at `Served` (the food really was handed over and eaten), an out-of-stock closure freezes at `Pending` or `In progress` (cooking never finished). `Paid` and `Closed` are mutually exclusive; a `Paid` order can never be closed (refunds do not exist in this system). Customer-facing copy: the LINE order history shows a closed order with a single **「キャンセル」** badge regardless of reason — acceptable as a UI alias precisely because the one case where "cancel" would lie (`walkout`) is `In-store`-only, and an `In-store` customer has no history surface; the lying combination can never be displayed. Staff surfaces say 打ち切り.
_Avoid_: Cancelled / キャンセル as the canonical name (lies for the walkout case — the food was served and consumed, nothing was "called off"; permitted only as the customer-facing UI badge above), Void / ボイド (industry jargon implying the debt never existed, wrong for walkout / no-show), Completed (axis-name clash — see `Paid`)

**Settlement** (canonical Japanese: **会計**):
The act of taking a `Served + Unpaid` order to `Paid`. The canonical Japanese name is **会計**. Three Japanese words are in casual circulation around this act — they are not interchangeable here:

- **会計** — the act itself; the canonical word for business / domain conversation, role workflow, and glossary terms.
- **支払い** — reserved for **customer-facing UI copy** ("お支払い方法", "お支払いが完了しました"). It frames the same act from the customer's perspective.
- **決済** — reserved for **compound technical terms** ("クレジット決済"). Never use bare "決済" for the act itself.

_Avoid_: Bare "決済" for the act, "会計" for the role (the role is "レジ" — see Roles)

**Close** (canonical Japanese: **打ち切り**):
The `Cashier`'s act of taking an `Unpaid` order to `Closed` — ending the payment axis without money. Mirror of `Settlement`: the register writes both terminals of the payment axis, with payment (会計) or without (打ち切り). A mandatory closure reason records why. Performed only from the cashier surface; neither the `Kitchen` nor the `Customer` can close an order, and `/admin/orders` stays read-only (an `Admin` who must close an order switches to the cashier surface). The act has an inverse, **Reopen** (canonical Japanese: **打ち切り解除**), also Cashier-only: it returns a `Closed` order to `Unpaid`, and the order rejoins whatever queue its (frozen, untouched) kitchen state implies. The canonical reopen scenario: a `Takeout` order closed as `no_show`, after which the customer turns up minutes later — the closure was a premature judgment, and reopening lets the normal `Settlement` proceed.
_Avoid_: キャンセル / Cancel as the act name (see `Closed`), 取消 (same lie for the walkout case), 締め (that is end-of-day register work, not a per-order act)

### Domain events

**OrderPlaced**:
The event raised the moment a customer finishes checkout and the `Order` enters `Pending`. This is the event the kitchen is "notified" of — "キッチン通知" in the project shorthand refers to the propagation of `OrderPlaced` from the customer's tablet to the kitchen surface. The transport (websocket push, polling, manual refresh) is an implementation choice; the event is the same.
_Avoid_: "New order notification" (the noun is the event, not the notification), order-received, order-created

**OrderReady**:
The event raised when the `Order` transitions from `In progress` to `Ready` — the food is done and waiting on the pass. The event is raised for every order regardless of `Order type`, but its only subscriber today is the `Takeout` pickup call: for a `Takeout` order, `OrderReady` is propagated to the placing `LineAccount` as a LINE message ("お作りできました"), summoning the customer to the counter. For an `In-store` order nothing observes it — staff simply carries the food to the table. The `Pending → In progress` transition remains intentionally unnamed — nothing outside the kitchen observes it.
_Avoid_: "Ready notification" as the noun (the noun is the event; the LINE message is one propagation of it — see 通知 in Flagged ambiguities), order-finished, cooked

**OrderServed**:
The event raised when the `Order` transitions from `Ready` to `Served` — i.e. the food has been handed to the customer. For an `In-store` order it is raised by the `Kitchen` carrying the food to the table, and it is the signal that puts the order into the cashier's work queue. For a `Takeout` order it is raised by the `Cashier`'s own `Settlement` (handover and payment are one act), so it never enters a queue — the queue-entry signal for `Takeout` is `OrderReady`.
_Avoid_: "Order completed" (clashes with the everyday-Japanese "完了"), order-delivered (used as alias only in customer-facing copy if needed)

**OrderClosed**:
The event raised when the `Cashier` closes an `Unpaid` order (`打ち切り` — see `Close`). It carries the closure reason. **No subscriber today** — like `OrderReady` for an `In-store` order, nothing observes it; the obvious future subscriber is an out-of-stock LINE message stopping a `Takeout` customer already on their way, which can be added without touching the state machine. `Reopen` raises no event — it is a correction, and nothing observes it either.
_Avoid_: order-cancelled (see `Closed` for why "cancel" is not the canonical word), "クローズ通知" (notification is a propagation concern — see 通知 in Flagged ambiguities)

### Flagged ambiguities

**"完了" (kanjō / kanryō)** in everyday Japanese means "everything is finished." In this context the lifecycle has **two** completion points: kitchen-completion (`Served`) and payment-completion (`Paid`). Always disambiguate which one you mean. Reserve "完了" in UI copy for the post-payment state if at all; prefer "提供済み" for `Served` (受取済み when addressing the `Takeout` customer — see `Served`).

**"通知" (notification)** is reserved for *events being propagated*, not for the UI affordance that makes them visible. "キッチンに通知する" means "raise `OrderPlaced` such that the kitchen receives it"; whether that surfaces as an auto-refresh, a sound, or a manual reload is a separate UI concern.

**"客単価" vs "平均注文単価"** — "客単価" literally means spend per `Customer` (per 人), which would require knowing how many `Customer`s an `Order` represents. The system has no such identity (no `party_size` / `cover` / `customer_id`), so a true per-`Customer` average cannot be computed. The admin metric is per-`Order`, not per-person, and is named **平均注文単価** (average order value). Never call it "客単価" — that would imply the missing per-person denominator and collide with the canonical "客" (the unauthenticated `Customer`, a person, not a divisor).

**"調理時間の目安" (cook-time estimate)** — The `注文完了` (`OrderComplete`) screen is shown to the `Customer` immediately after `Checkout`. Under the canonical **後会計 (table-service) flow**, cooking begins on the kitchen axis `In progress → Ready` right after `OrderPlaced` — the kitchen picks the order up immediately, and `Settlement` happens last, after the food has been eaten. Even so, the `注文完了` screen makes **no cook-time promise**: there is no `prep_time` data on `MenuItem`, and the time to `Served` is governed by the kitchen's backlog and the table-service rounds, neither of which this screen can read. Any duration shown there would be a guess across an unbounded, unobservable gap. There is also **no customer-facing surface after payment** — the only post-payment screen, `cashier/payment_complete`, is a `Cashier` terminal the `Customer` never sees. `注文完了` is itself an instance of the `完了` overload above: it means "Checkout is done," not `Served` and not `Paid`. See ADR-0006 / ADR-0007.
_Avoid_: showing an ETA / 分数 on `注文完了`; treating `cashier/payment_complete` as a customer-facing home for a cook-time estimate.

**"本日" / 営業日 (business day)** — Many surfaces and metrics are scoped to "本日": the admin KPIs and order list, the kitchen and cashier work queues, and the customer-facing daily order sequence (the trailing `NNN`). "本日" means the **calendar day in the restaurant's local time zone — Asia/Tokyo (JST)**, i.e. 00:00–23:59 JST. The restaurant is a single Japanese location, so there is exactly one business-day boundary and it sits at **midnight JST**. There is no separate "service day" that rolls at a late-night cutoff and no multi-location / multi-time-zone concept: an `Order` placed at 00:30 JST belongs to the **new** calendar day even if the kitchen is still serving the prior evening's rush.
_Avoid_: defining "本日" by UTC or by the server's wall clock; a per-venue or per-shift business-day boundary; a cutoff hour other than midnight.

## Example dialogue

A walk-through of a typical evening flow between a developer (D) and the operations manager (M).

**D**: テーブル5の客が `/order` でクラシックバーガーをラージサイズ、チーズ追加で選んで、アイスレモンティーもミディアムで足しました。今この時点でシステム上は何が起きていますか？

**M**: その客の `Cart` に `Line` が2つ積まれている状態。1つ目は MenuItem「クラシックバーガー」+ Size `large` + Addon `cheese` の Line、2つ目は MenuItem「アイスレモンティー」+ Size `regular` の Line。まだ `Order` は存在しない。`Cart` はそのタブレットのセッションにしかなくて、誰にも見えていない。

**D**: 「注文した」というのは具体的に何が起きたとき？

**M**: 客が「注文確定」を押した瞬間。それが `Checkout`。`Cart` の `Line` がそのまま永続化されて `Order` が生まれる。同時に `OrderPlaced` が発生する。Order の初期状態は kitchen progress 軸が `Pending`、payment status 軸が `Unpaid`。

**D**: キッチンへの「通知」は別の仕組みですか？

**M**: 別じゃない。`OrderPlaced` がキッチン surface に届くこと自体が「通知」。Action Cable か polling か手動 reload かは実装の話で、ドメイン的にはどれも同じイベントの伝播。

**D**: キッチンがそのバーガーを焼き始めたら？

**M**: `Order` 全体が `In progress` に進む。`Line` 単位の進捗は今は持っていなくて、`Order` 全体が一塊で kitchen progress 軸を進む。焼き上がってカウンターに置いた段階で `Ready`。これは「完了」ではない — まだお客の手元には行っていない。

**D**: スタッフがテーブル5に運んだら？

**M**: そこで `Served` に進んで `OrderServed` が出る。これでこの Order はレジの作業対象、つまり `Served + Unpaid` キューに入る。

**D**: 客が「お会計お願いします」と言ったら？

**M**: それが `Settlement`。レジが `payment_method` を cash か credit_card で確定して、`Paid` に進める。`paid_at` が立つ。

**D**: 完了画面は `cashier/payment_complete` というページですが、これは別のエンティティですか？

**M**: いいえ。`Receipt` のような独立エンティティはなくて、あれは `Paid` な `Order` を確認画面として描画しているだけ。

**D**: UI 上は「お支払いが完了しました」と出ていますね。「お会計」とは書かないのは？

**M**: 客視点だから。同じ `Settlement` を業務側からは「会計」、客側からは「支払い」と呼び分ける。`決済` は単独では使わない — クレジット決済のような複合語の中だけ。

**D**: テイクアウトの注文だと何が違いますか？

**M**: `Order type` が `Takeout` になり、`table_number` の代わりに注文した `LineAccount` が付く。キッチンの仕事は `Ready` まで — そこで `OrderReady` が LINE で客を呼び出す。カウンターでの手渡しはレジの `会計` と同じ瞬間に起きるから、`Ready` のテイクアウト注文をレジが会計すると `Served` と `Paid` に同時に進む。`Served` の意味自体は同じ — 客の手に料理が渡った瞬間 — で、テイクアウトの客向けにはそれを「受取済み」と表示する。

**D**: 19時に「お作りできました」を送ったテイクアウトの客が、20時になっても現れません。この注文はどうなりますか？

**M**: レジがその注文を理由 `no_show` で打ち切る。payment 軸が `Closed` になって会計待ちキューから消える。kitchen 軸は `Ready` のまま凍結 — 料理が実際にできていたという歴史は消さない。客の LINE 履歴では「キャンセル」バッジになる。

**D**: その10分後に客が「渋滞で遅れました」と現れたら？

**M**: 打ち切り解除（Reopen）。`Unpaid` に戻り、kitchen 軸は `Ready` のままだから会計待ちに再出現する。あとは普通に会計すれば `Served + Paid`。打ち切りが早すぎたというだけの話で、注文を作り直したりはしない。

**D**: 食い逃げも「キャンセル」と呼びますか？

**M**: 呼ばない。あれは理由 `walkout` の打ち切り — 料理は提供済みで消費されているから、「なかったことにする」という意味のキャンセルでは言葉が嘘をつく。状態としては同じ `Closed` で、理由コードが廃棄（no_show）と未収（walkout）の損失の違いを記録する。

**D**: 「完了」という言葉は UI のどこに使えますか？

**M**: 慎重に。`Served`（kitchen の終点）と `Paid`（payment の終点）の2つの完了点があるから、無修飾の「完了」は曖昧。`Served` を指すなら「提供済み」、`Paid` を指すなら「お支払いが完了しました」のように修飾を必ず付ける。
