import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../contexts/AppContext';
import { Search, Users, Coins, History, Edit2, Check, X, Shield, Mail, Calendar } from 'lucide-react';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingToken, setEditingToken] = useState(null);
  const [newTokenValue, setNewTokenValue] = useState('');
  const [selectedUserHistory, setSelectedUserHistory] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('https://api.atlasdatamining.com/api/admin/users');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTokens = async (userId) => {
    try {
      const tokens = parseInt(newTokenValue);
      if (isNaN(tokens)) return;

      const res = await axios.put(`https://api.atlasdatamining.com/api/admin/users/${userId}/tokens`, { tokens });
      if (res.data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, tokens: res.data.user.tokens } : u));
        setEditingToken(null);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update tokens');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-on-surface flex items-center gap-3">
            <span className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Shield size={32} />
            </span>
            Admin Dashboard
          </h1>
          <p className="text-on-surface-variant mt-2 text-lg">Manage users, adjust tokens, and monitor system activity.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10 flex items-center gap-4 min-w-[200px]">
            <div className="p-3 bg-secondary/10 rounded-xl text-secondary">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-outline">Total Users</p>
              <p className="text-2xl font-black text-on-surface">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-2xl flex items-center gap-3 border border-error/20">
          <X size={20} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User List Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users size={20} className="text-primary" />
                User Management
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container/50">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-outline">User</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-outline text-center">Tokens</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-outline text-center">History</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-outline text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center font-bold text-primary">
                            {user.username[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-on-surface flex items-center gap-2">
                              {user.username}
                              {user.isAdmin && <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded font-black uppercase tracking-tighter">Admin</span>}
                            </div>
                            <div className="text-xs text-outline flex items-center gap-1">
                              <Mail size={12} /> {user.email || 'No email provided'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {editingToken === user.id ? (
                            <div className="flex items-center gap-1 bg-surface-container rounded-lg p-1">
                              <input 
                                type="number" 
                                className="w-20 bg-transparent border-0 focus:ring-0 text-sm font-bold px-2 py-1"
                                value={newTokenValue}
                                onChange={e => setNewTokenValue(e.target.value)}
                                autoFocus
                              />
                              <button onClick={() => handleUpdateTokens(user.id)} className="p-1 hover:bg-primary/10 text-primary rounded-md transition-colors">
                                <Check size={16} />
                              </button>
                              <button onClick={() => setEditingToken(null)} className="p-1 hover:bg-error/10 text-error rounded-md transition-colors">
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group/token">
                              <span className="font-black text-on-surface flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-full border border-outline-variant/10">
                                <Coins size={14} className="text-amber-500" />
                                {user.tokens.toLocaleString()}
                              </span>
                              <button 
                                onClick={() => { setEditingToken(user.id); setNewTokenValue(user.tokens); }}
                                className="p-1.5 text-outline opacity-0 group-hover:opacity-100 group-hover/token:text-primary transition-all hover:bg-primary/5 rounded-lg"
                                title="Edit tokens"
                              >
                                <Edit2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => setSelectedUserHistory(user)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedUserHistory?.id === user.id ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-transparent border-outline-variant/30 text-outline hover:border-primary hover:text-primary'}`}
                        >
                          View {user.histories?.length || 0} searches
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-xs text-outline tabular-nums">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* User Search History Panel */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm sticky top-8 max-h-[calc(100vh-100px)] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container/30">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <History size={20} className="text-secondary" />
                User Activity
              </h2>
              {selectedUserHistory && (
                <button onClick={() => setSelectedUserHistory(null)} className="text-xs text-outline hover:text-primary">Clear</button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {!selectedUserHistory ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-surface-container flex items-center justify-center text-outline-variant mb-4 border border-outline-variant/10">
                    <Search size={32} />
                  </div>
                  <p className="text-on-surface-variant font-medium">Select a user to view their search history</p>
                  <p className="text-xs text-outline mt-1">Detailed history logs will appear here</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/10">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center font-bold text-secondary">
                      {selectedUserHistory.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">{selectedUserHistory.username}'s Search Trail</p>
                      <p className="text-xs text-outline">{selectedUserHistory.histories?.length || 0} total records</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedUserHistory.histories && selectedUserHistory.histories.length > 0 ? (
                      selectedUserHistory.histories.map(item => (
                        <div key={item.id} className="p-4 rounded-2xl bg-surface-container/50 border border-outline-variant/10 hover:border-secondary/30 transition-all group">
                          <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-black uppercase rounded tracking-tighter">
                              {item.sector}
                            </span>
                            <span className="text-[10px] text-outline font-medium flex items-center gap-1">
                              <Calendar size={10} />
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="font-bold text-sm text-on-surface group-hover:text-secondary transition-colors underline decoration-secondary/0 group-hover:decoration-secondary/30 underline-offset-4">{item.city}</p>
                          <div className="mt-3 flex items-center justify-between text-[10px]">
                            <span className={`px-2 py-0.5 rounded-full font-bold ${item.isMailed ? 'bg-green-500/10 text-green-500' : 'bg-outline-variant/10 text-outline'}`}>
                              {item.isMailed ? 'ENRICHED & MAILED' : 'SEARCH ONLY'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-8 text-on-surface-variant text-sm italic">No search history found for this user.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
