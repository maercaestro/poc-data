# CANTA Backend - Catalog Annotation API

Flask-based backend for the CANTA catalog annotation system.

## Features

- RESTful API for catalog data management
- SQLite database for local development
- CORS enabled for frontend communication
- Catalog page management
- Item annotation and editing
- Export functionality

## API Endpoints

### Get Catalog Page
```
GET /api/catalog/{source_id}/page/{page}
```
Returns catalog page data with all detected items.

### Update Item
```
PATCH /api/item/{item_id}
```
Updates catalog item with new annotation data.

### Export Catalog
```
POST /api/export/{source_id}
```
Exports complete catalog data as JSON.

### Health Check
```
GET /api/health
```
Returns API health status.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python app.py
```

The API will be available at `http://localhost:5000`

## Database Schema

### catalogs
- id (TEXT, PRIMARY KEY)
- source_id (TEXT)
- page (INTEGER)
- page_width (INTEGER)
- page_height (INTEGER)
- image_url (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### catalog_items
- id (TEXT, PRIMARY KEY)
- catalog_id (TEXT, FOREIGN KEY)
- bbox_x, bbox_y, bbox_w, bbox_h (INTEGER) - Bounding box coordinates
- name (TEXT) - Product name
- brand (TEXT) - Brand name
- variants (TEXT) - JSON array of variants
- price_value (REAL), price_currency (TEXT)
- size_value (REAL), size_unit (TEXT)
- barcode (TEXT)
- tags (TEXT) - JSON array of tags
- raw_text (TEXT) - Original OCR text
- confidence (REAL) - AI confidence score (0-1)
- status (TEXT) - 'ai', 'edited', or 'verified'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

## Development Notes

- Currently returns mock data when no catalog is found
- Database is automatically initialized on first run
- All datetime fields use ISO format
- CORS is enabled for all origins (adjust for production)
