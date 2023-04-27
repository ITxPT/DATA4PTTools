import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Button, Stack, Typography } from '@mui/material'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import React from 'react'
import type { Session } from '../../../api/types'
import App from '../../../components/App'
import ErrorAlert from '../../../components/ErrorAlert'
import FileUpload, { type FileList } from '../../../components/FileUpload'
import JobStatus from '../../../components/JobStatus'
import FullscreenLoader from '../../../components/FullscreenLoader'
import ValidationStepper from '../../../components/ValidationStepper'
import useApiClient from '../../../hooks/useApiClient'

const Profiles: NextPage = () => {
  const [session, setSession] = React.useState<Session | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string>('')
  const [errorOpen, setErrorOpen] = React.useState<boolean>(false)
  const [loading, setLoading] = React.useState<boolean>(true)
  const [disabled, setDisabled] = React.useState<boolean>(false)
  const [canValidate, setCanValidate] = React.useState<boolean>(false)
  const [fileList, setFileList] = React.useState<Record<string, unknown>>({})
  const router = useRouter()
  const apiClient = useApiClient()

  const handleOnUpload = async (file: any, cb: any): Promise<void> => {
    await apiClient.addFile(session?.id ?? '', file, cb)
  }

  const handleOnChange = (fileList: FileList): void => {
    setFileList({ ...fileList })
  }

  const handleNewValidationClick = (): void => {
    setLoading(true)

    apiClient.createSession()
      .then(async (session) => {
        await router.push('/jobs/' + session.id)
      })
      .catch(err => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  React.useEffect(() => {
    setDisabled(session?.status !== 'created')
    setCanValidate(session?.status === 'created' && Object.keys(fileList).length > 0)
  }, [session, fileList, setDisabled, setCanValidate])

  React.useEffect(() => {
    const id = router.query.id ?? ''

    if (id === '') {
      return
    }

    setLoading(true)

    apiClient.session(id as string).then(session => {
      setErrorMessage('')
      setSession(session)

      if (session.files?.length > 0) {
        setFileList(session.files.reduce((o: any, v: any) => {
          o[v.name] = {
            ...v,
            status: 'uploaded',
            progress: 100
          }

          return o
        }, {}))
      }
    }).catch(err => {
      setSession(null)
      setErrorMessage(err.message)
    }).finally(() => {
      setLoading(false)
    })
  }, [apiClient, router.query])

  return (
    <App authRequired>
      <ErrorAlert
        open={errorOpen}
        message={errorMessage}
        onClose={() => {
          setErrorOpen(false)
        }}
      />

      <Stack spacing={2}>
        <Stack spacing={4}>
          <ValidationStepper step={1} />
          <div>
            <Button
              variant="contained"
              onClick={() => {
                router.back()
              }}
              startIcon={<ArrowBackIcon />}
            >
              Go back
            </Button>
          </div>
          <JobStatus session={session} onValidate={handleNewValidationClick} />
          <Typography variant="h3">Upload files</Typography>
        </Stack>

        <Typography gutterBottom>Select which files to validate by clicking &apos;Select file(s)&apos;</Typography>

        <Stack alignItems="center" spacing={2}>
          <FileUpload
            values={fileList}
            disabled={disabled}
            onUpload={handleOnUpload}
            onChange={handleOnChange}
            onError={({ errorMessage }: { errorMessage: string }) => {
              return `Error caught uploading file, message: ${errorMessage}`
            }}
          />
          <Button
            variant="contained"
            disabled={!canValidate}
            onClick={() => {
              if (canValidate) {
                setLoading(true)

                apiClient.validate(session?.id ?? '')
                  .catch(err => {
                    console.log(err)
                  })

                router.push(`/jobs/${session?.id ?? ''}/result`)
                  .catch(err => {
                    console.log(err)
                  })
              }
            }}
          >
            Validate
          </Button>
        </Stack>
      </Stack>

      <FullscreenLoader open={loading} />
    </App>
  )
}

export default Profiles
