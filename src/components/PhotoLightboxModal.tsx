/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ZoomIn } from 'lucide-react';

interface PhotoLightboxModalProps {
  photoUrl: string;
  caption?: string;
  onClose: () => void;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  photoUrl,
  caption,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer"
            aria-label="Close photo preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center overflow-hidden bg-black">
          <img
            src={photoUrl}
            alt={caption || 'Inspection photo'}
            className="max-h-[80vh] w-auto max-w-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        {caption && (
          <div className="bg-slate-900/90 text-white p-3 text-xs font-medium border-t border-slate-800 text-center">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
};
