import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Sparkles,
  Paperclip,
  Wrench,
  Mic,
  Search,
  Image as ImageIcon,
  Code2,
  Sliders,
} from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStopGeneration?: () => void;
  isStreaming: boolean;
  onOpenConfig?: () => void;
  onOpenImageTool?: () => void;
  onOpenDevTool?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGeneration,
  isStreaming,
  onOpenConfig,
  onOpenImageTool,
  onOpenDevTool,
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [message]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setShowToolsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (message.trim() && !isStreaming) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMessage(prev => (prev ? `${prev}\n[Attached: ${file.name}]` : `[Attached: ${file.name}]`));
    }
  };

  const toggleMic = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      setMessage(prev => (prev ? `${prev} [Voice note]` : 'Draft an execution plan for launching a web app.'));
      setTimeout(() => setIsRecording(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-3 pb-3 sm:pb-4 pb-safe min-w-0">
      <div className="relative w-full min-w-0 rounded-2xl sm:rounded-3xl bg-[#130b22]/90 border border-white/[0.08] focus-within:border-purple-500/40 shadow-xl shadow-black/40 backdrop-blur-md transition-all p-3 sm:p-4 space-y-2.5">
        {/* Input Textarea Field */}
        <div className="flex items-start gap-2.5 min-w-0">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-1" />
          <textarea
            ref={textareaRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Anything..."
            rows={1}
            disabled={isStreaming}
            className="w-full min-w-0 bg-transparent text-slate-100 placeholder-slate-400/70 text-xs sm:text-sm focus:outline-none resize-none custom-scrollbar leading-relaxed font-normal min-h-[50px] max-h-[180px]"
          />
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-2.5 text-xs text-slate-400 min-w-0">
          {/* Left Controls: Attach & Tools Menu */}
          <div className="flex items-center gap-2 relative min-w-0" ref={toolsMenuRef}>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white/[0.05] text-slate-400 hover:text-slate-200 transition-colors text-xs shrink-0"
              title="Attach File"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attach</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white/[0.05] text-slate-400 hover:text-slate-200 transition-colors text-xs shrink-0"
                title="AI Tools"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Tools</span>
              </button>

              {/* Tools Popup Dropdown */}
              {showToolsMenu && (
                <div className="absolute left-0 bottom-full mb-2 w-48 rounded-2xl bg-[#140a24] border border-purple-800/40 shadow-2xl py-1.5 z-50 text-xs animate-in fade-in">
                  <button
                    onClick={() => {
                      setShowToolsMenu(false);
                      setMessage(prev => (prev ? `${prev} [Web Search: ]` : 'Search the web for latest AI news'));
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-purple-900/20 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5 text-purple-400" />
                    <span>Web Search</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowToolsMenu(false);
                      onOpenImageTool?.();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-purple-900/20 transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>Image Studio</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowToolsMenu(false);
                      onOpenDevTool?.();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-purple-900/20 transition-colors"
                  >
                    <Code2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Code Assistant</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowToolsMenu(false);
                      onOpenConfig?.();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-purple-900/20 transition-colors border-t border-white/[0.06] mt-1 pt-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>Advanced Settings</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Controls: Mic & Send Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleMic}
              type="button"
              className={`p-2 rounded-full hover:bg-white/[0.05] transition-colors shrink-0 ${
                isRecording ? 'text-rose-400 animate-pulse' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Voice Input"
            >
              <Mic className="w-4 h-4" />
            </button>

            {isStreaming ? (
              <button
                onClick={onStopGeneration}
                type="button"
                className="w-11 h-11 sm:w-11 sm:h-11 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-600/30 transition-all shrink-0"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                type="button"
                className="w-11 h-11 sm:w-11 sm:h-11 rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-35 disabled:hover:bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/25 transition-all hover:scale-105 active:scale-95 shrink-0"
                title="Send Message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
