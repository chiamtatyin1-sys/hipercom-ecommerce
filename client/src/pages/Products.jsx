import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, Grid, List, Star, ChevronLeft, ChevronRight, X } from 'lucide-react';
import api from '../services/api';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
  });

  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    fetchProducts();
    fetchFilters();
  }, [searchParams]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries([...searchParams]);
      const res = await api.get('/products', { params });
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        api.get('/categories'),
        api.get('/brands'),
      ]);
      setCategories(catRes.data);
      setBrands(brandRes.data);
    } catch (error) {
      console.error('Failed to fetch filters:', error);
    }
  };

  const updateFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
    });
    setSearchParams({});
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-gray-500 mt-1">{pagination.total} products found</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-secondary flex items-center">
            <Filter className="h-4 w-4 mr-2" /> Filters
          </button>
          <div className="flex border rounded-lg">
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600'}`}>
              <Grid className="h-5 w-5" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600'}`}>
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:w-64 bg-white p-6 rounded-xl border h-fit">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Filters</h3>
              <button onClick={clearFilters} className="text-sm text-primary-600">Clear All</button>
            </div>

            <div className="space-y-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium mb-2">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder="Search products..."
                  className="input"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => updateFilter('category', e.target.value)}
                  className="input"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium mb-2">Brand</label>
                <select
                  value={filters.brand}
                  onChange={(e) => updateFilter('brand', e.target.value)}
                  className="input"
                >
                  <option value="">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium mb-2">Price Range</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                    placeholder="Min"
                    className="input"
                  />
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                    placeholder="Max"
                    className="input"
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="input"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No products found</p>
              <button onClick={clearFilters} className="btn btn-primary mt-4">Clear Filters</button>
            </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
              {products.map(product => (
                <Link key={product.id} to={`/products/${product.slug}`} className="card overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="aspect-square bg-gray-100 relative">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                  </div>
                  <div className="p-4">
<h3 className="font-semibold text-lg mb-1 group-hover:text-primary-600 line-clamp-2">{product.name}</h3>
<div className="flex items-center mb-2">
  {product.brand?.logo ? (
    <>
      <img 
        src={product.brand.logo.startsWith('http') ? product.brand.logo : product.brand.logo} 
        alt={product.brand.name} 
        className="w-5 h-5 mr-2 object-contain"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
      <span 
        className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center font-bold text-xs hidden"
        style={{ display: 'none' }}
      >
        {product.brand.name.charAt(0)}
      </span>
    </>
  ) : product.brand?.name ? (
    <span className="text-xs text-gray-500">{product.brand.name}</span>
  ) : null}
</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary-600">RM {product.price.toFixed(2)}</span>
                      <span className={`text-xs ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <button
                onClick={() => updateFilter('page', pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn btn-secondary disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => updateFilter('page', pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="btn btn-secondary disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}