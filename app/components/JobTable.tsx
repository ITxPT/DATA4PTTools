import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import DoNotDisturbRoundedIcon from '@mui/icons-material/DoNotDisturbRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
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
  TableRow
} from '@mui/material'
import Link from 'next/link'
import React from 'react'

const durStr = (created: Date, stop: Date | null): string => {
  const v = ~~(((stop ?? new Date()).getTime() - created.getTime()) / 1000)
  const hours = ~~(v / 3600)
  const minutes = ~~((v - (hours * 3600)) / 60)
  const seconds = v - (hours * 3600) - (minutes * 60)
  const parts = []

  if (hours > 0) {
    parts.push(`${hours} h`)
  }
  if (minutes > 0) {
    parts.push(`${minutes} min`)
  }
  if (seconds > 0) {
    parts.push(`${seconds} sec`)
  }

  return parts.join(', ')
}

interface StatusChipProps {
  status: string
}

const StatusChip = ({ status }: StatusChipProps): JSX.Element => {
  let icon = (
    <CircularProgress
      size={14}
      sx={{ marginLeft: '4px !important', marginRight: '-3px !important' }}
    />
  )
  let color: any = 'secondary'

  switch (status) {
    case 'failure':
      icon = <ErrorOutlineRoundedIcon />
      color = 'error'
      break
    case 'cancelled':
      icon = <DoNotDisturbRoundedIcon />
      color = 'default'
      break
    case 'complete':
      icon = <CheckCircleOutlineRoundedIcon />
      color = 'success'
      break
  }

  return (
    <Chip
      label={status}
      color={color}
      icon={icon}
      variant="outlined"
      size="small"
    />
  )
}

export interface Job {
  status: string
  stopped: number
  ref: string
  id: string
  created: number
  results?: any[]
}

interface ValidStatusChipProps {
  valid?: boolean
  status: string
}

const ValidStatusChip = ({ status, valid }: ValidStatusChipProps): JSX.Element => {
  let icon = <CircularProgress size={14} sx={{ marginLeft: '4px !important', marginRight: '-3px !important' }} />
  let color: any = 'secondary'
  let label = 'running'

  if (status !== 'running') {
    if (valid ?? false) {
      icon = <CheckCircleOutlineRoundedIcon />
      color = 'success'
      label = 'valid'
    } else {
      icon = <ErrorOutlineRoundedIcon />
      color = 'error'
      label = 'invalid'
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
  )
}

interface JobRowProps {
  job: Job
}

const JobRow = ({ job }: JobRowProps): JSX.Element => {
  const created = new Date(job.created * 1000)
  const stopped = job.stopped > 0 ? new Date(job.stopped * 1000) : null
  const duration = durStr(created, stopped)
  const isValid = (job.results?.find(v => !(v.valid as boolean)) ?? []).length === 0

  return (
    <TableRow
      key={job.ref}
      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
    >
      <TableCell component="th" scope="row">
        <StatusChip status={job.status} />
      </TableCell>
      <TableCell>
        <ValidStatusChip
          status={job.status}
          valid={isValid}
        />
      </TableCell>
      <TableCell>
        <Link href={`/jobs/${job.id}/result`} legacyBehavior>
          {job.id}
        </Link>
      </TableCell>
      <TableCell align="right">{created.toLocaleString()}</TableCell>
      <TableCell align="right">{duration}</TableCell>
    </TableRow>
  )
}

export interface JobTableProps {
  jobs: Job[]
}

const JobTable = (props: JobTableProps): JSX.Element => {
  const { jobs } = props
  const [page, setPage] = React.useState<number>(0)
  const [rowsPerPage, setRowsPerPage] = React.useState<number>(10)

  const handleChangePage = (event: unknown, newPage: number): void => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

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
  )
}

export default JobTable
