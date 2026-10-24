import React, { useState } from 'react';
import { Search, Compass, Check, Users, ArrowRight, X } from 'lucide-react';
import { DISCOVERABLE_SERVERS } from '../data/initialData';
import { Server } from '../types/discord';
import { playJoinVoiceSound } from '../utils/audio';

interface ServerDiscoveryModalProps {
  onClose: () => void;
  onJoinServer: (serverData: any) => void;
  joinedServerIds: string[];
}

export const ServerDiscoveryModal: React.FC<ServerDiscoveryModalProps> = ({
  onClose,
  onJoinServer,
  joinedServerIds
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Technology', 'Gaming', 'Music', 'Entertainment'];

  const filtered = DISCOVERABLE_SERVERS.filter((s) => {
    const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-4xl h-[640px] bg-[#313338] rounded-2xl shadow-2xl border border-[#232428] flex flex-col overflow-hidden text-[#dbdee1] discord-pop">
        {/* Hero Discovery Banner */}
        <div className="h-44 bg-gradient-to-r from-[#5865f2] via-[#4752c4] to-[#23272a] p-8 relative flex flex-col justify-center items-center text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2 text-white font-extrabold text-2xl tracking-tight">
            <Compass className="w-7 h-7" />
            <span>Find your community on Discord</span>
          </div>
          <p className="text-white/80 text-xs max-w-md">
            From gaming, to music, to learning, there's a place for you.
          </p>

          {/* Search bar inside banner */}
          <div className="w-full max-w-md mt-4 relative">
            <input
              type="text"
              placeholder="Explore gaming, tech, music servers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1e1f22] text-xs text-[#dbdee1] rounded-lg px-4 py-2.5 pl-10 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#5865f2] border border-[#2b2d31]"
            />
            <Search className="w-4 h-4 text-[#80848e] absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="px-8 py-3 bg-[#2b2d31] border-b border-[#232428] flex items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#5865f2] text-white'
                  : 'bg-[#1e1f22] text-[#949ba4] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Server Cards Grid */}
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((server) => {
            const isJoined = joinedServerIds.includes(server.id);
            return (
              <div
                key={server.id}
                className="bg-[#2b2d31] rounded-xl overflow-hidden border border-[#232428] hover:border-[#5865f2]/50 hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Banner */}
                  <div className="h-28 w-full relative overflow-hidden bg-[#1e1f22]">
                    <img
                      src={server.banner}
                      alt={server.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase">
                      {server.category}
                    </div>
                  </div>

                  {/* Icon & Info */}
                  <div className="p-4 relative">
                    <div className="w-12 h-12 rounded-2xl border-4 border-[#2b2d31] overflow-hidden -mt-10 mb-2 bg-[#1e1f22] shadow">
                      <img
                        src={server.icon}
                        alt={server.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                      <span className="truncate">{server.name}</span>
                      {server.verified && (
                        <Check className="w-3.5 h-3.5 p-0.5 rounded-full bg-[#5865f2] text-white shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#949ba4] line-clamp-2 mt-1 leading-relaxed">
                      {server.description}
                    </p>
                  </div>
                </div>

                {/* Footer / Join */}
                <div className="p-4 pt-0 flex items-center justify-between border-t border-[#232428]/60 mt-2">
                  <div className="flex items-center gap-1 text-[11px] text-[#949ba4]">
                    <Users className="w-3.5 h-3.5" />
                    <span>{server.memberCount.toLocaleString()} members</span>
                  </div>

                  <button
                    disabled={isJoined}
                    onClick={() => {
                      playJoinVoiceSound();
                      onJoinServer(server);
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isJoined
                        ? 'bg-[#23a55a]/20 text-[#23a55a] cursor-default'
                        : 'bg-[#5865f2] hover:bg-[#4752c4] text-white cursor-pointer'
                    }`}
                  >
                    {isJoined ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Joined</span>
                      </>
                    ) : (
                      <>
                        <span>Join Server</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
