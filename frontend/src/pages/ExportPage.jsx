import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useApp } from '../contexts/AppContext';

export default function ExportPage() {
  const { user } = useApp();
  const [history, setHistory] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Cell Coloring Persistence
  const storageKeyColors = 'atlas_prime_export_cell_colors';
  const [cellColors, setCellColors] = useState(() => {
    const saved = localStorage.getItem(storageKeyColors);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem(storageKeyColors, JSON.stringify(cellColors));
  }, [cellColors]);

  // Column definitions
  const allColumns = [
    { key: 'name', label: 'Company Name' },
    { key: 'sector', label: 'Sector' },
    { key: 'city', label: 'City' },
    { key: 'address', label: 'Address' },
    { key: 'phone', label: 'Phone' },
    { key: 'website', label: 'Website' },
    { key: 'emails', label: 'Emails' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'twitter', label: 'Twitter' },
  ];

  // Preference Persistence
  const storageKeyCols = 'atlas_prime_export_visible_cols';
  const storageKeyOrder = 'atlas_prime_export_col_order';

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(storageKeyCols);
    return saved ? JSON.parse(saved) : ['name', 'emails', 'phone', 'website', 'instagram'];
  });

  const [columnOrder, setColumnOrder] = useState(() => {
    const saved = localStorage.getItem(storageKeyOrder);
    return saved ? JSON.parse(saved) : allColumns.map(c => c.key);
  });

  // Derived visible order
  const currentColumns = useMemo(() => {
    return columnOrder.filter(key => visibleColumns.includes(key));
  }, [columnOrder, visibleColumns]);

  useEffect(() => {
    localStorage.setItem(storageKeyCols, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  useEffect(() => {
    localStorage.setItem(storageKeyOrder, JSON.stringify(columnOrder));
  }, [columnOrder]);

  // Selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null); // { row, col }
  const [selectionEnd, setSelectionEnd] = useState(null); // { row, col }
  const [draggedCol, setDraggedCol] = useState(null);

  const tableRef = useRef(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const b2b_token = localStorage.getItem('b2b_token');
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate + 'T23:59:59';
      
      const res = await axios.get('http://localhost:3001/api/history', { 
        params,
        headers: { Authorization: `Bearer ${b2b_token}` }
      });
      
      const rawHistory = res.data.history || [];
      setHistory(rawHistory);

      // Flatten leads
      const flattened = [];
      rawHistory.forEach(record => {
        let places = [];
        try { places = JSON.parse(record.dataPayload); } catch (e) { return; }
        places.forEach(place => {
          flattened.push({
            ...place,
            sector: record.sector,
            city: record.city,
            emails: (place.scrapedEmails || []).join('; '),
            instagram: place.socials?.instagram || '',
            facebook: place.socials?.facebook || '',
            linkedin: place.socials?.linkedin || '',
            twitter: place.socials?.twitter || '',
          });
        });
      });
      setLeads(flattened);
    } catch (err) {
      setError('Veriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Conditional Filtering Logic
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const hasEmail = lead.emails && lead.emails !== '-' && lead.emails !== '';
      const hasWebsite = lead.website && lead.website !== '-' && lead.website !== '';

      // 1. Hem E-postası Hem Web Sitesi Olmayan Kayıtların Gizlenmesi
      if (!hasEmail && !hasWebsite) return false;

      // 2. Görünür Sütun Durumuna Göre Filtreleme: 
      // Sadece "Emails" seçildiğinde, e-postası olmayanları gizle
      const onlyEmailsVisible = visibleColumns.length === 1 && visibleColumns[0] === 'emails';
      if (onlyEmailsVisible && !hasEmail) return false;

      // Kısacası: Aktifteki tüm sütunlarda "-" varsa o satırı gösterme
      const allVisibleEmpty = visibleColumns.every(col => {
        const val = lead[col];
        return !val || val === '-' || val === '';
      });
      if (allVisibleEmpty) return false;

      return true;
    });
  }, [leads, visibleColumns]);

  // Selection Logic
  const handleMouseDown = (row, col) => {
    setIsSelecting(true);
    setSelectionStart({ row, col });
    setSelectionEnd({ row, col });
  };

  const handleMouseEnter = (row, col) => {
    if (isSelecting) {
      setSelectionEnd({ row, col });
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  const isSelected = (row, col) => {
    if (!selectionStart || !selectionEnd) return false;
    const minRow = Math.min(selectionStart.row, selectionEnd.row);
    const maxRow = Math.max(selectionStart.row, selectionEnd.row);
    const minCol = Math.min(selectionStart.col, selectionEnd.col);
    const maxCol = Math.max(selectionStart.col, selectionEnd.col);
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  };

  const selectColumn = (colIndex) => {
    if (filteredLeads.length === 0) return;
    setSelectionStart({ row: 0, col: colIndex });
    setSelectionEnd({ row: filteredLeads.length - 1, col: colIndex });
  };

  const selectRow = (rowIndex) => {
    if (currentColumns.length === 0) return;
    setSelectionStart({ row: rowIndex, col: 0 });
    setSelectionEnd({ row: rowIndex, col: currentColumns.length - 1 });
  };

  // Drag & Drop Column Logic
  const handleDragStart = (e, colKey) => {
    setDraggedCol(colKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetColKey) => {
    e.preventDefault();
    if (!draggedCol || draggedCol === targetColKey) return;

    const newOrder = [...columnOrder];
    const draggedIdx = newOrder.indexOf(draggedCol);
    const targetIdx = newOrder.indexOf(targetColKey);

    newOrder.splice(draggedIdx, 1);
    newOrder.splice(targetIdx, 0, draggedCol);
    
    setColumnOrder(newOrder);
    setDraggedCol(null);
  };

  // Copy Logic
  const handleCopy = (e) => {
    if (!selectionStart || !selectionEnd) return;
    
    const minRow = Math.min(selectionStart.row, selectionEnd.row);
    const maxRow = Math.max(selectionStart.row, selectionEnd.row);
    const minCol = Math.min(selectionStart.col, selectionEnd.col);
    const maxCol = Math.max(selectionStart.col, selectionEnd.col);

    let tsvContent = '';
    for (let r = minRow; r <= maxRow; r++) {
      let rowContent = [];
      for (let c = minCol; c <= maxCol; c++) {
        const colKey = currentColumns[c];
        rowContent.push(filteredLeads[r][colKey] || '');
      }
      tsvContent += rowContent.join('\t') + (r === maxRow ? '' : '\n');
    }

    navigator.clipboard.writeText(tsvContent).then(() => {
      // Optional: show a small toast or visual cue
    });
    
    // Prevent default browser copy if you want to override it completely
    if (e) e.preventDefault();
  };

  const applyColor = (color) => {
    if (!selectionStart || !selectionEnd) return;
    
    const minRow = Math.min(selectionStart.row, selectionEnd.row);
    const maxRow = Math.max(selectionStart.row, selectionEnd.row);
    const minCol = Math.min(selectionStart.col, selectionEnd.col);
    const maxCol = Math.max(selectionStart.col, selectionEnd.col);

    const newColors = { ...cellColors };
    
    for (let r = minRow; r <= maxRow; r++) {
      const lead = filteredLeads[r];
      // Use a robust key combining lead identifier and column
      const leadId = lead.place_id || lead.id || lead.name;
      
      for (let c = minCol; c <= maxCol; c++) {
        const colKey = currentColumns[c];
        const cellKey = `${leadId}-${colKey}`;
        
        if (color === null) {
          delete newColors[cellKey];
        } else {
          newColors[cellKey] = color;
        }
      }
    }
    
    setCellColors(newColors);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+C or Ctrl+C
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        handleCopy();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredLeads, selectionStart, selectionEnd, currentColumns]);

  const toggleColumn = (key) => {
    setVisibleColumns(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const downloadCSV = () => {
    const headers = currentColumns.map(k => allColumns.find(ac => ac.key === k).label);
    const rows = filteredLeads.map(lead => {
      return currentColumns.map(k => {
        const value = lead[k] || '';
        return `"${value.toString().replace(/"/g, '""')}"`;
      }).join(',');
    });
    const csvContent = "\uFEFF" + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlas_prime_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-160px)]">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <nav className="flex items-center gap-2 text-outline mb-2 uppercase tracking-widest font-semibold text-[0.6875rem]">
              <span>Data Intelligence</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-primary">Bulk Export Hub</span>
            </nav>
            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Export Leads</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-1">
              <div className="flex items-center px-4 py-2 gap-3 group">
                <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">calendar_today</span>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent border-none p-0 text-sm focus:ring-0 w-32 text-on-surface" />
              </div>
              <div className="h-4 w-[1px] bg-outline-variant/30"></div>
              <div className="flex items-center px-4 py-2 gap-3 group">
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent border-none p-0 text-sm focus:ring-0 w-32 text-on-surface" />
              </div>
              <button 
                onClick={fetchHistory}
                disabled={loading}
                className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
              >
                Fetch Data
              </button>
            </div>
          </div>
        </header>

        {/* Table Area */}
        <div className="flex-1 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden flex flex-col">
          {leads.length > 0 ? (
            <div className="overflow-auto relative select-none" onMouseLeave={handleMouseUp}>
              {filteredLeads.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                  <span className="material-symbols-outlined text-6xl text-outline-variant/30 mb-4">filter_list_off</span>
                  <p className="text-on-surface font-semibold">No results match your filters.</p>
                  <p className="text-outline text-sm mt-1 max-w-xs">All records in this date range were hidden based on your visibility settings or lack of email/website data.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
                <thead className="sticky top-0 z-20 bg-surface-container-low/95 backdrop-blur-sm border-b border-outline-variant/20">
                  <tr>
                    <th className="w-12 px-2 py-3 text-[10px] font-bold text-outline uppercase tracking-widest text-center border-r border-outline-variant/10">#</th>
                    {currentColumns.map((colKey, index) => (
                      <th 
                        key={colKey} 
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, colKey)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, colKey)}
                        onClick={() => selectColumn(index)}
                        className={`px-4 py-3 text-[10px] font-bold text-outline uppercase tracking-widest border-r border-outline-variant/10 cursor-grab active:cursor-grabbing hover:bg-surface-variant/30 transition-colors group ${draggedCol === colKey ? 'opacity-30' : 'opacity-100'}`}
                      >
                        <div className="flex items-center gap-2 pointer-events-none">
                          <span className="material-symbols-outlined text-sm text-outline-variant/60 group-hover:text-primary transition-colors select-none">drag_indicator</span>
                          <span className="truncate">{allColumns.find(ac => ac.key === colKey).label}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody onMouseUp={handleMouseUp}>
                  {filteredLeads.map((lead, rowIndex) => (
                    <tr key={rowIndex} className={`border-b border-outline-variant/5 hover:bg-surface-variant/20 transition-colors ${rowIndex % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container-low/5'}`}>
                      <td 
                        onClick={() => selectRow(rowIndex)}
                        className="px-2 py-2 text-[10px] font-medium text-outline text-center border-r border-outline-variant/10 bg-surface-container-low/30 cursor-pointer hover:bg-primary/5 transition-colors"
                      >
                        {rowIndex + 1}
                      </td>
                      {currentColumns.map((colKey, colIndex) => (
                        <td 
                          key={colKey} 
                          onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                          onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                          style={{
                            backgroundColor: !isSelected(rowIndex, colIndex) ? cellColors[`${lead.place_id || lead.id || lead.name}-${colKey}`] : undefined
                          }}
                          className={`px-4 py-2 text-xs truncate border-r border-outline-variant/5 relative ${
                            isSelected(rowIndex, colIndex) 
                              ? 'bg-primary/20 ring-2 ring-inset ring-primary/60 z-10' 
                              : 'text-on-surface'
                          }`}
                        >
                          {lead[colKey] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <span className="material-symbols-outlined text-6xl text-outline-variant/30 mb-4">dataset</span>
              <p className="text-on-surface font-semibold">Ready to export leads.</p>
              <p className="text-outline text-sm mt-1 max-w-xs">Select a date range and click "Fetch Data" to populate the spreadsheet view.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Controls */}
      <aside className="w-64 flex flex-col gap-6">
        {/* Reset Preferences */}
        <button 
          onClick={() => {
            localStorage.removeItem(storageKeyCols);
            localStorage.removeItem(storageKeyOrder);
            window.location.reload();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-container-low text-outline text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-surface-container-high transition-all"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Reset Table View
        </button>

        {/* Cell Painter */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">palette</span>
            Cell Painter
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => applyColor('rgba(34, 197, 94, 0.2)')} // Light Green
              disabled={!selectionStart}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-green-500/10 text-green-700 border border-green-500/20 rounded-lg text-[10px] font-bold uppercase transition-all hover:bg-green-500/20 disabled:opacity-30"
            >
              Mailed
            </button>
            <button 
              onClick={() => applyColor('rgba(239, 68, 68, 0.2)')} // Light Red
              disabled={!selectionStart}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 text-red-700 border border-red-500/20 rounded-lg text-[10px] font-bold uppercase transition-all hover:bg-red-500/20 disabled:opacity-30"
            >
              Invalid
            </button>
            <button 
              onClick={() => applyColor('rgba(234, 179, 8, 0.2)')} // Light Yellow
              disabled={!selectionStart}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500/10 text-yellow-700 border border-yellow-500/20 rounded-lg text-[10px] font-bold uppercase transition-all hover:bg-yellow-500/20 disabled:opacity-30"
            >
              Later
            </button>
            <button 
              onClick={() => applyColor(null)}
              disabled={!selectionStart}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-surface-container-low text-outline border border-outline-variant/20 rounded-lg text-[10px] font-bold uppercase transition-all hover:bg-surface-container-high disabled:opacity-30"
            >
              Clear
            </button>
          </div>
          <p className="text-[9px] text-outline mt-3 leading-tight">
            Select a range in the table then click a color to mark cells.
          </p>
        </div>

        {/* Visible Columns */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-5 flex-1 overflow-auto scrollbar-permanent">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">view_column</span>
            Visible Columns
          </h2>
          <div className="space-y-3">
            {allColumns.map(col => (
              <label key={col.key} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    checked={visibleColumns.includes(col.key)}
                    onChange={() => toggleColumn(col.key)}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20 cursor-pointer"
                  />
                </div>
                <span className={`text-xs font-medium transition-colors ${visibleColumns.includes(col.key) ? 'text-on-surface' : 'text-outline group-hover:text-on-surface-variant'}`}>
                  {col.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Export Actions (Fixed at bottom) */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">ios_share</span>
            Export Actions
          </h2>
          <button 
            onClick={handleCopy}
            disabled={filteredLeads.length === 0}
            className="w-full flex items-center gap-2 px-4 py-3 bg-surface-container-low text-on-surface rounded-lg text-xs font-bold hover:bg-surface-container-high transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">content_copy</span>
            Copy Selection (TSV)
          </button>
          <button 
            onClick={downloadCSV}
            disabled={filteredLeads.length === 0}
            className="w-full flex items-center gap-2 px-4 py-3 cta-gradient text-white rounded-lg text-xs font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Download CSV
          </button>
          <p className="text-[10px] text-outline text-center mt-2 leading-relaxed italic">
            Copying as TSV allows direct pasting into Excel or Google Sheets.
          </p>
        </div>
      </aside>
    </div>
  );
}
