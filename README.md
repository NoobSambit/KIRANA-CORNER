# KiranaConnect - Local Shop Management Platform

A modern React + Firebase application for connecting local shops with customers in Kolkata.

<!-- Auto-deployment test commit -->

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- Firebase project setup
- Firebase Admin SDK service account key

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd kiranaconnect
```

2. Install dependencies
```bash
npm install
```

3. Set up Firebase configuration in `src/firebase.js`

4. Start the development server
```bash
npm run dev
```

## 🌱 Seeding Shop Data

To populate your Firestore database with dummy shop data across Kolkata:

### Setup Firebase Admin SDK

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key (downloads a JSON file)
3. Update `scripts/seedShops.js` with your service account credentials:

```javascript
const serviceAccount = {
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  // ... other fields
};
```

### Run the Seeding Scripts

#### 1. Seed Shops
```bash
npm run seed-shops
```

This will create 100+ realistic shops across Kolkata localities including:
- Salt Lake, Newtown, Garia, Howrah
- Park Circus, Esplanade, Behala, Dum Dum
- Gariahat, Ballygunge, Jadavpur, and more

Each shop includes:
- Realistic Bengali shop names
- Categories (Kirana, Dairy, Vegetables, etc.)
- Ratings (3.0-5.0)
- Geographic coordinates
- Contact information
- Business hours
- Delivery availability

#### 2. Seed Product Catalog
```bash
npm run seed-catalog
```

This will populate each shop with 10-15 realistic products based on their category:

**Medical Store Products:**
- Paracetamol, Cough Syrup, Bandages, Thermometer
- Vitamin C, Antiseptic Solution, First Aid Kit
- Blood Pressure Monitor, Diabetes Test Strips

**Kirana/Grocery Products:**
- Basmati Rice, Wheat Flour, Spices (Turmeric, Chilli, Coriander)
- Mustard Oil, Sugar, Salt, Lentils (Dal)
- Tea Leaves, Cumin Seeds

**Electronics Products:**
- USB Cables, Power Banks, Bluetooth Earphones
- Phone Chargers, HDMI Cables, Memory Cards
- Screen Protectors, Wireless Mouse, LED Bulbs

**Stationery Products:**
- Pens, Notebooks, Pencils, Erasers
- File Folders, Staplers, Sticky Notes
- Rulers, Glue Sticks, Scissors

**Hardware Products:**
- Nails, Hammers, Screwdrivers, Paint Brushes
- Screws, Pliers, Measuring Tape, Drill Bits
- Safety Gloves, Wire Cutters, Sandpaper

Each product includes:
- Realistic product names and descriptions
- Prices ranging from ₹20 to ₹5000
- Stock availability (80% in stock, 20% out of stock)
- Product images from Pexels
- Category-specific pricing

## 🗺️ Map Features

- **Interactive Kolkata Map**: Centered on Kolkata with real shop locations
- **Live Shop Data**: Fetches shops from Firestore in real-time
- **Expandable View**: Full-screen map mode with smooth transitions
- **Shop Details**: Click markers to view shop information
- **Navigation**: Direct links to individual shop pages

## 🏪 Shop Management

### For Shop Owners:
- Complete product catalog management
- Real-time order tracking
- Inventory management
- Shop profile editing

### For Customers:
- Browse nearby shops on map
- Square product cards (Blinkit-style)
- Add to cart functionality
- Order tracking

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase Firestore, Firebase Auth
- **Maps**: React Leaflet, OpenStreetMap
- **UI Components**: Lucide React icons
- **Routing**: React Router DOM

## 📱 Features

- **Responsive Design**: Mobile-first approach
- **Real-time Updates**: Live data synchronization
- **Glassmorphism UI**: Modern backdrop-blur effects
- **Toast Notifications**: User feedback system
- **Protected Routes**: Role-based access control

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run seed-shops` - Populate database with shop data
- `npm run seed-catalog` - Populate shops with product catalog
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/               # Route components
├── routes/              # Central route definitions (lazy-loaded)
├── utils/               # Firebase services and utilities
├── firebase.js          # Firebase configuration
├── App.tsx              # App bootstrap
└── main.tsx             # Vite entry

scripts/
└── seedShops.js         # Database seeding script
```

### Deploying to Vercel

This project includes `vercel.json` for SPA routing (rewrites all routes to `index.html`). In Vercel:

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm ci` (or `npm install`)

## 🌟 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.