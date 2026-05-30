import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const hasUpperCase = /[A-Z]/.test(formData.newPassword);
    const hasLowerCase = /[a-z]/.test(formData.newPassword);
    const hasNumber = /[0-9]/.test(formData.newPassword);
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      toast.error('Password must contain uppercase, lowercase, and a number');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: formData.newPassword,
      });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Reset Password</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="input pl-10"
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="input"
              placeholder="Re-enter your password"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
