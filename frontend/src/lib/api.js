const API_BASE = 'http://localhost:5001/api';

export async function listPage(sourceId, page) {
  const response = await fetch(`${API_BASE}/catalog/${sourceId}/page/${page}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.statusText}`);
  }
  return response.json();
}

export async function updateItem(id, patch) {
  const response = await fetch(`${API_BASE}/item/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    throw new Error(`Failed to update item: ${response.statusText}`);
  }
  return response.json();
}

export async function exportCatalog(sourceId) {
  const response = await fetch(`${API_BASE}/export/${sourceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to export catalog: ${response.statusText}`);
  }
  return response.json();
}

export async function detectItemsInImage(file) {
  console.log('=== detectItemsInImage API call started ===');
  console.log('File details:', {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  });
  
  const formData = new FormData();
  formData.append('file', file);
  
  console.log('FormData created, making POST request to vision API...');
  
  try {
    const response = await fetch(`${API_BASE}/vision/detect-items`, {
      method: 'POST',
      body: formData,
    });
    
    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`Failed to detect items: ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Vision API result:', JSON.stringify(result, null, 2));
    console.log('=== detectItemsInImage API call completed successfully ===');
    
    return result;
  } catch (error) {
    console.error('=== detectItemsInImage API call failed ===');
    console.error('Error details:', error);
    throw error;
  }
}

export async function extractItemData(file) {
  console.log('=== extractItemData API call started ===');
  console.log('File details:', {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  });
  
  const formData = new FormData();
  formData.append('file', file);
  
  console.log('FormData created, making POST request to extract-item API...');
  
  try {
    const response = await fetch(`${API_BASE}/vision/extract-item`, {
      method: 'POST',
      body: formData,
    });
    
    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`Failed to extract item data: ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Extract API result:', JSON.stringify(result, null, 2));
    console.log('=== extractItemData API call completed successfully ===');
    
    return result;
  } catch (error) {
    console.error('=== extractItemData API call failed ===');
    console.error('Error details:', error);
    throw error;
  }
}
