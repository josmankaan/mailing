import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../contexts/AppContext';

export default function HistoryPage() {
  const { user, setActiveHistory, deleteHistoryRecord, updateHistoryMailed } = useApp();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const b2b_token = localStorage.getItem('b2b_token');
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate + 'T23:59:59';
      const res = await axios.get('https://api.atlasdatamining.com/api/history', { 
        params,
        headers: { Authorization: `Bearer ${b2b_token}` }
      });
      setHistory(res.data.history || []);
    } catch (err) {
      setError('Geçmiş yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  // Bulk CSV export
  const handleBulkExport = () => {
    if (history.length === 0) return;
    const headers = ['Firma Adı', 'Adres', 'Telefon', 'Websitesi', 'E-postalar', 'Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'Elenen E-postalar', 'Sektör', 'Şehir', 'Arama Tarihi'];
    const rows = [];
    history.forEach(record => {
      let places = [];
      try { places = JSON.parse(record.dataPayload); } catch (e) { return; }
      places.forEach(place => {
        const esc = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`;
        rows.push([
          esc(place.name), esc(place.address), esc(place.phone), esc(place.website),
          esc((place.scrapedEmails || []).join('; ')),
          esc(place.socials?.instagram), esc(place.socials?.facebook),
          esc(place.socials?.linkedin), esc(place.socials?.twitter),
          esc((place.scrapedJunkEmails || []).join('; ')),
          esc(record.sector), esc(record.city),
          esc(new Date(record.createdAt).toLocaleDateString('tr-TR'))
        ].join(','));
      });
    });
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `atlas_prime_history_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalLeads = history.reduce((sum, r) => {
    try { return sum + JSON.parse(r.dataPayload).length; } catch { return sum; }
  }, 0);

  const totalEmails = history.reduce((sum, r) => {
    try {
      return sum + JSON.parse(r.dataPayload).reduce((s, p) => s + (p.scrapedEmails?.length || 0), 0);
    } catch { return sum; }
  }, 0);

  return (
    <div>
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 text-outline mb-2 uppercase tracking-widest font-semibold text-[0.6875rem]">
            <span>Analytics</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary">Intelligence Log</span>
          </nav>
          <h1 className="text-[2.5rem] font-extrabold tracking-tight text-on-surface leading-none">Search History</h1>
        </div>

        {/* Date Filter & Bulk Export */}
        <div className="flex flex-wrap items-center gap-4">
          <form onSubmit={handleFilter} className="flex items-center bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-1">
            <div className="flex items-center px-4 py-2 gap-3 group">
              <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">calendar_today</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent border-none p-0 text-sm focus:ring-0 w-32 text-on-surface placeholder-outline/50" />
            </div>
            <div className="h-4 w-[1px] bg-outline-variant/30"></div>
            <div className="flex items-center px-4 py-2 gap-3 group">
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent border-none p-0 text-sm focus:ring-0 w-32 text-on-surface placeholder-outline/50" />
            </div>
            <button type="submit" className="px-3 py-2 text-primary hover:bg-primary/5 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-sm">search</span>
            </button>
          </form>
          <button onClick={handleBulkExport} disabled={history.length === 0} className="bg-gradient-to-br from-primary to-primary-container text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[0.98] transition-all disabled:opacity-40">
            <span className="material-symbols-outlined">file_export</span>
            Bulk Export
          </button>
        </div>
      </header>

      {/* Bento Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Side Stats */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-outline mb-4">Total Searches</h3>
            <span className="text-2xl font-black text-on-surface">{history.length}</span>
          </div>
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-outline mb-4">Total Leads</h3>
            <span className="text-2xl font-black text-on-surface">{totalLeads}</span>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10 overflow-hidden relative group">
            <div className="relative z-10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-outline mb-2">Total Emails</h3>
              <p className="text-lg font-bold text-on-surface">{totalEmails}</p>
              <p className="text-xs text-secondary font-semibold mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                Verified & Cleaned
              </p>
            </div>
            <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-8xl text-surface-container-low opacity-50 group-hover:scale-110 transition-transform">mail</span>
          </div>
        </div>

        {/* History Table */}
        <div className="col-span-12 lg:col-span-9">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
            <div className="p-6 flex justify-between items-center bg-surface-container-low/30 border-b border-outline-variant/5">
              <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                Recent Activities
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-error">{error}</div>
            ) : history.length === 0 ? (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-6xl text-outline-variant/30">search_off</span>
                <p className="text-outline mt-4">Henüz geçmiş arama bulunmuyor.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/10">
                      <th className="px-6 py-4 text-[0.6875rem] font-bold text-outline uppercase tracking-widest">Search Query</th>
                      <th className="px-6 py-4 text-[0.6875rem] font-bold text-outline uppercase tracking-widest">Date & Time</th>
                      <th className="px-6 py-4 text-[0.6875rem] font-bold text-outline uppercase tracking-widest text-center">Leads Found</th>
                      <th className="px-6 py-4 text-[0.6875rem] font-bold text-outline uppercase tracking-widest text-center">Mailed</th>
                      <th className="px-6 py-4 text-[0.6875rem] font-bold text-outline uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/5">
                    {history.map(record => {
                      let places = [];
                      try { places = JSON.parse(record.dataPayload); } catch (e) {}
                      const emailCount = places.reduce((sum, p) => sum + (p.scrapedEmails?.length || 0), 0);
                      return (
                        <tr key={record.id} className={`hover:bg-surface-variant/30 transition-colors group ${record.isMailed ? 'opacity-60 bg-surface-container-low/20' : ''}`}>
                          <td className="px-0 py-0 text-on-surface">
                            {/* Clickable Search Query Cell */}
                            <button
                              onClick={() => {
                                setActiveHistory(record);
                                navigate('/');
                              }}
                              className="w-full h-full px-6 py-5 flex items-center gap-3 text-left hover:bg-primary/5 transition-colors group/cell"
                              title="Ana sayfada görüntüle"
                            >
                              <div className="w-8 h-8 rounded bg-surface-container-low flex items-center justify-center text-primary group-hover/cell:bg-primary group-hover/cell:text-white transition-colors">
                                <span className="material-symbols-outlined text-lg">search</span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-on-surface group-hover/cell:text-primary transition-colors">{record.sector || '—'} in {record.city || '—'}</p>
                                <p className="text-xs text-outline">{places.length} firms</p>
                              </div>
                            </button>
                          </td>
                          <td className="px-6 py-5 text-sm text-on-surface">
                            {new Date(record.createdAt).toLocaleDateString('tr-TR')}
                            <span className="text-outline text-xs block">{new Date(record.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="bg-secondary-container/50 text-on-secondary-container px-2 py-1 rounded text-xs font-bold">{emailCount}</span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const newStatus = !record.isMailed;
                                try {
                                  await updateHistoryMailed(record.id, newStatus);
                                  // Update local state
                                  setHistory(history.map(h => h.id === record.id ? { ...h, isMailed: newStatus } : h));
                                } catch (err) {
                                  alert('Durum güncellenirken bir hata oluştu.');
                                }
                              }}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                record.isMailed 
                                  ? 'bg-secondary text-white shadow-sm shadow-secondary/20' 
                                  : 'bg-surface-container border border-outline-variant/30 text-outline-variant hover:border-secondary hover:text-secondary'
                              }`}
                              title={record.isMailed ? 'Mail atılmadı olarak işaretle' : 'Mail atıldı olarak işaretle'}
                            >
                              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: record.isMailed ? "'FILL' 1" : "'FILL' 0" }}>
                                {record.isMailed ? 'check_circle' : 'circle'}
                              </span>
                            </button>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => {
                                  const esc = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`;
                                  const headers = ['Firma Adı','Adres','Telefon','Websitesi','E-postalar','Instagram','Facebook','LinkedIn','Twitter','Elenen'];
                                  const rows = places.map(p => [esc(p.name),esc(p.address),esc(p.phone),esc(p.website),esc((p.scrapedEmails||[]).join('; ')),esc(p.socials?.instagram),esc(p.socials?.facebook),esc(p.socials?.linkedin),esc(p.socials?.twitter),esc((p.scrapedJunkEmails||[]).join('; '))].join(','));
                                  const csv = "\uFEFF" + [headers.join(','), ...rows].join('\n');
                                  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a'); a.href = url; a.download = `${record.sector}_${record.city}.csv`; a.click();
                                }}
                                className="inline-flex items-center gap-2 text-primary text-xs font-bold bg-primary/5 px-4 py-2.5 rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm"
                              >
                                <span className="material-symbols-outlined text-base">download</span>
                                Download
                              </button>
                              
                              <button
                                onClick={async () => {
                                  if (window.confirm('Bu aramayı silmek istediğinize emin misiniz?')) {
                                    try {
                                      await deleteHistoryRecord(record.id);
                                      setHistory(history.filter(h => h.id !== record.id));
                                    } catch (err) {
                                      alert('Silme işlemi başarısız oldu.');
                                    }
                                  }
                                }}
                                className="inline-flex items-center justify-center text-error bg-error/5 w-10 h-10 rounded-lg hover:bg-error hover:text-white transition-all shadow-sm"
                                title="Delete Record"
                              >
                                <span className="material-symbols-outlined mb-0">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
