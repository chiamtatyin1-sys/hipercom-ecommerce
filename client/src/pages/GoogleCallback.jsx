import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing Google login...');

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        toast.error('Google login cancelled');
        navigate('/login');
        return;
      }

      if (!code) {
        toast.error('No authorization code received');
        navigate('/login');
        return;
      }

      try {
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        const res = await api.post('/auth/google/callback', { code, redirectUri });
        localStorage.setItem('token', res.data.token);
        window.dispatchEvent(new Event('auth:login'));
        window.dispatchEvent(new Event('cart:refresh'));
        toast.success('Welcome!');

        if (res.data.user.role === 'admin') {
          navigate('/admin');
        } else if (res.data.user.role === 'seller') {
          navigate('/seller');
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Google callback error:', error);
        toast.error(error.response?.data?.error || 'Google login failed');
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}
