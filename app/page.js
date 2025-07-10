'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tab,
  Tabs,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Help as HelpIcon,
  Delete as DeleteIcon,
  ColorLens as ColorLensIcon,
  Edit as EditIcon
} from '@mui/icons-material';

const CodeRefactoringInterface = () => {
  const [files, setFiles] = useState([
    { id: 1, name: 'file 1.py', color: 'primary', functions: [], codeBlocks: [], content: '' }
  ]);
  
  const [selectedFile, setSelectedFile] = useState(1);
  const [draggedFunction, setDraggedFunction] = useState(null);
  const [draggedCodeBlock, setDraggedCodeBlock] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [renameDialog, setRenameDialog] = useState({ open: false, fileId: null, currentName: '' });

const exampleCode = `import numpy as np
import matplotlib.pyplot as plt
from nd2reader import ND2Reader
from scipy.ndimage import zoom, gaussian_filter
from tifffile import imread
 
 
 
def load_image(file_path):
    if file_path.endswith('.nd2'):
        microscopy_data = ND2Reader(file_path)
        raw_image = microscopy_data[0]
        downsampling_factor = 0.5
        blur_factor = 1
    elif file_path.endswith('.tiff') or file_path.endswith('.tif'):
        raw_image = imread(file_path)
        downsampling_factor = 0.3
        blur_factor = 2
    else:
        raise ValueError(f"Unsupported file format: {file_path}")
    return raw_image, downsampling_factor, blur_factor
 
 
def normalize_image(image):
    lowest_pixel_value = np.min(raw_image)
    highest_pixel_value = np.max(image)
    pixel_value_range = highest_pixel_value - lowest_pixel_value
    bottom_capped_image = image - lowest_pixel_value
    normalized_image = bottom_capped_image / pixel_value_range
    return normalized_image

def downsample_image(image, factor):
    downsampled_image = zoom(image, (factor, factor))
    return downsampled_image
 
 
def smooth_image(image, factor):
    smoothed_image = gaussian_filter(image, sigma=factor)
    return smoothed_image
 
 
def preprocess_image(raw_image, downsampling_factor,
                    gaussian_sigma):
    normalized_image = normalize_image(raw_image)
    downsampled_image = downsample_image(normalized_image, downsampling_factor)
    smoothed_image = smooth_image(downsampled_image, gaussian_sigma)
    return smoothed_image

def plot_images(raw_images, processed_images):
    num_images = len(raw_images)
    fig, axes = plt.subplots(num_images, 2, figsize=(12, 6 * num_images))
    
    for i in range(num_images):
        axes[i, 0].imshow(raw_images[i], cmap='gray')
        axes[i, 0].set_title(f'Raw Image {i + 1}')
        axes[i, 0].axis('off')
        
        axes[i, 1].imshow(processed_images[i], cmap='gray')
        axes[i, 1].set_title(f'Processed Image {i + 1}')
        axes[i, 1].axis('off')
    
    plt.show()

if __name__ == "__main__":
    file_paths = ['microscopy_volume1.nd2', 'microscopy_volume2.nd2', 'microscopy_volume3.tiff']
    raw_images = []
    processed_images = []
    
    for file_path in file_paths:
        raw_image, downsampling_factor, blur_factor = load_image(file_path)
        processed_image = preprocess_image(raw_image, downsampling_factor, blur_factor)
        raw_images.append(raw_image)
        processed_images.append(processed_image)
    
    plot_images(raw_images, processed_images)`;

  const functions = [
    'load_image',
    'normalize_image', 
    'downsample_image',
    'smooth_image',
    'preprocess_image',
    'plot_images'
  ];

  const colors = ['primary', 'secondary', 'success', 'error', 'warning', 'info'];

  const addNewFile = () => {
    const newFile = {
      id: Date.now(),
      name: `file ${files.length + 1}.py`,
      color: colors[files.length % colors.length],
      functions: [],
      codeBlocks: [],
      content: ''
    };
    setFiles([...files, newFile]);
    setSelectedFile(newFile.id);
  };

  const deleteFile = (fileId) => {
    setFiles(files.filter(f => f.id !== fileId));
    if (selectedFile === fileId) {
      const remainingFiles = files.filter(f => f.id !== fileId);
      if (remainingFiles.length > 0) {
        setSelectedFile(remainingFiles[0].id);
      } else {
        setSelectedFile(null);
      }
    }
  };

  const changeFileName = (fileId, newName) => {
    // Always append .py extension in lowercase
    const finalName = newName.trim().toLowerCase() + '.py';
    setFiles(files.map(f => f.id === fileId ? { ...f, name: finalName } : f));
    setRenameDialog({ open: false, fileId: null, currentName: '' });
    // Update content with new file name
    setTimeout(() => updateFileContent(fileId), 0);
  };

  const changeFileColor = (fileId) => {
    const currentFile = files.find(f => f.id === fileId);
    const currentColorIndex = colors.indexOf(currentFile.color);
    const nextColor = colors[(currentColorIndex + 1) % colors.length];
    
    setFiles(files.map(f => f.id === fileId ? { ...f, color: nextColor } : f));
  };

  const updateFileContent = (fileId) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    let content = `# ${file.name}\n\n`;
    
    // Add functions content
    file.functions.forEach(functionName => {
      content += `# Function: ${functionName}\n`;
      content += `def ${functionName}():\n    # Implementation here\n    pass\n\n`;
    });
    
    // Add code blocks content
    file.codeBlocks.forEach(block => {
      content += `# ${block.name}\n`;
      content += `${block.content}\n\n`;
    });

    setFiles(files.map(f => f.id === fileId ? { ...f, content } : f));
  };

  const handleDragStart = (e, functionName) => {
    setDraggedFunction(functionName);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCodeBlockDragStart = (e, groupName) => {
    setDraggedCodeBlock(groupName);
    e.dataTransfer.effectAllowed = 'move';
  };

  const getCodeBlockContent = (groupName) => {
    const lines = exampleCode.split('\n');
    if (groupName === 'Group 2') {
      return lines.slice(8, 21).join('\n'); // lines 9-21
    } else if (groupName === 'Group 1') {
      return lines.slice(23, 39).join('\n'); // lines 24-39
    }
    return '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, fileId) => {
    e.preventDefault();
    if (draggedFunction) {
      const updatedFiles = files.map(f => ({
        ...f,
        functions: f.functions.filter(func => func !== draggedFunction)
      }));
      
      const targetFile = updatedFiles.find(f => f.id === fileId);
      if (targetFile && !targetFile.functions.includes(draggedFunction)) {
        targetFile.functions.push(draggedFunction);
      }
      
      setFiles(updatedFiles);
      setDraggedFunction(null);
      // Update content after adding function
      setTimeout(() => updateFileContent(fileId), 0);
    } else if (draggedCodeBlock) {
      const targetFile = files.find(f => f.id === fileId);
      if (targetFile) {
        if (!targetFile.codeBlocks) targetFile.codeBlocks = [];
        if (!targetFile.codeBlocks.find(block => block.name === draggedCodeBlock)) {
          const codeContent = getCodeBlockContent(draggedCodeBlock);
          targetFile.codeBlocks.push({
            name: draggedCodeBlock,
            content: codeContent
          });
        }
      }
      
      setFiles(files.map(f => f.id === fileId ? { ...f, codeBlocks: targetFile.codeBlocks } : f));
      setDraggedCodeBlock(null);
      // Update content after adding code block
      setTimeout(() => updateFileContent(fileId), 0);
    }
  };

  const handleDropToTrash = (e) => {
    e.preventDefault();
    if (draggedFunction) {
      const updatedFiles = files.map(f => ({
        ...f,
        functions: f.functions.filter(func => func !== draggedFunction)
      }));
      setFiles(updatedFiles);
      setDraggedFunction(null);
      // Update content for all files after removing function
      files.forEach(file => setTimeout(() => updateFileContent(file.id), 0));
    } else if (draggedCodeBlock) {
      const updatedFiles = files.map(f => ({
        ...f,
        codeBlocks: f.codeBlocks ? f.codeBlocks.filter(block => block.name !== draggedCodeBlock) : []
      }));
      setFiles(updatedFiles);
      setDraggedCodeBlock(null);
      // Update content for all files after removing code block
      files.forEach(file => setTimeout(() => updateFileContent(file.id), 0));
    }
  };

  const getUnassignedFunctions = () => {
    const assignedFunctions = files.flatMap(f => f.functions);
    return functions.filter(func => !assignedFunctions.includes(func));
  };

  const openRenameDialog = (fileId, currentName) => {
    setRenameDialog({ open: true, fileId, currentName });
  };

  const handleDoubleClick = (fileId, currentName) => {
    setEditingFile(fileId);
    // Remove .py extension for editing
    const nameWithoutExtension = currentName.replace(/\.py$/i, '');
    setEditingName(nameWithoutExtension);
  };

  const handleNameChange = (e) => {
    setEditingName(e.target.value);
  };

  const handleNameSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      if (editingName.trim()) {
        // Always append .py extension in lowercase
        const finalName = editingName.trim().toLowerCase() + '.py';
        setFiles(files.map(f => f.id === editingFile ? { ...f, name: finalName } : f));
        // Update content with new file name
        setTimeout(() => updateFileContent(editingFile), 0);
      }
      setEditingFile(null);
      setEditingName('');
    }
  };

  const handleNameCancel = (e) => {
    if (e.key === 'Escape') {
      setEditingFile(null);
      setEditingName('');
    }
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3, bgcolor: 'grey.100', minHeight: '100vh' }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'grey.300' }}>
        <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
          {'{Activity Title}'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The script below has grown too long for one file and could benefit from 
          refactoring. Use the interface below to sort its functions into files that fit 
          overarching functionality. You can assign functions to a file by dragging them, or 
          by using the context menu.
        </Typography>
      </Paper>

      {/* Main Content - Side by Side Layout */}
      <Box sx={{ display: 'flex', gap: 2, position: 'relative', alignItems: 'flex-start', minHeight: '600px' }}>
        {/* Left Side - Code Display */}
        <Box sx={{ flex: 1, position: 'relative', zIndex: 10, minWidth: 0 }}>
          <Paper elevation={2} sx={{ p: 2, bgcolor: 'grey.900', height: 'fit-content', position: 'sticky', top: '24px', zIndex: 10, width: '100%' }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2, fontSize: '1rem' }}>
              Example Script:
            </Typography>
            <Box
              sx={{
                borderRadius: 1,
                p: 1,
                maxHeight: 500,
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.65rem',
                display: 'flex',
                border: '2px solid #3182ce' // blue border
              }}
            >
              {/* Line Numbers */}
              <Box sx={{ 
                color: '#cbd5e0', // light grey for line numbers
                pr: 1, 
                borderRight: '1px solid #718096',
                mr: 1,
                userSelect: 'none',
                minWidth: '2rem',
                textAlign: 'right',
                flexShrink: 0
              }}>
                {exampleCode.split('\n').map((_, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      lineHeight: '1.4',
                      color: '#cbd5e0'
                    }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </div>
                ))}
              </Box>
              
              {/* Code Content */}
              <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <pre style={{ 
                  color: '#e2e8f0', 
                  margin: 0, 
                  whiteSpace: 'pre-wrap', 
                  lineHeight: '1.4',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}>
                  {exampleCode.split('\n').map((line, index) => {
                    let backgroundColor = 'transparent';
                    let groupLabel = '';
                    let isGroupStart = false;
                    let isGroupEnd = false;
                    
                    if (index >= 8 && index <= 20) {
                      backgroundColor = 'rgba(72, 187, 120, 0.3)'; // green background for lines 9-21
                      groupLabel = 'Group 2';
                      isGroupStart = index === 8;
                      isGroupEnd = index === 20;
                    } else if (index >= 23 && index <= 38) {
                      backgroundColor = 'rgba(139, 92, 246, 0.3)'; // purple background for lines 24-39
                      groupLabel = 'Group 1';
                      isGroupStart = index === 23;
                      isGroupEnd = index === 38;
                    }
                    
                    return (
                      <div key={index}>
                        {isGroupStart && (
                          <div
                            style={{
                              position: 'absolute',
                              left: '0',
                              right: '0',
                              height: `${(isGroupEnd ? index - (groupLabel === 'Group 2' ? 8 : 23) + 1 : (groupLabel === 'Group 2' ? 13 : 16)) * 1.4}em`,
                              backgroundColor: 'transparent',
                              cursor: 'move',
                              zIndex: 10,
                              border: '2px dashed transparent',
                              borderRadius: '4px'
                            }}
                            draggable
                            onDragStart={(e) => handleCodeBlockDragStart(e, groupLabel)}
                            onMouseEnter={(e) => {
                              e.target.style.border = '2px dashed rgba(255,255,255,0.5)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.border = '2px dashed transparent';
                            }}
                            title={`Drag ${groupLabel}`}
                          />
                        )}
                        <div
                          style={{
                            backgroundColor: backgroundColor,
                            padding: '0 4px',
                            margin: '0 -4px',
                            position: 'relative'
                          }}
                        >
                          {line}
                          {isGroupStart && (
                            <span style={{
                              position: 'absolute',
                              right: '10px',
                              top: '0',
                              color: backgroundColor.includes('72, 187, 120') ? '#48bb78' : '#8b5cf6',
                              fontWeight: 'bold',
                              fontSize: '0.65rem'
                            }}>
                              {groupLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </pre>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Right Side - File Management */}
        <Box sx={{ flex: 1, position: 'relative', zIndex: 1, minWidth: 0 }}>
          <Box sx={{ position: 'relative', zIndex: 1, minWidth: 0, width: '100%', maxWidth: '100%' }}>
            {/* File Tabs */}
            <Box sx={{ mb: 3 }}>
              <Tabs
                value={selectedFile}
                onChange={(e, newValue) => setSelectedFile(newValue)}
                variant="scrollable"
                scrollButtons="auto"
              >
              {files.map(file => (
                <Tab
                  key={file.id}
                  value={file.id}
                  label={
                    editingFile === file.id ? (
                      <TextField
                        value={editingName}
                        onChange={handleNameChange}
                        onKeyDown={(e) => {
                          handleNameSubmit(e);
                          handleNameCancel(e);
                        }}
                        onBlur={handleNameSubmit}
                        autoFocus
                        size="small"
                        variant="standard"
                        sx={{
                          '& .MuiInputBase-input': {
                            color: 'white',
                            fontSize: '0.875rem',
                            textAlign: 'center',
                            minWidth: '60px'
                          },
                          '& .MuiInput-underline:before': {
                            borderBottomColor: 'white'
                          },
                          '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                            borderBottomColor: 'white'
                          },
                          '& .MuiInput-underline:after': {
                            borderBottomColor: 'white'
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      file.name.toLowerCase()
                    )
                  }
                  onDoubleClick={() => handleDoubleClick(file.id, file.name.toLowerCase())}
                  sx={{
                    bgcolor: `${file.color}.main`,
                    color: 'white !important',
                    opacity: selectedFile === file.id ? 1 : 0.7,
                    mr: 1,
                    borderRadius: '4px 4px 0 0',
                    textTransform: 'lowercase',
                    '&.Mui-selected': {
                      color: 'white !important',
                    },
                    cursor: editingFile === file.id ? 'text' : 'pointer'
                  }}
                />
              ))}
            </Tabs>
            <Button
              onClick={addNewFile}
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ mt: 1, bgcolor: 'grey.600', '&:hover': { bgcolor: 'grey.700' } }}
            >
              NEW
            </Button>
          </Box>

          {/* File Content Area */}
          <Paper 
            elevation={2}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, selectedFile)}
            sx={{ 
              p: 4, 
              mb: 3, 
              minHeight: 650,
              maxHeight: 650,
              border: '2px dashed',
              borderColor: 'grey.400',
              bgcolor: 'white',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              overflow: 'hidden',
              width: '100%'
            }}
          >
            {/* Fixed Header Text */}
            <Box sx={{ 
              position: 'sticky',
              top: 0,
              bgcolor: 'white',
              zIndex: 3,
              pb: 1,
              mb: 2,
              borderBottom: '1px solid #e0e0e0'
            }}>
              <Typography variant="body2" color="text.secondary">
                Drag or paste function code here.
              </Typography>
            </Box>
            
            {/* Scrollable Content Area */}
            <Box sx={{ 
              flex: 1,
              overflow: 'auto',
              pr: 2,
              pl: 1
            }}>
              {/* Individual Functions */}
              {files.find(f => f.id === selectedFile)?.functions.map(functionName => (
                <Chip
                  key={functionName}
                  label={`${functionName}()`}
                  sx={{ m: 0.5, cursor: 'move' }}
                  color="primary"
                  variant="outlined"
                  draggable
                  onDragStart={(e) => handleDragStart(e, functionName)}
                />
              ))}
              
              {/* Code Blocks */}
              {files.find(f => f.id === selectedFile)?.codeBlocks?.map(block => (
                <Box key={block.name} sx={{ mb: 2 }}>
                  <Chip
                    label={block.name}
                    sx={{ mb: 1, cursor: 'move' }}
                    color="secondary"
                    variant="filled"
                    draggable
                    onDragStart={(e) => handleCodeBlockDragStart(e, block.name)}
                  />
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      bgcolor: '#1a1a1a', 
                      borderRadius: 1,
                      border: '1px solid #333',
                      maxHeight: 300,
                      overflow: 'auto'
                    }}
                  >
                    <pre style={{ 
                      color: '#e2e8f0', 
                      margin: 0, 
                      whiteSpace: 'pre-wrap', 
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      lineHeight: '1.4'
                    }}>
                      {block.content}
                    </pre>
                  </Paper>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Control Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 3 }}>
            <Button
              onClick={() => deleteFile(selectedFile)}
              variant="contained"
              startIcon={<DeleteIcon />}
              sx={{ bgcolor: 'grey.800', '&:hover': { bgcolor: 'grey.700' } }}
            >
              DELETE FILE
            </Button>
            
            {/* Continue Button - appears when there are at least 2 files */}
            {files.length >= 2 && (
              <Button
                variant="contained"
                size="large"
                sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  px: 3,
                  py: 1,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  '&:hover': { 
                    bgcolor: 'primary.dark' 
                  },
                  boxShadow: 2
                }}
                onClick={() => {
                  // Log all file contents with names
                  console.log('File contents saved in state:');
                  files.forEach(file => {
                    console.log(`\n=== ${file.name} ===`);
                    console.log(file.content || 'No content generated yet');
                    console.log('Functions:', file.functions);
                    console.log('Code Blocks:', file.codeBlocks);
                  });
                }}
              >
                CONTINUE
              </Button>
            )}
          </Box>
        </Box>
      </Box>

    </Box>
    </Box>
  );
}

export default CodeRefactoringInterface;
