import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Truck, Shield, RefreshCw, Check, Heart, Send } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, averageRating: 0, distribution: {} });
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showZoom, setShowZoom] = useState(false);

  useEffect(() => {
    fetchProduct();
    if (user) checkWishlist();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/slug/${slug}`);
      setProduct(res.data.product);
      setRecommendations(res.data.recommendations || []);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!product?.id) return;
    try {
      const res = await api.get(`/reviews/product/${product.id}`);
      setReviews(res.data.reviews);
      setReviewStats({ total: res.data.total, averageRating: res.data.averageRating, distribution: res.data.distribution });
    } catch (error) {}
  };

  useEffect(() => { if (product?.id) fetchReviews(); }, [product]);

  const checkWishlist = async () => {
    if (!product) return;
    try {
      const res = await api.get(`/wishlist/check/${product.id}`);
      setInWishlist(res.data.inWishlist);
    } catch (error) {}
  };

  const toggleWishlist = async () => {
    if (!user) { toast.error('Please sign in first'); return; }
    try {
      if (inWishlist) {
        await api.delete(`/wishlist/${product.id}`);
        setInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await api.post('/wishlist', { productId: product.id });
        setInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed');
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    const result = await addToCart(product.id, selectedVariant?.id || null, quantity);
    if (result.success) {
      toast.success('Added to cart!');
    } else {
      toast.error(result.error);
    }
  };

  const submitReview = async () => {
    if (!user) { toast.error('Please sign in to review'); return; }
    if (!newReview.comment.trim()) { toast.error('Please write a comment'); return; }
    setSubmittingReview(true);
    try {
      await api.post('/reviews', { productId: product.id, rating: newReview.rating, comment: newReview.comment });
      toast.success('Review submitted!');
      setNewReview({ rating: 5, comment: '' });
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="grid md:grid-cols-2 gap-8 animate-pulse">
      <div className="aspect-square bg-slate-200 rounded-xl" />
      <div className="space-y-4">
        <div className="h-8 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="h-4 bg-slate-200 rounded w-full" />
        <div className="h-10 bg-slate-200 rounded w-1/3" />
      </div>
    </div>
  );

  if (!product) return (
    <div className="text-center py-20">
      <h2 className="text-lg font-semibold text-slate-900 mb-2">Product not found</h2>
      <Link to="/products" className="btn btn-primary btn-sm">Browse Products</Link>
    </div>
  );

  const parseImages = (imgData) => {
    if (!imgData) return [];
    if (Array.isArray(imgData)) return imgData;
    try { return JSON.parse(imgData); } catch { return imgData.startsWith('http') ? [imgData] : []; }
  };

  const images = parseImages(product.images);
  const currentPrice = selectedVariant ? product.price + (selectedVariant.additionalPrice || 0) : product.price;
  const availableStock = selectedVariant?.stock ?? product.stock;

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Image Gallery */}
        <div>
          <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden mb-4 relative group">
            {images[selectedImage] ? (
              <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setShowZoom(true)} onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.svg'; }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
            )}
            <button onClick={toggleWishlist} className={`absolute top-3 right-3 p-2.5 rounded-full shadow-md transition-colors ${inWishlist ? 'bg-red-500 text-white' : 'bg-white text-slate-500 hover:text-red-500'}`}>
              <Heart className={`h-5 w-5 ${inWishlist ? 'fill-white' : ''}`} />
            </button>
            {images.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setSelectedImage(i => Math.max(0, i - 1))} disabled={selectedImage === 0} className="p-2 bg-white/80 rounded-full shadow disabled:opacity-30 hover:bg-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={() => setSelectedImage(i => Math.min(images.length - 1, i + 1))} disabled={selectedImage === images.length - 1} className="p-2 bg-white/80 rounded-full shadow disabled:opacity-30 hover:bg-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(0, 4).map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImage(idx)} className={`aspect-square bg-slate-100 rounded-lg overflow-hidden ring-2 transition-all ${selectedImage === idx ? 'ring-blue-500 ring-offset-1' : 'ring-transparent hover:ring-slate-300'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.svg'; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {product.brand && (
            <div className="flex items-center gap-2 mb-2">
              {product.brand.logo && <img src={product.brand.logo} alt={product.brand.name} className="h-5 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />}
              <span className="text-sm text-slate-500">{product.brand.name}</span>
            </div>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">{product.name}</h1>
          {product.sku && <p className="text-xs text-slate-400 mb-3">SKU: {product.sku}</p>}

          <div className="flex items-center gap-2 mb-3">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.round(reviewStats.averageRating) ? 'fill-current' : ''}`} />
              ))}
            </div>
            <span className="text-sm text-slate-500">{reviewStats.averageRating} ({reviewStats.total} reviews)</span>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed mb-4">{product.description}</p>

          <div className="text-2xl font-bold text-slate-900 mb-4">RM {currentPrice.toFixed(2)}</div>

          {product.variants?.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-500 mb-2">Options</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map(variant => (
                  <button key={variant.id} onClick={() => setSelectedVariant(variant)} className={`px-4 py-2 border rounded-lg text-sm transition-colors ${selectedVariant?.id === variant.id ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 hover:border-slate-300'}`}>
                    {variant.variantValue}
                    {variant.additionalPrice > 0 && <span className="text-slate-400 ml-1">+RM{variant.additionalPrice}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-xs font-medium text-slate-500 mb-2">Quantity</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-50 text-slate-600">-</button>
              <input type="number" value={quantity} onChange={(e) => setQuantity(Math.min(availableStock, Math.max(1, parseInt(e.target.value) || 1)))} className="w-16 text-center border border-slate-200 rounded-lg py-2 text-sm" />
              <button onClick={() => setQuantity(Math.min(availableStock, quantity + 1))} className="w-9 h-9 border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-50 text-slate-600">+</button>
              <span className="text-xs text-slate-400 ml-2">{availableStock > 0 ? `${availableStock} available` : 'Out of stock'}</span>
            </div>
          </div>

          <button onClick={handleAddToCart} disabled={availableStock === 0} className="btn btn-primary btn-lg w-full disabled:opacity-50">
            <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
          </button>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500"><Truck className="h-4 w-4 text-blue-500" /> Free Shipping</div>
            <div className="flex items-center gap-2 text-xs text-slate-500"><Shield className="h-4 w-4 text-blue-500" /> Warranty</div>
            <div className="flex items-center gap-2 text-xs text-slate-500"><RefreshCw className="h-4 w-4 text-blue-500" /> 7-Day Returns</div>
            <div className="flex items-center gap-2 text-xs text-slate-500"><Check className="h-4 w-4 text-blue-500" /> Authentic</div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="border-t border-slate-200 pt-8 mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Customer Reviews</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card-static p-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-amber-400">{reviewStats.averageRating}</p>
              <div className="flex justify-center my-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(reviewStats.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                ))}
              </div>
              <p className="text-xs text-slate-500">{reviewStats.total} review{reviewStats.total !== 1 ? 's' : ''}</p>
            </div>
            <div className="mt-4 space-y-1.5">
              {[5, 4, 3, 2, 1].map(star => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-slate-400">{star}</span>
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                    <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${reviewStats.total > 0 ? ((reviewStats.distribution[star] || 0) / reviewStats.total) * 100 : 0}%` }} />
                  </div>
                  <span className="w-5 text-slate-400">{reviewStats.distribution[star] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            {user ? (
              <div className="card-static p-4 mb-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Write a Review</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-slate-500">Rating:</span>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setNewReview({ ...newReview, rating: star })}>
                      <Star className={`h-5 w-5 ${star <= newReview.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                    </button>
                  ))}
                </div>
                <textarea value={newReview.comment} onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })} className="input h-20 mb-3 text-sm" placeholder="Share your experience..." />
                <button onClick={submitReview} disabled={submittingReview} className="btn btn-primary btn-sm">
                  <Send className="h-4 w-4 mr-1.5" /> {submittingReview ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500 mb-4"><Link to="/login" className="text-blue-600">Sign in</Link> to write a review</p>
            )}

            <div className="space-y-3">
              {reviews.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No reviews yet. Be the first!</p>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="card-static p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{review.user?.username || 'Anonymous'}</span>
                      <span className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    {review.comment && <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {recommendations.map(rec => {
              const recImages = parseImages(rec.images);
              return (
                <Link key={rec.id} to={`/products/${rec.slug}`} className="card p-0 overflow-hidden group">
                  <div className="aspect-square bg-slate-100 overflow-hidden">
                    {recImages[0] ? (
                      <img src={recImages[0]} alt={rec.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.svg'; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No Image</div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-slate-700 line-clamp-1">{rec.name}</p>
                    <p className="text-xs font-bold text-slate-900">RM {rec.price.toFixed(2)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Zoom Modal */}
      {showZoom && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowZoom(false)}>
          <button className="absolute top-4 right-4 text-white p-2" onClick={() => setShowZoom(false)}>
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img src={images[selectedImage]} alt={product.name} className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.svg'; }} />
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((img, idx) => (
                <button key={idx} onClick={(e) => { e.stopPropagation(); setSelectedImage(idx); }} className={`w-14 h-14 rounded border-2 overflow-hidden ${selectedImage === idx ? 'border-white' : 'border-transparent opacity-50'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-product.svg'; }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}