// app/layout.js
'use client'
import React, { useState } from 'react'
import { AppBar, Toolbar, Typography, Box, Container } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import Image from 'next/image'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Header from './components/Header/Header'
import CustomModal from './components/CustomModal'

// Create theme here directly if you're having issues with the import
const theme = createTheme({
  palette: {
    primary: {
      main: '#6200ee',
    },
  },
})

export default function RootLayout({ children }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleLogoClick = () => {
    router.push('/')
  }

  const handleHelpClick = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const openModal = () => {
    setIsGuideModalVisible(true)
  }

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <CustomModal isOpen={isModalOpen} closeModal={closeModal} />

          <AppBar
            position="fixed"
            color="default"
            elevation={1}
            sx={{
              backgroundColor: 'white',
              borderBottom: '1px solid #e0e0e0',
              zIndex: 1200,
            }}
          >
            <Toolbar sx={{ height: 64 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Header
                  // onLogoClick={handleLogoClick}
                  onHelpClick={handleHelpClick}
                  text="Codebase Organization"
                />   
              </Box>
            </Toolbar>
          </AppBar>

          <Toolbar />

          <Container component="main" sx={{ pt: 2, pb: 4 }}>
            {children}
          </Container>
        </ThemeProvider>
      </body>
    </html>
  )
}
