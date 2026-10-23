import React from 'react';
import { Compass, Plus, Sparkles } from 'lucide-react';
import { Server } from '../types/discord';

interface ServerSidebarProps {
  servers: Server[];
  activeServerId: string | null; // null means Direct Messages (Home)
  isDiscoveryOpen: boolean;
  onSelectServer: (serverId: string | null) => void;
  onOpenAddServer: () => void;
  onOpenDiscovery: () => void;
  onOpenNitro: () => void;
  unreadCountHome: number;
}

export const ServerSidebar: React.FC<ServerSidebarProps> = ({
  servers,
  activeServerId,
  isDiscoveryOpen,
  onSelectServer,
  onOpenAddServer,
  onOpenDiscovery,
  onOpenNitro,
  unreadCountHome
}) => {
  const isHomeActive = activeServerId === null && !isDiscoveryOpen;

  return (
    <aside className="w-[72px] h-full bg-[#1e1f22] flex flex-col items-center py-3 select-none shrink-0 z-30">
      {/* Home / Discord Clyde Button */}
      <div className="relative group flex items-center justify-center w-full mb-2">
        {/* Active / Hover Pill Indicator */}
        <div
          className={`absolute left-0 w-1 bg-white rounded-r-full server-pill transition-all duration-200 ${
            isHomeActive ? 'h-10' : 'h-0 group-hover:h-5'
          }`}
        />

        <button
          onClick={() => onSelectServer(null)}
          title="Direct Messages"
          className={`relative w-12 h-12 flex items-center justify-center transition-all duration-200 ${
            isHomeActive
              ? 'bg-[#5865f2] text-white rounded-[16px]'
              : 'bg-[#313338] text-[#dbdee1] hover:bg-[#5865f2] hover:text-white rounded-[24px] hover:rounded-[16px]'
          }`}
        >
          {/* Discord Clyde SVG */}
          <svg className="w-7 h-7 fill-current" viewBox="0 0 127.14 96.36">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z" />
          </svg>

          {/* Unread badge */}
          {unreadCountHome > 0 && (
            <span className="absolute -bottom-1 -right-1 bg-[#f23f43] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full border-[3px] border-[#1e1f22]">
              {unreadCountHome}
            </span>
          )}
        </button>
      </div>

      {/* Separator */}
      <div className="w-8 h-[2px] bg-[#35363c] rounded mb-2" />

      {/* Server List */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center gap-2 py-1 scrollbar-none">
        {servers.map((server) => {
          const isActive = activeServerId === server.id && !isDiscoveryOpen;
          return (
            <div key={server.id} className="relative group flex items-center justify-center w-full">
              {/* Left Pill */}
              <div
                className={`absolute left-0 w-1 bg-white rounded-r-full server-pill transition-all duration-200 ${
                  isActive ? 'h-10' : 'h-0 group-hover:h-5'
                }`}
              />

              <button
                onClick={() => onSelectServer(server.id)}
                className={`relative w-12 h-12 flex items-center justify-center transition-all duration-200 overflow-hidden font-semibold ${
                  isActive
                    ? 'rounded-[16px] bg-[#5865f2] text-white shadow-lg'
                    : 'rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-[#5865f2] text-[#dbdee1] hover:text-white'
                }`}
              >
                {server.icon ? (
                  <img
                    src={server.icon}
                    alt={server.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-sm uppercase tracking-wider">{server.acronym}</span>
                )}
              </button>

              {/* Tooltip on hover */}
              <div className="absolute left-[80px] px-3 py-1.5 bg-[#111214] text-[#dbdee1] text-xs font-semibold rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                {server.name}
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-[#111214]" />
              </div>
            </div>
          );
        })}

        {/* Add Server Button */}
        <div className="relative group flex items-center justify-center w-full">
          <div className="absolute left-0 w-1 bg-white rounded-r-full server-pill h-0 group-hover:h-5 transition-all duration-200" />
          <button
            onClick={onOpenAddServer}
            title="Add a Server"
            className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-[#23a55a] text-[#23a55a] hover:text-white flex items-center justify-center transition-all duration-200 group"
          >
            <Plus className="w-6 h-6 transition-transform group-hover:scale-110" />
          </button>
          <div className="absolute left-[80px] px-3 py-1.5 bg-[#111214] text-[#dbdee1] text-xs font-semibold rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Add a Server
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-[#111214]" />
          </div>
        </div>

        {/* Explore Discoverable Servers */}
        <div className="relative group flex items-center justify-center w-full">
          <div
            className={`absolute left-0 w-1 bg-white rounded-r-full server-pill transition-all duration-200 ${
              isDiscoveryOpen ? 'h-10' : 'h-0 group-hover:h-5'
            }`}
          />
          <button
            onClick={onOpenDiscovery}
            title="Explore Discoverable Servers"
            className={`w-12 h-12 flex items-center justify-center transition-all duration-200 ${
              isDiscoveryOpen
                ? 'rounded-[16px] bg-[#23a55a] text-white'
                : 'rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-[#23a55a] text-[#23a55a] hover:text-white'
            }`}
          >
            <Compass className="w-6 h-6" />
          </button>
          <div className="absolute left-[80px] px-3 py-1.5 bg-[#111214] text-[#dbdee1] text-xs font-semibold rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Explore Discoverable Servers
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-[#111214]" />
          </div>
        </div>

        {/* Discord Nitro Quick Modal */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={onOpenNitro}
            title="Discord Nitro"
            className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-gradient-to-tr hover:from-[#f47b67] hover:to-[#eb459e] text-[#eb459e] hover:text-white flex items-center justify-center transition-all duration-200"
          >
            <Sparkles className="w-5 h-5" />
          </button>
          <div className="absolute left-[80px] px-3 py-1.5 bg-[#111214] text-[#dbdee1] text-xs font-semibold rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Discord Nitro Perks
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-[#111214]" />
          </div>
        </div>
      </div>
    </aside>
  );
};
