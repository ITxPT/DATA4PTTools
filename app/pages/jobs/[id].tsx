import { Box, Skeleton, Stack, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React from 'react';
import { Session } from '../../api/client';
import MainContent from '../../components/MainContent';
import ValidationConfig from '../../components/ValidationConfig';
import ValidationResult from '../../components/ValidationResult';
import useApiClient from '../../hooks/useApiClient';

const Job: NextPage = () => {
  const [session, setSession] = React.useState<Session | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(true);
  const router= useRouter();
  const apiClient = useApiClient();

  const handleValidate = (schema: string) => {
    if (!session) {
      return;
    }

    setSession({ ...session, status: 'running' });

    apiClient.validate(session.id, schema)
      .then(session => setSession(session))
      .catch(err => {
        console.log('error caught running validation', err);
      });
  };

  React.useEffect(() => {
    if (!router.query.id) {
      return;
    }

    const getSession = () => {
      apiClient.session(router.query.id as string)
        .then(session => setSession(session))
        .catch(err => {
          setErrorMessage(err.message);
        })
        .finally(() => setLoading(false));
    };

    getSession();
  }, [apiClient, router.query]);

  return (
    <React.Fragment>
      <Head>
        <title>Greenlight | NeTEx validation</title>
        <meta name="description" content="Fast and simple NeTEx validation" />
      </Head>

      <MainContent>
        {
          loading ? (
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
          ) : (
            errorMessage ? <div>{errorMessage}</div> : (
              session?.status === 'created' ?
              <ValidationConfig session={session} onValidate={handleValidate} /> :
              <ValidationResult session={session as any} />
            )
          )
        }
      </MainContent>
    </React.Fragment>
  );
};

export default Job;
