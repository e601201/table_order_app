# Two-axis Order state

An `Order`'s state is tracked on **two independent axes** — kitchen progress (`Pending → In progress → Ready → Served`) and payment status (`Unpaid → Paid`) — rather than as a single linear lifecycle. The two axes are advanced by different roles (Kitchen vs. Cashier) and the combination `Served + Unpaid` is a meaningful operational state (it is exactly the Cashier's work queue), so collapsing them into one lifecycle would either lose information or require contrived intermediate states.

## Considered Options

A single linear lifecycle of the form `Pending → In progress → Ready → Served → Paid` was considered. Rejected because:

1. It conflates two responsibilities (cooking and money handling), which obscures who owns each transition.
2. Every payment-side variation (refunds, voids, split bills) would need to invent new states crowding the kitchen-progress vocabulary.
3. `Served + Unpaid` becomes inexpressible — yet that is exactly the queue the Cashier surface works against today (`Order.for_cashier_today`).

## Consequences

- Code keeps `status` (kitchen progress enum) and `paid_at` (payment status timestamp) as separate columns. Don't propose collapsing them without re-reading this ADR.
- Future payment-side variants (refund, void) extend the payment axis (e.g. `Refunded`) rather than the kitchen axis.
- The `CONTEXT.md` glossary mirrors this split: `Kitchen progress (axis 1)` and `Payment status (axis 2)` are separate subsections.
