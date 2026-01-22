# Project: Dare to Dream (DTD) - Shopify Hydrogen E-commerce

## Overview

This is a Shopify Hydrogen storefront using React Router 7.9, Vite, and TypeScript. The project uses a custom CSS design system with CSS variables (no Tailwind).

---

## MCP Servers

### Figma MCP Server Rules

These rules define how to translate Figma inputs into code for this project and must be followed for every Figma-driven change.

#### Required Flow (do not skip)

1. Run `get_design_context` first to fetch the structured representation for the exact node(s)
2. If the response is too large or truncated, run `get_metadata` to get the high-level node map, then re-fetch only the required node(s) with `get_design_context`
3. Run `get_screenshot` for a visual reference of the node variant being implemented
4. Only after you have both `get_design_context` and `get_screenshot`, download any assets needed and start implementation
5. Translate the output (usually React + Tailwind) into this project's conventions, styles, and framework
6. Validate against Figma for 1:1 look and behavior before marking complete

#### Implementation Rules

- Treat the Figma MCP output (React + Tailwind) as a representation of design and behavior, not as final code style
- IMPORTANT: Replace Tailwind utility classes with CSS custom properties and classes from `app/styles/app.css`
- Reuse existing components from `app/components/` instead of duplicating functionality
- Use the project's color system, typography scale, and spacing tokens consistently
- Respect existing routing, state management, and data-fetch patterns
- Strive for 1:1 visual parity with the Figma design
- Validate the final UI against the Figma screenshot for both look and behavior

---

## Component Organization

```
/app
├── components/          # UI components (35+ components)
├── routes/              # File-based routing with ($locale) prefix
├── styles/              # CSS files with design tokens
│   ├── app.css          # Main stylesheet with all design tokens
│   ├── cart.css         # Cart-specific styles
│   └── reset.css        # Reset + Lenis scrolling
├── hooks/               # Custom React hooks
├── contexts/            # React Context providers
├── lib/                 # Utilities, GraphQL fragments
└── assets/              # Fonts, icons, images, 3D models
```

### Component Rules

- IMPORTANT: All UI components go in `app/components/`
- Components use PascalCase naming (e.g., `ProductCard.tsx`, `Header.tsx`)
- CSS classes use kebab-case (e.g., `.product-card`, `.quick-add-zone`)
- Hooks use camelCase with `use` prefix (e.g., `useHeaderScroll.ts`)
- Use path alias `~/` for imports (maps to `app/`)

### Export Patterns

```typescript
// Named exports for components
export function ProductCard({product, isOpen, onToggle}: ProductCardProps) {
  // ...
}

// Route files include loader + meta + default export
export const meta: Route.MetaFunction = () => ({title: 'Page'});
export async function loader(args: Route.LoaderArgs) {}
export default function PageComponent() {}
```

---

## Styling System

### CRITICAL: No Tailwind

- IMPORTANT: This project uses custom CSS with CSS variables, NOT Tailwind
- IMPORTANT: Never use Tailwind utility classes - translate to CSS custom properties
- All design tokens are defined in `app/styles/app.css`

### Color System

```css
/* Base Colors - Use these, never hardcode hex values */
--color-black: #070707;           /* Primary dark background */
--color-white: #FFFFFF;           /* Primary light color */
--color-cream: #F7F6F3;           /* Soft off-white */
--color-success: #22c55e;         /* Success states, in-stock */

/* White Transparency (for dark backgrounds) */
--white-subtle: rgba(255, 255, 255, 0.05);   /* Hover states */
--white-light: rgba(255, 255, 255, 0.15);    /* Borders, dividers */
--white-medium: rgba(255, 255, 255, 0.2);    /* Active borders */
--white-strong: rgba(255, 255, 255, 0.5);    /* Secondary text */
--white-bright: rgba(255, 255, 255, 0.7);    /* Bright text */
--white-solid: rgba(255, 255, 255, 0.9);     /* Near-solid white */

/* Black Transparency (for light backgrounds) */
--black-subtle: rgba(0, 0, 0, 0.05);         /* Very subtle bg */
--black-muted: rgba(0, 0, 0, 0.1);           /* Borders */
--black-medium: rgba(0, 0, 0, 0.12);         /* Hover states */
--black-light: rgba(0, 0, 0, 0.3);           /* Soft shadows */
--black-dark: rgba(0, 0, 0, 0.6);            /* Dark overlays */
```

### Typography System

```css
/* Font Sizes - Use em units */
--font-xs: 0.6875em;    /* 11px - labels, captions */
--font-sm: 0.75em;      /* 12px - small text, metadata */
--font-base: 0.875em;   /* 14px - body text */
--font-md: 1em;         /* 16px - large body */
--font-lg: 1.125em;     /* 18px - small headings */
--font-xl: 1.25em;      /* 20px - h4 */
--font-2xl: 1.5em;      /* 24px - h3 */
--font-3xl: 1.875em;    /* 30px - h2 */
--font-4xl: 2.5em;      /* 40px - h1, hero */
--font-5xl: 3em;        /* 48px - large hero */
--font-6xl: 4em;        /* 64px - display */

/* Font Weights */
--weight-light: 200;
--weight-normal: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;

/* Letter Spacing */
--tracking-tight: -0.02em;
--tracking-normal: 0;
--tracking-wide: 0.02em;
--tracking-wider: 0.05em;
--tracking-widest: 0.1em;

/* Line Heights */
--leading-tight: 1.2;   /* headings */
--leading-normal: 1.5;  /* body text */
--leading-relaxed: 1.7; /* long-form */
```

### Animation & Transitions

```css
/* Easing Functions */
--ease-wipe: cubic-bezier(0.625, 0.05, 0, 1);     /* Button wipe animations */
--ease-smooth: cubic-bezier(0.22, 0.61, 0.36, 1); /* Smooth slide animations */

/* Durations */
--duration-fast: 0.2s;     /* Quick interactions */
--duration-normal: 0.3s;   /* Standard animations */
--duration-slow: 0.5s;     /* Slower, smoother animations */
```

### Button System

Use the existing button classes:

```css
.btn              /* Base button styles */
.btn-glass        /* Transparent glass effect with blur (secondary actions) */
.btn-solid        /* Solid white background (primary CTAs) */
.btn-glass--icon  /* Icon buttons with glass effect */
.btn-glass--cart  /* Cart-specific button styling */
```

### Responsive Breakpoints

```css
/* Media Query Breakpoints (CSS can't use vars in media queries) */
/* Mobile:  < 48em (768px) */
/* Tablet:  48em - 62.5em (768px - 1000px) */
/* Desktop: > 62.5em (1000px) */
/* Wide:    > 81.25em (1300px) */

@media screen and (max-width: 991px) { /* Tablet */ }
@media screen and (max-width: 767px) { /* Mobile Landscape */ }
@media screen and (max-width: 479px) { /* Mobile Portrait */ }
```

### Responsive Scaling System (Osmo)

The project uses a fluid scaling system based on container size:

```css
/* Desktop: 1440px ideal, 992px-1920px range */
/* Tablet: 834px ideal, 768px-991px range */
/* Mobile Landscape: 550px ideal, 480px-767px range */
/* Mobile Portrait: 390px ideal, 320px-479px range */
```

---

## Data & State Management

### Shopify Hydrogen Patterns

```typescript
// Loader for server-side data fetching
export async function loader({context}: Route.LoaderArgs) {
  const {storefront} = context;
  const {products} = await storefront.query(QUERY);
  return {products};
}

// Use data in component
export default function Page() {
  const {products} = useLoaderData<typeof loader>();
}

// Form submissions with fetcher
const fetcher = useFetcher();
fetcher.submit({productId, quantity}, {method: 'POST', action: '/cart'});

// Cart state
const {cart} = useRouteLoaderData<typeof rootLoader>('root');
```

### GraphQL

- Fragments are defined in `app/lib/fragments.ts`
- Types are auto-generated in `storefrontapi.generated.d.ts`
- Use existing fragments when possible

### Context Providers

- `ThemeContext` - Light/dark theme toggle (in `app/contexts/`)

---

## Asset Handling

### Figma Assets

- IMPORTANT: If the Figma MCP server returns a localhost source for an image or SVG, use that source directly
- IMPORTANT: DO NOT import/add new icon packages - use assets from Figma or existing `app/assets/icons/`
- IMPORTANT: DO NOT use or create placeholders if a localhost source is provided

### Asset Locations

```
app/assets/
├── fonts/          # Genesis (primary), Neue Haas Grotesk (fallback)
├── icons/          # SVG icon library
├── 3D/             # Three.js 3D model assets
└── img/            # Static images
```

### Images

- Use Hydrogen's `Image` component for responsive images
- Include `aspectRatio`, `sizes`, and `loading` props

```typescript
import {Image} from '@shopify/hydrogen';

<Image
  data={product.featuredImage}
  aspectRatio="3/4"
  sizes="(min-width: 1024px) 25vw, 50vw"
  loading="lazy"
/>
```

---

## Project-Specific Conventions

### Routing

- File-based routing with `($locale)` prefix for internationalization
- Example: `app/routes/($locale).products.$handle.tsx`

### Performance

- Use `lazy()` for heavy components (e.g., 3D elements)
- Use Lenis for smooth scrolling (`useLenis` hook)
- Use GSAP for complex animations
- Implement proper loading states

### Animations & 3D

- Three.js via `@react-three/fiber` and `@react-three/drei`
- GSAP for timeline animations
- Lenis for smooth page scrolling

### Common Patterns

```typescript
// Lazy loading heavy components
const NavbarLogo3D = lazy(() => import('~/components/NavbarLogo3D'));

// Portal for modals/sheets
import {createPortal} from 'react-dom';
return createPortal(<Modal />, document.body);

// Scroll listener with cleanup
useEffect(() => {
  const handleScroll = () => {};
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

---

## Figma-to-Code Translation Guide

When translating Figma MCP output to this codebase:

| Figma/Tailwind | This Project |
|----------------|--------------|
| `text-sm` | `font-size: var(--font-sm)` |
| `text-base` | `font-size: var(--font-base)` |
| `font-medium` | `font-weight: var(--weight-medium)` |
| `text-white` | `color: var(--color-white)` |
| `bg-black` | `background: var(--color-black)` |
| `opacity-50` | Use `--white-strong` or `--black-light` |
| `rounded-lg` | `border-radius: 0.5em` |
| `gap-4` | `gap: 1em` (use em units) |
| `p-4` | `padding: 1em` |
| `transition-all` | `transition: all var(--duration-normal) var(--ease-smooth)` |

### Example Translation

Figma MCP output (Tailwind):
```jsx
<button className="flex items-center justify-center px-6 py-3 bg-white text-black font-medium rounded-lg">
  Add to Cart
</button>
```

This project:
```jsx
<button className="btn btn-solid">
  Add to Cart
</button>
```

Or with custom styles:
```css
.custom-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75em 1.5em;
  background: var(--color-white);
  color: var(--color-black);
  font-weight: var(--weight-medium);
  border-radius: 0.5em;
}
```

---

## Development Commands

```bash
npm run dev        # Development server (port 3001)
npm run build      # Production build with codegen
npm run preview    # Preview built app
npm run lint       # ESLint
npm run typecheck  # TypeScript check + React Router typegen
npm run codegen    # GraphQL codegen + Router types
```
