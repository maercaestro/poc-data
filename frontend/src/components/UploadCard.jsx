function UploadCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-8">
      <div className="flex items-center space-x-3 mb-8">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#192A56' }}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold" style={{ color: '#192A56' }}>Upload Product Images</h2>
          <p className="text-sm text-gray-500">Upload product images for AI vision analysis and annotation</p>
        </div>
      </div>
      
      {/* Product Images Upload Section */}
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#247BA0' }}
            >
              <span className="text-white text-xs font-bold">1</span>
            </div>
            <h3 className="text-lg font-medium" style={{ color: '#192A56' }}>Product Images</h3>
          </div>
          <div className="group border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-300 hover:bg-gray-50/50 transition-all duration-200 cursor-pointer">
            <div className="space-y-4">
              <div 
                className="mx-auto w-12 h-12 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors"
                style={{ backgroundColor: '#50A6D1' }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium" style={{ color: '#192A56' }}>Drop your product images here</p>
                <p className="text-sm text-gray-400 mt-1">or click to browse</p>
              </div>
              <div className="flex justify-center space-x-4 text-xs text-gray-400">
                <span className="bg-gray-100 px-2 py-1 rounded">JPG</span>
                <span className="bg-gray-100 px-2 py-1 rounded">PNG</span>
                <span className="bg-gray-100 px-2 py-1 rounded">WEBP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Upload Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#247BA0' }}
            >
              <span className="text-white text-xs font-bold">2</span>
            </div>
            <h3 className="text-lg font-medium" style={{ color: '#192A56' }}>Catalog Pages</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Optional</span>
          </div>
          <div className="group border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-300 hover:bg-gray-50/50 transition-all duration-200 cursor-pointer">
            <div className="space-y-4">
              <div 
                className="mx-auto w-12 h-12 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors"
                style={{ backgroundColor: '#50A6D1' }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium" style={{ color: '#192A56' }}>Drop catalog pages here</p>
                <p className="text-sm text-gray-400 mt-1">Multi-product catalog images or PDFs</p>
              </div>
              <div className="flex justify-center space-x-4 text-xs text-gray-400">
                <span className="bg-gray-100 px-2 py-1 rounded">PDF</span>
                <span className="bg-gray-100 px-2 py-1 rounded">Images</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Status */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <h4 className="text-sm font-semibold mb-4" style={{ color: '#192A56' }}>Upload Status</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: '#192A56' }}>Product Images</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span className="text-xs text-gray-400">No images uploaded</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: '#192A56' }}>Catalog Pages</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span className="text-xs text-gray-400">Optional</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadCard;
