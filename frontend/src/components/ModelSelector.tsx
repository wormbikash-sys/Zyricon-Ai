import React, { useState, useRef, useEffect } from 'react';
import { ModelInfo } from '../types';
import { ChevronDown, Search, Sparkles, Lock, Eye } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  models: ModelInfo[];
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onSelectModel,
  models,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = models.find(m => m.id === selectedModel) || {
    id: selectedModel,
    name: selectedModel,
    provider: 'AICredits',
    isPremiumOnly: false,
    visionSupport: false,
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = models.filter(
    m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 transition-all shadow-sm"
      >
        <div className="flex items-center gap-2 truncate">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-semibold truncate">{current.name}</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono shrink-0">
            {current.provider}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 max-h-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2">
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search AI models..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="overflow-y-auto flex-1 space-y-1 pr-1 custom-scrollbar">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No matching models found</p>
            ) : (
              filtered.map(m => {
                const isSelected = m.id === selectedModel;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectModel(m.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500/50 text-slate-100'
                        : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-xs truncate flex items-center gap-1.5">
                        {m.name}
                        {m.visionSupport && (
                          <span title="Vision Supported">
                            <Eye className="w-3 h-3 text-cyan-400" />
                          </span>
                        )}
                      </span>
                      {m.isPremiumOnly ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
                          <Lock className="w-2.5 h-2.5" /> PRO
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                          FREE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Provider: {m.provider}</span>
                      {m.contextWindow && (
                        <span>Context: {(m.contextWindow / 1000).toFixed(0)}k tokens</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
