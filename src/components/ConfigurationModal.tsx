import React, { useState, useEffect } from 'react';
import { X, Sliders, Type, Send, Volume2, Sparkles, Check } from 'lucide-react';

interface ConfigurationModalProps {
  onClose: () => void;
}

export const ConfigurationModal: React.FC<ConfigurationModalProps> = ({ onClose }) => {
  const [responseStyle, setResponseStyle] = useState<'concise' | 'balanced' | 'detailed'>('balanced');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [enterToSend, setEnterToSend] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);
  const [autoTitle, setAutoTitle] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedConfig = localStorage.getItem('zyricon_user_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.responseStyle) setResponseStyle(parsed.responseStyle);
        if (parsed.fontSize) setFontSize(parsed.fontSize);
        if (typeof parsed.enterToSend === 'boolean') setEnterToSend(parsed.enterToSend);
        if (typeof parsed.soundEffects === 'boolean') setSoundEffects(parsed.soundEffects);
        if (typeof parsed.autoTitle === 'boolean') setAutoTitle(parsed.autoTitle);
      } catch (e) {
        console.error('Error loading config:', e);
      }
    }
  }, []);

  const handleSave = () => {
    const config = {
      responseStyle,
      fontSize,
      enterToSend,
      soundEffects,
      autoTitle,
    };
    localStorage.setItem('zyricon_user_config', JSON.stringify(config));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar bg-[#120824] border border-purple-800/40 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 text-slate-100 space-y-4 sm:space-y-6 relative">
        {/* Glow effect */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">Workspace Configuration</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">Personalize response style and interface behaviors</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-purple-900/30 text-slate-400 hover:text-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Response Style */}
          <div className="space-y-2">
            <label className="text-slate-300 font-medium flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Response Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'concise', label: 'Concise', desc: 'Short & direct' },
                { id: 'balanced', label: 'Balanced', desc: 'Optimal depth' },
                { id: 'detailed', label: 'Detailed', desc: 'Comprehensive' },
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setResponseStyle(st.id as any)}
                  className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all ${
                    responseStyle === st.id
                      ? 'bg-purple-600/20 border-purple-500 text-purple-200 font-semibold shadow-lg shadow-purple-600/10'
                      : 'bg-[#180c30]/60 border-purple-900/30 text-slate-400 hover:text-slate-200 hover:border-purple-800/50'
                  }`}
                >
                  <div className="text-xs font-medium">{st.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{st.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <label className="text-slate-300 font-medium flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-purple-400" />
              Chat Typography Size
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'small', label: 'Compact (13px)' },
                { id: 'medium', label: 'Standard (14px)' },
                { id: 'large', label: 'Spacious (16px)' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFontSize(f.id as any)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    fontSize === f.id
                      ? 'bg-purple-600/20 border-purple-500 text-purple-200 font-semibold'
                      : 'bg-[#180c30]/60 border-purple-900/30 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-purple-900/30">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#180c30]/40 border border-purple-900/30">
              <div className="space-y-0.5 pr-2">
                <div className="font-medium text-slate-200 flex items-center gap-2 text-xs">
                  <Send className="w-3.5 h-3.5 text-purple-400" /> Enter to Send
                </div>
                <div className="text-[10px] text-slate-400">Press Enter to send message, Shift+Enter for newline</div>
              </div>
              <input
                type="checkbox"
                checked={enterToSend}
                onChange={e => setEnterToSend(e.target.checked)}
                className="w-4 h-4 rounded accent-purple-500 cursor-pointer shrink-0"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#180c30]/40 border border-purple-900/30">
              <div className="space-y-0.5 pr-2">
                <div className="font-medium text-slate-200 flex items-center gap-2 text-xs">
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" /> Audio Feedback
                </div>
                <div className="text-[10px] text-slate-400">Play subtle chime when response generation completes</div>
              </div>
              <input
                type="checkbox"
                checked={soundEffects}
                onChange={e => setSoundEffects(e.target.checked)}
                className="w-4 h-4 rounded accent-purple-500 cursor-pointer shrink-0"
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-purple-900/40 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all"
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{saved ? 'Saved!' : 'Save Preferences'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationModal;
