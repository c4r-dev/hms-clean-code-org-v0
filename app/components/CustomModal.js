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
  bgcolor: '#6e00ff', // Changed background color to purple
  // border: '2px solid #000',
  border: 'none',
  borderRadius: '4px',
  boxShadow: 24,
  p: 4,
  color: 'white', // Changed text color to white for better contrast
  outline: 0,
}

export default function CustomModal({ isOpen, closeModal, hypothesis }) {
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
            Card Sorting
          </Typography>

          <Typography
            id="modal-modal-title"
            variant="h6"
            component="h2"
            sx={{ mb: 2 }}
          >
            Each card represents a potential concern with a hypothetical fibromyalgia study. 
            <br/>
            You can click on each card to review the concern in greater detail. 

            Drag cards to the bin that you think represents the best control approach. 
            <br/> <br></br>
            For example, if you think a given card is best addressed by adding a control group, you would drag it to the TEST bin, while a card that you would like to address by randomizing some element of the study would be dragged to the DISTRIBUTE bin.
          </Typography>
        </Box>
      </Modal>
    </div>
  )
}
