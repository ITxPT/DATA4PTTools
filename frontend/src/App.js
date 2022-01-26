import AppBar from '@mui/material/AppBar';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import LightIcon from '@mui/icons-material/Light';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LinearProgress from '@mui/material/LinearProgress';
import Paper, { paperClasses } from '@mui/material/Paper';
import { ThemeProvider, alpha, createTheme, styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { Fragment, useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

import * as mqtt from "mqtt/dist/mqtt"

const drawerWidth = 240;

let theme = createTheme({});

theme = createTheme({
  typography: {
    fontSize: 14,
  },
  palette: {
    background: {
      default: "rgb(248, 249, 250)",
    },
  },
  components: {
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: "4px" },
        bar: { borderRadius: "4px" },
      },
    },
    MuiChip: {
      variants: [{
        props: { color: "primary" },
        style: {
          color: theme.palette.primary.main,
          backgroundColor: alpha(theme.palette.primary.light, 0.2),
        },
      }, {
        props: { color: "secondary" },
        style: {
          color: theme.palette.secondary.main,
          backgroundColor: alpha(theme.palette.secondary.light, 0.2),
        },
      }, {
        props: { color: "error" },
        style: {
          color: theme.palette.error.main,
          backgroundColor: alpha(theme.palette.error.light, 0.2),
        },
      }, {
        props: { color: "success" },
        style: {
          color: theme.palette.success.main,
          backgroundColor: alpha(theme.palette.success.light, 0.2),
        },
      }],
      defaultProps: {
        size: "small",
      },
      styleOverrides: {
        root: {
          fontSize: "0.7rem",
          fontWeight: 700,
          borderRadius: "4px",
        }
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "rgb(0 0 0 / 5%) 0rem 1.25rem 1.6875rem 0rem",
          borderRadius: "1rem",
          border: "0.0625rem solid rgb(233, 236, 239)",
        },
      },
    },
    MuiTableCell: {
      variants: [{
        props: { variant: 'head' },
        style: {
          fontSize: "0.7rem",
          fontWeight: "700",
          color: "rgb(131, 146, 171)",
          borderBottom: "0.0625rem solid rgb(233, 236, 239)",
        },
      }],
      styleOverrides: {
        root: { borderBottom: "none" },
      },
    },
  },
});

const FlatPaper = styled(Paper)({
  borderRadius: "0",
  margin: "10px 0",
  boxShadow: "rgb(0 0 0 / 5%) 0rem 0.1rem 0.1rem 0rem"
});

function App() {
  const [rows, setRows] = useState([]);
  const container = window.document.body;

  useEffect(() => {
    const client  = mqtt.connect('mqtt://localhost:1888/ws')

    client.on('connect', function () {
      console.log("connected");

      client.subscribe('progress');
    })

    client.on("message", (topic, message) => {
      const rows = JSON.parse(message.toString())

      setRows(rows.progress.sort((a, b) => a.name > b.name ? 1 : -1));
    });

    return client.end;
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline/>
        <Box
          component="main" 
          sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
        >
          <Container sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom component="div"><LightIcon style={{marginRight: "10px"}} />Greenlight</Typography>
            <BasicTable rows={rows} />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

function Row(props) {
  const { row } = props;
  const [open, setOpen] = useState(false);
  const jobRows = Object.keys(row.jobStatus).map(key => {
    return {
      name: key,
      status: row.jobStatus[key],
      log: row.rows[key],
    };
  });
  const chip = (status) => {
    switch (status) {
      case "running":
        return <Chip color="secondary" label="running" />;
      case "valid":
        return <Chip color="success" label="valid" />;
      case "invalid":
        return <Chip color="error" label="invalid" />;
    }
  }
  const progress = () => {
    if (row.status === "running") {
      const progress = 100 * (row.completed / row.count);

      return <LinearProgress variant="determinate" value={progress} />
    }

    return <Chip color="primary" label="complete" />;
  }

  return (
    <Fragment>
      <TableRow key="expand">
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {row.name}
        </TableCell>
        <TableCell align="right">{chip(row.status)}</TableCell>
        <TableCell align="right">{progress()}</TableCell>
      </TableRow>
      <TableRow key="default">
        <TableCell colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box xs={{ padding: 2 }}>
              <Typography variant="body1">Validations</Typography>
                <Table size="small" aria-label="tasks" component={FlatPaper}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    { jobRows.map(row => (
                      <TableRow key={row.name}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell align="right">{chip(row.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  );
}

function BasicTable(props) {
  const { rows } = props;

  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label="collapsible table">
        <TableHead>
          <TableRow>
            <TableCell style={{ width: "20px" }} />
            <TableCell>Job</TableCell>
            <TableCell align="right">Status</TableCell>
            <TableCell align="center">Progress</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (<Row key={row.name} row={row} />))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default App;
