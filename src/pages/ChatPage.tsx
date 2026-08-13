import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Conversation, Message } from '../types';
import Sidebar from '../components/Sidebar';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import ConfigurationModal from '../components/ConfigurationModal';
import ExportModal from '../components/ExportModal';
import UpgradeModal from '../components/UpgradeModal';
import ImageToolModal from '../components/Workspaces/ImageToolModal';
import PresentationToolModal from '../components/Workspaces/PresentationToolModal';
import DevToolModal from '../components/Workspaces/DevToolModal';
import { useAuth } from '../store/authContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Sliders,
  Download,
  Image as ImageIcon,
  Lightbulb,
  FileText,
  Presentation,
  Code2,
  ChevronDown,
  Shield,
  LogOut,
  Crown,
  Menu,
} from 'lucide-react';

const dedupeMessages = (msgs: Message[]): Message[] => {
  const seen = new Set<string>();
  const result: Message[] = [];
  for (const m of msgs) {
    if (!m.id) continue;
    if (!seen.has(m.id)) {
      seen.add(m.id);
      result.push(m);
    }
  }
  return result;
};

export const ChatPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Modals state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showImageTool, setShowImageTool] = useState(false);
  const [showPresentationTool, setShowPresentationTool] = useState(false);
  const [showDevTool, setShowDevTool] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingTextRef = useRef<string>('');

  const activeConvIdRef = useRef<string | null>(activeConvId);
  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data.conversations);
    } catch (e) {
      console.error('[ChatPage] Load conversations failed:', e);
    }
  };

  useEffect(() => {
    if (activeConvId) {
      api.getConversation(activeConvId)
        .then(data => {
          setMessages(dedupeMessages(data.messages));
        })
        .catch(console.error);
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleNewChat = () => {
    if (isStreaming) handleStopGeneration();
    setActiveConvId(null);
    setMessages([]);
  };

  const handleSelectConversation = (id: string) => {
    if (isStreaming) handleStopGeneration();
    setActiveConvId(id);
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      const res = await api.renameConversation(id, newTitle);
      setConversations(prev => prev.map(c => (c.id === id ? res.conversation : c)));
    } catch (e: any) {
      alert(e.message || 'Rename failed');
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConvId === id) {
        handleNewChat();
      }
    } catch (e: any) {
      alert(e.message || 'Delete failed');
    }
  };

  const handleSendMessage = async (userPrompt: string) => {
    if (isStreaming) return;

    streamingTextRef.current = '';
    const tempUserMsgId = `temp_u_${Date.now()}`;
    const tempUserMsg: Message = {
      id: tempUserMsgId,
      conversationId: activeConvId || 'new',
      role: 'user',
      content: userPrompt,
      model: 'Zyricon AI',
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => dedupeMessages([...prev, tempUserMsg]));
    setIsStreaming(true);
    setStreamingContent('');

    abortControllerRef.current = new AbortController();
    let currentConvId = activeConvId;

    await api.streamChat({
      conversationId: activeConvId || undefined,
      message: userPrompt,
      signal: abortControllerRef.current.signal,
      onStart: ({ conversationId }) => {
        currentConvId = conversationId;
        if (!activeConvIdRef.current) {
          setActiveConvId(conversationId);
          loadConversations();
        }
      },
      onChunk: (chunk) => {
        streamingTextRef.current += chunk;
        setStreamingContent(streamingTextRef.current);
      },
      onDone: ({ messageId }) => {
        const fullContent = streamingTextRef.current;
        const finalAssistantMsg: Message = {
          id: messageId,
          conversationId: currentConvId || activeConvIdRef.current || 'new',
          role: 'assistant',
          content: fullContent,
          model: 'Zyricon AI',
          createdAt: new Date().toISOString(),
        };

        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempUserMsgId);
          return dedupeMessages([...filtered, finalAssistantMsg]);
        });

        setIsStreaming(false);
        setStreamingContent('');
        loadConversations();

        if (currentConvId) {
          api.getConversation(currentConvId).then(data => {
            setMessages(dedupeMessages(data.messages));
          }).catch(console.error);
        }
      },
      onError: (error) => {
        setIsStreaming(false);
        setStreamingContent('');
        alert(error.message || 'AI service encountered an issue. Please try again.');
      },
    });
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const activeConversationObj = conversations.find(c => c.id === activeConvId) || null;

  const handleOpenTool = (tool: 'image' | 'presentation' | 'code' | 'archived' | 'library') => {
    if (tool === 'image') setShowImageTool(true);
    if (tool === 'presentation') setShowPresentationTool(true);
    if (tool === 'code') setShowDevTool(true);
    if (tool === 'archived' || tool === 'library') {
      alert(`${tool.charAt(0).toUpperCase() + tool.slice(1)} folder is synced with your active Zyricon workspace.`);
    }
  };

  return (
    <div className="h-screen w-full bg-[#08040d] text-slate-100 flex overflow-hidden font-sans select-none max-w-full">
      {/* Sidebar Drawer on Mobile / Fixed on Desktop */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConvId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        onOpenUpgrade={() => setShowUpgradeModal(true)}
        onOpenWorkspaceTool={handleOpenTool}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 flex flex-col bg-[#08040d] relative overflow-hidden w-full min-w-0">
        {/* Subtle Ambient Top Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.12),transparent_70%)] pointer-events-none" />

        {/* Clean Mobile-First Header Navigation Bar (approx 60-64px) */}
        <header className="h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between z-20 border-b border-white/[0.06] bg-[#090412]/90 backdrop-blur-md shrink-0 w-full min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
              className="md:hidden p-2 rounded-xl hover:bg-white/[0.06] text-slate-300 transition-colors shrink-0"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Model Selector Pill displaying ONLY 'Zyricon AI' */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-slate-200 hover:border-purple-500/40 transition-colors cursor-pointer shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Zyricon AI</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </div>
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowConfigModal(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5"
              title="Configuration"
            >
              <Sliders className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5"
              title="Export Conversation"
            >
              <Download className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Admin Badge */}
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40 text-purple-300 text-xs font-semibold transition-colors shrink-0"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            )}

            {/* Compact Profile Avatar */}
            <div className="relative shrink-0 ml-1">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/[0.12] hover:border-purple-500/50 flex items-center justify-center overflow-hidden transition-colors"
              >
                <img
                  src={user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=zyricon'}
                  alt={user?.name || 'User'}
                  className="w-full h-full object-cover"
                />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#140a24] border border-white/[0.08] shadow-2xl py-1.5 z-50 text-xs animate-in fade-in">
                  <div className="px-3.5 py-2 border-b border-white/[0.06]">
                    <p className="font-bold text-slate-100 truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setShowProfileMenu(false); setShowUpgradeModal(true); }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-purple-300 hover:bg-white/[0.05]"
                  >
                    <Crown className="w-3.5 h-3.5" /> Upgrade
                  </button>
                  <button
                    onClick={() => { setShowProfileMenu(false); logout(); navigate('/login'); }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-400 hover:bg-rose-500/10"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Workspace Body Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col w-full min-w-0">
          {messages.length === 0 && !isStreaming ? (
            /* Clean Minimal Welcome Screen */
            <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 sm:py-8 flex flex-col items-center justify-center text-center z-10 my-auto min-w-0">
              
              {/* AI Glowing Orb */}
              <div className="relative group shrink-0 pt-2 sm:pt-4">
                <div className="w-[68px] h-[68px] sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 p-[2px] shadow-[0_0_30px_rgba(139,92,246,0.25)] animate-pulse">
                  <div className="w-full h-full rounded-full bg-[#0a0414] flex items-center justify-center overflow-hidden relative">
                    <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 blur-[2px] animate-spin" />
                  </div>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="mt-4 sm:mt-6 space-y-1.5 max-w-xl">
                <h1 className="text-[26px] sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-[1.15]">
                  Ready to Create Something New?
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-normal max-w-[480px] mx-auto leading-relaxed">
                  Ask anything, build ideas, solve problems, or create something amazing.
                </p>
              </div>

              {/* Quick Actions Carousel (Single Horizontal Scrollable Row on Mobile) */}
              <div className="mt-5 sm:mt-6 w-full max-w-lg px-1">
                <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
                  <button
                    onClick={() => handleSendMessage('Help me create a detailed image-generation prompt for a futuristic scene.')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Create Image</span>
                  </button>

                  <button
                    onClick={() => handleSendMessage('Help me brainstorm 5 innovative product ideas using artificial intelligence.')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Brainstorm</span>
                  </button>

                  <button
                    onClick={() => handleSendMessage('Create a detailed step-by-step execution plan for launching a web application.')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Make a plan</span>
                  </button>
                </div>
              </div>

              {/* Central Focal Composer */}
              <div className="mt-4 sm:mt-5 w-full">
                <ChatInput
                  onSendMessage={handleSendMessage}
                  onStopGeneration={handleStopGeneration}
                  isStreaming={isStreaming}
                  onOpenConfig={() => setShowConfigModal(true)}
                  onOpenImageTool={() => setShowImageTool(true)}
                  onOpenDevTool={() => setShowDevTool(true)}
                />
              </div>

              {/* Compact Feature Tiles (Mobile 2-Column Grid / Desktop Row) */}
              <div className="mt-5 sm:mt-6 w-full max-w-xl px-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* Image Card */}
                  <div
                    onClick={() => setShowImageTool(true)}
                    className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/30 text-left flex flex-col justify-between h-[100px] sm:h-[120px] cursor-pointer transition-colors"
                  >
                    <div className="w-7 h-7 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                      <ImageIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xs text-slate-200">Image Generator</h3>
                      <p className="text-[11px] text-slate-400 leading-none mt-1 sm:hidden">Create images</p>
                      <p className="text-[11px] text-slate-400 leading-tight mt-1 hidden sm:block">Create high-quality images from text.</p>
                    </div>
                  </div>

                  {/* Presentation Card */}
                  <div
                    onClick={() => setShowPresentationTool(true)}
                    className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/30 text-left flex flex-col justify-between h-[100px] sm:h-[120px] cursor-pointer transition-colors"
                  >
                    <div className="w-7 h-7 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                      <Presentation className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xs text-slate-200">AI Presentation</h3>
                      <p className="text-[11px] text-slate-400 leading-none mt-1 sm:hidden">Make slides</p>
                      <p className="text-[11px] text-slate-400 leading-tight mt-1 hidden sm:block">Turn ideas into structured slides.</p>
                    </div>
                  </div>

                  {/* Dev Assistant Card */}
                  <div
                    onClick={() => setShowDevTool(true)}
                    className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-purple-500/30 text-left flex flex-col justify-between h-[90px] sm:h-[120px] cursor-pointer transition-colors"
                  >
                    <div className="w-7 h-7 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                      <Code2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xs text-slate-200">Dev Assistant</h3>
                      <p className="text-[11px] text-slate-400 leading-none mt-1 sm:hidden">Generate code</p>
                      <p className="text-[11px] text-slate-400 leading-tight mt-1 hidden sm:block">Generate clean code in seconds.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* Message List View during Active Chat */
            <div className="flex-1 flex flex-col justify-between w-full min-w-0">
              <div className="divide-y divide-white/[0.04] py-2 sm:py-4 w-full min-w-0">
                {messages.map((m, idx) => (
                  <ChatMessage
                    key={m.id || `msg_${idx}`}
                    message={m}
                    onRegenerate={() => {
                      const lastUserMsg = [...messages].reverse().find(msg => msg.role === 'user');
                      if (lastUserMsg) {
                        handleSendMessage(lastUserMsg.content);
                      }
                    }}
                    onEditPrompt={(newPrompt) => {
                      handleSendMessage(newPrompt);
                    }}
                  />
                ))}

                {isStreaming && (
                  <ChatMessage
                    key="streaming_msg"
                    message={{
                      id: 'streaming_msg',
                      conversationId: activeConvId || 'new',
                      role: 'assistant',
                      content: streamingContent,
                      model: 'Zyricon AI',
                      createdAt: new Date().toISOString(),
                    }}
                    isStreaming={true}
                  />
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Anchored Bottom Chat Composer */}
              <div className="sticky bottom-0 bg-[#08040d]/95 backdrop-blur-md pt-2 border-t border-white/[0.06] w-full min-w-0">
                <ChatInput
                  onSendMessage={handleSendMessage}
                  onStopGeneration={handleStopGeneration}
                  isStreaming={isStreaming}
                  onOpenConfig={() => setShowConfigModal(true)}
                  onOpenImageTool={() => setShowImageTool(true)}
                  onOpenDevTool={() => setShowDevTool(true)}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showConfigModal && <ConfigurationModal onClose={() => setShowConfigModal(false)} />}
      {showExportModal && (
        <ExportModal
          conversation={activeConversationObj}
          messages={messages}
          onClose={() => setShowExportModal(false)}
        />
      )}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
      {showImageTool && (
        <ImageToolModal
          onClose={() => setShowImageTool(false)}
          onSendPrompt={handleSendMessage}
        />
      )}
      {showPresentationTool && (
        <PresentationToolModal
          onClose={() => setShowPresentationTool(false)}
          onSendPrompt={handleSendMessage}
        />
      )}
      {showDevTool && (
        <DevToolModal
          onClose={() => setShowDevTool(false)}
          onSendPrompt={handleSendMessage}
        />
      )}
    </div>
  );
};

export default ChatPage;
