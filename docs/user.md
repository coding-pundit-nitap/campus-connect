# Consumer Order Management System - Comprehensive Design Document

## 1. Introduction & Project Scope

The Consumer Order Management System within Campus Connect acts as the primary interface for students and campus residents to interact with campus vendors. It provides users with the capabilities to discover products, manage their cart, select dynamic delivery logistics, process payments, and track their order status in real-time.

A core complexity of the consumer system is providing a seamless checkout experience while handling the underlying complexities of the vendor's logistical models:

1. **Scheduled Batch Runs:** Consumers can opt into grouped deliveries that leave at specific times (e.g., 5:00 PM, 10:00 PM), usually benefiting from lower delivery fees.
2. **On-Demand Direct Deliveries:** Consumers can request immediate fulfillment for a premium fee if they cannot wait for the next scheduled batch.

The goal of this system is to provide a frictionless e-commerce experience while dynamically enforcing the operating rules and timelines of individual campus shops.

---

## 2. User Interaction Flow (Life of an Order)

To understand the system, it is best to trace how a consumer conceptually navigates the purchasing lifecycle.

### Step 1: Discovery & Cart Management

- The user browses active campus shops and their associated product catalogs.
- As they add items to their cart, the system validates shop operating hours and ensures the shop is currently accepting orders.
- The system prevents cross-shop cart pollution (the user is generally constrained to checking out from one shop at a time to simplify delivery logistics).

### Step 2: Checkout & Logistics Selection

- The user proceeds to the checkout phase, where the system computes the exact basket totals.
- **Logistics Decision:** The system presents the user with a countdown to the next available Batch Run. The user must decide:
  - Wait for the next Batch Run (standard delivery fee).
  - Opt for an immediate Direct Delivery (premium delivery fee).
- If the vendor has disabled Batch Runs, the user is forced into Direct Delivery mode.
- The system aggregates the base item costs, the dynamically chosen delivery fee, and any platform fees to present a final total.

### Step 3: Payment & Address Verification

- The user inputs their highly specific campus delivery address (e.g., Hostel Block, Building, Room Number).
- They provide payment details (e.g., UPI Transaction ID) if paying online.
- Upon submission, the order is generated and locked into the system, awaiting vendor confirmation.

### Step 4: Real-time Tracking & Verification

- The user monitors their active orders via a dedicated tracking dashboard.
- The system relays the vendor's internal state machine back to the user (e.g., shifting from "Awaiting Confirmation" to "Preparing" to "Out for Delivery").
- **Secure Handover:** The system generates a unique 4-digit OTP (One-Time Password) for the user. When the delivery runner arrives, the user must provide this OTP to finalize the handover and mark the order as complete.

---

## 3. Functional Architecture

### 3.1 Cart State Management

The cart operates on a persistent data model rather than a purely volatile client-side state.

- Every cart action (adding an item, changing quantities) synchronizes with a backend Cart ID.
- This allows the server to act as the source of truth for pricing, preventing client-side manipulation of totals and dynamically enforcing the shop's "Minimum Order Value" restrictions.

### 3.2 Dynamic Fee Computation

Checkout pricing is highly dynamic and computed at runtime based on the user's logistical choices:

- `item_total`: The sum of all cart items (factoring in active discounts).
- `delivery_fee`: Applied if the user selects a Scheduled Batch Run.
- `direct_delivery_fee`: Applied if the user selects On-Demand Direct Delivery.
- `platform_fee`: A generic overhead fee (if applicable).

### 3.3 Milestone & Tracking Synchronization

The consumer tracking interface is heavily decoupled from the vendor's internal complexities. The user does not see the "Unified Prep Queue" logic; they simply see the status of their specific items.

- The interface utilizes infinite scrolling to manage extensive order histories efficiently.
- Users receive real-time updates as the delivery runner logs physical milestones (e.g., "Arrived at Block A").

---

## 4. System State Machines (Consumer Visibility)

Every individual order flows through a strict state machine, which is mapped to consumer-friendly terminology:

- `NEW` -> **Awaiting Confirmation**: The order has been sent to the shop, but the vendor has not yet accepted it.
- `BATCHED` -> **Preparing**: The vendor has accepted the order and it is currently in the kitchen.
- `RESCHEDULED` -> **Rescheduled**: The order missed its intended batch cutoff and has been securely rolled over to the next batch (or automatically upgraded to a direct delivery at no extra cost).
- `OUT_FOR_DELIVERY` -> **Out for Delivery**: The food has left the shop. The user should prepare their 4-digit OTP.
- `DELIVERY_FAILED` -> **Delivery Failed**: The runner could not deliver the order (e.g. OTP failure, customer unavailable). The vendor will likely cancel and refund the order shortly.
- `COMPLETED` -> **Delivered**: The runner has verified the OTP and the transaction is finalized.
- `CANCELLED` -> **Cancelled**: The order was terminated (e.g., vendor rejected the ticket, or a batch was mass-cancelled), and the refund process is initiated.

---

## 5. Design Decisions & Trade-Offs

### 5.1 Cart Architecture: Persistent DB Carts vs. LocalStorage

- **Decision:** The system utilizes database-backed carts (`cart_id`) rather than storing the cart entirely in the browser's `localStorage`.
- **Trade-off:**
  - _Advantage:_ Ensures perfect pricing consistency. It prevents malicious users from altering item prices in their browser before checkout, and it perfectly enforces dynamic delivery fees and shop operating constraints at the server level.
  - _Disadvantage:_ Requires network requests for every cart modification (add/remove/update), which can feel slightly slower on poor connections compared to instantaneous local state updates.

### 5.2 Delivery Selection & Resilient Rollovers

- **Decision:** The system empowers the consumer to choose between Batch or Direct delivery at checkout, but algorithmically protects them if the vendor causes a logistical delay.
- **Trade-off:**
  - _Advantage:_ If a user selects "Batch Delivery" 2 minutes before the cutoff, but the vendor delays accepting the order until _after_ the cutoff, the user is protected. The system automatically reschedules the order to the next available batch and notifies the user. If no future batch exists, the system automatically upgrades the order to a Direct Delivery while preserving the cheaper batch fee (the fee is frozen at checkout).
  - _Disadvantage:_ The consumer still experiences a time delay that they did not explicitly opt into, even if the financial and logistical fallback is seamless.

### 5.3 OTP Failure & Handover Resilience

- **Decision:** The system enforces a strict 4-digit OTP for order handover, but allows runners to mark a delivery as `DELIVERY_FAILED` if the customer cannot be reached or the OTP is incorrect.
- **Trade-off:**
  - _Advantage:_ Completely eliminates "missing order" disputes by cryptographically verifying the handover, while providing a graceful failure state if the user falls asleep or is unreachable.
  - _Disadvantage:_ Requires the vendor to manually intervene and process a refund/cancellation for failed deliveries, increasing operational overhead for the shop.

### 5.4 Order History: Infinite Scroll vs. Pagination

- **Decision:** The order history dashboard utilizes an infinite scroll architecture rather than traditional page numbers (1, 2, 3...).
- **Trade-off:**
  - _Advantage:_ Provides a significantly smoother and more modern mobile experience. Users can effortlessly scroll back through months of canteen purchases.
  - _Disadvantage:_ Deep linking to a specific past order or "page 4" is impossible, and memory consumption on the client device grows linearly the further the user scrolls.
