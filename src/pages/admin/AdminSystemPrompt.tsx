import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Sliders, Save, Sparkles, CheckCircle2, AlertTriangle, History, Info } from 'lucide-react';

export const AdminSystemPrompt: React.FC = () => {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [defaultModel, setDefaultModel] = useState('inclusionai/ling-2.6-flash');
  const [fallbackModelsStr, setFallbackModelsStr] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [enableStreaming, setEnableStreaming] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showMajorConfirm, setShowMajorConfirm] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.getAdminSystemPrompt(),
      api.getAuditLogs(),
    ])
      .then(([data, logsData]) => {
        setSystemPrompt(data.systemPrompt);
        setOriginalPrompt(data.systemPrompt);
        setDefaultModel(data.defaultModel);
        setFallbackModelsStr(Array.isArray(data.fallbackModels) ? data.fallbackModels.join(', ') : '');
        setTemperature(data.temperature);
        setMaxTokens(data.maxTokens);
        setEnableStreaming(data.enableStreaming);
        setAuditLogs((logsData.auditLogs || []).filter((l: any) => l.action === 'SYSTEM_PROMPT_UPDATE'));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hasUnsavedChanges = systemPrompt !== originalPrompt;

  const executeSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    setSaveError(null);

    try {
      const fallbackList = fallbackModelsStr.split(',').map(s => s.trim()).filter(Boolean);
      await api.saveAdminSystemPrompt({
        systemPrompt,
        defaultModel,
        fallbackModels: fallbackList,
        temperature: Number(temperature),
        maxTokens: Number(maxTokens),
        enableStreaming,
      });

      setOriginalPrompt(systemPrompt);
      setSavedSuccess(true);
      setShowMajorConfirm(false);

      // Refresh audit logs
      const logsData = await api.getAuditLogs();
      setAuditLogs((logsData.auditLogs || []).filter((l: any) => l.action === 'SYSTEM_PROMPT_UPDATE'));

      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Unable to update AI behavior. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!systemPrompt.trim()) return;

    // Major change confirmation check (>50 characters diff)
    const diffLen = Math.abs(systemPrompt.length - originalPrompt.length);
    if (diffLen > 50) {
      setShowMajorConfirm(true);
    } else {
      executeSave();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Sparkles className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">AI Behavior Management</h1>
          <p className="text-xs text-slate-400">Configure global AI system prompt instructions, response rules, and model fallbacks.</p>
        </div>

        {hasUnsavedChanges && (
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse">
            Unsaved changes
          </span>
        )}
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>System prompt updated successfully! All live user chats will now use this behavior.</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 font-semibold animate-in fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Major Change Confirmation Dialog */}
      {showMajorConfirm && (
        <div className="p-4 rounded-2xl bg-purple-950/80 border border-purple-500/50 space-y-3 text-xs animate-in zoom-in-95">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Confirm Significant System Prompt Modification</span>
          </div>
          <p className="text-slate-300">
            You are making a major update to the AI behavior system prompt ({systemPrompt.length} characters). This will immediately affect all active user sessions across the platform.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={executeSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors"
            >
              {saving ? 'Updating Prompt...' : 'Confirm & Publish Update'}
            </button>
            <button
              type="button"
              onClick={() => setShowMajorConfirm(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-6 bg-[#0d061c] border border-purple-900/40 rounded-3xl p-4 sm:p-6 shadow-2xl">
        {/* System Prompt TextArea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-purple-200 uppercase tracking-wider">
              Server-Enforced System Prompt
            </label>
            <span className="text-[11px] text-purple-400 font-mono">
              {systemPrompt.length} chars
            </span>
          </div>

          <textarea
            required
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            className="w-full min-h-[300px] max-h-[60vh] bg-[#080312] border border-purple-900/50 rounded-2xl p-4 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-purple-500 custom-scrollbar leading-relaxed font-mono"
            placeholder="Type the system prompt that instructs the AI assistant..."
          />

          <p className="text-[11px] text-purple-300/70 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            This prompt is injected server-side at index 0 of every conversation. Frontend users cannot override or remove this instruction.
          </p>
        </div>

        {/* Model & Parameters */}
        <div className="pt-4 border-t border-purple-900/30 space-y-4">
          <h3 className="text-xs font-bold text-purple-200 uppercase tracking-wider">AI Generation Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Public Display Model Label
              </label>
              <input
                type="text"
                disabled
                value="Zyricon AI"
                className="w-full bg-[#140a2b] border border-purple-900/40 rounded-xl p-2.5 text-xs text-purple-200 font-bold"
              />
              <p className="text-[10px] text-slate-500 mt-1">Normal users see only this public model identifier.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Backend Provider Model String
              </label>
              <input
                type="text"
                required
                value={defaultModel}
                onChange={e => setDefaultModel(e.target.value)}
                className="w-full bg-[#080312] border border-purple-900/40 rounded-xl p-2.5 text-xs text-purple-300 font-mono focus:outline-none focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">Hidden backend model ID used by AICredits Gateway.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Temperature ({temperature})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Max Token Limit
              </label>
              <input
                type="number"
                min="256"
                max="16384"
                value={maxTokens}
                onChange={e => setMaxTokens(parseInt(e.target.value, 10))}
                className="w-full bg-[#080312] border border-purple-900/40 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Save Controls */}
        <div className="pt-4 border-t border-purple-900/30 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSystemPrompt(originalPrompt)}
            disabled={!hasUnsavedChanges}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
          >
            Discard Changes
          </button>

          <button
            type="submit"
            disabled={saving || !hasUnsavedChanges}
            className={`flex items-center gap-2 py-2.5 px-6 rounded-xl font-bold text-xs shadow-lg transition-all ${
              hasUnsavedChanges
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                : 'bg-purple-900/30 text-purple-400 border border-purple-800/30 cursor-not-allowed'
            }`}
          >
            {saving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving Behavior...' : 'Save AI Configuration'}</span>
          </button>
        </div>
      </form>

      {/* Audit Logs History Preview */}
      {auditLogs.length > 0 && (
        <div className="bg-[#0d061c] border border-purple-900/40 rounded-3xl p-4 sm:p-6 space-y-3">
          <h3 className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            System Prompt Audit History
          </h3>

          <div className="space-y-2">
            {auditLogs.slice(0, 5).map(log => (
              <div key={log.id} className="p-3 rounded-xl bg-[#080312] border border-purple-900/30 text-xs flex items-center justify-between">
                <div>
                  <p className="text-purple-200 font-medium">{log.details}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">By {log.adminName}</p>
                </div>
                <span className="text-[10px] font-mono text-purple-400">
                  {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSystemPrompt;
