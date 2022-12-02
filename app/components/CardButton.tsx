import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Card, CardContent } from '@mui/material'
import { grey, blue } from '@mui/material/colors'
import { lighten } from '@mui/material/styles'
import React from 'react'

export interface CardButtonProps {
  children: JSX.Element[] | JSX.Element | string
  onClick?: () => void
}

const CardButton = ({
  children,
  onClick
}: CardButtonProps): JSX.Element => {
  const handleOnClick = (): void => {
    if (onClick !== undefined) {
      onClick()
    }
  }

  return (
    <Card
      sx={{
        borderRadius: 4,
        cursor: 'pointer',
        position: 'relative',
        border: `1px solid ${grey[300]}`,
        background: 'white',
        transition: 'background-color 150ms, border-color 150ms',
        '&:hover': {
          borderColor: blue[200],
          backgroundColor: lighten(blue[50], 0.4)
        }
      }}
    >
      <CardContent onClick={handleOnClick}>
        { children }
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            padding: '14px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ChevronRightIcon />
        </Box>
      </CardContent>
    </Card>
  )
}

export default CardButton
