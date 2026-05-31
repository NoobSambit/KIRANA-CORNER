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
import { resolveProductImage } from '../utils/productImages';
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
  'dal rice dinner',
  'party snacks for 6',
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
      const result = await fetchRecipeCartSuggestions({ message: trimmed, userLocation, radiusKm });
      setResponse(result);
      setSelections(buildInitialSelections(result));
      setMessage(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to build recipe cart suggestions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void submitPrompt(message);
  };

  const updateSelection = (index: number, patch: Partial<SelectionState>) => {
    setSelections((current) => ({
      ...current,
      [index]: { quantity: 1, included: false, ...current[index], ...patch },
    }));
  };

  const addSelectedToCart = () => {
    selectedItems.forEach(({ match, quantity }) => {
      const image = resolveProductImage(match);
      addToCart({
        id: match.productId,
        productId: match.productId,
        name: match.name,
        price: match.price,
        originalPrice: match.originalPrice,
        image,
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
    <div className="p-4 sm:p-6 rounded-b-2xl" style={{ background: 'var(--bg-card)' }}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <ChefHat className="h-5 w-5 text-orange-500" />
          <div>
            <h2 className="text-[15px] font-extrabold" style={{ color: 'var(--text-primary)' }}>What are you cooking?</h2>
            <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Matched from shops within {radiusKm}km</p>
          </div>
        </div>
        {response && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            {response.nearbyShopCount} shops
          </div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="input-base flex-1 min-h-[44px] text-[14px]"
          placeholder="e.g. chicken biryani for 4"
          maxLength={300}
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="min-h-[44px] inline-flex items-center gap-1.5 px-4 rounded-xl text-white font-bold text-[13px] shadow-sm transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--brand)' }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="hidden sm:inline">Suggest</span>
        </button>
      </form>

      {/* Example prompts */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => void submitPrompt(prompt)}
            disabled={loading}
            className="rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all shadow-sm disabled:opacity-50"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brand)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--brand)';
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--pastel-peach)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)';
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl p-3 text-sm"
          style={{ border: '1px solid var(--error)', background: 'var(--error-bg)', color: 'var(--error)' }}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {response && (
        <div className="mt-2 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">

          {/* Ingredient list */}
          <div className="space-y-3">
            {/* Recipe card */}
            <div className="rounded-2xl p-4 shadow-card"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>{response.recipe.title}</h3>
                  <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {response.recipe.servings} serving{response.recipe.servings === 1 ? '' : 's'}
                  </p>
                </div>
                <span className="flex-none rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{ background: 'var(--pastel-peach)', border: '1px solid var(--border-brand)', color: 'var(--brand)' }}>
                  {response.ingredients.length} ingredient{response.ingredients.length === 1 ? '' : 's'}
                </span>
              </div>
              {response.recipe.steps.length > 0 && (
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[12px] font-medium leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}>
                  {response.recipe.steps.slice(0, 4).map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              )}
            </div>

            {response.ingredients.length === 0 ? (
              <div className="rounded-xl p-4 text-sm font-medium"
                style={{ border: '1px solid var(--warn)', background: 'var(--warn-bg)', color: 'var(--warn)' }}>
                No purchasable ingredients were returned for this request.
              </div>
            ) : (
              response.ingredients.map((ingredient, index) => (
                <IngredientRow
                  key={`${ingredient.intent.name}-${index}`}
                  index={ingredient.intent.name + index}
                  ingredient={ingredient}
                  selection={selections[index]}
                  onSelectionChange={updateSelection}
                  arrayIndex={index}
                />
              ))
            )}
          </div>

          {/* Cart review sidebar */}
          <aside className="rounded-2xl p-4 shadow-card xl:sticky xl:top-24 xl:h-fit"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <h3 className="text-[14px] font-extrabold mb-3" style={{ color: 'var(--text-primary)' }}>Cart Review</h3>
            <div className="space-y-3 mb-4">
              {selectedItems.length === 0 ? (
                <p className="text-[12px] font-medium text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  Select ingredients to add to cart
                </p>
              ) : (
                selectedItems.map(({ match, quantity }) => (
                  <div key={match.productId} className="flex items-center gap-2.5">
                    <img
                      src={resolveProductImage(match)}
                      alt={match.name}
                      className="h-10 w-10 rounded-lg object-contain flex-shrink-0"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>{match.name}</p>
                      <p className="text-[11px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {quantity} × ₹{match.price}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between text-[13px] mb-3">
                <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Selected total</span>
                <span className="text-[16px] font-extrabold" style={{ color: 'var(--text-primary)' }}>₹{selectedTotal}</span>
              </div>
              <button
                type="button"
                onClick={addSelectedToCart}
                disabled={selectedItems.length === 0}
                className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl font-bold text-[13px] shadow-orange transition-all hover:-translate-y-0.5 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                style={{
                  background: selectedItems.length === 0 ? 'var(--bg-elevated)' : 'var(--brand)',
                  color: selectedItems.length === 0 ? 'var(--text-muted)' : '#fff',
                }}
              >
                <ShoppingCart className="h-4 w-4" />
                Add Selected ({selectedItems.length})
              </button>
              {added && (
                <div className="mt-3 flex items-center gap-2 text-[12px] font-bold p-2 rounded-lg border justify-center"
                  style={{ color: 'var(--success)', background: 'var(--success-bg)', borderColor: 'var(--success)' }}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Added to cart!
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

// ─── IngredientRow ────────────────────────────────────────────────────────────
interface IngredientRowProps {
  index: string;
  arrayIndex: number;
  ingredient: IngredientSuggestion;
  selection?: SelectionState;
  onSelectionChange: (index: number, patch: Partial<SelectionState>) => void;
}

const IngredientRow: React.FC<IngredientRowProps> = ({ arrayIndex, ingredient, selection, onSelectionChange }) => {
  const selectedMatch = ingredient.matches.find((m) => m.productId === selection?.productId);
  const statusConfig = getStatusConfig(ingredient.status);

  return (
    <div className="rounded-2xl p-4 shadow-card"
      style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-extrabold text-[14px]" style={{ color: 'var(--text-primary)' }}>{ingredient.intent.name}</h4>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${statusConfig.className}`}>
              {statusConfig.label}
            </span>
          </div>
          <p className="mt-0.5 text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
            {formatIntentQuantity(ingredient.intent)}
          </p>
        </div>
        {selectedMatch && (
          <label className="inline-flex w-fit items-center gap-2 text-[12px] font-bold cursor-pointer flex-shrink-0"
            style={{ color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={selection?.included || false}
              onChange={(e) => onSelectionChange(arrayIndex, { included: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400 transition-colors"
            />
            Include
          </label>
        )}
      </div>

      {/* Match options */}
      {ingredient.matches.length === 0 ? (
        <div className="flex items-start gap-2 rounded-xl p-3 text-[12px] font-medium"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
          <span>No nearby in-stock product matched this ingredient.</span>
        </div>
      ) : (
        <div className="grid gap-2">
          {ingredient.matches.map((match) => {
            const selected = selection?.productId === match.productId;
            return (
              <button
                key={match.productId}
                type="button"
                onClick={() => onSelectionChange(arrayIndex, {
                  productId: match.productId,
                  quantity: Math.max(1, match.recommendedQuantity || 1),
                  included: ingredient.status === 'matched',
                })}
                className="flex items-center gap-3 rounded-xl p-3 text-left transition-all duration-200 min-h-[76px]"
                style={{
                  border: selected ? '1px solid var(--brand)' : '1px solid var(--border)',
                  background: selected ? 'var(--pastel-peach)' : 'var(--bg-elevated)',
                }}
              >
                <div className="h-14 w-14 shrink-0 rounded-lg flex items-center justify-center p-1"
                  style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                  <img
                    src={resolveProductImage(match)}
                    alt={match.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-[12px] font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>{match.name}</p>
                      <p className="mt-0.5 text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                        {match.shopName} · {formatDistance(match.distanceKm)}
                      </p>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-[13px] font-extrabold" style={{ color: 'var(--text-primary)' }}>₹{match.price}</p>
                      <p className="text-[10px] font-bold px-1.5 py-0.5 rounded inline-block mt-0.5"
                        style={
                          match.confidence >= 80
                            ? { color: 'var(--success)', background: 'var(--success-bg)' }
                            : match.confidence >= 50
                            ? { color: 'var(--warn)', background: 'var(--warn-bg)' }
                            : { color: 'var(--text-muted)', background: 'var(--bg-elevated)' }
                        }>
                        {match.confidence}% match
                      </p>
                    </div>
                  </div>
                  <p className="mt-0.5 text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {formatPack(match)} · {match.stock} in stock
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Quantity stepper */}
      {selectedMatch && (
        <div className="mt-3 flex items-center justify-between rounded-xl px-3 py-2.5"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <span className="text-[12px] font-bold" style={{ color: 'var(--text-secondary)' }}>Quantity</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelectionChange(arrayIndex, { quantity: Math.max(1, (selection?.quantity || 1) - 1) })}
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm transition"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              title="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <input
              type="number"
              min={1}
              max={selectedMatch.stock}
              value={selection?.quantity || 1}
              onChange={(e) => onSelectionChange(arrayIndex, {
                quantity: clampQuantity(Number(e.target.value), selectedMatch.stock),
              })}
              className="h-8 w-11 rounded-lg border-none bg-transparent text-center text-[13px] font-bold focus:ring-0 p-0"
              style={{ color: 'var(--text-primary)' }}
            />
            <button
              type="button"
              onClick={() => onSelectionChange(arrayIndex, { quantity: Math.min(selectedMatch.stock, (selection?.quantity || 1) + 1) })}
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm transition"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              title="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
      acc[index] = { quantity: 1, included: false };
    }
    return acc;
  }, {});
}

function getStatusConfig(status: IngredientSuggestion['status']) {
  if (status === 'matched')       return { label: 'Matched',        className: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30' };
  if (status === 'low_confidence') return { label: 'Possible match', className: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30'       };
  return                                   { label: 'Not found',     className: 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-zinc-700'         };
}

function formatIntentQuantity(intent: IngredientSuggestion['intent']): string {
  if (!intent.quantity || !intent.unit) return 'Pack size based';
  return `${intent.quantity}${intent.unit}`;
}

function formatPack(match: ProductMatch): string {
  if (match.packSize?.quantity && match.packSize?.unit) return `${match.packSize.quantity}${match.packSize.unit}`;
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

export default RecipeAssistant;
