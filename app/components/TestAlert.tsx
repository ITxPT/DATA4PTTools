import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Alert, Box, Container, Stack } from '@mui/material';
import theme from '../styles/theme';

const TestAlert = () => {
  return (
    <Box sx={{
      paddingLeft: '80px',
      paddingTop: '20px',
      paddingRight: '40px',
      [theme.breakpoints.down('md')]: {
        paddingLeft: '0',
        paddingTop: '20px',
      },
    }}>
      <Container>
        <Alert severity="info">
          <Stack direction="row" spacing={1} alignItems="center">
            <span>Note that this is an early build, please provide feedback in one of the channels listed to the right</span>
            <ArrowForwardIcon />
          </Stack>
        </Alert>
      </Container>
    </Box>
  );
};

export default TestAlert;
