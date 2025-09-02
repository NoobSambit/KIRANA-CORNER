import React, { useState } from 'react';

const MinimalChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseText, setResponseText] = useState<string | null>(null);

  const sendQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponseText(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query })
      });
      const text = await res.text();
      setResponseText(text);
    } catch (e: any) {
      setResponseText(`Error: ${e?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 shadow-lg"
        >
          Chat
        </button>
      )}
      {open && (
        <div className="w-96 max-w-[90vw] bg-white text-slate-900 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
            <span className="font-semibold">Assistant</span>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">×</button>
          </div>
          <div className="p-4 space-y-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything..."
              className="w-full border rounded-lg px-3 py-2"
              onKeyDown={(e) => { if (e.key === 'Enter') sendQuery(); }}
            />
            <button
              onClick={sendQuery}
              disabled={loading || !query.trim()}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg px-3 py-2"
            >
              {loading ? 'Thinking...' : 'Send'}
            </button>
            {responseText && (
              <pre className="whitespace-pre-wrap bg-slate-50 border rounded-lg p-3 text-sm overflow-auto max-h-64">{responseText}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MinimalChatWidget;
