import { Box, Chip, Container, Grid, Tooltip, Typography, Stack } from '@mui/material';
import { green, red } from '@mui/material/colors';
import React from 'react';
import useApiClient from '../hooks/useApiClient';
import useMqttClient from '../hooks/useMqttClient';
import theme from '../styles/theme';

const Footer = () => {
  const [mqttCon, setMqttCon] = React.useState<boolean>(false);
  const [apiCon, setApiCon] = React.useState<boolean>(false);
  const apiClient = useApiClient();
  const mqttClient = useMqttClient();

  const pingApi = () => {
    apiClient.ping()
      .then(() => setApiCon(true))
      .catch(() => setApiCon(false));
  };

  const pingMqtt = () => {
    setMqttCon(mqttClient.connected);
  };

  React.useEffect(() => {
    pingApi();
    pingMqtt();

    const apiId = setInterval(() => pingApi(), 10000);
    const mqttId = setInterval(() => pingMqtt(), 10000);

    return () => {
      clearInterval(apiId);
      clearInterval(mqttId);
    };
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1,
        background: 'rgb(248, 249, 250)',
      }}
    >
      <Box
        sx={{
          margin: '0 100px 10px 100px',
          [theme.breakpoints.down('md')]: {
            marginLeft: '40px',
            marginRight: '40px',
          },
        }}
      >
        <Container
          sx={{
            borderTop: '1px solid #ccc',
            padding: '16px 8px',
          }}
        >
          <Grid container spacing={2}>
            <Grid item sx={{
              display: 'flex',
              justifyContent: 'start',
              [theme.breakpoints.down('md')]: {
                justifyContent: 'center',
              },
            }} xs={12} md={6}>
              <Stack direction="row" spacing={1}>
                <Tooltip title={apiCon ? 'Connection established' : 'Unable to establish a connection'}>
                  <Chip
                    variant="outlined"
                    label="API STATUS"
                    color={apiCon ? 'success' : 'error'}
                    size="small"
                  />
                </Tooltip>
                <Tooltip title={mqttCon ? 'Connection established' : 'Unable to establish a connection'}>
                  <Chip
                    variant="outlined"
                    label="MQTT STATUS"
                    color={mqttCon ? 'success' : 'error'}
                    size="small"
                  />
                </Tooltip>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6} sx={{
              textAlign: 'right',
              [theme.breakpoints.down('md')]: {
                textAlign: 'center',
              }
            }}>
              <Typography>Copyright © 2022 ITxPT</Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Footer;
