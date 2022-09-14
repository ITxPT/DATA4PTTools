import EmailIcon from '@mui/icons-material/Email';
import GitHubIcon from '@mui/icons-material/GitHub';
import { Alert, Box, Button, Grid, Stack, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import ErrorAlert from '../components/ErrorAlert';
import MainContent from '../components/MainContent';
import useApiClient from '../hooks/useApiClient';
import useSessionStore from '../hooks/useSessionStore';
import theme from '../styles/theme';

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
        setSession(undefined);
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
        <title>NeTEx validation | Greenlight</title>
        <meta name="description" content="Fast and simple NeTEx validation" />
      </Head>

      <ErrorAlert open={errorOpen} message={errorMessage} onClose={handleClose} />

      <MainContent>
        <Stack
          spacing={{ xs: 2, md: 4 }}
          justifyContent="center"
        >
          <Stack spacing={2}>
            <Typography variant="h4">Data4PT</Typography>
            <Typography>
The DATA4PT project aims to advance data-sharing practices in the public transport sector by supporting the development of data exchange standards and models, to fulfil the needs of multimodal travel information service providers.
            </Typography>
            <Typography gutterBottom>By supporting EU Member States in deploying a set of harmonised European public data standards (Transmodel, NeTEx and SIRI), DATA4PT wants to enable union-wide multimodal travel information services and contribute to a seamless door-to-door travel ecosystem across Europe that covers all mobility services.</Typography>
            <Typography variant="h4">Validation tool</Typography>
            <Typography>
              Key activity of DATA4PT project is the development of validation tools for NeTEx and SIRI datasets. As NeTEx and SIRI are the EU standardised formats for public transport data in National Access Points (NAPs), the purpose of validation is to ensure a certain level of quality of the published data. The quality dimension is aligned with the overall objective of the project to enable the implementation of ITS Directive Delegated Regulation EU 2017/1926 and therefore the interoperable exchange of travel and traffic data across Europe.
            </Typography>
            <Typography>
              If you have feedback, questions or bug reports please do not hesitate to send them our way through <Link href="https://github.com/ITxPT/DATA4PTTools"><a target="_blank"><GitHubIcon sx={{ fontSize: '12px' }} /> GitHub</a></Link> or <Link passHref href="mailto:anastasia.founta@itxpt.org;jesper.j.tornros@concreteit.se;petter.kvarnfors@concreteit.se"><a target="_blank"><EmailIcon sx={{ fontSize: '12px' }} /> Email</a></Link>.
            </Typography>
          </Stack>
          <Alert severity="info">
            Using the online version may apply limitations. For regular use, download and install the tool for free from <Link href="https://github.com/ITxPT/DATA4PTTools"><a target="_blank">GitHub</a></Link> or <Link href="https://hub.docker.com/r/lekojson/greenlight"><a target="_blank">Docker</a></Link>
          </Alert>
          <Stack alignItems="center">
            <Button
              onClick={handleClick}
              variant="contained"
            >
              Begin validating
            </Button>
          </Stack>
        </Stack>
      </MainContent>
    </React.Fragment>
  );
};

export default Home;
