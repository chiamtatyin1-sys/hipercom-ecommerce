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
    try {
      const res = await api.get(`/reviews/product/${product?.id || ''}`);
      setReviews(res.data.reviews);
      setReviewStats({ total: res.data.total, averageRating: res.data.averageRating, distribution: res.data.distribution });
    } catch (error) {
      // Product not loaded yet, skip
    }
  };

  useEffect(() => {
    if (product?.id) fetchReviews();
  }, [product]);

  const checkWishlist = async () => {
    if (!product) return;
    try {
      const res = await api.get(`/wishlist/check/${product.id}`);
      setInWishlist(res.data.inWishlist);
    } catch (error) {
      // ignore
    }
  };

  const toggleWishlist = async () => {
    if (!user) { toast.error('Please login first'); return; }
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
      toast.error('Please login to add items to cart');
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
    if (!user) { toast.error('Please login to review'); return; }
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

  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (!product) return <div>Product not found</div>;

  const parseImages = (imgData) => {
    if (!imgData) return [];
    if (Array.isArray(imgData)) return imgData;
    try { return JSON.parse(imgData); } catch { return imgData.startsWith('http') ? [imgData] : []; }
  };

  const images = parseImages(product.images);
  const currentPrice = selectedVariant ? product.price + (selectedVariant.additionalPrice || 0) : product.price;
  const availableStock = selectedVariant?.stock || product.stock;

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div>
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4 relative group">
            {images[selectedImage] ? (
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover cursor-zoom-in"
                onClick={() => setShowZoom(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
            )}
            <button
              onClick={toggleWishlist}
              className={`absolute top-4 right-4 p-3 rounded-full shadow-lg transition-colors ${inWishlist ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:text-red-500'}`}
            >
              <Heart className={`h-5 w-5 ${inWishlist ? 'fill-white' : ''}`} />
            </button>
            {images.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setSelectedImage(i => Math.max(0, i - 1))}
                  disabled={selectedImage === 0}
                  className="p-2 bg-white/80 rounded-full shadow disabled:opacity-30"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                  onClick={() => setSelectedImage(i => Math.min(images.length - 1, i + 1))}
                  disabled={selectedImage === images.length - 1}
                  className="p-2 bg-white/80 rounded-full shadow disabled:opacity-30"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(0, 4).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === idx ? 'border-primary-500' : 'border-transparent hover:border-gray-300'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          {product.brand && (
            <div className="flex items-center gap-2 mb-2">
              {product.brand.logo && (
                <img src={product.brand.logo} alt={product.brand.name} className="h-5 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
              )}
              <span className="text-sm text-gray-500">{product.brand.name}</span>
            </div>
          )}
          {product.sku && (
            <p className="text-sm text-gray-400 mb-2">SKU: {product.sku}</p>
          )}
          <div className="flex items-center mb-4">
            <div className="flex text-yellow-500 mr-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-5 w-5 ${i < Math.round(reviewStats.averageRating) ? 'fill-current' : ''}`} />
              ))}
            </div>
            <span className="text-gray-500">{reviewStats.averageRating} ({reviewStats.total} reviews)</span>
          </div>
          <p className="text-gray-600 mb-4">{product.description}</p>

          <div className="text-3xl font-bold text-primary-600 mb-4">
            RM {currentPrice.toFixed(2)}
          </div>

          {product.variants?.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Options</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map(variant => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-4 py-2 border rounded-lg ${selectedVariant?.id === variant.id ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-gray-300 hover:border-gray-400'}`}
                  >
                    {variant.variantValue}
                    {variant.additionalPrice > 0 && ` (+RM${variant.additionalPrice})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <div className="flex items-center space-x-2">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 border rounded-lg hover:bg-gray-50">-</button>
              <input type="number" value={quantity} onChange={(e) => setQuantity(Math.min(availableStock, Math.max(1, parseInt(e.target.value) || 1)))} className="w-20 text-center border rounded-lg py-2" />
              <button onClick={() => setQuantity(Math.min(availableStock, quantity + 1))} className="w-10 h-10 border rounded-lg hover:bg-gray-50">+</button>
              <span className="text-gray-500 ml-2">{availableStock > 0 ? `${availableStock} available` : 'Out of stock'}</span>
            </div>
          </div>

          <div className="flex space-x-4">
            <button onClick={handleAddToCart} disabled={availableStock === 0} className="flex-1 btn btn-primary py-3 flex items-center justify-center disabled:opacity-50">
              <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="flex items-center text-gray-600"><Truck className="h-5 w-5 mr-2 text-primary-600" /><span>Free Shipping</span></div>
            <div className="flex items-center text-gray-600"><Shield className="h-5 w-5 mr-2 text-primary-600" /><span>Warranty</span></div>
            <div className="flex items-center text-gray-600"><RefreshCw className="h-5 w-5 mr-2 text-primary-600" /><span>7-Day Returns</span></div>
            <div className="flex items-center text-gray-600"><Check className="h-5 w-5 mr-2 text-primary-600" /><span>Authentic</span></div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="border-t pt-8 mb-12">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card p-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-yellow-500">{reviewStats.averageRating}</p>
              <div className="flex justify-center my-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < Math.round(reviewStats.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <p className="text-sm text-gray-500">{reviewStats.total} review{reviewStats.total !== 1 ? 's' : ''}</p>
            </div>
            <div className="mt-4 space-y-1">
              {[5, 4, 3, 2, 1].map(star => (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-3">{star}</span>
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${reviewStats.total > 0 ? ((reviewStats.distribution[star] || 0) / reviewStats.total) * 100 : 0}%` }} />
                  </div>
                  <span className="w-6 text-gray-500">{reviewStats.distribution[star] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            {user ? (
              <div className="card p-4 mb-4">
                <h3 className="font-medium mb-3">Write a Review</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => setNewReview({ ...newReview, rating: star })}>
                        <Star className={`h-6 w-6 ${star <= newReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  className="input h-20 mb-2"
                  placeholder="Share your experience with this product..."
                />
                <button onClick={submitReview} disabled={submittingReview} className="btn btn-primary flex items-center gap-2">
                  <Send className="h-4 w-4" /> {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4"><Link to="/login" className="text-primary-600">Login</Link> to write a review</p>
            )}

            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No reviews yet. Be the first!</p>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{review.user?.username || 'Anonymous'}</span>
                      <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    {review.comment && <p className="text-sm text-gray-700">{review.comment}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recommendations.map(rec => {
              const recImages = parseImages(rec.images);
              return (
                <Link key={rec.id} to={`/products/${rec.slug}`} className="card p-3 hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-2">
                    {recImages[0] ? (
                      <img src={recImages[0]} alt={rec.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                    )}
                  </div>
                  <p className="font-medium text-sm truncate">{rec.name}</p>
                  <p className="text-primary-600 font-bold">RM {rec.price.toFixed(2)}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {showZoom && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowZoom(false)}>
          <button className="absolute top-4 right-4 text-white p-2" onClick={() => setShowZoom(false)}>
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img src={images[selectedImage]} alt={product.name} className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setSelectedImage(idx); }}
                  className={`w-16 h-16 rounded border-2 overflow-hidden ${selectedImage === idx ? 'border-white' : 'border-transparent opacity-50'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
