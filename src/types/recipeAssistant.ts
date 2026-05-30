export interface RecipeAssistantLocation {
  lat: number;
  lng: number;
}

export interface RecipeAssistantRequest {
  message: string;
  userLocation: RecipeAssistantLocation;
  radiusKm?: number;
  servings?: number;
  dietaryPreferences?: string[];
}

export interface IngredientIntent {
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  acceptableSubstitutes?: string[];
  required?: boolean;
}

export interface ProductMatch {
  productId: string;
  shopId: string;
  shopName: string;
  name: string;
  price: number;
  originalPrice?: number;
  stock: number;
  image: string;
  rating?: number;
  category?: string;
  unitType?: string;
  packSize?: {
    quantity?: number;
    unit?: string;
  };
  distanceKm: number;
  confidence: number;
  recommendedQuantity: number;
  matchReasons: string[];
}

export interface IngredientSuggestion {
  intent: IngredientIntent;
  status: 'matched' | 'low_confidence' | 'unmatched';
  matches: ProductMatch[];
}

export interface RecipeAssistantResponse {
  success: boolean;
  recipe: {
    title: string;
    servings: number;
    steps: string[];
    notes?: string[];
  };
  ingredients: IngredientSuggestion[];
  unmatched: IngredientSuggestion[];
  nearbyShopCount: number;
  radiusKm: number;
  error?: string;
}
