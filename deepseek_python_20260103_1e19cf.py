from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import pytesseract
import io
import cv2
import numpy as np
import os
from datetime import datetime
import base64
import logging
from werkzeug.utils import secure_filename

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'bmp', 'gif', 'tiff', 'pdf'}

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def preprocess_image_bytes(img_bytes):
    """Enhanced image preprocessing for better OCR results"""
    try:
        # Load image
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        arr = np.array(img)
        
        # Convert to grayscale
        gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
        
        # Resize for consistent OCR (maintain aspect ratio)
        h, w = gray.shape
        scale = 1024 / max(h, w) if max(h, w) > 1024 else 1.0
        if scale != 1.0:
            new_w, new_h = int(w * scale), int(h * scale)
            gray = cv2.resize(gray, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
        
        # Denoise
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Adaptive thresholding
        th = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                  cv2.THRESH_BINARY, 11, 2)
        
        # Optional: Morphological operations for cleaning
        kernel = np.ones((2, 2), np.uint8)
        th = cv2.morphologyEx(th, cv2.MORPH_CLOSE, kernel)
        th = cv2.morphologyEx(th, cv2.MORPH_OPEN, kernel)
        
        return th
    except Exception as e:
        logger.error(f"Error in preprocessing: {str(e)}")
        raise

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "OCR API",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/ocr', methods=['POST'])
def ocr():
    """Main OCR endpoint"""
    try:
        # Check if file was uploaded
        if 'image' not in request.files:
            return jsonify({
                "success": False,
                "error": "No image uploaded",
                "timestamp": datetime.now().isoformat()
            }), 400
        
        file = request.files['image']
        
        # Validate file
        if file.filename == '':
            return jsonify({
                "success": False,
                "error": "No file selected",
                "timestamp": datetime.now().isoformat()
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                "success": False,
                "error": f"File type not allowed. Allowed types: {', '.join(app.config['ALLOWED_EXTENSIONS'])}",
                "timestamp": datetime.now().isoformat()
            }), 400
        
        # Read file bytes
        img_bytes = file.read()
        
        # Process image
        processed_image = preprocess_image_bytes(img_bytes)
        
        # OCR with Tesseract
        text = pytesseract.image_to_string(processed_image, lang='eng')
        
        # Get detailed data
        data = pytesseract.image_to_data(
            processed_image, 
            output_type=pytesseract.Output.DICT,
            config='--psm 3'
        )
        
        # Extract boxes with confidence > 60
        boxes = []
        word_boxes = []
        for i, conf in enumerate(data['conf']):
            if int(conf) > 60 and data['text'][i].strip():
                box = {
                    "text": data['text'][i],
                    "confidence": int(conf),
                    "bounding_box": {
                        "left": int(data['left'][i]),
                        "top": int(data['top'][i]),
                        "width": int(data['width'][i]),
                        "height": int(data['height'][i])
                    },
                    "level": int(data['level'][i]),
                    "page_num": int(data['page_num'][i]),
                    "block_num": int(data['block_num'][i]),
                    "par_num": int(data['par_num'][i]),
                    "line_num": int(data['line_num'][i]),
                    "word_num": int(data['word_num'][i])
                }
                boxes.append(box)
                
                # For visualization
                if int(data['level'][i]) == 5:  # Word level
                    word_boxes.append({
                        "text": data['text'][i],
                        "confidence": int(conf),
                        "x": int(data['left'][i]),
                        "y": int(data['top'][i]),
                        "width": int(data['width'][i]),
                        "height": int(data['height'][i])
                    })
        
        # Generate processed image preview (optional)
        _, buffer = cv2.imencode('.png', processed_image)
        processed_img_base64 = base64.b64encode(buffer).decode('utf-8')
        
        # Save original file (optional)
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        save_filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], save_filename)
        
        with open(filepath, 'wb') as f:
            f.write(img_bytes)
        
        logger.info(f"Processed file: {filename}")
        
        return jsonify({
            "success": True,
            "text": text.strip(),
            "word_count": len([w for w in text.split() if w.strip()]),
            "character_count": len(text.replace('\n', '').replace(' ', '')),
            "boxes": boxes,
            "word_boxes": word_boxes,
            "processed_image": f"data:image/png;base64,{processed_img_base64}",
            "original_filename": filename,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"OCR processing error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/ocr-batch', methods=['POST'])
def ocr_batch():
    """Batch processing endpoint for multiple images"""
    try:
        if 'images' not in request.files:
            return jsonify({
                "success": False,
                "error": "No images uploaded",
                "timestamp": datetime.now().isoformat()
            }), 400
        
        files = request.files.getlist('images')
        results = []
        
        for file in files:
            if file and allowed_file(file.filename):
                try:
                    img_bytes = file.read()
                    processed_image = preprocess_image_bytes(img_bytes)
                    text = pytesseract.image_to_string(processed_image, lang='eng')
                    
                    results.append({
                        "filename": file.filename,
                        "text": text.strip(),
                        "word_count": len([w for w in text.split() if w.strip()]),
                        "status": "success"
                    })
                except Exception as e:
                    results.append({
                        "filename": file.filename,
                        "error": str(e),
                        "status": "failed"
                    })
        
        return jsonify({
            "success": True,
            "total_files": len(files),
            "processed": len([r for r in results if r['status'] == 'success']),
            "failed": len([r for r in results if r['status'] == 'failed']),
            "results": results,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Batch processing error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.errorhandler(413)
def too_large(e):
    return jsonify({
        "success": False,
        "error": "File too large. Maximum size is 16MB",
        "timestamp": datetime.now().isoformat()
    }), 413

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)