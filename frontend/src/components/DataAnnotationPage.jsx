import React, { useState, useEffect, useMemo } from 'react';
import { listPage, updateItem, createItem, exportCatalog, detectItemsInImage, storeMenuData } from '../lib/api';

// ItemCard component for editing individual menu items
const ItemCard = ({ item, onSave, onVerify }) => {
  // Start in edit mode for new manual items (those with manual_ prefix)
  const [isEditing, setIsEditing] = useState(item.id.toString().startsWith('manual_'));
  const [editedItem, setEditedItem] = useState({ ...item });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(item.id, editedItem);
      setIsEditing(false);
    } catch (err) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedItem({ ...item });
    setIsEditing(false);
  };

  const handleVerify = async () => {
    try {
      await onVerify(item.id);
    } catch (err) {
      alert(`Failed to verify: ${err.message}`);
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            item.status === 'verified' ? 'bg-green-100 text-green-800' :
            item.status === 'edited' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {item.status}
          </span>
          {item.id.toString().startsWith('manual_') && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
              Manual
            </span>
          )}
          <span className="text-xs text-gray-500">
            {item.section}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!isEditing && item.status !== 'verified' && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Edit
            </button>
          )}
          {!isEditing && item.status !== 'verified' && (
            <button
              onClick={handleVerify}
              className="text-green-600 hover:text-green-700 text-sm font-medium ml-2"
            >
              Verify
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={editedItem.name}
              onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={editedItem.description}
              onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                  {editedItem.price?.currency || 'MYR'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={editedItem.price?.value || ''}
                  onChange={(e) => setEditedItem({ 
                    ...editedItem, 
                    price: { 
                      ...editedItem.price, 
                      value: parseFloat(e.target.value) || null 
                    }
                  })}
                  className="flex-1 border border-gray-300 rounded-r-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <div className="flex">
                <input
                  type="text"
                  value={editedItem.size?.value || ''}
                  onChange={(e) => setEditedItem({ 
                    ...editedItem, 
                    size: { 
                      ...editedItem.size, 
                      value: e.target.value 
                    }
                  })}
                  className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={editedItem.size?.unit || ''}
                  onChange={(e) => setEditedItem({ 
                    ...editedItem, 
                    size: { 
                      ...editedItem.size, 
                      unit: e.target.value 
                    }
                  })}
                  placeholder="unit"
                  className="w-16 border border-l-0 border-gray-300 rounded-r-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              type="text"
              value={editedItem.tags?.join(', ') || ''}
              onChange={(e) => setEditedItem({ 
                ...editedItem, 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
              })}
              placeholder="Enter tags separated by commas"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Context</label>
            <textarea
              value={editedItem.additionalContext || ''}
              onChange={(e) => setEditedItem({ ...editedItem, additionalContext: e.target.value })}
              rows={2}
              placeholder="Add any additional context or notes about this item..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">{item.name}</h4>
          {item.description && (
            <p className="text-sm text-gray-600">{item.description}</p>
          )}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {item.price?.value && (
                <span className="font-medium text-green-600">
                  {item.price.currency} {item.price.value.toFixed(2)}
                </span>
              )}
              {item.size?.value && (
                <span className="text-gray-500">
                  {item.size.value} {item.size.unit}
                </span>
              )}
            </div>
          </div>
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {item.additionalContext && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
              <span className="font-medium text-blue-800">Context: </span>
              <span className="text-blue-700">{item.additionalContext}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DataAnnotationPage = () => {
  const [sourceId, setSourceId] = useState('demo');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [processingUpload, setProcessingUpload] = useState(false);
  const [activeTab, setActiveTab] = useState('response');
  const [isExporting, setIsExporting] = useState(false);
  const [isPassingToAgent, setIsPassingToAgent] = useState(false);

  // Load page data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const pageData = await listPage(sourceId, page);
        setData(pageData);
        // Reset active item when page changes
        setActiveItemId(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sourceId, page]);

  // Handlers
  const handleSelectItem = (id) => {
    setActiveItemId(id);
  };

  const handleSaveItem = async (id, patch) => {
    try {
      let updatedItem;
      
      // Check if this is a new manual item (temporary ID)
      if (id.toString().startsWith('manual_')) {
        // Create new item in backend
        updatedItem = await createItem(sourceId, page, patch);
        
        // Update local state - replace the temporary item with the real one
        setData(prevData => ({
          ...prevData,
          items: prevData.items.map(item => 
            item.id === id 
              ? { ...updatedItem, status: 'edited' }
              : item
          )
        }));
      } else {
        // Update existing item
        updatedItem = await updateItem(id, patch);
        
        // Update local state
        setData(prevData => ({
          ...prevData,
          items: prevData.items.map(item => 
            item.id === id 
              ? { ...updatedItem, status: updatedItem.status === 'verified' ? 'verified' : 'edited' }
              : item
          )
        }));
      }
    } catch (err) {
      throw new Error(`Failed to save item: ${err.message}`);
    }
  };

  const handleVerifyItem = async (id) => {
    try {
      await updateItem(id, { status: 'verified' });
      
      // Update local state
      setData(prevData => ({
        ...prevData,
        items: prevData.items.map(item => 
          item.id === id ? { ...item, status: 'verified' } : item
        )
      }));
    } catch (err) {
      throw new Error(`Failed to verify item: ${err.message}`);
    }
  };

  // Add new manual item
  const handleAddNewItem = () => {
    const newItem = {
      id: `manual_${Date.now()}`, // Temporary ID for new items
      name: '',
      brand: '',
      price: { value: null, currency: 'MYR' },
      size: { value: '', unit: '' },
      tags: [],
      section: 'Manual Entry',
      status: 'edited',
      confidence: 1.0,
      bbox_x: 0,
      bbox_y: 0,
      bbox_w: 100,
      bbox_h: 50,
      raw_text: 'Manually added item',
      additionalContext: ''
    };

    // Add the new item to the local state
    setData(prevData => ({
      ...prevData,
      items: [...(prevData?.items || []), newItem]
    }));

    // Scroll to the new item and start editing it
    setTimeout(() => {
      const element = document.getElementById(`item_${newItem.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // File upload handler with AI vision processing
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setProcessingUpload(true);
      setError(null);
      
      try {
        // Read file for display
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedImage(e.target.result);
        };
        reader.readAsDataURL(file);
        
        // Store the actual file for API call
        setUploadedFile(file);
        setShowUpload(false);
        
        // Call GPT-4o Vision API to detect items
        console.log('Detecting items with GPT-4o Vision...');
        const visionResult = await detectItemsInImage(file);
        console.log('Vision API result:', visionResult);
        
        // Parse JSON response to extract menu items
        let menuItems = [];
        let parsedMenu = null;
        let parseError = null;
        
        try {
          // Try to parse the raw_response as JSON
          if (visionResult.raw_response && visionResult.raw_response !== visionResult.description) {
            parsedMenu = JSON.parse(visionResult.raw_response);
            
            // Extract items from the parsed menu structure
            if (parsedMenu.sections && Array.isArray(parsedMenu.sections)) {
              let itemId = 1;
              parsedMenu.sections.forEach(section => {
                if (section.items && Array.isArray(section.items)) {
                  section.items.forEach(item => {
                    menuItems.push({
                      id: `item_${itemId++}`,
                      name: item.name || 'Unnamed Item',
                      description: item.desc || '',
                      price: {
                        value: item.price?.value || null,
                        currency: item.price?.currency || 'MYR'
                      },
                      size: {
                        value: item.size?.value || null,
                        unit: item.size?.unit || ''
                      },
                      tags: item.tags || [],
                      section: section.name || 'General',
                      status: 'detected',
                      confidence: 0.8,
                      additionalContext: ''
                    });
                  });
                }
              });
            }
          }
        } catch (e) {
          parseError = e.message;
          console.warn('Failed to parse JSON response:', e);
        }
        
        // Create data structure to display the AI response and items
        const transformedData = {
          source_id: 'uploaded',
          page: 1,
          page_width: 800,
          page_height: 600,
          ai_response: visionResult.description || visionResult.raw_response || "No response received",
          raw_response: visionResult.raw_response || JSON.stringify(visionResult),
          status: visionResult.status || "unknown",
          parsed_menu: parsedMenu,
          parse_error: parseError,
          items: menuItems
        };
        
        setData(transformedData);
        setActiveItemId(null);
        
      } catch (err) {
        console.error('Vision processing failed:', err);
        setError(`AI vision processing failed: ${err.message}`);
        
        // Fallback to basic uploaded image without AI detection
        setData({
          source_id: 'uploaded',
          page: 1,
          page_width: 800,
          page_height: 600,
          ai_response: `Error: ${err.message}`,
          raw_response: `Error occurred: ${err.message}`,
          status: "error",
          items: []
        });
      } finally {
        setProcessingUpload(false);
      }
    } else {
      alert('Please select a valid image file.');
    }
  };

  // Export detected items as JSON
  const handleExportJSON = () => {
    if (!data?.items || data.items.length === 0) {
      alert('No data to export');
      return;
    }
    
    setIsExporting(true);
    
    try {
      const exportData = {
        source: "AI Vision Analysis",
        timestamp: new Date().toISOString(),
        image_source: uploadedImage ? 'uploaded' : 'demo',
        ai_status: data.status,
        total_items: data.items.length,
        items: data.items,
        parsed_menu: data.parsed_menu,
        meta: {
          extraction_method: "GPT-4o Vision",
          schema_version: "canta.menu.v1",
          export_version: "1.0"
        }
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `menu-data-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Pass data to AI agent
  const handlePassToAgent = async () => {
    if (!data?.items || data.items.length === 0) {
      alert('No data to pass to agent');
      return;
    }
    
    setIsPassingToAgent(true);
    
    try {
      // Get current session from localStorage
      const currentSession = localStorage.getItem('currentChatSession');
      let sessionData = null;
      
      if (currentSession) {
        sessionData = JSON.parse(currentSession);
      }
      
      // If no session exists, generate a temporary session ID for menu storage
      const sessionId = sessionData?.session_id || `temp_${Date.now()}`;
      
      // Store menu data in the database for the agent to access
      await storeMenuData(sessionId, sourceId, page, {
        items: data.items,
        timestamp: new Date().toISOString(),
        source: 'vision_analysis'
      });
      
      // Also keep localStorage for backward compatibility
      localStorage.setItem('agentData', JSON.stringify({
        items: data.items,
        timestamp: new Date().toISOString(),
        source: 'vision_analysis'
      }));
      
      setIsPassingToAgent(false);
      alert(`Successfully passed ${data.items.length} items to the AI agent! The agent now has access to the menu data and can answer questions about the items using intelligent function calling.`);
      
    } catch (error) {
      console.error('Error passing data to agent:', error);
      setIsPassingToAgent(false);
      alert(`Failed to pass data to agent: ${error.message}`);
    }
  };

  // Reset to demo data
  const handleUseDemoData = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    setShowUpload(false);
    setProcessingUpload(false);
    // Trigger reload of demo data
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const pageData = await listPage(sourceId, page);
        setData(pageData);
        setActiveItemId(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Upload Section */}
      <div className="mt-4 mb-4">
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Image Source</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {uploadedImage ? 'AI-Analyzed Image' : 'Demo Image (image2.png)'}
                </span>
                {uploadedImage && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    AI-Processed
                  </span>
                )}
                {processingUpload && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Processing with AI...
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUpload(!showUpload)}
                disabled={processingUpload}
                className="bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {processingUpload ? 'Processing...' : 'Upload New Image'}
              </button>
              {uploadedImage && (
                <button
                  onClick={handleUseDemoData}
                  className="bg-slate-100 text-slate-900 hover:bg-slate-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Use Demo Data
                </button>
              )}
            </div>
          </div>
          
          {/* Upload Area */}
          {showUpload && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Click to upload an image</p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Note: Uploaded images will be automatically analyzed using GPT-4o Vision AI to detect and identify products.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <div>
          {/* Image Display */}
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <h3 className="text-lg font-semibold mb-4">Uploaded Image</h3>
            <div className="border rounded-lg overflow-hidden">
              <img 
                src={uploadedImage || "/image2.png"} 
                alt="Uploaded content"
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>
          </div>
        </div>
        
        <div>
          {/* AI Response & Data Cards - Tabbed Interface */}
          <div className="bg-white rounded-lg border shadow-sm p-4 h-fit max-h-[80vh] overflow-hidden">
            {data?.ai_response ? (
              <>
                {/* Tab Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setActiveTab('response')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'response'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      AI Response
                    </button>
                    <button
                      onClick={() => setActiveTab('data')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'data'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Data Cards ({data?.items?.length || 0})
                    </button>
                  </div>
                  
                  {/* Action Buttons */}
                  {data?.items && data.items.length > 0 && (
                    <div className="flex space-x-3">
                      <button
                        onClick={handlePassToAgent}
                        disabled={isPassingToAgent}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                      >
                        {isPassingToAgent ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Passing to Agent...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>Pass to Agent</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={handleExportJSON}
                        disabled={isExporting}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                      >
                        {isExporting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Exporting...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Export JSON</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Tab Content */}
                <div className="overflow-y-auto max-h-[60vh]">
                  {activeTab === 'response' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          data.status === 'success' ? 'bg-green-100 text-green-800' :
                          data.status === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {data.status}
                        </span>
                        {uploadedImage && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            GPT-4o Vision
                          </span>
                        )}
                        {data?.items?.length > 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            {data.items.length} items detected
                          </span>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">What the AI sees:</h4>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {data.ai_response}
                        </p>
                      </div>
                      
                      {/* Parse Error Display */}
                      {data.parse_error && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <h4 className="font-medium text-yellow-800 mb-1">JSON Parse Warning:</h4>
                          <p className="text-yellow-700 text-sm">{data.parse_error}</p>
                        </div>
                      )}
                      
                      {/* Raw Response (collapsible) */}
                      {data.raw_response && data.raw_response !== data.ai_response && (
                        <details className="bg-gray-100 rounded-lg p-4">
                          <summary className="font-medium text-gray-700 cursor-pointer">Raw AI Response (Click to expand)</summary>
                          <pre className="text-xs text-gray-600 mt-2 overflow-x-auto whitespace-pre-wrap">
                            {data.raw_response}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}

                  {activeTab === 'data' && (
                    <div className="space-y-4">
                      {data?.items && data.items.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-gray-900">
                              Detected Menu Items ({data.items.length})
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              {data.parsed_menu?.source && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  {data.parsed_menu.source}
                                </span>
                              )}
                              <span>Scroll to see all items</span>
                            </div>
                          </div>

                          {/* Add New Item Button */}
                          <div className="mb-4">
                            <button
                              onClick={handleAddNewItem}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Add New Item Manually
                            </button>
                            <p className="text-xs text-gray-500 mt-1">
                              Click to add an item that the AI didn't detect
                            </p>
                          </div>
                          
                          <div className="space-y-3">
                            {data.items.map((item) => (
                              <div key={item.id} id={`item_${item.id}`}>
                                <ItemCard
                                  item={item}
                                  onSave={handleSaveItem}
                                  onVerify={handleVerifyItem}
                                />
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <p className="font-medium">No items detected yet</p>
                          <p className="text-sm mb-4">Upload an image to see detected items here</p>
                          
                          {/* Add manual item button for empty state */}
                          <button
                            onClick={handleAddNewItem}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Item Manually
                          </button>
                          <p className="text-xs text-gray-400 mt-2">
                            Or start adding menu items manually
                          </p>
                        </div>
                      )}
                      
                      {/* Show message when JSON parsed but no items found */}
                      {data?.parsed_menu && (!data?.items || data.items.length === 0) && !data.parse_error && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="font-semibold text-yellow-800 mb-2">Menu Parsed Successfully</h4>
                          <p className="text-yellow-700">
                            The AI response was parsed as JSON, but no menu items were found in the expected structure.
                            The response might be in a different format than expected.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-gray-500 text-center py-8">
                <h3 className="text-lg font-semibold mb-4">AI Vision Response</h3>
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Upload an image to see what the AI can detect</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataAnnotationPage;
