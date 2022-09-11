import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import DoNotDisturbRoundedIcon from '@mui/icons-material/DoNotDisturbRounded';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Box,
  Button,
  Card,
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
import FileUpload, { FileList } from './FileUpload';
import { Session } from '../api/client';
import useApiClient from '../hooks/useApiClient';
import theme from '../styles/theme';

const ruleOptions = [
  {
    value: 'everyLineIsReferenced',
    label: 'Every line is referenced',
  },
  {
    value: 'everyScheduledStopPointHasAName',
    label: 'Every scheduled stop has a name',
  },
  {
    value: 'everyStopPlaceHasACorrectStopPlaceType',
    label: 'Every stop place has a stop place type',
  },
  {
    value: 'everyStopPlaceHasAName',
    label: 'Every stop place has a name',
  },
  {
    value: 'everyStopPlaceIsReferenced',
    label: 'Every stop place is referenced',
  },
  {
    value: 'everyStopPointHaveArrivalAndDepartureTime',
    label: 'Every stop point have an arrival and departure time',
  },
  {
    value: 'frameDefaultsHaveALocaleAndTimeZone',
    label: 'Frame defauls have a locale and timezone',
  },
  {
    value: 'locationsAreReferencingTheSamePoint',
    label: 'Locations are referencing the same point',
  },
  {
    value: 'passingTimesHaveIncreasingTimes',
    label: 'Passing times have increasing times',
  },
  {
    value: 'stopPlaceQuayDistanceIsReasonable',
    label: 'Stop place quay distance is reasonable',
  },
];

export const FileInput = styled('input')({
  display: 'none',
});

const Caption = ({ children }: { children: JSX.Element | string }) => {
  return (
    <Typography variant="caption" component="span">{children}</Typography>
  );
};

type ValidationConfigProps = {
  session: Session;
  onValidate: (schema: string, rules: string[]) => void;
};

const ValidationConfig = (props: ValidationConfigProps) => {
  const { session, onValidate } = props;
  const [schema, setSchema] = React.useState<string>('netex@1.2');
  const [rules, setRules] = React.useState<string[]>([
    'everyLineIsReferenced',
    'everyScheduledStopPointHasAName',
    'everyStopPlaceHasACorrectStopPlaceType',
    'everyStopPlaceHasAName',
    'everyStopPlaceIsReferenced',
    'everyStopPointHaveArrivalAndDepartureTime',
    'frameDefaultsHaveALocaleAndTimeZone',
    'locationsAreReferencingTheSamePoint',
    'passingTimesHaveIncreasingTimes',
    'stopPlaceQuayDistanceIsReasonable',
  ]);
  const [fileList, setFileList] = React.useState<{ [key: string]: any }>(() => {
    return session && session.files ? session.files.reduce((o: FileList, v: any) => {
      o[v.name] = {
        ...v,
        status: 'uploaded',
        progress: 100,
      };

      return o;
    }, {}) : {};
  });
  const [canValidate, setCanValidate] = React.useState<boolean>(false);
  const apiClient = useApiClient();

  const handleSelectChange = (event: SelectChangeEvent) => {
    if (!event.target || !event.target.name) {
      return;
    }

    setSchema(event.target.value);
  };

  const handleSelectMultChange = (event: SelectChangeEvent) => {
    if (!event.target || !event.target.name || !Array.isArray(event.target.value)) {
      return;
    }

    setRules(event.target.value);
  };

  const updateFileContext = (fileContext: any) => {
    fileList[fileContext.name] = fileContext;

    const valid = Object.keys(fileList).find(k => fileList[k].status === 'uploaded');

    setFileList({ ...fileList });
    setCanValidate(!!valid);
  }

  const handleOnUpload = (file: any, cb: any) => {
    return apiClient.addFile(session.id, file, cb);
  }

  const handleOnChange = (fileList: FileList, valid: boolean) => {
    setFileList({ ...fileList });
    setCanValidate(valid);
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

  React.useState(() => {
    if (session.files.length) {
      setCanValidate(true);
    }
  }, [session, setCanValidate]);

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
            <li>NeTEx - The full NeTEx schema (<Link href="https://github.com/NeTEx-CEN/NeTEx"><a target="_blank">more info</a></Link>)</li>
            <li>NeTEx Light - NeTEx schema without constraint (<Link href="https://data4pt.org/wiki/NeTEX#NeTEx-Light"><a target="_blank">more info</a></Link>)</li>
            <li>EPIP - NeTEx European Passenger Information Profile (<Link href="https://data4pt.org/NeTEx/GraphicKit/Documention_of_XSD_for_EPIP.html"><a target="_blank">more info</a></Link>)</li>
          </ul>
        </Typography>
        <FormControl>
          <InputLabel id="netex-schema-label">Schema</InputLabel>
          <Select
            labelId="netex-schema-label"
            name="netex-schema"
            value={schema}
            onChange={handleSelectChange}
          >
            <MenuItem key="netex" value="netex@1.2">NeTEx (v1.2)</MenuItem>
            <MenuItem key="netex-light" value="netex@1.2-nc">NeTEx Light (v1.2)</MenuItem>
            <MenuItem key="epip" value="epip@1.1.1">EPIP (v1.1.1)</MenuItem>
            <MenuItem key="epip-light" value="epip@1.1.1-nc">EPIP Light (v1.1.1)</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="h4">Rules</Typography>
        <Typography><b>2.</b> In addition to the schema validation, we have also included a couple of optional rules that validate the consistency of the documents (work in progress)</Typography>
        <Typography>
          <ul style={{ marginTop: 0 }}>
            <li><i>Every line is referenced</i> - Make sure every Line <Caption>{'<Line />'}</Caption> is referenced from another element.</li>
            <li><i>Every scheduled stop point has a name</i> - Make sure every <Caption>{'<ScheduledStopPoint />'}</Caption> has a <Caption>{'<Name />'}</Caption> or <Caption>{'<ShortName />'}</Caption>.</li>
            <li><i>Every stop place has a correct stop place type</i> - Make sure every <Caption>{'<StopPlace />'}</Caption> has a <Caption>{'<stopPlaceType />'}</Caption> and that it is of correct type.</li>
            <li><i>Every stop place has a name</i> - Make sure every <Caption>{'<StopPlace />'}</Caption> has a name.</li>
            <li><i>Every stop place is referenced</i> - Make sure every <Caption>{'<StopPlace />'}</Caption> is referenced from another element.</li>
            <li><i>Every stop point have an arrival and departure time</i> - Make sure every <Caption>{'<ScheduledStopPointRef />'}</Caption> have an <Caption>{'<ArrivalTime />'}</Caption> and <Caption>{'<DepartureTime />'}</Caption>.</li>
            <li><i>Frame defaults have a locale and timezone</i> - Validates the correctness of <Caption>{'<DefaultLocale />'}</Caption> and <Caption>{'<TimeZone />'}</Caption> inside <Caption>{'<FrameDefaults />'}</Caption>.</li>
            <li><i>Locations are referencing the same point</i> - Make sure every <Caption>{'<Location />'}</Caption> in <Caption>{'<StopPlace />'}</Caption> and <Caption>{'<ScheduledStopPoint />'}</Caption> for the same <Caption>{'<StopAssignment />'}</Caption> are pointing to the same coordinates.</li>
            <li><i>Passing times have increasing times</i> - Make sure passing times have increasing times and day offsets.</li>
            <li><i>Stop place quay distance is reasonable</i> - Check the distance between a <Caption>{'<StopPlace />'}</Caption> and its <Caption>{'<Quay />'}</Caption>{`'`}s.</li>
          </ul>
        </Typography>
        <FormControl>
          <InputLabel id="rules-label">Rules</InputLabel>
          <Select
            labelId="rules-label"
            name="rules"
            value={rules as any}
            multiple
            onChange={handleSelectMultChange}
          >
            { ruleOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            )) }
          </Select>
        </FormControl>

        <Typography variant="h4" sx={{ paddingTop: '10px' }}>Files</Typography>
        <Typography gutterBottom><b>2.</b> Then select which files to validate by clicking &apos;Upload files&apos;</Typography>

        <Stack alignItems="center" spacing={2}>
          <FileUpload
            initialValues={fileList}
            onUpload={handleOnUpload}
            onChange={handleOnChange}
            onError={(file) => {
              return 'File will not be included in the validation';
            }}
          />
          <Button
            variant="contained"
            disabled={!canValidate}
            onClick={() => onValidate(schema, rules)}
          >
            Validate
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default ValidationConfig;
