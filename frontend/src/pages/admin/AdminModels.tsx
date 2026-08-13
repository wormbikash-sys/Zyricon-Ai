import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ModelInfo } from '../../types';
import {
  Cpu,
  RefreshCw,
  Search,
  Lock,
  Eye,
  CheckCircle,
  XCircle,
  Save,
} from 'lucide-react';

export const AdminModels: React.FC = () => {
  const [catalog, setCatalog] = useState<ModelInfo[]>([]);
  const [disabledModels, setDisabledModels] = useState<string[]>([]);
  const [premiumModels, setPremiumModels] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadModels = async (refresh = false) => {
    setLoading(true);
    try {
      const data = await api.getAdminModels(refresh);
      setCatalog(data.catalog);
      setDisabledModels(data.disabledModels);
      setPremiumModels(data.premiumModels);
    } catch (err) {
      console.error('[AdminModels] Error loading models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleToggleDisabled = (id: string) => {
    if (disabledModels.includes(id)) {
      setDisabledModels(prev => prev.filter(mId => mId !== id));
    } else {
      setDisabledModels(prev => [...prev, id]);
    }
  };

  const handleTogglePremium = (id: string) => {
    if (premiumModels.includes(id)) {
      setPremiumModels(prev => prev.filter(mId => mId !== id));
    } else {
      setPremiumModels(prev => [...prev, id]);
    }
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      await api.saveModelPermissions(disabledModels, premiumModels);
      alert('Model catalog permissions saved successfully!');
    } catch (e: any) {
      alert(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const filtered = catalog.filter(
    m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">AICredits Model Catalog Management</h1>
          <p className="text-xs text-slate-400">Configure model availability, fallback order, and premium access restrictions.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadModels(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Fetch Latest Catalog</span>
          </button>

          <button
            onClick={handleSavePermissions}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-xs w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search catalog models..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(m => {
          const isDisabled = disabledModels.includes(m.id);
          const isPremiumOnly = premiumModels.includes(m.id);

          return (
            <div
              key={m.id}
              className={`bg-slate-900 border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                isDisabled ? 'border-rose-500/30 opacity-60' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-100 truncate flex items-center gap-1.5">
                      {m.name}
                      {m.visionSupport && (
                        <span title="Vision Supported">
                          <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] font-mono text-indigo-400 truncate mt-0.5">{m.id}</p>
                  </div>

                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-semibold shrink-0">
                    {m.provider}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Context: {(m.contextWindow ? m.contextWindow / 1000 : 128).toFixed(0)}k</span>
                  {m.pricing && (
                    <span>
                      In: ${m.pricing.input}/M | Out: ${m.pricing.output}/M
                    </span>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                {/* Enable/Disable Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleDisabled(m.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                    isDisabled
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  {isDisabled ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                  <span>{isDisabled ? 'Disabled' : 'Enabled'}</span>
                </button>

                {/* Premium-Only Access Toggle */}
                <button
                  type="button"
                  onClick={() => handleTogglePremium(m.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                    isPremiumOnly
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-300'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>{isPremiumOnly ? 'PRO Only' : 'All Users'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminModels;
