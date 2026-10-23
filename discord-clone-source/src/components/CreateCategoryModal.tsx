import React, { useState, useEffect, useRef } from 'react';
import { X, FolderPlus, Lock } from 'lucide-react';

interface CreateCategoryModalProps {
  onClose: () => void;
  onCreateCategory: (name: string, isPrivate?: boolean) => void;
}

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  onClose,
  onCreateCategory
}) => {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateCategory(name.trim().toUpperCase(), isPrivate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#313338] text-[#dbdee1] rounded-xl shadow-2xl overflow-hidden border border-[#1f2023]/60 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Header */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#5865f2]/20 text-[#5865f2]">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Create Category</h2>
              <p className="text-xs text-[#949ba4]">Group related text and voice channels together</p>
            </div>
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
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#b5bac1]">
              Category Name <span className="text-[#f23f43]">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GAMING, STUDY ROOMS, STAFF"
              maxLength={40}
              required
              className="w-full px-3 py-2.5 bg-[#1e1f22] text-sm text-white rounded-md border border-[#232428] focus:border-[#5865f2] focus:outline-none transition-colors uppercase placeholder:normal-case placeholder:text-[#80848e]"
            />
          </div>

          {/* Private Category Toggle */}
          <div className="p-3 bg-[#2b2d31] rounded-lg border border-[#232428] flex items-center justify-between cursor-pointer" onClick={() => setIsPrivate(!isPrivate)}>
            <div className="flex items-start gap-3">
              <Lock className={`w-4 h-4 mt-0.5 ${isPrivate ? 'text-[#f23f43]' : 'text-[#949ba4]'}`} />
              <div>
                <div className="text-sm font-semibold text-white">Private Category</div>
                <div className="text-xs text-[#949ba4]">
                  Only selected members and roles will be able to view this category.
                </div>
              </div>
            </div>
            <button
              type="button"
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                isPrivate ? 'bg-[#5865f2]' : 'bg-[#4e5058]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  isPrivate ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
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
              disabled={!name.trim()}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors cursor-pointer shadow-sm"
            >
              Create Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
