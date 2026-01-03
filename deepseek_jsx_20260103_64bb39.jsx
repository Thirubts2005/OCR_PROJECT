import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Alert, 
  Snackbar,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ImageIcon from '@mui/icons-material/Image';
import GitHubIcon from '@mui/icons-material/GitHub';
import ImageUploader from './components/ImageUploader';
import OCRResult from './components/OCRResult';
import './styles/App.css';

// Create a theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
});

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('image', files[0]);

    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'OCR processing failed');
      }

      if (data.success) {
        setResult(data);
        setOpenSnackbar(true);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err.message);
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchUpload = async (files) => {
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await fetch('/api/ocr-batch', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Batch processing failed');
      }

      if (data.success) {
        setResult(data);
        setOpenSnackbar(true);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err.message);
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setResult(null);
    setError(null);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <ImageIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              OCR Scanner
            </Typography>
            <Tooltip title="View on GitHub">
              <IconButton 
                color="inherit" 
                href="https://github.com/yourusername/ocr-scanner"
                target="_blank"
              >
                <GitHubIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Extract Text from Images
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" align="center" paragraph>
              Upload an image and extract text using Optical Character Recognition (OCR)
            </Typography>
          </Box>

          {loading && (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          )}

          <ImageUploader 
            onUpload={handleUpload}
            onBatchUpload={handleBatchUpload}
            onClear={handleClear}
            disabled={loading}
          />

          {error && (
            <Alert 
              severity="error" 
              sx={{ mt: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {result && <OCRResult data={result} />}
        </Container>

        <Snackbar 
          open={openSnackbar} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={error ? "error" : "success"}
            sx={{ width: '100%' }}
          >
            {error ? error : "OCR processing completed successfully!"}
          </Alert>
        </Snackbar>

        <Box 
          component="footer" 
          sx={{ 
            py: 3, 
            px: 2, 
            mt: 'auto', 
            backgroundColor: (theme) => 
              theme.palette.mode === 'light'
                ? theme.palette.grey[200]
                : theme.palette.grey[800],
          }}
        >
          <Container maxWidth="sm">
            <Typography variant="body2" color="text.secondary" align="center">
              Powered by Tesseract OCR & Flask • Built with React & Material-UI
            </Typography>
          </Container>
        </Box>
      </div>
    </ThemeProvider>
  );
}

export default App;