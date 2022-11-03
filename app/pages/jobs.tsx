import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { styled } from '@mui/system';
import { NextPage } from 'next';
import Head from 'next/head';
import React from 'react';
import { Session } from '../api/client';
import MainContent from '../components/MainContent';
import JobTable from '../components/JobTable';
import useApiClient from '../hooks/useApiClient';

const Jobs: NextPage = () => {
  const [sessions, setSessions] = React.useState<Session[] | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const apiClient = useApiClient();

  React.useEffect(() => {
    const loadSessions = () => {
      if (!sessions) {
        setLoading(true);
      }

      apiClient.sessions()
        .then(sessions => {
          setSessions(sessions);
          setLoading(false);
        })
        .catch(err => {
          console.log(err);
        });
    };

    const tid = setInterval(() => loadSessions(), 5000);

    return () => clearInterval(tid);
  }, [apiClient]);

  return (
    <React.Fragment>
      <Head>
        <title>Greenlight | NeTEx validation</title>
        <meta name="description" content="Fast and simple NeTEx validation" />
      </Head>

      <MainContent>
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
          </> )}
          { sessions && <JobTable jobs={sessions} /> }
        </Stack>
      </MainContent>
    </React.Fragment>
  );
};

export default Jobs;
