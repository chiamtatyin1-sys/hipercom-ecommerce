import { useState, useEffect } from 'react';
import { Star, Eye, EyeOff, Trash2, MessageSquare } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/reviews');
      setReviews(res.data.reviews || res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id) => {
    try {
      await api.put(`/reviews/${id}/toggle`);
      setReviews(reviews.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
      toast.success('Review updated');
    } catch (error) {
      toast.error('Failed to update review');
    }
  };

  const deleteReview = async (id) => {
    if (!confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      setReviews(reviews.filter(r => r.id !== id));
      toast.success('Review deleted');
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const filtered = filter === 'all' ? reviews : filter === 'active' ? reviews.filter(r => r.isActive) : reviews.filter(r => !r.isActive);
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-gray-500">Loading reviews...</span>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Star className="h-8 w-8 text-yellow-500" /> Reviews & Ratings
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold">{reviews.length}</p>
          <p className="text-sm text-gray-500">Total Reviews</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-500">{avgRating}</p>
          <p className="text-sm text-gray-500">Avg Rating</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{reviews.filter(r => r.isActive).length}</p>
          <p className="text-sm text-gray-500">Active</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{reviews.filter(r => !r.isActive).length}</p>
          <p className="text-sm text-gray-500">Hidden</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {['all', 'active', 'hidden'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm ${filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No reviews found</p>
          </div>
        ) : (
          filtered.map(review => (
            <div key={review.id} className={`card p-4 ${!review.isActive ? 'opacity-60 bg-gray-50' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{review.user?.username || 'Anonymous'}</span>
                    <span className="text-xs text-gray-400">• {new Date(review.createdAt).toLocaleDateString()}</span>
                    {!review.isActive && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Hidden</span>}
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Product: <span className="font-medium text-gray-700">{review.product?.name || 'Unknown'}</span></p>
                  {review.comment && <p className="text-sm mt-2 bg-gray-50 p-3 rounded-lg">{review.comment}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleActive(review.id)} className="p-2 text-gray-400 hover:text-blue-600" title={review.isActive ? 'Hide' : 'Show'}>
                    {review.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button onClick={() => deleteReview(review.id)} className="p-2 text-gray-400 hover:text-red-600" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
