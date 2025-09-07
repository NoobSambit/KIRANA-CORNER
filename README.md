# KiranaConnect - Hyperlocal Shop-to-Home Platform https://kirana-corner.vercel.app/

A modern React + Firebase app that helps neighborhood kirana shops go online. Instead of centralized warehouses like Blinkit/Zepto, customers buy directly from local stores; shopkeepers fulfill delivery themselves. The platform sustains via shop subscriptions and in-app ads.

## 🧭 Vision (Why this exists)
- Help local shops stay relevant in the instant-delivery era
- List shop inventory online and accept orders from nearby customers
- Let shopkeepers manage products, inventory, and orders end-to-end
- Keep logistics simple: delivery handled by the shop itself

## 📦 Core Features
- **Map-first discovery**: React Leaflet map showing nearby shops, dynamic radius based on zoom
- **Shop pages**: Rich shop details and product catalogs
- **Product browsing**: Grid/list views, category filters, sorting
- **Cart & checkout**: Add to cart, quantity updates, mock payment flow
- **Orders**: Create and track orders; per-shop order views
- **Inventory management**: Shop owners update stock/availability in bulk
- **Auth & roles**: Customer vs Shop Owner UX (protected routes)
- **Responsive UI**: Tailwind CSS with glassmorphism and animations
- **Realtime Firestore**: Shops/products/orders live updates
- **Address book**: Save/select delivery addresses per user

## 🧩 Components & Pages (Quick Reference)

### Components (`src/components/`)
- `Navbar.tsx`: Top navigation, role-aware actions, search box, cart trigger
- `Layout.tsx`: App shell with `Navbar`, `CartDrawer`, `Outlet`
- `CartContext.tsx`: Cart state, persistence in `localStorage`
- `CartDrawer.tsx`: Full cart UI, address selection, mock payment, creates order
- `AccountDrawer.tsx`: Role-aware account panel, links to dashboard/orders
- `ProtectedRoute.tsx`: Gate routes behind auth
- `MapSection.tsx`: Leaflet map, dynamic radius filtering via `geoUtils`
- `FilterBar.tsx`: Category filters, sorting, grid/list toggle
- `ProductGrid.tsx` + `ProductCard.tsx`: Product listing and card actions
- `InventoryModal.tsx`: Bulk stock updates for shop owners
- `ShopProfileEditor.tsx`, `ProductForm.tsx`, `ConfirmDialog.tsx`, `Toast.tsx`, `StatsCard.tsx`, `FeatureCard.tsx`, `ShopCard.tsx`, `RoleSwitcher.tsx`, `AddressSelector.tsx`, `SignupModal.tsx`

### Pages (`src/pages/`)
- `Home.tsx`: Landing, CTAs for customers/owners
- `Login.tsx`, `Signup.tsx`: Auth flows
- `CustomerDashboard.tsx`, `ShopOwnerDashboard.tsx`, `Dashboard.tsx`
- `ShopDetails.tsx`, `ShopProducts.tsx`: Shop and catalog views
- `AccountPage.tsx`: User settings
- `MyOrders.tsx`: Customer orders list
- `ShopCreatePlaceholder.tsx`: Start shop onboarding
- `NotFound.tsx`

### Routes
- `src/routes/index.tsx`: Central route config with lazy-loaded pages and protected routes

### Utilities (`src/utils/`)
- `geoUtils.ts`: Haversine distance, distance filters, map bounds, zoom helpers
- `productService.js`: CRUD products, nearby products, stock updates, realtime subscriptions
- `shopService.js`: Shop CRUD, queries, validation
- `orderUtils.js`: Orders CRUD, user data, user addresses CRUD
- `catalog.ts`: Local seed catalog for categories/products

### Firebase
- `src/firebase.js`: Client SDK init via Vite `VITE_FIREBASE_*` env vars; logs if unset

### API Routes
- `api/test.ts`: Vercel serverless test endpoint with CORS and echo payload

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- Firebase project (Firestore + Auth)
- Vite env set in `.env` (see below)

### Installation
1. Clone and install
```bash
git clone <repository-url>
cd KIRANA-CORNER-master
npm install
```
2. Create `.env` with Firebase config
```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```
3. Start dev servers
```bash
# Frontend
npm run dev
# Optional: local serverless functions on a separate port
npm run dev:api
# Run both
npm run dev:full
```

## 🛠️ Scripts
- `npm run dev`: Vite dev server
- `npm run dev:api`: Vercel serverless dev (`api/*`)
- `npm run dev:full`: Run both front + api
- `npm run build`: Production build (outputs to `dist/`)
- `npm run preview`: Preview production build
- `npm run lint`: ESLint
- `npm run seed-shops`: Seed shops (requires Admin SDK script)
- `npm run seed-catalog`: Seed catalog (requires Admin SDK script)

## 🌱 Seeding (optional for demos)
- See `scripts/seedShops.js` and `scripts/seedCatalog.js` (referenced by scripts). Provide a Firebase Admin Service Account and adjust project IDs if you use them.

## 🗺️ Map & Discovery
- Dynamic shop filtering based on map zoom/move using `filterShopsByDistance` from `geoUtils.ts`
- Markers for user and shops with popups linking to shop pages

## 🔐 Auth & Roles
- Firebase Auth; UI adapts for `customer` and `shopowner`
- `ProtectedRoute` guards dashboards and orders

## 📦 Orders & Inventory
- Orders written to Firestore (`orders` collection)
- Cart decrements product stock via `decrementTopLevelProductStock`
- Shop owners bulk-update stock in `InventoryModal`

## 🧱 Project Structure (Directory Tree)
```
KIRANA-CORNER-master/
├── api/
│   └── test.ts
├── dist/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── AccountDrawer.tsx
│   │   ├── AddressSelector.tsx
│   │   ├── CartContext.tsx
│   │   ├── CartDrawer.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── Dashboard.tsx
│   │   ├── FeatureCard.tsx
│   │   ├── FilterBar.tsx
│   │   ├── InventoryModal.tsx
│   │   ├── Layout.tsx
│   │   ├── MapSection.tsx
│   │   ├── Navbar.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductForm.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── RoleSwitcher.tsx
│   │   ├── SearchContext.tsx
│   │   ├── ShopCard.tsx
│   │   ├── ShopProfileEditor.tsx
│   │   ├── SignupModal.tsx
│   │   ├── StatsCard.tsx
│   │   └── Toast.tsx
│   ├── pages/
│   │   ├── AccountPage.tsx
│   │   ├── CustomerDashboard.tsx
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── MyOrders.tsx
│   │   ├── NotFound.tsx
│   │   ├── ShopCreatePlaceholder.tsx
│   │   ├── ShopDetails.tsx
│   │   ├── ShopOwnerDashboard.tsx
│   │   ├── ShopProducts.tsx
│   │   └── Signup.tsx
│   ├── routes/
│   │   └── index.tsx
│   ├── utils/
│   │   ├── catalog.ts
│   │   ├── geoUtils.ts
│   │   ├── orderUtils.js
│   │   ├── productService.js
│   │   └── shopService.js
│   ├── App.tsx
│   ├── firebase.d.ts
│   ├── firebase.js
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vercel.json
├── vite.config.ts
└── README.md
```

## 🚀 Deploying to Vercel
- Build command: `npm run build`
- Output directory: `dist`
- SPA routing configured via `vercel.json` (rewrites to `index.html`)
- You can also run serverless functions locally with `npm run dev:api`

## 🌟 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a PR

## 📄 License
MIT
