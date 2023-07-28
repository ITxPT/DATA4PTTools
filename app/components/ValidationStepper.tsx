import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  Box,
  Button,
  Stack,
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

interface ValidationStepperProps {
  step: number
  onBack?: () => void
}

const ValidationStepper = ({
  step,
  onBack
}: ValidationStepperProps): JSX.Element => {
  return (
    <Stack spacing={4}>
      <Box sx={{ width: '100%' }}>
        <Stepper activeStep={step}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
      {onBack != null && (
        <div>
          <Button
            variant="contained"
            onClick={onBack}
            startIcon={<ArrowBackIcon />}
          >
            Go back
          </Button>
        </div>
      )}
    </Stack>
  )
}

export default ValidationStepper
