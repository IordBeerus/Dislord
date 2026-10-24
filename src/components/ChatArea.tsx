import React, { useState, useRef, useEffect } from 'react';
import {
  Hash,
  Bell,
  BellOff,
  Pin,
  Users,
  Search,
  Inbox,
  PlusCircle,
  Gift,
  Smile,
  Music,
  Send,
  X,
  Reply,
  Trash2,
  Check,
  Sparkles,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Download,
  Eye,
  EyeOff,
  Video as VideoIcon,
  Film,
  File as FileIcon,
  UploadCloud,
  Rocket
} from 'lucide-react';
import { Channel, Message, User, Reaction, ServerEmoji, Attachment } from '../types/discord';
import { EmojiPicker } from './EmojiPicker';
import { GifPicker } from './GifPicker';
import { SoundboardModal } from './SoundboardModal';
import { RoleBadge } from './RoleBadge';
import { NitroBadge } from './NitroBadge';
import { PdfViewerModal } from './PdfViewerModal';
import { ImageLightboxModal } from './ImageLightboxModal';
import { playSendSound, playMessageSound } from '../utils/audio';
import { cacheLocalMedia, getLocalMedia } from '../utils/mediaUtils';
import { getAvatarFrameClass, checkUserHasNitro } from '../utils/nitroUtils';

interface ChatAreaProps {
  channel: Channel | null;
  dmRecipient: User | null;
  serverName: string;
  serverEmojis?: ServerEmoji[];
  messages: Message[];
  currentUser: User;
  isMemberListOpen: boolean;
  typingUser: string | null;
  onToggleMemberList: () => void;
  onSendMessage: (content: string, replyTo?: { id: string; authorName: string; content: string }, attachments?: Attachment[] | string) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onTogglePinMessage: (messageId: string) => void;
  onSelectMember: (user: User) => void;
  onOpenNitro: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  channel,
  dmRecipient,
  serverName,
  serverEmojis,
  messages,
  currentUser,
  isMemberListOpen,
  typingUser,
  onToggleMemberList,
  onSendMessage,
  onAddReaction,
  onDeleteMessage,
  onTogglePinMessage,
  onSelectMember,
  onOpenNitro
}) => {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  // Popovers & pickers
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showSoundboard, setShowSoundboard] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{ id: string; authorName: string; content: string } | null>(null);

  // Staged attachments for upload (images, videos, PDFs)
  const [stagedAttachments, setStagedAttachments] = useState<Attachment[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [activePdfPreview, setActivePdfPreview] = useState<{ url: string; name: string; size: string } | null>(null);
  const [activeImagePreview, setActiveImagePreview] = useState<{ url: string; name: string } | null>(null);

  // Slash commands popup
  const [slashQuery, setSlashQuery] = useState<string | null>(null);

  // Revealed spoilers set
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      // 50MB file size limit
      if (file.size > 50 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 50MB Discord limit. Please choose a smaller file.`);
        return;
      }

      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm') || file.name.endsWith('.mov');
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      let attType: 'image' | 'video' | 'pdf' | 'file' = 'file';
      if (isImage) attType = 'image';
      else if (isVideo) attType = 'video';
      else if (isPdf) attType = 'pdf';

      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          const newAtt: Attachment = {
            id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            url: event.target.result,
            name: file.name,
            type: attType,
            size: formatFileSize(file.size),
            isSpoiler: false
          };
          cacheLocalMedia(newAtt.id, newAtt.url);
          setStagedAttachments((prev) => [...prev, newAtt]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const toggleStagedSpoiler = (id: string) => {
    setStagedAttachments((prev) =>
      prev.map((att) => (att.id === id ? { ...att, isSpoiler: !att.isSpoiler } : att))
    );
  };

  const removeStagedAttachment = (id: string) => {
    setStagedAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  // Handle typing & slash detection
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (val.startsWith('/')) {
      setSlashQuery(val.slice(1).toLowerCase());
    } else {
      setSlashQuery(null);
    }
  };

  const slashCommands = [
    { name: '/help', desc: 'Displays available commands and markdown guide' },
    { name: '/flip', desc: 'Flips a virtual coin (Heads or Tails)' },
    { name: '/roll', desc: 'Rolls a random die (1-100)' },
    { name: '/poll', desc: 'Creates an interactive community vote poll' },
    { name: '/shrug', desc: 'Appends ¯\\_(ツ)_/¯ to your message' },
    { name: '/tableflip', desc: 'Appends (╯°□°)╯︵ ┻━┻ to your message' },
    { name: '/clear', desc: 'Clears recent test messages in this channel' }
  ];

  const handleSelectSlash = (cmd: string) => {
    if (cmd === '/shrug') {
      setInputText('¯\\_(ツ)_/¯');
    } else if (cmd === '/tableflip') {
      setInputText('(╯°□°)╯︵ ┻━┻');
    } else {
      setInputText(cmd + ' ');
    }
    setSlashQuery(null);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!inputText.trim() && stagedAttachments.length === 0) return;
    playSendSound();
    onSendMessage(
      inputText.trim(),
      replyTarget || undefined,
      stagedAttachments.length > 0 ? stagedAttachments : undefined
    );
    setInputText('');
    setReplyTarget(null);
    setSlashQuery(null);
    setStagedAttachments([]);
  };

  const toggleSpoiler = (id: string) => {
    setRevealedSpoilers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter messages by search or pinned
  const filteredMessages = messages.filter(m => {
    if (showPinnedOnly && !m.pinned) return false;
    if (searchQuery.trim()) {
      return (
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.author.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  // Markdown renderer helper
  const renderMessageContent = (content: string, msgId: string) => {
    // Check for code blocks
    if (content.includes('```')) {
      const parts = content.split(/(```[\s\S]*?```)/g);
      return parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const code = part.slice(3, -3).replace(/^[a-z]+\n/, '');
          return (
            <div key={i} className="my-2 p-3 bg-[#1e1f22] border border-[#2b2d31] rounded-lg font-mono text-xs text-[#57f287] overflow-x-auto select-text">
              <pre>{code}</pre>
            </div>
          );
        }
        return <span key={i}>{parseInlineMarkdown(part, `${msgId}_${i}`)}</span>;
      });
    }

    return parseInlineMarkdown(content, msgId);
  };

  const parseInlineMarkdown = (text: string, keyPrefix: string) => {
    // Spoilers: ||text||
    if (text.includes('||')) {
      const parts = text.split(/(\|\|[\s\S]*?\|\|)/g);
      return parts.map((part, idx) => {
        if (part.startsWith('||') && part.endsWith('||')) {
          const inner = part.slice(2, -2);
          const spoilerKey = `${keyPrefix}_sp_${idx}`;
          const isRevealed = revealedSpoilers[spoilerKey];
          return (
            <span
              key={idx}
              onClick={() => toggleSpoiler(spoilerKey)}
              className={`cursor-pointer rounded px-1 transition-all ${
                isRevealed
                  ? 'bg-[#2b2d31] text-[#dbdee1]'
                  : 'bg-[#2b2d31] text-transparent hover:bg-[#35373c] select-none'
              }`}
            >
              {inner}
            </span>
          );
        }
        return <span key={idx}>{parseBoldItalic(part)}</span>;
      });
    }

    return parseBoldItalic(text);
  };

  const parseBoldItalic = (text: string) => {
    // Bold: **text**
    if (text.includes('**')) {
      const parts = text.split(/(\*\*[\s\S]*?\*\*)/g);
      return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
        }
        // inline code: `code`
        if (part.includes('`')) {
          const subparts = part.split(/(`[^`]+`)/g);
          return subparts.map((sub, sidx) => {
            if (sub.startsWith('`') && sub.endsWith('`')) {
              return (
                <code key={sidx} className="bg-[#1e1f22] text-[#f23f43] px-1 py-0.5 rounded text-xs font-mono">
                  {sub.slice(1, -1)}
                </code>
              );
            }
            return sub;
          });
        }
        return part;
      });
    }
    return text;
  };

  return (
    <div
      className="flex-1 h-full bg-[#313338] flex flex-col min-w-0 select-text relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-[#2b2d31]/90 backdrop-blur-xs z-50 flex flex-col items-center justify-center border-2 border-dashed border-[#5865f2] rounded-lg m-2 pointer-events-none transition-all">
          <UploadCloud className="w-16 h-16 text-[#5865f2] mb-3 animate-bounce" />
          <p className="text-xl font-bold text-white mb-1">
            Upload to {channel ? `#${channel.name}` : dmRecipient ? `@${dmRecipient.displayName}` : 'chat'}
          </p>
          <p className="text-sm text-[#949ba4]">Release your images, MP4 videos, or PDF documents to upload</p>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="h-12 px-4 border-b border-[#1f2023] flex items-center justify-between shrink-0 select-none shadow-xs z-10 bg-[#313338]">
        <div className="flex items-center gap-2 min-w-0">
          {channel ? (
            <>
              <Hash className="w-6 h-6 text-[#80848e] shrink-0" />
              <h2 className="font-bold text-white text-[15px] truncate">{channel.name}</h2>
              {channel.topic && (
                <>
                  <div className="w-[1px] h-4 bg-[#3f4147] mx-2 hidden sm:block shrink-0" />
                  <p className="text-xs text-[#949ba4] truncate hidden sm:block font-normal">
                    {channel.topic}
                  </p>
                </>
              )}
            </>
          ) : dmRecipient ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg font-bold text-[#80848e]">@</span>
              <h2 className="font-bold text-white text-[15px] truncate">{dmRecipient.displayName}</h2>
              {dmRecipient.customStatus && (
                <span className="text-xs text-[#949ba4] italic truncate hidden sm:inline">
                  - {dmRecipient.customStatus}
                </span>
              )}
            </div>
          ) : null}
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3 text-[#b5bac1] shrink-0">
          {/* Toggle Mute Notifications */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute Channel' : 'Mute Channel'}
            className="hover:text-[#dbdee1] p-1 rounded transition-colors"
          >
            {isMuted ? <BellOff className="w-5 h-5 text-[#f23f43]" /> : <Bell className="w-5 h-5" />}
          </button>

          {/* Pinned Messages Toggle */}
          <button
            onClick={() => setShowPinnedOnly(!showPinnedOnly)}
            title="Pinned Messages"
            className={`p-1 rounded transition-colors ${
              showPinnedOnly ? 'text-[#5865f2] bg-[#35373c]' : 'hover:text-[#dbdee1]'
            }`}
          >
            <Pin className="w-5 h-5" />
          </button>

          {/* Toggle Member List */}
          <button
            onClick={onToggleMemberList}
            title="Member List"
            className={`p-1 rounded transition-colors ${
              isMemberListOpen ? 'text-white' : 'hover:text-[#dbdee1]'
            }`}
          >
            <Users className="w-5 h-5" />
          </button>

          {/* Search Box in channel */}
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-36 focus:w-52 transition-all bg-[#1e1f22] text-xs text-[#dbdee1] placeholder-[#80848e] rounded px-2.5 py-1 pl-7 focus:outline-none focus:ring-1 focus:ring-[#5865f2]"
            />
            <Search className="w-3.5 h-3.5 text-[#80848e] absolute left-2" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-[#80848e] hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* Channel Welcome Banner */}
        {!searchQuery && !showPinnedOnly && (
          <div className="space-y-2 mb-8">
            <div className="w-16 h-16 rounded-full bg-[#35373c] flex items-center justify-center text-white shadow-md">
              <Hash className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-white">
              Welcome to #{channel?.name || dmRecipient?.displayName || 'general'}!
            </h1>
            <p className="text-xs text-[#949ba4]">
              This is the start of the #{channel?.name || dmRecipient?.displayName || 'general'} channel.
            </p>
          </div>
        )}

        {/* Message Items */}
        {filteredMessages.map((msg, index) => {
          const isSameAuthorAsPrev =
            index > 0 && filteredMessages[index - 1].authorId === msg.authorId;

          return (
            <div
              key={msg.id}
              className={`relative group flex gap-4 px-2 py-1 -mx-2 rounded hover:bg-[#2e3035] transition-colors ${
                msg.pinned ? 'bg-[#2b2d31]/50 border-l-2 border-[#5865f2]' : ''
              }`}
            >
              {/* Message Hover Actions Toolbar */}
              <div className="absolute right-3 -top-3 hidden group-hover:flex items-center bg-[#313338] border border-[#232428] rounded-md shadow-xl p-0.5 text-[#b5bac1] z-20">
                <button
                  onClick={() => onAddReaction(msg.id, '❤️')}
                  title="Love"
                  className="p-1 hover:text-white hover:bg-[#35373c] rounded"
                >
                  ❤️
                </button>
                <button
                  onClick={() => onAddReaction(msg.id, '🔥')}
                  title="Fire"
                  className="p-1 hover:text-white hover:bg-[#35373c] rounded"
                >
                  🔥
                </button>
                <button
                  onClick={() => onAddReaction(msg.id, '👍')}
                  title="Thumbs Up"
                  className="p-1 hover:text-white hover:bg-[#35373c] rounded"
                >
                  👍
                </button>
                <div className="w-[1px] h-3 bg-[#3f4147] mx-1" />
                <button
                  onClick={() =>
                    setReplyTarget({
                      id: msg.id,
                      authorName: msg.author.displayName,
                      content: msg.content
                    })
                  }
                  title="Reply"
                  className="p-1 hover:text-white hover:bg-[#35373c] rounded"
                >
                  <Reply className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onTogglePinMessage(msg.id)}
                  title={msg.pinned ? 'Unpin' : 'Pin Message'}
                  className={`p-1 hover:text-white hover:bg-[#35373c] rounded ${
                    msg.pinned ? 'text-[#5865f2]' : ''
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                {msg.authorId === currentUser.id && (
                  <button
                    onClick={() => onDeleteMessage(msg.id)}
                    title="Delete Message"
                    className="p-1 hover:text-[#f23f43] hover:bg-[#35373c] rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Avatar Column */}
              <div className="w-10 shrink-0">
                {!isSameAuthorAsPrev ? (
                  <button
                    onClick={() => onSelectMember(msg.author)}
                    className="w-10 h-10 rounded-full hover:opacity-80 transition-opacity cursor-pointer mt-0.5 relative"
                  >
                    <img
                      src={msg.author.avatar}
                      alt={msg.author.displayName}
                      className={`w-full h-full rounded-full object-cover ${getAvatarFrameClass(msg.author.avatarFrame)}`}
                    />
                  </button>
                ) : (
                  <span className="text-[10px] text-[#80848e] opacity-0 group-hover:opacity-100 select-none block text-center pt-1">
                    {msg.timestamp.split(' at ')[1] || ''}
                  </span>
                )}
              </div>

              {/* Message Content Body */}
              <div className="min-w-0 flex-1">
                {/* Author Name & Header */}
                {!isSameAuthorAsPrev && (
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <button
                      onClick={() => onSelectMember(msg.author)}
                      className="font-bold text-[14px] hover:underline cursor-pointer"
                      style={{ color: msg.author.roleColor || '#ffffff' }}
                    >
                      {msg.author.displayName}
                    </button>
                    {checkUserHasNitro(msg.author) && (
                      <NitroBadge
                        size="sm"
                        isBooster={Boolean(msg.author.badges?.includes('Nitro Booster'))}
                        onClick={() => onSelectMember(msg.author)}
                      />
                    )}
                    <RoleBadge role={msg.author.role} roleColor={msg.author.roleColor} />
                    <span className="text-[11px] text-[#949ba4] font-medium">
                      {msg.timestamp}
                    </span>
                    {msg.pinned && (
                      <span className="text-[10px] text-[#5865f2] font-semibold flex items-center gap-0.5">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                  </div>
                )}

                {/* Reply reference if any */}
                {msg.replyTo && (
                  <div className="flex items-center gap-1.5 text-xs text-[#b5bac1] mb-1 pl-1 border-l-2 border-[#5865f2]">
                    <span className="font-semibold text-white">@{msg.replyTo.authorName}</span>
                    <span className="truncate opacity-75 max-w-sm">{msg.replyTo.content}</span>
                  </div>
                )}

                {/* Content text */}
                <div className="text-[14px] text-[#dbdee1] leading-relaxed break-words font-normal">
                  {renderMessageContent(msg.content, msg.id)}
                </div>

                {/* Attachments if any */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.attachments.map((att) => {
                      const isRevealed = !att.isSpoiler || revealedSpoilers[att.id];
                      const mediaUrl = att.url || getLocalMedia(att.id) || '';

                      // MP4 / Video Attachment
                      if (att.type === 'video') {
                        if (!mediaUrl) {
                          return (
                            <div
                              key={att.id}
                              className="max-w-md bg-[#2b2d31] border border-[#232428] rounded-xl p-3 flex items-center justify-between gap-3 shadow-md"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-[#5865f2]/15 text-[#5865f2] flex items-center justify-center shrink-0">
                                  <VideoIcon className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-white text-sm truncate" title={att.name}>
                                    {att.name}
                                  </p>
                                  <p className="text-xs text-[#949ba4] flex items-center gap-1.5">
                                    <span>{att.size || 'Video file'}</span>
                                    <span className="w-1 h-1 rounded-full bg-[#949ba4]" />
                                    <span className="text-[#5865f2] font-medium">Large Video</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={att.id}
                            className="max-w-lg rounded-xl overflow-hidden bg-[#1e1f22] border border-[#2b2d31] relative group"
                          >
                            {!isRevealed ? (
                              <div
                                onClick={() => toggleSpoiler(att.id)}
                                className="h-44 flex flex-col items-center justify-center bg-[#111214] cursor-pointer text-center p-4 hover:bg-[#18191c] transition-colors"
                              >
                                <EyeOff className="w-8 h-8 text-[#949ba4] mb-2" />
                                <span className="bg-[#2b2d31] text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                  Spoiler Video
                                </span>
                                <span className="text-xs text-[#949ba4] mt-1">Click to reveal video</span>
                              </div>
                            ) : (
                              <div>
                                <video
                                  src={mediaUrl}
                                  controls
                                  playsInline
                                  className="w-full max-h-80 rounded bg-black"
                                />
                                <div className="px-3 py-1.5 flex items-center justify-between text-xs text-[#949ba4] bg-[#232428]">
                                  <span className="truncate max-w-xs">{att.name}</span>
                                  <a
                                    href={mediaUrl}
                                    download={att.name}
                                    className="hover:text-white flex items-center gap-1 transition-colors"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>{att.size || 'Download'}</span>
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // PDF Document Attachment
                      if (att.type === 'pdf') {
                        return (
                          <div
                            key={att.id}
                            className="max-w-md bg-[#2b2d31] hover:bg-[#35373c]/70 transition-colors border border-[#232428] rounded-xl p-3 flex items-center justify-between gap-3 shadow-md"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-[#f23f43]/15 text-[#f23f43] flex items-center justify-center shrink-0">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-white text-sm truncate" title={att.name}>
                                  {att.name}
                                </p>
                                <p className="text-xs text-[#949ba4] flex items-center gap-1.5">
                                  <span>{att.size || 'PDF Document'}</span>
                                  <span className="w-1 h-1 rounded-full bg-[#949ba4]" />
                                  <span className="text-[#f23f43] font-medium">PDF</span>
                                </p>
                              </div>
                            </div>

                            {mediaUrl && (
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() =>
                                    setActivePdfPreview({
                                      url: mediaUrl,
                                      name: att.name,
                                      size: att.size || ''
                                    })
                                  }
                                  className="px-2.5 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Preview PDF"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </button>
                                <a
                                  href={mediaUrl}
                                  download={att.name}
                                  className="p-1.5 text-[#949ba4] hover:text-white rounded hover:bg-[#2b2d31] transition-colors"
                                  title="Download PDF"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Generic File Attachment
                      if (att.type === 'file') {
                        return (
                          <div
                            key={att.id}
                            className="max-w-md bg-[#2b2d31] border border-[#232428] rounded-xl p-3 flex items-center justify-between gap-3 shadow-md"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-[#5865f2]/15 text-[#5865f2] flex items-center justify-center shrink-0">
                                <FileIcon className="w-6 h-6" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-white text-sm truncate" title={att.name}>
                                  {att.name}
                                </p>
                                <p className="text-xs text-[#949ba4]">{att.size || 'Attachment'}</p>
                              </div>
                            </div>

                            {mediaUrl && (
                              <a
                                href={mediaUrl}
                                download={att.name}
                                className="px-2.5 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </a>
                            )}
                          </div>
                        );
                      }

                      // Image Attachment
                      if (!mediaUrl) {
                        return (
                          <div
                            key={att.id}
                            className="max-w-md bg-[#2b2d31] border border-[#232428] rounded-xl p-3 flex items-center justify-between gap-3 shadow-md"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-[#5865f2]/15 text-[#5865f2] flex items-center justify-center shrink-0">
                                <ImageIcon className="w-6 h-6" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-white text-sm truncate" title={att.name}>
                                  {att.name}
                                </p>
                                <p className="text-xs text-[#949ba4]">{att.size || 'Image'}</p>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={att.id}
                          className="max-w-md rounded-xl overflow-hidden border border-[#2b2d31] relative group"
                        >
                          {!isRevealed ? (
                            <div
                              onClick={() => toggleSpoiler(att.id)}
                              className="h-44 flex flex-col items-center justify-center bg-[#1e1f22] cursor-pointer text-center p-4 hover:bg-[#232428] transition-colors"
                            >
                              <EyeOff className="w-8 h-8 text-[#949ba4] mb-2" />
                              <span className="bg-[#2b2d31] text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                Spoiler Image
                              </span>
                              <span className="text-xs text-[#949ba4] mt-1">Click to reveal</span>
                            </div>
                          ) : (
                            <div className="relative">
                              <img
                                src={mediaUrl}
                                alt={att.name}
                                onClick={() => setActiveImagePreview({ url: mediaUrl, name: att.name })}
                                className="w-full h-auto object-cover max-h-80 rounded cursor-pointer hover:brightness-105 transition-all"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-black/60 backdrop-blur-xs p-1 rounded-md">
                                <button
                                  onClick={() => setActiveImagePreview({ url: mediaUrl, name: att.name })}
                                  className="text-white hover:text-[#5865f2] p-1 cursor-pointer"
                                  title="Expand Image"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <a
                                  href={mediaUrl}
                                  download={att.name}
                                  className="text-white hover:text-[#5865f2] p-1 cursor-pointer"
                                  title="Download Image"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reactions list */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    {msg.reactions.map((react, rIdx) => {
                      const hasReacted = react.userIds.includes(currentUser.id);
                      return (
                        <button
                          key={rIdx}
                          onClick={() => onAddReaction(msg.id, react.emoji)}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                            hasReacted
                              ? 'bg-[#5865f2]/20 border-[#5865f2] text-[#5865f2]'
                              : 'bg-[#2b2d31] border-[#35373c] text-[#b5bac1] hover:bg-[#35373c]'
                          }`}
                        >
                          <span>{react.emoji}</span>
                          <span className="font-mono text-[11px]">{react.count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredMessages.length === 0 && (
          <div className="text-center py-16 text-xs text-[#949ba4]">
            {showPinnedOnly ? 'No pinned messages in this channel yet.' : 'No messages found.'}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUser && (
        <div className="px-6 py-1 text-xs text-[#dbdee1] flex items-center gap-2 select-none animate-pulse">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[#dbdee1] rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-[#dbdee1] rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 bg-[#dbdee1] rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
          <span className="font-semibold text-white">{typingUser}</span> is typing...
        </div>
      )}

      {/* Bottom Input Area */}
      <div className="px-4 pb-6 pt-1 relative select-none">
        {/* Reply Quote Bar */}
        {replyTarget && (
          <div className="bg-[#2b2d31] px-3 py-1.5 rounded-t-lg border-t border-x border-[#35373c] flex items-center justify-between text-xs text-[#949ba4]">
            <div className="flex items-center gap-2 truncate">
              <Reply className="w-3.5 h-3.5 text-[#5865f2]" />
              <span>Replying to <strong className="text-white">@{replyTarget.authorName}</strong></span>
              <span className="truncate italic max-w-xs">"{replyTarget.content}"</span>
            </div>
            <button onClick={() => setReplyTarget(null)} className="hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Slash Command Autocomplete Menu */}
        {slashQuery !== null && (
          <div className="absolute bottom-20 left-4 right-4 max-w-lg bg-[#2b2d31] rounded-xl shadow-2xl border border-[#1f2023] overflow-hidden text-xs text-[#dbdee1] z-30 discord-pop">
            <div className="p-2 bg-[#232428] font-bold text-[11px] uppercase tracking-wider text-[#949ba4]">
              Matching Slash Commands
            </div>
            <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
              {slashCommands
                .filter(cmd => cmd.name.includes(slashQuery))
                .map(cmd => (
                  <button
                    key={cmd.name}
                    onClick={() => handleSelectSlash(cmd.name)}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-[#35373c] text-left transition-colors"
                  >
                    <span className="font-bold text-[#5865f2]">{cmd.name}</span>
                    <span className="text-[#949ba4] text-[11px]">{cmd.desc}</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Staged Uploads Tray */}
        {stagedAttachments.length > 0 && (
          <div className="bg-[#2b2d31] p-3 rounded-t-lg border-t border-x border-[#35373c] flex items-center gap-3 overflow-x-auto pb-3">
            {stagedAttachments.map((att) => (
              <div
                key={att.id}
                className="relative bg-[#1e1f22] rounded-lg p-2 flex flex-col gap-1.5 shrink-0 w-44 border border-[#35373c] group"
              >
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeStagedAttachment(att.id)}
                  title="Remove attachment"
                  className="absolute -top-1.5 -right-1.5 bg-[#f23f43] hover:bg-[#da373c] text-white rounded-full p-1 shadow-md z-10 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Preview Thumbnail or Icon */}
                <div className="w-full h-24 bg-[#111214] rounded overflow-hidden flex items-center justify-center relative">
                  {att.type === 'image' ? (
                    <img
                      src={att.url}
                      alt={att.name}
                      className={`w-full h-full object-cover ${att.isSpoiler ? 'filter blur-sm brightness-75' : ''}`}
                    />
                  ) : att.type === 'video' ? (
                    <div className="flex flex-col items-center justify-center text-[#5865f2] gap-1 p-2 text-center">
                      <Film className="w-8 h-8" />
                      <span className="text-[10px] text-[#949ba4] uppercase font-bold">Video (MP4)</span>
                    </div>
                  ) : att.type === 'pdf' ? (
                    <div className="flex flex-col items-center justify-center text-[#f23f43] gap-1 p-2 text-center">
                      <FileText className="w-8 h-8" />
                      <span className="text-[10px] text-[#949ba4] uppercase font-bold">PDF Document</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#949ba4] gap-1 p-2 text-center">
                      <FileIcon className="w-8 h-8" />
                      <span className="text-[10px] uppercase font-bold">File</span>
                    </div>
                  )}

                  {att.isSpoiler && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-[10px] font-bold text-white tracking-widest uppercase">
                      Spoiler
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0">
                  <p className="text-xs text-white font-medium truncate" title={att.name}>{att.name}</p>
                  <p className="text-[10px] text-[#949ba4]">{att.size}</p>
                </div>

                {/* Spoiler Toggle Button */}
                <button
                  type="button"
                  onClick={() => toggleStagedSpoiler(att.id)}
                  className={`text-[10px] font-semibold py-1 px-2 rounded flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    att.isSpoiler
                      ? 'bg-[#5865f2] text-white'
                      : 'bg-[#2b2d31] text-[#949ba4] hover:text-white hover:bg-[#35373c]'
                  }`}
                  title="Mark as Spoiler"
                >
                  {att.isSpoiler ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{att.isSpoiler ? 'Spoiler On' : 'Mark Spoiler'}</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Chat Input Container */}
        <div
          className={`bg-[#383a40] rounded-lg flex items-center px-4 py-2.5 transition-colors focus-within:ring-1 focus-within:ring-[#5865f2] ${
            replyTarget || stagedAttachments.length > 0 ? 'rounded-t-none' : ''
          }`}
        >
          {/* Hidden File Input for Native File Upload */}
          <input
            type="file"
            ref={attachmentInputRef}
            onChange={handleFilesSelected}
            multiple
            accept="image/*,video/mp4,video/webm,video/quicktime,application/pdf,.pdf"
            className="hidden"
          />

          {/* Plus / Attachment button */}
          <button
            type="button"
            onClick={() => attachmentInputRef.current?.click()}
            title="Upload Files (Images, MP4, PDFs)"
            className="text-[#b5bac1] hover:text-white mr-3 shrink-0 cursor-pointer transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              channel
                ? `Message #${channel.name}`
                : dmRecipient
                ? `Message @${dmRecipient.displayName}`
                : 'Message'
            }
            className="flex-1 bg-transparent text-sm text-[#dbdee1] placeholder-[#80848e] focus:outline-none resize-none max-h-32"
          />

          {/* Right Input Tools */}
          <div className="flex items-center gap-3 text-[#b5bac1] shrink-0 ml-2">
            {/* Nitro Gift button */}
            <button
              onClick={onOpenNitro}
              title="Gift Nitro"
              className="hover:text-[#eb459e] transition-colors cursor-pointer"
            >
              <Gift className="w-5 h-5" />
            </button>

            {/* GIF Picker toggle */}
            <button
              onClick={() => {
                setShowGifPicker(!showGifPicker);
                setShowEmojiPicker(false);
              }}
              title="Open GIF Picker"
              className="hover:text-white font-extrabold text-[11px] px-1.5 py-0.5 rounded bg-[#2b2d31] hover:bg-[#5865f2] transition-colors cursor-pointer"
            >
              GIF
            </button>

            {/* Emoji Picker toggle */}
            <button
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowGifPicker(false);
              }}
              title="Select Emoji"
              className="hover:text-[#fee75c] transition-colors cursor-pointer"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Soundboard Launcher */}
            <button
              onClick={() => setShowSoundboard(!showSoundboard)}
              title="Open Soundboard"
              className="hover:text-[#57f287] transition-colors cursor-pointer"
            >
              <Music className="w-5 h-5" />
            </button>

            {/* Send button */}
            {(inputText.trim() || stagedAttachments.length > 0) && (
              <button
                onClick={handleSend}
                title="Send Message"
                className="text-[#5865f2] hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Emoji Picker floating popover */}
        {showEmojiPicker && (
          <div className="absolute right-4 bottom-20 z-40">
            <EmojiPicker
              serverEmojis={serverEmojis}
              serverName={serverName}
              isNitro={Boolean(currentUser.isNitro || currentUser.badges?.includes('Nitro Booster') || currentUser.badges?.includes('Nitro Subscriber'))}
              onOpenNitro={() => {
                setShowEmojiPicker(false);
                onOpenNitro();
              }}
              onSelectEmoji={(emoji) => {
                setInputText(prev => prev + emoji);
                setShowEmojiPicker(false);
              }}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}

        {/* GIF Picker floating popover */}
        {showGifPicker && (
          <div className="absolute right-4 bottom-20 z-40">
            <GifPicker
              onSelectGif={(gifUrl) => {
                playSendSound();
                onSendMessage('Sent a GIF from Tenor', replyTarget || undefined, gifUrl);
                setShowGifPicker(false);
                setReplyTarget(null);
              }}
              onClose={() => setShowGifPicker(false)}
            />
          </div>
        )}

        {/* Soundboard Modal */}
        {showSoundboard && (
          <SoundboardModal
            onClose={() => setShowSoundboard(false)}
            isNitro={Boolean(currentUser.isNitro || currentUser.badges?.includes('Nitro Booster') || currentUser.badges?.includes('Nitro Subscriber'))}
            onOpenNitro={() => {
              setShowSoundboard(false);
              onOpenNitro();
            }}
            onSendSoundToChat={(soundName, icon) => {
              onSendMessage(`🔊 **Played Soundboard Sound:** ${icon} *${soundName}*`);
            }}
          />
        )}
      </div>

      {/* PDF Document Viewer Modal */}
      {activePdfPreview && (
        <PdfViewerModal
          pdfUrl={activePdfPreview.url}
          fileName={activePdfPreview.name}
          fileSize={activePdfPreview.size}
          onClose={() => setActivePdfPreview(null)}
        />
      )}

      {/* Image Lightbox Viewer Modal */}
      {activeImagePreview && (
        <ImageLightboxModal
          imageUrl={activeImagePreview.url}
          imageName={activeImagePreview.name}
          onClose={() => setActiveImagePreview(null)}
        />
      )}
    </div>
  );
};
