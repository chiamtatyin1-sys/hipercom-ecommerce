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
        <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <ShoppingBag className="h-10 w-10 text-slate-300" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Your cart is empty</h2>
        <p className="text-sm text-slate-500 mb-6">Looks like you haven't added anything yet.</p>
        <Link to="/products" className="btn btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Shopping Cart</h1>
        <span className="text-sm text-slate-500">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => {
            const isOutOfStock = item.product.stock === 0;
            const isLowStock = item.product.stock > 0 && item.product.stock <= 10;

            return (
              <div key={item.id} className={`card-static p-4 flex items-center gap-4 ${isOutOfStock ? 'opacity-50 bg-slate-50' : ''}`}>
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.product.images?.[0] ? (
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.svg'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product.slug}`} className="font-semibold text-sm text-slate-800 hover:text-blue-600 transition-colors line-clamp-1">
                    {item.product.name}
                  </Link>
                  {item.variant && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.variant.variantName || item.variant.name}: {item.variant.variantValue || item.variant.value}
                    </p>
                  )}
                  {isOutOfStock ? (
                    <p className="text-red-500 text-xs font-medium mt-1">Out of stock</p>
                  ) : isLowStock ? (
                    <p className="text-amber-500 text-xs flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3" /> Only {item.product.stock} left
                    </p>
                  ) : null}
                  <p className="text-lg font-bold text-slate-900 mt-1">{settings.currency} {item.totalPrice?.toFixed(2) || (item.product.price * item.quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center border border-slate-200 rounded-lg">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={isOutOfStock} className="p-2 hover:bg-slate-50 disabled:opacity-40 text-slate-500">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-2 text-sm font-medium min-w-[1.8rem] text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={isOutOfStock || item.quantity >= item.product.stock} className="p-2 hover:bg-slate-50 disabled:opacity-40 text-slate-500">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card-static p-6 h-fit lg:sticky lg:top-20">
          <h3 className="font-semibold text-slate-900 mb-4">Order Summary</h3>
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal ({itemCount} items)</span>
              <span className="text-slate-700">{settings.currency} {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Shipping</span>
              <span className="text-slate-400">Calculated at checkout</span>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-4 mb-6">
            <div className="flex justify-between text-lg font-bold">
              <span className="text-slate-900">Total</span>
              <span className="text-slate-900">{settings.currency} {subtotal.toFixed(2)}</span>
            </div>
          </div>
          {user ? (
            <Link to="/checkout" className="btn btn-primary btn-lg w-full">
              <ShoppingBag className="h-4 w-4 mr-2" /> Proceed to Checkout
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary btn-lg w-full">
              Sign In to Checkout
            </Link>
          )}
          <Link to="/products" className="block text-center mt-4 text-sm text-blue-600 hover:text-blue-700">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}