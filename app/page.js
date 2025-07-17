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

// Enhanced code editor component with inline editing
const EnhancedCodeEditor = ({ content, onChange, disabled, editableLines }) => {
  const [hoveredLine, setHoveredLine] = useState(null);
  const [isEditingLine, setIsEditingLine] = useState(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [editingSegment, setEditingSegment] = useState(null);
  const lines = content.split('\n');
  
  const handleLineEdit = (lineNumber, newValue) => {
    const updatedLines = [...lines];
    updatedLines[lineNumber] = newValue;
    onChange(updatedLines.join('\n'));
  };

  const handleSegmentEdit = (lineNumber, segmentValue) => {
    const updatedLines = [...lines];
    const line = updatedLines[lineNumber];
    
    // Replace the content inside load_file() with the new value
    const updatedLine = line.replace(/load_file\(f"[^"]*"\)/, `load_file(f"${segmentValue}")`);
    updatedLines[lineNumber] = updatedLine;
    onChange(updatedLines.join('\n'));
  };
  
  const isEditableLine = (lineNumber) => {
    // If disabled, no lines are editable
    if (disabled) {
      return false;
    }
    // If editableLines is provided, use it; otherwise use default lines
    if (editableLines) {
      return editableLines.includes(lineNumber);
    }
    // Lines 6-9 and 38 are editable (0-indexed, so 5-8 and 37)
    return [5, 6, 7, 8, 37].includes(lineNumber);
  };

  const hasLoadFileCall = (lineNumber) => {
    return lines[lineNumber] && lines[lineNumber].includes('load_file(f"');
  };

  const getLoadFileSegment = (line) => {
    const match = line.match(/load_file\(f"([^"]*)"\)/);
    return match ? match[1] : '';
  };

  const getLoadFilePrefix = (line) => {
    const match = line.match(/load_file\(f"([^"]*){filename}"\)/);
    if (match) {
      const fullPath = match[1];
      return fullPath.replace('{filename}', '');
    }
    return '';
  };

  const renderLineWithInlineEdit = (line, lineNumber) => {
    if (hasLoadFileCall(lineNumber) && isEditableLine(lineNumber)) {
      const beforeLoadFile = line.substring(0, line.indexOf('load_file(f"'));
      const afterLoadFile = line.substring(line.indexOf('")') + 2);
      
      // Check if this line contains {filename} pattern
      if (line.includes('{filename}')) {
        const currentPrefix = getLoadFilePrefix(line);
        
        return (
          <span>
            {beforeLoadFile}
            <span style={{ color: '#e2e8f0' }}>load_file(f&lt;quot;&gt;</span>
            <span
              style={{
                backgroundColor: 'rgba(255, 215, 0, 0.2)',
                color: '#ffd700',
                padding: '2px 4px',
                borderRadius: '3px',
                cursor: 'text',
                border: '2px solid rgba(255, 215, 0, 0.5)',
                display: 'inline-block',
                minWidth: '120px',
                maxWidth: '200px',
                position: 'relative'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setEditingSegment(lineNumber);
              }}
              title="Click to edit the path prefix (e.g., add 'data\\' before filename)"
            >
              {editingSegment === lineNumber ? (
                <input
                  type="text"
                  value={currentPrefix}
                  onChange={(e) => {
                    const newPrefix = e.target.value;
                    const updatedLine = line.replace(
                      /load_file\(f"[^"]*{filename}"\)/,
                      `load_file(f"${newPrefix}{filename}")`
                    );
                    const updatedLines = [...lines];
                    updatedLines[lineNumber] = updatedLine;
                    onChange(updatedLines.join('\n'));
                  }}
                  onBlur={() => setEditingSegment(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      setEditingSegment(null);
                    }
                  }}
                  autoFocus
                  placeholder="data\\"
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffd700',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    width: '100%',
                    minWidth: '120px'
                  }}
                />
              ) : (
                <span>
                  {currentPrefix || (
                    <span style={{ 
                      color: 'rgba(255, 215, 0, 0.5)',
                      fontStyle: 'italic'
                    }}>
                      [path prefix]
                    </span>
                  )}
                </span>
              )}
            </span>
            <span style={{ color: '#e2e8f0' }}>{"{"}</span>
            <span style={{ color: '#8bc34a' }}>filename</span>
            <span style={{ color: '#e2e8f0' }}>{"}"}</span>
            <span style={{ color: '#e2e8f0' }}>{")"}</span>
            {afterLoadFile}
          </span>
        );
      } else {
        // Fallback for other load_file patterns
        const segmentValue = getLoadFileSegment(line);
        
        return (
          <span>
            {beforeLoadFile}
            <span style={{ color: '#e2e8f0' }}>load_file(f&lt;quot;&gt;</span>
            <span
              style={{
                backgroundColor: 'rgba(255, 215, 0, 0.2)',
                color: '#ffd700',
                padding: '2px 4px',
                borderRadius: '3px',
                cursor: 'text',
                border: '1px solid rgba(255, 215, 0, 0.5)',
                display: 'inline-block',
                minWidth: '150px',
                maxWidth: '300px'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setEditingSegment(lineNumber);
              }}
            >
              {editingSegment === lineNumber ? (
                <input
                  type="text"
                  value={segmentValue}
                  onChange={(e) => handleSegmentEdit(lineNumber, e.target.value)}
                  onBlur={() => setEditingSegment(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      setEditingSegment(null);
                    }
                  }}
                  autoFocus
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffd700',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    width: '100%',
                    minWidth: '150px'
                  }}
                />
              ) : (
                segmentValue || 'filename'
              )}
            </span>
            <span style={{ color: '#e2e8f0' }}>{")"}</span>
            {afterLoadFile}
          </span>
        );
      }
    } else if (line.includes('from ') && line.includes(' import ') && isEditableLine(lineNumber)) {
      // Handle import line with two editable blocks
      const fromIndex = line.indexOf('from ');
      const importIndex = line.indexOf(' import ');
      
      const beforeFrom = line.substring(0, fromIndex);
      const afterImport = line.substring(importIndex + 8);
      
      // Extract current values - handle empty spaces properly
      const modulePattern = /from\s+([^\s]*)\s+import/;
      const importPattern = /import\s+(.*)$/;
      
      const moduleNameMatch = line.match(modulePattern);
      const importItemsMatch = line.match(importPattern);
      
      const currentModuleName = moduleNameMatch ? moduleNameMatch[1] : '';
      const currentImportItems = importItemsMatch ? importItemsMatch[1].trim() : '';
      
      return (
        <span>
          {beforeFrom}
          <span style={{ color: '#e2e8f0' }}>from </span>
          <span
            style={{
              backgroundColor: 'rgba(255, 215, 0, 0.2)',
              color: '#ffd700',
              padding: '2px 4px',
              borderRadius: '3px',
              cursor: 'text',
              border: '2px solid rgba(255, 215, 0, 0.5)',
              display: 'inline-block',
              minWidth: '100px',
              maxWidth: '200px',
              marginRight: '4px'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setEditingSegment(`${lineNumber}-module`);
            }}
            title="Click to edit the module name"
          >
            {editingSegment === `${lineNumber}-module` ? (
              <input
                type="text"
                value={currentModuleName}
                onChange={(e) => {
                  const newModuleName = e.target.value;
                  const updatedLine = line.replace(
                    /from\s+[^\s]*\s+import/,
                    `from ${newModuleName} import`
                  );
                  const updatedLines = [...lines];
                  updatedLines[lineNumber] = updatedLine;
                  onChange(updatedLines.join('\n'));
                }}
                onBlur={() => setEditingSegment(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    setEditingSegment(null);
                  }
                }}
                autoFocus
                placeholder="module_name"
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffd700',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  width: '100%',
                  minWidth: '100px'
                }}
              />
            ) : (
              <span>
                {currentModuleName || (
                  <span style={{ 
                    color: 'rgba(255, 215, 0, 0.5)',
                    fontStyle: 'italic'
                  }}>
                    [module]
                  </span>
                )}
              </span>
            )}
          </span>
          <span style={{ color: '#e2e8f0' }}> import </span>
          <span
            style={{
              backgroundColor: 'rgba(255, 215, 0, 0.2)',
              color: '#ffd700',
              padding: '2px 4px',
              borderRadius: '3px',
              cursor: 'text',
              border: '2px solid rgba(255, 215, 0, 0.5)',
              display: 'inline-block',
              minWidth: '120px',
              maxWidth: '250px'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setEditingSegment(`${lineNumber}-import`);
            }}
            title="Click to edit the import items"
          >
            {editingSegment === `${lineNumber}-import` ? (
              <input
                type="text"
                value={currentImportItems}
                onChange={(e) => {
                  const newImportItems = e.target.value;
                  const updatedLine = line.replace(
                    /import\s+.*$/,
                    `import ${newImportItems}`
                  );
                  const updatedLines = [...lines];
                  updatedLines[lineNumber] = updatedLine;
                  onChange(updatedLines.join('\n'));
                }}
                onBlur={() => setEditingSegment(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    setEditingSegment(null);
                  }
                }}
                autoFocus
                placeholder="function1, function2"
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffd700',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  width: '100%',
                  minWidth: '120px'
                }}
              />
            ) : (
              <span>
                {currentImportItems || (
                  <span style={{ 
                    color: 'rgba(255, 215, 0, 0.5)',
                    fontStyle: 'italic'
                  }}>
                    [imports]
                  </span>
                )}
              </span>
            )}
          </span>
          {afterImport}
        </span>
      );
    }
    return line;
  };
  
  const handleLineClick = (lineNumber) => {
    if (isEditableLine(lineNumber) && !disabled) {
      setIsEditingLine(lineNumber);
    }
  };
  
  const handleLineKeyDown = (e, lineNumber) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setIsEditingLine(null);
    }
  };

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };
  
  return (
    <Box sx={{ 
      border: '2px solid #4a5568',
      borderRadius: '6px',
      overflow: 'hidden',
      display: 'flex',
      height: '500px',
      bgcolor: '#1a202c'
    }}>
      {/* Line Numbers Container */}
      <Box 
        sx={{ 
          color: '#a0aec0',
          borderRight: '2px solid #4a5568',
          userSelect: 'none',
          minWidth: '4rem',
          width: '4rem',
          textAlign: 'right',
          flexShrink: 0,
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          lineHeight: '1.4',
          bgcolor: '#2d3748',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <Box sx={{
          padding: '8px 8px 8px 4px',
          position: 'absolute',
          top: -scrollTop,
          left: 0,
          right: 0,
          minHeight: '100%'
        }}>
          {lines.map((_, index) => (
            <div 
              key={index}
              style={{ 
                height: '1.4em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                color: isEditableLine(index) ? '#ffd700' : '#a0aec0',
                fontWeight: isEditableLine(index) ? 'bold' : 'normal',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                lineHeight: '1.4',
                backgroundColor: isEditableLine(index) ? 'rgba(255, 215, 0, 0.1)' : 'transparent'
              }}
            >
              {String(index + 1).padStart(2, '0')}
              {isEditableLine(index) && (
                <Box
                  component="span"
                  sx={{
                    ml: 0.5,
                    color: '#ffd700',
                    fontSize: '0.6rem',
                    fontWeight: 'bold'
                  }}
                >
                  ✎
                </Box>
              )}
            </div>
          ))}
        </Box>
      </Box>
      
      {/* Code Content Container */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'auto' }} onScroll={handleScroll}>
        <Box sx={{ padding: '8px 12px' }}>
          {lines.map((line, index) => (
            <div
              key={index}
              style={{
                minHeight: '1.4em',
                lineHeight: '1.4',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: '#e2e8f0',
                backgroundColor: isEditableLine(index) ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                padding: '0 4px',
                borderRadius: '2px',
                position: 'relative',
                cursor: isEditableLine(index) && !disabled ? 'text' : 'default',
                border: isEditableLine(index) ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid transparent'
              }}
              onClick={() => handleLineClick(index)}
              onMouseEnter={() => setHoveredLine(index)}
              onMouseLeave={() => setHoveredLine(null)}
            >
              {isEditingLine === index ? (
                <input
                  type="text"
                  value={line}
                  onChange={(e) => handleLineEdit(index, e.target.value)}
                  onKeyDown={(e) => handleLineKeyDown(e, index)}
                  onBlur={() => setIsEditingLine(null)}
                  autoFocus
                  style={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#e2e8f0',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    lineHeight: '1.4'
                  }}
                />
              ) : (
                <>
                  {renderLineWithInlineEdit(line, index) || ' '}
                  {isEditableLine(index) && hoveredLine === index && !disabled && !hasLoadFileCall(index) && (
                    <Box
                      component="span"
                      sx={{
                        position: 'absolute',
                        right: '4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#ffd700',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: '1px 4px',
                        borderRadius: '2px',
                        pointerEvents: 'none'
                      }}
                    >
                      Click to edit
                    </Box>
                  )}
                </>
              )}
            </div>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

const CodeRefactoringInterface = () => {
  const router = useRouter();
  const [currentView, setCurrentView] = useState('refactoring'); // 'refactoring', 'organize', or 'final'
  const [files, setFiles] = useState([
    { id: 1, name: 'file 1.py', color: 'primary', functions: [], codeBlocks: [], content: '', functionsCode: {} }
  ]);
  
  const [selectedFile, setSelectedFile] = useState(1);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [functionBlocks, setFunctionBlocks] = useState([]);
  const [draggedFunction, setDraggedFunction] = useState(null);
  const [draggedCodeBlock, setDraggedCodeBlock] = useState(null);
  const [draggedFunctionBlock, setDraggedFunctionBlock] = useState(null);
  const [movedFunctions, setMovedFunctions] = useState(new Set()); // Track functions that have been moved
  const [editingFile, setEditingFile] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [renameDialog, setRenameDialog] = useState({ open: false, fileId: null, currentName: '' });
  
  const [showAllCode, setShowAllCode] = useState(true); // Default to showing all code
  
  // Code display controls
  const [fontSize, setFontSize] = useState(0.6); // Even smaller default font to show more lines
  const [isFullscreen, setIsFullscreen] = useState(true); // Start in fullscreen mode
  const [codeMaxHeight, setCodeMaxHeight] = useState(5000); // Much larger default height to show code up to line 222
  
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
  const [errorDialog, setErrorDialog] = useState({ open: false, message: '' });

  // Final view state
  const [finalView, setFinalView] = useState('directory'); // 'directory' or 'main'
  const [mainPyContent, setMainPyContent] = useState('');
  const [isMainPyEditable, setIsMainPyEditable] = useState(true);

  // File location tracking state
  const [fileLocations, setFileLocations] = useState({});

  // Editable lines state
  const [editableLines, setEditableLines] = useState({
    6: '',
    7: '',
    8: '',
    9: '',
    38: ''
  });

  // Import management state
  const [customImports, setCustomImports] = useState([
    { id: 1, module: 'tifffile', items: 'imread', enabled: true },
    { id: 2, module: '', items: '', enabled: true }
  ]);
  const [newImportModule, setNewImportModule] = useState('');
  const [newImportItems, setNewImportItems] = useState('');

  // Validation state
  const [validationResults, setValidationResults] = useState(null);
  const [showValidation, setShowValidation] = useState(false);

  // All useEffect hooks must be at the top, before any conditional logic
  
  // Initialize editable lines
  useEffect(() => {
    const lines = exampleCode.split('\n');
    setEditableLines({
      6: lines[6] || 'from tifffile import imread',
      7: lines[7] || ' ',
      8: 'from  import ',
      9: ' ',
      38: lines[38] || '    blur_factor = 1'
    });
  }, []);

  // Initialize first file content
  useEffect(() => {
    if (files.length > 0) {
      const firstFile = files[0];
      let content = `# ${firstFile.name}\n\n`;
      
      // Add functions content
      firstFile.functions.forEach(functionName => {
        if (firstFile.functionsCode && firstFile.functionsCode[functionName]) {
          // Use actual function code if available
          content += `${firstFile.functionsCode[functionName]}\n\n`;
        } else {
          // Fallback to placeholder code
          content += `# Function: ${functionName}\n`;
          content += `def ${functionName}():\n    # Implementation here\n    pass\n\n`;
        }
      });
      
      // Add code blocks content
      if (firstFile.codeBlocks && firstFile.codeBlocks.length > 0) {
        firstFile.codeBlocks.forEach(block => {
          content += `# ${block.name}\n`;
          content += `${block.content}\n\n`;
        });
      }
      
      // Update the file with the new content
      setFiles(prevFiles => prevFiles.map(f => f.id === firstFile.id ? { ...f, content } : f));
    }
  }, []);

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
      const unassignedCodeBlocks = ['Group 1', 'Group 2', 'Group 3'].filter(group => 
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
        content: generateMainPyContentWithEditableLines()
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
        },
        {
          id: 'nd2_tail',
          name: '20191010_tail_01.nd2',
          type: 'DATA File',
          description: 'Microscopy data file - tail experiment from 2019',
          folder: null
        },
        {
          id: 'qpdata',
          name: '20191010_tail_01.qpdata',
          type: 'DATA File',
          description: 'Quantitative phase data file',
          folder: null
        },
        {
          id: 'tif_vang',
          name: '20240523_Vang-1_37.tif',
          type: 'IMG File',
          description: 'TIFF image file - Vang experiment from 2024',
          folder: null
        },
        {
          id: 'citations',
          name: 'citations.txt',
          type: 'TXT File',
          description: 'Text file containing citations and references',
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
      const unassignedCodeBlocks = ['Group 1', 'Group 2', 'Group 3'].filter(group => 
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
        content: generateMainPyContentWithEditableLines()
      };
      
      setOrganizationFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === 'main' ? updatedMainFile : file
        )
      );
    }
  }, [files, currentView, editableLines]);

  // Initialize and update main.py content for final view
  useEffect(() => {
    if (currentView === 'final') {
      const newMainContent = generateMainPyContentWithEditableLines();
      setMainPyContent(newMainContent);
      
      // Auto-run validation after a short delay to give user feedback
      setTimeout(() => {
        validateImportsAndStructure();
      }, 1000);
    }
  }, [currentView, customImports, files]);

  // Initialize file locations when organization view loads
  useEffect(() => {
    if (currentView === 'organize' && organizationFiles.length > 0) {
      const initialLocations = updateFileLocations(organizationFiles, folders);
      setFileLocations(initialLocations);
      console.log('Initial file locations:', initialLocations);
    }
  }, [currentView, organizationFiles, folders]);

  // Update locations when files or folders change
  useEffect(() => {
    if (currentView === 'organize') {
      const newLocations = updateFileLocations(organizationFiles, folders);
      setFileLocations(newLocations);
    }
  }, [organizationFiles, folders, currentView]);

  // Function to parse code into function blocks
  const parseFunctionBlocks = (code) => {
    const lines = code.split('\n');
    const blocks = [];
    let currentBlock = null;
    let currentLines = [];
    
    console.log('parseFunctionBlocks called with', lines.length, 'lines');
    
    // Colors for different functions
    const colors = [
      '#8b5cf6', // Purple
      '#48bb78', // Green
      '#ff9f40', // Orange
      '#3182ce', // Blue
      '#ed8936', // Orange-red
      '#38b2ac', // Teal
      '#9f7aea', // Purple-light
      '#68d391', // Green-light
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is a function definition
      if (line.trim().startsWith('def ') && line.trim().endsWith(':')) {
        console.log('Found function definition at line', i, ':', line.trim());
        // Save previous block if exists
        if (currentBlock) {
          blocks.push({
            ...currentBlock,
            lines: currentLines,
            endLine: i - 1
          });
        }
        
        // Start new block
        const functionName = line.trim().match(/def\s+(\w+)/)?.[1] || 'unknown';
        currentBlock = {
          name: functionName,
          startLine: i,
          color: colors[blocks.length % colors.length],
          type: 'function'
        };
        currentLines = [line];
      } else if (currentBlock) {
        // Add line to current block
        currentLines.push(line);
        
        // Check if we've reached the end of the function (next function or end of code)
        if (i === lines.length - 1 || (lines[i + 1] && lines[i + 1].trim().startsWith('def ') && lines[i + 1].trim().endsWith(':'))) {
          blocks.push({
            ...currentBlock,
            lines: currentLines,
            endLine: i
          });
          currentBlock = null;
          currentLines = [];
        }
      }
    }
    
    console.log('parseFunctionBlocks returning', blocks.length, 'blocks:', blocks);
    return blocks;
  };

  const exampleCode = `import os.path
import numpy as np
from nd2reader import ND2Reader
from tifffile import imread
from pynwb import NWBHDF5IO
from scipy.ndimage import zoom, gaussian_filter
import matplotlib.pyplot as plt


def load_tif(file_path):
    microscopy_volume = imread(file_path)
    return microscopy_volume


def load_nd2(file_path):
    raw_data = ND2Reader(file_path)
    microscopy_volume = np.transpose(raw_data, (1, 2, 0))

    return microscopy_volume


def load_nwb(file_path):
    io_obj = NWBHDF5IO(file_path, mode="r")
    nwb_file = io_obj.read()

    image_data = nwb_file.acquisition['NeuroPALImageRaw'].data[:]
    rotated_image = np.transpose(image_data, (1, 0, 2, 3))

    rgb_channel_indices = nwb_file.acquisition['NeuroPALImageRaw'].RGBW_channels[:3]
    microscopy_volume = rotated_image[:, :, :, rgb_channel_indices]

    image_dtype = microscopy_volume.dtype
    maximum_integer_value = np.iinfo(image_dtype).max
    microscopy_volume = (microscopy_volume / maximum_integer_value) * 255

    io_obj.close()

    return microscopy_volume


def load_parameters(file_format):
    match file_format:
        case 'nd2':
            is_normalized = False
            is_mip = False
            is_cropped = False
            zoom_level = (1, 1)
            gaussian_sigma = 0

        case 'tif' | 'tiff':
            is_normalized = False
            is_mip = True
            is_cropped = False
            zoom_level = (0.35, 0.35, 1)
            gaussian_sigma = 0.3

        case 'nwb':
            is_normalized = False
            is_mip = False
            is_cropped = True
            zoom_level = (1, 0.75, 1)
            gaussian_sigma = 0

        case _:
            raise ValueError("Unknown file format!")

    return is_normalized, is_mip, is_cropped, zoom_level, gaussian_sigma


def load_file(path):
    if path.endswith('.nd2'):
        microscopy_data = load_nd2(path)
        is_normalized, is_mip, is_cropped, zoom_level, gaussian_sigma = load_parameters(file_format='nd2')

    elif path.endswith('.tiff') or path.endswith('.tif'):
        microscopy_data = load_tif(path)
        is_normalized, is_mip, is_cropped, zoom_level, gaussian_sigma = load_parameters(file_format='tiff')

    elif path.endswith('.nwb'):
        microscopy_data = load_nwb(path)
        is_normalized, is_mip, is_cropped, zoom_level, gaussian_sigma = load_parameters(file_format='nwb')

    else:
        raise ValueError(f"Unsupported file format: {path}")

    image_parameters = {
        'is_normalized': is_normalized,
        'is_mip': is_mip,
        'is_cropped': is_cropped,
        'downsampling_factor': zoom_level,
        'smooth_factor': gaussian_sigma
    }

    return microscopy_data, image_parameters


def maximally_project_image(image):
    dimensions = np.array(image.shape)

    if len(dimensions) < 4:
        z_index = np.argmin(dimensions)
    else:
        z_index = np.argpartition(dimensions, 1)[1]

    maximum_intensity_projection = np.max(image, axis=z_index)

    return maximum_intensity_projection


def normalize_image(image):
    lowest_pixel_value = np.min(image)
    highest_pixel_value = np.max(image)

    pixel_value_range = highest_pixel_value - lowest_pixel_value
    bottom_capped_image = image - lowest_pixel_value

    normalized_image = bottom_capped_image / pixel_value_range

    return normalized_image


def crop_background_border(image, background_percentile):
    bg = np.percentile(image, background_percentile)
    non_bg = image > bg

    row_indices = np.where(non_bg.any(axis=1))[0]
    col_indices = np.where(non_bg.any(axis=0))[0]

    row_slice = slice(row_indices[0], row_indices[-1] + 1)
    col_slice = slice(col_indices[0], col_indices[-1] + 1)

    return image[row_slice, col_slice]


def downsample_image(image, factor):
    image = zoom(image, factor)

    return image


def smooth_image(image, factor):
    image = gaussian_filter(image, sigma=factor)

    return image


def generate_comparison_plot(generated_images, output_path):
    num_images = len(generated_images)
    fig, axes = plt.subplots(1, num_images, figsize=(4 * num_images, 3))

    current_axes = 0
    for label, image in generated_images.items():
        axes[current_axes].imshow(image)
        axes[current_axes].set_title(label)
        current_axes += 1

    plt.savefig(output_path)


def plot_single_file(image):
    plt.imshow(image)
    return


def plot_multiple_files(filenames, images, output_path=None):
    num_images = len(images)
    fig, axes = plt.subplots(1, num_images, figsize=(4 * num_images, 3))

    for i in range(num_images):
        filename = filenames[i]
        image = images[i]

        axes[i].imshow(image)
        axes[i].set_title(filename)

    if output_path is not None:
        plt.savefig(output_path)

    plt.show()


if __name__ == "__main__":
    files = ['20191010_tail_01.nd2', '20240523_Vang-1_37.tif', 'sub-11-YAaLR_ophys.nwb']

    processed_images = []
    for filename in files:
        image, image_parameters = load_file(f"{filename}")
        processing_steps = {}

        if not image_parameters['is_mip']:
            image = maximally_project_image(image=image)
            processing_steps['maximum intensity projection'] = image

        if not image_parameters['is_normalized']:
            image = normalize_image(image)
            processing_steps['normalized'] = image

        if not image_parameters['is_cropped']:
            image = crop_background_border(image=image,
                                           background_percentile=98)
            processing_steps['cropped'] = image

        image = downsample_image(
            image=image,
            factor=image_parameters['downsampling_factor'])
        processing_steps['downsampled'] = image

        image = smooth_image(
            image=image,
            factor=image_parameters['smooth_factor'])
        processing_steps['smoothed'] = image

        file_identifier = filename.split('.')[0]
        generate_comparison_plot(
            generated_images=processing_steps,
            output_path=f"{file_identifier}_comparison.png")

        processed_images.append(image)

    plot_multiple_files(filenames=files,
                        images=processed_images,
                        output_path=f"overview.png")
`;

  // Update function blocks state when component mounts
  useEffect(() => {
    const blocks = parseFunctionBlocks(exampleCode);
    setFunctionBlocks(blocks);
  }, []);

  const functions = [
    'load_tif',
    'load_nd2',
    'load_nwb',
    'load_parameters',
    'load_file',
    'maximally_project_image',
    'normalize_image',
    'crop_background_border',
    'downsample_image',
    'smooth_image',
    'generate_comparison_plot',
    'plot_single_file',
    'plot_multiple_files'
  ];

  const colors = ['primary', 'secondary', 'success', 'error', 'warning', 'info'];

  // Organization view functions - moved up before useEffect hooks
  const getFilesInFolder = (folderId) => {
    return organizationFiles.filter(f => f.folder === folderId);
  };

  const getRootFiles = () => {
    return organizationFiles.filter(f => f.folder === null);
  };

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

  // File location tracking functions
  const buildFilePath = (file, folders) => {
    if (!file.folder) {
      return '/'; // Root directory
    }
    
    const folder = folders.find(f => f.id === file.folder);
    if (!folder) {
      return '/';
    }
    
    // Build the full path by traversing up the folder hierarchy
    let path = '';
    let currentFolder = folder;
    
    while (currentFolder) {
      path = `/${currentFolder.name}${path}`;
      currentFolder = folders.find(f => f.id === currentFolder.parent);
    }
    
    return path || '/';
  };

  // Import management functions
  const addNewImport = () => {
    if (newImportModule.trim() && newImportItems.trim()) {
      const newImport = {
        id: Date.now(),
        module: newImportModule.trim(),
        items: newImportItems.trim(),
        enabled: true
      };
      setCustomImports(prev => [...prev, newImport]);
      setNewImportModule('');
      setNewImportItems('');
    }
  };

  const removeImport = (importId) => {
    setCustomImports(prev => prev.filter(imp => imp.id !== importId));
  };

  const toggleImport = (importId) => {
    setCustomImports(prev => 
      prev.map(imp => 
        imp.id === importId ? { ...imp, enabled: !imp.enabled } : imp
      )
    );
  };

  const updateImport = (importId, field, value) => {
    setCustomImports(prev =>
      prev.map(imp =>
        imp.id === importId ? { ...imp, [field]: value } : imp
      )
    );
  };

  // Simplified validation function
  const validateImportsAndStructure = () => {
    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      successes: []
    };

    try {
      // Get current file structure
      const fileStructureJson = exportFileStructure();
      const fileStructure = JSON.parse(fileStructureJson);

      // Find folders that contain files (our created/moved files)
      const foldersWithFiles = [];
      fileStructure.files.forEach(file => {
        if (!file.isInRoot && file.fileId !== 'main' && file.folderName) {
          if (!foldersWithFiles.includes(file.folderName)) {
            foldersWithFiles.push(file.folderName);
          }
        }
      });

      // Get our custom import statements (ignore built-in imports)
      const customImportModules = customImports
        .filter(imp => imp.enabled && imp.module && imp.items)
        .filter(imp => !['tifffile', 'nd2reader', 'pynwb', 'scipy.ndimage', 'matplotlib.pyplot', 'numpy', 'os.path'].includes(imp.module))
        .map(imp => imp.module);

      // Simple validation: do our import modules match our folder names?
      if (foldersWithFiles.length === 0) {
        results.warnings.push('No files have been organized into folders yet.');
      } else if (customImportModules.length === 0) {
        results.errors.push(`You have files organized in ${foldersWithFiles.length} folder(s) (${foldersWithFiles.join(', ')}) but no custom import statements to import from them.`);
        results.isValid = false;
      } else {
        // Check each folder has a matching import
        foldersWithFiles.forEach(folderName => {
          if (customImportModules.includes(folderName)) {
            results.successes.push(`✓ Folder "${folderName}" has matching import statement`);
          } else {
            results.errors.push(`✗ Folder "${folderName}" contains files but has no import statement`);
            results.isValid = false;
          }
        });

        // Check each import has a matching folder
        customImportModules.forEach(moduleName => {
          if (!foldersWithFiles.includes(moduleName)) {
            results.warnings.push(`⚠ Import "from ${moduleName} import ..." doesn't match any folder name`);
          }
        });

        // Summary
        if (results.isValid) {
          results.successes.push(`✓ All ${foldersWithFiles.length} folder(s) have corresponding import statements`);
        }
      }

    } catch (error) {
      results.errors.push(`Validation error: ${error.message}`);
      results.isValid = false;
    }

    setValidationResults(results);
    setShowValidation(true);
    
    // Auto-hide after 8 seconds if successful
    if (results.isValid && results.errors.length === 0) {
      setTimeout(() => {
        setShowValidation(false);
      }, 8000);
    }
    
    return results;
  };

  // Enhanced helper function to generate main.py content with editable lines
  const generateMainPyContentWithEditableLines = () => {
    const assignedCodeBlocks = files.flatMap(f => f.codeBlocks?.map(block => block.name) || []);
    
    let mainContent = '';
    const lines = exampleCode.split('\n');
    
    // Add initial imports (lines 0-5)
    mainContent += lines.slice(0, 6).join('\n') + '\n';
    
    // Add custom imports
    customImports.forEach(imp => {
      if (imp.enabled && imp.module && imp.items) {
        mainContent += `from ${imp.module} import ${imp.items}\n`;
      }
    });
    
    // Add a blank line after imports
    mainContent += '\n';
    
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
    
    // Define code block ranges based on current highlighting (adjusted for new lines)
    const codeBlockRanges = {
      'Group 1': [9, 66], // Lines 010-067 (load functions only)
      'Group 2': [96, 143], // Lines 097-144 (image processing functions)
      'Group 3': [146, 178] // Lines 147-179 (plotting functions)
    };
    
    // Create a set of all assigned line ranges to exclude
    const excludedLines = new Set();
    
    // Mark lines from assigned code blocks
    assignedCodeBlocks.forEach(blockName => {
      if (codeBlockRanges[blockName]) {
        const [start, end] = codeBlockRanges[blockName];
        for (let i = start; i <= end; i++) {
          excludedLines.add(i);
        }
      }
    });
    
    // Process all lines from line 9 to the end (excluding the main execution block)
    // Skip the first few lines since we've already added them above
    for (let i = 11; i < 181; i++) { // Start from line 11 to account for the new lines we added
      const originalLineIndex = i - 2; // Adjust for the 2 new lines we added
      const isExcluded = excludedLines.has(originalLineIndex);
      
      if (!isExcluded && lines[originalLineIndex] !== undefined) {
        // Add editable line 38 if we reach it (adjusted for new lines)
        if (originalLineIndex === 38) {
          mainContent += (lines[originalLineIndex] || '    blur_factor = 1') + '\n';
        } else {
          mainContent += lines[originalLineIndex] + '\n';
        }
      }
    }
    
    // Always add the main execution block (lines 181 onwards) with editable load_file line
    mainContent += '\n';
    for (let i = 181; i < lines.length; i++) {
      if (lines[i] !== undefined) {
        let line = lines[i];
        // Make the load_file line editable by ensuring it has the {filename} pattern
        if (line.includes('load_file(f"{filename}")')) {
          line = '        image, image_parameters = load_file(f"{filename}")';
        }
        mainContent += line + '\n';
      }
    }
    
    return mainContent;
  };

  // Render final view
  if (currentView === 'final') {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3, bgcolor: 'grey.100', minHeight: '100vh' }}>
        {/* Header */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'grey.300' }}>
          <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
            {'{Activity Title}'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Some of the changes you&apos;ve made require that you update main.py to ensure that 
            any imports and file paths reflect your new directory structure. This is okay, and a{' '}
            <strong>totally normal part of refactoring!</strong> Click into the main.py tab to update the script.
          </Typography>
        </Paper>

        {/* Tab Navigation */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant={finalView === 'main' ? 'contained' : 'outlined'}
            onClick={() => setFinalView('main')}
            sx={{ 
              mr: 2,
              bgcolor: finalView === 'main' ? 'grey.800' : 'transparent',
              color: finalView === 'main' ? 'white' : 'black',
              '&:hover': {
                bgcolor: finalView === 'main' ? 'grey.700' : 'grey.200'
              }
            }}
          >
            MAIN.PY
          </Button>
          <Button
            variant={finalView === 'directory' ? 'contained' : 'outlined'}
            onClick={() => setFinalView('directory')}
            sx={{ 
              bgcolor: finalView === 'directory' ? 'grey.800' : 'transparent',
              color: finalView === 'directory' ? 'white' : 'black',
              '&:hover': {
                bgcolor: finalView === 'directory' ? 'grey.700' : 'grey.200'
              }
            }}
          >
            PROJECT DIRECTORY
          </Button>
        </Box>

        {/* Directory View */}
        {finalView === 'directory' && (
          <Paper elevation={2} sx={{ bgcolor: 'grey.800', color: 'white' }}>
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
            
            {/* File List */}
            <Box sx={{ bgcolor: 'grey.700', minHeight: 300, p: 2 }}>
              {/* Show organized files */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                  Root Directory:
                </Typography>
                {getRootFiles().map(file => (
                  <Box key={file.id} sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 0.5,
                    px: 1,
                    bgcolor: file.id === 'main' ? 'rgba(255, 215, 0, 0.2)' : 'transparent',
                    border: file.id === 'main' ? '1px solid #FFD700' : 'none',
                    borderRadius: 1,
                    mb: 0.5
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getFileIcon(file.type)}
                      <Typography variant="body2" sx={{ ml: 1, color: file.id === 'main' ? '#FFD700' : 'white' }}>
                        {file.name}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      {getFileTypeLabel(file.type)}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Show folders and their contents */}
              {folders.map(folder => (
                <Box key={folder.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FolderIcon sx={{ color: '#FFD700', mr: 1 }} />
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {folder.name}/
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 3 }}>
                    {getFilesInFolder(folder.id).map(file => (
                      <Box key={file.id} sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 0.5,
                        px: 1,
                        mb: 0.5
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getFileIcon(file.type)}
                          <Typography variant="body2" sx={{ ml: 1, color: 'white' }}>
                            {file.name}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {getFileTypeLabel(file.type)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        {/* Main.py View */}
        {finalView === 'main' && (
          <Box>
            <Paper elevation={2} sx={{ mb: 2, bgcolor: 'grey.800', color: 'white' }}>
              <Box sx={{ p: 2, bgcolor: 'black', color: 'white' }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                  Main.py Tab
                </Typography>
              </Box>
              
              {/* Import Manager Section */}
              <Box sx={{ 
                p: 2, 
                bgcolor: 'rgba(33, 150, 243, 0.1)', 
                borderLeft: '4px solid #2196F3',
                mb: 2
              }}>
                <Typography variant="h6" sx={{ color: '#2196F3', fontWeight: 'bold', mb: 2 }}>
                  📦 Import Manager
                </Typography>
                
                {/* Current Imports */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: '#2196F3', mb: 1 }}>
                    Current Import Statements:
                  </Typography>
                  
                  {customImports.map((imp, index) => (
                    <Box key={imp.id} sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      mb: 1,
                      p: 1,
                      bgcolor: imp.enabled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 1,
                      border: imp.enabled ? '1px solid #2196F3' : '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <Typography variant="body2" sx={{ color: 'white', minWidth: '40px' }}>
                        {index + 7}:
                      </Typography>
                      
                      <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                        from
                      </Typography>
                      
                      <TextField
                        value={imp.module}
                        onChange={(e) => updateImport(imp.id, 'module', e.target.value)}
                        placeholder="module_name"
                        size="small"
                        variant="outlined"
                        sx={{
                          minWidth: '120px',
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            color: '#ffd700',
                            fontSize: '0.8rem',
                            '& fieldset': { borderColor: 'rgba(255, 215, 0, 0.5)' },
                            '&:hover fieldset': { borderColor: '#ffd700' },
                            '&.Mui-focused fieldset': { borderColor: '#ffd700' }
                          },
                          '& .MuiInputBase-input': { color: '#ffd700' }
                        }}
                      />
                      
                      <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                        import
                      </Typography>
                      
                      <TextField
                        value={imp.items}
                        onChange={(e) => updateImport(imp.id, 'items', e.target.value)}
                        placeholder="function1, function2"
                        size="small"
                        variant="outlined"
                        sx={{
                          minWidth: '160px',
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            color: '#ffd700',
                            fontSize: '0.8rem',
                            '& fieldset': { borderColor: 'rgba(255, 215, 0, 0.5)' },
                            '&:hover fieldset': { borderColor: '#ffd700' },
                            '&.Mui-focused fieldset': { borderColor: '#ffd700' }
                          },
                          '& .MuiInputBase-input': { color: '#ffd700' }
                        }}
                      />
                      
                      <IconButton
                        onClick={() => toggleImport(imp.id)}
                        size="small"
                        sx={{ 
                          color: imp.enabled ? '#4CAF50' : '#9E9E9E',
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                        }}
                        title={imp.enabled ? 'Disable import' : 'Enable import'}
                      >
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                      
                      <IconButton
                        onClick={() => removeImport(imp.id)}
                        size="small"
                        sx={{ 
                          color: '#f44336',
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                        }}
                        title="Remove import"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
                
                {/* Add New Import */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 2,
                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                  borderRadius: 1,
                  border: '1px dashed #4CAF50'
                }}>
                  <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                    Add:
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                    from
                  </Typography>
                  
                  <TextField
                    value={newImportModule}
                    onChange={(e) => setNewImportModule(e.target.value)}
                    placeholder="module_name"
                    size="small"
                    variant="outlined"
                    sx={{
                      minWidth: '120px',
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        color: '#4CAF50',
                        fontSize: '0.8rem',
                        '& fieldset': { borderColor: 'rgba(76, 175, 80, 0.5)' },
                        '&:hover fieldset': { borderColor: '#4CAF50' },
                        '&.Mui-focused fieldset': { borderColor: '#4CAF50' }
                      },
                      '& .MuiInputBase-input': { color: '#4CAF50' }
                    }}
                  />
                  
                  <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                    import
                  </Typography>
                  
                  <TextField
                    value={newImportItems}
                    onChange={(e) => setNewImportItems(e.target.value)}
                    placeholder="function1, function2"
                    size="small"
                    variant="outlined"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addNewImport();
                      }
                    }}
                    sx={{
                      minWidth: '160px',
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        color: '#4CAF50',
                        fontSize: '0.8rem',
                        '& fieldset': { borderColor: 'rgba(76, 175, 80, 0.5)' },
                        '&:hover fieldset': { borderColor: '#4CAF50' },
                        '&.Mui-focused fieldset': { borderColor: '#4CAF50' }
                      },
                      '& .MuiInputBase-input': { color: '#4CAF50' }
                    }}
                  />
                  
                                     <Button
                     onClick={addNewImport}
                     variant="contained"
                     size="small"
                     disabled={!newImportModule.trim() || !newImportItems.trim()}
                     sx={{
                       bgcolor: '#4CAF50',
                       '&:hover': { bgcolor: '#45a049' },
                       '&:disabled': { bgcolor: 'rgba(76, 175, 80, 0.3)' }
                     }}
                   >
                     Add Import
                   </Button>
                 </Box>
                 
                 {/* Validation Section */}
                 <Box sx={{ 
                   display: 'flex', 
                   justifyContent: 'space-between',
                   alignItems: 'center',
                   mt: 2,
                   pt: 2,
                   borderTop: '1px solid rgba(255, 255, 255, 0.2)'
                 }}>
                   <Typography variant="body2" sx={{ color: '#2196F3', fontWeight: 'bold' }}>
                     🔍 Validate Import Structure
                   </Typography>
                   
                   <Button
                     onClick={validateImportsAndStructure}
                     variant="contained"
                     size="medium"
                     sx={{
                       bgcolor: '#FF9800',
                       color: 'white',
                       fontWeight: 'bold',
                       '&:hover': { bgcolor: '#F57C00' }
                     }}
                   >
                     Validate Imports & Structure
                   </Button>
                 </Box>
                              </Box>
               
               {/* Validation Results */}
               {showValidation && validationResults && (
                 <Box sx={{ 
                   p: 2, 
                   bgcolor: validationResults.isValid 
                     ? 'rgba(76, 175, 80, 0.1)' 
                     : 'rgba(244, 67, 54, 0.1)',
                   borderLeft: `4px solid ${validationResults.isValid ? '#4CAF50' : '#f44336'}`,
                   mb: 2,
                   position: 'relative'
                 }}>
                   <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                     <Typography variant="h6" sx={{ 
                       color: validationResults.isValid ? '#4CAF50' : '#f44336', 
                       fontWeight: 'bold',
                       display: 'flex',
                       alignItems: 'center',
                       gap: 1
                     }}>
                       {validationResults.isValid ? '✅ Validation Passed!' : '❌ Validation Failed'}
                     </Typography>
                     
                     <IconButton
                       onClick={() => setShowValidation(false)}
                       size="small"
                       sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                     >
                       <DeleteIcon fontSize="small" />
                     </IconButton>
                   </Box>
                   
                   {/* Success Messages */}
                   {validationResults.successes.length > 0 && (
                     <Box sx={{ mb: 2 }}>
                                               <Typography variant="subtitle2" sx={{ color: '#4CAF50', fontWeight: 'bold', mb: 1 }}>
                          ✅ What&apos;s Working:
                        </Typography>
                       {validationResults.successes.map((success, index) => (
                         <Typography key={index} variant="body2" sx={{ 
                           color: '#4CAF50', 
                           ml: 2, 
                           mb: 0.5,
                           fontSize: '0.85rem'
                         }}>
                           {success}
                         </Typography>
                       ))}
                     </Box>
                   )}
                   
                   {/* Error Messages */}
                   {validationResults.errors.length > 0 && (
                     <Box sx={{ mb: 2 }}>
                       <Typography variant="subtitle2" sx={{ color: '#f44336', fontWeight: 'bold', mb: 1 }}>
                         ❌ Issues Found:
                       </Typography>
                       {validationResults.errors.map((error, index) => (
                         <Typography key={index} variant="body2" sx={{ 
                           color: '#f44336', 
                           ml: 2, 
                           mb: 0.5,
                           fontSize: '0.85rem'
                         }}>
                           • {error}
                         </Typography>
                       ))}
                     </Box>
                   )}
                   
                   {/* Warning Messages */}
                   {validationResults.warnings.length > 0 && (
                     <Box sx={{ mb: 2 }}>
                       <Typography variant="subtitle2" sx={{ color: '#FF9800', fontWeight: 'bold', mb: 1 }}>
                         ⚠️ Warnings:
                       </Typography>
                       {validationResults.warnings.map((warning, index) => (
                         <Typography key={index} variant="body2" sx={{ 
                           color: '#FF9800', 
                           ml: 2, 
                           mb: 0.5,
                           fontSize: '0.85rem'
                         }}>
                           • {warning}
                         </Typography>
                       ))}
                     </Box>
                   )}
                   
                   
                 </Box>
               )}
               
               {/* Editable Lines Info Banner */}
              <Box sx={{ 
                p: 2, 
                bgcolor: 'rgba(255, 215, 0, 0.1)', 
                borderLeft: '4px solid #ffd700',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <EditIcon sx={{ color: '#ffd700', fontSize: '1.2rem' }} />
                <Typography variant="body2" sx={{ color: '#ffd700', fontWeight: 'bold' }}>
                  💡 Additional editable sections:<br />
                  • Load file line: Click the highlighted path area to add a folder path (e.g., &quot;data\\&quot;) before the filename
                </Typography>
              </Box>

              {/* Enhanced Code Editor */}
              <Box sx={{ p: 2, bgcolor: 'grey.900' }}>
                <EnhancedCodeEditor
                  content={mainPyContent}
                  onChange={setMainPyContent}
                  disabled={false}
                  editableLines={(() => {
                    const lines = mainPyContent.split('\n');
                    const editableIndexes = [];
                    
                    // Find line with load_file call containing {filename}
                    for (let i = 0; i < lines.length; i++) {
                      if (lines[i].includes('load_file(f"') && lines[i].includes('{filename}')) {
                        editableIndexes.push(i);
                        break;
                      }
                    }
                    
                    return editableIndexes;
                  })()}
                />
              </Box>
              
              {/* Control Buttons */}
              <Box sx={{ p: 2, bgcolor: 'grey.800', display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="contained"
                  sx={{ 
                    bgcolor: 'grey.700',
                    color: 'white',
                    '&:hover': { bgcolor: 'grey.600' }
                  }}
                >
                  EXPAND SCRIPT
                </Button>
                
                <Button
                  variant="contained"
                  sx={{ 
                    bgcolor: 'black',
                    color: 'white',
                    '&:hover': { bgcolor: 'grey.800' }
                  }}
                >
                  EXECUTE SCRIPT
                </Button>
              </Box>
            </Paper>
            
            {/* Help Text */}
            <Paper elevation={1} sx={{ p: 2, bgcolor: 'rgba(255, 192, 203, 0.1)', border: '1px solid rgba(255, 192, 203, 0.3)' }}>
              <Typography variant="body2" sx={{ color: 'deeppink', fontWeight: 'bold' }}>
                Student should be able to switch between directory view & main.py at any point. Main.py should be editable.
                The Import Manager allows students to dynamically add, remove, and edit import statements at the top of the file. 
                The path prefix area in load_file() is highlighted and editable - click on these areas to modify the code.
                Students can enable/disable imports and see real-time updates in the code editor.
                The validation system checks that import statements correctly match the organized file structure.
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Bottom Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => setCurrentView('organize')}
            sx={{ 
              color: 'grey.600',
              borderColor: 'grey.600',
              '&:hover': { 
                borderColor: 'grey.800',
                bgcolor: 'grey.100'
              }
            }}
          >
            BACK TO ORGANIZE
          </Button>
          
          <Button
            variant="contained"
            sx={{ 
              bgcolor: 'black',
              color: 'white',
              '&:hover': { bgcolor: 'grey.800' }
            }}
          >
            NEXT
          </Button>
        </Box>
      </Box>
    );
  }

  const updateFileLocations = (files, folders) => {
    const locations = {};
    
    files.forEach(file => {
      const path = buildFilePath(file, folders);
      locations[file.id] = {
        fileId: file.id,
        fileName: file.name,
        fileType: file.type,
        currentPath: path,
        folderId: file.folder,
        folderName: file.folder ? folders.find(f => f.id === file.folder)?.name : null,
        isInRoot: !file.folder,
        fullLocation: path === '/' ? `./${file.name}` : `.${path}/${file.name}`,
        lastMoved: new Date().toISOString()
      };
    });
    
    return locations;
  };

  const getFileLocation = (fileId) => {
    return fileLocations[fileId] || null;
  };

  const getFilesInLocation = (path) => {
    return Object.values(fileLocations).filter(location => 
      location.currentPath === path
    );
  };

  const getAllFileLocations = () => {
    return fileLocations;
  };

  const exportFileStructure = () => {
    const structure = {
      folders: folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        path: `/${folder.name}`,
        parent: folder.parent
      })),
      files: Object.values(fileLocations),
      generatedAt: new Date().toISOString()
    };
    
    return JSON.stringify(structure, null, 2);
  };

  const validateOrganization = () => {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      stats: {
        totalFiles: organizationFiles.length,
        filesInRoot: 0,
        filesInFolders: 0,
        totalFolders: folders.length
      }
    };
    
    Object.values(fileLocations).forEach(location => {
      if (location.isInRoot) {
        validation.stats.filesInRoot++;
        if (location.fileId !== 'main') {
          validation.errors.push(`File ${location.fileName} should be in a folder, not root`);
          validation.isValid = false;
        }
      } else {
        validation.stats.filesInFolders++;
      }
    });
    
    // Check if main.py is in root
    const mainLocation = fileLocations['main'];
    if (mainLocation && !mainLocation.isInRoot) {
      validation.errors.push('main.py must be in root directory');
      validation.isValid = false;
    }
    
    return validation;
  };

  const debugFileLocations = () => {
    console.log('Current file locations:', fileLocations);
    console.log('Validation result:', validateOrganization());
    console.log('File structure JSON:', exportFileStructure());
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
      content: '',
      functionsCode: {}
    };
    setFiles([...files, newFile]);
    setSelectedFile(newFile.id);
    // Initialize the file content
    updateFileContent(newFile.id);
  };

  const deleteFile = (fileId) => {
    const fileToDelete = files.find(f => f.id === fileId);
    
    // If the file being deleted contains moved functions, return them to the left side
    if (fileToDelete && fileToDelete.functions && fileToDelete.functions.length > 0) {
      setMovedFunctions(prev => {
        const newMovedFunctions = new Set(prev);
        fileToDelete.functions.forEach(func => newMovedFunctions.delete(func));
        return newMovedFunctions;
      });
    }
    
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
    updateFileContent(fileId);
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
      if (file.functionsCode && file.functionsCode[functionName]) {
        // Use actual function code if available
        content += `${file.functionsCode[functionName]}\n\n`;
      } else {
        // Fallback to placeholder code
        content += `# Function: ${functionName}\n`;
        content += `def ${functionName}():\n    # Implementation here\n    pass\n\n`;
      }
    });
    
    // Add code blocks content
    if (file.codeBlocks && file.codeBlocks.length > 0) {
      file.codeBlocks.forEach(block => {
        content += `# ${block.name}\n`;
        content += `${block.content}\n\n`;
      });
    }

    console.log('updateFileContent called for file:', fileId);
    console.log('Generated content:', content);
    console.log('File functions:', file.functions);
    console.log('File functionsCode:', file.functionsCode);

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
    if (groupName === 'Group 1') {
      return lines.slice(9, 67).join('\n'); // lines 10-67 (load functions only)
    } else if (groupName === 'Group 2') {
      return lines.slice(96, 144).join('\n'); // lines 97-144 (image processing functions)
    } else if (groupName === 'Group 3') {
      return lines.slice(146, 179).join('\n'); // lines 147-179 (plotting functions)
    }
    return '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

 const handleDrop = (e, fileId) => {
  e.preventDefault();
  
  if (draggedFunctionBlock) {
    const targetFile = files.find(f => f.id === fileId);
    if (targetFile && !targetFile.functions.includes(draggedFunctionBlock.name)) {
      
      // Create new functionsCode object
      const newFunctionsCode = {
        ...(targetFile.functionsCode || {}),
        [draggedFunctionBlock.name]: draggedFunctionBlock.lines.join('\n')
      };
      
      // Create new functions array
      const newFunctions = [...targetFile.functions, draggedFunctionBlock.name];
      
      // Generate content
      let content = `# ${targetFile.name}\n\n`;
      
      // Add functions content
      newFunctions.forEach(functionName => {
        if (newFunctionsCode[functionName]) {
          // Use actual function code if available
          content += `${newFunctionsCode[functionName]}\n\n`;
        } else {
          // Fallback to placeholder code
          content += `# Function: ${functionName}\n`;
          content += `def ${functionName}():\n    # Implementation here\n    pass\n\n`;
        }
      });
      
      // Add code blocks content
      if (targetFile.codeBlocks && targetFile.codeBlocks.length > 0) {
        targetFile.codeBlocks.forEach(block => {
          content += `# ${block.name}\n`;
          content += `${block.content}\n\n`;
        });
      }
      
      // Create updated file object (immutable update)
      const updatedFile = {
        ...targetFile,
        functions: newFunctions,
        functionsCode: newFunctionsCode,
        content: content
      };
      
      console.log('Function dropped:', draggedFunctionBlock.name);
      console.log('Generated content:', content);
      console.log('Updated file:', updatedFile);
      
      // Update files state with new file object
      setFiles(prevFiles => prevFiles.map(f => f.id === fileId ? updatedFile : f));
      
      // Mark this function as moved so it doesn't appear on the left side
      setMovedFunctions(prev => new Set([...prev, draggedFunctionBlock.name]));
    }
    
    setDraggedFunctionBlock(null);
    
  } else if (draggedFunction) {
    // Handle regular function drag (from function list, not code blocks)
    const updatedFiles = files.map(f => ({
      ...f,
      functions: f.functions.filter(func => func !== draggedFunction)
    }));
    
    const targetFile = updatedFiles.find(f => f.id === fileId);
    if (targetFile && !targetFile.functions.includes(draggedFunction)) {
      const updatedTargetFile = {
        ...targetFile,
        functions: [...targetFile.functions, draggedFunction]
      };
      
      // Update the files array with the modified target file
      const finalFiles = updatedFiles.map(f => f.id === fileId ? updatedTargetFile : f);
      setFiles(finalFiles);
      
      // Mark function as moved
      setMovedFunctions(prev => new Set([...prev, draggedFunction]));
    } else {
      setFiles(updatedFiles);
    }
    
    setDraggedFunction(null);
    
    // Update content after adding function
    setTimeout(() => updateFileContent(fileId), 0);
    
  } else if (draggedCodeBlock) {
    const targetFile = files.find(f => f.id === fileId);
    if (targetFile) {
      const newCodeBlocks = [...(targetFile.codeBlocks || [])];
      if (!newCodeBlocks.find(block => block.name === draggedCodeBlock)) {
        const codeContent = getCodeBlockContent(draggedCodeBlock);
        newCodeBlocks.push({
          name: draggedCodeBlock,
          content: codeContent
        });
      }
      
      const updatedFile = {
        ...targetFile,
        codeBlocks: newCodeBlocks
      };
      
      setFiles(prevFiles => prevFiles.map(f => f.id === fileId ? updatedFile : f));
    }
    
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
      
      // If the function was moved from the example code, return it to the left side
      setMovedFunctions(prev => {
        const newMovedFunctions = new Set(prev);
        newMovedFunctions.delete(draggedFunction);
        return newMovedFunctions;
      });
      
      // Update content for all files after removing function
      files.forEach(file => updateFileContent(file.id));
    } else if (draggedCodeBlock) {
      const updatedFiles = files.map(f => ({
        ...f,
        codeBlocks: f.codeBlocks ? f.codeBlocks.filter(block => block.name !== draggedCodeBlock) : []
      }));
      setFiles(updatedFiles);
      setDraggedCodeBlock(null);
      // Update content for all files after removing code block
      files.forEach(file => updateFileContent(file.id));
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

  const handleSingleClick = (fileId, currentName) => {
    console.log('Single click:', fileId, currentName, 'selectedFile:', selectedFile); // Debug log
    // If file is already selected, enable editing
    if (selectedFile === fileId) {
      console.log('Enabling edit mode for:', fileId); // Debug log
      setEditingFile(fileId);
      // Remove .py extension for editing
      const nameWithoutExtension = currentName.replace(/\.py$/i, '');
      setEditingName(nameWithoutExtension);
    } else {
      // If not selected, select it first
      console.log('Selecting file:', fileId); // Debug log
      setSelectedFile(fileId);
    }
  };

  const handleNameChange = (e) => {
    setEditingName(e.target.value);
  };

  const handleNameSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      console.log('handleNameSubmit called with editingFile:', editingFile, 'editingName:', editingName); // Debug log
      // Allow saving with any name (including same name)
      const trimmedName = editingName.trim();
      if (trimmedName.length > 0) {
        // Always append .py extension in lowercase
        const finalName = trimmedName.toLowerCase() + '.py';
        console.log('Saving file name:', finalName); // Debug log
        console.log('Current files before update:', files); // Debug log
        const updatedFiles = files.map(f => f.id === editingFile ? { ...f, name: finalName } : f);
        console.log('Updated files:', updatedFiles); // Debug log
        setFiles(updatedFiles);
        // Update content with new file name - use the updated file data
        const updatedFile = updatedFiles.find(f => f.id === editingFile);
        if (updatedFile) {
          let content = `# ${updatedFile.name}\n\n`;
          
          // Add functions content
          updatedFile.functions.forEach(functionName => {
            content += `# Function: ${functionName}\n`;
            content += `def ${functionName}():\n    # Implementation here\n    pass\n\n`;
          });
          
          // Add code blocks content
          if (updatedFile.codeBlocks) {
            updatedFile.codeBlocks.forEach(block => {
              content += `# Code Block: ${block.name}\n`;
              content += block.content + '\n\n';
            });
          }
          
          // Update the content immediately
          setFiles(prevFiles => prevFiles.map(f => f.id === editingFile ? { ...f, content } : f));
        }
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
      
      const updatedFolders = [...folders, newFolder];
      setFolders(updatedFolders);
      setExpandedFolders(new Set([...expandedFolders, newFolder.id]));
      
      // Update file locations with new folder structure
      const newLocations = updateFileLocations(organizationFiles, updatedFolders);
      setFileLocations(newLocations);
      
      setNewFolderName('');
      setNewFolderDialog(false);
      
      console.log('New folder created:', {
        folderName: newFolder.name,
        folderId: newFolder.id,
        path: `/${newFolder.name}`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleFileDragStart = (e, file) => {
    // Prevent main.py from being dragged
    if (file.id === 'main') {
      e.preventDefault();
      return;
    }
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
      const updatedFiles = organizationFiles.map(f => 
        f.id === draggedFile.id 
          ? { ...f, folder: targetFolder.id }
          : f
      );
      
      setOrganizationFiles(updatedFiles);
      
      // Update file locations
      const newLocations = updateFileLocations(updatedFiles, folders);
      setFileLocations(newLocations);
      
      // Log the updated location for the moved file
      console.log('File moved:', {
        file: draggedFile.name,
        from: fileLocations[draggedFile.id]?.currentPath || '/',
        to: buildFilePath({ folder: targetFolder.id }, folders),
        timestamp: new Date().toISOString()
      });
      
      setDraggedFile(null);
      setDragOverFolder(null);
    }
  };

  const moveFileToRoot = (fileId) => {
    const updatedFiles = organizationFiles.map(f => 
      f.id === fileId 
        ? { ...f, folder: null }
        : f
    );
    
    setOrganizationFiles(updatedFiles);
    
    // Update file locations
    const newLocations = updateFileLocations(updatedFiles, folders);
    setFileLocations(newLocations);
    
    // Log the move to root
    const file = organizationFiles.find(f => f.id === fileId);
    console.log('File moved to root:', {
      file: file.name,
      from: fileLocations[fileId]?.currentPath || '/',
      to: '/',
      timestamp: new Date().toISOString()
    });
    
    handleCloseContextMenu();
  };

  // Check if created files are organized (first condition)
  const canShowMustOrganize = () => {
    // Check if there are folders created
    const hasFolders = folders.length > 0;
    
    // Get all created files (excluding main.py and standard project files)
    const createdFiles = organizationFiles.filter(f => 
      f.id !== 'main' && f.id !== 'init' && f.id !== 'png' && f.id !== 'nd2' && 
      f.id !== 'nd2_tail' && f.id !== 'qpdata' && f.id !== 'tif_vang' && f.id !== 'citations'
    );
    
    // Check if ALL created files are organized into folders
    const allCreatedFilesOrganized = createdFiles.length > 0 && 
      createdFiles.every(f => f.folder !== null);
    
    // Check if main.py is in root directory (folder should be null)
    const mainFile = organizationFiles.find(f => f.id === 'main');
    const mainInRoot = mainFile && mainFile.folder === null;
    
    return hasFolders && allCreatedFilesOrganized && mainInRoot;
  };

  // Check if ALL files are organized (final condition)
  const canProceed = () => {
    // Check if there are folders created
    const hasFolders = folders.length > 0;
    
    // Get all files except main.py
    const allOtherFiles = organizationFiles.filter(f => f.id !== 'main');
    
    // Check if ALL other files are organized into folders
    const allOtherFilesOrganized = allOtherFiles.length > 0 && 
      allOtherFiles.every(f => f.folder !== null);
    
    // Check if main.py is in root directory (folder should be null)
    const mainFile = organizationFiles.find(f => f.id === 'main');
    const mainInRoot = mainFile && mainFile.folder === null;
    
    return hasFolders && allOtherFilesOrganized && mainInRoot;
  };

  // Handle the organization button click
  const handleOrganizeProject = () => {
    if (canProceed()) {
      // All conditions satisfied, proceed to final view
      console.log('Project organized successfully!');
      console.log('Files:', organizationFiles);
      console.log('Folders:', folders);
      console.log('Final file locations:', fileLocations);
      
      // Initialize main.py content for final view with custom imports
      setMainPyContent(generateMainPyContentWithEditableLines());
      setCurrentView('final');
      return;
    }
    
    // Show error popup with specific message
    const unorganizedFiles = organizationFiles.filter(f => 
      f.id !== 'main' && f.folder === null
    );
    
    const fileNames = unorganizedFiles.map(f => f.name).join(', ');
    setErrorDialog({
      open: true,
      message: `You must organize all files into folders before proceeding. The following files are still in the root directory: ${fileNames}. Only main.py should remain in the root directory.`
    });
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
          cursor: file.id === 'main' ? 'default' : 'pointer', // Different cursor for main.py
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
        draggable={file.id !== 'main'} // Prevent main.py from being draggable
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
              MAIN (FIXED)
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
            <br /><br />
            <strong>Step 1:</strong> Create folders and organize your created files (file 1.py, file 2.py, etc.) into them.
            <br />
            <strong>Step 2:</strong> Click &quot;MUST ORGANIZE PROJECT&quot; to check your progress.
            <br />
            <strong>Step 3:</strong> Organize ALL remaining files except main.py to proceed.
            <br />
            <strong>Note:</strong> main.py must always remain in the root directory.
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

            {/* Debug Button */}
            <Button
              variant="outlined"
              onClick={debugFileLocations}
              sx={{ 
                mb: 2,
                ml: 2,
                bgcolor: 'info.main',
                color: 'white',
                '&:hover': { bgcolor: 'info.dark' }
              }}
            >
              DEBUG FILE LOCATIONS
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
                    
                    {/* Show file location */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Location:
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontFamily: 'monospace',
                        bgcolor: 'grey.100',
                        p: 1,
                        borderRadius: 1,
                        fontSize: '0.8rem'
                      }}>
                        {getFileLocation(selectedOrgFile.id)?.fullLocation || 'Unknown'}
                      </Typography>
                    </Box>
                    
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
                        <Box sx={{ maxHeight: 400, overflow: 'hidden' }}>
                          <EnhancedCodeEditor
                            content={selectedOrgFile.content}
                            onChange={() => {}} // Read-only in organize view
                            disabled={true}
                          />
                        </Box>
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
          
          {/* Show different buttons based on conditions */}
          {canProceed() ? (
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              sx={{ 
                bgcolor: 'success.main',
                color: 'white',
                '&:hover': { 
                  bgcolor: 'success.dark'
                },
                fontSize: '0.9rem',
                fontWeight: 'bold',
                px: 3,
                py: 1.5
              }}
              onClick={handleOrganizeProject}
            >
              CONTINUE
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              disabled={!canShowMustOrganize()}
              sx={{ 
                bgcolor: canShowMustOrganize() ? 'warning.main' : 'grey.400',
                color: 'white',
                '&:hover': { 
                  bgcolor: canShowMustOrganize() ? 'warning.dark' : 'grey.400' 
                },
                fontSize: '0.9rem',
                fontWeight: 'bold',
                px: 3,
                py: 1.5
              }}
              onClick={handleOrganizeProject}
              title={canShowMustOrganize() ? 
                'Click to check if all files are organized' : 
                'Create folders and organize all created files first'
              }
            >
              {canShowMustOrganize() ? 'MUST ORGANIZE PROJECT' : 'ORGANIZE CREATED FILES FIRST'}
            </Button>
          )}
        </Box>

        {/* Error Dialog */}
        <Dialog 
          open={errorDialog.open} 
          onClose={() => setErrorDialog({ open: false, message: '' })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>
            Organization Required
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mt: 1 }}>
              {errorDialog.message}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setErrorDialog({ open: false, message: '' })}
              variant="contained"
              color="primary"
            >
              OK, I&apos;ll organize them
            </Button>
          </DialogActions>
        </Dialog>

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
      <Box sx={{ display: 'flex', gap: 3, position: 'relative', alignItems: 'flex-start' }}>
        {/* Left Side - Code Display */}
        <Box sx={{ flex: 1.4, position: 'relative', zIndex: 10, minWidth: 0 }}>
          <Paper elevation={2} sx={{ p: 2, bgcolor: 'grey.900', minHeight: '100vh', width: '100%' }}>
            {/* Code Display Header with Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: 'white', fontSize: '1rem' }}>
                Example Script: (69 lines of code, 110 lines total)
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#8b5cf6', fontSize: '0.7rem' }}>
                  Group 1
                </Typography>
                <Typography variant="caption" sx={{ color: '#48bb78', fontSize: '0.7rem' }}>
                  Group 2
                </Typography>
                <Typography variant="caption" sx={{ color: '#ff9f40', fontSize: '0.7rem' }}>
                  Group 3
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
                height: isFullscreen ? '100vh' : `${codeMaxHeight}px`,
                maxHeight: isFullscreen ? 'none' : `${codeMaxHeight}px`,
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
                {Array.from({length: 255}, (_, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      lineHeight: '1.4',
                      color: '#cbd5e0',
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
                  {Array.from({length: 255}, (_, index) => {
                    const codeLines = exampleCode.split('\n');
                    const line = index < codeLines.length ? codeLines[index] : '';
                    
                    // Use stored function blocks for color mapping
                    
                    let functionBlock = null;
                    let isFirstLineOfFunction = false;
                    let isMovedFunction = false;
                    
                    // Find which function block this line belongs to
                    for (const block of functionBlocks) {
                      if (index >= block.startLine && index <= block.endLine) {
                        if (movedFunctions.has(block.name)) {
                          // This line belongs to a moved function
                          isMovedFunction = true;
                        } else {
                          // Only show function if it hasn't been moved
                          functionBlock = block;
                          isFirstLineOfFunction = index === block.startLine;
                        }
                        break;
                      }
                    }
                    
                    const backgroundColor = functionBlock ? `${functionBlock.color}25` : 'transparent';
                    const borderColor = functionBlock ? functionBlock.color : 'transparent';
                    
                    // Don't render lines that belong to moved functions
                    if (isMovedFunction) {
                      return null;
                    }
                    
                    return (
                      <div key={index} style={{ position: 'relative' }}>
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
                            borderLeft: functionBlock ? `3px solid ${functionBlock.color}` : 'none',
                            pointerEvents: 'auto'
                          }}
                        >
                          <span style={{ flex: 1 }}>{line || ' '}</span>
                          {isFirstLineOfFunction && functionBlock && (
                            <span 
                              style={{
                                position: 'absolute',
                                right: '20px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: `${fontSize * 0.75}rem`,
                                backgroundColor: functionBlock.color,
                                padding: '4px 8px',
                                borderRadius: '4px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                cursor: 'grab',
                                zIndex: 1001,
                                userSelect: 'none'
                              }}
                              draggable
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Function block clicked:', functionBlock);
                                setSelectedFunction(functionBlock);
                              }}
                              onDragStart={(e) => {
                                e.stopPropagation();
                                setDraggedFunctionBlock(functionBlock);
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragEnd={() => setDraggedFunctionBlock(null)}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-50%) scale(1.05)';
                                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(-50%) scale(1)';
                                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                              }}
                              title={`Drag ${functionBlock.name}() function`}
                            >
                              📦 {functionBlock.name}()
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
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSingleClick(file.id, file.name.toLowerCase());
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {file.name.toLowerCase()}
                        </span>
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
                {/* Display code for dropped functions */}
                {files.find(f => f.id === selectedFile)?.functions.map(functionName => {
                  const functionCode = files.find(f => f.id === selectedFile)?.functionsCode?.[functionName];
                  return (
                    <Box key={functionName} sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
                        Function: {functionName}()
                      </Typography>
                      <Paper 
                        elevation={1} 
                        sx={{ 
                          p: 2, 
                          bgcolor: '#1a1a1a', 
                          borderRadius: 1,
                          border: '1px solid #333',
                          maxHeight: 400,
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
                          {functionCode || `def ${functionName}():\n    # Implementation here\n    pass`}
                        </pre>
                      </Paper>
                    </Box>
                  );
                })}
                
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