import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Select,
  SelectChangeEvent,
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
import React from 'react';

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

export const FileInput = styled('input')({
  display: 'none',
});

export type FileList = {
  [key: string]: any;
}

export type FileUploadProps = {
  initialValues: FileList;
  onUpload: (file: any, cb: (p: any) => void) => Promise<any>;
  onChange: (fileList: FileList, valid: boolean) => void;
  onError: (file: any) => JSX.Element | string;
}

const FileUpload = (props: FileUploadProps) => {
  const { initialValues, onUpload, onChange, onError } = props;
  const [fileList, setFileList] = React.useState<FileList>(initialValues);

  const updateFileContext = (fileContext: any) => {
    fileList[fileContext.name] = fileContext;

    const valid = Object.keys(fileList).find(k => fileList[k].status === 'uploaded');
    const newFileList = { ...fileList };

    setFileList(newFileList);
    onChange(newFileList, !!valid);
  }

  const handleOnChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target || !event.target.files) {
      return; // TODO handle
    }

    for (const file of (event.target.files as any)) {
      const fileContext = {
        name: file.name,
        status: 'uploading',
        progress: 0,
      };

      await onUpload(file, (p) => {
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
    <>
      <label htmlFor="file-upload" style={{ display: 'flex', alignItems: 'center' }}>
        <FileInput multiple id="file-upload" type="file" onChange={handleOnChange} />
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
                              {onError(file)}
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
    </>
  );
};

export default FileUpload;
