import { grey } from '@mui/material/colors';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#000',
    },
    background: {
      default: '#e6e6e6',
    },
  },
  typography: {
  },
});

// typography
theme.typography.h1 = {
  fontFamily: 'Roboto Slab',
  fontSize: '3.5rem',
  lineHeight: '4rem',
  [theme.breakpoints.down('lg')]: {
    fontSize: '2.5rem',
    lineHeight: '3rem',
  },
};
theme.typography.h2 = {
  fontFamily: 'Roboto Slab',
  fontSize: '2.25rem',
  lineHeight: '2.5rem',
};
theme.typography.h3 = {
  fontFamily: 'Roboto Slab',
  fontSize: '2rem',
  lineHeight: '2.5rem',
  fontWeight: '300',
};
theme.typography.h4 = {
  fontFamily: 'Roboto Slab',
  fontSize: '1.5rem',
  lineHeight: '2rem',
  fontWeight: '300',
};
theme.typography.h5 = {
  fontFamily: 'Roboto Slab',
  fontSize: '1rem',
  lineHeight: '1.5rem',
  fontWeight: 'normal',
};
theme.typography.h6 = {
  fontFamily: 'Roboto Slab',
  fontSize: '0.875rem',
  lineHeight: '1rem',
  fontWeight: 'bold',
};
theme.typography.body1 = {
  fontFamily: 'Roboto Slab',
  fontSize: '0.875rem',
  lineHeight: '1rem',
  fontWeight: '300',
  wordWrap: 'break-word',
};
theme.typography.body2 = {
  fontFamily: 'Roboto Slab',
  fontSize: '0.875rem',
  lineHeight: '1rem',
  wordWrap: 'break-word',
};

theme.components = {};

theme.components.MuiCardContent = {
  styleOverrides: {
    root: {
      '&:last-child': {
        padding: theme.spacing(2),
      },
    },
  },
};

theme.components.MuiChip = {
  styleOverrides: {
    sizeSmall: {
      fontSize: '0.750rem',
      lineHeight: '0.875rem',
      fontWeight: '500',
    },
  },
};

theme.components.MuiSpeedDial = {
  styleOverrides: {
    fab: {
      background: 'black',
      '&:hover': {
        background: grey[800],
      },
    },
  },
}

theme.components.MuiSpeedDialAction = {
  styleOverrides: {
    fab: {
      '&.active': {
        background: 'black',
        color: 'white',
      },
    },
  },
};

theme.components.MuiButton = {
  styleOverrides: {
    root: {
      borderRadius: '0',
      textTransform: 'none',
      fontWeight: '400',
      fontFamily: 'Roboto Slab',
      '&.Mui-disabled': {
        color: 'white',
      },
    },
    sizeLarge: {
      fontSize: '1.5rem',
      lineHeight: '2rem',
      padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
      '&.Mui-outlined': {
        padding: 0,
      },
    },
    sizeMedium: {
      fontSize: '1rem',
      lineHeight: '1.5rem',
      padding: `${theme.spacing(1)} ${theme.spacing(3)}`,
    },
    sizeSmall: {
      fontSize: '1rem',
      lineHeight: '1rem',
      padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
    },
    contained: {
      color: theme.palette.primary.contrastText,
      backgroundColor: theme.palette.primary.main,
      '&:hover': {
        backgroundColor: theme.palette.primary.light,
      },
    },
    outlined: {
      border: `1px solid ${theme.palette.primary.main}`,
      backgroundColor: 'transparent',
      color: theme.palette.primary.main,
      '&:hover': {
        backgroundColor: 'transparent',
        borderColor: theme.palette.primary.light,
        color: theme.palette.primary.light,
      },
    },
    outlinedSizeLarge: {
      padding: `${theme.spacing(1.85)} ${theme.spacing(3)}`,
    },
  },
};

theme.components.MuiPaper = {
  styleOverrides: {
    root: {
      borderRadius: 0,
      boxShadow: 'none',
    },
  },
};

theme.components.MuiMenu = {
  styleOverrides: {
    root: {
      '& > .MuiPaper-root': {
        boxShadow: '0 2px 2px rgba(0,0,0,.2)',
      }
    },
  },
}

theme.components.MuiInput = {
  styleOverrides: {
    root: {
      backgroundColor: 'white',
      padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
      '&:before': {
        borderBottomColor: 'white',
      },
    },
    input: {
      padding: '0',
    },
  },
};

theme.components.MuiSelect = {
  styleOverrides: {
    iconOutlined: {
      color: theme.palette.primary.main,
    },
  },
};

theme.components.MuiOutlinedInput = {
  styleOverrides: {
    root: {
      backgroundColor: 'white',
      borderRadius: '0',
    },
    notchedOutline: {
      borderColor: 'transparent',
    },
  },
};

export default theme;
