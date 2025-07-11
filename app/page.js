'use client';

import React, { useState, useEffect } from 'react';
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
  Divider,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Help as HelpIcon,
  Delete as DeleteIcon,
  ColorLens as ColorLensIcon,
  Edit as EditIcon,
  Image as ImageIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  InsertDriveFile as InsertDriveFileIcon,
  CreateNewFolder as CreateNewFolderIcon,
  HelpOutline as HelpOutlineIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  MoreVert as MoreVertIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

// Custom Python icon component since MUI doesn't have one
const PythonFileIcon = () => (
  <Box sx={{ 
    width: 24, 
    height: 24, 
    backgroundColor: '#306998',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold'
  }}>
    PY
  </Box>
);

const CodeRefactoringInterface = () => {
  const router = useRouter();
  const [currentView, setCurrentView] = useState('refactoring'); // 'refactoring' or 'organize'
  const [files, setFiles] = useState([
    { id: 1, name: 'file 1.py', color: 'primary', functions: [], codeBlocks: [], content: '' }
  ]);
  
  const [selectedFile, setSelectedFile] = useState(1);
  const [draggedFunction, setDraggedFunction] = useState(null);
  const [draggedCodeBlock, setDraggedCodeBlock] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [renameDialog, setRenameDialog] = useState({ open: false, fileId: null, currentName: '' });
  
  const [showAllCode, setShowAllCode] = useState(true); // Default to showing all code
  
  // Code display controls
  const [fontSize, setFontSize] = useState(0.7); // Even smaller default font
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [codeMaxHeight, setCodeMaxHeight] = useState(1600); // Much larger default height
  
  // Organization view state
  const [organizationFiles, setOrganizationFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [draggedFile, setDraggedFile] = useState(null);
  const [contextMenu, setContextMenu] = useState({ mouseX: null, mouseY: null, item: null });
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [selectedOrgFile, setSelectedOrgFile] = useState(null);

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


def preprocess_image(raw_image, downsampling_factor, gaussian_sigma):
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

    plot_images(raw_images, processed_images)
`;

  const functions = [
    'load_image',
    'normalize_image', 
    'downsample_image',
    'smooth_image',
    'preprocess_image',
    'plot_images'
  ];

  const colors = ['primary', 'secondary', 'success', 'error', 'warning', 'info'];

  // Helper function to generate main.py content
  const generateMainPyContent = () => {
    const assignedFunctions = files.flatMap(f => f.functions);
    const assignedCodeBlocks = files.flatMap(f => f.codeBlocks?.map(block => block.name) || []);
    
    let mainContent = '';
    const lines = exampleCode.split('\n');
    
    // Add imports (lines 0-6)
    mainContent += lines.slice(0, 7).join('\n') + '\n\n';
    
    // Add import statements for refactored files
    const refactoredFiles = files.filter(f => f.functions.length > 0 || (f.codeBlocks && f.codeBlocks.length > 0));
    refactoredFiles.forEach(file => {
      const moduleName = file.name.replace('.py', '');
      if (file.functions.length > 0) {
        mainContent += `from ${moduleName} import ${file.functions.join(', ')}\n`;
      }
    });
    
    if (refactoredFiles.length > 0) {
      mainContent += '\n';
    }
    
    // Define function ranges in the original code
    const functionRanges = {
      'load_image': [8, 20],
      'normalize_image': [23, 30],
      'downsample_image': [32, 34],
      'smooth_image': [38, 40],
      'preprocess_image': [43, 48],
      'plot_images': [51, 64]
    };
    
    // Define code block ranges
    const codeBlockRanges = {
      'Group 2': [8, 20], 
      'Group 1': [23, 38],
      'Group 3': [47, 53],
      'Group 4': [57, 71]
    };
    
    // Create a set of all assigned line ranges to exclude
    const excludedLines = new Set();
    
    // Mark lines from assigned functions
    assignedFunctions.forEach(functionName => {
      if (functionRanges[functionName]) {
        const [start, end] = functionRanges[functionName];
        for (let i = start; i <= end; i++) {
          excludedLines.add(i);
        }
      }
    });
    
    // Mark lines from assigned code blocks
    assignedCodeBlocks.forEach(blockName => {
      if (codeBlockRanges[blockName]) {
        const [start, end] = codeBlockRanges[blockName];
        for (let i = start; i <= end; i++) {
          excludedLines.add(i);
        }
      }
    });
    
    // Add remaining code (lines 8-73) excluding assigned content
    let currentSection = '';
    let inAssignedSection = false;
    
    for (let i = 8; i < 74; i++) {
      const isExcluded = excludedLines.has(i);
      
      if (!isExcluded && inAssignedSection) {
        // We're transitioning from excluded to included content
        if (currentSection.trim()) {
          mainContent += currentSection + '\n';
        }
        currentSection = '';
        inAssignedSection = false;
      }
      
      if (!isExcluded) {
        currentSection += lines[i] + '\n';
      } else {
        inAssignedSection = true;
      }
    }
    
    // Add any remaining content
    if (currentSection.trim() && !inAssignedSection) {
      mainContent += currentSection + '\n';
    }
    
    // Always add the main execution block (lines 74 onwards)
    mainContent += lines.slice(74).join('\n');
    
    return mainContent;
  };

  // Code display control functions
  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 0.1, 1.2));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 0.1, 0.5));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const expandCodeHeight = () => {
    setCodeMaxHeight(prev => Math.min(prev + 300, 1800));
  };

  const showFullCode = () => {
    setShowAllCode(true);
    setCodeMaxHeight(1600);
  };

  const resetCodeDisplay = () => {
    setFontSize(0.7);
    setCodeMaxHeight(1600);
    setIsFullscreen(false);
    setShowAllCode(true);
  };

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
    } else if (groupName === 'Group 3') {
      return lines.slice(47, 54).join('\n'); // lines 48-54
    } else if (groupName === 'Group 4') {
      return lines.slice(57, 72).join('\n'); // lines 58-72
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

  // Initialize organization files when transitioning from refactoring to organize
  useEffect(() => {
    if (currentView === 'organize') {
      // Convert refactored files to project organization format
      const initialFiles = files.map(file => ({
        id: file.id,
        name: file.name,
        type: 'PY File',
        description: `Python script with ${file.functions.length} functions${file.codeBlocks?.length ? ` and ${file.codeBlocks.length} code blocks` : ''}`,
        folder: null,
        functions: file.functions || [],
        codeBlocks: file.codeBlocks || [],
        content: file.content || ''
      }));
      
      // Add main.py file with dynamic content
      const unassignedFunctions = getUnassignedFunctions();
      const unassignedCodeBlocks = ['Group 1', 'Group 2', 'Group 3', 'Group 4'].filter(group => 
        !files.some(f => f.codeBlocks?.some(block => block.name === group))
      );
      
      const mainFile = {
        id: 'main',
        name: 'main.py',
        type: 'PY File',
        description: `Main execution script with ${unassignedFunctions.length} unassigned functions${unassignedCodeBlocks.length > 0 ? `, ${unassignedCodeBlocks.length} unassigned code blocks,` : ''} and main execution logic. Automatically imports from refactored files.`,
        folder: null,
        functions: unassignedFunctions,
        codeBlocks: unassignedCodeBlocks.map(name => ({ name, content: '' })),
        content: generateMainPyContent()
      };
      
      // Add standard project files
      const standardFiles = [
        {
          id: 'init',
          name: '__init__.py',
          type: 'PY File',
          description: 'Python package initialization file',
          folder: null,
          functions: [],
          codeBlocks: []
        },
        {
          id: 'png',
          name: '201.png',
          type: 'IMG File',
          description: 'Image file',
          folder: null
        },
        {
          id: 'nd2',
          name: '201.nd2',
          type: 'DATA File',
          description: 'Microscopy data file',
          folder: null
        }
      ];
      
      const allFiles = [mainFile, ...standardFiles, ...initialFiles];
      setOrganizationFiles(allFiles);
      setSelectedOrgFile(allFiles[0]); // Select main.py by default
    }
  }, [currentView, files]);

  // Update main.py content when files change in organize view
  useEffect(() => {
    if (currentView === 'organize' && organizationFiles.length > 0) {
      const unassignedFunctions = getUnassignedFunctions();
      const unassignedCodeBlocks = ['Group 1', 'Group 2', 'Group 3', 'Group 4'].filter(group => 
        !files.some(f => f.codeBlocks?.some(block => block.name === group))
      );
      
      const updatedMainFile = {
        id: 'main',
        name: 'main.py',
        type: 'PY File',
        description: `Main execution script with ${unassignedFunctions.length} unassigned functions${unassignedCodeBlocks.length > 0 ? `, ${unassignedCodeBlocks.length} unassigned code blocks,` : ''} and main execution logic. Automatically imports from refactored files.`,
        folder: organizationFiles.find(f => f.id === 'main')?.folder || null,
        functions: unassignedFunctions,
        codeBlocks: unassignedCodeBlocks.map(name => ({ name, content: '' })),
        content: generateMainPyContent()
      };
      
      setOrganizationFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === 'main' ? updatedMainFile : file
        )
      );
    }
  }, [files, currentView]);
  
  // Organization view functions
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'PY File':
        return <PythonFileIcon />;
      case 'IMG File':
        return <ImageIcon sx={{ color: '#4CAF50' }} />;
      case 'DATA File':
        return <ImageIcon sx={{ color: '#FF9800' }} />;
      case 'TXT File':
        return <InsertDriveFileIcon sx={{ color: '#2196F3' }} />;
      default:
        return <InsertDriveFileIcon />;
    }
  };

  const getFileTypeLabel = (fileType) => {
    switch (fileType) {
      case 'PY File':
        return 'Python file';
      case 'IMG File':
        return 'Image file';
      case 'DATA File':
        return 'Data file';
      case 'TXT File':
        return 'Text file';
      default:
        return 'File';
    }
  };

  const handleFolderToggle = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setContextMenu({ 
      mouseX: e.clientX - 2, 
      mouseY: e.clientY - 4,
      item 
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ mouseX: null, mouseY: null, item: null });
  };

  const handleOrgFileClick = (file) => {
    setSelectedOrgFile(file);
    handleCloseContextMenu();
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const newFolder = {
        id: Date.now(),
        name: newFolderName.trim(),
        type: 'Folder',
        parent: null
      };
      setFolders([...folders, newFolder]);
      setExpandedFolders(new Set([...expandedFolders, newFolder.id]));
      setNewFolderName('');
      setNewFolderDialog(false);
    }
  };

  const handleFileDragStart = (e, file) => {
    setDraggedFile(file);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFileDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleFileDragEnter = (e, folderId) => {
    e.preventDefault();
    setDragOverFolder(folderId);
  };

  const handleFileDragLeave = (e) => {
    e.preventDefault();
    setDragOverFolder(null);
  };

  const handleFileDrop = (e, targetFolder) => {
    e.preventDefault();
    if (draggedFile && targetFolder) {
      setOrganizationFiles(organizationFiles.map(f => 
        f.id === draggedFile.id 
          ? { ...f, folder: targetFolder.id }
          : f
      ));
      setDraggedFile(null);
      setDragOverFolder(null);
    }
  };

  const moveFileToRoot = (fileId) => {
    setOrganizationFiles(organizationFiles.map(f => 
      f.id === fileId 
        ? { ...f, folder: null }
        : f
    ));
    handleCloseContextMenu();
  };

  const getFilesInFolder = (folderId) => {
    return organizationFiles.filter(f => f.folder === folderId);
  };

  const getRootFiles = () => {
    return organizationFiles.filter(f => f.folder === null);
  };

  const canProceed = () => {
    return folders.length > 0 && organizationFiles.some(f => f.folder !== null);
  };

  // Tree view rendering functions
  const renderFile = (file, level = 0, isLastChild = false, parentPath = []) => {
    const isSelected = selectedOrgFile?.id === file.id;
    const paddingLeft = 16 + (level * 24);
    const isMainFile = file.id === 'main';

    return (
      <Box
        key={file.id}
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pl: `${paddingLeft}px`,
          pr: 1,
          py: 0.5,
          cursor: 'pointer',
          bgcolor: isSelected ? 'primary.main' : 'transparent',
          color: isSelected ? 'white' : 'white',
          '&:hover': {
            bgcolor: isSelected ? 'primary.dark' : 'rgba(255,255,255,0.1)'
          },
          borderRadius: 1,
          mx: 0.5,
          border: isMainFile ? '2px solid #FFD700' : 'none',
          '&::before': level > 0 ? {
            content: '""',
            position: 'absolute',
            left: `${16 + (level - 1) * 24 + 12}px`,
            top: 0,
            bottom: isLastChild ? '50%' : 0,
            width: '1px',
            backgroundColor: 'rgba(255,255,255,0.3)',
            zIndex: 1
          } : {},
          '&::after': level > 0 ? {
            content: '""',
            position: 'absolute',
            left: `${16 + (level - 1) * 24 + 12}px`,
            top: '50%',
            width: '12px',
            height: '1px',
            backgroundColor: 'rgba(255,255,255,0.3)',
            zIndex: 1
          } : {}
        }}
        onClick={() => handleOrgFileClick(file)}
        onContextMenu={(e) => handleContextMenu(e, file)}
        draggable
        onDragStart={(e) => handleFileDragStart(e, file)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative', zIndex: 2 }}>
          {getFileIcon(file.type)}
          <Typography 
            variant="body2" 
            sx={{ 
              ml: 1, 
              fontSize: '0.85rem',
              fontWeight: isMainFile ? 'bold' : 'normal',
              color: isMainFile ? '#FFD700' : 'inherit'
            }}
          >
            {file.name}
          </Typography>
          {isMainFile && (
            <Typography 
              variant="caption" 
              sx={{ 
                ml: 1, 
                px: 1, 
                py: 0.25,
                bgcolor: '#FFD700',
                color: 'black',
                borderRadius: 1,
                fontSize: '0.65rem',
                fontWeight: 'bold'
              }}
            >
              MAIN
            </Typography>
          )}
        </Box>
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: '0.75rem',
            color: isSelected ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.6)',
            fontWeight: 500,
            minWidth: 'fit-content',
            position: 'relative',
            zIndex: 2
          }}
        >
          {getFileTypeLabel(file.type)}
        </Typography>
      </Box>
    );
  };

  const renderFolder = (folder, level = 0, isLastChild = false) => {
    const isExpanded = expandedFolders.has(folder.id);
    const folderFiles = getFilesInFolder(folder.id);
    const paddingLeft = 16 + (level * 24);
    const isDragOver = dragOverFolder === folder.id;
    
    return (
      <Box key={folder.id}>
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pl: `${paddingLeft}px`,
            pr: 1,
            py: 0.5,
            cursor: 'pointer',
            color: 'white',
            bgcolor: isDragOver ? 'rgba(255,255,255,0.2)' : 'transparent',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)'
            },
            borderRadius: 1,
            mx: 0.5,
            border: isDragOver ? '2px dashed rgba(255,255,255,0.5)' : '2px solid transparent',
            '&::before': level > 0 ? {
              content: '""',
              position: 'absolute',
              left: `${16 + (level - 1) * 24 + 12}px`,
              top: 0,
              bottom: isLastChild ? '50%' : 0,
              width: '1px',
              backgroundColor: 'rgba(255,255,255,0.3)',
              zIndex: 1
            } : {},
            '&::after': level > 0 ? {
              content: '""',
              position: 'absolute',
              left: `${16 + (level - 1) * 24 + 12}px`,
              top: '50%',
              width: '12px',
              height: '1px',
              backgroundColor: 'rgba(255,255,255,0.3)',
              zIndex: 1
            } : {}
          }}
          onClick={() => handleFolderToggle(folder.id)}
          onContextMenu={(e) => handleContextMenu(e, folder)}
          onDragOver={handleFileDragOver}
          onDragEnter={(e) => handleFileDragEnter(e, folder.id)}
          onDragLeave={handleFileDragLeave}
          onDrop={(e) => handleFileDrop(e, folder)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative', zIndex: 2 }}>
            <IconButton
              size="small"
              sx={{ 
                color: 'white', 
                p: 0.5,
                mr: 0.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
            </IconButton>
            {isExpanded ? (
              <FolderOpenIcon sx={{ color: '#FFD700', fontSize: '1.2rem' }} />
            ) : (
              <FolderIcon sx={{ color: '#FFD700', fontSize: '1.2rem' }} />
            )}
            <Typography variant="body2" sx={{ ml: 1, fontSize: '0.85rem' }}>
              {folder.name}
            </Typography>
          </Box>
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.6)',
              fontWeight: 500,
              minWidth: 'fit-content',
              position: 'relative',
              zIndex: 2
            }}
          >
            {folderFiles.length} files
          </Typography>
        </Box>
        
        {isExpanded && (
          <Box sx={{ position: 'relative' }}>
            {folderFiles.map((file, index) => {
              const isLastFile = index === folderFiles.length - 1;
              return renderFile(file, level + 1, isLastFile);
            })}
          </Box>
        )}
      </Box>
    );
  };

  const renderTreeView = () => {
    const rootFiles = getRootFiles();
    
    return (
      <Box sx={{ p: 1 }}>
        {/* Root level folders */}
        {folders.map(folder => renderFolder(folder, 0))}
        
        {/* Root level files */}
        {rootFiles.map(file => renderFile(file, 0))}
        
        {/* Placeholder for empty state */}
        {folders.length === 0 && rootFiles.length === 0 && (
          <Box sx={{ p: 2, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            <Typography variant="body2">
              No files to display
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  // Render organization view
  if (currentView === 'organize') {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3, bgcolor: 'grey.100', minHeight: '100vh' }}>
        {/* Header */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'grey.300' }}>
          <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
            {'{Activity Title}'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Zooming out, the project appears to have matured to a point at which it may prove 
            prudent to organize it a little. Use the interface below to investigate each file and 
            come up with ideas for how to organize the project. You can click on a file to learn 
            more about it. The <strong>main.py</strong> file contains the remaining unassigned code and main execution logic.
          </Typography>
        </Paper>

        {/* Main Content */}
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          {/* Left Side - Project Directory */}
          <Box sx={{ flex: 1 }}>
            <Paper elevation={2} sx={{ bgcolor: 'grey.800', color: 'white', mb: 2 }}>
              <Box sx={{ p: 2, bgcolor: 'black', color: 'white' }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                  PROJECT DIRECTORY
                </Typography>
              </Box>
              
              {/* Column Headers */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                px: 2,
                py: 1,
                bgcolor: 'grey.600',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                <Typography variant="body2" sx={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  fontSize: '0.85rem'
                }}>
                  Name
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  fontSize: '0.85rem'
                }}>
                  File Type
                </Typography>
              </Box>
              
              {/* Tree View */}
              <Box sx={{ bgcolor: 'grey.700', minHeight: 400, maxHeight: 600, overflow: 'auto' }}>
                {renderTreeView()}
              </Box>
            </Paper>
            
            {/* New Folder Button */}
            <Button
              variant="contained"
              startIcon={<CreateNewFolderIcon />}
              onClick={() => setNewFolderDialog(true)}
              sx={{ 
                bgcolor: 'black', 
                color: 'white',
                '&:hover': { bgcolor: 'grey.800' },
                mb: 2
              }}
            >
              NEW FOLDER
            </Button>
          </Box>

          {/* Right Side - File Details */}
          <Box sx={{ flex: 1 }}>
            <Card elevation={2} sx={{ p: 2, bgcolor: 'grey.300', minHeight: 400 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Click on a file for description
                </Typography>
                
                {selectedOrgFile ? (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" gutterBottom sx={{ mb: 0, mr: 1 }}>
                        {selectedOrgFile.name}
                      </Typography>
                      {selectedOrgFile.id === 'main' && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            px: 1, 
                            py: 0.25,
                            bgcolor: '#FFD700',
                            color: 'black',
                            borderRadius: 1,
                            fontSize: '0.65rem',
                            fontWeight: 'bold'
                          }}
                        >
                          MAIN SCRIPT
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {selectedOrgFile.type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedOrgFile.description}
                    </Typography>
                    
                    {selectedOrgFile.functions && selectedOrgFile.functions.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Functions:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {selectedOrgFile.functions.map(func => (
                            <Box 
                              key={func}
                              sx={{ 
                                bgcolor: 'primary.main', 
                                color: 'white', 
                                px: 1, 
                                py: 0.5, 
                                borderRadius: 1,
                                fontSize: '0.8rem'
                              }}
                            >
                              {func}()
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    {selectedOrgFile.codeBlocks && selectedOrgFile.codeBlocks.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Code Blocks:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {selectedOrgFile.codeBlocks.map(block => (
                            <Box 
                              key={block.name}
                              sx={{ 
                                bgcolor: 'secondary.main', 
                                color: 'white', 
                                px: 1, 
                                py: 0.5, 
                                borderRadius: 1,
                                fontSize: '0.8rem'
                              }}
                            >
                              {block.name}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    {selectedOrgFile.content && selectedOrgFile.type === 'PY File' && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          File Content:
                        </Typography>
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
                            {selectedOrgFile.content}
                          </pre>
                        </Paper>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a file to view its details
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Bottom Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="contained"
            onClick={() => setCurrentView('refactoring')}
            sx={{ 
              bgcolor: 'grey.600', 
              color: 'white',
              '&:hover': { bgcolor: 'grey.700' }
            }}
          >
            BACK TO REFACTORING
          </Button>
          
          <Button
            variant="contained"
            startIcon={<CheckCircleIcon />}
            disabled={!canProceed()}
            sx={{ 
              bgcolor: canProceed() ? 'grey.600' : 'grey.400',
              color: 'white',
              '&:hover': { 
                bgcolor: canProceed() ? 'grey.700' : 'grey.400' 
              }
            }}
            onClick={() => {
              console.log('Project organized successfully!');
              console.log('Files:', organizationFiles);
              console.log('Folders:', folders);
            }}
          >
            MUST ORGANIZE PROJECT TO PROCEED
          </Button>
        </Box>

        {/* Context Menu */}
        <Menu
          open={contextMenu.mouseX !== null}
          onClose={handleCloseContextMenu}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu.mouseX !== null && contextMenu.mouseY !== null
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
        >
          {contextMenu.item?.type === 'Folder' ? (
            <MenuItem onClick={handleCloseContextMenu}>
              <Typography variant="body2">Folder Options</Typography>
            </MenuItem>
          ) : (
            contextMenu.item && [
              <MenuItem key="details" onClick={() => {
                handleOrgFileClick(contextMenu.item);
                handleCloseContextMenu();
              }}>
                View Details
              </MenuItem>,
              contextMenu.item.folder && (
                <MenuItem key="move" onClick={() => moveFileToRoot(contextMenu.item.id)}>
                  Move to Root
                </MenuItem>
              )
            ].filter(Boolean)
          )}
        </Menu>

        {/* New Folder Dialog */}
        <Dialog open={newFolderDialog} onClose={() => setNewFolderDialog(false)}>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Folder Name"
              fullWidth
              variant="outlined"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNewFolderDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} variant="contained">
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Render refactoring view
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
          by using the context menu. Unassigned functions will remain in the main.py file.
        </Typography>
      </Paper>

      {/* Main Content - Side by Side Layout */}
      <Box sx={{ display: 'flex', gap: 3, position: 'relative', alignItems: 'flex-start', minHeight: '600px' }}>
        {/* Left Side - Code Display */}
        <Box sx={{ flex: 1.4, position: 'relative', zIndex: 10, minWidth: 0 }}>
          <Paper elevation={2} sx={{ p: 2, bgcolor: 'grey.900', height: 'fit-content', width: '100%' }}>
            {/* Code Display Header with Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: 'white', fontSize: '1rem' }}>
                Example Script: (69 lines of code, 110 lines total)
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#48bb78', fontSize: '0.7rem' }}>
                  Group 2
                </Typography>
                <Typography variant="caption" sx={{ color: '#8b5cf6', fontSize: '0.7rem' }}>
                  Group 1
                </Typography>
                <Typography variant="caption" sx={{ color: '#ff9f40', fontSize: '0.7rem' }}>
                  Group 3
                </Typography>
                <Typography variant="caption" sx={{ color: '#ff6384', fontSize: '0.7rem' }}>
                  Group 4
                </Typography>
              </Box>
            </Box>
            
            {/* Font Size and Display Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <IconButton onClick={decreaseFontSize} sx={{ color: 'white', p: 0.5 }}>
                  <ZoomOutIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ color: 'white', fontSize: '0.8rem', minWidth: '50px', textAlign: 'center' }}>
                  {Math.round(fontSize * 100)}%
                </Typography>
                <IconButton onClick={increaseFontSize} sx={{ color: 'white', p: 0.5 }}>
                  <ZoomInIcon fontSize="small" />
                </IconButton>
                <IconButton onClick={toggleFullscreen} sx={{ color: 'white', p: 0.5 }}>
                  {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                </IconButton>
              </Box>
            </Box>

            {/* Code Display Area */}
            <Box
              sx={{
                borderRadius: 1,
                p: 3,
                height: isFullscreen ? '90vh' : `${codeMaxHeight}px`,
                maxHeight: isFullscreen ? '90vh' : `${codeMaxHeight}px`,
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: `${fontSize}rem`,
                display: 'flex',
                border: '2px solid #3182ce',
                bgcolor: '#1a1a1a',
                width: '100%'
              }}
            >
              {/* Line Numbers */}
              <Box sx={{ 
                color: '#cbd5e0',
                pr: 3, 
                borderRight: '1px solid #718096',
                mr: 3,
                userSelect: 'none',
                minWidth: '3.5rem',
                textAlign: 'right',
                flexShrink: 0
              }}>
                {Array.from({length: 110}, (_, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      lineHeight: '1.4',
                      color: index < exampleCode.split('\n').length ? '#cbd5e0' : '#555',
                      minHeight: `${fontSize * 1.4}rem`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      padding: '1px 0'
                    }}
                  >
                    {String(index + 1).padStart(3, '0')}
                  </div>
                ))}
              </Box>
              
              {/* Code Content */}
              <Box sx={{ flex: 1, position: 'relative', overflow: 'visible' }}>
                <div style={{ 
                  color: '#e2e8f0', 
                  margin: 0, 
                  whiteSpace: 'pre-wrap', 
                  lineHeight: '1.4',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  fontFamily: 'monospace',
                  fontSize: `${fontSize}rem`
                }}>
                  {Array.from({length: 110}, (_, index) => {
                    const codeLines = exampleCode.split('\n');
                    const line = index < codeLines.length ? codeLines[index] : '';
                    
                    let backgroundColor = 'transparent';
                    let groupLabel = '';
                    let isGroupStart = false;
                    
                    if (index >= 8 && index <= 20) {
                      backgroundColor = 'rgba(72, 187, 120, 0.25)'; // Green
                      groupLabel = 'Group 2';
                      isGroupStart = index === 8;
                    } else if (index >= 23 && index <= 38) {
                      backgroundColor = 'rgba(139, 92, 246, 0.25)'; // Purple
                      groupLabel = 'Group 1';
                      isGroupStart = index === 23;
                    } else if (index >= 47 && index <= 53) {
                      backgroundColor = 'rgba(255, 159, 64, 0.25)'; // Orange
                      groupLabel = 'Group 3';
                      isGroupStart = index === 47;
                    } else if (index >= 57 && index <= 71) {
                      backgroundColor = 'rgba(255, 99, 132, 0.25)'; // Pink/Red
                      groupLabel = 'Group 4';
                      isGroupStart = index === 57;
                    }
                    
                    return (
                      <div key={index} style={{ position: 'relative' }}>
                        {isGroupStart && (
                          <div
                            style={{
                              position: 'absolute',
                              left: '-16px',
                              right: '-16px',
                              top: '-2px',
                              height: `${(groupLabel === 'Group 2' ? 13 : groupLabel === 'Group 1' ? 16 : groupLabel === 'Group 3' ? 7 : 15) * fontSize * 1.4 + 4}rem`,
                              backgroundColor: 'transparent',
                              cursor: 'move',
                              zIndex: 10,
                              border: '2px dashed transparent',
                              borderRadius: '6px',
                              pointerEvents: 'auto'
                            }}
                            draggable
                            onDragStart={(e) => handleCodeBlockDragStart(e, groupLabel)}
                            onMouseEnter={(e) => {
                              e.target.style.border = '2px dashed rgba(255,255,255,0.7)';
                              e.target.style.backgroundColor = 'rgba(255,255,255,0.08)';
                              e.target.style.boxShadow = '0 0 10px rgba(255,255,255,0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.border = '2px dashed transparent';
                              e.target.style.backgroundColor = 'transparent';
                              e.target.style.boxShadow = 'none';
                            }}
                            title={`Drag ${groupLabel} (${
                              groupLabel === 'Group 2' ? 'lines 9-21' : 
                              groupLabel === 'Group 1' ? 'lines 24-39' :
                              groupLabel === 'Group 3' ? 'lines 48-54' :
                              'lines 58-72'
                            })`}
                          />
                        )}
                        <div
                          style={{
                            backgroundColor: backgroundColor,
                            padding: '2px 16px',
                            margin: '0 -16px',
                            position: 'relative',
                            minHeight: `${fontSize * 1.4}rem`,
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '3px',
                            opacity: index < codeLines.length ? 1 : 0.3,
                            pointerEvents: isGroupStart ? 'none' : 'auto'
                          }}
                        >
                          <span style={{ flex: 1 }}>{line || ' '}</span>
                          {isGroupStart && (
                            <span style={{
                              position: 'absolute',
                              right: '20px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: backgroundColor.includes('72, 187, 120') ? '#48bb78' : 
                                     backgroundColor.includes('139, 92, 246') ? '#8b5cf6' :
                                     backgroundColor.includes('255, 159, 64') ? '#ff9f40' :
                                     '#ff6384',
                              fontWeight: 'bold',
                              fontSize: `${fontSize * 0.75}rem`,
                              backgroundColor: 'rgba(0,0,0,0.8)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid rgba(255,255,255,0.2)'
                            }}>
                              {groupLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Box>
            </Box>

            {/* Code Display Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={expandCodeHeight}
                size="small"
                sx={{ bgcolor: 'grey.700', '&:hover': { bgcolor: 'grey.600' } }}
              >
                Expand Height (+300px)
              </Button>
              <Button 
                variant="outlined" 
                onClick={resetCodeDisplay}
                size="small"
                sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'grey.400' } }}
              >
                Reset View
              </Button>
              <Typography variant="caption" sx={{ color: 'white', alignSelf: 'center', ml: 2 }}>
                Lines 1-69 contain code, lines 70-110 are empty
              </Typography>
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
                  Drag or paste function code here. Unassigned functions will remain in main.py.
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
                    // Store files for organization view
                    localStorage.setItem('refactoredFiles', JSON.stringify(files));
                    setCurrentView('organize');
                  }}
                >
                  CONTINUE TO ORGANIZE
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CodeRefactoringInterface;