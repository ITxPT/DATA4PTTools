import { Box, Chip, Container, Grid, Stack, Tooltip, Typography } from '@mui/material'
import Image, { ImageLoaderProps } from 'next/image'
import React from 'react'
import MainContent from '../components/MainContent'
import useApiClient from '../hooks/useApiClient'
import useMqttClient from '../hooks/useMqttClient'
import theme from '../styles/theme'

const imageLoader = ({ src }: ImageLoaderProps): string => src

const Footer = (): JSX.Element => {
  const [mqttCon, setMqttCon] = React.useState<boolean>(false)
  const [apiCon, setApiCon] = React.useState<boolean>(false)
  const apiClient = useApiClient()
  const mqttClient = useMqttClient()

  React.useEffect(() => {
    const pingApi = (): void => {
      apiClient.ping()
        .then(() => setApiCon(true))
        .catch(() => setApiCon(false))
    }

    const pingMqtt = (): void => {
      setMqttCon(mqttClient.connected)
    }

    pingApi()
    pingMqtt()

    const apiId = setInterval(() => pingApi(), 10000)
    const mqttId = setInterval(() => pingMqtt(), 10000)

    return () => {
      clearInterval(apiId)
      clearInterval(mqttId)
    }
  }, [apiClient, mqttClient.connected])

  return (
    <>
      <Box sx={{ paddingBottom: '100px' }}>
        <MainContent>
          <Grid container spacing={{ xs: 0, md: 4 }} justifyContent="center">
            <Grid item xs={8} md={4}>
              <Box sx={{ position: 'relative', minHeight: '150px' }}>
                <a href="https://data4pt-project.eu/" target="_blank" rel="noreferrer">
                  <Image
                    unoptimized
                    alt="data4pt logotype"
                    src="/data4pt.png"
                    layout="fill"
                    objectFit="contain"
                    loader={imageLoader}
                  />
                  </a>
              </Box>
            </Grid>
            <Grid item xs={8} md={4}>
              <Box sx={{ position: 'relative', minHeight: '150px' }}>
                <a href="https://itxpt.org/" target="_blank" rel="noreferrer">
                  <Image
                    unoptimized
                    alt="itxpt logotype"
                    src="/itxpt.jpeg"
                    layout="fill"
                    objectFit="contain"
                    loader={imageLoader}
                  />
                </a>
              </Box>
            </Grid>
          </Grid>
          <Stack sx={{ marginTop: '20px' }} alignItems="center">
            <Typography>The tool is developed by ITxPT co-funded by CEF Initiative in the framework of DATA4PT project. <a href="https://github.com/ITxPT/DATA4PTTools/blob/develop/LICENSE" target="_blank" rel="noreferrer">MIT license</a> is applied.</Typography>
          </Stack>
        </MainContent>
      </Box>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1,
          background: 'rgb(248, 249, 250)'
        }}
      >
        <Box
          sx={{
            margin: '0 100px 10px 100px',
            [theme.breakpoints.down('md')]: {
              marginLeft: '40px',
              marginRight: '40px'
            }
          }}
        >
          <Container
            sx={{
              borderTop: '1px solid #ccc',
              padding: '16px 8px'
            }}
          >
            <Grid container spacing={2}>
              <Grid item sx={{
                display: 'flex',
                justifyContent: 'start',
                [theme.breakpoints.down('md')]: {
                  justifyContent: 'center'
                }
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
            </Grid>

          </Container>
        </Box>
      </Box>
    </>
  )
}

export default Footer
