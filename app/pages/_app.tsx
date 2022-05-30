import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { AssignmentRounded, HomeRounded } from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { AppProps } from 'next/app';
import Link from 'next/link';
import BugReport from '../components/BugReport';
import Footer from '../components/Footer';
import NavBar from '../components/NavBar';
import NavDial from '../components/NavDial';
import InfoMessage from '../components/InfoMessage';
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
      <InfoMessage sx={{
        paddingLeft: '120px',
        paddingTop: '20px',
        paddingRight: '40px',
        [theme.breakpoints.down('md')]: {
          paddingLeft: '0',
        },
      }}>
        <span>Note that this is an early build and more capabilities will be available soon. Visit us regularly!
        You may provide your feedback in <Link href="https://forms.gle/eRfRYeFs2D7JhmPRA"><a target="_blank">this form</a></Link> or one of the channels listed to the right.</span>
        <ArrowForwardIcon />
      </InfoMessage>
      <BugReport />
      <NavBar items={menuItems} />
      <NavDial items={menuItems} />
      <Component {...pageProps} />
      <Footer />
    </ThemeProvider>
  );
};

export default App;
