import {
  Box,
  Step,
  StepLabel,
  Stepper
} from '@mui/material'
import React from 'react'

const steps = [
  'Configuration',
  'Files',
  'Validate'
]

const ValidationStepper = ({ step }: { step: number }): JSX.Element => {
  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={step}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  )
}

export default ValidationStepper
