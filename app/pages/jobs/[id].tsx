import { Box, Stack, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import NextPage from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React from 'react';
import { Session } from '../../api/client';
import MainContent from '../../components/MainContent';
import ValidationConfig from '../../components/ValidationConfig';
import ValidationResult from '../../components/ValidationResult';
import useApiClient from '../../hooks/useApiClient';
import theme from '../styles/theme.ts';

const Job: NextPage = () => {
  const [session, setSession] = React.useState<Session | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(true);
  const [progress, setProgress] = React.useState<any>(null);
  const router= useRouter();
  const apiClient = useApiClient();

  const getSession = () => {
    apiClient.session(router.query.id)
      .then(session => setSession(session))
      .catch(err => {
        setErrorMessage(err.message);
      })
      .finally(() => setLoading(false));
  }

  const handleValidate = () => {
    setSession({ ...session, status: 'running' });
    apiClient.validate(session.id)
      .then(session => setSession(session))
      .catch(err => {
        console.log('error caught running validation', err);
      });
  };

  React.useEffect(() => {
    if (!router.query.id) {
      return;
    }

    getSession();
  }, [apiClient, router.query, setSession, setErrorMessage, setLoading]);

  return (
    <React.Fragment>
      <Head>
        <title>Greenlight | NeTEx validation</title>
        <meta name="description" content="Fast and simple NeTEx validation" />
      </Head>

      <MainContent>
        {
          loading ? <div>loading</div> : (
            errorMessage ? <div>{errorMessage}</div> : (
              session.status === 'created' ?
              <ValidationConfig session={session} onValidate={handleValidate} /> :
              <ValidationResult session={session} progress={progress} />
            )
          )
        }
      </MainContent>
    </React.Fragment>
  );
};

export default Job;
