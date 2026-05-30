import type {
  RecipeAssistantRequest,
  RecipeAssistantResponse,
} from '../types/recipeAssistant';

export async function fetchRecipeCartSuggestions(
  request: RecipeAssistantRequest,
): Promise<RecipeAssistantResponse> {
  const response = await fetch('/api/recipe-cart-suggestions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const payload = (await response.json().catch(() => null)) as RecipeAssistantResponse | null;
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || 'Unable to build recipe cart suggestions.');
  }

  return payload;
}
