import { blue, grey } from '@mui/material/colors'
import { createTheme } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Palette {
    accent: Palette['primary']
  }

  interface PaletteOptions {
    accent: PaletteOptions['primary']
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#000'
    },
    background: {
      default: '#e6e6e6'
    },
    accent: {
      main: '#4FB09A'
    }
  },
  typography: {
    fontFamily: [
      'Inter',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'Fira Sans',
      'Droid Sans',
      'Helvetica Neue',
      'sans-serif'
    ].join(', ')
  }
})

// typography
theme.typography.h1 = {
  fontSize: '2rem',
  lineHeight: '120%',
  fontWeight: '300',
  [theme.breakpoints.down('md')]: {
    fontSize: '1.5rem'
  }
}
theme.typography.h2 = {
  fontSize: '1.625em',
  textTransform: 'uppercase',
  lineHeight: '120%',
  fontWeight: '300',
  [theme.breakpoints.down('md')]: {
    fontSize: '1.218rem'
  }
}
theme.typography.h3 = {
  fontSize: '1.625rem',
  lineHeight: '120%',
  fontWeight: '300',
  [theme.breakpoints.down('md')]: {
    fontSize: '1.218em'
  }
}
theme.typography.h4 = {
  fontSize: '1.375rem',
  lineHeight: '120%',
  fontWeight: '300',
  [theme.breakpoints.down('md')]: {
    fontSize: '1rem'
  }
}
theme.typography.h5 = {
  fontSize: '1rem',
  lineHeight: '120%',
  fontWeight: '500',
  [theme.breakpoints.down('md')]: {
    fontSize: '0.75rem'
  }
}
theme.typography.h6 = {
  fontSize: '0.75rem',
  lineHeight: '120%',
  fontWeight: '600',
  [theme.breakpoints.down('md')]: {
    fontSize: '0.5625rem'
  }
}
theme.typography.subtitle1 = {
  fontSize: '1rem',
  fontWeight: 400,
  lineHeight: '120%',
  textTransform: 'uppercase',
  [theme.breakpoints.down('md')]: {
    fontSize: '0.75rem'
  }
}
theme.typography.body1 = {
  fontSize: '1rem',
  lineHeight: '120%',
  fontWeight: '400',
  wordWrap: 'break-word',
  color: grey[800],
  [theme.breakpoints.down('md')]: {
    fontSize: '0.75rem'
  }
}
theme.typography.body2 = {
  fontSize: '0.875rem',
  lineHeight: '1rem',
  wordWrap: 'break-word',
  [theme.breakpoints.down('md')]: {
    fontSize: '0.65rem'
  }
}

theme.components = {}

theme.components.MuiCardContent = {
  styleOverrides: {
    root: {
      '&:last-child': {
        padding: theme.spacing(2)
      }
    }
  }
}

theme.components.MuiChip = {
  styleOverrides: {
    sizeSmall: {
      fontSize: '0.750rem',
      lineHeight: '0.875rem',
      fontWeight: '500'
    }
  }
}

theme.components.MuiSpeedDial = {
  styleOverrides: {
    fab: {
      background: 'black',
      '&:hover': {
        background: grey[800]
      }
    }
  }
}

theme.components.MuiSpeedDialAction = {
  styleOverrides: {
    fab: {
      '&.active': {
        background: 'black',
        color: 'white'
      }
    }
  }
}

theme.components.MuiButton = {
  styleOverrides: {
    root: {
      borderRadius: '0',
      fontFamily: 'Roboto Slab, Inter, Roboto',
      fontWeight: '400',
      textTransform: 'none',
      '&.Mui-disabled': {
        color: 'white'
      }
    },
    sizeLarge: {
      fontSize: '1.25rem',
      lineHeight: '1.65rem',
      padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
      '&.Mui-outlined': {
        padding: 0
      }
    },
    sizeMedium: {
      fontSize: '1rem',
      lineHeight: '1.5rem',
      padding: `${theme.spacing(1)} ${theme.spacing(3)}`
    },
    sizeSmall: {
      fontSize: '0.75rem',
      lineHeight: '0.75rem',
      padding: `${theme.spacing(1)} ${theme.spacing(2)}`
    },
    outlined: {
      border: `1px solid ${theme.palette.primary.main}`,
      backgroundColor: 'transparent',
      color: theme.palette.primary.main,
      '&:hover': {
        backgroundColor: 'transparent',
        borderColor: theme.palette.primary.light,
        color: theme.palette.primary.light
      }
    },
    outlinedSizeLarge: {
      padding: `${theme.spacing(1.85)} ${theme.spacing(3)}`
    }
  }
}

theme.components.MuiPaper = {
  styleOverrides: {
    root: {
      borderRadius: 0,
      boxShadow: 'none'
    }
  }
}

theme.components.MuiMenu = {
  styleOverrides: {
    root: {
      '& > .MuiPaper-root': {
        boxShadow: '0 2px 2px rgba(0,0,0,.2)'
      }
    }
  }
}

theme.components.MuiInput = {
  styleOverrides: {
    root: {
      backgroundColor: 'white',
      padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
      '&:before': {
        borderBottomColor: 'white'
      }
    },
    input: {
      padding: '0'
    }
  }
}

theme.components.MuiSelect = {
  styleOverrides: {
    iconOutlined: {
      color: theme.palette.primary.main
    }
  }
}

theme.components.MuiOutlinedInput = {
  styleOverrides: {
    root: {
      backgroundColor: 'white',
      borderRadius: '0'
    },
    notchedOutline: {
      border: `1px solid ${grey[300]}`,
      transition: 'all 200ms'
    }
  }
}

theme.components.MuiFormHelperText = {
  styleOverrides: {
    root: {
      marginLeft: 0
    }
  }
}

theme.components.MuiMenu = {
  styleOverrides: {
    list: {
      fontSize: '12px',
      padding: '6px 8px'
    },
    paper: {
      borderRadius: '8px !important',
      boxShadow: '0px 8px 8px rgba(0, 0, 0, 0.15) !important'
    }
  }
}
theme.components.MuiMenuItem = {
  styleOverrides: {
    root: {
      borderRadius: '8px',
      width: '100%',
      margin: '2px 0',
      padding: '16px 10px',
      transition: 'background-color 150ms',
      '&:hover': {
        backgroundColor: blue[50]
      }
    }
  }
}
theme.components.MuiListItemIcon = {
  styleOverrides: {
    root: {
      minWidth: 0
    }
  }
}

export default theme
