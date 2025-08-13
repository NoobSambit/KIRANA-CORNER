import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Image as ImageIcon, Send, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useCart } from './CartContext';

const API_BASE = (() => {
  // If VITE_API_BASE_URL is set, use it
  if (import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }
  
  // Auto-detect API base based on current domain
  const currentHost = window.location.hostname;
  const currentProtocol = window.location.protocol;
  
  if (currentHost.includes('vercel.app')) {
    // For Vercel deployments, use the main domain for API calls
    if (currentHost.includes('kirana-corner')) {
      return `${currentProtocol}//kirana-corner.vercel.app`;
    }
  }
  
  // Fallback to current origin
  return window.location.origin;
})();

const apiUrl = (path: string) => {
  const fullUrl = `${API_BASE}${path}`;
  
  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log('API Call Debug:', {
      path,
      API_BASE,
      fullUrl,
      currentOrigin: window.location.origin
    });
  }
  
  return fullUrl;
};

type ChatRole = 'user' | 'assistant' | 'system';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  data?: unknown;
}

interface StockIngredientItem {
  id: string;
  name: string;
  price: number;
  quantityAvailable?: number;
  image?: string;
  shopId?: string;
  shopName?: string;
}

interface RecipeResponsePayload {
  recipeTitle: string;
  recipeDescription: string;
  inStock: StockIngredientItem[];
  missing: string[];
  ingredients?: string[];
}

const quickPrompts = [
  'Find a recipe from my stock',
  'Suggest dinner for tonight',
  'Healthy breakfast ideas',
  'Show me popular recipes nearby',
  'Test API Connection'
];

const FloatingPulseButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    aria-label="Open Kirana AI"
    onClick={onClick}
    className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-orange-500 to-green-500 text-white shadow-lg shadow-orange-500/30 flex items-center justify-center"
  >
    <div aria-hidden className="absolute inset-0 rounded-full animate-ping bg-green-500/20" />
    <Bot aria-hidden className="relative z-10 h-6 w-6" />
  </button>
);

const HeaderBar: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="sticky top-0 z-10 backdrop-blur-md bg-white/70 dark:bg-slate-900/60 border-b border-white/20 px-4 py-3 flex items-center justify-between rounded-t-2xl">
    <div>
      <div className="text-slate-900 dark:text-white font-semibold">Kirana AI</div>
      <div className="text-xs text-slate-500">Find recipes, shop smart 🍳</div>
    </div>
    <button onClick={onClose} aria-label="Close" title="Close" className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
      <X aria-hidden className="h-5 w-5" />
    </button>
  </div>
);

const QuickActions: React.FC<{ onSend: (text: string) => void }> = ({ onSend }) => (
  <div className="px-3 pt-2 pb-1 overflow-x-auto no-scrollbar flex gap-2">
    {quickPrompts.map((p) => (
      <button
        key={p}
        onClick={() => onSend(p)}
        className="shrink-0 rounded-full border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-1 text-sm hover:bg-white/90 dark:hover:bg-white/10"
      >
        {p}
      </button>
    ))}
  </div>
);

const IngredientList: React.FC<{
  payload: RecipeResponsePayload;
  onAddOne: (item: StockIngredientItem) => void;
  onAddAll: (items: StockIngredientItem[]) => void;
}> = ({ payload, onAddOne, onAddAll }) => {
  const { inStock, missing } = payload;
  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Ingredients in stock</div>
        {inStock.length > 0 && (
          <button
            onClick={() => onAddAll(inStock)}
            className="text-xs rounded-md bg-green-600 text-white px-2 py-1 hover:bg-green-700"
          >
            Add All to Cart
          </button>
        )}
      </div>
      <div className="space-y-2">
        {inStock.map((i) => (
          <div key={i.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-white/10 p-2 bg-white/60 dark:bg-white/5">
            <div className="flex items-center gap-2">
              {i.image && <img src={i.image} alt={i.name} className="h-8 w-8 rounded object-cover" />}
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">{i.name}</div>
                <div className="text-xs text-slate-500">₹{i.price}{i.shopName ? ` • ${i.shopName}` : ''}</div>
              </div>
            </div>
            <button onClick={() => onAddOne(i)} className="text-xs rounded-md bg-orange-600 text-white px-2 py-1 hover:bg-orange-700">Add</button>
          </div>
        ))}
      </div>
      {missing.length > 0 && (
        <div className="pt-2">
          <div className="text-sm font-semibold">Missing ingredients</div>
          <ul className="mt-1 text-xs text-slate-600 dark:text-slate-300 list-disc pl-5">
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const AIChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { addToCart, openCartDrawer } = useCart();

  useEffect(() => {
    if (open) scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [messages, open]);

  const append = useCallback((m: ChatMessage) => setMessages((prev) => [...prev, m]), []);

  const sendText = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    // Handle test API connection
    if (text === 'Test API Connection') {
      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text };
      append(userMsg);
      setLoading(true);
      
      try {
        const testEndpoint = apiUrl('/api/debug');
        console.log('Testing API connection to:', testEndpoint);
        
        const res = await fetch(testEndpoint, { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          append({ 
            id: crypto.randomUUID(), 
            role: 'assistant', 
            content: `✅ API Connection Test Successful!\n\nAPI Base: ${API_BASE}\nEndpoint: ${testEndpoint}\nResponse: ${JSON.stringify(data, null, 2)}` 
          });
        } else {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        append({ 
          id: crypto.randomUUID(), 
          role: 'assistant', 
          content: `❌ API Connection Test Failed!\n\nAPI Base: ${API_BASE}\nError: ${message}` 
        });
      } finally {
        setLoading(false);
      }
      return;
    }
    
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text };
    append(userMsg);
    setInput('');
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const clientToken = import.meta.env?.VITE_AI_API_TOKEN;
      if (clientToken) headers['x-ai-token'] = String(clientToken);
      
      const apiEndpoint = apiUrl('/api/ai/recipe');
      console.log('Making API call to:', apiEndpoint);
      
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: text })
      });
      if (!res.ok) {
        let msg = 'AI error';
        try { 
          const err = await res.json(); 
          msg = err.error || msg; 
        } catch {
          // Ignore JSON parsing errors, use default message
        }
        
        // Provide more specific error messages
        if (res.status === 405) {
          msg = 'API method not allowed. This usually means the Vercel dev server is not running.';
        } else if (res.status === 404) {
          msg = 'API endpoint not found. Check if the Vercel dev server is running.';
        } else if (res.status === 500) {
          msg = 'Server error. Check the Vercel dev server logs.';
        }
        
        throw new Error(msg);
      }
      const data = (await res.json()) as { markdown: string; recipe?: RecipeResponsePayload };
      let payload = data.recipe;
      if (payload && payload.ingredients && (!payload.inStock || payload.inStock.length === 0)) {
        try {
          const res2 = await fetch(apiUrl('/api/ai/stock-match'), { method: 'POST', headers, body: JSON.stringify({ ingredients: payload.ingredients }) });
          if (res2.ok) {
            const j = await res2.json();
            payload = { ...payload, inStock: j.inStock || [], missing: j.missing || [] } as RecipeResponsePayload;
          }
        } catch (err) { console.error('stock-match failed', err); }
      }
      const assistantMsg: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: data.markdown, data: payload };
      append(assistantMsg);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('API call failed:', {
        endpoint: apiUrl('/api/ai/recipe'),
        error: err,
        message
      });
      append({ id: crypto.randomUUID(), role: 'assistant', content: `Sorry, I had trouble fetching that. ${message}` });
    } finally {
      setLoading(false);
    }
  }, [append]);

  const onUploadImage = useCallback(async (file: File) => {
    setUploading(true);
    append({ id: crypto.randomUUID(), role: 'user', content: `Uploaded image: ${file.name}` });
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const clientToken = import.meta.env?.VITE_AI_API_TOKEN;
      if (clientToken) headers['x-ai-token'] = String(clientToken);
      const res = await fetch(apiUrl('/api/ai/vision'), { method: 'POST', headers, body: JSON.stringify({ dataUrl: base64 }) });
      if (!res.ok) throw new Error('Vision error');
      const data = (await res.json()) as { markdown: string; recipe?: RecipeResponsePayload };
      append({ id: crypto.randomUUID(), role: 'assistant', content: data.markdown, data: data.recipe });
    } catch {
      append({ id: crypto.randomUUID(), role: 'assistant', content: 'Could not analyze the image right now.' });
    } finally {
      setUploading(false);
    }
  }, [append]);

  const onAddOne = useCallback((item: StockIngredientItem) => {
    addToCart({ id: item.id, name: item.name, price: item.price, image: item.image || '', quantity: 1, shopId: item.shopId, shopName: item.shopName });
    openCartDrawer();
  }, [addToCart, openCartDrawer]);

  const onAddAll = useCallback((items: StockIngredientItem[]) => {
    items.forEach((i) => addToCart({ id: i.id, name: i.name, price: i.price, image: i.image || '', quantity: 1, shopId: i.shopId, shopName: i.shopName }));
    openCartDrawer();
  }, [addToCart, openCartDrawer]);

  const onFilePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onUploadImage(f);
  }, [onUploadImage]);

  const ChatWindow = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25 }}
      className="fixed bottom-24 right-5 z-50 w-[min(92vw,420px)] h-[min(70vh,640px)] rounded-2xl shadow-2xl border border-white/15 bg-gradient-to-b from-white/75 to-white/60 dark:from-slate-900/80 dark:to-slate-900/70 backdrop-blur-xl overflow-hidden"
    >
      <HeaderBar onClose={() => setOpen(false)} />
      <QuickActions onSend={sendText} />
      <div ref={scrollerRef} className="px-3 pb-20 pt-2 h-[calc(100%-112px)] overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <div className="text-sm mb-2">👋 Welcome to Kirana AI!</div>
            <div className="text-xs">Ask me for recipes, ingredients, or dietary suggestions.</div>
            {import.meta.env.DEV && (
              <div className="text-xs mt-2 p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                🔧 <strong>Debug Info:</strong><br/>
                API Base: {API_BASE}<br/>
                Current Origin: {window.location.origin}<br/>
                Click "Test API Connection" to verify API setup
              </div>
            )}
            {!API_BASE && import.meta.env.DEV && (
              <div className="text-xs mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                💡 <strong>Development Mode:</strong> Run "vercel dev" in another terminal to enable local API testing.
              </div>
            )}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-gradient-to-br from-orange-500 to-green-500 text-white' : 'bg-white/80 dark:bg-white/5 border border-white/10 text-slate-900 dark:text-slate-100'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              {m.role === 'assistant' && (m.data ? (
                <IngredientList payload={m.data as RecipeResponsePayload} onAddOne={onAddOne} onAddAll={onAddAll} />
              ) : null)}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-xs text-slate-500">Kirana AI is typing…</div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-t border-white/15">
        <div className="flex items-center gap-2">
          <label className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer" title="Upload an image">
            <input aria-label="Upload an image" type="file" accept="image/*" className="hidden" onChange={onFilePick} />
            <ImageIcon aria-hidden className="h-5 w-5" />
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendText(input); }}
            placeholder="Ask for a recipe, ingredients, diets…"
            className="flex-1 rounded-xl px-3 py-2 bg-white/80 dark:bg-white/10 border border-white/20 outline-none text-sm"
          />
          <button
            disabled={!input.trim()}
            onClick={() => sendText(input)}
            title="Send"
            aria-label="Send"
            className="rounded-xl bg-green-600 text-white px-3 py-2 disabled:opacity-50"
          >
            <Send aria-hidden className="h-4 w-4" />
          </button>
        </div>
        {uploading && <div className="text-xs mt-1 text-slate-500">Analyzing image…</div>}
      </div>
    </motion.div>
  );

  return (
    <>
      <AnimatePresence>{open && ChatWindow}</AnimatePresence>
      <FloatingPulseButton onClick={() => setOpen((v) => !v)} />
    </>
  );
};

export default AIChatWidget;


