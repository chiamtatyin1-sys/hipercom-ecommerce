import { useState, useEffect } from 'react';
import { Star, Send, CheckCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ReviewSubmission({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState({});
  const [submitted, setSubmitted] = useState({});

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

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

  if (loading) return (
    <div className="flex items-center justify-center h-32">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading...</span>
    </div>
  );
  if (!order) return <div>Order not found</div>;

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Review Your Order</h3>
      <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>

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
                  placeholder="Share your experience with this product..."
                />
              </div>
              <button onClick={() => submitReview(item.id)} className="btn btn-primary flex items-center gap-2">
                <Send className="h-4 w-4" /> Submit Review
              </button>
            </div>
          ) : (
            <div className="bg-green-50 p-3 rounded text-sm text-green-700">
              <CheckCircle className="h-4 w-4 inline mr-1" /> Review submitted successfully
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
