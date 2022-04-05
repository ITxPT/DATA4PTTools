import { Alert, Button, Snackbar, SnackbarContent, Stack } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import NextPage from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React from 'react';
import MainContent from '../components/MainContent';
import useApiClient from '../hooks/useApiClient';
import useSessionStore from '../hooks/useSessionStore';
import theme from '../styles/theme.ts';

type ErrorAlertProps = {
  message: string;
  open: boolean;
  onClose: () => void;
}

const ErrorAlert = (props: ErrorAlertProps) => {
  const { message, open, onClose } = props;

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert severity="error" onClose={onClose}>{message}</Alert>
    </Snackbar>
  );
};

const Home: NextPage = () => {
  const apiClient = useApiClient();
  const router = useRouter();
  const { session, setSession } = useSessionStore();
  const [ errorOpen, setErrorOpen ] = React.useState<boolean>(false);
  const [ errorMessage, setErrorMessage ] = React.useState<string>('test');

  const handleClick = () => {
    apiClient.createSession()
      .then(session => {
        setSession(session);
        router.push('/jobs/' + session.id);
      })
      .catch(err => {
        setSession(null);
        setErrorOpen(true);
        setErrorMessage(err.message);
      });
  };

  const handleClose = () => setErrorOpen(false);

  React.useEffect(() => {
    if (!errorOpen) {
      return;
    }

    const tid = setTimeout(() => setErrorOpen(false), 10000);

    return () => clearTimeout(tid);
  }, [errorOpen, setErrorOpen]);

  return (
    <React.Fragment>
      <Head>
        <title>Greenlight | NeTEx validation</title>
        <meta name="description" content="Fast and simple NeTEx validation" />
      </Head>

      <ErrorAlert open={errorOpen} message={errorMessage} onClose={handleClose} />

      <MainContent>
        <Stack sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Button
            onClick={handleClick}
            variant="contained"
          >
            Begin validating
          </Button>
        </Stack>
      </MainContent>
    </React.Fragment>
  );
};

export default Home;
