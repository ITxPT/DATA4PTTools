import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import DoNotDisturbRoundedIcon from '@mui/icons-material/DoNotDisturbRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import LoopRoundedIcon from '@mui/icons-material/LoopRounded';
import {
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material';
import Link from 'next/link';
import React from 'react';

const durStr = (created: Date, stop: Date): string => {
  const v = ~~(((stop || new Date()).getTime() - created.getTime()) / 1000);
  const hours   = ~~(v / 3600);
  const minutes = ~~((v - (hours * 3600)) / 60);
  const seconds = v - (hours * 3600) - (minutes * 60);
  const parts = [];

  if (hours > 0) {
    parts.push(`${hours} h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} min`);
  }
  if (seconds > 0) {
    parts.push(`${seconds} sec`);
  }

  return parts.join(', ');
};

type StatusChipProps = {
  status: string;
}

const StatusChip = ({ status }: StatusChipProps) => {
  let icon = <CircularProgress size={14} sx={{ marginLeft: '4px !important', marginRight: '-3px !important' }} />;
  let color = 'secondary';

  switch (status) {
    case 'failure':
      icon = <ErrorOutlineRoundedIcon />;
      color = 'error';
      break;
    case 'cancelled':
      icon = <DoNotDisturbRoundedIcon />;
      color = 'default';
      break;
    case 'complete':
      icon = <CheckCircleOutlineRoundedIcon />;
      color = 'success';
      break;
  }

  return (
    <Chip
      label={status}
      color={color}
      icon={icon}
      variant="outlined"
      size="small"
    />
  );
}

export type Job = {
  status: string;
  id: string;
  created: number;
  results?: any[];
}

type ValidStatusChipProps = {
  valid: boolean;
  status: string;
}

const ValidStatusChip = ({ status, valid }: ValidStatusChipProps) => {
  let icon = <CircularProgress size={14} sx={{ marginLeft: '4px !important', marginRight: '-3px !important' }} />;
  let color = 'secondary';
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
    />
  );
}

type JobRowProps = {
  job: Job
}

const JobRow = ({ job }: JobRowProps) => {
  const created = new Date(job.created * 1000);
  const stopped = job.stopped ? new Date(job.stopped * 1000) : null;
  const duration =  durStr(created, stopped);

  return (
    <TableRow
      key={job.ref}
      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
    >
      <TableCell component="th" scope="row">
        <StatusChip status={job.status} />
      </TableCell>
      <TableCell>
        <ValidStatusChip status={job.status} valid={job.results && !job.results.find(v => !v.valid)} />
      </TableCell>
      <TableCell>
        <Link href={`/jobs/${job.id}`}>
          {job.id}
        </Link>
      </TableCell>
      <TableCell align="right">{created.toLocaleString()}</TableCell>
      <TableCell align="right">{duration}</TableCell>
    </TableRow>
  );
};

export type JobTableProps = {
  jobs: Job[];
}

const JobTable = (props: JobTableProps) => {
  const { jobs } = props;
  const [page, setPage] = React.useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = React.useState<number>(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Status</TableCell>
            <TableCell>Valid</TableCell>
            <TableCell>Ref</TableCell>
            <TableCell align="right">Created</TableCell>
            <TableCell align="right">Duration</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {
            jobs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map(job => <JobRow key={job.ref} job={job} />)
          }
        </TableBody>
      </Table>
      <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={jobs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
    </TableContainer>
  );
};

export default JobTable
