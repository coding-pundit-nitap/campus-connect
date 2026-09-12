# Premium shop-creation & fast product management UX

## Goal

Shopkeepers currently see two visually inconsistent flows (shop creation: minimal blue; product creation: violet glassmorphism) and a slow, page-per-product workflow for catalog management. This redesign gives both flows one refined "premium" visual language, makes the whole experience work well on phone, and makes adding/editing products fast enough that a shopkeeper can build out a full menu without friction.

## Non-goals

- No changes to authentication, orders, earnings, or announcements pages.
- No changes to the underlying product/shop database schema beyond what's needed for a lightweight partial-update endpoint (see below).

## Design system

Replace the two divergent palettes (blue in `create-shop-form`, violet/gradient in `create-product-page`) with one shared token set:

- **Surface**: warm neutral card background (`bg-card`), soft single-layer shadow (no stacked glass/gradients), `rounded-2xl` as the standard container radius.
- **Accent**: one confident accent color used for primary actions, focus rings, and active states across both flows (replaces both blue-600 and violet-600). Use **indigo-600** as the single accent — it reads as premium/neutral rather than "techy blue" or "playful violet," and pairs cleanly with the amber "live" indicator dot already used in both flows (kept as-is for live/pending status, not repurposed as the accent).
- **Typography**: keep the existing `font-heading` for step/section titles; keep the uppercase-label pattern from the product form as the shared field-label style (bolder, more scannable than the shop form's current plain label).
- **Tokens live in one place**: extend `src/components/create-shop/create-shop-form/styles.ts` into a shared module (e.g. `src/components/shared/form-styles.ts`) consumed by both the shop form and the new product drawer, so field classes, heading classes, and card classes aren't duplicated per feature.
- **Motion**: keep subtle hover/active scale transforms (already used in both flows) — premium feel comes from restraint, not more gradients.

## Shop creation form

Keep the existing 7-step wizard architecture (already redesigned this session: `CreateShopForm` + step components + `ShopPreviewCard` + draft autosave) — it is structurally sound. Work here is purely visual: apply the shared token set, tighten spacing, and verify the mobile collapsed-preview pattern (`mobilePreviewOpen` toggle in `index.tsx`) reads as premium rather than utilitarian at small widths (currently plain border/text).

## Product management

### Add product: page → drawer

Replace `/owner-shops/products/new` (`CreateProductPage`, `SingleProductForm`) with a **Sheet-based drawer** (shadcn `Sheet`, already in the codebase — `src/components/ui/sheet.tsx`) triggered from the product list page, using `side="right"` on desktop and full-height bottom sheet behavior on mobile.

- **Progressive disclosure**: only Name, Category, Price are visible by default; Description, Brand, Discount, Stock, Image sit under a collapsed "More details" section (still validated on submit, just visually deferred).
- **Save & add another**: primary submit keeps the drawer open, shows a success toast, resets the form, and refocuses the Name field — lets a shopkeeper add 10+ items back-to-back without leaving the list.
- **Live preview**: reuse the `ProductPreviewCard` pattern inside the drawer (compact variant) so shopkeepers see the customer-facing card as they type, consistent with the shop form's live-preview pattern.
- Bulk import remains available as a secondary action/tab reachable from the same entry point (e.g. a small "or bulk import" link inside the drawer header) rather than a top-level page tab.
- The `/owner-shops/products/new` route and `CreateProductPage` are removed; the product list page becomes the sole entry point. This is a deliberate breaking change to routing (approved).

### Edit product: dialog → same drawer, prefilled

Replace `ProductEditDialog` (generic `SharedForm`-driven dialog) with the same drawer component in "edit" mode, prefilled with the product's current values. This removes the generic/inconsistent look of `SharedDialog` + `SharedForm` for this specific case and gives editing the same premium visual treatment and live preview as creation.

### Inline quick-edit for price & stock

On the product card (`owner-product-actions.tsx` / product list), extend the existing in-stock `Switch` pattern with click-to-edit for **price**: clicking the price turns it into a bounded number input, saves on blur/Enter, reverts on Escape. This avoids opening the full drawer for the two edits shopkeepers make most often.

- New endpoint: `PATCH /api/products/:id` (or extend the existing update route) accepting a partial body (`{ price }` or `{ stock_quantity }`) so a quick-edit doesn't require sending/validating the full product schema. Approved as a backend change.
- The existing `useToggleProductStock` mutation stays as-is for the switch; the new partial-update path is only for price (and any other single-field quick edits added later).

## Mobile

- Drawer/Sheet becomes a full-height bottom sheet below `sm` breakpoint (shadcn `Sheet` supports this via side="bottom" + height styling).
- Shop form's existing collapsed live-preview toggle (already implemented) is the template for how the product drawer surfaces its preview on small screens — not shown inline by default, revealed on tap.
- Verify tap targets (buttons, quick-edit inputs, switches) are ≥40px throughout both flows.

## Files touched (expected)

- New: `src/components/shared/form-styles.ts` (shared tokens, supersedes `create-shop-form/styles.ts`)
- New: `src/components/owned-shop/product-card/product-drawer.tsx` (or similar) replacing `product-edit-dialog.tsx` and the create page's form
- Modified: `src/components/create-shop/create-shop-form/*` (visual pass only, no structural change)
- Modified: `src/components/shared/product-card/owner-product-actions.tsx` (inline quick-edit for price)
- Modified: product list page/component to trigger the add-drawer
- Removed: `src/app/owner-shops/products/new/page.tsx`, `src/page-components/owner-shops/create-product-page/*` (`index.tsx`, `single-product-form.tsx`; `product-preview-card.tsx` logic migrates into the drawer; `bulk-import-tab.tsx` migrates as a secondary action)
- Backend: partial-update route/handler for product price/stock quick-edit

## Testing

- Manual verification in browser at desktop and phone widths (375px) for: shop-creation wizard steps 1–7, product add drawer (create + "save & add another"), product edit drawer (prefilled), inline price quick-edit, stock toggle.
- Existing form validation (zod schemas) must still fire correctly inside the drawer for both create and edit modes.
