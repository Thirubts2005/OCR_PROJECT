import React, { useState } from 'react';
import './styles/App.css';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image file');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>OCR Scanner</h1>
        <p>Extract text from images using Optical Character Recognition</p>
      </header>

      <main className="main-content">
        <div className="upload-section">
          <h2>Upload Image</h2>
          <form onSubmit={handleSubmit}>
            <div className="file-input">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                id="file-upload"
              />
              <label htmlFor="file-upload">
                {file ? file.name : 'Choose an image...'}
              </label>
            </div>
            
            <button 
              type="submit" 
              disabled={!file || loading}
              className="upload-button"
            >
              {loading ? 'Processing...' : 'Extract Text'}
            </button>
          </form>

          {file && (
            <div className="image-preview">
              <h3>Preview:</h3>
              <img 
                src={URL.createObjectURL(file)} 
                alt="Preview" 
                className="preview-image"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
          </div>
        )}

        {result && (
          <div className="result-section">
            <h2>Extracted Text</h2>
            <div className="stats">
              <span>Words: {result.word_count || 0}</span>
              <span>Characters: {result.character_count || 0}</span>
            </div>
            
            <div className="text-result">
              <textarea 
                value={result.text || 'No text found'} 
                readOnly 
                rows="10"
              />
              <div className="result-actions">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(result.text || '');
                    alert('Text copied to clipboard!');
                  }}
                >
                  Copy Text
                </button>
                <button 
                  onClick={() => {
                    const blob = new Blob([result.text], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ocr-result-${Date.now()}.txt`;
                    a.click();
                  }}
                >
                  Download as TXT
                </button>
              </div>
            </div>

            {result.processed_image && (
              <div className="processed-image">
                <h3>Processed Image</h3>
                <img 
                  src={result.processed_image} 
                  alt="Processed" 
                  className="processed-image-preview"
                />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Powered by Tesseract OCR & Flask</p>
      </footer>
    </div>
  );
}

export default App;