import {
  Box,
  Skeleton,
  Stack,
  Typography
} from '@mui/material'
import { NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import { Session } from '../api/types'
import JobTable from '../components/JobTable'
import useApiClient from '../hooks/useApiClient'

const Jobs: NextPage = () => {
  const [sessions, setSessions] = React.useState<Session[] | null>(null)
  const [loading, setLoading] = React.useState<boolean>(true)
  const apiClient = useApiClient()

  React.useEffect(() => {
    const loadSessions = (): void => {
      if (sessions === null) {
        setLoading(true)
      }

      apiClient.sessions()
        .then(sessions => {
          setSessions(sessions)
          setLoading(false)
        })
        .catch(err => {
          console.log(err)
        })
    }
    const tid = setInterval(() => loadSessions(), 5000)

    return () => clearInterval(tid)
  }, [apiClient])

  return (
    <React.Fragment>
      <Head>
        <title>Greenlight | NeTEx validation</title>
        <meta name="description" content="Fast and simple NeTEx validation" />
      </Head>

      <Stack spacing={4}>
        <Typography variant="h3">Jobs</Typography>
        { loading && (<>
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
        </>)}
        { sessions !== null && <JobTable jobs={sessions} /> }
      </Stack>
    </React.Fragment>
  )
}

export default Jobs
