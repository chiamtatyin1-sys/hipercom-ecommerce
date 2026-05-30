import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('If email exists, reset link sent!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
          <p className="text-gray-600 mb-6">
            If an account with {email} exists, we've sent a password reset link.
          </p>
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Forgot Password</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-10"
                placeholder="your@email.com"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">We'll send a password reset link</p>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Remember your password?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
