import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface ImageLightboxModalProps {
  imageUrl: string;
  imageName?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  imageUrl,
  imageName = 'image.png',
  onClose
}) => {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 z-50 select-none discord-pop"
    >
      {/* Top action bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl flex items-center justify-between pb-3 text-xs text-[#dbdee1]"
      >
        <span className="font-semibold truncate max-w-md">{imageName}</span>
        <div className="flex items-center gap-3">
          <a
            href={imageUrl}
            download={imageName}
            className="hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </a>
          <button
            onClick={onClose}
            className="p-1 text-[#949ba4] hover:text-white rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main image */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-4xl max-h-[80vh] overflow-hidden rounded-lg shadow-2xl border border-[#2b2d31] bg-black flex items-center justify-center"
      >
        <img
          src={imageUrl}
          alt={imageName}
          className="max-w-full max-h-[80vh] object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};
