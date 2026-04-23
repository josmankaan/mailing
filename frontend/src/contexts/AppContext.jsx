import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [searchHistory, setSearchHistory] = useState([]);
  const [userPreferences, setUserPreferences] = useState({
    emailsPerPage: 10,
    autoExport: false,
    exportFormat: 'csv',
    theme: 'light'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Active history for viewing in dashboard
  const [activeHistory, setActiveHistory] = useState(null);

  // Auth States
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('b2b_token') || null);

  // Setup axios interceptor and fetch user on load
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await axios.get('https://api.atlasdatamining.com/api/auth/me');
      setUser(res.data.user);
    } catch (err) {
      console.error('Failed to fetch user', err);
      logout();
    }
  };

  const login = async (username, password) => {
    const res = await axios.post('https://api.atlasdatamining.com/api/auth/login', { username, password });
    localStorage.setItem('b2b_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const register = async (username, password, email) => {
    const res = await axios.post('https://api.atlasdatamining.com/api/auth/register', { username, password, email });
    localStorage.setItem('b2b_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('b2b_token');
    setToken(null);
    setUser(null);
  };

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('appPreferences');
    const savedHistory = localStorage.getItem('searchHistory');
    
    if (savedPreferences) {
      setUserPreferences(JSON.parse(savedPreferences));
    }
    
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('appPreferences', JSON.stringify(userPreferences));
  }, [userPreferences]);

  // Save search history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  const addToSearchHistory = (search) => {
    setSearchHistory(prev => {
      const newHistory = [search, ...prev.filter(item => 
        item.sector !== search.sector || item.city !== search.city
      )].slice(0, 10); // Keep only last 10 searches
      return newHistory;
    });
  };

  const updatePreferences = (newPreferences) => {
    setUserPreferences(prev => ({ ...prev, ...newPreferences }));
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const deleteHistoryRecord = async (id) => {
    try {
      const b2b_token = localStorage.getItem('b2b_token');
      await axios.delete(`https://api.atlasdatamining.com/api/history/${id}`, {
        headers: {
          'Authorization': `Bearer ${b2b_token}`
        }
      });
      // No need to fetchUser as tokens aren't affected
    } catch (err) {
      console.error('Failed to delete history record', err);
      throw err;
    }
  };

  const updateHistoryMailed = async (id, isMailed) => {
    try {
      const b2b_token = localStorage.getItem('b2b_token');
      await axios.patch(`https://api.atlasdatamining.com/api/history/${id}`, { isMailed }, {
        headers: {
          'Authorization': `Bearer ${b2b_token}`
        }
      });
    } catch (err) {
      console.error('Failed to update mailed status', err);
      throw err;
    }
  };

  const setLoading = (loading) => {
    setIsLoading(loading);
  };

  const setAppError = (errorMessage) => {
    setError(errorMessage);
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    searchHistory,
    userPreferences,
    isLoading,
    error,
    addToSearchHistory,
    updatePreferences,
    clearSearchHistory,
    setLoading,
    setAppError,
    clearError,
    user,
    token,
    login,
    register,
    logout,
    fetchUser,
    activeHistory,
    setActiveHistory,
    deleteHistoryRecord,
    updateHistoryMailed
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
