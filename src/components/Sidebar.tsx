import React, { useState } from 'react';
import { Conversation } from '../types';
import {
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Archive,
  BookOpen,
  FolderPlus,
  Image as ImageIcon,
  Presentation,
  FileText,
  Code2,
  Crown,
  PanelLeftClose,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../store/authContext';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenUpgrade?: () => void;
  onOpenWorkspaceTool?: (tool: 'image' | 'presentation' | 'code' | 'archived' | 'library') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  isOpenMobile = false,
  onCloseMobile,
  onOpenUpgrade,
  onOpenWorkspaceTool,
}) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [chatsExpanded, setChatsExpanded] = useState(true);

  const isPremium = user?.premium || user?.accountType === 'PREMIUM';

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartRename = (e: React.MouseEvent, c: Conversation) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditingTitle(c.title);
  };

  const handleSaveRename = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      onDeleteConversation(id);
    }
  };

  const handleToolClick = (tool: 'image' | 'presentation' | 'code' | 'archived' | 'library') => {
    onOpenWorkspaceTool?.(tool);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Dark backdrop overlay for mobile drawer */}
      <div
        onClick={onCloseMobile}
        className={`fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden transition-opacity duration-200 ${
          isOpenMobile ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-[260px] max-w-[80vw] bg-[#090412] border-r border-white/[0.06] flex flex-col transition-transform duration-200 ease-out text-slate-300 select-none shrink-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header: Brand Logo & Close Button */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 p-[1px] flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-full bg-[#0a0515] flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              </div>
            </div>
            <span className="font-bold text-sm tracking-tight text-white">Zyricon</span>
          </div>

          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition-colors"
            title="Close Drawer"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Action: New Chat Button */}
        <div className="p-3 shrink-0">
          <button
            onClick={() => {
              onNewChat();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-200 text-xs font-semibold transition-all group"
          >
            <Plus className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform shrink-0" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4 custom-scrollbar text-xs">
          {/* Main Workspace Navigation */}
          <div className="space-y-0.5">
            <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Workspace
            </div>

            {/* Chat Dropdown / Header */}
            <button
              onClick={() => setChatsExpanded(!chatsExpanded)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="font-medium">Chats</span>
              </div>
              {chatsExpanded ? (
                <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
              )}
            </button>

            {/* Chat History List */}
            {chatsExpanded && (
              <div className="pl-3 pr-1 py-0.5 space-y-0.5 border-l border-white/[0.06] ml-4 max-h-44 overflow-y-auto custom-scrollbar">
                {filtered.length === 0 ? (
                  <div className="text-[11px] text-slate-500 italic px-2 py-1">No chats yet</div>
                ) : (
                  filtered.map(c => {
                    const isActive = c.id === activeConversationId;
                    const isEditing = c.id === editingId;

                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          onSelectConversation(c.id);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        className={`group relative flex items-center justify-between px-2 py-1.5 rounded-md text-xs cursor-pointer transition-all ${
                          isActive
                            ? 'bg-purple-500/15 text-purple-200 font-medium border border-purple-500/25'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                        }`}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={e => setEditingTitle(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveRename(e as any, c.id);
                            }}
                            className="bg-[#140a24] text-slate-100 px-1.5 py-0.5 rounded text-xs w-full mr-2 focus:outline-none border border-purple-500/50"
                            autoFocus
                          />
                        ) : (
                          <span className="truncate flex-1 min-w-0 mr-2 text-[11px]">{c.title}</span>
                        )}

                        <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {isEditing ? (
                            <>
                              <button onClick={e => handleSaveRename(e, c.id)} className="p-0.5 hover:text-emerald-400">
                                <Check className="w-3 h-3" />
                              </button>
                              <button onClick={e => { e.stopPropagation(); setEditingId(null); }} className="p-0.5 hover:text-rose-400">
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={e => handleStartRename(e, c)} className="p-0.5 hover:text-purple-300">
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button onClick={e => handleDelete(e, c.id)} className="p-0.5 hover:text-rose-400">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            <button
              onClick={() => handleToolClick('archived')}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
            >
              <Archive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Archive</span>
            </button>

            <button
              onClick={() => handleToolClick('library')}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Library</span>
            </button>
          </div>

          {/* Projects & Tools */}
          <div className="space-y-0.5">
            <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Projects & Tools
            </div>

            <button
              onClick={() => handleToolClick('image')}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Image</span>
            </button>

            <button
              onClick={() => handleToolClick('presentation')}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
            >
              <Presentation className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Presentation</span>
            </button>

            <button
              onClick={() => handleToolClick('library')}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Files</span>
            </button>

            <button
              onClick={() => handleToolClick('code')}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
            >
              <Code2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Code</span>
            </button>
          </div>
        </div>

        {/* Bottom Premium Card (Compact & Minimal) */}
        <div className="p-3 border-t border-white/[0.06] shrink-0">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-slate-300 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                {isPremium ? 'Premium Active' : '✨ Premium'}
              </span>
              {!isPremium && (
                <button
                  onClick={() => {
                    onOpenUpgrade?.();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 text-[11px] font-semibold transition-all"
                >
                  Upgrade
                </button>
              )}
            </div>
            {!isPremium && (
              <p className="text-[10px] text-slate-400 leading-snug">
                Unlock fast responses & advanced tools.
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
