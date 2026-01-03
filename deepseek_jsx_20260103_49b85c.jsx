import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  TextField,
  IconButton,
  Tooltip,
  Divider,
  Alert
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { saveAs } from 'file-saver';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const OCRResult = ({ data }) => {
  const [tabValue, setTabValue] = useState(0);
  const [zoom, setZoom] = useState(1);

  if (!data) return null;

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(data.text);
  };

  const handleDownloadText = () => {
    const blob = new Blob([data.text], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `ocr-result-${new Date().getTime()}.txt`);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, `ocr-result-${new Date().getTime()}.json`);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  return (
    <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Extracted Text" />
          <Tab label="Visualization" />
          <Tab label="Details" />
          {data.word_boxes && data.word_boxes.length > 0 && (
            <Tab label="Word Boxes" />
          )}
        </Tabs>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="h6">
              OCR Results
              {data.original_filename && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  File: {data.original_filename}
                </Typography>
              )}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            <Chip 
              label={`${data.word_count} words`} 
              size="small" 
              variant="outlined" 
              sx={{ mr: 1 }}
            />
            <Chip 
              label={`${data.character_count} characters`} 
              size="small" 
              variant="outlined"
            />
          </Grid>
        </Grid>
      </Box>

      {tabValue === 0 && (
        <Box>
          <Box sx={{ mb: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Tooltip title="Copy text">
              <IconButton onClick={handleCopyText} size="small">
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download as TXT">
              <IconButton onClick={handleDownloadText} size="small">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          <TextField
            fullWidth
            multiline
            rows={10}
            value={data.text}
            variant="outlined"
            InputProps={{
              readOnly: true,
              sx: {
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                lineHeight: 1.5
              }
            }}
          />
          
          {!data.text.trim() && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              No text was detected in the image. Try uploading a clearer image or adjusting the preprocessing settings.
            </Alert>
          )}
        </Box>
      )}

      {tabValue === 1 && data.processed_image && (
        <Box>
          <Box sx={{ mb: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Tooltip title="Zoom In">
              <IconButton onClick={handleZoomIn} size="small">
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton onClick={handleZoomOut} size="small">
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="caption" sx={{ alignSelf: 'center', mx: 1 }}>
              Zoom: {zoom.toFixed(2)}x
            </Typography>
          </Box>
          
          <Box
            sx={{
              overflow: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              backgroundColor: 'grey.50',
              maxHeight: 500
            }}
          >
            <Box
              component="div"
              sx={{
                position: 'relative',
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                width: 'fit-content'
              }}
            >
              <Box
                component="img"
                src={data.processed_image}
                alt="Processed"
                sx={{
                  display: 'block',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
              
              {/* Draw bounding boxes */}
              {data.word_boxes && data.word_boxes.map((box, index) => (
                <Box
                  key={index}
                  sx={{
                    position: 'absolute',
                    left: box.x,
                    top: box.y,
                    width: box.width,
                    height: box.height,
                    border: '2px solid',
                    borderColor: box.confidence > 80 ? 'success.main' : 
                               box.confidence > 60 ? 'warning.main' : 'error.main',
                    backgroundColor: box.confidence > 80 ? 'rgba(76, 175, 80, 0.1)' :
                                   box.confidence > 60 ? 'rgba(255, 152, 0, 0.1)' : 
                                   'rgba(244, 67, 54, 0.1)',
                    pointerEvents: 'none',
                    '&:hover': {
                      backgroundColor: box.confidence > 80 ? 'rgba(76, 175, 80, 0.3)' :
                                     box.confidence > 60 ? 'rgba(255, 152, 0, 0.3)' : 
                                     'rgba(244, 67, 54, 0.3)',
                    }
                  }}
                  title={`${box.text} (${box.confidence}% confidence)`}
                />
              ))}
            </Box>
          </Box>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label="High confidence (>80%)" 
              size="small"
              sx={{ 
                borderColor: 'success.main',
                color: 'success.main'
              }}
              variant="outlined"
            />
            <Chip 
              label="Medium confidence (60-80%)" 
              size="small"
              sx={{ 
                borderColor: 'warning.main',
                color: 'warning.main'
              }}
              variant="outlined"
            />
            <Chip 
              label="Low confidence (<60%)" 
              size="small"
              sx={{ 
                borderColor: 'error.main',
                color: 'error.main'
              }}
              variant="outlined"
            />
          </Box>
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Statistics
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Word Count:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        {data.word_count}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Character Count:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        {data.character_count}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Detected Words:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        {data.boxes?.length || 0}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Average Confidence:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        {data.boxes?.length > 0
                          ? `${(data.boxes.reduce((sum, box) => sum + box.confidence, 0) / data.boxes.length).toFixed(1)}%`
                          : 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Export Options
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownloadText}
                      fullWidth
                    >
                      Download as Text (.txt)
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownloadJSON}
                      fullWidth
                    >
                      Download as JSON (.json)
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ContentCopyIcon />}
                      onClick={handleCopyText}
                      fullWidth
                    >
                      Copy to Clipboard
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {data.timestamp && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Processed at: {new Date(data.timestamp).toLocaleString()}
            </Typography>
          )}
        </Box>
      )}

      {tabValue === 3 && data.word_boxes && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Detected Words ({data.word_boxes.length}):
          </Typography>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            <SyntaxHighlighter
              language="json"
              style={githubGist}
              customStyle={{ 
                fontSize: '0.8rem',
                borderRadius: 4
              }}
            >
              {JSON.stringify(data.word_boxes, null, 2)}
            </SyntaxHighlighter>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default OCRResult;