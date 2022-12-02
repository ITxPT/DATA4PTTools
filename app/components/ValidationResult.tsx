import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { Box, Button, ButtonGroup, Divider, Grid, Menu, MenuItem, Skeleton, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import React from 'react'
import ErrorAlert from './ErrorAlert'
import InfoMessage from './InfoMessage'
import TaskRow from './TaskRow'
import { Session } from '../api/types'
import useApiClient from '../hooks/useApiClient'
import { useSubscription } from '../hooks/useMqttClient'
import theme from '../styles/theme'

function truncName (name: string): string {
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
}

const ValidationResult = (props: ValidationResultProps): JSX.Element => {
  const { session } = props
  const router = useRouter()
  const documentStatus = useSubscription(session !== undefined ? `sessions/${session.id}/documents/+` : '')
  const [tasks, setTasks] = React.useState<any[]>([])
  const [errorOpen, setErrorOpen] = React.useState<boolean>(false)
  const [errorMessage, setErrorMessage] = React.useState<string>('')
  const apiClient = useApiClient()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  React.useEffect(() => {
    if (documentStatus === null) {
      return
    }

    const data = documentStatus.d
    const taskIndex = tasks.findIndex(t => t.originalName === data.document)

    if (taskIndex === -1) {
      setTasks([
        ...tasks,
        {
          name: truncName(data.document),
          originalName: data.document,
          valid: false,
          status: documentStatus.t === 'VALIDATE_DOCUMENT_START' ? 'running' : 'complete',
          validations: []
        }
      ].sort((a: any, b: any) => a.name > b.name ? 1 : -1))
    }
  }, [documentStatus])

  const handleValidateAnother = (): void => {
    apiClient.createSession()
      .then(async (session) => {
        await router.push('/jobs/' + session.id)
      })
      .catch(err => {
        setErrorOpen(true)
        setErrorMessage(err.message)
      })
  }

  const handleCloseError = (): void => setErrorOpen(false)

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

  return (
    <Stack spacing={4}>
      <ErrorAlert open={errorOpen} message={errorMessage} onClose={handleCloseError} />
      <Stack spacing={1} direction="row">
        <Typography variant="h3">Validation result</Typography>
        { session !== undefined && (
          <Typography variant="body2" sx={{ [theme.breakpoints.down('md')]: { display: 'none' } }}>[{session.id}]</Typography>
        )}
      </Stack>
      <InfoMessage>
        <span>Are you interested in diving deeper? Consider testing it locally with<a href="https://hub.docker.com/r/lekojson/greenlight" target="_blank" rel="noreferrer">Docker</a></span>
      </InfoMessage>
      <Box>
        { tasks !== undefined && tasks.length > 0
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
            Validate more files
          </Button>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default ValidationResult
