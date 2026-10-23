import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface GifPickerProps {
  onSelectGif: (gifUrl: string) => void;
  onClose: () => void;
}

const CURATED_GIFS = [
  {
    id: 'g1',
    category: 'Gaming',
    title: 'GG Well Played',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'g2',
    category: 'Party',
    title: 'Party Parrot Vibe',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'g3',
    category: 'Anime',
    title: 'Anime Wow Shock',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'g4',
    category: 'Coding',
    title: 'Hacker Typing Fast',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'g5',
    category: 'Chill',
    title: 'Lofi Study Beats',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=500&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'g6',
    category: 'Victory',
    title: 'Victory Royale Trophy',
    url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&auto=format&fit=crop&q=80'
  }
];

export const GifPicker: React.FC<GifPickerProps> = ({ onSelectGif, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Gaming', 'Party', 'Anime', 'Coding', 'Chill', 'Victory'];

  const filtered = CURATED_GIFS.filter(gif => {
    const matchesCategory = selectedCategory === 'All' || gif.category === selectedCategory;
    const matchesSearch = !search || gif.title.toLowerCase().includes(search.toLowerCase()) || gif.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-88 max-h-[420px] bg-[#2b2d31] rounded-lg shadow-2xl border border-[#1f2023] flex flex-col overflow-hidden text-[#dbdee1] discord-pop z-50">
      <div className="p-2.5 border-b border-[#1f2023] bg-[#232428] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#949ba4]">Search Tenor GIFs</span>
          <button onClick={onClose} className="text-[#80848e] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Search Tenor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full bg-[#1e1f22] text-xs text-[#dbdee1] placeholder-[#80848e] rounded px-3 py-1.5 pl-8 focus:outline-none focus:ring-1 focus:ring-[#5865f2]"
          />
          <Search className="w-3.5 h-3.5 text-[#80848e] absolute left-2.5" />
        </div>
        {/* Category tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat ? 'bg-[#5865f2] text-white' : 'bg-[#1e1f22] text-[#949ba4] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 grid grid-cols-2 gap-2">
        {filtered.map(gif => (
          <button
            key={gif.id}
            onClick={() => {
              onSelectGif(gif.url);
              onClose();
            }}
            className="group relative rounded-md overflow-hidden bg-[#1e1f22] aspect-video hover:ring-2 hover:ring-[#5865f2] transition-all"
          >
            <img
              src={gif.thumb}
              alt={gif.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
              <span className="text-[11px] font-medium text-white truncate drop-shadow-md">
                {gif.title}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
