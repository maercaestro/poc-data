from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import logging
from datetime import datetime
import os
import uuid
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

# OpenAI client setup
from openai import OpenAI

openai_api_key = os.getenv('OPENAI_API_KEY')
if not openai_api_key:
    logger.error("OpenAI API key not found in environment variables")
    exit(1)

client = OpenAI(api_key=openai_api_key)

# OpenAI function definitions for menu access
MENU_FUNCTIONS = [
    {
        "name": "get_menu_items",
        "description": "Search for menu items. Use this to find specific dishes, drinks, or food items from the current menu.",
        "parameters": {
            "type": "object",
            "properties": {
                "search_query": {
                    "type": "string",
                    "description": "Keywords to search for in item names, brands, or descriptions"
                },
                "category": {
                    "type": "string",
                    "description": "Category or section to filter by (e.g., 'appetizers', 'main course', 'drinks')"
                }
            },
            "required": []
        }
    },
    {
        "name": "get_item_details",
        "description": "Get detailed information about a specific menu item including price, description, and tags.",
        "parameters": {
            "type": "object",
            "properties": {
                "item_name": {
                    "type": "string",
                    "description": "The exact name of the menu item to get details for"
                }
            },
            "required": ["item_name"]
        }
    }
]

def call_menu_function(function_name: str, arguments: dict, session_id: str):
    """Execute menu function calls"""
    if function_name == "get_menu_items":
        return get_menu_items(
            session_id, 
            arguments.get("search_query"), 
            arguments.get("category")
        )
    elif function_name == "get_item_details":
        return get_item_details(
            session_id, 
            arguments["item_name"]
        )
    else:
        return {"error": f"Unknown function: {function_name}"}

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
    
    # Create conversations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT UNIQUE NOT NULL,
            user_id TEXT,
            created_at TEXT NOT NULL
        )
    ''')
    
    # Create messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES conversations (session_id)
        )
    ''')
    
    # Create active_menu table for storing current menu data
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS active_menu (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT UNIQUE NOT NULL,
            source_id TEXT NOT NULL,
            page INTEGER NOT NULL,
            menu_data JSON NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# Chat helper functions
def get_or_create_conversation(session_id: str) -> None:
    """Create conversation if it doesn't exist"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR IGNORE INTO conversations (session_id, created_at)
        VALUES (?, ?)
    ''', (session_id, datetime.utcnow().isoformat()))
    
    conn.commit()
    conn.close()

def insert_message(session_id: str, role: str, content: str) -> None:
    """Insert a message into the database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO messages (session_id, role, content, created_at)
        VALUES (?, ?, ?, ?)
    ''', (session_id, role, content, datetime.utcnow().isoformat()))
    
    conn.commit()
    conn.close()

def fetch_messages(session_id: str, limit: int = 50) -> list:
    """Fetch messages for a session ordered by created_at"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT role, content, created_at FROM messages
        WHERE session_id = ?
        ORDER BY created_at ASC
        LIMIT ?
    ''', (session_id, limit))
    
    messages = cursor.fetchall()
    conn.close()
    
    return [(row['role'], row['content'], row['created_at']) for row in messages]

def build_history_for_model(session_id: str, max_messages: int = 30) -> list:
    """Build conversation history for the AI model"""
    messages = fetch_messages(session_id, max_messages)
    
    # Convert to format expected by OpenAI
    history = []
    for role, content, _ in messages:
        history.append({"role": role, "content": content})
    
    return history

# Menu management functions
def store_active_menu(session_id: str, source_id: str, page: int, menu_data: dict) -> None:
    """Store active menu data for a session"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO active_menu (session_id, source_id, page, menu_data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (session_id, source_id, page, json.dumps(menu_data), 
          datetime.utcnow().isoformat(), datetime.utcnow().isoformat()))
    
    conn.commit()
    conn.close()

def get_active_menu(session_id: str) -> dict:
    """Get active menu data for a session"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT menu_data FROM active_menu WHERE session_id = ?
    ''', (session_id,))
    
    result = cursor.fetchone()
    conn.close()
    
    if result:
        return json.loads(result['menu_data'])
    return None

def get_menu_items(session_id: str, search_query: str = None, category: str = None) -> list:
    """Function for AI to search menu items"""
    menu_data = get_active_menu(session_id)
    if not menu_data or 'items' not in menu_data:
        return []
    
    items = menu_data['items']
    
    # Filter by search query if provided
    if search_query:
        search_lower = search_query.lower()
        items = [item for item in items if 
                search_lower in item.get('name', '').lower() or
                search_lower in item.get('brand', '').lower() or
                search_lower in item.get('section', '').lower() or
                any(search_lower in tag.lower() for tag in item.get('tags', []))]
    
    # Filter by category if provided
    if category:
        items = [item for item in items if 
                category.lower() in item.get('section', '').lower()]
    
    return items

def get_item_details(session_id: str, item_name: str) -> dict:
    """Function for AI to get detailed info about a specific item"""
    menu_data = get_active_menu(session_id)
    if not menu_data or 'items' not in menu_data:
        return None
    
    # Find item by name (case insensitive)
    for item in menu_data['items']:
        if item.get('name', '').lower() == item_name.lower():
            return item
    
    return None

def generate_reply(session_id: str, history: list, context_data: dict = None) -> str:
    """Generate AI reply using GPT-4o with function calling for menu access"""
    # Check if OpenAI API key is set
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key or api_key == 'sk-REPLACE_ME':
        return "Sorry, I need to be configured with an API key to respond properly."
    
    try:
        # Enhanced history with menu context if available
        enhanced_history = history.copy()
        
        # Check if we have menu data in session or context
        has_menu_data = bool(get_active_menu(session_id) or (context_data and context_data.get('items')))
        
        # If we have menu context, update the system message with restaurant server personality
        if has_menu_data:
            # Find and replace the system message with restaurant server personality
            for i, msg in enumerate(enhanced_history):
                if msg.get('role') == 'system':
                    enhanced_history[i]['content'] = """You are CANTA Server, a friendly and professional restaurant server/host AI. You work at a restaurant and your job is to help customers discover and order from the menu.

Your personality:
- Warm, welcoming, and enthusiastic about the menu
- Knowledgeable about all menu items, ingredients, and preparations
- Helpful in making recommendations based on customer preferences
- Professional but conversational, like a great restaurant server
- Always eager to suggest the best items and daily specials

Your responsibilities:
- Greet customers warmly and present the menu
- Recommend popular items, chef's specials, and daily highlights
- Help customers choose based on their preferences (dietary restrictions, taste preferences, etc.)
- Describe dishes in appetizing detail
- Suggest complementary items (appetizers, drinks, desserts)
- Answer questions about ingredients, preparation, and allergens
- Take orders and confirm details
- Make the dining experience memorable

You have access to the restaurant's current menu through function calls. Use get_menu_items() to search for items or get_item_details() to get specific information about dishes when customers ask about them.
"""
                    break
        
        # Prepare function calling if menu data is available
        functions = MENU_FUNCTIONS if has_menu_data else None
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=enhanced_history,
            functions=functions,
            function_call="auto" if functions else None,
            max_tokens=1000,
            temperature=0.7
        )
        
        message = response.choices[0].message
        
        # Handle function calls
        if message.function_call:
            function_name = message.function_call.name
            function_args = json.loads(message.function_call.arguments)
            
            # Execute the function
            function_result = call_menu_function(function_name, function_args, session_id)
            
            # Add function call and result to conversation
            enhanced_history.append({
                "role": "assistant",
                "content": None,
                "function_call": {
                    "name": function_name,
                    "arguments": message.function_call.arguments
                }
            })
            enhanced_history.append({
                "role": "function",
                "name": function_name,
                "content": json.dumps(function_result)
            })
            
            # Get final response with function result
            final_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=enhanced_history,
                functions=functions,
                function_call="auto" if functions else None,
                max_tokens=1000,
                temperature=0.7
            )
            
            return final_response.choices[0].message.content
        
        return message.content
        
    except Exception as e:
        logger.error(f"Error generating reply: {str(e)}")
        return f"Sorry, I encountered an error: {str(e)}"

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

@app.route('/api/catalog/<source_id>/page/<int:page>/items', methods=['POST'])
def create_item(source_id, page):
    """Create a new catalog item"""
    data = request.get_json()
    conn = get_db_connection()
    
    try:
        # Get or create page
        page_row = conn.execute('''
            SELECT id FROM catalog_pages 
            WHERE source_id = ? AND page = ?
        ''', (source_id, page)).fetchone()
        
        if not page_row:
            # Create page if it doesn't exist
            conn.execute('''
                INSERT INTO catalog_pages (source_id, page, page_width, page_height)
                VALUES (?, ?, ?, ?)
            ''', (source_id, page, 800, 1200))  # Default dimensions
            
            page_row = conn.execute('''
                SELECT id FROM catalog_pages 
                WHERE source_id = ? AND page = ?
            ''', (source_id, page)).fetchone()
        
        page_id = page_row['id']
        
        # Insert new item
        conn.execute('''
            INSERT INTO catalog_items (
                page_id, bbox_x, bbox_y, bbox_w, bbox_h,
                name, brand, variants_json, price_value, price_currency,
                size_value, size_unit, barcode, tags_json, raw_text,
                confidence, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            page_id,
            data.get('bbox_x', 0),
            data.get('bbox_y', 0), 
            data.get('bbox_w', 100),
            data.get('bbox_h', 50),
            data.get('name', ''),
            data.get('brand', ''),
            json.dumps(data.get('variants')) if data.get('variants') else None,
            data.get('price', {}).get('value'),
            data.get('price', {}).get('currency', 'MYR'),
            data.get('size', {}).get('value'),
            data.get('size', {}).get('unit', ''),
            data.get('barcode', ''),
            json.dumps(data.get('tags')) if data.get('tags') else None,
            data.get('raw_text', 'Manually added item'),
            data.get('confidence', 1.0),
            data.get('status', 'edited')
        ))
        
        # Get the created item ID
        item_id = conn.lastrowid
        
        # Return the created item
        item = conn.execute('''
            SELECT * FROM catalog_items WHERE id = ?
        ''', (item_id,)).fetchone()
        
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
        
        conn.commit()
        conn.close()
        return jsonify(response)
        
    except Exception as e:
        conn.close()
        return jsonify({"error": f"Failed to create item: {str(e)}"}), 500

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

@app.route('/api/chat/new', methods=['POST'])
def new_chat_session():
    """Create a new chat session"""
    try:
        data = request.get_json() or {}
        session_id = data.get('session_id') or str(uuid.uuid4())
        user_id = data.get('user_id')
        
        # Create conversation
        get_or_create_conversation(session_id)
        
        # Insert system message with Malaysian context
        system_message = """Anda ialah pembantu CANTA untuk SME F&B di Malaysia. Boleh jawab dalam BM atau English. Ingat konteks order dan produk untuk setiap session_id, dan tanya soalan ringkas jika maklumat tak cukup."""
        
        insert_message(session_id, 'system', system_message)
        
        logger.info(f"New chat session created: {session_id}")
        return jsonify({"session_id": session_id})
        
    except Exception as e:
        logger.error(f"Error creating new session: {str(e)}")
        return jsonify({"error": f"Failed to create session: {str(e)}"}), 500

@app.route('/api/chat/history', methods=['GET'])
def get_chat_history():
    """Get chat history for a session"""
    try:
        session_id = request.args.get('session_id')
        if not session_id:
            return jsonify({"error": "session_id is required"}), 400
        
        messages = fetch_messages(session_id, 50)
        
        # Format messages for frontend
        formatted_messages = []
        for role, content, created_at in messages:
            formatted_messages.append({
                "role": role,
                "content": content,
                "created_at": created_at
            })
        
        return jsonify({
            "session_id": session_id,
            "messages": formatted_messages
        })
        
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        return jsonify({"error": f"Failed to fetch history: {str(e)}"}), 500

@app.route('/api/chat/menu', methods=['POST'])
def store_menu_data():
    """Store menu data for a chat session"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        session_id = data.get('session_id')
        source_id = data.get('source_id')
        page = data.get('page')
        menu_data = data.get('menu_data')
        
        if not all([session_id, source_id, page is not None, menu_data]):
            return jsonify({"error": "session_id, source_id, page, and menu_data are required"}), 400
        
        # Store the menu data
        store_active_menu(session_id, source_id, page, menu_data)
        
        return jsonify({"message": "Menu data stored successfully"})
        
    except Exception as e:
        logger.error(f"Error storing menu data: {str(e)}")
        return jsonify({"error": f"Failed to store menu data: {str(e)}"}), 500

@app.route('/api/chat/send', methods=['POST'])
def send_chat_message():
    """Send a message and get AI response"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        session_id = data.get('session_id')
        message = data.get('message', '').strip()
        context_data = data.get('context_data', {})
        
        if not session_id:
            return jsonify({"error": "session_id is required"}), 400
        
        if not message:
            return jsonify({"error": "message is required"}), 400
        
        # Ensure conversation exists
        get_or_create_conversation(session_id)
        
        # Insert user message
        insert_message(session_id, 'user', message)
        
        # Build history for model
        history = build_history_for_model(session_id, 30)
        
        # Generate AI reply with context
        ai_response = generate_reply(session_id, history, context_data)
        
        # Insert assistant reply
        insert_message(session_id, 'assistant', ai_response)
        
        # Get last 50 messages to return
        messages = fetch_messages(session_id, 50)
        formatted_messages = []
        for role, content, created_at in messages:
            formatted_messages.append({
                "role": role,
                "content": content,
                "created_at": created_at
            })
        
        return jsonify({
            "reply": ai_response,
            "messages": formatted_messages
        })
        
    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
        return jsonify({"error": f"Failed to send message: {str(e)}"}), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5001)
