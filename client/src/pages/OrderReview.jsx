import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Star, Send, CheckCircle, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function OrderReview() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState({});
  const [submitted, setSubmitted] = useState({});

  useEffect(() => { fetchOrder(); }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data);
      const initialReviews = {};
      const initialSubmitted = {};
      res.data.items.forEach(item => {
        initialReviews[item.id] = { rating: 5, comment: '' };
        initialSubmitted[item.id] = false;
      });
      setReviews(initialReviews);
      setSubmitted(initialSubmitted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (itemId) => {
    const review = reviews[itemId];
    if (!review.comment.trim()) return toast.error('Please write a comment');
    try {
      const item = order.items.find(i => i.id === itemId);
      await api.post('/reviews', {
        productId: item.productId,
        rating: review.rating,
        comment: review.comment,
      });
      setSubmitted({ ...submitted, [itemId]: true });
      toast.success('Review submitted!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    }
  };

  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (!order) return <div>Order not found</div>;

  const allSubmitted = Object.values(submitted).every(v => v);

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/orders" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Review Order</h1>
          <p className="text-gray-500">#{order.orderNumber}</p>
        </div>
        {allSubmitted && <span className="badge badge-success flex items-center gap-1"><CheckCircle className="h-4 w-4" /> All Reviewed</span>}
      </div>

      <div className="space-y-4">
        {order.items.map(item => (
          <div key={item.id} className="card p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-medium">{item.product?.name || 'Product'}</p>
                {item.variant && <p className="text-sm text-gray-500">{item.variant.variantName}</p>}
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>
              {submitted[item.id] && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>

            {!submitted[item.id] ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => setReviews({ ...reviews, [item.id]: { ...reviews[item.id], rating: star } })} className="p-1">
                        <Star className={`h-6 w-6 ${star <= reviews[item.id]?.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Your Review</label>
                  <textarea
                    value={reviews[item.id]?.comment || ''}
                    onChange={(e) => setReviews({ ...reviews, [item.id]: { ...reviews[item.id], comment: e.target.value } })}
                    className="input h-24"
                    placeholder="Share your experience..."
                  />
                </div>
                <button onClick={() => submitReview(item.id)} className="btn btn-primary flex items-center gap-2">
                  <Send className="h-4 w-4" /> Submit Review
                </button>
              </div>
            ) : (
              <div className="bg-green-50 p-3 rounded text-sm text-green-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Review submitted
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
