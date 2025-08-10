import React, { useEffect } from 'react';
import ItemCard from './ItemCard';
import type { CatalogItem } from '../types/catalog';

interface EditorPanelProps {
  items: CatalogItem[];
  activeItemId: number | null;
  onSelectItem: (id: number) => void;
  onSaveItem: (id: number, patch: Partial<CatalogItem>) => Promise<void>;
  onVerifyItem: (id: number) => Promise<void>;
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  items,
  activeItemId,
  onSelectItem,
  onSaveItem,
  onVerifyItem
}) => {
  const sortedItems = [...items].sort((a, b) => {
    // Unverified first, then by confidence ascending
    if (a.status !== 'verified' && b.status === 'verified') return -1;
    if (a.status === 'verified' && b.status !== 'verified') return 1;
    return a.confidence - b.confidence;
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = sortedItems.findIndex(item => item.id === activeItemId);
        
        if (e.key === 'ArrowUp' && currentIndex > 0) {
          onSelectItem(sortedItems[currentIndex - 1].id);
        } else if (e.key === 'ArrowDown' && currentIndex < sortedItems.length - 1) {
          onSelectItem(sortedItems[currentIndex + 1].id);
        } else if (currentIndex === -1 && sortedItems.length > 0) {
          // No item selected, select first
          onSelectItem(sortedItems[0].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItemId, sortedItems, onSelectItem]);

  return (
    <div className="bg-white rounded-lg border shadow-sm h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Item Editor</h3>
        <p className="text-sm text-gray-600">
          {items.length} items • Click items in the image to edit • Use ↑↓ arrow keys to navigate
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sortedItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500">No items match the current filter</p>
            <p className="text-sm text-gray-400 mt-1">
              Adjust the filter or load a catalog page to start annotating
            </p>
          </div>
        ) : (
          sortedItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onSave={(patch) => onSaveItem(item.id, patch)}
              onVerify={() => onVerifyItem(item.id)}
              onFocus={() => onSelectItem(item.id)}
              isActive={activeItemId === item.id}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default EditorPanel;
