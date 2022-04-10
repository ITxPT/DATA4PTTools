import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Box, Button, ButtonGroup, Menu, MenuItem, Skeleton, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import React from 'react';
import TaskRow from './TaskRow';
import { Session } from '../api/client';
import useApiClient from '../hooks/useApiClient';
import { useSubscription } from '../hooks/useMqttClient';
import theme from '../styles/theme';

function truncName(name: string) {
  const trunc = [];
  const nameSlice = name.split("/");

  if (nameSlice.length > 1) {
    trunc.push(nameSlice[0].split(".").pop(), "..");
  }

  trunc.push(nameSlice.pop());

  return trunc.join("/");
}

type ValidationResultProps = {
  session: Session;
};

const ValidationResult = (props: ValidationResultProps) => {
  const { session } = props;
  const message = useSubscription(session ? `progress/${session.id}` : '');
  const [tasks, setTasks] = React.useState<any[]>([]);
  const apiClient = useApiClient();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };


  React.useEffect(() => {
    if (!session) {
      return;
    }

    if (session.status !== 'running') {
      const tasks = session.results.map(v => {
        return {
          name: truncName(v.name),
          originalName: v.name,
          valid: v.valid,
          status: 'complete',
          validations: v.validations.map((v: any) => ({
            name: v.name,
            valid: v.valid,
            errors: v.errors || [],
          })),
        }
      })
      .sort((a, b) => a.name > b.name ? 1 : -1);

      setTasks(tasks);
    } else if (message) {
      const tasks = message.map((p: any) => {
        return {
          name: truncName(p.name),
          originalName: p.name,
          valid: p.status === 'valid',
          status: p.status === 'running' ? 'running' : 'complete',
          validations: Object.keys(p.jobStatus).map((k) => ({
            name: k,
            valid: p.jobStatus[k] === 'valid',
            status: p.jobStatus[k],
            errors: [],
          })),
        };
      })
      .sort((a: any, b: any) => a.name > b.name ? 1 : -1)

      setTasks(tasks);
    }
  }, [message, session]);

  return (
    <Stack spacing={4}>
      <Stack spacing={1} direction="row">
        <Typography variant="h3">Validation result</Typography>
        { session && <Typography variant="body2" sx={{ [theme.breakpoints.down('md')]: { display: 'none' }}}>[{session.id}]</Typography> }
      </Stack>
      <Box>
        { tasks && tasks.length ? (
          tasks.map(task => <TaskRow key={task.name} session={session} task={task} />)
        ) : (
          <>
            <Box>
              <Skeleton height={50} />
              <Skeleton animation="wave" />
              <Skeleton animation={false} />
            </Box>
            <Box>
              <Skeleton height={50} />
              <Skeleton animation="wave" />
              <Skeleton animation={false} />
            </Box>
          </>
        )}
      </Box>
      <Box>
        <ButtonGroup disabled={session.status !== 'complete'}>
          <Link href={apiClient.reportLink(session.id, 'csv')}>
            <a target="_blank" style={{textDecoration: 'none'}}>
              <Button variant="contained">Download report</Button>
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
            <Link href={apiClient.reportLink(session.id, 'json')}>
              <a target="_blank" style={{textDecoration: 'none'}}>
                <MenuItem onClick={handleClose}>
                  json
                </MenuItem>
              </a>
            </Link>
            <Link href={apiClient.reportLink(session.id, 'csv')}>
              <a target="_blank" style={{textDecoration: 'none'}}>
                <MenuItem onClick={handleClose}>
                  csv
                </MenuItem>
              </a>
            </Link>
          </Menu>
        </ButtonGroup>
      </Box>
    </Stack>
  );
};

export default ValidationResult;
