import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const res = await authApi.verifyEmail(token);
      setStatus('success');
      setMessage(res.data.message || 'Email verified successfully!');
      toast.success('Email verified!');
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Failed to verify email');
      toast.error('Verification failed');
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="card p-8 max-w-md w-full text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Verifying your email...</h2>
            <p className="text-gray-500">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link to="/login" className="btn btn-primary">
              Go to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              <Link to="/login" className="btn btn-primary flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Go to Login
              </Link>
              <Link to="/" className="btn btn-secondary">
                Go Home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
