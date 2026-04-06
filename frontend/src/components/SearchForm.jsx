import React, { useState } from 'react';
import axios from 'axios';
import { useApp } from '../contexts/AppContext';

const SearchForm = ({ onSearchResults }) => {
  const { fetchUser, token } = useApp();
  const [sector, setSector] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!sector.trim() || !city.trim()) {
      setError('Please fill in both sector and city fields');
      return;
    }

    if (sector.trim().length < 2 || city.trim().length < 2) {
      setError('Both fields must be at least 2 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:3001/api/places/search', {
        sector: sector.trim(),
        city: city.trim()
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        onSearchResults(response.data.places, sector.trim(), city.trim(), response.data.historyId);
        fetchUser(); // Refresh tokens
        if (response.data.places.length === 0) {
          setError('No businesses found for your search criteria');
        }
      } else {
        setError(response.data.error || 'Search failed');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Network error. Please try again.';
      setError(msg);
      if (err.response?.status === 402) {
        // Specific handling for insufficient tokens if needed
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-12">
      <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Lead Extraction Engine</h1>
          <p className="text-on-surface-variant text-sm">Deploy Atlas intelligence to scrape and verify high-intent B2B leads across any sector.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Sector Input */}
            <div className="md:col-span-5 group">
              <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2 pl-1">Sector</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">apartment</span>
                <input
                  type="text"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="e.g., Real Estate, Skate Shops"
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary/40 transition-all text-on-surface placeholder:text-outline-variant"
                  disabled={loading}
                />
              </div>
            </div>

            {/* City Input */}
            <div className="md:col-span-4 group">
              <label className="block text-xs font-bold uppercase tracking-widest text-primary mb-2 pl-1">City</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">location_on</span>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., Los Angeles, New York"
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary/40 transition-all text-on-surface placeholder:text-outline-variant"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full cta-gradient text-white font-bold py-3 px-6 rounded-lg inner-glow shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>rocket_launch</span>
                    Start Mining
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}
        </form>
      </div>
    </section>
  );
};

export default SearchForm;
