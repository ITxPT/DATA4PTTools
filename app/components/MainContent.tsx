import { Box, Container } from '@mui/material';
import { styled } from '@mui/system';
import theme from '../styles/theme';

const MainContent = ({ children }) => {
  return (
    <Box sx={{
      paddingLeft: '80px',
      paddingTop: '50px',
      paddingBottom: '100px',
      [theme.breakpoints.down('md')]: {
        paddingLeft: '0',
        paddingTop: '20px',
        paddingBottom: '100px',
      },
    }}>
      <Container>{children}</Container>
    </Box>
  );
};

export default MainContent;
