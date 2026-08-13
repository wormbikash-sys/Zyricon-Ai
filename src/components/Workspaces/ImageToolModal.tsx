import React, { useState } from 'react';
import { X, Image as ImageIcon, Sparkles, Wand2, Copy, Check } from 'lucide-react';

interface ImageToolModalProps {
  onClose: () => void;
  onSendPrompt: (prompt: string) => void;
}

export const ImageToolModal: React.FC<ImageToolModalProps> = ({ onClose, onSendPrompt }) => {
  const [subject, setSubject] = useState('');
  const [style, setStyle] = useState('Photorealistic 8K');
  const [lighting, setLighting] = useState('Cinematic Volumetric');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [copied, setCopied] = useState(false);

  const STYLES = ['Photorealistic 8K', 'Cyberpunk Neon', '3D Digital Render', 'Anime Concept Art', 'Oil Painting', 'Minimalist Vector'];
  const LIGHTINGS = ['Cinematic Volumetric', 'Golden Hour Sunlight', 'Studio Softbox', 'Dark Ambient Mood', 'Bioluminescent Glow'];
  const ASPECT_RATIOS = ['16:9', '1:1', '9:16', '4:3', '21:9'];

  const generatedPrompt = subject.trim()
    ? `A high-resolution ${style.toLowerCase()} image of ${subject.trim()}. ${lighting} lighting, ultra-detailed textures, masterpiece quality, ratio ${aspectRatio}.`
    : '';

  const handleGenerateInChat = () => {
    if (!generatedPrompt) return;
    onSendPrompt(`Help me refine and expand this detailed AI Image Generation prompt:\n\n"${generatedPrompt}"\n\nProvide 3 artistic variations and composition tips.`);
    onClose();
  };

  const handleCopy = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar bg-[#120824] border border-purple-800/40 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 text-slate-100 space-y-4 sm:space-y-6 relative">
        <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">AI Image Generator Studio</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">Construct detailed artistic prompts for high-quality images</p>
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
          {/* Subject input */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">Image Subject or Scene</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Futuristic floating city in neon purple clouds..."
              className="w-full bg-[#180c30] border border-purple-900/40 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Style pills */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">Artistic Style</label>
            <div className="flex flex-wrap gap-1.5">
              {STYLES.map(s => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`px-2.5 py-1 rounded-xl border text-[11px] transition-all ${
                    style === s
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-semibold'
                      : 'bg-[#180c30]/60 border-purple-900/30 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Lighting */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">Lighting & Atmosphere</label>
            <div className="flex flex-wrap gap-1.5">
              {LIGHTINGS.map(l => (
                <button
                  key={l}
                  onClick={() => setLighting(l)}
                  className={`px-2.5 py-1 rounded-xl border text-[11px] transition-all ${
                    lighting === l
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-semibold'
                      : 'bg-[#180c30]/60 border-purple-900/30 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">Aspect Ratio</label>
            <div className="flex flex-wrap gap-1.5">
              {ASPECT_RATIOS.map(ar => (
                <button
                  key={ar}
                  onClick={() => setAspectRatio(ar)}
                  className={`px-2.5 py-1 rounded-xl border text-[11px] transition-all ${
                    aspectRatio === ar
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-semibold'
                      : 'bg-[#180c30]/60 border-purple-900/30 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          {/* Generated prompt preview */}
          {generatedPrompt && (
            <div className="p-3 rounded-2xl bg-[#180c30]/90 border border-purple-800/40 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-purple-300">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Generated Prompt Preview:
                </span>
                <button onClick={handleCopy} className="hover:text-white flex items-center gap-1 text-[10px]">
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-slate-200 text-xs italic break-words">{generatedPrompt}</p>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-purple-900/40 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerateInChat}
            disabled={!subject.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all"
          >
            <Wand2 className="w-4 h-4" />
            <span>Process in Zyricon AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageToolModal;
