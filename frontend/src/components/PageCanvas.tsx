import React, { useState, useEffect, useRef } from 'react';

interface PageCanvasProps {
  imageUrl: string;
  page: any;
  activeItemId: number | null;
  onSelectItem: (id: number) => void;
}

const PageCanvas: React.FC<PageCanvasProps> = ({ imageUrl, page, activeItemId, onSelectItem }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imageLoaded && imgRef.current && page) {
      const img = imgRef.current;
      const scaleX = img.clientWidth / page.page_width;
      const scaleY = img.clientHeight / page.page_height;
      setScale(Math.min(scaleX, scaleY));
    }
  }, [imageLoaded, page]);

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'ai': return 'border-gray-400';
      case 'edited': return 'border-amber-500';
      case 'verified': return 'border-emerald-500';
      default: return 'border-gray-400';
    }
  };

  if (!page) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-8">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p>No page data loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Page Preview</h3>
        <p className="text-sm text-gray-600">
          Page {page.page} • {page.items.length} items detected
        </p>
      </div>
      
      <div className="p-4">
        <div className="relative inline-block max-w-full">
          <img
            ref={imgRef}
            src={imageUrl}
            alt={`Page ${page.page}`}
            className="max-w-full h-auto border border-gray-200 rounded"
            onLoad={() => setImageLoaded(true)}
          />
          
          {imageLoaded && page.items.map((item: any) => {
            const [x, y, w, h] = item.bbox;
            const scaledX = x * scale;
            const scaledY = y * scale;
            const scaledW = w * scale;
            const scaledH = h * scale;
            
            return (
              <div
                key={item.id}
                className={`absolute border-2 cursor-pointer transition-all duration-200 hover:ring-4 hover:ring-blue-200 ${
                  getStatusBorderColor(item.status)
                } ${
                  activeItemId === item.id ? 'ring-4 ring-blue-400' : ''
                }`}
                style={{
                  left: scaledX,
                  top: scaledY,
                  width: scaledW,
                  height: scaledH,
                }}
                onClick={() => onSelectItem(item.id)}
              >
                {/* Confidence badge */}
                <div className="absolute -top-1 -left-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded-br">
                  {Math.round(item.confidence * 100)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PageCanvas;
