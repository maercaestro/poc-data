from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import logging
from datetime import datetime
import os
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables from backend/env/.env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), 'env', '.env'))
# Also try loading from the current directory
load_dotenv()
logger.info("Environment variables loaded from .env files")

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:5174"])  # Enable CORS for frontend
logger.info("Flask app initialized with CORS enabled")

# Database setup
DATABASE = 'catalog.db'

def init_db():
    """Initialize the database with required tables"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Create catalog_pages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS catalog_pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id TEXT NOT NULL,
            page INTEGER NOT NULL,
            page_width INTEGER NOT NULL,
            page_height INTEGER NOT NULL,
            UNIQUE(source_id, page)
        )
    ''')
    
    # Create catalog_items table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS catalog_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            page_id INTEGER NOT NULL,
            bbox_x INTEGER NOT NULL,
            bbox_y INTEGER NOT NULL,
            bbox_w INTEGER NOT NULL,
            bbox_h INTEGER NOT NULL,
            name TEXT,
            brand TEXT,
            variants_json TEXT,
            price_value REAL,
            price_currency TEXT DEFAULT 'MYR',
            size_value REAL,
            size_unit TEXT,
            barcode TEXT,
            tags_json TEXT,
            raw_text TEXT,
            confidence REAL NOT NULL,
            status TEXT DEFAULT 'ai' CHECK (status IN ('ai', 'edited', 'verified')),
            FOREIGN KEY (page_id) REFERENCES catalog_pages (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/catalog/<source_id>/page/<int:page>', methods=['GET'])
def get_catalog_page(source_id, page):
    """Get catalog page with all items"""
    conn = get_db_connection()
    
    # Get page info
    page_row = conn.execute('''
        SELECT * FROM catalog_pages 
        WHERE source_id = ? AND page = ?
    ''', (source_id, page)).fetchone()
    
    if not page_row:
        # For demo source, return minimal fallback data
        if source_id == 'demo':
            return jsonify({
                "source_id": source_id,
                "page": page,
                "page_width": 800,
                "page_height": 1200,
                "items": [
                    {
                        "id": 1,
                        "bbox": [100, 150, 200, 120],
                        "name": "Sample Product",
                        "brand": "Demo Brand",
                        "variants": ["Variant 1"],
                        "price": {"value": 24.99, "currency": "MYR"},
                        "size": {"value": 500, "unit": "g"},
                        "barcode": "1234567890123",
                        "tags": ["demo"],
                        "raw_text": "Demo Brand Sample Product 500g RM24.99",
                        "confidence": 0.95,
                        "status": "demo"
                    }
                ]
            })
        else:
            # Return empty page for unknown sources
            return jsonify({
                "source_id": source_id,
                "page": page,
                "page_width": 800,
                "page_height": 1200,
                "items": []
            })
    
    # Get catalog items
    items = conn.execute('''
        SELECT * FROM catalog_items 
        WHERE page_id = ?
        ORDER BY confidence ASC
    ''', (page_row['id'],)).fetchall()
    
    # Format response
    response = {
        "source_id": page_row['source_id'],
        "page": page_row['page'],
        "page_width": page_row['page_width'],
        "page_height": page_row['page_height'],
        "items": []
    }
    
    for item in items:
        response['items'].append({
            "id": item['id'],
            "bbox": [item['bbox_x'], item['bbox_y'], item['bbox_w'], item['bbox_h']],
            "name": item['name'],
            "brand": item['brand'],
            "variants": json.loads(item['variants_json']) if item['variants_json'] else None,
            "price": {
                "value": item['price_value'],
                "currency": item['price_currency']
            },
            "size": {
                "value": item['size_value'],
                "unit": item['size_unit']
            },
            "barcode": item['barcode'],
            "tags": json.loads(item['tags_json']) if item['tags_json'] else None,
            "raw_text": item['raw_text'],
            "confidence": item['confidence'],
            "status": item['status']
        })
    
    conn.close()
    return jsonify(response)

@app.route('/api/item/<int:item_id>', methods=['PATCH'])
def update_item(item_id):
    """Update catalog item"""
    data = request.get_json()
    conn = get_db_connection()
    
    # Build update query dynamically
    update_fields = []
    values = []
    
    if 'name' in data:
        update_fields.append('name = ?')
        values.append(data['name'])
    
    if 'brand' in data:
        update_fields.append('brand = ?')
        values.append(data['brand'])
    
    if 'variants' in data:
        update_fields.append('variants_json = ?')
        values.append(json.dumps(data['variants']) if data['variants'] else None)
    
    if 'price' in data:
        if 'value' in data['price']:
            update_fields.append('price_value = ?')
            values.append(data['price']['value'])
        if 'currency' in data['price']:
            update_fields.append('price_currency = ?')
            values.append(data['price']['currency'])
    
    if 'size' in data:
        if 'value' in data['size']:
            update_fields.append('size_value = ?')
            values.append(data['size']['value'])
        if 'unit' in data['size']:
            update_fields.append('size_unit = ?')
            values.append(data['size']['unit'])
    
    if 'barcode' in data:
        update_fields.append('barcode = ?')
        values.append(data['barcode'])
    
    if 'tags' in data:
        update_fields.append('tags_json = ?')
        values.append(json.dumps(data['tags']) if data['tags'] else None)
    
    if 'status' in data:
        update_fields.append('status = ?')
        values.append(data['status'])
    
    if update_fields:
        values.append(item_id)
        
        query = f'''
            UPDATE catalog_items 
            SET {', '.join(update_fields)}
            WHERE id = ?
        '''
        
        conn.execute(query, values)
        conn.commit()
    
    # Return updated item
    item = conn.execute('''
        SELECT * FROM catalog_items WHERE id = ?
    ''', (item_id,)).fetchone()
    
    if item:
        response = {
            "id": item['id'],
            "bbox": [item['bbox_x'], item['bbox_y'], item['bbox_w'], item['bbox_h']],
            "name": item['name'],
            "brand": item['brand'],
            "variants": json.loads(item['variants_json']) if item['variants_json'] else None,
            "price": {
                "value": item['price_value'],
                "currency": item['price_currency']
            },
            "size": {
                "value": item['size_value'],
                "unit": item['size_unit']
            },
            "barcode": item['barcode'],
            "tags": json.loads(item['tags_json']) if item['tags_json'] else None,
            "raw_text": item['raw_text'],
            "confidence": item['confidence'],
            "status": item['status']
        }
        conn.close()
        return jsonify(response)
    
    conn.close()
    return jsonify({"error": "Item not found"}), 404

@app.route('/api/export/<source_id>', methods=['POST'])
def export_catalog(source_id):
    """Export catalog data as JSON"""
    conn = get_db_connection()
    
    # Get all pages for this source
    pages = conn.execute('''
        SELECT * FROM catalog_pages WHERE source_id = ? ORDER BY page
    ''', (source_id,)).fetchall()
    
    export_data = {
        "source_id": source_id,
        "exported_at": datetime.now().isoformat(),
        "pages": []
    }
    
    for page_row in pages:
        items = conn.execute('''
            SELECT * FROM catalog_items WHERE page_id = ?
        ''', (page_row['id'],)).fetchall()
        
        page_data = {
            "page": page_row['page'],
            "page_width": page_row['page_width'],
            "page_height": page_row['page_height'],
            "items": []
        }
        
        for item in items:
            page_data['items'].append({
                "id": item['id'],
                "bbox": [item['bbox_x'], item['bbox_y'], item['bbox_w'], item['bbox_h']],
                "name": item['name'],
                "brand": item['brand'],
                "variants": json.loads(item['variants_json']) if item['variants_json'] else None,
                "price": {
                    "value": item['price_value'],
                    "currency": item['price_currency']
                },
                "size": {
                    "value": item['size_value'],
                    "unit": item['size_unit']
                },
                "barcode": item['barcode'],
                "tags": json.loads(item['tags_json']) if item['tags_json'] else None,
                "raw_text": item['raw_text'],
                "confidence": item['confidence'],
                "status": item['status']
            })
        
        export_data['pages'].append(page_data)
    
    conn.close()
    return jsonify(export_data)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

# Vision API endpoints
@app.route('/api/vision/detect-items', methods=['POST'])
def detect_items():
    """Detect all items in an image using GPT-4 Vision."""
    logger.info("=== /api/vision/detect-items endpoint called ===")
    
    try:
        # Check if file is present
        logger.info("Step 1: Validating file upload...")
        if 'file' not in request.files:
            logger.error("No file provided in request")
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            logger.error("No file selected")
            return jsonify({"error": "No file selected"}), 400
        
        logger.info(f"File received: {file.filename}, content type: {file.content_type}")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            logger.error(f"Invalid file type: {file.content_type}")
            return jsonify({"error": "File must be an image"}), 400
        
        # Check if OpenAI API key is set
        logger.info("Step 2: Checking OpenAI API key...")
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key or api_key == 'sk-REPLACE_ME':
            logger.error("OpenAI API key not configured")
            return jsonify({"error": "OpenAI API key not configured"}), 500
        
        logger.info(f"API key found: {api_key[:10]}...{api_key[-4:]}")
        
        # Import vision service
        logger.info("Step 3: Importing vision service...")
        from services.vision.gpt4o import detect_boxes
        
        # Read file content
        logger.info("Step 4: Reading file content...")
        file_bytes = file.read()
        mime_type = file.content_type
        logger.info(f"File read: {len(file_bytes)} bytes")
        
        # Call vision service
        logger.info("Step 5: Calling vision service...")
        result_json = detect_boxes(file_bytes, mime_type)
        logger.info("Step 6: Parsing vision service result...")
        result = json.loads(result_json)
        
        logger.info(f"Vision service completed successfully. Result: {json.dumps(result, indent=2)}")
        logger.info("=== /api/vision/detect-items endpoint completed successfully ===")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"=== /api/vision/detect-items endpoint failed ===")
        logger.error(f"Error: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        return jsonify({"error": f"Vision processing failed: {str(e)}"}), 500

@app.route('/api/vision/extract-item', methods=['POST'])
def extract_item():
    """Extract structured data from a single item image using GPT-4 Vision."""
    logger.info("=== /api/vision/extract-item endpoint called ===")
    
    try:
        # Check if file is present
        logger.info("Step 1: Validating file upload...")
        if 'file' not in request.files:
            logger.error("No file provided in request")
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            logger.error("No file selected")
            return jsonify({"error": "No file selected"}), 400
        
        logger.info(f"File received: {file.filename}, content type: {file.content_type}")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            logger.error(f"Invalid file type: {file.content_type}")
            return jsonify({"error": "File must be an image"}), 400
        
        # Check if OpenAI API key is set
        logger.info("Step 2: Checking OpenAI API key...")
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key or api_key == 'sk-REPLACE_ME':
            logger.error("OpenAI API key not configured")
            return jsonify({"error": "OpenAI API key not configured"}), 500
        
        logger.info(f"API key found: {api_key[:10]}...{api_key[-4:]}")
        
        # Import vision service
        logger.info("Step 3: Importing vision service...")
        from services.vision.gpt4o import extract_item as extract_item_service
        
        # Read file content
        logger.info("Step 4: Reading file content...")
        file_bytes = file.read()
        mime_type = file.content_type
        logger.info(f"File read: {len(file_bytes)} bytes")
        
        # Call vision service
        logger.info("Step 5: Calling vision service...")
        result_json = extract_item_service(file_bytes, mime_type)
        logger.info("Step 6: Parsing vision service result...")
        result = json.loads(result_json)
        
        logger.info(f"Vision service completed successfully. Result: {json.dumps(result, indent=2)}")
        logger.info("=== /api/vision/extract-item endpoint completed successfully ===")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"=== /api/vision/extract-item endpoint failed ===")
        logger.error(f"Error: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        return jsonify({"error": f"Item extraction failed: {str(e)}"}), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5001)
