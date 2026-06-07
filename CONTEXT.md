# Table Order

A POC table-ordering system for a restaurant. Three roles share the same `Order` aggregate: the customer (places orders from a tablet at the table), the kitchen (cooks and signals readiness), and the cashier (takes payment).

## Language

An `Order` carries two independent state axes: **kitchen progress** (where the food is in the cooking flow) and **payment status** (whether money has been collected). The two are tracked separately because the responsible role and the triggering events differ. The combination `Served + Unpaid` is a meaningful and common state — it is exactly the cashier's work queue.

### Roles

Roles share the system. The **Customer** is unauthenticated and uses the public `/order` tablet surface. Everyone else is a **Staff** — an authenticated account that must log in before reaching its surface (`/kitchen`, `/cashier`, and admin screens). A Staff carries exactly one role that names its responsibility.

**Customer** (canonical Japanese: **客**):
The person assembling a `Cart` and placing an `Order` from the in-table tablet. Raises `OrderPlaced`. Does not advance kitchen progress and does not settle payment. Not a `Staff` and never logs in.
_Avoid_: Guest, diner, patron, お客様, ゲスト (acceptable as customer-facing UI copy aliases only; canonical name remains "Customer / 客")

**Staff** (canonical Japanese: **スタッフ**):
An authenticated, persisted account for a non-customer person who logs in to operate the system. Identified by a login credential and carrying exactly one `role` (`Kitchen`, `Cashier`, or `Admin`). The role gates which surfaces the Staff may reach. A `Customer` is never a `Staff`.
_Avoid_: User (too overloaded — the Customer is also a system user), Account, Member, Employee

**Kitchen** (canonical Japanese: **キッチン**):
The role that advances every kitchen-progress transition: `Pending → In progress → Ready → Served`. Receives `OrderPlaced` and raises `OrderServed`. Does not touch the payment axis.
_Avoid_: Chef, cook, galley, 厨房, 調理場, 調理 (the act of cooking is "preparing"; the role surface is "Kitchen / キッチン")

**Cashier** (canonical Japanese: **レジ**):
The role that advances the payment axis (`Unpaid → Paid`). Works against the queue of `Served + Unpaid` orders. Does not touch the kitchen-progress axis.
_Avoid_: Register, checkout, 会計係, 会計スタッフ, 会計 (the **role** name is "レジ"; "会計" is reserved for the act of settling — see the Flagged ambiguities)

**Admin** (canonical Japanese: **管理者**):
A `Staff` role for system administration rather than `Order` operation. Unlike `Kitchen` and `Cashier`, it advances neither order axis. Conceptually an `Admin` may manage `Staff` accounts, manage the `Menu`, and reach every staff surface. Today an `Admin` can manage `Staff` accounts, log in, and manage the `Menu` (create / edit / delete `MenuItem`s, including images) via `/admin/menu_items` (ADR-0004), and read-only-monitor the day's `Order`s via `/admin/orders` — viewing both state axes and totals without advancing either (ADR-0005). The order screen is a single-restaurant daily oversight view: there is no Store/Shop concept and no cancellation state (ADR-0005). An `Admin`'s home is a statistics dashboard at `/admin/dashboard` showing the day's KPIs (sales / order count / 平均注文単価, each with a day-over-day change), a 7-day sales trend, the day's top-5 popular `MenuItem`s by sold quantity, and a read-only preview of recent `Order`s that links to `/admin/orders`; navigation is delegated to the admin sidebar and the staff-surface switcher, not link cards. An admin-only switcher in each staff surface's header lets it move between `Kitchen`, `Cashier`, and the admin console (ADR-0005 update).
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
A property of `Order` that distinguishes how the food is handed over. Two values: `In-store` (customer eats at a table inside the restaurant; an `Order` must carry a `table_number`) and `Takeout` (customer picks up at the counter; `table_number` is absent). The kitchen progress lifecycle and the payment axis are identical for both — `Order type` only affects where the food is handed over physically and the UI copy that surrounds it. It does **not** change the meaning of `Served` (in both cases, `Served` means "the customer has the food in hand") nor the order in which kitchen progress and payment proceed.
_Avoid_: Dine-in / dine-out (acceptable as UI copy aliases only; canonical names remain `In-store` and `Takeout`)

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
Staff has handed the food to the customer. At this point the order becomes eligible for payment at the cashier. This is **not** "fully done" — the order is still unpaid.
_Avoid_: Completed, done, finished (these all wrongly imply the transaction is over; in code today this state is still spelled `completed` and should be renamed)

### Payment status (axis 2)

**Unpaid**:
The order has not yet been settled at the cashier. Default for every newly placed order. An order remains `Unpaid` regardless of how far it has progressed on the kitchen axis — a `Pending + Unpaid` order is a freshly placed unstarted order, and a `Served + Unpaid` order is one waiting at the cashier.
_Avoid_: Outstanding, owed, open

**Paid**:
The cashier has settled the order. Represented today by a non-null `paid_at` timestamp; an order becomes `Paid` only after it is `Served` (the cashier surface enforces this guard).
_Avoid_: Settled, closed, completed (clashes with the kitchen-axis name; never use "completed" for the payment side)

**Settlement** (canonical Japanese: **会計**):
The act of taking a `Served + Unpaid` order to `Paid`. The canonical Japanese name is **会計**. Three Japanese words are in casual circulation around this act — they are not interchangeable here:

- **会計** — the act itself; the canonical word for business / domain conversation, role workflow, and glossary terms.
- **支払い** — reserved for **customer-facing UI copy** ("お支払い方法", "お支払いが完了しました"). It frames the same act from the customer's perspective.
- **決済** — reserved for **compound technical terms** ("クレジット決済"). Never use bare "決済" for the act itself.

_Avoid_: Bare "決済" for the act, "会計" for the role (the role is "レジ" — see Roles)

### Domain events

**OrderPlaced**:
The event raised the moment a customer finishes checkout and the `Order` enters `Pending`. This is the event the kitchen is "notified" of — "キッチン通知" in the project shorthand refers to the propagation of `OrderPlaced` from the customer's tablet to the kitchen surface. The transport (websocket push, polling, manual refresh) is an implementation choice; the event is the same.
_Avoid_: "New order notification" (the noun is the event, not the notification), order-received, order-created

**OrderServed**:
The event raised when the `Order` transitions from `Ready` to `Served` — i.e. the food has been handed to the customer. This is the signal that makes the order eligible for the cashier; the cashier surface treats `OrderServed` as the moment an order enters its work queue. Transitions inside the kitchen (`Pending → In progress → Ready`) are intentionally **not** named as events — they are private to the kitchen surface today.
_Avoid_: "Order completed" (clashes with the everyday-Japanese "完了"), order-delivered (used as alias only in customer-facing copy if needed)

### Flagged ambiguities

**"完了" (kanjō / kanryō)** in everyday Japanese means "everything is finished." In this context the lifecycle has **two** completion points: kitchen-completion (`Served`) and payment-completion (`Paid`). Always disambiguate which one you mean. Reserve "完了" in UI copy for the post-payment state if at all; prefer "提供済み" for `Served`.

**"通知" (notification)** is reserved for *events being propagated*, not for the UI affordance that makes them visible. "キッチンに通知する" means "raise `OrderPlaced` such that the kitchen receives it"; whether that surfaces as an auto-refresh, a sound, or a manual reload is a separate UI concern.

**"客単価" vs "平均注文単価"** — "客単価" literally means spend per `Customer` (per 人), which would require knowing how many `Customer`s an `Order` represents. The system has no such identity (no `party_size` / `cover` / `customer_id`), so a true per-`Customer` average cannot be computed. The admin metric is per-`Order`, not per-person, and is named **平均注文単価** (average order value). Never call it "客単価" — that would imply the missing per-person denominator and collide with the canonical "客" (the unauthenticated `Customer`, a person, not a divisor).

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

**M**: `Order type` が `Takeout` で `table_number` がないだけ。kitchen progress 軸も payment status 軸も `In-store` と完全に同じ。`Served` の意味も同じ — カウンターで客の手に料理が渡った瞬間。

**D**: 「完了」という言葉は UI のどこに使えますか？

**M**: 慎重に。`Served`（kitchen の終点）と `Paid`（payment の終点）の2つの完了点があるから、無修飾の「完了」は曖昧。`Served` を指すなら「提供済み」、`Paid` を指すなら「お支払いが完了しました」のように修飾を必ず付ける。
