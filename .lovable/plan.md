

# White-Label Casserole ERP — Remove All Builder Traces

## Current State

- **index.html**: Title says "Kitchen Flow", OG images point to `lovable.dev`, favicon is an inline SVG emoji
- **package.json**: Name is `vite_react_shadcn_ts`
- **vite.config.ts**: Uses `lovable-tagger` dev plugin
- **src/ code**: Clean — no Lovable references in source code
- **public/**: Only `favicon.ico`, `placeholder.svg`, `robots.txt` — no manifest

## Changes

### 1. index.html — Full rebrand
- Title → `קסרולה — ניהול קייטרינג חכם`
- Description/author → Casserole branding
- Remove `lovable.dev` OG image URLs, replace with `/og-image.svg`
- Remove Twitter `@KitchenFlow` reference
- Replace favicon with custom SVG (green chef hat with "ק")
- Add Apple touch icon, manifest link
- Theme color → `#16a34a`

### 2. package.json — Rename
- `"name"` → `"casserole-erp"`
- Add `"description"` → `"Casserole - Professional Catering Management Platform"`

### 3. vite.config.ts — Remove lovable-tagger
- Remove `lovable-tagger` import and `componentTagger()` plugin call
- The package stays in devDependencies (lockfile managed automatically)

### 4. Generate branded assets
- Create `public/favicon.svg` — green ק icon
- Create `public/og-image.svg` — 1200x630 branded card
- Create `public/manifest.json` — PWA manifest with Casserole branding

### 5. Create 404 error page
- New `NotFoundPage.tsx` with Hebrew branded 404 message
- Add catch-all route in App.tsx pointing to it instead of redirecting to `/`

### 6. DemoExpiredPage — already branded (קסרולה), no changes needed

## Files to modify
1. `index.html`
2. `package.json` (lines 2, add description)
3. `vite.config.ts` (remove lovable-tagger)
4. `public/favicon.svg` (create)
5. `public/og-image.svg` (create)
6. `public/manifest.json` (create)
7. `src/components/pages/NotFoundPage.tsx` (create)
8. `src/App.tsx` (update catch-all route)

