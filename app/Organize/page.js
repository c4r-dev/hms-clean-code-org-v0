'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Image as ImageIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  InsertDriveFile as InsertDriveFileIcon,
  CreateNewFolder as CreateNewFolderIcon,
  HelpOutline as HelpOutlineIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  MoreVert as MoreVertIcon
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

const ProjectOrganizationPage = () => {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [draggedFile, setDraggedFile] = useState(null);
  const [contextMenu, setContextMenu] = useState({ mouseX: null, mouseY: null, item: null });
  const [dragOverFolder, setDragOverFolder] = useState(null);

  // Initialize with data from previous page or sample data
  useEffect(() => {
    // Try to get refactored files from localStorage
    const storedFiles = localStorage.getItem('refactoredFiles');
    let initialFiles = [];
    
    if (storedFiles) {
      try {
        const parsedFiles = JSON.parse(storedFiles);
        // Convert refactored files to project organization format
        initialFiles = parsedFiles.map(file => ({
          id: file.id,
          name: file.name,
          type: 'PY File',
          description: `Python script with ${file.functions.length} functions${file.codeBlocks?.length ? ` and ${file.codeBlocks.length} code blocks` : ''}`,
          folder: null,
          functions: file.functions || [],
          codeBlocks: file.codeBlocks || []
        }));
      } catch (error) {
        console.error('Error parsing stored files:', error);
      }
    }
    
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
    
    const allFiles = [...standardFiles, ...initialFiles];
    setFiles(allFiles);
    setSelectedFile(allFiles[0]);
  }, []);

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

  const handleFileClick = (file) => {
    setSelectedFile(file);
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

  const handleDragStart = (e, file) => {
    setDraggedFile(file);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, folderId) => {
    e.preventDefault();
    setDragOverFolder(folderId);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverFolder(null);
  };

  const handleDrop = (e, targetFolder) => {
    e.preventDefault();
    if (draggedFile && targetFolder) {
      setFiles(files.map(f => 
        f.id === draggedFile.id 
          ? { ...f, folder: targetFolder.id }
          : f
      ));
      setDraggedFile(null);
      setDragOverFolder(null);
    }
  };

  const moveFileToRoot = (fileId) => {
    setFiles(files.map(f => 
      f.id === fileId 
        ? { ...f, folder: null }
        : f
    ));
    handleCloseContextMenu();
  };

  // Tree view rendering functions
  const renderFile = (file, level = 0, isLastChild = false, parentPath = []) => {
    const isSelected = selectedFile?.id === file.id;
    const paddingLeft = 16 + (level * 24);

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
        onClick={() => handleFileClick(file)}
        onContextMenu={(e) => handleContextMenu(e, file)}
        draggable
        onDragStart={(e) => handleDragStart(e, file)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative', zIndex: 2 }}>
          {getFileIcon(file.type)}
          <Typography variant="body2" sx={{ ml: 1, fontSize: '0.85rem' }}>
            {file.name}
          </Typography>
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
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder)}
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

  const getFilesInFolder = (folderId) => {
    return files.filter(f => f.folder === folderId);
  };

  const getRootFiles = () => {
    return files.filter(f => f.folder === null);
  };

  const canProceed = () => {
    // Check if project has been organized (at least one folder created and files moved)
    return folders.length > 0 && files.some(f => f.folder !== null);
  };

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
          more about it.
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
              {selectedFile ? (
                <>
                  {/* Instruction text */}
                  <Typography variant="body2" sx={{ color: '#666', mb: 2, fontStyle: 'italic' }}>
                    Click to view description of a file
                  </Typography>
                  
                  {/* Header with file name and description */}
                  <Box sx={{ mb: 3, pb: 2, borderBottom: '2px solid #ddd' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', mb: 1 }}>
                      File Name: {selectedFile.name}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#555', lineHeight: 1.4 }}>
                      Description: {selectedFile.description}
                    </Typography>
                  </Box>
                  
                  <Box>
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {selectedFile.type}
                  </Typography>
                  
                  {selectedFile.functions && selectedFile.functions.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Functions:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedFile.functions.map(func => (
                          <Box 
                            key={func}
                            sx={{ 
                              bgcolor: '#64748b', 
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
                  
                  {selectedFile.codeBlocks && selectedFile.codeBlocks.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Code Blocks:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedFile.codeBlocks.map(block => (
                          <Box 
                            key={block}
                            sx={{ 
                              bgcolor: '#64748b', 
                              color: 'white', 
                              px: 1, 
                              py: 0.5, 
                              borderRadius: 1,
                              fontSize: '0.8rem'
                            }}
                          >
                            {block}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                  </Box>
                </>
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
          startIcon={<HelpOutlineIcon />}
          sx={{ 
            bgcolor: 'black', 
            color: 'white',
            '&:hover': { bgcolor: 'grey.800' }
          }}
        >
          NEED A HINT?
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
            // Here you would typically navigate to the next step
            console.log('Project organized successfully!');
            console.log('Files:', files);
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
              handleFileClick(contextMenu.item);
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
};

export default ProjectOrganizationPage;