export type RecipeDefinition = {
  name: string;
  description: string;
  ingredients: string[];
};

// Minimal starter set; can be extended easily.
export const recipeBook: RecipeDefinition[] = [
  {
    name: 'chicken curry',
    description: 'Home-style chicken curry with onions, tomatoes and warm spices.',
    ingredients: [
      'chicken', 'onion', 'tomato', 'ginger', 'garlic', 'turmeric', 'red chilli', 'coriander powder', 'cumin seeds', 'garam masala', 'mustard oil', 'salt'
    ]
  },
  {
    name: 'veg pulao',
    description: 'Aromatic rice cooked with mixed vegetables and spices.',
    ingredients: ['basmati rice', 'peas', 'carrot', 'cumin seeds', 'bay leaves', 'cloves', 'salt']
  },
  {
    name: 'paneer butter masala',
    description: 'Rich and creamy paneer in tomato-butter gravy.',
    ingredients: ['paneer', 'butter', 'cream', 'tomato', 'onion', 'ginger', 'garlic', 'red chilli', 'garam masala', 'salt']
  }
];

export const findRecipe = (query: string): RecipeDefinition | null => {
  const q = query.toLowerCase().trim();
  // direct includes
  for (const r of recipeBook) {
    if (q.includes(r.name)) return r;
  }
  // fallback: choose first that shares a keyword
  const best = recipeBook.find(r => r.name.split(/\s+/).some(w => q.includes(w)));
  return best || null;
};

export const ingredientSynonyms: Record<string, string[]> = {
  tomato: ['tomatoes'],
  onion: ['onions'],
  chilli: ['chili','red chilli','green chillies'],
  'red chilli': ['red chilli powder','chilli'],
  'coriander powder': ['dhania powder','coriander'],
  'cumin seeds': ['jeera','cumin'],
  'mustard oil': ['sarson oil','kachi ghani'],
  chicken: ['chicken breast','chicken legs'],
  peas: ['green peas'],
  carrot: ['carrots'],
  butter: ['amul butter'],
  cream: ['fresh cream']
};


