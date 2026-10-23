import React from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';

interface PdfViewerModalProps {
  pdfUrl: string;
  fileName: string;
  fileSize: string;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  pdfUrl,
  fileName,
  fileSize,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-4xl h-[85vh] bg-[#313338] rounded-2xl shadow-2xl border border-[#232428] flex flex-col overflow-hidden text-[#dbdee1] discord-pop">
        {/* Header */}
        <div className="h-14 px-5 bg-[#2b2d31] border-b border-[#232428] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-[#f23f43]/15 text-[#f23f43]">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm truncate">{fileName}</h3>
              <p className="text-xs text-[#949ba4]">{fileSize}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              download={fileName}
              className="px-3 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-[#949ba4] hover:text-white rounded-md hover:bg-[#35373c] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Frame */}
        <div className="flex-1 bg-[#1e1f22] p-2 flex flex-col items-center justify-center relative">
          <iframe
            src={pdfUrl}
            title={fileName}
            className="w-full h-full rounded-lg border border-[#2b2d31] bg-white"
          />
        </div>
      </div>
    </div>
  );
};
