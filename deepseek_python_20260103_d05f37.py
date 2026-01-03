from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import pytesseract
import io
import cv2
import numpy as np
import os

app = Flask(__name__)
CORS(app)

def preprocess_image(img_bytes):
    # Convert bytes to PIL Image
    img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
    
    # Convert to numpy array for OpenCV
    img_array = np.array(img)
    
    # Convert to grayscale
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    
    # Apply thresholding
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    return thresh

@app.route('/api/ocr', methods=['POST'])
def ocr():
    try:
        # Check if file is present
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
        
        file = request.files['image']
        
        # Read file bytes
        img_bytes = file.read()
        
        # Preprocess image
        processed_img = preprocess_image(img_bytes)
        
        # Perform OCR
        text = pytesseract.image_to_string(processed_img)
        
        # Get word count and character count
        word_count = len(text.split())
        char_count = len(text.replace('\n', '').replace(' ', ''))
        
        return jsonify({
            'success': True,
            'text': text,
            'word_count': word_count,
            'character_count': char_count
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)