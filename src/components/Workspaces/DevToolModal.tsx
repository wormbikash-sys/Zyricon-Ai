import React, { useState } from 'react';
import { X, Code2, Terminal } from 'lucide-react';

interface DevToolModalProps {
  onClose: () => void;
  onSendPrompt: (prompt: string) => void;
}

export const DevToolModal: React.FC<DevToolModalProps> = ({ onClose, onSendPrompt }) => {
  const [task, setTask] = useState('');
  const [language, setLanguage] = useState('TypeScript / React');
  const [framework, setFramework] = useState('Full Stack / REST API');
  const [includeTests, setIncludeTests] = useState(true);

  const LANGUAGES = ['TypeScript / React', 'Python / FastAPI', 'Node.js / Express', 'Go / Gin', 'Rust / Actix'];
  const ARCHITECTURES = ['Full Stack / REST API', 'Clean Architecture / Modular', 'Serverless Functions', 'Database ORM / Schema'];

  const handleGenerateCode = () => {
    if (!task.trim()) return;
    const prompt = `Write production-ready ${language} code for the following task:

Requirement: "${task.trim()}"
Architecture Style: ${framework}
Include Unit Tests: ${includeTests ? 'Yes' : 'No'}

Please provide:
1. Complete, fully functional source code without omitted placeholders.
2. Explanations of key design patterns and error-handling decisions.`;

    onSendPrompt(prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar bg-[#120824] border border-purple-800/40 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 text-slate-100 space-y-4 sm:space-y-6 relative">
        <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Code2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">Zyricon Dev Assistant</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">Generate clean, type-safe, production-ready code</p>
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
            <label className="text-slate-300 font-medium">Coding Requirement or Feature Spec</label>
            <textarea
              value={task}
              onChange={e => setTask(e.target.value)}
              rows={3}
              placeholder="e.g. Implement a JWT authentication middleware with token expiration, refresh tokens, and Zod schema validation..."
              className="w-full bg-[#180c30] border border-purple-900/40 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">Language & Ecosystem</label>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.map(l => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-2.5 py-1 rounded-xl border text-[11px] transition-all ${
                    language === l
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-semibold'
                      : 'bg-[#180c30]/60 border-purple-900/30 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">Architecture Focus</label>
            <div className="flex flex-wrap gap-1.5">
              {ARCHITECTURES.map(a => (
                <button
                  key={a}
                  onClick={() => setFramework(a)}
                  className={`px-2.5 py-1 rounded-xl border text-[11px] transition-all ${
                    framework === a
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-semibold'
                      : 'bg-[#180c30]/60 border-purple-900/30 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#180c30]/40 border border-purple-900/30">
            <span className="font-medium text-slate-200 text-xs">Include Automated Unit Tests</span>
            <input
              type="checkbox"
              checked={includeTests}
              onChange={e => setIncludeTests(e.target.checked)}
              className="w-4 h-4 rounded accent-purple-500 cursor-pointer shrink-0"
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
            onClick={handleGenerateCode}
            disabled={!task.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all"
          >
            <Terminal className="w-4 h-4" />
            <span>Generate Code with Zyricon AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DevToolModal;
