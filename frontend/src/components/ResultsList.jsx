import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../contexts/AppContext';

const ResultsList = ({ places }) => {
  const [scrapingJob, setScrapingJob] = useState(null);
  const [scrapingResults, setScrapingResults] = useState(null);
  const [showEmails, setShowEmails] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { userPreferences, addToSearchHistory, setLoading, setAppError, clearError } = useApp();
  const emailsPerPage = userPreferences.emailsPerPage || 10;

  if (!places || places.length === 0) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-500 text-center">No results to display</p>
        </div>
      </div>
    );
  }

  const startScraping = async () => {
    // Extract websites from places
    const websites = places
      .filter(place => place.website)
      .map(place => place.website);

    if (websites.length === 0) {
      alert('No websites found for scraping');
      return;
    }

    try {
      setLoading(true);
      clearError();
      
      // Add to search history
      const lastSearch = { sector: places[0]?.sector || 'Unknown', city: places[0]?.city || 'Unknown' };
      addToSearchHistory(lastSearch);

      // Start scraping job
      const response = await axios.post('https://api.atlasdatamining.com/api/scrape/emails', {
        websites: websites
      });

      const jobId = response.data.jobId;
      setScrapingJob(jobId);
      setShowEmails(true);

      // Poll for results
      pollForResults(jobId);

    } catch (error) {
      console.error('Scraping error:', error);
      setAppError('Failed to start email scraping');
      setLoading(false);
    }
  };

  const pollForResults = (jobId) => {
    const interval = setInterval(async () => {
      try {
        const statusResponse = await axios.get(`https://api.atlasdatamining.com/api/scrape/status/${jobId}`);
        const job = statusResponse.data.job;

        if (job.status === 'completed') {
          console.log('=== JOB COMPLETED ===');
          console.log('Job results:', job.results);
          setScrapingResults(job.results);
          setScrapingJob(null);
          setLoading(false);
          clearInterval(interval);
        } else if (job.status === 'failed') {
          console.log('=== JOB FAILED ===');
          setAppError('Email scraping failed');
          setScrapingJob(null);
          setLoading(false);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Status check error:', error);
        clearInterval(interval);
        setScrapingJob(null);
        setAppError('Failed to check scraping status');
      }
    }, 2000); // Check every 2 seconds

    // Cleanup after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  // Filter emails based on search
  const filteredEmails = scrapingResults?.stats?.uniqueEmails?.filter(email =>
    email.toLowerCase().includes(emailSearch.toLowerCase())
  ) || [];

  console.log('=== DEBUG INFO ===');
  console.log('scrapingResults:', scrapingResults);
  console.log('filteredEmails:', filteredEmails);
  console.log('emailSearch:', emailSearch);

  // Pagination logic
  const indexOfLastEmail = currentPage * emailsPerPage;
  const indexOfFirstEmail = indexOfLastEmail - emailsPerPage;
  const currentEmails = filteredEmails.slice(indexOfFirstEmail, indexOfLastEmail);
  const totalPages = Math.ceil(filteredEmails.length / emailsPerPage);

  // Reset page when search changes
  const handleSearchChange = (value) => {
    setEmailSearch(value);
    setCurrentPage(1);
  };

  // Export functions
  const exportToCSV = (emails) => {
    const csvContent = "Email\n" + emails.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emails.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = (results) => {
    const jsonContent = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scraping_results.json';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            Found {places.length} Businesses
          </h3>
          
          {places.some(place => place.website) && (
            <button
              onClick={startScraping}
              disabled={scrapingJob !== null}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {scrapingJob ? 'Mining Contacts...' : 'Refine Contacts'}
            </button>
          )}
        </div>
        
        <div className="space-y-4">
          {places.map((place, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-lg font-medium text-gray-900">{place.name}</h4>
                {place.rating && (
                  <div className="flex items-center">
                    <span className="text-yellow-500 mr-1">★</span>
                    <span className="text-sm text-gray-600">{place.rating}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <p className="flex items-center">
                  <span className="mr-2">📍</span>
                  {place.address}
                </p>
                
                {place.phone && (
                  <p className="flex items-center">
                    <span className="mr-2">📞</span>
                    {place.phone}
                  </p>
                )}
                
                {place.website && (
                  <p className="flex items-center">
                    <span className="mr-2">🌐</span>
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {place.website}
                    </a>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Email Scraping Results */}
        {showEmails && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Email Extraction Results</h4>
            
            {scrapingJob && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-gray-600">Scraping websites for emails...</span>
              </div>
            )}

            {scrapingResults && scrapingResults.stats && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-blue-600 font-medium">Websites Processed</p>
                    <p className="text-2xl font-bold text-blue-800">{scrapingResults.stats.totalWebsites}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-sm text-green-600 font-medium">Successful</p>
                    <p className="text-2xl font-bold text-green-800">{scrapingResults.stats.successful}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-sm text-purple-600 font-medium">Unique Emails</p>
                    <p className="text-2xl font-bold text-purple-800">{scrapingResults.stats.uniqueEmailCount}</p>
                  </div>
                </div>

                {scrapingResults.stats && scrapingResults.stats.uniqueEmailCount > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-700">Found Emails:</h5>
                      <div className="flex gap-2">
                        <button
                          onClick={() => exportToCSV(scrapingResults.stats.uniqueEmails)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                        >
                          Export CSV
                        </button>
                        <button
                          onClick={() => exportToJSON(scrapingResults.results)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          Export JSON
                        </button>
                      </div>
                    </div>
                    
                    {/* Search and Filter */}
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Search emails..."
                        value={emailSearch}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      {currentEmails.map((email, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-700">{email}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(email)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Copy
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-sm text-gray-700">
                          Showing {indexOfFirstEmail + 1} to {Math.min(indexOfLastEmail, filteredEmails.length)} of {filteredEmails.length} emails
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <span className="px-3 py-1 text-sm">
                            {currentPage} / {totalPages}
                          </span>
                          <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {scrapingResults.stats && scrapingResults.stats.uniqueEmailCount === 0 && (
                  <p className="text-gray-500 text-center py-4">No emails found on the websites</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsList;
