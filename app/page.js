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
import CustomModal from './components/CustomModal';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import 'highlight.js/styles/vs2015.css'; // Dark theme that matches the editor

// Register Python language
hljs.registerLanguage('python', python);

// Function to highlight Python code
const highlightPythonLine = (line) => {
  try {
    const result = hljs.highlight(line, { language: 'python', ignoreIllegals: true });
    return result.value;
  } catch (error) {
    // Fallback to plain text if highlighting fails
    return line;
  }
};

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

// Helper function to parse files array from code line
const parseFilesArray = (line) => {
  // Extract files from: files = ['file1', 'file2', 'file3']
  const match = line.match(/files = \[(.*)\]/);
  if (match) {
    const arrayContent = match[1];
    // Split by comma and clean up quotes and whitespace
    const files = arrayContent.split(',').map(file => {
      return file.trim().replace(/^['"]|['"]$/g, '');
    });
    return files;
  }
  return [];
};

// Enhanced code editor component with inline editing
const EnhancedCodeEditor = ({ content, onChange, disabled, editableLines }) => {
  const [hoveredLine, setHoveredLine] = useState(null);
  const [isEditingLine, setIsEditingLine] = useState(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [editingSegment, setEditingSegment] = useState(null);
  const [tempIdentifierValue, setTempIdentifierValue] = useState('');
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

  const hasFilesArray = (lineNumber) => {
    return lines[lineNumber] && lines[lineNumber].trim().startsWith('files = [');
  };

  const updateFilesArray = (line, newFiles) => {
    // Convert back to the proper format
    const quotedFiles = newFiles.map(file => `'${file}'`);
    return line.replace(/files = \[.*\]/, `files = [${quotedFiles.join(', ')}]`);
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
    // Handle files array editing
    if (hasFilesArray(lineNumber) && isEditableLine(lineNumber)) {
      const files = parseFilesArray(line);
      const beforeArray = line.substring(0, line.indexOf('files = ['));
      const afterArray = line.substring(line.indexOf(']') + 1);
      
      return (
        <span>
          {beforeArray}
          <span style={{ color: '#e2e8f0' }}>files = [</span>
          {files.map((filename, index) => (
                         <span key={index}>
               <span style={{ color: '#e2e8f0' }}>&apos;</span>
               <span
                style={{
                  backgroundColor: 'rgba(33, 150, 243, 0.2)',
                  color: '#2196F3',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  cursor: 'text',
                  border: '2px solid rgba(33, 150, 243, 0.5)',
                  display: 'inline-block',
                  minWidth: '140px',
                  maxWidth: '250px',
                  margin: '0 1px'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingSegment(`${lineNumber}-file-${index}`);
                }}
                title={`Click to edit filename ${index + 1}`}
              >
                {editingSegment === `${lineNumber}-file-${index}` ? (
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => {
                      const newFiles = [...files];
                      newFiles[index] = e.target.value;
                      const updatedLine = updateFilesArray(line, newFiles);
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
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#2196F3',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      width: '100%',
                      minWidth: '140px'
                    }}
                  />
                ) : (
                  filename
                )}
                             </span>
               <span style={{ color: '#e2e8f0' }}>&apos;</span>
               {index < files.length - 1 && <span style={{ color: '#e2e8f0' }}>, </span>}
            </span>
          ))}
          <span style={{ color: '#e2e8f0' }}>]</span>
          {afterArray}
        </span>
      );
    }
    
    if (hasLoadFileCall(lineNumber) && isEditableLine(lineNumber)) {
      const beforeLoadFile = line.substring(0, line.indexOf('load_file(f"'));
      const afterLoadFile = line.substring(line.indexOf('")') + 2);
      
      // Check if this line contains {filename} pattern
      if (line.includes('{filename}')) {
        const currentPrefix = getLoadFilePrefix(line);
        
        return (
          <span>
            {beforeLoadFile}
            <span style={{ color: '#e2e8f0' }}>load_file(f&quot;</span>
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
            <span style={{ color: '#e2e8f0' }}>load_file(f&quot;</span>
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
    } else if (line.includes('output_path=f"') && line.includes('_comparison.png') && isEditableLine(lineNumber)) {
      // Handle output_path file_identifier editing
      const beforeIdentifier = line.substring(0, line.indexOf('output_path=f"') + 14); // +14 for 'output_path=f"'
      const afterIdentifier = '_comparison.png")';
      
      // Extract current file_identifier value (everything before _comparison.png)
      const beforeMatch = line.match(/output_path=f"([^"]*?)_comparison\.png/);
      let currentIdentifier = beforeMatch ? beforeMatch[1] : '';
      
      // If the identifier is a template variable like {file_identifier}, treat it as empty
      if (currentIdentifier === '{file_identifier}') {
        currentIdentifier = '';
      }
      
      return (
        <span>
          <span dangerouslySetInnerHTML={{ __html: highlightPythonLine(beforeIdentifier) }} />
          <span
            style={{
              backgroundColor: 'rgba(255, 215, 0, 0.2)',
              color: '#ffd700',
              padding: '4px 8px',
              borderRadius: '3px',
              cursor: 'text',
              border: '2px solid rgba(255, 215, 0, 0.5)',
              display: 'inline-block',
              minWidth: '150px',
              maxWidth: '300px',
              minHeight: '20px',
              lineHeight: '1.2'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setEditingSegment(`${lineNumber}-identifier`);
              setTempIdentifierValue(currentIdentifier);
            }}
            title="Click to edit the file identifier"
          >
            {editingSegment === `${lineNumber}-identifier` ? (
              <input
                type="text"
                value={tempIdentifierValue}
                onChange={(e) => {
                  setTempIdentifierValue(e.target.value);
                }}
                onBlur={() => {
                  // Apply the change when losing focus
                  const beforeOutput = line.substring(0, line.indexOf('output_path=f"'));
                  const updatedLine = `${beforeOutput}output_path=f"${tempIdentifierValue}_comparison.png")`;
                  const updatedLines = [...lines];
                  updatedLines[lineNumber] = updatedLine;
                  onChange(updatedLines.join('\n'));
                  setEditingSegment(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    // Apply the change when pressing Enter/Escape
                    const beforeOutput = line.substring(0, line.indexOf('output_path=f"'));
                    const updatedLine = `${beforeOutput}output_path=f"${tempIdentifierValue}_comparison.png")`;
                    const updatedLines = [...lines];
                    updatedLines[lineNumber] = updatedLine;
                    onChange(updatedLines.join('\n'));
                    setEditingSegment(null);
                  }
                }}
                autoFocus
                placeholder="prefix"
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
                {currentIdentifier || (
                  <span style={{ 
                    color: 'rgba(255, 215, 0, 0.5)',
                    fontStyle: 'italic'
                  }}>
                    {(() => {
                      try {
                        // Find where sub-11-YAaLR_ophys_comparison.png should be located
                        if (typeof organizationFiles !== 'undefined' && typeof folders !== 'undefined') {
                          const comparisonFile = organizationFiles?.find(f => f.name === 'sub-11-YAaLR_ophys_comparison.png');
                          let folderPath = 'results'; // default
                          
                          if (comparisonFile && comparisonFile.folder) {
                            const folder = folders?.find(f => f.id === comparisonFile.folder);
                            folderPath = folder ? folder.name : 'results';
                          }
                          
                          return `${folderPath}/sub-11-YAaLR_ophys`;
                        }
                      } catch (error) {
                        // Fallback if organizationFiles/folders not available
                      }
                      return 'results/sub-11-YAaLR_ophys';
                    })()}
                  </span>
                )}
              </span>
            )}
          </span>
          <span dangerouslySetInnerHTML={{ __html: highlightPythonLine(afterIdentifier) }} />
        </span>
      );
    } else if (line.includes('output_path=f"') && line.includes('.png")') && !line.includes('_comparison.png') && isEditableLine(lineNumber)) {
      // Handle overview.png output_path editing
      const beforeOutput = line.substring(0, line.indexOf('output_path=f"') + 14); // +14 for 'output_path=f"'
      const afterOutput = line.substring(line.indexOf('")')); // Get the closing part
      
      // Extract current filename
      const filenameMatch = line.match(/output_path=f"([^"]+)"/);
      const currentFilename = filenameMatch ? filenameMatch[1] : 'overview.png';
      
      return (
        <span>
          <span dangerouslySetInnerHTML={{ __html: highlightPythonLine(beforeOutput) }} />
          <span
            style={{
              backgroundColor: 'rgba(33, 150, 243, 0.2)',
              color: '#2196F3',
              padding: '2px 4px',
              borderRadius: '3px',
              cursor: 'text',
              border: '2px solid rgba(33, 150, 243, 0.5)',
              display: 'inline-block',
              minWidth: '150px',
              maxWidth: '350px'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setEditingSegment(`${lineNumber}-overview`);
              setTempIdentifierValue(currentFilename);
            }}
            title="Click to edit the output filename"
          >
            {editingSegment === `${lineNumber}-overview` ? (
              <input
                type="text"
                value={tempIdentifierValue}
                onChange={(e) => {
                  setTempIdentifierValue(e.target.value);
                }}
                onBlur={() => {
                  // Apply the change when losing focus
                  const beforePart = line.substring(0, line.indexOf('output_path=f"'));
                  const updatedLine = `${beforePart}output_path=f"${tempIdentifierValue}")`;
                  const updatedLines = [...lines];
                  updatedLines[lineNumber] = updatedLine;
                  onChange(updatedLines.join('\n'));
                  setEditingSegment(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    // Apply the change when pressing Enter/Escape
                    const beforePart = line.substring(0, line.indexOf('output_path=f"'));
                    const updatedLine = `${beforePart}output_path=f"${tempIdentifierValue}")`;
                    const updatedLines = [...lines];
                    updatedLines[lineNumber] = updatedLine;
                    onChange(updatedLines.join('\n'));
                    setEditingSegment(null);
                  }
                }}
                autoFocus
                placeholder="filename.png"
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#2196F3',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  width: '100%',
                  minWidth: '120px'
                }}
              />
            ) : (
              <span>
                {currentFilename === 'overview.png' ? (
                  <span style={{ 
                    color: 'rgba(33, 150, 243, 0.7)',
                    fontStyle: 'italic'
                  }}>
                    {(() => {
                      try {
                        // Find where overview.png should be located
                        if (typeof organizationFiles !== 'undefined' && typeof folders !== 'undefined') {
                          const overviewFile = organizationFiles?.find(f => f.name === 'overview.png');
                          let folderPath = 'results'; // default
                          
                          if (overviewFile && overviewFile.folder) {
                            const folder = folders?.find(f => f.id === overviewFile.folder);
                            folderPath = folder ? folder.name : 'results';
                          }
                          
                          return `${folderPath}/overview.png`;
                        }
                      } catch (error) {
                        // Fallback if organizationFiles/folders not available
                      }
                      return 'results/overview.png';
                    })()}
                  </span>
                ) : (
                  currentFilename
                )}
              </span>
            )}
          </span>
          <span dangerouslySetInnerHTML={{ __html: highlightPythonLine(afterOutput) }} />
        </span>
      );
    }
    // Apply syntax highlighting to regular Python code lines
    return <span dangerouslySetInnerHTML={{ __html: highlightPythonLine(line) }} />;
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
          {Array.from({length: lines.length}, (_, index) => (
            <div 
              key={index}
              style={{ 
                height: '1.55em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                color: '#a0aec0',
                fontWeight: 'normal',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                lineHeight: '1.5',
                backgroundColor: 'transparent'
              }}
            >
              {String(index + 1).padStart(3, ' ')}
            </div>
          ))}
        </Box>
      </Box>
      
      {/* Code Content Container */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'auto' }} onScroll={handleScroll}>
        <Box sx={{ padding: '8px 12px' }}>
          {Array.from({length: lines.length}, (_, index) => {
            const line = index < lines.length ? lines[index] : '';
            return (
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
                border: isEditableLine(index) ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid transparent',
                whiteSpace: 'pre'
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
                    lineHeight: '1.4',
                    whiteSpace: 'pre'
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
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

const CodeRefactoringInterface = () => {
  const router = useRouter();
  const [currentView, setCurrentView] = useState('refactoring'); // 'refactoring', 'organize', 'final', or 'completion'
  const [files, setFiles] = useState([
    { id: 1, name: 'file_1.py', color: 'purple', functions: [], codeBlocks: [], content: '', functionsCode: {} }
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
  
  // Completion view state
  const [completionView, setCompletionView] = useState('project'); // 'project', 'example'
  const [selectedFileForViewing, setSelectedFileForViewing] = useState(null);
  const [showFileContent, setShowFileContent] = useState(false);
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

  // Line count state for avoiding hydration errors
  const [lineCountInfo, setLineCountInfo] = useState({
    codeLines: 0,
    totalLines: 0,
    lastCodeLine: 0,
    description: ''
  });
  
  // Track if component is mounted to prevent hydration errors
  const [isMounted, setIsMounted] = useState(false);

  // Import lines state (now managed directly in the script)
  const [importLines, setImportLines] = useState([
    { line: 7, content: 'from  import ' }
  ]);

  // Validation state
  const [validationResults, setValidationResults] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const [expandedValidation, setExpandedValidation] = useState(false);
  const [showValidationPopup, setShowValidationPopup] = useState(false);

  // Function to get file content and description
  const getFileContentAndDescription = (fileName, isExample = false) => {
    if (isExample) {
      // Example directory file contents
      switch (fileName) {
        case 'main.py':
          return {
            name: 'main.py',
            description: 'Main execution script that processes microscopy images through various stages and generates comparison plots.',
            content: `import os.path
import numpy as np
from src import plotting, preprocessing, loading


def load_file(path):
    if path.endswith('.nd2'):
        microscopy_data = loading.load_nd2(path)
        is_normalized, is_mip, is_cropped, zoom_level, gaussian_sigma = loading.load_parameters(file_format='nd2')

    elif path.endswith('.tiff') or path.endswith('.tif'):
        microscopy_data = loading.load_tif(path)
        is_normalized, is_mip, is_cropped, zoom_level, gaussian_sigma = loading.load_parameters(file_format='tiff')

    elif path.endswith('.nwb'):
        microscopy_data = loading.load_nwb(path)
        is_normalized, is_mip, is_cropped, zoom_level, gaussian_sigma = loading.load_parameters(file_format='nwb')

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


if __name__ == "__main__":
    files = ['20191010_tail_01.nd2', '20240523_Vang-1_37.tif', 'sub-11-YAaLR_ophys.nwb']

    processed_images = []
    for filename in files:
        image, image_parameters = load_file(f"data/{filename}")
        processing_steps = {}

        if not image_parameters['is_mip']:
            image = preprocessing.maximally_project_image(image=image)
            processing_steps['maximum intensity projection'] = image

        if not image_parameters['is_normalized']:
            image = preprocessing.normalize_image(image)
            processing_steps['normalized'] = image

        if not image_parameters['is_cropped']:
            image = preprocessing.crop_background_border(image=image,
                                                         background_percentile=98)
            processing_steps['cropped'] = image

        image = preprocessing.downsample_image(
            image=image,
            factor=image_parameters['downsampling_factor'])
        processing_steps['downsampled'] = image

        image = preprocessing.smooth_image(
            image=image,
            factor=image_parameters['smooth_factor'])
        processing_steps['smoothed'] = image

        file_identifier = filename.split('.')[0]
        plotting.generate_comparison_plot(
            generated_images=processing_steps,
            output_path=f"results/{file_identifier}_comparison.png")

        processed_images.append(image)

    plotting.plot_multiple_files(filenames=files,
                                 images=processed_images,
                                 output_path=f"results/overview.png")`
          };
        case 'loading.py':
          return {
            name: 'loading.py',
            description: 'Module containing functions to load different microscopy file formats (ND2, TIF, NWB) and their parameters.',
            content: `from nd2reader import ND2Reader
from tifffile import imread
from pynwb import NWBHDF5IO
import numpy as np


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
    microscopy_volume = (microscopy_volume/maximum_integer_value) * 255

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

    return is_normalized, is_mip, is_cropped, zoom_level, gaussian_sigma`
          };
        case 'plotting.py':
          return {
            name: 'plotting.py', 
            description: 'Module containing functions to generate comparison plots and visualize multiple microscopy images.',
            content: `import matplotlib.pyplot as plt


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

    plt.show()`
          };
        case 'preprocessing.py':
          return {
            name: 'preprocessing.py',
            description: 'Module containing image processing functions like normalization, cropping, downsampling, and smoothing.',
            content: `import numpy as np
from scipy.ndimage import zoom, gaussian_filter


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
    return image`
          };
        case '20191010_tail_01.nd2':
          return {
            name: '20191010_tail_01.nd2',
            description: 'A Nikon data file generated by proprietary microscopy software.',
            content: 'Content not available for this file type.'
          };
        case '20191010_tail_01.qpdata':
          return {
            name: '20191010_tail_01.qpdata',
            description: 'A QuPath data file containing image analysis and annotation data.',
            content: 'Content not available for this file type.'
          };
        case '20240523_Vang-1_37.tif':
          return {
            name: '20240523_Vang-1_37.tif',
            description: 'A Tagged Image File featuring a microscopy image. This file was generated using the Fiji image processing package.',
            content: 'Content not available for this file type.'
          };
        case 'citations.txt':
          return {
            name: 'citations.txt',
            description: 'A text file listing three different citations, one for each microscopy image.',
            content: 'Content not available for this file type.'
          };
        case '20191010_tail_01_comparison.png':
          return {
            name: '20191010_tail_01_comparison.png',
            description: 'A chart visualizing a microscopy image after various processing steps. Generated by main.py.',
            content: 'Content not available for this file type.'
          };
        case '20240523_Vang-1_37_comparison.png':
          return {
            name: '20240523_Vang-1_37_comparison.png',
            description: 'A chart visualizing a microscopy image after various processing steps. Generated by main.py.',
            content: 'Content not available for this file type.'
          };
        case 'overview.png':
          return {
            name: 'overview.png',
            description: 'A chart visualizing three fully processed microscopy images. Generated by main.py.',
            content: 'Content not available for this file type.'
          };
        case 'sub-11-YAaLR_ophys_comparison.png':
          return {
            name: 'sub-11-YAaLR_ophys_comparison.png',
            description: 'A chart visualizing a microscopy image after various processing steps. Generated by main.py.',
            content: 'Content not available for this file type.'
          };
        default:
          return {
            name: fileName,
            description: 'File description not available.',
            content: 'Content not available for this file type.'
          };
      }
    } else {
      // Project directory files
      const file = organizationFiles.find(f => f.name === fileName);
      if (file) {
        return {
          name: file.name,
          description: file.description || 'No description available.',
          content: file.content || 'Content not available for this file type.'
        };
      }
      return {
        name: fileName,
        description: 'File not found.',
        content: 'Content not available.'
      };
    }
  };

  // Handle NEXT button click
  const handleNextClick = () => {
    if (validationResults && !validationResults.isValid) {
      setShowValidationPopup(true);
    } else {
      // Proceed to completion screen when validation passes
      setCurrentView('completion');
    }
  };

  // All useEffect hooks must be at the top, before any conditional logic
  
  // Initialize editable lines
  useEffect(() => {
    const lines = exampleCode.split('\n');
    setEditableLines({
      6: 'from tifffile import imread', // Keep only this default import
      7: ' ',
      8: ' ', // Change from "from  import " to just a space
      9: ' ',
      38: lines[38] || '    blur_factor = 1'
    });
  }, []);

  // Calculate line counts on client side to avoid hydration errors
  useEffect(() => {
    setIsMounted(true);
    
    const lines = exampleCode.split('\n');
    const totalLines = lines.length;
    const codeLines = lines.filter(line => line.trim() !== '').length;
    
    let lastCodeLine = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() !== '') {
        lastCodeLine = i + 1; // Convert to 1-based indexing
        break;
      }
    }
    
    setLineCountInfo({
      codeLines,
      totalLines,
      lastCodeLine
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
    // Add standard project files
    // Add standard project files
        const standardFiles = [
          {
            id: 'nd2_tail',
            name: '20191010_tail_01.nd2',
            type: 'DATA File',
            description: 'A Nikon data file generated by proprietary microscopy software.',
            folder: null
          },
          {
            id: 'nwb_sub11',
            name: 'sub-11-YAaLR_ophys.nwb',
            type: 'DATA File',
            description: 'A NeuroDataWithoutBorders file. Its contents include a microscopy image, metadata describing that image, and metadata related to the experiment in whose context the image was captured.',
            folder: null
          },
          {
            id: 'tif_vang',
            name: '20240523_Vang-1_37.tif',
            type: 'IMG File',
            description: 'A Tagged Image File featuring a microscopy image. This file was generated using the Fiji image processing package.',
            folder: null
          },
          {
            id: 'comparison_vang',
            name: '20240523_Vang-1_37_comparison.png',
            type: 'IMG File',
            description: 'A chart visualizing a microscopy image after various processing steps. Generated by main.py.',
            folder: null
          },
          {
            id: 'comparison_tail',
            name: '20191010_tail_01_comparison.png',
            type: 'IMG File',
            description: 'A chart visualizing a microscopy image after various processing steps. Generated by main.py.',
            folder: null
          },
          {
            id: 'sub11_comparison',
            name: 'sub-11-YAaLR_ophys_comparison.png',
            type: 'IMG File',
            description: 'A chart visualizing a microscopy image after various processing steps. Generated by main.py.',
            folder: null
          },
          {
            id: 'overview',
            name: 'overview.png',
            type: 'IMG File',
            description: 'A chart visualizing three fully processed microscopy images. Generated by main.py.',
            folder: null
          },
          {
            id: 'citations',
            name: 'citations.txt',
            type: 'TXT File',
            description: 'A text file listing three different citations, one for each microscopy image.',
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
      
      // Validation will be triggered automatically by the useEffect hooks
    }
  }, [currentView, files]);

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

  // Update main.py content when custom imports change, but preserve user edits
  useEffect(() => {
    if (currentView === 'final') {
      const newContent = generateMainPyContentWithEditableLines(mainPyContent);
      setMainPyContent(newContent);
    }
  }, [files]);  // Regenerate when files change

  // Auto-validate when script content changes
  useEffect(() => {
    if (currentView === 'final' && mainPyContent) {
      const timeoutId = setTimeout(() => {
        validateImportsAndStructure();
      }, 500); // Debounce validation to avoid excessive calls
      
      return () => clearTimeout(timeoutId);
    }
  }, [mainPyContent, currentView]);


  // Auto-validate when file organization changes
  useEffect(() => {
    if (currentView === 'final' && organizationFiles && folders) {
      const timeoutId = setTimeout(() => {
        validateImportsAndStructure();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [organizationFiles, folders, currentView]);

  // Function to parse code into function blocks
  const parseFunctionBlocks = (code) => {
    const lines = code.split('\n');
    const blocks = [];
    let currentBlock = null;
    let currentLines = [];
    
    console.log('parseFunctionBlocks called with', lines.length, 'lines');
    
    // Colors for different functions and imports - highly diverse and distinct
    const colors = [
      '#FF3366', // Crimson Red
      '#33FF66', // Emerald Green
      '#3366FF', // Royal Blue
      '#FF9933', // Burnt Orange
      '#9933FF', // Electric Purple
      '#33FF99', // Turquoise
      '#FF6633', // Coral
      '#66FF33', // Lime
      '#6633FF', // Indigo
      '#FF3399', // Hot Pink
      '#99FF33', // Chartreuse
      '#3399FF', // Sky Blue
      '#FFCC33', // Golden Yellow
      '#CC33FF', // Violet
      '#33FFCC', // Aqua
      '#FF33CC', // Fuchsia
      '#CCFF33', // Yellow Green
      '#33CCFF', // Light Blue
      '#FF6699', // Rose
      '#66FF99', // Seafoam
      '#9966FF', // Lavender Purple
      '#FF9966', // Peach
      '#66FF66', // Mint Green
      '#FF6666', // Salmon
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is an import statement
      if (line.trim().startsWith('import ') || line.trim().startsWith('from ')) {
        console.log('Found import statement at line', i, ':', line.trim());
        // Each import is a single-line block
        const importName = line.trim().startsWith('import ') ? 
          line.trim().substring(7) : 
          line.trim().match(/from\s+(.+?)\s+import/)?.[1] || line.trim();
        
        blocks.push({
          name: importName,
          startLine: i,
          endLine: i,
          lines: [line],
          color: colors[blocks.length % colors.length],
          type: 'import'
        });
      }
      // Check if this is a function definition (but not main block)
      else if (line.trim().startsWith('def ') && line.trim().endsWith(':')) {
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
        
        // Check if we've reached the end of the function (next function, main block, or end of code)
        const nextLine = lines[i + 1];
        if (i === lines.length - 1 || 
            (nextLine && nextLine.trim().startsWith('def ') && nextLine.trim().endsWith(':')) ||
            (nextLine && nextLine.trim().startsWith('if __name__ == "__main__":'))) {
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

  const colors = ['purple', 'green', 'blue', 'orange', 'red', 'teal', 'indigo', 'pink'];
  
  // Color mapping for consistent UI colors
  const colorMap = {
    purple: '#6a1b9a',
    green: '#16a34a', 
    blue: '#2563eb',
    orange: '#ea580c',
    red: '#dc2626',
    teal: '#0d9488',
    indigo: '#4f46e5',
    pink: '#db2777'
  };
  
  // Semi-transparent versions for backgrounds
  const colorMapTransparent = {
    purple: 'rgba(106, 27, 154, 0.25)',
    green: 'rgba(22, 163, 74, 0.25)',
    blue: 'rgba(37, 99, 235, 0.25)',
    orange: 'rgba(234, 88, 12, 0.25)',
    red: 'rgba(220, 38, 38, 0.25)',
    teal: 'rgba(13, 148, 136, 0.25)',
    indigo: 'rgba(79, 70, 229, 0.25)',
    pink: 'rgba(219, 39, 119, 0.25)'
  };

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


  // File structure export function (moved up to avoid hoisting issues)
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

  // Data file path validation function
  const validateDataFilePaths = () => {
    const validation = {
      isValid: true,
      errors: []
    };

    try {
      // Get current file structure
      const fileStructureJson = exportFileStructure();
      const fileStructure = JSON.parse(fileStructureJson);

      // Find the 3 data files in the organization
      const dataFileIds = ['nd2_tail', 'tif_vang', 'nwb_sub11'];
      const dataFiles = dataFileIds.map(id => 
        fileStructure.files.find(f => f.fileId === id)
      ).filter(Boolean);

      if (dataFiles.length === 0) {
        // No data files found, skip validation
        return validation;
      }

      // Extract current values from main.py code
      const lines = mainPyContent.split('\n');
      
      // Find path prefix from load_file line
      let pathPrefix = '';
      const loadFileLine = lines.find(line => line.includes('load_file(f"') && line.includes('{filename}'));
      if (loadFileLine) {
        const match = loadFileLine.match(/load_file\(f"([^"]*)\{filename\}"\)/);
        pathPrefix = match ? match[1] : '';
      }

      // Find filenames from files array
      let codeFilenames = [];
      const filesArrayLine = lines.find(line => line.trim().startsWith('files = ['));
      if (filesArrayLine) {
        codeFilenames = parseFilesArray(filesArrayLine);
      }

      // Check folder organization
      const dataFileFolders = dataFiles.map(f => f.folderName).filter(Boolean);
      const uniqueFolders = [...new Set(dataFileFolders)];
      
      // Check if path prefix contains valid path separator patterns
      // Valid: /, //, \, \\, with optional spaces around them
      // Invalid: ///, \\\, or more than 2 slashes
      const validPathSeparatorPattern = /\s*[\/\\]{1,2}\s*$/;
      const hasValidPathSeparator = validPathSeparatorPattern.test(pathPrefix);
      const normalizedPathPrefix = hasValidPathSeparator 
        ? pathPrefix.trim().replace(/\s*[\/\\]+\s*$/, '') + '/'
        : pathPrefix.trim();
      
      // Check if filenames have folder prefixes (both forward slashes and backslashes)
      const filenamesWithPaths = codeFilenames.filter(filename => filename.includes('/') || filename.includes('\\'));
      const filenamesWithoutPaths = codeFilenames.filter(filename => !filename.includes('/') && !filename.includes('\\'));
      
      if (uniqueFolders.length === 0) {
        // All data files in root directory
        if (pathPrefix.trim() !== '') {
          validation.isValid = false;
          validation.errors.push('Data files are in root directory. Path prefix should be empty.');
        }
        if (filenamesWithPaths.length > 0) {
          validation.isValid = false;
          validation.errors.push('Data files are in root directory. Filenames should not include folder paths.');
        }
      } else if (uniqueFolders.length === 1) {
        // All data files in the SAME folder - two valid approaches
        const folderName = uniqueFolders[0];
        const expectedPrefix = `${folderName}/`;
        
        // Check if using mixed approaches (both path prefix AND individual file paths)
        const hasValidPathPrefix = pathPrefix.trim() !== '' && hasValidPathSeparator;
        const hasIndividualPaths = filenamesWithPaths.length > 0;
        
        // Check for invalid path separator patterns (3+ slashes)
        const hasInvalidSlashes = /[\/\\]{3,}/.test(pathPrefix);
        
        if (hasValidPathPrefix && hasIndividualPaths) {
          validation.isValid = false;
          validation.errors.push('Cannot mix path prefix and individual file paths. Choose one approach: either use path prefix OR add folder paths to individual filenames.');
        } else if (hasInvalidSlashes) {
          // User typed too many slashes
          validation.isValid = false;
          validation.errors.push(`Path prefix "${pathPrefix.trim()}" has too many slashes. Use single (/) or double (//) slashes only.`);
        } else if (pathPrefix.trim() !== '' && !hasValidPathSeparator) {
          // User typed folder name but forgot the path separator OR used invalid pattern
          validation.isValid = false;
          validation.errors.push(`Path prefix "${pathPrefix.trim()}" is missing a valid path separator. Use "${pathPrefix.trim()}/" or "${pathPrefix.trim()}\\" to indicate it's a folder path.`);
        } else if (hasValidPathPrefix) {
          // Approach A: Using path prefix
          if (normalizedPathPrefix !== expectedPrefix) {
            validation.isValid = false;
            validation.errors.push(`Using path prefix approach. Path prefix should be "${expectedPrefix}" (variations like "${folderName}//", "${folderName} /", "${folderName}\\", "${folderName} \\" are also acceptable).`);
          }
          // All filenames should be simple (no folder paths)
          if (filenamesWithPaths.length > 0) {
            validation.isValid = false;
            validation.errors.push('When using path prefix approach, filenames should not include folder paths.');
          }
        } else if (hasIndividualPaths) {
          // Approach B: Using individual file paths
          dataFiles.forEach(dataFile => {
            const expectedFilenameForward = `${dataFile.folderName}/${dataFile.fileName}`;
            const expectedFilenameBack = `${dataFile.folderName}\\${dataFile.fileName}`;
            if (!codeFilenames.includes(expectedFilenameForward) && !codeFilenames.includes(expectedFilenameBack)) {
              validation.isValid = false;
              validation.errors.push(`Using individual paths approach. File "${dataFile.fileName}" should be "${expectedFilenameForward}" (or "${expectedFilenameBack}") in the files array.`);
            }
          });
        } else if (!hasIndividualPaths && pathPrefix.trim() === '') {
          // Neither approach is being used
          validation.isValid = false;
          validation.errors.push(`❌ All data files are in "${folderName}" folder. Choose one approach: either fill path prefix with "${expectedPrefix}" OR add "${folderName}/" (or "${folderName}\\") before each filename.`);
        }
      } else {
        // Data files in DIFFERENT folders - must use individual paths approach
        if (pathPrefix.trim() !== '') {
          validation.isValid = false;
          validation.errors.push('Data files are in different folders. Path prefix should be empty and folder paths should be added to individual filenames.');
        }
        
        // All filenames should include their folder paths
        dataFiles.forEach(dataFile => {
          if (dataFile.folderName) {
            const expectedFilenameForward = `${dataFile.folderName}/${dataFile.fileName}`;
            const expectedFilenameBack = `${dataFile.folderName}\\${dataFile.fileName}`;
            if (!codeFilenames.includes(expectedFilenameForward) && !codeFilenames.includes(expectedFilenameBack)) {
              validation.isValid = false;
              validation.errors.push(`File "${dataFile.fileName}" should be "${expectedFilenameForward}" (or "${expectedFilenameBack}") in the files array.`);
            }
          } else {
            // File in root
            if (!codeFilenames.includes(dataFile.fileName)) {
              validation.isValid = false;
              validation.errors.push(`File "${dataFile.fileName}" should be "${dataFile.fileName}" in the files array.`);
            }
          }
        });
      }

    } catch (error) {
      validation.isValid = false;
      validation.errors.push(`Data file validation error: ${error.message}`);
    }

    return validation;
  };

  // File-focused validation function
  const validateImportsAndStructure = () => {
    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      successes: []
    };

    // Declare variables outside try block to avoid scope issues
    let missingFiles = [];
    let filesInFolders = [];

    try {
      // First, validate the complete output_path line for comparison file
      const lines = mainPyContent.split('\n');
      const outputPathLine = lines.find(line => line.includes('output_path=f"') && line.includes('_comparison.png'));
      if (outputPathLine) {
        // Find where sub-11-YAaLR_ophys_comparison.png is located in the project structure
        const comparisonFile = organizationFiles.find(f => f.name === 'sub-11-YAaLR_ophys_comparison.png');
        let expectedFolderPath = 'results'; // default
        
        if (comparisonFile && comparisonFile.folder) {
          // Find the folder name
          const folder = folders.find(f => f.id === comparisonFile.folder);
          expectedFolderPath = folder ? folder.name : 'results';
        }
        
        const expectedLine = `            output_path=f"${expectedFolderPath}/sub-11-YAaLR_ophys_comparison.png")`;
        if (outputPathLine.trim() !== expectedLine.trim()) {
          results.isValid = false;
          results.errors.push(`❌ Output path line must be exactly "${expectedLine}" but found "${outputPathLine.trim()}"`);
          results.errors.push(`💡 The file identifier should be "${expectedFolderPath}/sub-11-YAaLR_ophys" (click the yellow area on line 200 to edit)`);
        } else {
          results.successes.push(`✓ Output path line is correctly set to "${expectedLine}"`);
        }
      }

      // Validate overview filename in output_path
      const overviewLine = lines.find(line => line.includes('output_path=f"') && line.includes('.png")') && !line.includes('_comparison.png'));
      if (overviewLine) {
        // Find where overview.png is located in the project structure
        const overviewFile = organizationFiles.find(f => f.name === 'overview.png');
        let expectedOverviewFolderPath = 'results'; // default
        
        if (overviewFile && overviewFile.folder) {
          // Find the folder name
          const folder = folders.find(f => f.id === overviewFile.folder);
          expectedOverviewFolderPath = folder ? folder.name : 'results';
        }
        
        const overviewMatch = overviewLine.match(/output_path=f"([^"]+)"/);
        if (overviewMatch) {
          const currentOverviewPath = overviewMatch[1];
          const expectedOverviewPath = `${expectedOverviewFolderPath}/overview.png`;
          if (currentOverviewPath !== expectedOverviewPath) {
            results.isValid = false;
            results.errors.push(`❌ Overview output path must be exactly "${expectedOverviewPath}" but found "${currentOverviewPath}"`);
            results.errors.push(`💡 The overview filename should be "${expectedOverviewPath}" (click the blue highlighted filename on line 206 to edit)`);
          } else {
            results.successes.push(`✓ Overview output path is correctly set to "${expectedOverviewPath}"`);
          }
        }
      }

      // Next, validate data file paths consistency
      const dataFileValidation = validateDataFilePaths();
      if (!dataFileValidation.isValid) {
        results.isValid = false;
        results.errors.push(...dataFileValidation.errors);
      }
      // Get current file structure
      const fileStructureJson = exportFileStructure();
      const fileStructure = JSON.parse(fileStructureJson);

      // Find all Python files that are in folders (not in root, excluding main.py)
      // Only Python files are required to be imported via import manager
      // Other file types (data files, images, etc.) are optional and validated separately
      const dataFileIds = ['nd2_tail', 'tif_vang', 'nwb_sub11'];
      
            filesInFolders = fileStructure.files.filter(file => 
        !file.isInRoot && 
        file.fileId !== 'main' && 
        file.folderName && 
        file.fileType === 'PY File'  // Fixed: using fileType instead of type
      );

      if (filesInFolders.length === 0) {
        results.warnings.push('No Python files have been organized into folders yet.');
        results.warnings.push('Note: Data files (.nd2, .nwb, .tif) are validated separately via path prefix/filename validation.');
        setValidationResults(results);
        setShowValidation(true);
        return results;
      }

      // Get all imported file names from the script content
      const importedFiles = new Set();
      const scriptLines = mainPyContent.split('\n');
      
      scriptLines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('from ') && trimmedLine.includes(' import ')) {
          const match = trimmedLine.match(/from\s+([^\s]+)\s+import\s+(.+)/);
          if (match) {
            const moduleMatch = match[1].trim();
            const items = match[2].trim();
            
            // Skip standard library imports
            if (!['tifffile', 'nd2reader', 'pynwb', 'scipy.ndimage', 'matplotlib.pyplot', 'numpy', 'os.path'].includes(moduleMatch)) {
              // Split items by comma and clean up whitespace
              const itemsList = items.split(',').map(item => item.trim()).filter(item => item);
              itemsList.forEach(item => importedFiles.add(item));
            }
          }
        }
      });

      // Check each file in folders
      missingFiles = []; // Reset the array
      const accountedFiles = [];

      filesInFolders.forEach(file => {
        // Remove .py extension to match import format
        const fileName = file.fileName.replace('.py', '');
        
        if (importedFiles.has(fileName)) {
          accountedFiles.push(file);
          results.successes.push(`✓ File "${file.fileName}" in folder "${file.folderName}" is imported`);
        } else {
          missingFiles.push(file);
          results.errors.push(`✗ File "${file.fileName}" in folder "${file.folderName}" is NOT imported`);
          results.isValid = false;
        }
      });

      // Summary messages
      if (results.isValid) {
        results.successes.push(`🎉 All ${filesInFolders.length} Python files in folders are properly imported!`);
        results.successes.push(`📁 Data files (.nd2, .nwb, .tif) are validated separately via path prefix/filename validation.`);
        results.successes.push(`ℹ️ Other file types (images, text files, etc.) are optional and don't need to be imported.`);
      } else {
        if (missingFiles.length > 0) {
          results.errors.push(`❌ ${missingFiles.length} out of ${filesInFolders.length} Python files are missing from import statements`);
        } else {
          results.errors.push(`${missingFiles.length} out of ${filesInFolders.length} Python files are missing from import statements`);
        }
        results.errors.push(`📁 Note: Data files (.nd2, .nwb, .tif) are validated separately via path prefix/filename validation.`);
        results.errors.push(`ℹ️ Other file types (images, text files, etc.) are optional and don't need to be imported.`);
      }

      // Show which files need to be imported and provide complete examples
      if (missingFiles.length > 0) {
        const filesByFolder = {};
        missingFiles.forEach(file => {
          if (!filesByFolder[file.folderName]) {
            filesByFolder[file.folderName] = [];
          }
          filesByFolder[file.folderName].push(file.fileName.replace('.py', ''));
        });

        results.errors.push(`\n📋 EXAMPLES OF VALID IMPORTS THAT WOULD PASS VALIDATION:`);
        
        // Get ALL files in folders (not just missing ones) to show complete examples
        const allFilesByFolder = {};
        filesInFolders.forEach(file => {
          if (!allFilesByFolder[file.folderName]) {
            allFilesByFolder[file.folderName] = [];
          }
          allFilesByFolder[file.folderName].push(file.fileName.replace('.py', ''));
        });

        Object.entries(allFilesByFolder).forEach(([folderName, fileNames]) => {
          results.errors.push(`✅ from ${folderName} import ${fileNames.join(', ')}`);
        });

        results.errors.push(`\n🔧 IMMEDIATE FIXES NEEDED:`);
        Object.entries(filesByFolder).forEach(([folderName, fileNames]) => {
          results.errors.push(`❌ Missing: "from ${folderName} import ${fileNames.join(', ')}"`);
        });
      }

    } catch (error) {
      results.errors.push(`Validation error: ${error.message}`);
      results.isValid = false;
    }

    // Show compact validation results instead of alert
    setValidationResults(results);
    setShowValidation(true);
    
    // Auto-hide successful validation after 5 seconds
    if (results.isValid && results.errors.length === 0) {
      setTimeout(() => {
        setShowValidation(false);
      }, 5000);
    }
    
    return results;
  };

  // Enhanced helper function to generate main.py content with editable lines
  const generateMainPyContentWithEditableLines = (existingContent = null) => {
    // Extract user edits from existing content to preserve them
    let preservedPathPrefix = '';
    let preservedFilenames = [];
    
    if (existingContent) {
      const existingLines = existingContent.split('\n');
      
      // Extract path prefix from load_file line
      const loadFileLine = existingLines.find(line => line.includes('load_file(f"') && line.includes('{filename}'));
      if (loadFileLine) {
        const match = loadFileLine.match(/load_file\(f"([^"]*)\{filename\}"\)/);
        if (match) {
          preservedPathPrefix = match[1];
        }
      }
      
      // Extract filenames from files array
      const filesArrayLine = existingLines.find(line => line.trim().startsWith('files = ['));
      if (filesArrayLine) {
        preservedFilenames = parseFilesArray(filesArrayLine);
      }
    }
    const assignedCodeBlocks = files.flatMap(f => f.codeBlocks?.map(block => block.name) || []);
    
    let mainContent = '';
    const lines = exampleCode.split('\n');
    
    // Add initial imports (lines 0-5)
    mainContent += lines.slice(0, 6).join('\n') + '\n';
    
    // Add initial import line (tifffile import)
    mainContent += (lines[6] || 'from tifffile import imread') + '\n';
    
    // Add editable import lines
    importLines.forEach(importLine => {
      mainContent += importLine.content + '\n';
    });
    
    // Add a blank line after custom imports
    mainContent += '\n';
    
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
    
    // Mark lines from assigned functions
    const assignedFunctions = files.flatMap(f => f.functions);
    const parsedBlocks = parseFunctionBlocks(exampleCode);
    
    parsedBlocks.forEach(block => {
      if (block.type === 'function' && assignedFunctions.includes(block.name)) {
        // Exclude all lines of assigned functions
        for (let i = block.startLine; i <= block.endLine; i++) {
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
        let line = lines[originalLineIndex];
        
        // Add editable line 38 if we reach it (adjusted for new lines)
        if (originalLineIndex === 38) {
          line = lines[originalLineIndex] || '    blur_factor = 1';
        }
        
        // Preserve user edits to files array
        if (line.trim().startsWith('files = [') && preservedFilenames.length > 0) {
          const quotedFiles = preservedFilenames.map(file => `'${file}'`);
          line = line.replace(/files = \[.*\]/, `files = [${quotedFiles.join(', ')}]`);
        }
        
        // Preserve user edits to load_file path prefix
        if (line.includes('load_file(f"') && line.includes('{filename}')) {
          if (preservedPathPrefix !== '') {
            line = line.replace(/load_file\(f"[^"]*\{filename\}"\)/, `load_file(f"${preservedPathPrefix}{filename}")`);
          } else {
            line = line.replace(/load_file\(f"[^"]*\{filename\}"\)/, `load_file(f"{filename}")`);
          }
        }
        
        mainContent += line + '\n';
      }
    }
    
    // Always add the main execution block (lines 181 onwards) with editable load_file line
    mainContent += '\n';
    for (let i = 181; i < lines.length; i++) {
      if (lines[i] !== undefined) {
        let line = lines[i];
        
        // Preserve user edits to files array
        if (line.trim().startsWith('files = [') && preservedFilenames.length > 0) {
          const quotedFiles = preservedFilenames.map(file => `'${file}'`);
          line = line.replace(/files = \[.*\]/, `files = [${quotedFiles.join(', ')}]`);
        }
        
        // Preserve user edits to load_file path prefix
        if (line.includes('load_file(f"') && line.includes('{filename}')) {
          if (preservedPathPrefix !== '') {
            line = line.replace(/load_file\(f"[^"]*\{filename\}"\)/, `load_file(f"${preservedPathPrefix}{filename}")`);
          } else {
            line = line.replace(/load_file\(f"[^"]*\{filename\}"\)/, `load_file(f"{filename}")`);
          }
        }
        
        mainContent += line + '\n';
      }
    }
    
    return mainContent;
  };

  // Render completion view
  if (currentView === 'completion') {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3, bgcolor: 'grey.100', minHeight: '100vh' }}>
        {/* Header */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'grey.300' }}>
          <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
            Codebase Organization
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, color: 'text.primary', fontSize: '1.1rem' }}>
            Well done! You&apos;ve successfully organized your project in a way that makes it 
            intuitive and easy to browse. Look through the new PY files.
          </Typography>
        </Paper>

        {/* Tab Navigation */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant={completionView === 'project' ? 'contained' : 'outlined'}
            onClick={() => setCompletionView('project')}
            sx={{ 
              mr: 2,
              bgcolor: completionView === 'project' ? 'black' : 'grey.600',
              color: 'white',
              borderColor: completionView === 'project' ? 'black' : 'grey.600',
              '&:hover': {
                bgcolor: '#6e00ff'
              }
            }}
          >
            PROJECT DIRECTORY
          </Button>
          <Button
            variant={completionView === 'example' ? 'contained' : 'outlined'}
            onClick={() => setCompletionView('example')}
            sx={{ 
              mr: 2,
              bgcolor: completionView === 'example' ? 'black' : 'grey.600',
              color: 'white',
              borderColor: completionView === 'example' ? 'black' : 'grey.600',
              '&:hover': {
                bgcolor: '#6e00ff'
              }
            }}
          >
            EXAMPLE DIRECTORY
          </Button>
        </Box>

        {/* File Directory Display */}
        <Paper elevation={2} sx={{ bgcolor: 'grey.800', color: 'white' }}>
          <Box sx={{ p: 2, bgcolor: 'black', color: 'white' }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
              {completionView === 'project' ? 'PROJECT DIRECTORY' : 'EXAMPLE DIRECTORY'}
            </Typography>
          </Box>
          
          {/* Project Directory Content */}
          {completionView === 'project' && (
            <>
              {/* Column Headers */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                px: 3,
                py: 2,
                bgcolor: 'grey.600',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
            <Typography variant="body1" sx={{ 
              color: 'white', 
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              Name
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'white', 
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              File Type
            </Typography>
          </Box>
          
          {/* File List */}
          <Box sx={{ bgcolor: 'grey.700', minHeight: 400, p: 3 }}>
            {/* Show main.py first */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 1,
              px: 2,
              mb: 1,
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PythonFileIcon />
                <Typography 
                  variant="body1" 
                  sx={{ 
                    ml: 2, 
                    color: 'white', 
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    '&:hover': {
                      color: '#6e00ff',
                      textDecoration: 'underline'
                    }
                  }}
                  onClick={() => {
                    const fileInfo = getFileContentAndDescription('main.py', false);
                    setSelectedFileForViewing(fileInfo);
                    setShowFileContent(true);
                  }}
                >
                  main.py
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                PY File
              </Typography>
            </Box>

            {/* Show organized folders and files */}
            {folders.map(folder => (
              <Box key={folder.id} sx={{ mb: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1,
                  px: 2,
                  mb: 1,
                  bgcolor: 'rgba(255, 215, 0, 0.1)',
                  borderRadius: 1
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FolderIcon sx={{ color: '#FFD700', mr: 2 }} />
                    <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {folder.name}/
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Folder
                  </Typography>
                </Box>
                
                {/* Files in folder */}
                {organizationFiles.filter(f => f.folder === folder.id).map(file => (
                  <Box key={file.id} sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1,
                    px: 2,
                    ml: 4,
                    mb: 1,
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 1
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getFileIcon(file.type)}
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          ml: 2, 
                          color: 'white',
                          cursor: 'pointer',
                          '&:hover': {
                            color: '#6e00ff',
                            textDecoration: 'underline'
                          }
                        }}
                        onClick={() => {
                          const fileInfo = getFileContentAndDescription(file.name, false);
                          setSelectedFileForViewing(fileInfo);
                          setShowFileContent(true);
                        }}
                      >
                        {file.name}
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      {getFileTypeLabel(file.type)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ))}

            {/* Show root files (excluding main.py) */}
            {organizationFiles.filter(f => f.id !== 'main' && !f.folder).map(file => (
              <Box key={file.id} sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1,
                px: 2,
                mb: 1,
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getFileIcon(file.type)}
                  <Typography variant="body1" sx={{ ml: 2, color: 'white' }}>
                    {file.name}
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {getFileTypeLabel(file.type)}
                </Typography>
              </Box>
            ))}

          </Box>
            </>
          )}

          {/* Example Directory Content */}
          {completionView === 'example' && (
            <Box sx={{ p: 3 }}>
              {/* main.py at root level */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                py: 1,
                mb: 2
              }}>
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
                  fontWeight: 'bold',
                  mr: 2
                }}>
                  PY
                </Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'white', 
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    '&:hover': {
                      color: '#6e00ff',
                      textDecoration: 'underline'
                    }
                  }}
                  onClick={() => {
                    const fileInfo = getFileContentAndDescription('main.py', true);
                    setSelectedFileForViewing(fileInfo);
                    setShowFileContent(true);
                  }}
                >
                  main.py
                </Typography>
              </Box>

              {/* data folder */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  py: 1,
                  mb: 1
                }}>
                  <FolderIcon sx={{ color: '#FFD700', mr: 2 }} />
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                    data/
                  </Typography>
                </Box>
                
                {/* data folder files */}
                <Box sx={{ ml: 4 }}>
                  {[
                    { name: '20191010_tail_01.nd2', color: '#4CAF50' },
                    { name: '20191010_tail_01.qpdata', color: '#4CAF50' },
                    { name: '20240523_Vang-1_37.tif', color: '#4CAF50' },
                    { name: 'citations.txt', color: '#4CAF50' }
                  ].map((file, index) => (
                    <Box key={index} sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      py: 0.5,
                      ml: 2
                    }}>
                      <InsertDriveFileIcon sx={{ color: file.color, mr: 2, fontSize: '1.2rem' }} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(255,255,255,0.8)',
                          cursor: 'pointer',
                          '&:hover': {
                            color: '#6e00ff',
                            textDecoration: 'underline'
                          }
                        }}
                        onClick={() => {
                          const fileInfo = getFileContentAndDescription(file.name, true);
                          setSelectedFileForViewing(fileInfo);
                          setShowFileContent(true);
                        }}
                      >
                        {file.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* src folder */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  py: 1,
                  mb: 1
                }}>
                  <FolderIcon sx={{ color: '#FFD700', mr: 2 }} />
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                    src/
                  </Typography>
                </Box>
                
                {/* src folder files */}
                <Box sx={{ ml: 4 }}>
                  {[
                    'loading.py',
                    'plotting.py', 
                    'preprocessing.py'
                  ].map((file, index) => (
                    <Box key={index} sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      py: 0.5,
                      ml: 2
                    }}>
                      <Box sx={{ 
                        width: 20, 
                        height: 20, 
                        backgroundColor: '#306998',
                        borderRadius: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        mr: 2
                      }}>
                        PY
                      </Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(255,255,255,0.8)',
                          cursor: 'pointer',
                          '&:hover': {
                            color: '#6e00ff',
                            textDecoration: 'underline'
                          }
                        }}
                        onClick={() => {
                          const fileInfo = getFileContentAndDescription(file, true);
                          setSelectedFileForViewing(fileInfo);
                          setShowFileContent(true);
                        }}
                      >
                        {file}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* results folder */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  py: 1,
                  mb: 1
                }}>
                  <FolderIcon sx={{ color: '#FFD700', mr: 2 }} />
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                    results/
                  </Typography>
                </Box>
                
                {/* results folder files */}
                <Box sx={{ ml: 4 }}>
                  {[
                    '20191010_tail_01_comparison.png',
                    '20240523_Vang-1_37_comparison.png',
                    'overview.png',
                    'sub-11-YAaLR_ophys_comparison.png'
                  ].map((file, index) => (
                    <Box key={index} sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      py: 0.5,
                      ml: 2
                    }}>
                      <ImageIcon sx={{ color: '#4CAF50', mr: 2, fontSize: '1.2rem' }} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(255,255,255,0.8)',
                          cursor: 'pointer',
                          '&:hover': {
                            color: '#6e00ff',
                            textDecoration: 'underline'
                          }
                        }}
                        onClick={() => {
                          const fileInfo = getFileContentAndDescription(file, true);
                          setSelectedFileForViewing(fileInfo);
                          setShowFileContent(true);
                        }}
                      >
                        {file}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </Paper>


        {/* File Content Viewer Modal */}
        <Dialog
          open={showFileContent}
          onClose={() => setShowFileContent(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              minHeight: '80vh',
              bgcolor: '#1e1e1e',
              color: 'white'
            }
          }}
        >
          <DialogTitle sx={{ 
            bgcolor: 'black', 
            color: 'white', 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {selectedFileForViewing?.name?.endsWith('.py') ? (
                <PythonFileIcon />
              ) : selectedFileForViewing?.name?.endsWith('.png') ? (
                <ImageIcon sx={{ color: '#4CAF50', fontSize: '1.5rem' }} />
              ) : (
                <InsertDriveFileIcon sx={{ color: '#4CAF50', fontSize: '1.5rem' }} />
              )}
              <Typography variant="h6" sx={{ ml: 2 }}>
                {selectedFileForViewing?.name || 'File'}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setShowFileContent(false)}
              sx={{ color: 'white' }}
            >
              <DeleteIcon />
            </IconButton>
          </DialogTitle>
          
          <DialogContent sx={{ bgcolor: '#2d2d2d', color: 'white', p: 0 }}>
            {/* File Description */}
            <Box sx={{ p: 3, bgcolor: '#333333', borderBottom: '1px solid #444' }}>
              <Typography variant="body1" sx={{ color: '#e0e0e0', lineHeight: 1.6 }}>
                {selectedFileForViewing?.description}
              </Typography>
            </Box>
            
            {/* File Content */}
            <Box sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ color: '#ffd700', mb: 2, fontWeight: 'bold' }}>
                File Contents:
              </Typography>
              <Box
                sx={{
                  bgcolor: '#1e1e1e',
                  border: '1px solid #444',
                  borderRadius: 1,
                  p: 2,
                  maxHeight: '60vh',
                  overflow: 'auto',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace'
                }}
              >
                <pre style={{
                  margin: 0,
                  color: '#d4d4d4',
                  fontSize: '0.85rem',
                  lineHeight: 1.4,
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}>
                  {selectedFileForViewing?.content || 'No content available'}
                </pre>
              </Box>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ bgcolor: 'black', p: 2 }}>
            <Button
              onClick={() => setShowFileContent(false)}
              variant="contained"
              sx={{
                bgcolor: '#6e00ff',
                color: 'white',
                '&:hover': { bgcolor: '#5a00cc' }
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Render final view
  if (currentView === 'final') {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3, bgcolor: 'grey.100', minHeight: '100vh' }}>
        {/* Header */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'grey.300' }}>
          <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
            Codebase Organization
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Some of the changes you&apos;ve made require that you update main.py to ensure that 
            any imports and file paths reflect your new directory structure. This is okay, and a{' '}
            <strong>totally normal part of refactoring!</strong> Click into the main.py tab to update the script.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
            💡 Additional editable sections:<br />
            • Import statement: Click the highlighted import line to add your imports<br />
            • Files array: Click the blue highlighted filenames to edit them<br />
            • Load file line: Click the highlighted path area to add a folder path (e.g., &quot;data\&quot;) before the filename<br />
            • Output file name: Click the highlighted prefix area to customize the output filename<br />
            • Overview filename: Click the blue highlighted filename to change the overview output name
          </Typography>
        </Paper>

        {/* Tab Navigation */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant={finalView === 'main' ? 'contained' : 'outlined'}
            onClick={() => setFinalView('main')}
            sx={{ 
              mr: 2,
              bgcolor: finalView === 'main' ? 'black' : 'black',
              color: 'white',
              '&:hover': {
                bgcolor: '#6e00ff'
              },
              '&:active': {
                bgcolor: '#6e00ff'
              }
            }}
          >
            MAIN.PY
          </Button>
          <Button
            variant={finalView === 'directory' ? 'contained' : 'outlined'}
            onClick={() => setFinalView('directory')}
            sx={{ 
              bgcolor: finalView === 'directory' ? 'black' : 'black',
              color: 'white',
              '&:hover': {
                bgcolor: '#6e00ff'
              },
              '&:active': {
                bgcolor: '#6e00ff'
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
                    bgcolor: 'transparent',
                    borderRadius: 1,
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
              
               
               {/* Validation Results */}
               {/* Compact Validation Results - Hidden since popup will be used */}
               {false && showValidation && validationResults && (
                 <Box sx={{ 
                   p: 1.2, 
                   mb: 1.5,
                   bgcolor: validationResults.isValid 
                     ? 'rgba(76, 175, 80, 0.1)' 
                     : 'rgba(244, 67, 54, 0.1)',
                   borderLeft: `3px solid ${validationResults.isValid ? '#4CAF50' : '#f44336'}`,
                   borderRadius: 0.5,
                   position: 'relative'
                 }}>
                   <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       <Typography variant="body2" sx={{ 
                         color: validationResults.isValid ? '#4CAF50' : '#f44336', 
                         fontWeight: 'bold',
                         fontSize: '0.85rem'
                       }}>
                         {validationResults.isValid ? '✅ Validation Passed' : '❌ Validation Issues'}
                       </Typography>
                       
                       {/* Expand/Collapse button for errors */}
                       {validationResults.errors.length > 0 && (
                         <IconButton
                           onClick={() => setExpandedValidation(!expandedValidation)}
                           size="small"
                           sx={{ 
                             color: '#f44336',
                             p: 0.3
                           }}
                           title={expandedValidation ? 'Hide details' : 'Show details'}
                         >
                           {expandedValidation ? 
                             <Box sx={{ fontSize: '0.8rem' }}>▼</Box> : 
                             <Box sx={{ fontSize: '0.8rem' }}>▶</Box>
                           }
                         </IconButton>
                       )}
                     </Box>
                     
                     <IconButton
                       onClick={() => setShowValidation(false)}
                       size="small"
                       sx={{ 
                         color: 'rgba(255, 255, 255, 0.7)',
                         p: 0.3
                       }}
                     >
                       <DeleteIcon fontSize="small" />
                     </IconButton>
                   </Box>
                   
                   {/* Error Messages - Expandable */}
                   {validationResults.errors.length > 0 && (
                     <Box sx={{ mt: 0.8 }}>
                       {expandedValidation ? (
                         // Show all errors when expanded
                         validationResults.errors.map((error, index) => (
                           <Typography key={index} variant="body2" sx={{ 
                             color: '#f44336', 
                             fontSize: '0.75rem',
                             mb: 0.4,
                             lineHeight: 1.3
                           }}>
                             • {error}
                           </Typography>
                         ))
                       ) : (
                         // Show limited errors when collapsed
                         <>
                           {validationResults.errors.slice(0, 2).map((error, index) => (
                             <Typography key={index} variant="body2" sx={{ 
                               color: '#f44336', 
                               fontSize: '0.75rem',
                               mb: 0.4,
                               lineHeight: 1.3
                             }}>
                               • {error}
                             </Typography>
                           ))}
                           {validationResults.errors.length > 2 && (
                             <Typography variant="caption" sx={{ 
                               color: '#f44336', 
                               fontStyle: 'italic',
                               fontSize: '0.7rem'
                             }}>
                               +{validationResults.errors.length - 2} more issues... (click ▶ to expand)
                             </Typography>
                           )}
                         </>
                       )}
                     </Box>
                   )}
                   
                   {/* Success message - Brief */}
                   {validationResults.isValid && (
                     <Typography variant="body2" sx={{ 
                       color: '#4CAF50', 
                       fontSize: '0.75rem',
                       mt: 0.4
                     }}>
                       All import statements and file paths are correctly configured.
                     </Typography>
                   )}
                 </Box>
               )}
               
               {/* Editable Lines Info Banner */}

              {/* Enhanced Code Editor */}
              <Box sx={{ p: 2, bgcolor: 'grey.900' }}>
                <EnhancedCodeEditor
                  content={mainPyContent}
                  onChange={setMainPyContent}
                  disabled={false}
                  editableLines={(() => {
                    const lines = mainPyContent.split('\n');
                    const editableIndexes = [];
                    
                    // Add import line as editable (line 7)
                    editableIndexes.push(7);
                    
                    // Find line with files array
                    for (let i = 0; i < lines.length; i++) {
                      if (lines[i].trim().startsWith('files = [')) {
                        editableIndexes.push(i);
                        break;
                      }
                    }
                    
                    // Find line with load_file call containing {filename}
                    for (let i = 0; i < lines.length; i++) {
                      if (lines[i].includes('load_file(f"') && lines[i].includes('{filename}')) {
                        editableIndexes.push(i);
                        break;
                      }
                    }
                    
                    // Find line with output_path file_identifier
                    for (let i = 0; i < lines.length; i++) {
                      if (lines[i].includes('output_path=f"') && lines[i].includes('_comparison.png')) {
                        editableIndexes.push(i);
                        break;
                      }
                    }
                    
                    // Find line with overview.png output_path
                    for (let i = 0; i < lines.length; i++) {
                      if (lines[i].includes('output_path=f"') && lines[i].includes('.png")') && !lines[i].includes('_comparison.png')) {
                        editableIndexes.push(i);
                        break;
                      }
                    }
                    
                    return editableIndexes;
                  })()}
                />
              </Box>
              
              {/* Control Buttons */}
              {/* <Box sx={{ p: 2, bgcolor: 'grey.800', display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="contained"
                  sx={{ 
                    bgcolor: 'black',
                    color: 'white',
                    '&:hover': { bgcolor: '#6e00ff' },
                    '&:active': { bgcolor: '#6e00ff' }
                  }}
                >
                  EXPAND SCRIPT
                </Button>
                
                <Button
                  variant="contained"
                  sx={{ 
                    bgcolor: 'black',
                    color: 'white',
                    '&:hover': { bgcolor: '#6e00ff' },
                    '&:active': { bgcolor: '#6e00ff' }
                  }}
                >
                  EXECUTE SCRIPT
                </Button>
              </Box> */}
            </Paper>
            
          </Box>
        )}

        {/* Bottom Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => setCurrentView('organize')}
            sx={{ 
              bgcolor: 'black',
              color: 'white',
              borderColor: 'black',
              '&:hover': { 
                bgcolor: '#6e00ff',
                borderColor: '#6e00ff'
              },
              '&:active': { 
                bgcolor: '#6e00ff',
                borderColor: '#6e00ff'
              }
            }}
          >
            BACK TO ORGANIZE
          </Button>
          
          <Button
            variant="contained"
            onClick={handleNextClick}
            sx={{ 
              bgcolor: 'black',
              color: 'white',
              '&:hover': { 
                bgcolor: '#6e00ff' 
              },
              '&:active': { 
                bgcolor: '#6e00ff' 
              }
            }}
            title={validationResults && !validationResults.isValid ? 'Click to see validation issues' : 'Proceed to next step'}
          >
            NEXT
          </Button>
        </Box>
        
        {/* Validation Issues Popup */}
        <CustomModal 
          isOpen={showValidationPopup} 
          closeModal={() => setShowValidationPopup(false)}
          hypothesis={validationResults}
        />
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
    // Check if there are any import statements in the main.py content and editable lines
    const hasImportStatements = () => {
      // Check main content
      const lines = mainPyContent.split('\n');
      const hasImportsInMain = lines.some(line => {
        const trimmedLine = line.trim();
        return trimmedLine.startsWith('import ') || trimmedLine.startsWith('from ');
      });

      // Check editable lines for any meaningful imports
      const hasImportsInEditableLines = Object.values(editableLines).some(line => {
        const trimmedLine = line.trim();
        // Check if it's a meaningful import (not empty "from import" or just spaces)
        return (trimmedLine.startsWith('import ') || trimmedLine.startsWith('from ')) && 
               trimmedLine !== 'from  import ' && 
               trimmedLine !== 'from import' &&
               trimmedLine.length > 5; // Must be more than just "from " or "import "
      });

      return hasImportsInMain || hasImportsInEditableLines;
    };

    if (!hasImportStatements()) {
      // Show error dialog if no import statements found
      setErrorDialog({
        open: true,
        message: 'You must add at least one import statement to the main.py file before creating a new file. Please add an import statement in the editable lines (lines 7-9) and try again.'
      });
      return;
    }

    const newFile = {
      id: Date.now(),
      name: `file_${files.length + 1}.py`,
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
    const trimmedName = newName.trim();
    
    // Check for spaces or hyphens in the filename
    if (trimmedName.includes(' ') || trimmedName.includes('-')) {
      setErrorDialog({
        open: true,
        message: 'Warning: Filenames should not contain spaces or hyphens. Please use underscores instead. For example, use "file_1" instead of "file 1" or "file-1".'
      });
      return;
    }
    
    // Always append .py extension in lowercase
    const finalName = trimmedName.toLowerCase() + '.py';
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
    
    if (draggedFunctionBlock.type === 'import') {
      // Handle import drops
      const importName = draggedFunctionBlock.name;
      const importContent = draggedFunctionBlock.lines.join('\n');
      
      if (targetFile && !targetFile.imports?.includes(importName)) {
        // Create new imports array
        const newImports = [...(targetFile.imports || []), importName];
        
        // Create new importsCode object
        const newImportsCode = {
          ...(targetFile.importsCode || {}),
          [importName]: importContent
        };
        
        // Generate content with imports at the top
        let content = `# ${targetFile.name}\n\n`;
        
        // Add imports first
        newImports.forEach(importName => {
          if (newImportsCode[importName]) {
            content += `${newImportsCode[importName]}\n`;
          }
        });
        content += '\n';
        
        // Add functions content
        targetFile.functions.forEach(functionName => {
          if (targetFile.functionsCode?.[functionName]) {
            content += `${targetFile.functionsCode[functionName]}\n\n`;
          } else {
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
        
        // Create updated file object
        const updatedFile = {
          ...targetFile,
          imports: newImports,
          importsCode: newImportsCode,
          content: content
        };
        
        console.log('Import dropped:', importName);
        console.log('Generated content:', content);
        console.log('Updated file:', updatedFile);
        
        // Update files array
        const updatedFiles = files.map(f => f.id === fileId ? updatedFile : f);
        setFiles(updatedFiles);
        
        // Don't mark imports as moved - they can be dragged multiple times
      }
    } else if (draggedFunctionBlock.type === 'function') {
      // Handle function drops - first remove from all files, then add to target
      
      // Remove function from all files first (including functionsCode)
      const updatedFiles = files.map(f => ({
        ...f,
        functions: f.functions.filter(func => func !== draggedFunctionBlock.name),
        functionsCode: f.functionsCode ? Object.fromEntries(
          Object.entries(f.functionsCode).filter(([key]) => key !== draggedFunctionBlock.name)
        ) : {}
      }));
      
      // Find the target file in the updated files array
      const targetFileFromUpdated = updatedFiles.find(f => f.id === fileId);
      
      if (targetFileFromUpdated) {
        // Create new functionsCode object
        const newFunctionsCode = {
          ...(targetFileFromUpdated.functionsCode || {}),
          [draggedFunctionBlock.name]: draggedFunctionBlock.lines.join('\n')
        };
        
        // Create new functions array
        const newFunctions = [...targetFileFromUpdated.functions, draggedFunctionBlock.name];
        
        // Generate content
        let content = `# ${targetFileFromUpdated.name}\n\n`;
        
        // Add imports first if any
        if (targetFileFromUpdated.imports && targetFileFromUpdated.imports.length > 0) {
          targetFileFromUpdated.imports.forEach(importName => {
            if (targetFileFromUpdated.importsCode?.[importName]) {
              content += `${targetFileFromUpdated.importsCode[importName]}\n`;
            }
          });
          content += '\n';
        }
        
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
      if (targetFileFromUpdated.codeBlocks && targetFileFromUpdated.codeBlocks.length > 0) {
        targetFileFromUpdated.codeBlocks.forEach(block => {
          content += `# ${block.name}\n`;
          content += `${block.content}\n\n`;
        });
      }
      
      // Create updated file object (immutable update)
      const updatedTargetFile = {
        ...targetFileFromUpdated,
        functions: newFunctions,
        functionsCode: newFunctionsCode,
        content: content
      };
      
      console.log('Function dropped:', draggedFunctionBlock.name);
      console.log('Generated content:', content);
      console.log('Updated file:', updatedTargetFile);
      
      // Update files state with the final files array including the updated target
      const finalFiles = updatedFiles.map(f => f.id === fileId ? updatedTargetFile : f);
      setFiles(finalFiles);
      
      }
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
    } else {
      setFiles(updatedFiles);
    }
    
    setDraggedFunction(null);
    
    // Update content after adding function
    setTimeout(() => {
      // Use the updated files state for content generation
      const updatedFile = files.find(f => f.id === fileId);
      if (updatedFile) {
        let content = `# ${updatedFile.name}\n\n`;
        
        // Add functions content
        updatedFile.functions.forEach(functionName => {
          if (updatedFile.functionsCode && updatedFile.functionsCode[functionName]) {
            // Use actual function code if available
            content += `${updatedFile.functionsCode[functionName]}\n\n`;
          } else {
            // Fallback to placeholder code
            content += `# Function: ${functionName}\n`;
            content += `def ${functionName}():\n    # Implementation here\n    pass\n\n`;
          }
        });
        
        // Add code blocks content
        if (updatedFile.codeBlocks && updatedFile.codeBlocks.length > 0) {
          updatedFile.codeBlocks.forEach(block => {
            content += `# ${block.name}\n`;
            content += `${block.content}\n\n`;
          });
        }
        
        setFiles(prevFiles => prevFiles.map(f => f.id === fileId ? { ...f, content } : f));
      }
    }, 100);
    
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
        // Check for spaces or hyphens in the filename
        if (trimmedName.includes(' ') || trimmedName.includes('-')) {
          setErrorDialog({
            open: true,
            message: 'Warning: Filenames should not contain spaces or hyphens. Please use underscores instead. For example, use "file_1" instead of "file 1" or "file-1".'
          });
          return;
        }
        
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
      const trimmedName = newFolderName.trim();
      
      // Check if folder with same name already exists
      const existingFolder = folders.find(folder => 
        folder.name.toLowerCase() === trimmedName.toLowerCase()
      );
      
      if (existingFolder) {
        alert(`A folder named "${trimmedName}" already exists. Please choose a different name.`);
        return;
      }
      
      const newFolder = {
        id: Date.now(),
        name: trimmedName,
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

  const handleDeleteFolder = (folderId) => {
    const folderToDelete = folders.find(f => f.id === folderId);
    if (!folderToDelete) return;
    
    // Check if folder contains any files
    const filesInFolder = organizationFiles.filter(file => file.folder === folderId);
    
    if (filesInFolder.length > 0) {
      const confirmDelete = window.confirm(
        `The folder "${folderToDelete.name}" contains ${filesInFolder.length} file(s). ` +
        `Deleting this folder will move all files back to the root directory. ` +
        `Do you want to continue?`
      );
      
      if (!confirmDelete) {
        return;
      }
      
      // Move all files in the folder back to root
      const updatedFiles = organizationFiles.map(file => 
        file.folder === folderId ? { ...file, folder: null } : file
      );
      setOrganizationFiles(updatedFiles);
    } else {
      // Empty folder - ask for simple confirmation
      const confirmDelete = window.confirm(
        `Are you sure you want to delete the folder "${folderToDelete.name}"?`
      );
      
      if (!confirmDelete) {
        return;
      }
    }
    
    // Remove folder from folders array
    const updatedFolders = folders.filter(f => f.id !== folderId);
    setFolders(updatedFolders);
    
    // Remove from expanded folders
    const newExpanded = new Set(expandedFolders);
    newExpanded.delete(folderId);
    setExpandedFolders(newExpanded);
    
    // Update file locations
    const newLocations = updateFileLocations(organizationFiles, updatedFolders);
    setFileLocations(newLocations);
    
    handleCloseContextMenu();
    
    console.log('Folder deleted:', {
      folderName: folderToDelete.name,
      folderId: folderId,
      filesMovedToRoot: filesInFolder.length,
      timestamp: new Date().toISOString()
    });
  };

  const handleFileDragStart = (e, file) => {
    // Prevent main.py from being dragged
    if (file.id === 'main') {
      e.preventDefault();
      alert('The main.py file cannot be moved or dragged. It must remain in the root directory as it contains the main execution logic.');
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
      f.id !== 'main' && f.id !== 'png' && f.id !== 'nd2' && 
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
          cursor: file.id === 'main' ? 'not-allowed' : 'pointer', // Different cursor for main.py
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
        onClick={() => handleOrgFileClick(file)}
        onContextMenu={(e) => handleContextMenu(e, file)}
        draggable={true} // Allow drag attempt to trigger warning
        onDragStart={(e) => handleFileDragStart(e, file)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative', zIndex: 2 }}>
          {getFileIcon(file.type)}
          <Typography 
            variant="body2" 
            sx={{ 
              ml: 1, 
              fontSize: '0.85rem',
              fontWeight: isMainFile ? 'bold' : 'normal'
            }}
          >
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation(); // Prevent folder toggle
                handleDeleteFolder(folder.id);
              }}
              sx={{
                color: 'rgba(255,255,255,0.5)',
                p: 0.25,
                '&:hover': {
                  color: '#ff4444',
                  bgcolor: 'rgba(255,68,68,0.1)'
                },
                position: 'relative',
                zIndex: 2
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
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
Codebase Organization          
</Typography>
          <Typography variant="body2" color="text.secondary">
            Zooming out, the project appears to have matured to a point at which it may prove 
            prudent to organize it a little. Use the interface below to investigate each file and 
            come up with ideas for how to organize the project. You can click on a file to learn 
            more about it. The <strong>main.py</strong> file contains the remaining unassigned code and main execution logic.
            <br /><br />
            <strong>Step 1:</strong> Create folders and organize your created files into them.
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
          <Box sx={{ width: 400, flexShrink: 0 }}>
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
                '&:hover': { bgcolor: '#6e00ff' },
                '&:active': { bgcolor: '#6e00ff' },
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
                bgcolor: 'black',
                color: 'white',
                borderColor: 'black',
                '&:hover': { 
                  bgcolor: '#6e00ff',
                  borderColor: '#6e00ff'
                },
                '&:active': { 
                  bgcolor: '#6e00ff',
                  borderColor: '#6e00ff'
                }
              }}
            >
              DEBUG FILE LOCATIONS
            </Button>
          </Box>

          {/* Right Side - File Details */}
          <Box sx={{ flex: 1 }}>
            <Card elevation={2} sx={{ p: 2, bgcolor: 'grey.300', minHeight: 400 }}>
              <CardContent>
                {selectedOrgFile ? (
                  <>
                    {/* Instruction text */}
                    <Typography variant="body2" sx={{ color: '#666', mb: 2, fontStyle: 'italic' }}>
                      Click to view description of a file
                    </Typography>
                    
                    {/* Header with file name and description */}
                    <Box sx={{ mb: 3, pb: 2, borderBottom: '2px solid #ddd' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', mb: 1 }}>
                        File Name: {selectedOrgFile.name}
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#555', lineHeight: 1.4 }}>
                        Description: {selectedOrgFile.description}
                      </Typography>
                    </Box>
                    
                    <Box>
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
                    
                    {selectedOrgFile.content && selectedOrgFile.type === 'PY File' && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          File Content:
                        </Typography>
                        <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                          <EnhancedCodeEditor
                            content={selectedOrgFile.content}
                            onChange={() => {}} // Read-only in organize view
                            disabled={true}
                          />
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
            onClick={() => setCurrentView('refactoring')}
            sx={{ 
              bgcolor: 'black', 
              color: 'white',
              '&:hover': { bgcolor: '#6e00ff' },
              '&:active': { bgcolor: '#6e00ff' }
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
                bgcolor: 'black',
                color: 'white',
                '&:hover': { 
                  bgcolor: '#6e00ff'
                },
                '&:active': { 
                  bgcolor: '#6e00ff'
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
                bgcolor: canShowMustOrganize() ? 'black' : 'grey.400',
                color: 'white',
                '&:hover': { 
                  bgcolor: canShowMustOrganize() ? '#6e00ff' : 'grey.400' 
                },
                '&:active': { 
                  bgcolor: canShowMustOrganize() ? '#6e00ff' : 'grey.400' 
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
            Action Required
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
              sx={{
                bgcolor: 'black',
                color: 'white',
                '&:hover': { bgcolor: '#6e00ff' },
                '&:active': { bgcolor: '#6e00ff' }
              }}
            >
              OK, I understand
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
            <MenuItem 
              onClick={() => handleDeleteFolder(contextMenu.item.id)}
              sx={{ color: 'error.main' }}
            >
              Delete Folder
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
            <Button 
              onClick={() => setNewFolderDialog(false)}
              sx={{
                bgcolor: 'black',
                color: 'white',
                '&:hover': { bgcolor: '#6e00ff' },
                '&:active': { bgcolor: '#6e00ff' }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateFolder} 
              variant="contained"
              sx={{
                bgcolor: 'black',
                color: 'white',
                '&:hover': { bgcolor: '#6e00ff' },
                '&:active': { bgcolor: '#6e00ff' }
              }}
            >
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
Codebase Organization        </Typography>
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
                Example Script: (main.py)
              </Typography>
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
                {Array.from({length: 255}, (_, index) => {
                  const codeLines = exampleCode.split('\n');
                  const line = index < codeLines.length ? codeLines[index] : '';
                  
                  const isMainBlock = line.includes('if __name__ == "__main__":') || 
                                     (index > 0 && codeLines.slice(0, index).some(l => l.includes('if __name__ == "__main__":')));
                  
                  return (
                    <div 
                      key={index} 
                      style={{ 
                        lineHeight: '1.4',
                        color: '#cbd5e0',
                        minHeight: `${fontSize * 1.4}rem`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        padding: '1px 0',
                        marginTop: index > 0 && functionBlocks.some(block => block.startLine === index) ? '12px' : '0',
                        marginBottom: functionBlocks.some(block => block.endLine === index) ? '8px' : '0'
                      }}
                    >
                      {String(index + 1).padStart(3, '0')}
                    </div>
                  );
                })}
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
                    // Don't highlight lines after if __name__ == "__main__":
                    const isMainBlock = line.includes('if __name__ == "__main__":') || 
                                       (index > 0 && codeLines.slice(0, index).some(l => l.includes('if __name__ == "__main__":')));
                    
                    if (!isMainBlock) {
                      // Find which function block this line belongs to
                      for (const block of functionBlocks) {
                        if (index >= block.startLine && index <= block.endLine) {
                          functionBlock = block;
                          isFirstLineOfFunction = index === block.startLine;
                          break;
                        }
                      }
                    }
                    
                    const backgroundColor = functionBlock ? (() => {
                      // Find which file this function belongs to
                      const functionFile = files.find(f => f.functions.includes(functionBlock.name));
                      if (functionFile && colorMapTransparent[functionFile.color]) {
                        return colorMapTransparent[functionFile.color];
                      }
                      return 'rgba(100, 116, 139, 0.25)'; // Default slate grey
                    })() : 'transparent';
                    const borderColor = functionBlock ? (() => {
                      // Find which file this function belongs to
                      const functionFile = files.find(f => f.functions.includes(functionBlock.name));
                      if (functionFile && colorMap[functionFile.color]) {
                        return colorMap[functionFile.color];
                      }
                      return '#64748b'; // Default slate grey
                    })() : 'transparent';
                    
                    // Check if this is the last line of a function block
                    const isLastLineOfFunction = functionBlock && index === functionBlock.endLine;
                    
                    return (
                      <div key={index} style={{ 
                        position: 'relative',
                        marginTop: isFirstLineOfFunction && functionBlock ? '12px' : '0',
                        marginBottom: isLastLineOfFunction ? '8px' : '0'
                      }}>
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
                            borderLeft: functionBlock ? `3px solid ${borderColor}` : 'none',
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
                                color: '#000000', // Force black text for better contrast
                                fontWeight: 'bold',
                                fontSize: `${fontSize * 0.75}rem`,
                                backgroundColor: (() => {
                                  // Find which file this function belongs to
                                  const functionFile = files.find(f => f.functions.includes(functionBlock.name));
                                  if (functionFile && colorMap[functionFile.color]) {
                                    return colorMap[functionFile.color];
                                  }
                                  return '#64748b'; // Default slate grey
                                })(),
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
                              title={`Drag ${functionBlock.name}${functionBlock.type === 'function' ? '() function' : ' import'}`}
                            >
                              {functionBlock.type === 'import' ? '📥' : '📦'} {functionBlock.name}{functionBlock.type === 'function' ? '()' : ''}
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
            {isMounted && (
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
              </Box>
            )}
          </Paper>
        </Box>

        {/* Right Side - File Management */}
        <Box sx={{ flex: 1, position: 'relative', zIndex: 1, minWidth: 0 }}>
          <Box sx={{ position: 'relative', zIndex: 1, minWidth: 0, width: '100%', maxWidth: '100%' }}>
            {/* File Tabs */}
            <Box sx={{ mb: 3 }}>
              {isMounted && (
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
                        bgcolor: colorMap[file.color] || '#64748b',
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
              )}
              {isMounted && (
                <Button
                  onClick={addNewFile}
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ 
                    mt: 1, 
                    bgcolor: 'black', 
                    color: 'white',
                    '&:hover': { bgcolor: '#6e00ff' },
                    '&:active': { bgcolor: '#6e00ff' }
                  }}
                >
                  NEW
                </Button>
              )}
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
                {/* Display code for dropped imports */}
                {files.find(f => f.id === selectedFile)?.imports?.map(importName => {
                  const importCode = files.find(f => f.id === selectedFile)?.importsCode?.[importName];
                  return (
                    <Box key={importName} sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ mb: 1, color: 'secondary.main' }}>
                        Import: {importName}
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
                          {importCode || `# Import: ${importName}`}
                        </pre>
                      </Paper>
                    </Box>
                  );
                })}
                
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
                    color="default"
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
                      color="default"
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
            {isMounted && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 3 }}>
                <Button
                  onClick={() => deleteFile(selectedFile)}
                  variant="contained"
                  startIcon={<DeleteIcon />}
                  sx={{ 
                    bgcolor: 'black', 
                    color: 'white',
                    '&:hover': { bgcolor: '#6e00ff' },
                    '&:active': { bgcolor: '#6e00ff' }
                  }}
                >
                  DELETE FILE
                </Button>
                
                {/* Continue Button - appears when there are at least 2 files */}
                {files.length >= 2 && (
                  <Button
                    variant="contained"
                    size="large"
                    sx={{ 
                      bgcolor: 'black', 
                      color: 'white',
                      px: 3,
                      py: 1,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      '&:hover': { 
                        bgcolor: '#6e00ff' 
                      },
                      '&:active': { 
                        bgcolor: '#6e00ff' 
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
            )}
          </Box>
        </Box>
      </Box>
      
      {/* Error Dialog */}
      <Dialog 
        open={errorDialog.open} 
        onClose={() => setErrorDialog({ open: false, message: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>
          Action Required
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
            sx={{
              bgcolor: 'black',
              color: 'white',
              '&:hover': { bgcolor: '#6e00ff' },
              '&:active': { bgcolor: '#6e00ff' }
            }}
          >
            OK, I understand
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CodeRefactoringInterface;