import React, { useState, useEffect, useRef } from 'react';
import { X, Hash, Volume2, Megaphone, Folder, ChevronDown } from 'lucide-react';
import { ChannelCategory } from '../types/discord';

interface CreateChannelModalProps {
  categories: ChannelCategory[];
  defaultCategoryId?: string;
  onClose: () => void;
  onCreateChannel: (name: string, type: 'text' | 'voice' | 'announcement', categoryId: string) => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  categories,
  defaultCategoryId,
  onClose,
  onCreateChannel
}) => {
  const [channelType, setChannelType] = useState<'text' | 'voice' | 'announcement'>('text');
  const [channelName, setChannelName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    defaultCategoryId || categories[0]?.id || ''
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) return;
    const formatted = channelName.trim().toLowerCase().replace(/\s+/g, '-');
    onCreateChannel(formatted, channelType, selectedCategoryId || categories[0]?.id || 'cat_default');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#313338] text-[#dbdee1] rounded-xl shadow-2xl overflow-hidden border border-[#1f2023]/60 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Header */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">Create Channel</h2>
            <p className="text-xs text-[#949ba4]">in category: {categories.find(c => c.id === selectedCategoryId)?.name || 'Channels'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#949ba4] hover:text-white hover:bg-[#35373c] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Channel Type Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#b5bac1]">
              Channel Type
            </label>
            <div className="space-y-2">
              <label
                onClick={() => setChannelType('text')}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  channelType === 'text'
                    ? 'bg-[#35373c] border-[#5865f2] text-white'
                    : 'bg-[#2b2d31] border-[#232428] text-[#b5bac1] hover:bg-[#35373c]/50'
                }`}
              >
                <Hash className="w-6 h-6 text-[#80848e] shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">Text</div>
                  <div className="text-xs text-[#949ba4]">Post images, stickers, opinions, and puns</div>
                </div>
                <input
                  type="radio"
                  name="channelType"
                  checked={channelType === 'text'}
                  onChange={() => setChannelType('text')}
                  className="accent-[#5865f2]"
                />
              </label>

              <label
                onClick={() => setChannelType('voice')}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  channelType === 'voice'
                    ? 'bg-[#35373c] border-[#5865f2] text-white'
                    : 'bg-[#2b2d31] border-[#232428] text-[#b5bac1] hover:bg-[#35373c]/50'
                }`}
              >
                <Volume2 className="w-6 h-6 text-[#23a55a] shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">Voice</div>
                  <div className="text-xs text-[#949ba4]">Hang out together with voice, video, and screen share</div>
                </div>
                <input
                  type="radio"
                  name="channelType"
                  checked={channelType === 'voice'}
                  onChange={() => setChannelType('voice')}
                  className="accent-[#5865f2]"
                />
              </label>
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#b5bac1] flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-[#5865f2]" />
              <span>Select Category</span>
            </label>
            <div className="relative">
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#1e1f22] text-sm text-white rounded-md border border-[#232428] focus:border-[#5865f2] focus:outline-none appearance-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    📁 {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#949ba4] absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Channel Name */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#b5bac1]">
              Channel Name <span className="text-[#f23f43]">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[#949ba4] font-bold">
                {channelType === 'voice' ? '🔊' : '#'}
              </span>
              <input
                ref={inputRef}
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="new-channel"
                maxLength={32}
                required
                className="w-full pl-8 pr-3 py-2.5 bg-[#1e1f22] text-sm text-white rounded-md border border-[#232428] focus:border-[#5865f2] focus:outline-none transition-colors placeholder:text-[#80848e]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 bg-[#2b2d31] -mx-6 -mb-6 p-4 border-t border-[#232428]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white hover:underline cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!channelName.trim()}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors cursor-pointer shadow-sm"
            >
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
