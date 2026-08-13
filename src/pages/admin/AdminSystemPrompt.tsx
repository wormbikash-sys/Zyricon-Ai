import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Sliders, Save, Sparkles, CheckCircle2 } from 'lucide-react';

export const AdminSystemPrompt: React.FC = () => {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [defaultModel, setDefaultModel] = useState('inclusionai/ling-2.6-flash');
  const [fallbackModelsStr, setFallbackModelsStr] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [enableStreaming, setEnableStreaming] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    api.getAdminSystemPrompt()
      .then(data => {
        setSystemPrompt(data.systemPrompt);
        setDefaultModel(data.defaultModel);
        setFallbackModelsStr(Array.isArray(data.fallbackModels) ? data.fallbackModels.join(', ') : '');
        setTemperature(data.temperature);
        setMaxTokens(data.maxTokens);
        setEnableStreaming(data.enableStreaming);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

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

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save system prompt');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Sparkles className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">AI System Behavior & Prompting</h1>
        <p className="text-xs text-slate-400">Configure global AI personality instructions, default model, and fallbacks.</p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Platform system prompt & configuration updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        {/* System Prompt TextArea */}
        <div>
          <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
            Platform System Prompt Instructions
          </label>
          <textarea
            required
            rows={6}
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 custom-scrollbar leading-relaxed"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            This system prompt is automatically prepended to all user chat completions across the platform.
          </p>
        </div>

        {/* Model Defaults & Fallback Chain */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
              Default Model Identifier
            </label>
            <input
              type="text"
              required
              value={defaultModel}
              onChange={e => setDefaultModel(e.target.value)}
              placeholder="e.g. deepseek/deepseek-chat"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
              Fallback Chain (Comma-Separated)
            </label>
            <input
              type="text"
              value={fallbackModelsStr}
              onChange={e => setFallbackModelsStr(e.target.value)}
              placeholder="openai/gpt-4o-mini, anthropic/claude-3-5-haiku"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        {/* Parameters: Temperature & Max Tokens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
              Temperature ({temperature})
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
              Max Tokens Limit
            </label>
            <input
              type="number"
              min="256"
              max="16384"
              value={maxTokens}
              onChange={e => setMaxTokens(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
          >
            {saving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save AI Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSystemPrompt;
