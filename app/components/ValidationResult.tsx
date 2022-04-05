import { Box, Stack, Typography } from '@mui/material';
import React from 'react';
import TaskRow from './TaskRow';
import { Session } from '../api/client';
import { useSubscription } from '../hooks/useMqttClient';

function truncName(name) {
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
  const [tasks, setTasks] = React.useState([]);

  React.useEffect(() => {
    if (!session) {
      return;
    }

    if (session.status !== 'running') {
      const tasks = session.results.map(v => {
        return {
          name: truncName(v.name),
          valid: v.valid,
          status: 'complete',
          validations: v.validations.map(v => ({
            name: v.name,
            valid: v.valid,
            errors: v.errors || [],
          })),
        }
      })
      .sort((a, b) => a.name > b.name ? 1 : -1);

      setTasks(tasks);
    } else if (message) {
      const tasks = message.map(p => {
        return {
          name: truncName(p.name),
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
      .sort((a, b) => a.name > b.name ? 1 : -1)

      setTasks(tasks);
    }
  }, [message, session]);

  return (
    <Stack spacing={4}>
      <Stack spacing={1} direction="row">
        <Typography variant="h3">Validation result</Typography>
        { session && <Typography variant="h5">[{session.id}]</Typography> }
      </Stack>
      <Box>
        { tasks.map(task => <TaskRow task={task} />) }
      </Box>
    </Stack>
  );
};

export default ValidationResult;
