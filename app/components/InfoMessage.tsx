import { Alert, Box, Container, Stack } from '@mui/material';
import theme from '../styles/theme';

const InfoMessage = (props: any) => {
  return (
    <Box sx={props.sx}>
      <Container>
        <Alert severity="info">
          <Stack direction="row" spacing={1} alignItems="center">
            {props.children}
          </Stack>
        </Alert>
      </Container>
    </Box>
  );
};

export default InfoMessage;
