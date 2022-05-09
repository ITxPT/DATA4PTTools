import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Box, Button, ButtonGroup, Grid, Menu, MenuItem, Skeleton, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import ErrorAlert from './ErrorAlert';
import InfoMessage from './InfoMessage';
import TaskRow from './TaskRow';
import { Session } from '../api/client';
import useApiClient from '../hooks/useApiClient';
import { useSubscription } from '../hooks/useMqttClient';
import useSessionStore from '../hooks/useSessionStore';
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
  const router = useRouter();
  const message = useSubscription(session ? `progress/${session.id}` : '');
  const [tasks, setTasks] = React.useState<any[]>([]);
  const { setSession } = useSessionStore();
  const [ errorOpen, setErrorOpen ] = React.useState<boolean>(false);
  const [ errorMessage, setErrorMessage ] = React.useState<string>('test');
  const apiClient = useApiClient();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleValidateAnother = () => {
    apiClient.createSession()
      .then(session => {
        setSession(session);
        router.push('/jobs/' + session.id);
      })
      .catch(err => {
        setSession(undefined);
        setErrorOpen(true);
        setErrorMessage(err.message);
      });
  };

  const handleCloseError = () => setErrorOpen(false);

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
      <ErrorAlert open={errorOpen} message={errorMessage} onClose={handleCloseError} />
      <Stack spacing={1} direction="row">
        <Typography variant="h3">Validation result</Typography>
        { session && <Typography variant="body2" sx={{ [theme.breakpoints.down('md')]: { display: 'none' }}}>[{session.id}]</Typography> }
      </Stack>
      <InfoMessage>
        <span>Are you interested in diving deeper? Consider testing it locally with <Link href="https://hub.docker.com/r/lekojson/greenlight"><a target="_blank">Docker</a></Link></span>
      </InfoMessage>
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
      <Grid container>
        <Grid item xs={12} md={6}>
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
        </Grid>
        <Grid item xs={12} md={6} sx={{ textAlign: 'end' }}>
          <Button
            variant="contained"
            onClick={handleValidateAnother}
          >
            Validate more files
          </Button>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default ValidationResult;
