import React, { useState, useEffect } from 'react';
import type { CatalogItem } from '../types/catalog';

interface ItemCardProps {
  item: CatalogItem;
  onSave: (patch: Partial<CatalogItem>) => Promise<void>;
  onVerify: () => Promise<void>;
  onFocus?: () => void;
  isActive?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onSave, onVerify, onFocus, isActive = false }) => {
  const [editedItem, setEditedItem] = useState<CatalogItem>(item);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditedItem(item);
    setHasChanges(false);
  }, [item]);

  const handleFieldChange = (field: string, value: any) => {
    setEditedItem(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        const parentObj = prev[parent as keyof CatalogItem] as any;
        return {
          ...prev,
          [parent]: {
            ...parentObj,
            [child]: value
          }
        };
      }
      return { ...prev, [field]: value };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    
    setIsSaving(true);
    try {
      const patch: Partial<CatalogItem> = {
        name: editedItem.name,
        brand: editedItem.brand,
        variants: editedItem.variants,
        price: editedItem.price,
        size: editedItem.size,
        barcode: editedItem.barcode,
        tags: editedItem.tags,
      };
      
      await onSave(patch);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('Failed to save item. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUndo = () => {
    setEditedItem(item);
    setHasChanges(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ai': return 'bg-gray-100 text-gray-700';
      case 'edited': return 'bg-amber-100 text-amber-800';
      case 'verified': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const parseCommaSeparated = (value: string): string[] => {
    return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
  };

  const joinCommaSeparated = (array: string[] | null): string => {
    return array ? array.join(', ') : '';
  };

  const handleVerify = async () => {
    try {
      await onVerify();
    } catch (error) {
      console.error('Failed to verify item:', error);
      alert('Failed to verify item. Please try again.');
    }
  };

  return (
    <div
      className={`rounded-lg border bg-white shadow-sm p-3 cursor-pointer transition-all duration-200 ${
        isActive ? 'ring-2 ring-indigo-500 border-indigo-300' : 'hover:shadow-md'
      }`}
      onClick={onFocus}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
            {item.status.toUpperCase()}
          </span>
          <span className="text-xs text-gray-500">
            {Math.round(item.confidence * 100)}% confidence
          </span>
        </div>
        <div className="text-xs text-gray-400">
          ID: {item.id}
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-2">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Product Name</label>
          <input
            type="text"
            value={editedItem.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value || null)}
            placeholder="Enter product name"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Brand */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
          <input
            type="text"
            value={editedItem.brand || ''}
            onChange={(e) => handleFieldChange('brand', e.target.value || null)}
            placeholder="Enter brand"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Price and Size */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Price ({editedItem.price.currency})</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={editedItem.price.value || ''}
              onChange={(e) => handleFieldChange('price.value', parseFloat(e.target.value) || null)}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
            <div className="flex gap-1">
              <input
                type="number"
                step="0.01"
                min="0"
                value={editedItem.size.value || ''}
                onChange={(e) => handleFieldChange('size.value', parseFloat(e.target.value) || null)}
                placeholder="0"
                className="flex-1 border border-gray-300 rounded-md px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <select
                value={editedItem.size.unit || ''}
                onChange={(e) => handleFieldChange('size.unit', e.target.value || null)}
                className="border border-gray-300 rounded-md px-2 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Unit</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
                <option value="pcs">pcs</option>
                <option value="pack">pack</option>
              </select>
            </div>
          </div>
        </div>

        {/* Variants */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Variants (comma-separated)</label>
          <input
            type="text"
            value={joinCommaSeparated(editedItem.variants)}
            onChange={(e) => handleFieldChange('variants', e.target.value ? parseCommaSeparated(e.target.value) : null)}
            placeholder="Small, Medium, Large"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
          <input
            type="text"
            value={joinCommaSeparated(editedItem.tags)}
            onChange={(e) => handleFieldChange('tags', e.target.value ? parseCommaSeparated(e.target.value) : null)}
            placeholder="organic, premium, new"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Barcode */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Barcode</label>
          <input
            type="text"
            value={editedItem.barcode || ''}
            onChange={(e) => handleFieldChange('barcode', e.target.value || null)}
            placeholder="Enter barcode"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            disabled={!hasChanges || isSaving}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              hasChanges && !isSaving
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleVerify();
            }}
            disabled={item.status === 'verified'}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              item.status !== 'verified'
                ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Mark Verified
          </button>
          {hasChanges && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUndo();
              }}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
            >
              Undo
            </button>
          )}
        </div>
      </div>

      {/* Raw text preview */}
      {editedItem.raw_text && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <label className="block text-xs font-medium text-gray-700 mb-1">Raw OCR Text</label>
          <div className="text-xs text-gray-600 bg-gray-50 rounded p-2 max-h-16 overflow-y-auto">
            {editedItem.raw_text}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemCard;
