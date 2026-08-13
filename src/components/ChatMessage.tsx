import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Edit2,
  Clock,
} from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onEditPrompt?: (newPrompt: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isStreaming = false,
  onRegenerate,
  onEditPrompt,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const isUser = message.role === 'user';
  const hasContent = Boolean(message.content && message.content.trim().length > 0);
  const isThinking = !isUser && isStreaming && !hasContent;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && onEditPrompt) {
      onEditPrompt(editText.trim());
      setIsEditing(false);
    }
  };

  /* State 1: Compact AI Activity Indicator (Thinking / Generating) */
  if (isThinking) {
    return (
      <div className="py-2.5 sm:py-3 px-3 sm:px-6 transition-colors w-full min-w-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3 min-w-0 h-11 sm:h-12">
          {/* Avatar (32-36px) with subtle purple glowing pulse */}
          <div className="shrink-0 relative">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-purple-400 p-[1px] flex items-center justify-center text-white shadow-[0_0_12px_rgba(168,85,247,0.35)] ring-1 ring-purple-500/20 animate-pulse">
              <div className="w-full h-full rounded-full bg-[#0d0718] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-300" />
              </div>
            </div>
          </div>

          {/* Staggered Animated Dots + Subtle Label */}
          <div className="flex items-center gap-2 text-slate-400 text-xs sm:text-[13px]">
            <div className="flex items-center gap-1 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400/90 zyricon-dot zyricon-dot-1" />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400/90 zyricon-dot zyricon-dot-2" />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400/90 zyricon-dot zyricon-dot-3" />
            </div>
            <span className="text-purple-300/80 font-normal tracking-wide text-xs">Thinking</span>
          </div>
        </div>
      </div>
    );
  }

  /* State 2: Standard Message View (User or Assistant Response) */
  return (
    <div className="group py-3 sm:py-4 px-3 sm:px-6 transition-colors w-full min-w-0">
      <div className={`max-w-3xl mx-auto flex gap-3 min-w-0 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {/* Assistant Avatar */}
        {!isUser && (
          <div className="shrink-0 mt-0.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 p-[1px] flex items-center justify-center text-white shadow-md shadow-purple-600/20">
              <div className="w-full h-full rounded-full bg-[#0d0718] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-300" />
              </div>
            </div>
          </div>
        )}

        {/* Message Container */}
        <div className={`space-y-1 min-w-0 ${isUser ? 'max-w-[90%] sm:max-w-[80%]' : 'flex-1 max-w-full'}`}>
          {/* Header */}
          <div className={`flex items-center gap-2 text-[11px] text-slate-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="font-semibold text-slate-300">
              {isUser ? 'You' : 'Zyricon AI'}
            </span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Message Content Bubble / Layout */}
          {isUser ? (
            /* User Message Bubble */
            isEditing ? (
              <div className="space-y-2 w-full min-w-0">
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  rows={3}
                  className="w-full bg-[#160b26] border border-purple-500/50 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none"
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-2.5 py-1 rounded-lg text-xs bg-purple-600 text-white font-medium hover:bg-purple-500"
                  >
                    Save & Resubmit
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 sm:p-3.5 rounded-2xl rounded-tr-sm bg-purple-600/20 border border-purple-500/30 text-slate-100 text-xs sm:text-sm leading-relaxed break-word-custom shadow-sm">
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            )
          ) : (
            /* Assistant Message Body */
            <div className="text-slate-200 text-xs sm:text-sm leading-relaxed min-w-0 break-word-custom">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;
                    const codeString = String(children).replace(/\n$/, '');

                    if (isInline) {
                      return (
                        <code className="bg-purple-950/60 text-purple-300 px-1.5 py-0.5 rounded text-[11px] font-mono break-all border border-purple-800/30" {...props}>
                          {children}
                        </code>
                      );
                    }

                    return (
                      <div className="my-3 rounded-xl border border-white/[0.08] bg-[#0c0618] overflow-hidden font-mono text-xs max-w-full">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-[#140a24] border-b border-white/[0.06] text-[10px] text-slate-400">
                          <span>{match ? match[1] : 'code'}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(codeString);
                            }}
                            className="flex items-center gap-1 hover:text-slate-200 text-[10px]"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                        <pre className="p-3 overflow-x-auto text-slate-200 leading-relaxed custom-scrollbar max-w-full">
                          <code>{children}</code>
                        </pre>
                      </div>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-1.5 h-3.5 bg-purple-400/90 ml-1 rounded-sm animate-pulse align-middle" />
              )}
            </div>
          )}

          {/* Hover Toolbar */}
          {!isStreaming && (
            <div className={`flex items-center gap-2.5 text-slate-500 text-[11px] pt-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ${isUser ? 'justify-end' : 'justify-start'}`}>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 hover:text-slate-300 transition-colors"
                title="Copy message"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              {isUser && onEditPrompt && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 hover:text-slate-300 transition-colors"
                  title="Edit prompt"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}

              {!isUser && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="flex items-center gap-1 hover:text-slate-300 transition-colors"
                  title="Retry response"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
