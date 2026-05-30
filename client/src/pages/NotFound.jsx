import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
        <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/" className="btn btn-primary flex items-center gap-2">
            <Home className="h-4 w-4" /> Go Home
          </Link>
          <button onClick={() => window.history.back()} className="btn btn-secondary flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
