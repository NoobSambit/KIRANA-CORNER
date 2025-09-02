import React from 'react';
import { ShoppingCart, AlertCircle, CheckCircle, Package } from 'lucide-react';

interface RecipeCardProps {
  recipe: {
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
  };
  onAddToCart: (product: any, shop: any) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onAddToCart }) => {
  return (
    <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
      {/* Recipe Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
        <h3 className="font-bold text-lg">{recipe.title}</h3>
        <p className="text-sm opacity-90">{recipe.description}</p>
      </div>

      {/* Ingredients & Availability */}
      <div className="p-4">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
          <Package className="w-4 h-4 mr-2" />
          Ingredients & Availability
        </h4>

        {/* Available Items */}
        {recipe.inventoryMatch.available.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2 flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              Available in Shops ({recipe.inventoryMatch.available.length})
            </h5>
            <div className="space-y-2">
              {recipe.inventoryMatch.available.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      ₹{item.product.price} • {item.shop.name}
                    </p>
                  </div>
                  <button
                    onClick={() => onAddToCart(item.product, item.shop)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs flex items-center space-x-1 transition-colors"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alternative Items */}
        {recipe.inventoryMatch.alternatives.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2 flex items-center">
              <Package className="w-4 h-4 mr-1" />
              Similar Items ({recipe.inventoryMatch.alternatives.length})
            </h5>
            <div className="space-y-2">
              {recipe.inventoryMatch.alternatives.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {item.alternative.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      ₹{item.alternative.price} • {item.shop.name}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Alternative for: {item.ingredient}
                    </p>
                  </div>
                  <button
                    onClick={() => onAddToCart(item.alternative, item.shop)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg text-xs flex items-center space-x-1 transition-colors"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unavailable Items */}
        {recipe.inventoryMatch.unavailable.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              Not Available ({recipe.inventoryMatch.unavailable.length})
            </h5>
            <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                {recipe.inventoryMatch.unavailable.join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Recipe Instructions (Collapsible) */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
            View Cooking Instructions
          </summary>
          <div className="mt-2 space-y-2">
            {recipe.instructions.map((instruction, index) => (
              <div key={index} className="flex">
                <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5">
                  {index + 1}
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400">{instruction}</p>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
};

export default RecipeCard;
