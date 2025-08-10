import os
import base64
import json
import re
from typing import Optional, List, Dict, Any, Union
from openai import OpenAI
from pydantic import BaseModel, Field, ValidationError, ConfigDict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize OpenAI client
_client: Optional[OpenAI] = None

def _get_client() -> OpenAI:
    """Get or initialize OpenAI client with error handling."""
    global _client
    if _client is None:
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY not found in environment variables")
        _client = OpenAI(api_key=api_key)
    return _client

# Canonical schema models
class Price(BaseModel):
    value: Optional[float] = None
    currency: str = "MYR"

class Size(BaseModel):
    value: Optional[float] = None
    unit: Optional[str] = None

class Item(BaseModel):
    name: str
    price: Price
    size: Size = Field(default_factory=Size)
    desc: Optional[str] = None
    tags: Optional[List[str]] = None
    extras: Dict[str, Any] = Field(default_factory=dict)

class Section(BaseModel):
    name: Optional[str] = None
    time: Optional[str] = None
    items: List[Item] = Field(default_factory=list)

class MenuDoc(BaseModel):
    source: str
    sections: List[Section]
    meta: Dict[str, Any] = Field(default_factory=dict)
    schema: Dict[str, str] = Field(default_factory=lambda: {"name": "canta.menu", "version": "1.0"})
    
    model_config = ConfigDict(extra="ignore")

# Prompts
EXTRACT_PROMPT = """
Analyze this menu/catalog image and extract the information as JSON following the "canta.menu v1" schema exactly.

Return ONLY valid JSON with this structure:
{
  "source": "string description of what this menu/catalog is",
  "sections": [
    {
      "name": "section name or null",
      "time": "time period like 'breakfast' or null", 
      "items": [
        {
          "name": "item name",
          "price": {"value": number_or_null, "currency": "MYR"},
          "size": {"value": number_or_null, "unit": "g|kg|ml|l|pcs|pack|null"},
          "desc": "description or null",
          "tags": ["tag1", "tag2"] or null,
          "extras": {"any_additional_info": "value"}
        }
      ]
    }
  ],
  "meta": {"service_charge_note": true_or_false_or_null},
  "schema": {"name": "canta.menu", "version": "1.0"}
}

Rules:
- Return JSON ONLY, no commentary
- If value unknown, use null (do NOT hallucinate)
- Currency is "MYR" when RM shown; parse "RM 12" → 12.00 in price.value
- Keep Malay terms as-is (e.g., "Nasi Lemak")
- For multiple prices/sizes, put base price in price.value, rest in extras
- For tables or sectionless pages, use sections=[{"name": null, "time": null, "items":[...]}]
- Any additional attributes go under item.extras
"""

REPAIR_PROMPT_TEMPLATE = """
You returned invalid JSON for schema 'canta.menu v1'. Here is your JSON and the error. Fix it to match the schema exactly. Return JSON only.

Your JSON:
{original_json}

Error:
{error_text}

Return ONLY valid JSON following the canta.menu v1 schema. No commentary.
"""

def _b64(file_bytes: bytes, mime: str) -> str:
    """Convert image bytes to base64 data URL."""
    encoded = base64.b64encode(file_bytes).decode('utf-8')
    return f"data:{mime};base64,{encoded}"

def _call_vision(prompt: str, data_url: str, max_tokens: int = 1000) -> str:
    """Call GPT-4o Vision API with image."""
    try:
        client = _get_client()
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": data_url}}
                    ]
                }
            ],
            max_tokens=max_tokens,
            temperature=0.1
        )
        content = response.choices[0].message.content.strip()
        print(f"DEBUG: Raw API response: {content[:500]}...")  # Log first 500 chars
        return content
    except Exception as e:
        print(f"DEBUG: Vision API call failed: {e}")
        raise RuntimeError(f"Vision API call failed: {e}") from e

def normalize_money(value: Union[str, int, float, None]) -> Optional[float]:
    """Normalize money values to float with 2 decimal places."""
    if value is None:
        return None
    
    if isinstance(value, (int, float)):
        return round(float(value), 2)
    
    if isinstance(value, str):
        # Remove RM, currency symbols, whitespace
        cleaned = re.sub(r'[RM\s$€£¥₹]', '', value.strip())
        # Extract number
        match = re.search(r'(\d+(?:\.\d+)?)', cleaned)
        if match:
            return round(float(match.group(1)), 2)
    
    return None

def normalize_menu(data: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize and clean menu data."""
    if not isinstance(data, dict):
        return data
    
    # Ensure required fields exist
    if "source" not in data:
        data["source"] = "Unknown"
    if "sections" not in data:
        data["sections"] = []
    if "schema" not in data:
        data["schema"] = {"name": "canta.menu", "version": "1.0"}
    if "meta" not in data:
        data["meta"] = {}
    
    # Normalize sections
    for section in data.get("sections", []):
        if not isinstance(section, dict):
            continue
            
        # Trim strings, convert empty to None
        for key in ["name", "time"]:
            if key in section and isinstance(section[key], str):
                section[key] = section[key].strip() or None
        
        # Ensure items list exists
        if "items" not in section:
            section["items"] = []
        
        # Normalize items
        for item in section.get("items", []):
            if not isinstance(item, dict):
                continue
            
            # Trim name and desc
            for key in ["name", "desc"]:
                if key in item and isinstance(item[key], str):
                    item[key] = item[key].strip() or None
            
            # Normalize price
            if "price" not in item:
                item["price"] = {"value": None, "currency": "MYR"}
            elif isinstance(item["price"], dict):
                if "value" in item["price"]:
                    item["price"]["value"] = normalize_money(item["price"]["value"])
                if "currency" not in item["price"]:
                    item["price"]["currency"] = "MYR"
            
            # Normalize size
            if "size" not in item:
                item["size"] = {"value": None, "unit": None}
            elif isinstance(item["size"], dict):
                if "value" in item["size"] and item["size"]["value"] is not None:
                    try:
                        item["size"]["value"] = float(item["size"]["value"])
                    except (ValueError, TypeError):
                        item["size"]["value"] = None
                if "unit" in item["size"] and isinstance(item["size"]["unit"], str):
                    item["size"]["unit"] = item["size"]["unit"].strip() or None
            
            # Normalize tags
            if "tags" in item:
                if isinstance(item["tags"], str):
                    # Split comma-separated string
                    item["tags"] = [tag.strip() for tag in item["tags"].split(",") if tag.strip()]
                elif isinstance(item["tags"], list):
                    item["tags"] = [str(tag).strip() for tag in item["tags"] if str(tag).strip()]
                if not item["tags"]:
                    item["tags"] = None
            
            # Ensure extras exists
            if "extras" not in item:
                item["extras"] = {}
    
    return data

def parse_and_validate(raw_json: str) -> Dict[str, Any]:
    """Parse and validate JSON response against canonical schema."""
    try:
        print(f"DEBUG: Attempting to parse JSON: {raw_json[:200]}...")
        
        # Clean the response - remove markdown code blocks if present
        cleaned = raw_json.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        print(f"DEBUG: Cleaned JSON: {cleaned[:200]}...")
        
        # Parse JSON
        data = json.loads(cleaned)
        print(f"DEBUG: Successfully parsed JSON, keys: {list(data.keys()) if isinstance(data, dict) else type(data)}")
        
        # Normalize and validate
        normalized = normalize_menu(data)
        validated = MenuDoc(**normalized)
        
        return validated.model_dump()
        
    except json.JSONDecodeError as e:
        print(f"DEBUG: JSON decode error: {e}")
        print(f"DEBUG: Raw content that failed: '{raw_json}'")
        raise ValueError(f"Invalid JSON response: {e}")
    except ValidationError as e:
        print(f"DEBUG: Pydantic validation error: {e}")
        raise ValueError(f"Schema validation failed: {e}")
    except Exception as e:
        print(f"DEBUG: Unexpected error: {e}")
        raise

def build_repair_prompt(original_json_text: str, error_text: str) -> str:
    """Build repair prompt for failed validation."""
    return REPAIR_PROMPT_TEMPLATE.format(
        original_json=original_json_text,
        error_text=error_text
    )

def extract_menu(image_bytes: bytes, mime: str = "image/png") -> Dict[str, Any]:
    """
    Extract menu/catalog data from image using GPT-4o Vision.
    
    Args:
        image_bytes: Raw image data
        mime: MIME type (e.g., 'image/png', 'image/jpeg')
    
    Returns:
        Validated menu document following canta.menu v1 schema
    
    Raises:
        RuntimeError: If extraction fails after repair attempt
    """
    # Convert to data URL
    data_url = _b64(image_bytes, mime)
    
    # First attempt
    try:
        raw = _call_vision(EXTRACT_PROMPT, data_url, max_tokens=3000)
        return parse_and_validate(raw)
    except Exception as e1:
        # Attempt repair
        try:
            repair_prompt = build_repair_prompt(
                original_json_text=raw if 'raw' in locals() else "No JSON returned",
                error_text=str(e1)
            )
            repaired = _call_vision(repair_prompt, data_url, max_tokens=3000)
            return parse_and_validate(repaired)
        except Exception as e2:
            raise RuntimeError(f"Extraction failed after repair: {e2}") from e2

# Compatibility functions for existing Flask backend
def detect_boxes(file_bytes: bytes, mime_type: str) -> str:
    """
    Compatibility wrapper for the old detect_boxes function.
    Now uses the new extract_menu function but returns simple format.
    """
    try:
        # Use the new extract_menu function
        menu_data = extract_menu(file_bytes, mime_type)
        
        # Convert to simple format expected by frontend
        description_parts = []
        
        # Add source info
        if menu_data.get("source"):
            description_parts.append(f"Source: {menu_data['source']}")
        
        # Add sections and items info
        total_items = 0
        for section in menu_data.get("sections", []):
            section_name = section.get("name", "Unnamed Section")
            items_count = len(section.get("items", []))
            total_items += items_count
            
            if section_name and section_name != "Unnamed Section":
                description_parts.append(f"\n{section_name}: {items_count} items")
            
            # Add some item details
            for item in section.get("items", [])[:3]:  # Show first 3 items
                item_desc = f"- {item.get('name', 'Unknown item')}"
                if item.get("price", {}).get("value"):
                    price = item["price"]["value"]
                    currency = item["price"].get("currency", "MYR")
                    item_desc += f" ({currency} {price:.2f})"
                description_parts.append(item_desc)
        
        description_parts.append(f"\nTotal items detected: {total_items}")
        
        description = "\n".join(description_parts)
        
        response = {
            "description": description,
            "raw_response": json.dumps(menu_data, ensure_ascii=False, indent=2),
            "status": "success"
        }
        
        return json.dumps(response)
        
    except Exception as e:
        error_response = {
            "description": f"Error: {str(e)}",
            "raw_response": f"Error occurred: {str(e)}",
            "status": "error"
        }
        return json.dumps(error_response)

def extract_item(file_bytes: bytes, mime_type: str) -> str:
    """
    Compatibility wrapper for the old extract_item function.
    Now uses the new extract_menu function but focuses on first item.
    """
    try:
        # Use the new extract_menu function
        menu_data = extract_menu(file_bytes, mime_type)
        
        # Find the first item
        first_item = None
        for section in menu_data.get("sections", []):
            if section.get("items"):
                first_item = section["items"][0]
                break
        
        if first_item:
            item_desc = f"Item: {first_item.get('name', 'Unknown')}\n"
            
            if first_item.get("desc"):
                item_desc += f"Description: {first_item['desc']}\n"
            
            if first_item.get("price", {}).get("value"):
                price = first_item["price"]["value"]
                currency = first_item["price"].get("currency", "MYR")
                item_desc += f"Price: {currency} {price:.2f}\n"
            
            if first_item.get("size", {}).get("value"):
                size = first_item["size"]["value"]
                unit = first_item["size"].get("unit", "")
                item_desc += f"Size: {size} {unit}\n"
            
            if first_item.get("tags"):
                item_desc += f"Tags: {', '.join(first_item['tags'])}\n"
            
            description = item_desc.strip()
        else:
            description = "No items detected in the image"
        
        response = {
            "description": description,
            "raw_response": json.dumps(menu_data, ensure_ascii=False, indent=2),
            "status": "success"
        }
        
        return json.dumps(response)
        
    except Exception as e:
        error_response = {
            "description": f"Error: {str(e)}",
            "raw_response": f"Error occurred: {str(e)}",
            "status": "error"
        }
        return json.dumps(error_response)

# CLI self-test
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python backend/services/vision/gpt4o.py <image_path>")
        sys.exit(1)
    
    path = sys.argv[1]
    
    # Determine MIME type
    if path.lower().endswith('.png'):
        mime = "image/png"
    elif path.lower().endswith(('.jpg', '.jpeg')):
        mime = "image/jpeg"
    else:
        mime = "image/png"  # default
    
    try:
        with open(path, "rb") as f:
            image_bytes = f.read()
        
        doc = extract_menu(image_bytes, mime=mime)
        print(json.dumps(doc, ensure_ascii=False, indent=2))
    
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
