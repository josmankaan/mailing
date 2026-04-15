import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './contexts/AppContext'
import Layout from './components/Layout'
import SearchForm from './components/SearchForm'
import ResultsListSimple from './components/ResultsListSimple'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HistoryPage from './pages/HistoryPage'
import ExportPage from './pages/ExportPage'
import ComingSoonPage from './pages/ComingSoonPage'
import AdminPanel from './pages/AdminPanel'
import LandingPage from './pages/LandingPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import PricingPage from './pages/PricingPage'
import './App.css'

function ProtectedRoute({ children }) {
  const { token } = useApp();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, token } = useApp();
  if (!token) return <Navigate to="/login" replace />;
  if (!user || !user.isAdmin) return <Navigate to="/" replace />;
  return children;
}

function HomePage() {
  const { activeHistory, setActiveHistory } = useApp();
  const [searchResults, setSearchResults] = useState([]);
  const [searchSector, setSearchSector] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [currentHistoryId, setCurrentHistoryId] = useState(null);

  const handleSearchResults = (places, sector, city, historyId) => {
    setSearchResults(places);
    setSearchSector(sector || '');
    setSearchCity(city || '');
    setCurrentHistoryId(historyId);
    setActiveHistory(null); // Clear loaded result if new search is made
  };

  useEffect(() => {
    if (activeHistory) {
      try {
        const places = JSON.parse(activeHistory.dataPayload);
        setSearchResults(places);
        setSearchSector(activeHistory.sector || '');
        setSearchCity(activeHistory.city || '');
        setCurrentHistoryId(activeHistory.id);
      } catch (err) {
        console.error('Failed to parse history data', err);
      }
    }
  }, [activeHistory]);

  return (
    <>
      <SearchForm onSearchResults={handleSearchResults} />
      <ResultsListSimple 
        places={searchResults} 
        sector={searchSector} 
        city={searchCity} 
        historyId={currentHistoryId}
      />
    </>
  );
}

function MainRoutes() {
  const { token } = useApp();
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/" element={
          token ? <Navigate to="/dashboard" replace /> : <LandingPage />
        } />
        <Route path="/dashboard" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/export" element={<ProtectedRoute><ExportPage /></ProtectedRoute>} />
        <Route path="/pricing" element={<ProtectedRoute><PricingPage /></ProtectedRoute>} />
        <Route path="/integrations" element={<ProtectedRoute><ComingSoonPage title="Integrations" /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <MainRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}

export default App
