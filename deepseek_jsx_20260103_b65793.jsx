import React, { useCallback, useState } from 'react';
import { 
  Box, 
  Button, 
  Paper, 
  Typography, 
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import CollectionsIcon from '@mui/icons-material/Collections';

const ImageUploader = ({ onUpload, onBatchUpload, onClear, disabled }) => {
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFiles(acceptedFiles);
      
      // Create preview for first file
      const firstFile = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(firstFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.bmp', '.gif', '.tiff']
    },
    multiple: true,
    disabled
  });

  const handleUpload = () => {
    if (files.length === 0) return;
    
    if (files.length === 1) {
      onUpload(files);
    } else {
      onBatchUpload(files);
    }
  };

  const handleClear = () => {
    setFiles([]);
    setPreview(null);
    onClear();
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    if (newFiles.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(newFiles[0]);
    } else {
      setPreview(null);
    }
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        mb: 3,
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'grey.300',
        backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
        transition: 'all 0.3s ease',
      }}
    >
      <Box
        {...getRootProps()}
        sx={{ 
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          p: 3
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? (
            'Drop the images here...'
          ) : (
            'Drag & drop images here, or click to select'
          )}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Supports PNG, JPG, JPEG, BMP, GIF, TIFF
        </Typography>
        <Button 
          variant="contained" 
          component="span"
          disabled={disabled}
        >
          Browse Files
        </Button>
      </Box>

      {preview && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1" gutterBottom>
            Preview:
          </Typography>
          <Box
            component="img"
            src={preview}
            alt="Preview"
            sx={{
              maxWidth: '100%',
              maxHeight: 300,
              borderRadius: 1,
              boxShadow: 1,
              mb: 2
            }}
          />
        </Box>
      )}

      {files.length > 0 && (
        <>
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
            Selected Files ({files.length}):
          </Typography>
          <List dense>
            {files.map((file, index) => (
              <ListItem key={index}>
                <ImageIcon sx={{ mr: 2, color: 'action.active' }} />
                <ListItemText
                  primary={file.name}
                  secondary={`${(file.size / 1024).toFixed(2)} KB`}
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={() => removeFile(index)}
                    disabled={disabled}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={disabled}
              startIcon={<CollectionsIcon />}
              sx={{ minWidth: 150 }}
            >
              {files.length === 1 ? 'Extract Text' : 'Process All'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleClear}
              disabled={disabled}
              startIcon={<DeleteIcon />}
            >
              Clear All
            </Button>
          </Box>

          {files.length > 1 && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              Processing {files.length} files. This may take a moment...
            </Typography>
          )}
        </>
      )}
    </Paper>
  );
};

export default ImageUploader;