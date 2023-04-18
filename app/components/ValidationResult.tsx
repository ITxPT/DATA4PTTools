import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { Box, Button, ButtonGroup, Card, Chip, Divider, Grid, Menu, MenuItem, Skeleton, Stack, Tooltip, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import React from 'react'
import ErrorAlert from './ErrorAlert'
import InfoMessage from './InfoMessage'
import TaskRow from './TaskRow'
import type { Session } from '../api/types'
import useApiClient from '../hooks/useApiClient'
import theme from '../styles/theme'

function truncName(name: string): string {
  const trunc = []
  const nameSlice = name.split('/')

  if (nameSlice.length > 1) {
    trunc.push(nameSlice[0].split('.').pop(), '..')
  }

  trunc.push(nameSlice.pop())

  return trunc.join('/')
}

interface ValidationResultProps {
  session: Session
  onValidateAnother?: () => void
}

const ValidationResult = (props: ValidationResultProps): JSX.Element => {
  const router = useRouter()
  const [session, setSession] = React.useState<Session>(props.session)
  const [tasks, setTasks] = React.useState<any[]>([])
  const [errorOpen, setErrorOpen] = React.useState<boolean>(false)
  const [errorMessage, setErrorMessage] = React.useState<string>('')
  const apiClient = useApiClient()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleValidateAnother = (): void => {
    if (props.onValidateAnother !== undefined) {
      props.onValidateAnother()
    }
  }

  const handleCloseError = (): void => {
    setErrorOpen(false)
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = (): void => {
    setAnchorEl(null)
  }

  React.useEffect(() => {
    if (session === null || session.results === undefined) {
      return
    }

    const tasks = session.results.map(v => {
      const running = v.validations.find((v: any) => {
        const isValid: boolean = v.valid !== undefined && v.valid
        const hasErrors = v.errors !== undefined

        return !isValid && !hasErrors
      }) !== undefined

      return {
        name: truncName(v.name),
        originalName: v.name,
        valid: v.valid,
        status: running ? 'running' : 'complete',
        validations: v.validations.map((v: any) => ({
          name: v.name,
          valid: v.valid,
          status: running ? 'running' : 'complete',
          errors: v.errors ?? []
        }))
      }
    }).sort((a, b) => a.name > b.name ? 1 : -1)

    setTasks(tasks)
  }, [session])

  React.useEffect(() => {
    if (session === null || session.status === 'complete') {
      return
    }

    const i = setInterval(() => {
      apiClient.session(session.id)
        .then(setSession)
        .catch(err => {
          setErrorOpen(true)
          setErrorMessage(err.message)
        })
    }, 5000)

    return () => {
      clearInterval(i)
    }
  }, [session, setSession])

  return (
    <Stack spacing={4}>
      <ErrorAlert open={errorOpen} message={errorMessage} onClose={handleCloseError} />
      <Stack spacing={1} direction="row">
        <Typography variant="h3">Validation result</Typography>
        {session !== undefined && (
          <Stack direction="row" alignItems="center" gap={1}>
            <Chip
              size="small"
              label={session.name}
              sx={{ [theme.breakpoints.down('md')]: { display: 'none' } }}
              color="info"
            />
            <Chip
              size="small"
              label={session.id}
              sx={{ [theme.breakpoints.down('md')]: { display: 'none' } }}
            />
          </Stack>
        )}
      </Stack>
      <Stack
        gap={2}
        sx={{
          background: '#fff',
          padding: 2,
          border: '1px solid #e0e0e0',
          borderRadius: 2,
        }}
      >
        <Typography variant="h5">{session.profile?.description}</Typography>
        <Stack direction="row" flexWrap="wrap" gap="4px" maxWidth={'100%'}>
          {
            session.profile?.scripts.map(script => (
              <Tooltip
                placement="top"
                key={script.name}
                title={script.longDescription}
                disableInteractive
              >
                <Chip
                  size="small"
                  label={script.description}
                />
              </Tooltip>
            ))
          }
        </Stack>
      </Stack>
      <Box>
        {tasks !== undefined && tasks.length > 0
          ? (
            tasks.map(task => <TaskRow key={task.name} session={session} task={task} />)
          )
          : (
            <>
              <Box>
                <Skeleton height={50} />
                <Skeleton animation="wave" />
                <Skeleton animation={false} />
              </Box>
              <Box>
                <Skeleton height={50} />
                <Skeleton animation="wave" />
                <Skeleton animation={false} />
              </Box>
            </>
          )
        }
      </Box>
      <Divider />
      <Grid container>
        <Grid item xs={12} md={6}>
          <ButtonGroup disabled={session.status !== 'complete'}>
            <a
              href={apiClient.reportLink(session.id, 'csv')}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="contained">Download report</Button>
            </a>
            <Button
              variant="contained"
              size="small"
              onClick={handleClick}
            >
              <ArrowDropDownIcon />
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
            >
              <a
                href={apiClient.reportLink(session.id, 'json')}
                target="_blank"
                rel="noreferrer"
              >
                <MenuItem onClick={handleClose}>
                  json
                </MenuItem>
              </a>
              <a
                href={apiClient.reportLink(session.id, 'csv')}
                target="_blank"
                rel="noreferrer"
              >
                <MenuItem onClick={handleClose}>
                  csv
                </MenuItem>
              </a>
            </Menu>
          </ButtonGroup>
        </Grid>
        <Grid item xs={12} md={6} sx={{ textAlign: 'end' }}>
          <Button
            variant="contained"
            onClick={handleValidateAnother}
          >
            Validate with this configuration
          </Button>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default ValidationResult
