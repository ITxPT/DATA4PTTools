import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import DoNotDisturbRoundedIcon from '@mui/icons-material/DoNotDisturbRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Chip,
  Box,
  Button,
  Card,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { styled } from '@mui/system';
import Link from 'next/link';
import React from 'react';
import { Session } from '../api/client';
import useApiClient from '../hooks/useApiClient';
import theme from '../styles/theme';

export const FileInput = styled('input')({
  display: 'none',
});

type StatusChipProps = {
  status: string;
}

const StatusChip = ({ status }: StatusChipProps) => {
  let icon = <CircularProgress size={14} sx={{ marginLeft: '4px !important', marginRight: '-3px !important' }} />;
  let color: any = 'secondary';

  switch (status) {
    case 'error':
      icon = <ErrorOutlineRoundedIcon />;
      color = 'error';
      break;
    case 'uploaded':
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



type ValidationConfigProps = {
  session: Session;
  onValidate: (schema: string) => void;
};

const ValidationConfig = (props: ValidationConfigProps) => {
  const { session, onValidate } = props;
  const [profile, setProfile] = React.useState<string>('netex');
  const [fileList, setFileList] = React.useState<{ [key: string]: any }>({});
  const [canValidate, setCanValidate] = React.useState<boolean>(false);
  const apiClient = useApiClient();

  const handleSelectChange = (event: SelectChangeEvent) => {
    if (!event.target || !event.target.name) {
      return;
    }

    setProfile(event.target.value);
  };

  const updateFileContext = (fileContext: any) => {
    fileList[fileContext.name] = fileContext;

    const valid = Object.keys(fileList).find(k => fileList[k].status === 'uploaded');

    setFileList({ ...fileList });
    setCanValidate(!!valid);
  }

  const onChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target || !event.target.files) {
      return; // TODO handle
    }

    for (const file of (event.target.files as any)) {
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
        { session && <Typography variant="body2" sx={{ [theme.breakpoints.down('md')]: { display: 'none' }}}>[{session.id}]</Typography> }
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h4">Schema</Typography>
        <Typography><b>1.</b> Begin by selecting which schema to validate against</Typography>
        <Typography>
          <ul style={{ marginTop: 0 }}>
            <li>NeTEx - The full NeTEx schema (<Link href="https://netex-cen.eu/"><a target="_blank">more info</a></Link>)</li>
            <li>NeTEx Light - NeTEx schema without constraint (<Link href="https://netex-cen.eu/"><a target="_blank">more info</a></Link>)</li>
            <li>EPIP - NeTEx European Passenger Information Profile (<Link href="https://data4pt-project.eu/providing-netex-as-open-data-on-a-national-access-point-nap/"><a target="_blank">more info</a></Link>)</li>
          </ul>
        </Typography>
        <FormControl>
          <InputLabel id="netex-profile-label">Schema</InputLabel>
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

        <Typography variant="h4" sx={{ paddingTop: '10px' }}>Files</Typography>
        <Typography gutterBottom><b>2.</b> Then select which files to validate by clicking &apos;Upload files&apos;</Typography>

        <Stack alignItems="center" spacing={2}>
          <label htmlFor="file-upload" style={{ display: 'flex', alignItems: 'center' }}>
            <FileInput multiple id="file-upload" type="file" onChange={onChange} />
            <Button variant="contained" component="span" sx={{ minWidth: '300px' }}>
              Upload files
            </Button>
          </label>

          { Object.keys(fileList).length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Filename</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  { Object.keys(fileList).map(key => {
                      const file = fileList[key];

                      return (
                        <TableRow key={key}>
                          <TableCell>
                            <Typography>{key}</Typography>
                              { file.status === 'error' && (
                                <Typography color="error" sx={{ marginTop: '4px' }}>
                                  File will not be included in the validation
                                </Typography>
                              )}

                          </TableCell>
                          <TableCell align="right">
                            <StatusChip status={file.status} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  }
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box
              sx={{
                border: '1px dashed #ccc',
                borderRadius: '4px',
                padding: '20px',
                background: '#f3f3f3',
              }}
            >
              <Typography>Supported archive/compression formats are zip, gzip, bzip and tar</Typography>
            </Box>
          )}

          <Button variant="contained" disabled={!canValidate} onClick={() => onValidate(profile)}>Validate</Button>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default ValidationConfig;
