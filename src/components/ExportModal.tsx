import React, { useState } from 'react';
import { X, Download, FileText, Code2, Check } from 'lucide-react';
import { Conversation, Message } from '../types';

interface ExportModalProps {
  conversation: Conversation | null;
  messages: Message[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ conversation, messages, onClose }) => {
  const [format, setFormat] = useState<'md' | 'txt' | 'json'>('md');
  const [downloaded, setDownloaded] = useState(false);

  const title = conversation?.title || 'Zyricon_AI_Conversation';

  const handleExport = () => {
    let content = '';
    let mime = 'text/markdown';
    let ext = 'md';

    if (format === 'json') {
      content = JSON.stringify({ conversation, messages }, null, 2);
      mime = 'application/json';
      ext = 'json';
    } else if (format === 'txt') {
      content = `Zyricon AI Chat Transcript\nTitle: ${title}\nDate: ${new Date().toLocaleString()}\n\n`;
      messages.forEach(m => {
        content += `[${m.role.toUpperCase()}] (${m.createdAt}):\n${m.content}\n\n-------------------------\n\n`;
      });
      mime = 'text/plain';
      ext = 'txt';
    } else {
      content = `# ${title}\n\n- **Exported From**: Zyricon AI\n- **Date**: ${new Date().toLocaleString()}\n\n---\n\n`;
      messages.forEach(m => {
        const sender = m.role === 'user' ? '👤 User' : '✦ Zyricon AI';
        content += `### ${sender}\n\n${m.content}\n\n---\n\n`;
      });
      mime = 'text/markdown';
      ext = 'md';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => {
      setDownloaded(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar bg-[#120824] border border-purple-800/40 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 text-slate-100 space-y-4 sm:space-y-6 relative">
        <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">Export Conversation</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">{messages.length} messages in chat transcript</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-purple-900/30 text-slate-400 hover:text-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5">
          <div className="p-3 rounded-2xl bg-[#180c30]/60 border border-purple-900/30">
            <div className="text-[11px] font-semibold text-slate-300">Active Chat:</div>
            <div className="text-xs sm:text-sm font-bold text-purple-200 truncate mt-0.5">{title}</div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="text-slate-300 font-medium">Select Export Format</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'md', label: 'Markdown', icon: FileText, ext: '.md' },
                { id: 'txt', label: 'Plain Text', icon: FileText, ext: '.txt' },
                { id: 'json', label: 'JSON Data', icon: Code2, ext: '.json' },
              ].map(f => {
                const IconComp = f.icon;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id as any)}
                    className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                      format === f.id
                        ? 'bg-purple-600/20 border-purple-500 text-purple-200 font-semibold shadow-lg shadow-purple-600/10'
                        : 'bg-[#180c30]/40 border-purple-900/30 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <IconComp className="w-4 h-4 text-purple-400" />
                    <span>{f.label}</span>
                    <span className="text-[10px] text-slate-500">{f.ext}</span>
                  </button>
                );
              })}
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
            onClick={handleExport}
            disabled={messages.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all"
          >
            {downloaded ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{downloaded ? 'Downloaded!' : 'Download Export'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
