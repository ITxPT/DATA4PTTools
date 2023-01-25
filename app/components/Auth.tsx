import { AlternateEmail } from '@mui/icons-material'
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormGroup,
  Link,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import React from 'react'
import isEmail from 'validator/lib/isEmail'
import LogoIcon from './icons/LogoIcon'

function getGreeting (date: Date): string {
  const hour = date.getHours()

  if (hour >= 5 && hour < 12) {
    return 'Good morning!'
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon!'
  }

  return 'Good evening!'
}

interface AuthProps {
  onSubmit: (email: string) => void
}

const Auth = (props: AuthProps): JSX.Element => {
  const [email, setEmail] = React.useState<string>('')
  const [validationErr, setValidationErr] = React.useState<boolean>(false)
  const [checked, setChecked] = React.useState<boolean>(false)
  const [notCheckedError, setNotCheckedError] = React.useState<boolean>(false)
  const [formSubmitted, setFormSubmitted] = React.useState<boolean>(false)

  const handleSubmit = (): void => {
    let hasError = false

    if (!checked) {
      hasError = true
      setNotCheckedError(true)
    }
    if (!isEmail(email)) {
      hasError = true
      setValidationErr(true)
    }

    if (!hasError) {
      setFormSubmitted(true)
      props.onSubmit(email)
    }
  }

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setValidationErr(false)
    setEmail(event.target.value)
  }

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setNotCheckedError(!event.target.checked)
    setChecked(event.target.checked)
  }

  return (
    <Container
      maxWidth='xs'
      sx={{ paddingTop: 8 }}
    >
      <Stack spacing={6} alignItems='center'>
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '150px',
          height: '150px',
          borderRadius: '100%',
          border: '4px solid black'
        }}>
          <LogoIcon sx={{ fontSize: '100px' }} />
        </Box>
        <Stack spacing={2} alignItems='center'>
          <Typography variant='h1'>{getGreeting(new Date())}</Typography>
          <Typography>
            {/* TODO fix copy */}
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </Typography>
        </Stack>
        <Stack spacing={2} sx={{ width: '100%' }}>
          <TextField
            InputProps={{
              endAdornment: <AlternateEmail />
            }}
            error={validationErr}
            required
            id='email-required'
            label='Email'
            value={email}
            onChange={handleInputChange}
            disabled={formSubmitted}
          />
          <FormControl error={notCheckedError}>
            <FormGroup>
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={checked}
                    onChange={handleToggle}
                    required size="small"
                    disabled={formSubmitted}
                  />
                )}
                label={(
                  <Typography>
                    I agree to the <Link href="/TODO" target="_blank">Terms of Service</Link> and <Link href="/TODO" target="_blank">Privacy Policy</Link>
                  </Typography>
                )}
              />
              {notCheckedError && (
                <FormHelperText>
                  Please check this box if you wish to proceed
                </FormHelperText>
              )}
            </FormGroup>
          </FormControl>
          <Button
            variant='contained'
            onClick={handleSubmit}
            disabled={!checked || formSubmitted}
          >
            { formSubmitted ? 'Check your inbox!' : 'Send link' }
          </Button>
        </Stack>
      </Stack>
    </Container>
  )
}

export default Auth
