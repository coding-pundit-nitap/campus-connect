# Vendor Order Management System - Comprehensive Design Document

## 1. Introduction & Project Scope

The Vendor Order Management System within Campus Connect acts as the operational brain for individual shops on campus. It provides vendors with the capabilities to accept incoming requests, manage kitchen preparation queues, and coordinate final delivery logistics.

A core complexity of the system is that it must handle two entirely different logistical models simultaneously:

1. **Scheduled Batch Runs:** Large, grouped deliveries dispatched at specific times (e.g., 5:00 PM, 10:00 PM) to minimize rider trips and optimize kitchen throughput.
2. **On-Demand Direct Deliveries:** Standard, single-order deliveries dispatched as soon as the food is ready, often carrying a premium delivery fee.

The goal of this system is to abstract this complexity into a seamless workflow so kitchen staff and owners can focus on fulfillment rather than logistical routing.

---

## 2. User Interaction Flow (Life of an Order)

To understand the system, it is best to trace how a vendor conceptually interacts with orders as they move through the lifecycle.

### Step 1: Order Intake

- When a customer places an order, the system alerts the vendor via hardware-level audio and haptic feedback.
- The vendor reviews a unified queue of incoming tickets (both Direct and Batched).
- The vendor makes a binary decision: **Accept** (which moves it to the kitchen) or **Reject** (which instantly issues a refund).

### Step 2: Kitchen Preparation

- Once accepted, orders sit in the preparation queue.
- To prevent kitchen staff from context-switching, the system dynamically groups identical items across all active orders into a single "Prep Summary" (e.g., if 3 different orders each want 2 Samosas, the system tells the kitchen to cook "6 Samosas" simultaneously).

### Step 3: Dispatch & Routing

- **For Direct Orders:** The vendor marks the individual order as ready, instantly dispatching it out for delivery.
- **For Batch Orders:** The vendor waits for the designated cutoff time. They then "Lock" the batch (preventing new orders from entering) and "Start the Run", dispatching all orders in that batch simultaneously.

### Step 4: Final Delivery & Verification

- Once dispatched, orders are handed to the delivery runner. The system logically groups these orders by their physical destination (e.g., Hostel Block A vs. Hostel Block B) to create a delivery route.
- As the runner reaches each building, they update their milestone (e.g., "Arrived at Block A").
- To hand over the food, the runner requests a 4-digit OTP from the customer, ensuring secure and verified delivery.

---

## 3. Functional Architecture

### 3.1 Data Synchronization

The system relies on a near-real-time synchronization mechanism. It repeatedly polls the server on a strict 10-second interval to pull down a holistic snapshot of the shop's operational state. This snapshot includes active schedules, pending tickets, prepping orders, and active delivery runs.

### 3.2 The Unified Pipeline

A primary architectural pattern used in this project is the **Unified Pipeline**. Rather than treating Scheduled Batches and Direct Deliveries as two isolated systems with separate data streams, the system merges them at the beginning of the funnel and diverges them only at the point of dispatch.

- Both types of orders share the same core data model (with Batched orders securely bound to a specific `batch_run_id` at the exact moment of checkout).
- They share the same intake logic and the same kitchen aggregation logic.
- They are physically separated only when the vendor dictates that a Direct Order is leaving the kitchen immediately, whereas Batch orders remain grouped until the schedule dictates they depart.

### 3.3 Schedule Management

Vendors have absolute control over their time logic. They define explicit "Cutoff Slots".

- The system automatically calculates the next available slot and broadcasts this to the consumer-facing applications to show countdowns.
- If a vendor deletes all scheduled slots, the system automatically falls back to operating purely as an On-Demand Direct Delivery shop.
- The vendor can adjust these cutoff times on the fly (e.g., adding 15 minutes to the window if the shop is experiencing low volume).

---

## 4. System State Machines

### 4.1 Order States

Every individual order flows through a strict state machine:

- `NEW`: Ticket created, awaiting a human decision from the vendor.
- `BATCHED`: Accepted by the vendor; currently occupying the kitchen's prep queue.
- `RESCHEDULED`: The order missed its designated batch cutoff and was automatically rolled over to the next available batch (or converted to direct delivery).
- `OUT_FOR_DELIVERY`: Food has left the shop and is physically with the runner.
- `DELIVERY_FAILED`: The runner could not deliver the order (e.g. OTP failure, customer no-show), requiring vendor intervention for rejection and refund.
- `COMPLETED`: The runner has successfully verified the customer's OTP.
- `CANCELLED`: The order was terminated (e.g., vendor rejected the ticket, or mass-cancelled the batch run). The customer is automatically refunded if they paid online.

### 4.2 Batch Run States

A scheduled batch run groups multiple orders and possesses its own overarching state:

- `OPEN`: The window is active. Consumers can join this batch.
- `LOCKED`: The cutoff time was reached. The vendor has frozen the list to finalize cooking.
- `IN_TRANSIT`: The delivery runner has left the shop with all orders in this batch.
- `DELIVERED`: The run is finished; all constituent orders are either completed or resolved.

---

## 5. Design Decisions & Trade-Offs

### 5.1 Transport Layer: HTTP Polling vs. Persistent WebSockets

- **Decision:** The system synchronizes data by polling HTTP endpoints every 10 seconds rather than maintaining a live WebSocket connection.
- **Trade-off:**
  - _Advantage:_ Highly resilient in environments with poor network conditions (like deep inside campus kitchens or on cellular networks). It eliminates the complex infrastructure overhead of managing dropped sockets, reconnection logic, and state desynchronization.
  - _Disadvantage:_ Introduces up to a 10-second latency before a new order appears on the vendor's screen, and incurs higher raw bandwidth overhead.

### 5.2 Kitchen Workflow: Unified Aggregation vs. Segregated Queues

- **Decision:** The system forces direct orders and batch orders into the exact same kitchen preparation list, summarizing the total item counts mathematically.
- **Trade-off:**
  - _Advantage:_ Drastically lowers the cognitive load on kitchen staff. They do not have to check multiple systems or mentally add up requirements. They simply cook the aggregated totals.
  - _Disadvantage:_ It requires the expeditor (the person packing the bags) to pay closer attention to pull Direct items out of the unified pile. To mitigate the risk of packing errors during a rush, the UI explicitly color-codes these incoming tickets (Red badges for Direct, Amber/Emerald for Batch).

### 5.3 Data Processing: Client-Side Derivation vs. Server-Side Bucketing

- **Decision:** The server returns generic arrays of orders. The vendor's device computes the specific groupings, aggregations, and routing logic locally on the fly.
- **Trade-off:**
  - _Advantage:_ Allows the application to perform instant, optimistic updates (e.g., moving an order from "Intake" to "Prep") without waiting for a server round-trip to re-calculate the buckets. It keeps the backend queries extremely simple and fast.
  - _Disadvantage:_ Requires more processing power and memory on the vendor's device, as arrays are continuously re-mapped and filtered on every synchronization tick.

### 5.4 Secure Mass-Operations

- **Decision:** The system allows mass-cancellation of an entire active batch, but secures this behind explicit owner-level authorization checks and double-confirmation UI gates.
- **Trade-off:**
  - _Advantage:_ Allows a vendor owner to quickly recover from catastrophic scenarios (e.g., kitchen fire, sudden ingredient shortage) by terminating 50+ orders instantly and auto-refunding them.
  - _Disadvantage:_ Adding this to the interface introduces the risk of accidental mass-cancellation, mitigated heavily by UI friction (double confirmation) and strict permission guarding (regular staff cannot trigger it).

### 5.5 Transactional Safety (TOCTOU Prevention)

- **Decision:** When accepting a batch order, the system acquires a pessimistic `FOR UPDATE` lock on the batch row _before_ checking its status.
- **Trade-off:**
  - _Advantage:_ Completely eliminates Time-Of-Check to Time-Of-Use (TOCTOU) race conditions. If an order acceptance request races against a batch locking request, the database correctly sequences them, automatically rescheduling the order instead of orphaned insertion.
  - _Disadvantage:_ Minor performance overhead during order acceptance due to database-level locks, though negligible at shop-scale throughput.

### 5.6 Auto-Conversion & Implicit Fee Waivers

- **Decision:** If an order is accepted but misses the batch cutoff, and no future batch slot exists, the system automatically converts it into a Direct Delivery.
- **Trade-off:**
  - _Advantage:_ Ensures the customer still gets their food without manual vendor intervention or explicit rejection. Furthermore, because the database schema freezes pricing at checkout (`delivery_fee`, `total_price`), updating `is_direct_delivery = true` organically waives the premium direct fee without complex recalculation logic.
  - _Disadvantage:_ The vendor eats the higher logistical cost of dispatching a runner for a single order, serving as an operational penalty for slow order acceptance.
