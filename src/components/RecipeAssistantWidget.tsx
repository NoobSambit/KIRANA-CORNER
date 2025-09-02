import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X } from 'lucide-react';
import { useCart } from './CartContext';
import { allCatalogItems, productCatalog, CatalogItem } from '../utils/catalog';
import { findRecipe, ingredientSynonyms } from '../utils/recipes';

type ChatRole = 'user' | 'assistant';
type ChatMessage = { id: string; role: ChatRole; content: string };

const normalize = (s: string) => s.toLowerCase().trim();

const tokenize = (s: string) => normalize(s).split(/[^a-z0-9+]+/).filter(Boolean);

const matchCatalog = (needles: string[]) => {
  const catalog = allCatalogItems();
  const found: { item: CatalogItem; category: string }[] = [];
  const remaining = new Set(needles.map(normalize));

  for (const { item, category } of catalog) {
    const name = normalize(item.name);
    for (const n of Array.from(remaining)) {
      const syns = ingredientSynonyms[n] || [];
      if (name.includes(n) || syns.some((s) => name.includes(normalize(s)))) {
        found.push({ item, category });
        remaining.delete(n);
      }
    }
  }
  return { found, missing: Array.from(remaining) };
};

const renderMarkdown = (recipeName: string, description: string, inStock: { item: CatalogItem; category: string }[], missing: string[]) => {
  const lines: string[] = [];
  lines.push(`# ${recipeName}`);
  lines.push('');
  lines.push(description);
  lines.push('');
  if (inStock.length) {
    lines.push('Ingredients in your catalog:');
    inStock.forEach(({ item, category }) => lines.push(`- ${item.name} (₹${item.price}) — ${category}`));
    lines.push('');
  }
  if (missing.length) {
    lines.push('Missing ingredients:');
    missing.forEach((m) => lines.push(`- ${m}`));
    lines.push('');
  }
  return lines.join('\n');
};

const RecipeAssistantWidget: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { addToCart, openCartDrawer } = useCart();

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [messages]);

  const append = useCallback((m: ChatMessage) => setMessages((prev) => [...prev, m]), []);

  const handleAddAll = useCallback((content: string) => {
    // Parse the assistant message for items to add
    const lines = content.split('\n').filter((l) => l.startsWith('- '));
    const names = lines.map((l) => l.replace(/^-\s*/, '').split(' (')[0]);
    const catalog = allCatalogItems();
    const items = catalog.filter(({ item }) => names.some((n) => normalize(item.name) === normalize(n)));
    items.forEach(({ item }) => addToCart({ id: item.name, name: item.name, price: item.price, image: item.image, quantity: 1, shop: 'Catalog' } as any));
    openCartDrawer();
  }, [addToCart, openCartDrawer]);

  const send = useCallback(async (text: string) => {
    if (!text.trim()) return;
    append({ id: crypto.randomUUID(), role: 'user', content: text });
    setInput('');
    setLoading(true);
    try {
      const recipe = findRecipe(text) || { name: text, description: 'Here is a suggested list based on your request.', ingredients: tokenize(text) };
      const { found, missing } = matchCatalog(recipe.ingredients);
      const md = renderMarkdown(recipe.name, recipe.description, found, missing);
      append({ id: crypto.randomUUID(), role: 'assistant', content: md });
    } finally {
      setLoading(false);
    }
  }, [append]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25 }}
      className="fixed bottom-24 right-5 z-50 w-[min(92vw,420px)] h-[min(70vh,640px)] rounded-2xl shadow-2xl border border-white/15 bg-gradient-to-b from-white/75 to-white/60 dark:from-slate-900/80 dark:to-slate-900/70 backdrop-blur-xl overflow-hidden"
    >
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border-b border-white/20 px-4 py-3 flex items-center justify-between rounded-t-2xl">
        <div>
          <div className="text-slate-900 dark:text-white font-semibold">Recipe Assistant</div>
          <div className="text-xs text-slate-500">Local, fast, and private. No external AI calls.</div>
        </div>
        <button onClick={onClose} aria-label="Close" title="Close" className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
          <X aria-hidden className="h-5 w-5" />
        </button>
      </div>

      <div ref={scrollerRef} className="px-3 pb-20 pt-2 h-[calc(100%-112px)] overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            Ask for a recipe (e.g., "chicken curry") and I’ll match ingredients from our catalog, list what’s missing, and let you add items to cart.
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-gradient-to-br from-orange-500 to-green-500 text-white' : 'bg-white/80 dark:bg-white/5 border border-white/10 text-slate-900 dark:text-slate-100'}`}>
              {m.content}
              {m.role === 'assistant' && (
                <div className="mt-2">
                  <button onClick={() => handleAddAll(m.content)} className="text-xs rounded-md bg-green-600 text-white px-2 py-1 hover:bg-green-700">Add All In-Stock Items</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-xs text-slate-500">Thinking…</div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-t border-white/15">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(input); }}
            placeholder="Ask for a recipe…"
            className="flex-1 rounded-xl px-3 py-2 bg-white/80 dark:bg-white/10 border border-white/20 outline-none text-sm"
          />
          <button
            disabled={!input.trim()}
            onClick={() => send(input)}
            title="Send"
            aria-label="Send"
            className="rounded-xl bg-green-600 text-white px-3 py-2 disabled:opacity-50"
          >
            <Send aria-hidden className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const RecipeAssistantLauncherButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    aria-label="Open Recipe Assistant"
    onClick={onClick}
    className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-orange-500 to-green-500 text-white shadow-lg shadow-orange-500/30 flex items-center justify-center"
  >
    <div aria-hidden className="absolute inset-0 rounded-full animate-ping bg-green-500/20" />
    <Bot aria-hidden className="relative z-10 h-6 w-6" />
  </button>
);

export default RecipeAssistantWidget;


