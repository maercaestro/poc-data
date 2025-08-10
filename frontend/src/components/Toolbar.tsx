import React from 'react';

const Toolbar = ({
  sourceId,
  page,
  filter,
  onChangeSourceId,
  onChangePage,
  onFilterChange,
  onExport,
  onBulkVerify,
  canExport,
  filteredItems
}) => {
  const needsReviewCount = filteredItems.filter(item => 
    item.status !== 'verified' || item.confidence < 0.75
  ).length;

  const handleBulkVerify = () => {
    const unverifiedIds = filteredItems
      .filter(item => item.status !== 'verified')
      .map(item => item.id);
    
    if (unverifiedIds.length > 0) {
      onBulkVerify(unverifiedIds);
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Source and Page inputs */}
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source ID
            </label>
            <input
              type="text"
              value={sourceId}
              onChange={(e) => onChangeSourceId(e.target.value)}
              placeholder="Enter source ID"
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page
            </label>
            <input
              type="number"
              value={page}
              onChange={(e) => onChangePage(parseInt(e.target.value) || 1)}
              min="1"
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-20 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Middle: Filter tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => onFilterChange('needs')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'needs'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Needs Review
            <span className="ml-2 bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {needsReviewCount}
            </span>
          </button>
          <button
            onClick={() => onFilterChange('edited')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'edited'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Edited
          </button>
          <button
            onClick={() => onFilterChange('verified')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'verified'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Verified
          </button>
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleBulkVerify}
            className="bg-slate-100 text-slate-900 hover:bg-slate-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Bulk Verify
          </button>
          <button
            onClick={onExport}
            disabled={!canExport}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              canExport
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
