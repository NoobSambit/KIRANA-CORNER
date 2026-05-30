import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChefHat,
  Loader2,
  Minus,
  Plus,
  Send,
  ShoppingCart,
  XCircle,
} from 'lucide-react';
import { useCart } from './CartContext';
import { fetchRecipeCartSuggestions } from '../utils/recipeAssistantClient';
import type {
  IngredientSuggestion,
  ProductMatch,
  RecipeAssistantLocation,
  RecipeAssistantResponse,
} from '../types/recipeAssistant';

interface RecipeAssistantProps {
  userLocation: RecipeAssistantLocation;
  radiusKm: number;
}

interface SelectionState {
  productId?: string;
  quantity: number;
  included: boolean;
}

const EXAMPLE_PROMPTS = [
  'chicken biryani for 4',
  'Bengali fish curry',
  'paneer butter masala',
  'small party tonight for 6 people',
  'simple dal rice dinner',
];

const RecipeAssistant: React.FC<RecipeAssistantProps> = ({ userLocation, radiusKm }) => {
  const { addToCart } = useCart();
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [response, setResponse] = React.useState<RecipeAssistantResponse | null>(null);
  const [selections, setSelections] = React.useState<Record<number, SelectionState>>({});
  const [added, setAdded] = React.useState(false);

  const selectedItems = React.useMemo(() => {
    if (!response) return [];
    return response.ingredients
      .map((ingredient, index) => {
        const selection = selections[index];
        const match = ingredient.matches.find((item) => item.productId === selection?.productId);
        return selection?.included && match ? { ingredient, match, quantity: selection.quantity } : null;
      })
      .filter((item): item is { ingredient: IngredientSuggestion; match: ProductMatch; quantity: number } =>
        Boolean(item),
      );
  }, [response, selections]);

  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.match.price * item.quantity, 0);

  const submitPrompt = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setAdded(false);
    try {
      const result = await fetchRecipeCartSuggestions({
        message: trimmed,
        userLocation,
        radiusKm,
      });
      setResponse(result);
      setSelections(buildInitialSelections(result));
      setMessage(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to build recipe cart suggestions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitPrompt(message);
  };

  const updateSelection = (index: number, patch: Partial<SelectionState>) => {
    setSelections((current) => ({
      ...current,
      [index]: {
        quantity: 1,
        included: false,
        ...current[index],
        ...patch,
      },
    }));
  };

  const addSelectedToCart = () => {
    selectedItems.forEach(({ match, quantity }) => {
      addToCart({
        id: match.productId,
        productId: match.productId,
        name: match.name,
        price: match.price,
        originalPrice: match.originalPrice,
        image: match.image || fallbackProductImage(match.name),
        quantity,
        shop: match.shopName,
        shopId: match.shopId,
        shopName: match.shopName,
        unit: formatPack(match),
        recipeAssistant: true,
      });
    });
    if (selectedItems.length > 0) setAdded(true);
  };

  return (
    <section className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20 dark:border-white/10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Recipe Assistant</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Matched from shops within {radiusKm}km
              </p>
            </div>
          </div>
        </div>

        {response && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span>{response.nearbyShopCount} nearby shops checked</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col sm:flex-row gap-3">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-[44px] flex-1 rounded-xl border border-orange-200 dark:border-white/10 bg-white/90 dark:bg-slate-950/60 px-4 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="chicken biryani for 4"
          maxLength={300}
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 font-semibold text-white shadow-md transition hover:from-orange-600 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span>Suggest</span>
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => void submitPrompt(prompt)}
            disabled={loading}
            className="rounded-full border border-orange-200 dark:border-white/10 bg-orange-50/80 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-orange-700 dark:text-orange-200 transition hover:bg-orange-100 dark:hover:bg-white/10 disabled:opacity-60"
          >
            {prompt}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {response && (
        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white/75 p-4 dark:border-white/10 dark:bg-slate-950/40">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{response.recipe.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {response.recipe.servings} serving{response.recipe.servings === 1 ? '' : 's'}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-500/20 dark:text-orange-200">
                  {response.ingredients.length} ingredient{response.ingredients.length === 1 ? '' : 's'}
                </span>
              </div>

              {response.recipe.steps.length > 0 && (
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
                  {response.recipe.steps.slice(0, 4).map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              )}
            </div>

            {response.ingredients.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                No purchasable ingredients were returned for this request.
              </div>
            ) : (
              response.ingredients.map((ingredient, index) => (
                <IngredientRow
                  key={`${ingredient.intent.name}-${index}`}
                  index={index}
                  ingredient={ingredient}
                  selection={selections[index]}
                  onSelectionChange={updateSelection}
                />
              ))
            )}
          </div>

          <aside className="rounded-xl border border-slate-200 bg-white/75 p-4 dark:border-white/10 dark:bg-slate-950/40 xl:sticky xl:top-24 xl:h-fit">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Cart Review</h3>
            <div className="mt-3 space-y-3">
              {selectedItems.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">No products selected.</p>
              ) : (
                selectedItems.map(({ match, quantity }) => (
                  <div key={match.productId} className="flex items-center gap-3">
                    <img
                      src={match.image || fallbackProductImage(match.name)}
                      alt={match.name}
                      className="h-12 w-12 rounded-lg object-cover bg-orange-100"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{match.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {quantity} x ₹{match.price}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">Selected total</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">₹{selectedTotal}</span>
              </div>
              <button
                type="button"
                onClick={addSelectedToCart}
                disabled={selectedItems.length === 0}
                className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-4 font-semibold text-white shadow-md transition hover:from-green-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Add Selected</span>
              </button>
              {added && (
                <div className="mt-3 flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Selected products added to cart.</span>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};

interface IngredientRowProps {
  index: number;
  ingredient: IngredientSuggestion;
  selection?: SelectionState;
  onSelectionChange: (index: number, patch: Partial<SelectionState>) => void;
}

const IngredientRow: React.FC<IngredientRowProps> = ({
  index,
  ingredient,
  selection,
  onSelectionChange,
}) => {
  const selectedMatch = ingredient.matches.find((match) => match.productId === selection?.productId);
  const statusConfig = getStatusConfig(ingredient.status);

  return (
    <div className="rounded-xl border border-slate-200 bg-white/75 p-4 dark:border-white/10 dark:bg-slate-950/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-slate-900 dark:text-white">{ingredient.intent.name}</h4>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig.className}`}>
              {statusConfig.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {formatIntentQuantity(ingredient.intent)}
          </p>
        </div>

        {selectedMatch && (
          <label className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={selection?.included || false}
              onChange={(event) => onSelectionChange(index, { included: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
            />
            Select
          </label>
        )}
      </div>

      {ingredient.matches.length === 0 ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-100 p-3 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <span>No nearby in-stock product matched this ingredient.</span>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {ingredient.matches.map((match) => {
            const selected = selection?.productId === match.productId;
            return (
              <button
                key={match.productId}
                type="button"
                onClick={() =>
                  onSelectionChange(index, {
                    productId: match.productId,
                    quantity: Math.max(1, match.recommendedQuantity || 1),
                    included: ingredient.status === 'matched',
                  })
                }
                className={`flex min-h-[88px] items-center gap-3 rounded-xl border p-3 text-left transition ${
                  selected
                    ? 'border-orange-400 bg-orange-50 dark:border-orange-400 dark:bg-orange-500/10'
                    : 'border-slate-200 bg-white/80 hover:border-orange-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-orange-400'
                }`}
              >
                <img
                  src={match.image || fallbackProductImage(match.name)}
                  alt={match.name}
                  className="h-16 w-16 shrink-0 rounded-lg object-cover bg-orange-100"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">{match.name}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {match.shopName} · {formatDistance(match.distanceKm)}
                      </p>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">₹{match.price}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{match.confidence}% match</p>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatPack(match)} · {match.stock} in stock
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedMatch && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-100 p-2 dark:bg-white/5">
          <span className="px-2 text-sm font-medium text-slate-700 dark:text-slate-200">Quantity</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectionChange(index, { quantity: Math.max(1, (selection?.quantity || 1) - 1) })}
              className="rounded-lg bg-white p-2 text-slate-700 shadow-sm transition hover:bg-orange-50 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              title="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              min={1}
              max={selectedMatch.stock}
              value={selection?.quantity || 1}
              onChange={(event) =>
                onSelectionChange(index, {
                  quantity: clampQuantity(Number(event.target.value), selectedMatch.stock),
                })
              }
              className="h-10 w-16 rounded-lg border border-slate-200 bg-white text-center text-sm font-bold text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />
            <button
              type="button"
              onClick={() =>
                onSelectionChange(index, {
                  quantity: Math.min(selectedMatch.stock, (selection?.quantity || 1) + 1),
                })
              }
              className="rounded-lg bg-white p-2 text-slate-700 shadow-sm transition hover:bg-orange-50 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              title="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function buildInitialSelections(response: RecipeAssistantResponse): Record<number, SelectionState> {
  return response.ingredients.reduce<Record<number, SelectionState>>((acc, ingredient, index) => {
    const primary = ingredient.matches[0];
    if (primary) {
      acc[index] = {
        productId: primary.productId,
        quantity: Math.max(1, primary.recommendedQuantity || 1),
        included: ingredient.status === 'matched',
      };
    } else {
      acc[index] = {
        quantity: 1,
        included: false,
      };
    }
    return acc;
  }, {});
}

function getStatusConfig(status: IngredientSuggestion['status']) {
  if (status === 'matched') {
    return {
      label: 'Matched',
      className: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200',
    };
  }
  if (status === 'low_confidence') {
    return {
      label: 'Possible match',
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
    };
  }
  return {
    label: 'Not found',
    className: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
  };
}

function formatIntentQuantity(intent: IngredientSuggestion['intent']): string {
  if (!intent.quantity || !intent.unit) return 'Quantity decided from available pack size';
  return `${intent.quantity}${intent.unit}`;
}

function formatPack(match: ProductMatch): string {
  if (match.packSize?.quantity && match.packSize?.unit) {
    return `${match.packSize.quantity}${match.packSize.unit}`;
  }
  return match.unitType || '1 unit';
}

function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`;
  return `${distanceKm.toFixed(1)}km`;
}

function clampQuantity(value: number, stock: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(1, Math.floor(value)), Math.max(1, stock));
}

function fallbackProductImage(name: string): string {
  const label = (name || 'Product').slice(0, 24).replace(/[<>&'"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#fff7ed"/><rect x="35" y="42" width="230" height="216" rx="24" fill="#f97316" opacity=".9"/><circle cx="150" cy="112" r="40" fill="#ffffff" opacity=".9"/><path d="M88 204c16-40 39-60 69-60s53 20 69 60" fill="none" stroke="#ffffff" stroke-width="18" stroke-linecap="round"/><text x="150" y="254" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#ffffff">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default RecipeAssistant;
