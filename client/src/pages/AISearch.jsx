import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Search, Sparkles, Tag, DollarSign, Zap, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AISearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (query) {
      performSearch(query, page);
    }
  }, [query, page]);

  const performSearch = async (searchTerm, pageNum = 1) => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const params = { q: searchTerm, page: pageNum, useAI: useAI ? 'true' : 'false' };
      const res = await api.get('/products/search/ai', { params });
      setResults(res.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery, page: '1' });
      setPage(1);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setSearchParams({ q: query, page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults(null);
    navigate('/products');
  };

  const formatPrice = (price) => {
    return `RM ${price.toFixed(2)}`;
  };

  const getIntentBadge = (type, value) => {
    const badges = {
      category: { icon: Tag, color: 'bg-blue-100 text-blue-700', label: 'Category' },
      priceRange: { icon: DollarSign, color: 'bg-green-100 text-green-700', label: 'Price' },
      features: { icon: Zap, color: 'bg-purple-100 text-purple-700', label: 'Features' },
    };

    const config = badges[type];
    if (!config || !value) return null;

    const Icon = config.icon;

    if (type === 'priceRange') {
      const { min, max } = value;
      if (!min && !max) return null;
      const priceText = min && max ? `RM ${min} - RM ${max}` : min ? `Above RM ${min}` : `Under RM ${max}`;
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
          <Icon className="h-3 w-3" />
          {config.label}: {priceText}
        </span>
      );
    }

    if (type === 'features') {
      if (!value.length) return null;
      return value.map(feature => (
        <span key={feature} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
          <Icon className="h-3 w-3" />
          {feature.charAt(0).toUpperCase() + feature.slice(1)}
        </span>
      ));
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}: {value}
      </span>
    );
  };

  return (
    <div>
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary-600" />
          AI-Powered Search
        </h1>

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Try: 'gaming laptop under 3000' or 'portable computer for student'"
              className="input pl-10 pr-10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </button>
        </form>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="h-4 w-4 text-primary-600"
            />
            <Sparkles className="h-4 w-4 text-primary-600" />
            Use AI for better results
          </label>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Search Intent Display */}
      {results?.intent && (
        <div className="card p-4 mb-6 bg-primary-50 border-primary-200">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary-600" />
            <span className="text-sm font-medium text-primary-700">
              Search Intent {results.intent.usedAI && '(AI Enhanced)'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {getIntentBadge('category', results.intent.category)}
            {getIntentBadge('priceRange', results.intent.priceRange)}
            {getIntentBadge('features', results.intent.features)}
            {results.intent.keyword && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                <Search className="h-3 w-3" />
                Keyword: {results.intent.keyword}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : !results ? (
        <div className="card text-center py-12">
          <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Enter a search query to find products</p>
          <p className="text-sm text-gray-400 mt-2">
            Try natural language like "gaming laptop under 3000" or "portable computer for student"
          </p>
        </div>
      ) : results.products.length === 0 ? (
        <div className="card text-center py-12">
          <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No products found</p>
          <p className="text-sm text-gray-400 mt-2">Try different keywords or adjust your search</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Found {results.pagination.total} products
              {results.intent.usedAI && ' (AI enhanced)'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.products.map(product => (
              <Link
                key={product.id}
                to={`/products/${product.slug}`}
                className="card overflow-hidden hover:shadow-lg transition-shadow group"
              >
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Search className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-sm line-clamp-2 mb-2">{product.name}</h3>
                  {product.brand && (
                    <div className="flex items-center gap-1.5 mb-1">
                      {product.brand.logo && <img src={product.brand.logo} alt={product.brand.name} className="h-3.5 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />}
                      <p className="text-xs text-gray-500">{product.brand.name}</p>
                    </div>
                  )}
                  {product.category && (
                    <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mb-2">
                      {product.category.name}
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary-600">{formatPrice(product.price)}</span>
                    {product.isFeatured && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Featured</span>
                    )}
                  </div>
                  {product.stock > 0 ? (
                    <p className="text-xs text-green-600 mt-2">In Stock ({product.stock})</p>
                  ) : (
                    <p className="text-xs text-red-600 mt-2">Out of Stock</p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {results.pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <div className="text-sm text-gray-600">
                Page {results.pagination.page} of {results.pagination.pages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary p-2 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(5, results.pagination.pages) }, (_, i) => {
                  let pageNum;
                  if (results.pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= results.pagination.pages - 2) {
                    pageNum = results.pagination.pages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium ${
                        page === pageNum
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(Math.min(results.pagination.pages, page + 1))}
                  disabled={page === results.pagination.pages}
                  className="btn btn-secondary p-2 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
