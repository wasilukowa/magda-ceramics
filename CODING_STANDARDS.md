# Coding Standards & Good Practices

These rules apply to ALL changes — new code, refactoring, bug fixes, and reviews.
They are derived from a reference project that established these patterns intentionally.

---

## 1. Architecture — Separation of Concerns

Every folder has ONE responsibility. Never mix business logic with UI.

```
src/
├── app/              → routing and pages only (Next.js App Router)
├── components/       → UI components only
├── lib/
│   ├── service/      → business logic (service classes)
│   ├── store/        → client state (Zustand slices + providers)
│   ├── helpers/      → pure utility functions
│   └── api.ts        → base URL detection, fetch helpers
├── contracts/        → TypeScript interfaces for all domains
├── queries/          → GraphQL or API query strings (never inline)
├── server-actions/   → Next.js server actions
├── hooks/            → custom React hooks
├── content/          → static data (JSON, navigation config)
├── styles/           → SCSS variables, breakpoints, reset
└── utility/          → type guards and validators
```

---

## 2. Service Layer Pattern

Business logic lives in dedicated service classes, NOT in components or pages.

```ts
// Good
class ProductService {
  getRawProducts() { ... }
  getPreparedProducts() { ... }   // raw API data → domain type
  getProductByHandle(handle) { ... }
}

// Bad — fetching Shopify/API data directly inside a component
export default function ProductPage() {
  const res = await fetch("https://...");
}
```

Components always receive prepared domain objects, never raw API responses.

---

## 3. Adapter Pattern — Raw → Domain Types

Raw API data is always transformed into domain types before reaching the UI.
If the external API changes, only the adapter (helpers file) needs to change.

```ts
// src/lib/service/product/helpers.ts
function prepareProductData(raw: RawProduct): ProductProps { ... }
function getPreparedProductImages(raw): ProductImage[] { ... }
function getPreparedProductVariantPrice(raw): Price { ... }
```

Always have two layers of types:
- `RawProduct` — what the API returns
- `ProductProps` — what the rest of the app uses

---

## 4. TypeScript — Contracts First

**Define types before writing implementation.**

```
src/contracts/
├── server/
│   ├── product/index.ts   → ProductProps, ProductVariant, Price
│   └── cart/index.ts      → CartProps, CartItem
├── shared/index.ts        → ImageProps, shared primitives
└── store/index.ts         → store interface types
```

Rules:
- Never use `any` — use proper types or `unknown` with type guards
- Never inline types in components — define them in `contracts/`
- Use `enum` for sets of string constants (e.g. currency codes, status values)
- Separate raw API types from domain types

---

## 5. Type Guards in a Dedicated File

All runtime type checks live in `src/utility/index.ts`, never scattered inline.

```ts
// src/utility/index.ts
const isDefined = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

const isString = (value: unknown): value is string =>
  typeof value === "string";

const isCorrectNumber = (value: unknown): value is number =>
  typeof value === "number" && !isNaN(value) && isFinite(value);

const isObjectEmpty = (object: object): boolean =>
  Object.keys(object).length === 0;
```

Use these instead of repeating `!== null && !== undefined` checks everywhere.

---

## 6. State Management — Zustand with Slices

Split the store by domain, never one giant store.

```ts
// src/lib/store/slices/
authSlice.ts     → isAuth, setAuth
cartSlice.ts     → cartId, cartKey, setCart, clearCart
productSlice.ts  → product, quantity, setProduct
```

Wrap every slice in a React Context Provider with a typed `useXxx` hook:

```ts
// src/lib/store/providers/CartProvider.tsx
export const CartProvider = ({ children, ...props }) => {
  const store = useRef(createCartStore(props));
  return <CartContext.Provider value={store.current}>{children}</CartContext.Provider>;
};

export const useCart = <T>(selector: (state: CartStore) => T): T =>
  useStore(useContext(CartContext)!, selector);
```

Components import `useCart` — they never know Zustand is underneath.

**Always use selector pattern to minimize re-renders:**

```ts
// Good — re-renders only when cartId changes
const cartId = useCart(state => state.cartId);

// Bad — re-renders on any store change
const store = useCart(state => state);
```

---

## 7. Components — Small and Single-Purpose

Each component does ONE thing. Split by state variants too.

```
products/
├── Product.tsx           → page layout only
├── ProductCard.tsx        → card in listing
├── Slider.tsx            → image carousel
├── ProductSelects.tsx     → all option dropdowns
├── VariantPicker.tsx      → ONE dropdown
├── ProductSummary.tsx     → purchase summary
├── ProductLoading.tsx     → loading state
└── ProductNotFound.tsx    → 404 state
```

**Always create Loading and NotFound components** for every page/section that fetches data.

---

## 8. UI Components — shadcn/ui with CVA

Build UI primitives using `cva` (class-variance-authority) for variants:

```ts
// src/components/ui/button.tsx
const buttonVariants = cva("base-styles", {
  variants: {
    variant: { default: "...", outline: "...", ghost: "..." },
    size: { default: "...", sm: "...", lg: "..." }
  },
  defaultVariants: { variant: "default", size: "default" }
});
```

Use the `cn()` helper for conditional class merging:

```ts
// src/lib/utils.ts
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// usage
<div className={cn("base", isActive && "active", className)} />
```

Never concatenate Tailwind classes with string interpolation — always use `cn()`.

---

## 9. Static Content — Data, Not Hardcode

Text, navigation, and page content live in data files, not in component JSX.

```ts
// src/content/data.ts
export const navLinks: LinkType[] = [
  { label: "Products", url: "/products" },
  { label: "About", url: "/about" },
];
```

```json
// src/content/pageContent.json
{
  "home": {
    "hero": { "title": "...", "subtitle": "..." },
    "features": [{ "title": "...", "description": "...", "image": "..." }]
  }
}
```

Adding a menu item = one line in a data file. Never touch the component.

**Define TypeScript types for all content shapes:**

```ts
// src/content/type.ts
type LinkType = {
  label: string;
  url: string;
  children?: LinkType[];  // supports nested menus
};
```

---

## 10. Styling — Design Tokens via CSS Variables

All brand colors, spacing scales, and typography go in `_variables.scss` as CSS custom properties.

```scss
// src/styles/_variables.scss
:root {
  --color-primary: #your-brand-color;
  --color-secondary: #your-secondary;
  --color-accent: #your-accent;

  // full gray scale: --gray-50 through --gray-950
  // status colors: --color-success, --color-warning, --color-error, --color-info
  // dark mode variants
}
```

Changing the brand color = change one variable, not 50 places in the codebase.

**Layer your styling:**
- CSS variables in `_variables.scss` for design tokens
- Tailwind utility classes for layout and spacing
- SCSS for complex component styles only
- `cn()` for conditional class logic in components

---

## 11. Client/Server Boundary (Next.js App Router)

Be explicit about where code runs:

```ts
// Server Actions — always at the top of the file
"use server"
export async function getProducts() { ... }

// Interactive components — always at the top of the file
"use client"
export function ProductFilter({ options }) { ... }
```

**Rule:** Fetch data in Server Components. Put `"use client"` only on components that need interactivity (onClick, useState, useEffect, browser APIs).

**Initialize state on the server when possible:**

```ts
// Run in parallel, not sequentially
const [userData, cartData] = await Promise.all([
  getUserData(),
  getCartData()
]);
```

---

## 12. GraphQL / API Queries in Dedicated Files

Never write query strings inline in components or service files.

```ts
// src/queries/product/index.ts
export const PRODUCT_BY_HANDLE_QUERY = gql`
  query ProductByHandle($handle: String!) {
    product(handle: $handle) { ... }
  }
`;
```

Use GraphQL Code Generator to auto-generate TypeScript types from queries:

```
npm run codegen   →   generates src/gql/graphql.ts
```

Never write response types by hand for API calls — generate them.

---

## 13. Singleton for External API Clients

```ts
class ApiClientManager {
  private static instance: ApiClientManager;

  static getInstance() {
    if (!this.instance) {
      this.instance = new ApiClientManager();
    }
    return this.instance;
  }
}
```

One authenticated client for the entire application. No duplicate connections.

---

## 14. Server Fetch with Timeout

Never leave server-side fetch calls without a timeout:

```ts
// src/lib/api.ts
export const serverFetch = (url: string, options?: RequestInit) =>
  fetch(url, {
    ...options,
    signal: AbortSignal.timeout(10_000)  // 10 seconds
  });
```

---

## 15. Environment-Aware Base URL

```ts
// src/lib/api.ts
export const getBaseUrl = () => {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};
```

One function for all base URL needs — works in dev, preview, and production.

---

## 16. URL as State

When selection state should be shareable (e.g., selected product variant, filters),
store it in URL search params, not only in component state.

```ts
// variant selection synced to URL
handleOptionChange(option, value) {
  const params = new URLSearchParams(searchParams);
  params.set(option, value);
  router.replace(`?${params.toString()}`);
}
```

Users can share a link to the exact state they are looking at.

---

## 17. Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `ProductCard.tsx` |
| Hooks | camelCase, `use` prefix | `useCart.ts` |
| Utilities | camelCase | `isDefined.ts` |
| Types/Interfaces | PascalCase | `ProductProps` |
| Constants | SCREAMING_SNAKE_CASE | `PRODUCT_QUERY` |
| CSS variables | kebab-case | `--color-primary` |
| Files (non-component) | camelCase | `cartSlice.ts` |

---

## Quick Checklist Before Every PR

- [ ] No business logic inside components — moved to service/helpers
- [ ] New types defined in `contracts/`, not inline
- [ ] No hardcoded text in JSX — moved to `content/`
- [ ] New colors/fonts added as CSS variables, not hardcoded values
- [ ] Server components fetch data; client components handle interaction
- [ ] `"use server"` / `"use client"` directives present where needed
- [ ] Loading and error/empty states handled for every data-fetching component
- [ ] `cn()` used for all conditional Tailwind class logic
- [ ] No `any` types introduced
- [ ] Async operations run with `Promise.all` when independent
