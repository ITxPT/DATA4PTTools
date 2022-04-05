import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Box,
  Button,
  Card,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from '@mui/material';
import { styled } from '@mui/system';
import React from 'react';
import { Session } from '../api/client';
import useApiClient from '../hooks/useApiClient';

export const FileInput = styled('input')({
  display: 'none',
});

type ValidationConfigProps = {
  session: Session;
  onValidate: () => void;
};

const ValidationConfig = (props: ValidationConfigProps) => {
  const { session, onValidate } = props;
  const [profile, setProfile] = React.useState<string>('netex');
  const [fileList, setFileList] = React.useState({});
  const apiClient = useApiClient();

  const handleSelectChange = (event: SelectChangeEvent) => {
    if (!event.target || !event.target.name) {
      return;
    }

    setProfile(event.target.value);
  };

  const updateFileContext = (fileContext) => {
    fileList[fileContext.name] = fileContext;

    setFileList({ ...fileList });
  }

  const onChange = async (event) => {
    if (!event.target || !event.target.files) {
      return; // TODO handle
    }

    for (const file of event.target.files) {
      const fileContext = {
        name: file.name,
        status: 'uploading',
        progress: 0,
      };

      await apiClient.addFile(session.id, file, (p) => {
        fileContext.progress = ~~(100 * (p.loaded / p.total));
        updateFileContext(fileContext);
      })
        .then(res => {
          fileContext.progress = 100;
          fileContext.status = 'uploaded';
        })
        .catch(err => {
          fileContext.status = 'error';
        })
        .finally(() => {
          updateFileContext(fileContext);
        });
    }
  }

  return (
    <Stack spacing={4}>
      <Stack spacing={1} direction="row">
        <Typography variant="h3">Configuration</Typography>
        { session && <Typography variant="h5">[{session.id}]</Typography> }
      </Stack>
      <Stack spacing={2}>
        <FormControl>
          <InputLabel id="netex-profile-label">Profile</InputLabel>
          <Select
            labelId="netex-profile-label"
            name="netex-profile"
            value={profile}
            onChange={handleSelectChange}
          >
            <MenuItem key="netex" value="netex">NeTEx</MenuItem>
            <MenuItem key="netex-light" value="netex-light">NeTEx Light</MenuItem>
            <MenuItem key="epip" value="epip">EPIP</MenuItem>
          </Select>
        </FormControl>
        <Stack alignItems="center" spacing={2}>
          <label htmlFor="file-upload" style={{ display: 'flex', alignItems: 'center' }}>
            <FileInput multiple id="file-upload" type="file" onChange={onChange} />
            <Button variant="contained" component="span" sx={{ minWidth: '300px' }}>
              Upload files
            </Button>
          </label>

          <Button variant="contained" onClick={onValidate}>Validate</Button>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default ValidationConfig;
