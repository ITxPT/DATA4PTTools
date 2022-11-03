import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import DoNotDisturbRoundedIcon from '@mui/icons-material/DoNotDisturbRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  ButtonGroup,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import React from 'react';
import { Session } from '../api/client';
import useApiClient from '../hooks/useApiClient';
import theme from '../styles/theme';

type ValidationError = {
  message: string;
  line: number;
}

type Validation = {
  name: string;
  valid: boolean;
  status: string;
  errors: ValidationError[];
}

type Task = {
  name: string;
  originalName: string;
  valid: boolean;
  status: string;
  validations: Validation[];
}

type StatusChipProps = {
  valid: boolean;
  status: string;
}

const StatusChip = ({ status, valid }: StatusChipProps) => {
  let icon = <CircularProgress size={14} sx={{ marginLeft: '4px !important', marginRight: '-3px !important' }} />;
  let color: any = 'secondary';
  let label = 'running';

  if (status !== 'running') {
    if (valid) {
      icon = <CheckCircleOutlineRoundedIcon />;
      color = 'success';
      label = 'valid';
    } else {
      icon = <ErrorOutlineRoundedIcon />;
      color = 'error';
      label = 'invalid';
    }
  }

  return (
    <Chip
      label={label}
      color={color}
      icon={icon}
      variant="outlined"
      size="small"
      sx={{
        [theme.breakpoints.down('md')]: {
          '& span': { display: 'none' },
          paddingRight: '6px',
        },
      }}
    />
  );
}

function scuffedErrorName(v: string) {
  if (v.match('unique identity-constraint')) {
    return 'Unique identity-constraint';
  } else if (v.match('key identity-constraint')) {
    return 'Key identity-constraint';
  }

  return 'Error';
}

const ErrorList = ({ errors }: any) => {
  const [index, setIndex] = React.useState(0);
  const maxIndex = errors.length - 1;

  return (
    <Stack sx={{ paddingBottom: '20px' }}>
      <Box sx={{ padding: '20px', position: 'relative' }}>
        <Stack direction="row" spacing={1}>
          <Typography variant="h5">Errors</Typography>
          <Chip
            label={`${index + 1} / ${errors.length}`}
            variant="outlined"
            size="small"
          />
        </Stack>
        <Box sx={{ position: 'absolute', top: '12px', right: '20px' }}>
          <IconButton disabled={index === 0} onClick={() => setIndex(index-1)}>
            <KeyboardArrowLeftIcon />
          </IconButton>
          <IconButton disabled={index === maxIndex} onClick={() => setIndex(index+1)}>
            <KeyboardArrowRightIcon />
          </IconButton>
        </Box>
      </Box>
      <Box>
        <Alert severity="error">
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2">{scuffedErrorName(errors[index].message.replace(/http:\/\www\.netex\.org\.uk\/netex/g, ''))}</Typography>
              <Chip
                label={errors[index].type}
                variant="outlined"
                size="small"
                color="error"
              />
              <Chip
                label={`line: ${errors[index].line || 'unknown'}`}
                variant="outlined"
                size="small"
              />
            </Stack>
            <Typography variant="body1">{errors[index].message.replace(/\{http:\/\/www\.netex\.org\.uk\/netex\}/g, '')}</Typography>
          </Stack>
        </Alert>
      </Box>
    </Stack>
  );
};

const TaskTableRow = ({ session, name: taskName, validation }: any) => {
  const { name, status, valid, errors } = validation;
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <TableRow key={name}>
        <TableCell sx={{ width: '50px' }}>
          { errors.length > 0 && <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton> }
        </TableCell>
        <TableCell sx={{ width: '75px' }}>
          <StatusChip status={status} valid={valid} />
        </TableCell>
        <TableCell>{name}</TableCell>
        <TableCell align="right">
          <Chip
            label={errors.length}
            variant="outlined"
            color="error"
            size="small"
          />
        </TableCell>
        <TableCell align="right" sx={{ width: '20px' }}>
          <Chip
            label={0}
            variant="outlined"
            size="small"
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          { errors.length > 0 && (
            <Collapse in={open} timeout="auto" unmountOnExit>
              <ErrorList errors={errors} />
            </Collapse>
          )}
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

type TaskRowProps = {
  session: Session;
  task: Task;
}

const TaskRow = ({ session, task }: TaskRowProps) => {
  const { name, status, valid, validations } = task;
  const apiClient = useApiClient();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Accordion sx={{ background: 'transparent' }}>
      <AccordionSummary
        sx={{ background: 'white' }}
        expandIcon={<ExpandMoreIcon />}
      >
        <Stack direction="row" spacing={2}>
          <Box sx={{
            minWidth: '75px',
            [theme.breakpoints.down('md')]: {
              minWidth: '0',
            },
          }}>
            <StatusChip status={status} valid={valid} />
          </Box>
          <Box sx={{
            [theme.breakpoints.down('md')]: {
              maxWidth: '60vw',
            },
          }}>
            <Typography variant="h5" sx={{
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}>{ name }</Typography>
          </Box>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650, border: '1px solid #e0e0e0' }} size="small">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Status</TableCell>
                  <TableCell>Validation</TableCell>
                  <TableCell align="right">Errors</TableCell>
                  <TableCell align="right">Warnings</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { validations.map(v => <TaskTableRow key={v.name} session={session} name={task.name} validation={v} />) }
              </TableBody>
            </Table>
          </TableContainer>
          <ButtonGroup disabled={session.status !== 'complete'}>
             <Link href={apiClient.reportFileLink(session.id, task.originalName, 'csv')}>
               <a target="_blank" style={{textDecoration: 'none'}}>
                <Button disabled={session.status !== 'complete'} variant="contained">Download report</Button>
              </a>
            </Link>
            <Button
              variant="contained"
              size="small"
              onClick={handleClick}
            >
              <ArrowDropDownIcon />
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
            >
              <Link href={apiClient.reportFileLink(session.id, task.originalName, 'json')}>
                <a target="_blank" style={{textDecoration: 'none'}}>
                  <MenuItem onClick={handleClose}>
                    json
                  </MenuItem>
                </a>
              </Link>
              <Link href={apiClient.reportFileLink(session.id, task.originalName, 'csv')}>
                <a target="_blank" style={{textDecoration: 'none'}}>
                  <MenuItem onClick={handleClose}>
                    csv
                  </MenuItem>
                </a>
              </Link>
            </Menu>
          </ButtonGroup>
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
};

export default TaskRow;
