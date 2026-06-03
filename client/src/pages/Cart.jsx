import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, Package, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export default function Cart() {
  const { items, subtotal, itemCount, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="h-20 w-20 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/products" className="btn btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <span className="text-gray-500">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => {
            const isOutOfStock = item.product.stock === 0;
            const isLowStock = item.product.stock > 0 && item.product.stock <= 10;
            
            return (
              <div key={item.id} className={`card p-4 flex items-center ${isOutOfStock ? 'opacity-60 bg-gray-50' : ''}`}>
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.product.images?.[0] ? (
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.svg'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <Link to={`/products/${item.product.slug}`} className="font-semibold hover:text-primary-600 line-clamp-1">
                    {item.product.name}
                  </Link>
                  {item.variant && (
                    <p className="text-sm text-gray-500">
                      {item.variant.variantName || item.variant.name}: {item.variant.variantValue || item.variant.value}
                    </p>
                  )}
                  {isOutOfStock ? (
                    <p className="text-red-500 text-sm font-medium mt-1">Out of stock</p>
                  ) : isLowStock ? (
                    <p className="text-orange-500 text-sm flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3" /> Only {item.product.stock} left
                    </p>
                  ) : null}
                  <p className="text-primary-600 font-bold mt-1">{settings.currency} {item.totalPrice?.toFixed(2) || (item.product.price * item.quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 hover:bg-gray-50 disabled:opacity-50"
                      disabled={isOutOfStock}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-3 text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 hover:bg-gray-50 disabled:opacity-50"
                      disabled={isOutOfStock || item.quantity >= item.product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card p-6 h-fit lg:sticky lg:top-24">
          <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal ({itemCount} items)</span>
              <span>{settings.currency} {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="text-gray-500">Calculated at checkout</span>
            </div>
          </div>
          <div className="border-t pt-4 mb-6">
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-primary-600">{settings.currency} {subtotal.toFixed(2)}</span>
            </div>
          </div>
          {user ? (
            <Link to="/checkout" className="btn btn-primary w-full flex items-center justify-center gap-2">
              <ShoppingBag className="h-4 w-4" /> Proceed to Checkout
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary w-full flex items-center justify-center gap-2">
              Login to Checkout
            </Link>
          )}
          <Link to="/products" className="block text-center mt-4 text-primary-600 hover:text-primary-700 text-sm">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
