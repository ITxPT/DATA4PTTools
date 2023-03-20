import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Stack,
  Typography
} from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import React from 'react'
import type { Profile, Script } from '../api/types'
import scriptData from '../public/scripts.json'

const scriptOptions = scriptData.filter(v => v.name !== 'xsd')
  .map(v => ({
    value: v.name,
    label: v.description
  }))

const Caption = ({
  children
}: {
  children: JSX.Element | string
}): JSX.Element => {
  return (
    <Typography variant="caption" component="span">{children}</Typography>
  )
}

export interface CustomConfigurationProps {
  onNext: (profile: Profile) => void
}

const CustomConfiguration = (props: CustomConfigurationProps): JSX.Element => {
  const [schema, setSchema] = React.useState<string>('netex@1.2')
  const [scripts, setScripts] = React.useState<string[]>(scriptOptions.map(v => v.value))

  const handleSelectSchema = (event: SelectChangeEvent): void => {
    if (event.target?.name === '') {
      return
    }

    setSchema(event.target.value)
  }

  const handleSelectScripts = (event: SelectChangeEvent): void => {
    if (event.target?.name === '' || !Array.isArray(event.target.value)) {
      return
    }

    setScripts(event.target.value)
  }

  const handleNextClick = (): void => {
    const xsdScript = {
      ...scriptData.find(v => v.name === 'xsd'),
      config: { schema }
    }

    props.onNext({
      name: 'custom',
      description: 'Custom configuration',
      scripts: [xsdScript as Script, ...scripts.map(name => scriptData.find(v => v.name === name) as Script)]
    })
  }

  return (
    <Stack spacing={4}>
      <Stack spacing={2}>
        <Typography variant="h5">Schema</Typography>
        <Typography><b>1.</b> Begin by selecting which schema to validate against</Typography>
        <Typography>
          <ul style={{ marginTop: 0 }}>
            <li>NeTEx - The full NeTEx schema (<a href="https://github.com/NeTEx-CEN/NeTEx" target="_blank" rel="noreferrer">more info</a>)</li>
            <li>NeTEx Light - NeTEx schema without constraint (<a href="https://data4pt.org/wiki/NeTEX#NeTEx-Light" target="_blank" rel="noreferrer">more info</a>)</li>
            <li>EPIP - NeTEx European Passenger Information Profile (<a href="https://data4pt.org/NeTEx/GraphicKit/Documention_of_XSD_for_EPIP.html" target="_blank" rel="noreferrer">more info</a>)</li>
            <li>EPIP Light - NeTEx European Passenger Information Profile</li>
          </ul>
        </Typography>
        <FormControl>
          <InputLabel id="netex-schema-label">Schema</InputLabel>
          <Select
            labelId="netex-schema-label"
            name="netex-schema"
            value={schema}
            onChange={handleSelectSchema}
          >
            <MenuItem key="netex" value="netex@1.2">NeTEx (v1.2)</MenuItem>
            <MenuItem key="netex-light" value="netex@1.2-nc">NeTEx Light (v1.2)</MenuItem>
            <MenuItem key="epip" value="epip@1.1.1">EPIP (v1.1.1)</MenuItem>
            <MenuItem key="epip-light" value="epip@1.1.1-nc">EPIP Light (v1.1.1)</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">Rules</Typography>
          <Typography><b>2.</b> In addition to the schema validation, we have also included a few optional rules that validate the consistency of the documents (work in progress)</Typography>
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
              <li><i>Stop place quay distance is reasonable</i> - Check the distance between a <Caption>{'<StopPlace />'}</Caption> and its <Caption>{'<Quay />'}</Caption>{'\''}s.</li>
            </ul>
        </Typography>
        <FormControl>
          <InputLabel id="scripts-label">Rules</InputLabel>
          <Select
            labelId="scripts-label"
            name="scripts"
            value={scripts as any}
            multiple
            onChange={handleSelectScripts}
          >
            { scriptOptions.map(opt => (
              <MenuItem
                key={opt.value}
                value={opt.value}
              >
                {opt.label}
              </MenuItem>
            )) }
          </Select>
        </FormControl>
      </Stack>
      <Stack alignItems="center">
        <Button
          variant="contained"
          endIcon={<ChevronRightIcon />}
          onClick={handleNextClick}
        >
          Next
        </Button>
      </Stack>
    </Stack>
  )
}

export default CustomConfiguration
