import * as React from 'react'
import { useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Modal from '@mui/material/Modal'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 350,
  minWidth: 'fit-content',
  maxHeight: '70vh',
  bgcolor: '#6e00ff', // Changed background color to purple
  // border: '2px solid #000',
  border: 'none',
  borderRadius: '4px',
  boxShadow: 24,
  p: 4,
  color: 'white', // Changed text color to white for better contrast
  outline: 0,
  overflow: 'auto',
}

export default function CustomModal({ isOpen, closeModal, hypothesis }) {
  // Check if this is validation results data
  const isValidationData = hypothesis && hypothesis.hasOwnProperty('isValid');
  return (
    <div>
      {/* <Button onClick={handleOpen}>Open modal</Button> */}
      <Modal
        open={isOpen}
        onClose={closeModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Button
            onClick={closeModal}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'white', // Changed button text color to purple
              // backgroundColor: 'white', // Changed button background to white
              minWidth: 'auto',
              // width: 'fit-content',
              padding: '4px 12px',
              borderRadius: '50%',
              '&:hover': {
                backgroundColor: 'lightgray', // Optional: change hover color for better visibility
                color: 'black',
              },
            }}
          >
            X
          </Button>
          <Typography
            id="modal-modal-title"
            variant="h6"
            component="h2"
            sx={{ mb: 2 }}
          >
            {isValidationData ? 'Validation Issues' : 'Codebase Organization'}
          </Typography>

          {isValidationData ? (
            <Typography
              id="modal-modal-description"
              variant="body2"
              component="div"
              sx={{ mb: 2 }}
            >
              {hypothesis.errors && hypothesis.errors.length > 0 && (
                <div>
                  <Typography variant="h6" sx={{ color: '#ffcccb', mb: 1 }}>
                    ❌ Issues Found:
                  </Typography>
                  <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                    {hypothesis.errors.map((error, index) => (
                      <li key={index} style={{ marginBottom: '8px', color: '#ffcccb' }}>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {hypothesis.warnings && hypothesis.warnings.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <Typography variant="h6" sx={{ color: '#ffd700', mb: 1 }}>
                    ⚠️ Warnings:
                  </Typography>
                  <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                    {hypothesis.warnings.map((warning, index) => (
                      <li key={index} style={{ marginBottom: '8px', color: '#ffd700' }}>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                Please fix these issues before proceeding to the next step.
              </Typography>
            </Typography>
          ) : (
            <Typography
              id="modal-modal-title"
              variant="h6"
              component="h3"
              sx={{ mb: 2 }}
            >
              <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                <li style={{ marginBottom: '12px' }}>
                  Remember the distinction between source and script: one is the &quot;lower&quot; code that accomplishes the details of computation, the other is the &quot;higher&quot; code that arranges the broader workflow. In this project, what&apos;s your source and what&apos;s your script?
                </li>
                <li style={{ marginBottom: '12px' }}>
                  Try to avoid overly nested directory structure unless absolutely necessary. Remember that the more nested your directory is, the more sub-indexing your script will need to do to access different paths.
                </li>
                <li style={{ marginBottom: '12px' }}>
                  Which files do you think need to be at the very top level of your project directory?
                </li>
                <li style={{ marginBottom: '12px' }}>
                  The place your file lives contextualizes its function. For example, a license file in the top level of the project directory will be assumed to describe the license for the entire project, but the license file in a folder that contains data could be interpreted to describe the license of just that data.
                </li>
                <li style={{ marginBottom: '12px' }}>
                  Think about the audience that is likely to look at your project directory. For this kind of script, that&apos;s probably going to be you or someone else in your lab who is interested in viewing microscopy images and their preprocessing parameters.
                </li>
                <li style={{ marginBottom: '12px' }}>
                  Consider the uses that each type of file in your project directory might have. It&apos;s a good idea to structure your directory such that you have one folder for each such component that a user or developer might need.
                </li>
              </ul>
            </Typography>
          )}
        </Box>
      </Modal>
    </div>
  )
}
