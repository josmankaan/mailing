import React, { useState } from 'react';
import axios from 'axios';
import { useApp } from '../contexts/AppContext';

const ResultsListSimple = ({ places, sector, city, historyId }) => {
  const { user, fetchUser, token } = useApp();
  const [scrapingJob, setScrapingJob] = useState(null);
  const [scrapingResults, setScrapingResults] = useState(null);
  const [showEmails, setShowEmails] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const emailsPerPage = 10;

  if (!places || places.length === 0) {
    return null;
  }

  // Combine places and scrapingResults into enriched data
  const enrichedPlaces = places.map(place => {
    // 1. Initialize from existing place data (History support)
    let socialData = place.socials || null;
    let scrapedEmails = place.scrapedEmails || [];
    let scrapedJunkEmails = place.scrapedJunkEmails || [];

    // 2. Overwrite/Update with current session scraping results if they exist
    if (scrapingResults && scrapingResults.results) {
      const match = scrapingResults.results.find(r =>
        r.url === place.website || (place.website && place.website.includes(r.url)) || (r.url && r.url.includes(place.website))
      );
      if (match) {
        socialData = match.socials;
        scrapedEmails = match.emails;
        scrapedJunkEmails = match.junkEmails;
      }
    }
    return { ...place, socials: socialData, scrapedEmails, scrapedJunkEmails };
  });

  const hasAnyEnrichment = enrichedPlaces.some(p => (p.scrapedEmails && p.scrapedEmails.length > 0) || p.socials);

  const startScraping = async () => {
    const websites = places
      .filter(place => place.website)
      .map(place => place.website);

    if (websites.length === 0) {
      alert('No websites found for scraping');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3001/api/scrape/emails', {
        websites,
        sector: sector || '',
        city: city || '',
        placesData: places,
        historyId: historyId
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const jobId = response.data.jobId;
      setScrapingJob(jobId);
      setShowEmails(true);
      pollForResults(jobId);

    } catch (error) {
      console.error('Scraping error:', error);
      if (error.response?.status === 402) {
        alert('⚠️ Yetersiz Token! Lütfen bakiyenizi kontrol edin.');
      } else if (error.response?.status === 401) {
        alert('Lütfen önce giriş yapın.');
      } else {
        alert('Failed to start email scraping');
      }
    }
  };

  const pollForResults = (jobId) => {
    const interval = setInterval(async () => {
      try {
        const statusResponse = await axios.get(`http://localhost:3001/api/scrape/status/${jobId}`);
        const job = statusResponse.data.job;

        if (job.status === 'completed') {
          const successful = job.results.filter(r => r.success).length;
          const failed = job.results.filter(r => !r.success).length;
          const totalEmails = job.results.reduce((sum, r) => sum + r.emailCount, 0);
          const uniqueEmails = [...new Set(job.results.flatMap(r => r.emails))];
          const totalJunkEmails = job.results.reduce((sum, r) => sum + (r.junkEmails ? r.junkEmails.length : 0), 0);

          const stats = { totalWebsites: job.results.length, successful, failed, totalEmails, uniqueEmailCount: uniqueEmails.length, uniqueEmails, totalJunkEmails };
          setScrapingResults({ results: job.results, stats });
          setScrapingJob(null);
          clearInterval(interval);
          fetchUser();
        } else if (job.status === 'failed') {
          setScrapingResults({ results: job.results, stats: null });
          setScrapingJob(null);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Status check error:', error);
        clearInterval(interval);
        setScrapingJob(null);
      }
    }, 2000);
    setTimeout(() => clearInterval(interval), 300000);
  };

  const filteredEmails = scrapingResults?.stats?.uniqueEmails?.filter(email =>
    email.toLowerCase().includes(emailSearch.toLowerCase())
  ) || [];

  const indexOfLastEmail = currentPage * emailsPerPage;
  const indexOfFirstEmail = indexOfLastEmail - emailsPerPage;
  const currentEmails = filteredEmails.slice(indexOfFirstEmail, indexOfLastEmail);
  const totalPages = Math.ceil(filteredEmails.length / emailsPerPage);

  const handleSearchChange = (value) => {
    setEmailSearch(value);
    setCurrentPage(1);
  };

  // Export functions
  const exportToCSV = () => {
    const headers = ["Firma Adı", "Adres", "Telefon", "Websitesi", "E-postalar", "Instagram", "Facebook", "LinkedIn", "Twitter", "Elenen E-postalar"];
    const rows = enrichedPlaces.map(place => {
      const escapeCsv = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`;
      return [
        escapeCsv(place.name), escapeCsv(place.address), escapeCsv(place.phone), escapeCsv(place.website),
        escapeCsv((place.scrapedEmails || []).join('; ')),
        escapeCsv(place.socials?.instagram), escapeCsv(place.socials?.facebook),
        escapeCsv(place.socials?.linkedin), escapeCsv(place.socials?.twitter),
        escapeCsv((place.scrapedJunkEmails || []).join('; '))
      ].join(',');
    });
    const csvContent = "\uFEFF" + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'atlas_prime_leads.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const exportData = enrichedPlaces.map(place => ({
      name: place.name, address: place.address, phone: place.phone, website: place.website,
      emails: place.scrapedEmails || [], junkEmails: place.scrapedJunkEmails || [],
      socials: place.socials || { instagram: null, facebook: null, linkedin: null, twitter: null }
    }));
    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'atlas_prime_leads.json';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      {/* Action Bar */}
      <div className="mt-8 pt-6 border-t border-outline-variant/10 flex flex-wrap gap-4 items-center">
        <span className="text-xs font-bold text-outline uppercase tracking-widest">Available Actions:</span>
        
        {/* Extract Emails / Enriched Button */}
        {places.some(place => place.website) && (
          <button
            onClick={startScraping}
            disabled={scrapingJob !== null || (hasAnyEnrichment && !scrapingJob)}
            className={`flex items-center gap-2 font-bold px-5 py-2 rounded-lg inner-glow shadow-lg transition-all disabled:opacity-80 ${
              hasAnyEnrichment && !scrapingJob 
                ? 'bg-secondary/10 text-secondary border border-secondary/20 cursor-default' 
                : 'cta-gradient text-white shadow-primary/20 hover:opacity-90 active:scale-95 disabled:opacity-50 animate-pulse-glow'
            }`}
          >
            {scrapingJob ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Extracting...</>
            ) : hasAnyEnrichment ? (
              <><span className="material-symbols-outlined text-base" style={{fontVariationSettings: "'FILL' 1"}}>task_alt</span> Enriched</>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base" style={{fontVariationSettings: "'FILL' 1"}}>email</span>
                  Refine Contacts
                </div>
                <span className="text-[9px] opacity-70 font-medium">Email, Social, Phone</span>
              </div>
            )}
          </button>
        )}

        <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors text-sm font-semibold text-on-surface">
          <span className="material-symbols-outlined text-base">download</span>
          Export CSV
        </button>
        <button onClick={exportToJSON} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors text-sm font-semibold text-on-surface">
          <span className="material-symbols-outlined text-base">code</span>
          Export JSON
        </button>
        <div className="ml-auto flex items-center gap-2 text-on-secondary-container">
          <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
          <span className="text-xs font-bold uppercase tracking-wider">AI Cleaning Active</span>
        </div>
      </div>

      {/* Scraping Loading State */}
      {scrapingJob && (
        <div className="mt-8 bg-surface-container-lowest rounded-xl p-10 shadow-sm border border-outline-variant/10 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-on-surface font-semibold">Extracting leads from websites...</p>
          <p className="text-outline text-sm mt-1">This may take a few moments</p>
        </div>
      )}

      {/* Stats Bar */}
      {scrapingResults && scrapingResults.stats && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/5">
            <p className="text-[0.65rem] font-bold text-outline uppercase tracking-widest">Websites</p>
            <p className="text-2xl font-black text-on-surface mt-1">{scrapingResults.stats.totalWebsites}</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/5">
            <p className="text-[0.65rem] font-bold text-outline uppercase tracking-widest">Successful</p>
            <p className="text-2xl font-black text-secondary mt-1">{scrapingResults.stats.successful}</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/5">
            <p className="text-[0.65rem] font-bold text-outline uppercase tracking-widest">Unique Emails</p>
            <p className="text-2xl font-black text-primary mt-1">{scrapingResults.stats.uniqueEmailCount}</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/5">
            <p className="text-[0.65rem] font-bold text-outline uppercase tracking-widest">Cleaned / Junk</p>
            <p className="text-2xl font-black text-error mt-1">{scrapingResults.stats.totalJunkEmails}</p>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="mt-10 mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-on-surface">
          Extraction Results <span className="text-outline font-normal text-sm ml-2">({enrichedPlaces.length} leads found)</span>
        </h2>
      </div>

      {/* Lead Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrichedPlaces.map((place, index) => (
          <div key={index} className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5">
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">domain</span>
                </div>
                <div className="flex gap-2">
                  {place.website && (
                    <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-outline-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-lg">public</span>
                    </a>
                  )}
                  {place.socials?.linkedin && (
                    <a href={place.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-outline-variant hover:text-[#0077b5] transition-colors">
                      <span className="material-symbols-outlined text-lg">link</span>
                    </a>
                  )}
                  {place.socials?.facebook && (
                    <a href={place.socials.facebook} target="_blank" rel="noopener noreferrer" className="text-outline-variant hover:text-[#1877F2] transition-colors">
                      <span className="material-symbols-outlined text-lg">chat</span>
                    </a>
                  )}
                  {place.socials?.instagram && (
                    <a href={place.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-outline-variant hover:text-[#E4405F] transition-colors">
                      <span className="material-symbols-outlined text-lg">photo_camera</span>
                    </a>
                  )}
                  {place.socials?.twitter && (
                    <a href={place.socials.twitter} target="_blank" rel="noopener noreferrer" className="text-outline-variant hover:text-[#000] transition-colors">
                      <span className="material-symbols-outlined text-lg">close</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Name & Address */}
              <h3 className="text-lg font-bold text-on-surface mb-1">{place.name}</h3>
              <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-4">
                <span className="material-symbols-outlined text-sm">location_on</span>
                {place.address || 'No address'}
              </div>

              {/* Phone & Emails */}
              <div className="space-y-3">
                {place.phone && (
                  <div className="flex items-center justify-between group bg-surface-container-low p-2 rounded-lg">
                    <a href={`tel:${place.phone.replace(/[^0-9+]/g, '')}`} className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-sm">call</span>
                      <span className="text-sm font-medium text-on-surface">{place.phone}</span>
                    </a>
                    <button onClick={() => copyToClipboard(place.phone)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-primary">
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                    </button>
                  </div>
                )}
                {place.scrapedEmails && place.scrapedEmails.map((email, ei) => (
                  <div key={ei} className="flex items-center justify-between group bg-surface-container-low p-2 rounded-lg">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="material-symbols-outlined text-primary text-sm">mail</span>
                      <span className="text-sm font-medium text-on-surface truncate">{email}</span>
                    </div>
                    <button onClick={() => copyToClipboard(email)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-primary">
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Media Links */}
            {place.socials && (place.socials.instagram || place.socials.facebook || place.socials.linkedin || place.socials.twitter) && (
              <div className="border-t border-outline-variant/5 px-5 py-3">
                <div className="flex flex-wrap gap-2">
                  {place.socials.instagram && (
                    <a href={place.socials.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#833AB4]/10 via-[#E4405F]/10 to-[#FCAF45]/10 text-[#E4405F] px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-80 transition-opacity">
                      <span className="material-symbols-outlined text-sm">photo_camera</span>
                      Instagram
                    </a>
                  )}
                  {place.socials.facebook && (
                    <a href={place.socials.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-[#1877F2]/10 text-[#1877F2] px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-80 transition-opacity">
                      <span className="material-symbols-outlined text-sm">chat</span>
                      Facebook
                    </a>
                  )}
                  {place.socials.linkedin && (
                    <a href={place.socials.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-[#0077b5]/10 text-[#0077b5] px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-80 transition-opacity">
                      <span className="material-symbols-outlined text-sm">link</span>
                      LinkedIn
                    </a>
                  )}
                  {place.socials.twitter && (
                    <a href={place.socials.twitter} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-[#000]/5 text-[#000] px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-80 transition-opacity">
                      <span className="material-symbols-outlined text-sm">close</span>
                      X / Twitter
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Collapsible Cleaned Data */}
            {place.scrapedJunkEmails && place.scrapedJunkEmails.length > 0 && (
              <div className="border-t border-outline-variant/5 bg-surface/50 p-4">
                <details className="group">
                  <summary className="list-none flex items-center justify-between cursor-pointer text-[10px] font-black uppercase tracking-widest text-outline hover:text-on-surface-variant">
                    <span>Cleaned Data</span>
                    <span className="material-symbols-outlined text-sm transition-transform group-open:rotate-180">expand_more</span>
                  </summary>
                  <div className="mt-3 space-y-2">
                    {place.scrapedJunkEmails.map((junk, ji) => (
                      <div key={ji} className="flex items-center gap-2 text-error/60 line-through text-xs italic">
                        <span className="material-symbols-outlined text-xs">block</span>
                        {junk}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Email List (Pagination) */}
      {scrapingResults?.stats?.uniqueEmailCount > 0 && (
        <div className="mt-10 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">mail</span>
              All Extracted Emails
            </h3>
          </div>
          <div className="mb-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">search</span>
              <input
                type="text"
                placeholder="Search emails..."
                value={emailSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary/40 transition-all text-on-surface placeholder:text-outline-variant"
              />
            </div>
          </div>
          <div className="space-y-1">
            {currentEmails.map((email, index) => (
              <div key={index} className="flex items-center justify-between group bg-surface-container-low p-3 rounded-lg hover:bg-surface-container-high transition-colors">
                <span className="text-sm font-medium text-on-surface">{email}</span>
                <button onClick={() => copyToClipboard(email)} className="opacity-0 group-hover:opacity-100 text-primary text-xs font-bold bg-primary/5 px-3 py-1 rounded-lg hover:bg-primary hover:text-white transition-all">
                  Copy
                </button>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 pt-4 border-t border-outline-variant/10 flex items-center justify-between">
              <p className="text-xs text-outline font-medium">
                Showing {indexOfFirstEmail + 1}-{Math.min(indexOfLastEmail, filteredEmails.length)} of {filteredEmails.length}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 border border-outline-variant/10 rounded-lg hover:bg-white transition-colors disabled:opacity-30">
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <span className="p-2 border border-outline-variant/10 rounded-lg bg-white shadow-sm font-bold text-xs px-4">{currentPage}</span>
                <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 border border-outline-variant/10 rounded-lg hover:bg-white transition-colors disabled:opacity-30">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ResultsListSimple;
