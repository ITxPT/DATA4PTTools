import { Box, Container } from '@mui/material';
import { styled } from '@mui/system';
import React from 'react';
import theme from '../styles/theme';

const MainContent: React.FC = ({ children }) => {
  return (
    <Box sx={{
      paddingLeft: '80px',
      paddingTop: '50px',
      [theme.breakpoints.down('md')]: {
        paddingLeft: '0',
        paddingTop: '20px',
      },
    }}>
      <Container>{children}</Container>
    </Box>
  );
};

export default MainContent;
