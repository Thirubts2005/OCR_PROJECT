# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Create requirements.txt with minimal dependencies
echo "Flask==2.3.3
Flask-CORS==4.0.0
Pillow==10.0.0
opencv-python-headless==4.8.1.78
numpy==1.24.3
pytesseract==0.3.10" > requirements.txt

# Install dependencies
pip install -r requirements.txt