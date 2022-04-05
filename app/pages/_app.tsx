import { AssignmentRounded, HomeRounded } from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import AppProps from 'next/app';
import Footer from '../components/Footer';
import NavBar from '../components/NavBar';
import NavDial from '../components/NavDial';
import theme from '../styles/theme';
import '../styles/globals.css';

const menuItems = [{
  icon: HomeRounded,
  path: '/',
  name: 'Home',
}, {
  icon: AssignmentRounded,
  path: '/jobs',
  name: 'Jobs',
}];

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <ThemeProvider theme={theme}>
      <NavBar items={menuItems} />
      <NavDial items={menuItems} />
      <Component {...pageProps} />
      <Footer />
    </ThemeProvider>
  );
};

export default App;
