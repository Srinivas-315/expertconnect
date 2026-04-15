import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getExperts } from '../api/experts';
import ExpertCard from '../components/ExpertCard';

const CATEGORIES = ['All', 'Technology', 'Finance', 'Legal', 'Healthcare', 'Marketing', 'Design', 'General'];

const Experts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [maxRate, setMaxRate] = useState('');

  const fetchExperts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (category && category !== 'All') params.category = category;
      if (maxRate) params.maxRate = maxRate;

      const res = await getExperts(params);
      setExperts(res.data.experts);
    } catch (err) {
      setError('Failed to load experts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperts();
  }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchExperts();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Find Experts</h1>
        <p className="text-gray-500 mt-1">Browse verified professionals ready to help you</p>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            id="expert-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, skill, or keyword..."
            className="input-field flex-1"
          />
          <input
            id="expert-maxrate"
            type="number"
            value={maxRate}
            onChange={(e) => setMaxRate(e.target.value)}
            placeholder="Max rate (₹/hr)"
            className="input-field w-full sm:w-40"
          />
          <button id="expert-search-btn" type="submit" className="btn-primary whitespace-nowrap">
            Search
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${
                category === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-500">{error}</p>
          <button onClick={fetchExperts} className="mt-3 btn-secondary">Retry</button>
        </div>
      ) : experts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900">No experts found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{experts.length} expert{experts.length !== 1 ? 's' : ''} found</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {experts.map((expert) => (
              <ExpertCard key={expert._id} expert={expert} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Experts;
