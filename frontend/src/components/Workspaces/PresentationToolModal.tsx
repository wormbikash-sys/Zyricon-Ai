import React, { useState } from 'react';
import { X, Presentation, Layers } from 'lucide-react';

interface PresentationToolModalProps {
  onClose: () => void;
  onSendPrompt: (prompt: string) => void;
}

export const PresentationToolModal: React.FC<PresentationToolModalProps> = ({ onClose, onSendPrompt }) => {
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('Investors & Executives');
  const [slideCount, setSlideCount] = useState(8);
  const [tone, setTone] = useState('Professional & Persuasive');

  const AUDIENCES = ['Investors & Executives', 'Development Team', 'Sales & Clients', 'Students & Beginners'];
  const TONES = ['Professional & Persuasive', 'Visionary & Inspiring', 'Technical & Data-Driven', 'Educational & Engaging'];

  const handleCreateSlides = () => {
    if (!topic.trim()) return;
    const prompt = `Create an engaging ${slideCount}-slide presentation deck for: "${topic.trim()}".
Target Audience: ${targetAudience}
Tone: ${tone}

Format output clearly with:
1. Title & Executive Summary
2. Slide-by-slide structure (Slide Title, Key Bullet Points, Speaker Notes, Visual Recommendations)`;

    onSendPrompt(prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar bg-[#120824] border border-purple-800/40 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 text-slate-100 space-y-4 sm:space-y-6 relative">
        <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Presentation className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">AI Presentation Generator</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">Turn topics and strategic briefs into structured slide decks</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-purple-900/30 text-slate-400 hover:text-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">Presentation Topic or Product Pitch</label>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              rows={3}
              placeholder="e.g. AI-driven cybersecurity platform pitch deck showing product roadmap and market size..."
              className="w-full bg-[#180c30] border border-purple-900/40 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">Target Audience</label>
            <div className="flex flex-wrap gap-1.5">
              {AUDIENCES.map(a => (
                <button
                  key={a}
                  onClick={() => setTargetAudience(a)}
                  className={`px-2.5 py-1 rounded-xl border text-[11px] transition-all ${
                    targetAudience === a
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-semibold'
                      : 'bg-[#180c30]/60 border-purple-900/30 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">Tone & Style</label>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map(t => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-2.5 py-1 rounded-xl border text-[11px] transition-all ${
                    tone === t
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-semibold'
                      : 'bg-[#180c30]/60 border-purple-900/30 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-medium">Number of Slides</label>
              <span className="text-purple-300 font-semibold">{slideCount} Slides</span>
            </div>
            <input
              type="range"
              min={4}
              max={15}
              value={slideCount}
              onChange={e => setSlideCount(Number(e.target.value))}
              className="w-full accent-purple-500 bg-[#180c30] cursor-pointer"
            />
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
            onClick={handleCreateSlides}
            disabled={!topic.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all"
          >
            <Layers className="w-4 h-4" />
            <span>Generate Slides with Zyricon AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresentationToolModal;
