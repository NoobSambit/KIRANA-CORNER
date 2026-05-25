# Firestore Seed Scripts

This folder contains local Firestore maintenance/seed scripts. They use Firebase Admin credentials from `.env.local`:

```txt
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/firebase-adminsdk.json
FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH=/absolute/path/to/firebase-adminsdk.json
```

The JSON key and `.env.local` are ignored by git.

## Commands

Preview the generated dataset without touching Firestore:

```bash
npm run seed:dry-run
```

Fresh destructive reseed:

```bash
npm run seed:fresh
```

`seed:fresh` deletes:

- `products`
- `shops`
- `ingredients`
- `recipeUseCases`
- legacy `shops/{shopId}/catalog` documents via collection group

Then it writes the new AI-friendly canonical schema.

## Dataset Shape

Default `balanced` profile creates dense Kolkata coverage:

- neighborhood clusters across Kolkata/Howrah/New Town
- multiple shop types in each cluster
- top-level canonical `products`
- `ingredients` dictionary for deterministic recipe matching
- `recipeUseCases` docs for common household and party prompts

The script batches writes at 400 docs per commit with a small delay to avoid unnecessary Firestore pressure.

## Optional Flags

```bash
node scripts/seedFreshData.js --dry-run --profile compact
node scripts/seedFreshData.js --dry-run --profile dense
node scripts/seedFreshData.js --write --fresh --confirm-delete --batch-delay-ms 250
```

Use `compact` if you are worried about Firestore free-tier daily write budget. Use `dense` only when you are comfortable spending more writes.

## Future Expansion Guide

The seed system is intentionally dictionary-driven. Do not manually create thousands of product docs. Add canonical inventory once, then let the generator distribute it across shops and neighborhoods.

Main extension points in `seedFreshData.js`:

- `KOLKATA_NEIGHBORHOODS`: add new areas or refine coordinates.
- `BASE_STORE_PROFILES`: controls which shop types appear in every neighborhood.
- `STORE_PROFILE_META`: defines each shop type, its categories, specialties, and per-category product limits.
- `INGREDIENT_CATALOG`: canonical item dictionary used to generate `ingredients` and `products`.
- `RECIPE_USE_CASES`: common chatbot prompts and their required ingredient IDs.
- `CATEGORY_IMAGE_URLS`: stable fallback images per category.
- `PRODUCT_IMAGE_OVERRIDES`: selected specific product image URLs.

## Adding A New Product Category

Example: add `Baby Care`.

1. Add items to `INGREDIENT_CATALOG`:

```js
p('baby diapers medium', 'Baby Care', 'Diapers', 'count', { quantity: 20, unit: 'pcs' }, 320, ['diapers', 'nappies'], ['baby'], ['baby-care'])
```

2. Add category image fallback:

```js
'Baby Care': 'https://...'
```

3. Add category brands:

```js
'Baby Care': ['Pampers', 'Huggies', 'MamyPoko', 'Local Select']
```

4. Add the category to relevant store profiles:

```js
pharmacy_personal: {
  categories: ['Medical Store', 'Personal Care', 'Household', 'Baby Care']
}
```

5. Run:

```bash
npm run seed:dry-run
```

Check product counts before running a destructive seed.

## Adding A New Chatbot Use Case

Every use case should reference `INGREDIENT_CATALOG` IDs. The script validates these references during dry run.

Example:

```js
{
  id: 'baby-care-emergency',
  title: 'Baby care essentials for tonight',
  aliases: ['baby supplies', 'diapers and wipes'],
  requiredIngredientIds: ['baby-diapers-medium', 'baby-wipes', 'baby-food']
}
```

If an ID is wrong, `npm run seed:dry-run` fails before touching Firestore.

## Matching Metadata Rules

For every canonical item, keep these fields useful:

- `canonicalName`: what the system should consider the item.
- `aliases`: local names, Hindi/Bengali spellings, common user wording.
- `tags`: recipe/use-case terms such as `biryani`, `party`, `breakfast`.
- `substituteGroupIds`: groups for acceptable substitutions.
- `unitType` and `packSize`: needed for quantity matching and overbuy display.

Good example:

```js
p(
  'curd',
  'Dairy',
  'Curd',
  'weight',
  { quantity: 500, unit: 'g' },
  45,
  ['dahi', 'yogurt', 'doi'],
  ['biryani', 'raita', 'fish curry'],
  ['sour-dairy']
)
```

Poor example:

```js
p('masala', 'Spices', ...)
```

That is too generic for AI matching. Prefer `garam masala`, `biryani masala`, `fish curry masala`, etc.

## Firestore Free-Tier Guardrails

The default `balanced` profile is meant to be useful without being reckless. Still, each fresh seed consumes deletes plus writes.

Before running `seed:fresh`, check:

- total writes from dry run
- expected existing docs to delete
- whether you already used Firestore heavily that day

Use `compact` for cheaper reseeds:

```bash
node scripts/seedFreshData.js --dry-run --profile compact
node scripts/seedFreshData.js --write --fresh --confirm-delete --profile compact
```

Use `--batch-delay-ms` to slow writes if needed:

```bash
node scripts/seedFreshData.js --write --fresh --confirm-delete --batch-delay-ms 500
```

## Scaling Roadmap

The current single-file script is fine for MVP. Once the catalog grows past roughly 300 canonical items, split the data into modules:

```txt
scripts/seed/
  index.js
  data/
    neighborhoods.js
    storeProfiles.js
    recipeUseCases.js
    images.js
    ingredients/
      staples.js
      spices.js
      vegetables.js
      dairy.js
      meatFish.js
      babyCare.js
      poojaFestival.js
      petCare.js
      household.js
      personalCare.js
  utils/
    normalize.js
    firestore.js
```

Recommended next categories:

- `Baby Care`
- `Pooja & Festival`
- `Pet Care`
- `Stationery`
- `Bengali Specials`
- `South Indian Pantry`
- `Breakfast & Tiffin`
- `OTC Medicine`
- `Home Hardware`

## Image Strategy

Prefer this order:

1. Product-specific image override for common high-visibility SKUs.
2. Stable category-level image.
3. UI fallback SVG in `ProductCard`.

Avoid relying on thousands of scraped product image URLs. They break often, can block hotlinking, and make seed maintenance painful.

## Current Limitation

This seed improves data realism, but it does not make the whole app production-scale by itself. The app still needs:

- geohash/grid querying for large-scale location search
- multi-shop checkout handling
- transactional stock decrement
- Firestore indexes for the final chatbot matching queries
- admin tooling for correcting aliases and bad matches
