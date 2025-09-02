import React from 'react';
import { Bot } from 'lucide-react';

const RecipeAssistantLauncher: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const LazyWidget = React.useMemo(() => React.lazy(() => import('./RecipeAssistantWidget')), []);

  if (open) {
    return (
      <React.Suspense fallback={
        <button title="Loading Recipe Assistant" className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-orange-500 to-green-500 text-white shadow-lg shadow-orange-500/30 flex items-center justify-center opacity-70">
          <Bot aria-hidden className="h-6 w-6" />
        </button>
      }>
        <LazyWidget onClose={() => setOpen(false)} />
      </React.Suspense>
    );
  }

  return (
    <button
      aria-label="Open Recipe Assistant"
      onClick={() => setOpen(true)}
      className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-orange-500 to-green-500 text-white shadow-lg shadow-orange-500/30 flex items-center justify-center"
    >
      <div aria-hidden className="absolute inset-0 rounded-full animate-ping bg-green-500/20" />
      <Bot aria-hidden className="relative z-10 h-6 w-6" />
    </button>
  );
};

export default RecipeAssistantLauncher;


