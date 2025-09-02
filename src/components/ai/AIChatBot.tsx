import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Loader } from 'lucide-react';
import { useCart } from '../CartContext';
import RecipeCard from './RecipeCard';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  recipe?: RecipeData;
  timestamp: Date;
}

interface RecipeData {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  inventoryMatch: {
    available: Array<{
      ingredient: string;
      product: any;
      shop: any;
    }>;
    unavailable: string[];
    alternatives: Array<{
      ingredient: string;
      alternative: any;
      shop: any;
    }>;
  };
}

interface AIChatBotProps {
  onClose: () => void;
}

const AIChatBot: React.FC<AIChatBotProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hi! I\'m your Kirana Assistant. Ask me for any recipe and I\'ll help you find the ingredients from local shops!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (userInput: string) => {
    if (!userInput.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: userInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call recipe API
      const response = await fetch('/api/recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userInput })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', response.status, errorText);
        
        // Development fallback: if API is not available (404), use mock data
        if (response.status === 404) {
          console.warn('API endpoint not available, using development fallback');
          const data: RecipeData = generateDevFallbackRecipe(userInput);
          
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'bot',
            content: `Here's a great recipe for ${data.title}! (Development Mode - API not available)`,
            recipe: data,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMessage]);
          return;
        }
        
        throw new Error(`API Error (${response.status}): ${errorText || 'Failed to generate recipe'}`);
      }

      const data: RecipeData = await response.json();

      // Add bot response with recipe
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `Here's a great recipe for ${data.title}! I've also checked which ingredients are available in nearby shops.`,
        recipe: data,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `Sorry, I encountered an error while generating the recipe: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    sendMessage(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddToCart = (product: any, shop: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      shop: shop.name
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed top-20 right-4 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-40"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-2xl">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6" />
          <span className="font-semibold">Kirana Assistant</span>
        </div>
        <button 
          onClick={onClose} 
          className="text-white hover:text-gray-200 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
              message.type === 'user' 
                ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}>
              <div className="flex items-center space-x-2 mb-1">
                {message.type === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                <span className="text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm">{message.content}</p>
              
              {/* Recipe Card */}
              {message.recipe && (
                <RecipeCard 
                  recipe={message.recipe} 
                  onAddToCart={handleAddToCart}
                />
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2">
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Generating recipe...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask for a recipe... (e.g., chicken biryani)"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          💡 Try: "chicken curry", "pasta recipe", "chocolate cake"
        </p>
      </div>
    </motion.div>
  );
};

// Development fallback function for when API is not available
function generateDevFallbackRecipe(query: string): RecipeData {
  const recipes = {
    'chicken curry': {
      title: 'Classic Chicken Curry',
      description: 'A rich and flavorful chicken curry with aromatic spices, perfect for dinner.',
      ingredients: ['chicken', 'onions', 'tomatoes', 'garlic', 'ginger', 'curry powder', 'coconut milk', 'oil', 'salt', 'cilantro'],
      instructions: [
        'Heat oil in a large pan over medium heat',
        'Add diced onions and cook until golden brown',
        'Add minced garlic and ginger, cook for 1 minute',
        'Add chicken pieces and brown on all sides',
        'Add tomatoes and curry powder, cook for 5 minutes',
        'Pour in coconut milk and simmer for 20 minutes',
        'Season with salt and garnish with cilantro',
        'Serve hot with rice'
      ]
    },
    'pasta': {
      title: 'Simple Pasta Recipe',
      description: 'Quick and easy pasta dish that\'s perfect for any meal.',
      ingredients: ['pasta', 'olive oil', 'garlic', 'tomatoes', 'basil', 'parmesan cheese', 'salt', 'black pepper'],
      instructions: [
        'Boil water in a large pot with salt',
        'Add pasta and cook according to package directions',
        'Heat olive oil in a pan, add minced garlic',
        'Add diced tomatoes and cook for 5 minutes',
        'Drain pasta and add to the pan',
        'Toss with fresh basil and parmesan cheese',
        'Season with salt and pepper',
        'Serve immediately'
      ]
    }
  };

  // Find matching recipe or create generic one
  const lowerQuery = query.toLowerCase();
  
  for (const [key, recipe] of Object.entries(recipes)) {
    if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
      return {
        ...recipe,
        inventoryMatch: {
          available: [
            {
              ingredient: recipe.ingredients[0] || "main ingredient",
              product: {
                id: "dev1",
                name: `Fresh ${recipe.ingredients[0] || "Ingredient"}`,
                price: 50,
                image: "https://via.placeholder.com/100"
              },
              shop: {
                id: "devshop1",
                name: "Development Store",
                address: "Local Area"
              }
            }
          ],
          unavailable: recipe.ingredients.slice(3) || [],
          alternatives: [
            {
              ingredient: recipe.ingredients[1] || "alternative",
              alternative: {
                id: "dev2",
                name: `Alternative ${recipe.ingredients[1] || "Item"}`,
                price: 40,
                image: "https://via.placeholder.com/100"
              },
              shop: {
                id: "devshop1",
                name: "Development Store",
                address: "Local Area"
              }
            }
          ]
        }
      };
    }
  }

  // Generic fallback recipe
  return {
    title: `Recipe for ${query}`,
    description: 'A delicious homemade recipe crafted just for you! (Development Mode)',
    ingredients: ['main ingredient', 'onions', 'garlic', 'spices', 'oil', 'salt'],
    instructions: [
      'Prepare all ingredients by washing and chopping',
      'Heat oil in a pan over medium heat',
      'Add aromatics and cook until fragrant',
      'Add main ingredients and cook thoroughly',
      'Season to taste with salt and spices',
      'Serve hot and enjoy!'
    ],
    inventoryMatch: {
      available: [
        {
          ingredient: "main ingredient",
          product: {
            id: "dev1",
            name: "Development Ingredient",
            price: 30,
            image: "https://via.placeholder.com/100"
          },
          shop: {
            id: "devshop1",
            name: "Development Store",
            address: "Local Area"
          }
        }
      ],
      unavailable: ['spices', 'oil'],
      alternatives: []
    }
  };
}

export default AIChatBot;
