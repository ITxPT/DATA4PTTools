import {
  Button,
  Checkbox,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import { grey } from '@mui/material/colors'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import React from 'react'
import type { Profile, Script } from '../api/types'
import scriptData from '../public/scripts.json'

const scriptOptions = scriptData.filter(v => v.name !== 'xsd')
  .map(v => ({
    value: v.name,
    label: v.description,
    description: v.longDescription
  }))

export interface CustomConfigurationProps {
  onNext: (profile: Profile) => void
  disabled?: boolean
}

const CustomConfiguration = (props: CustomConfigurationProps): JSX.Element => {
  const [schema, setSchema] = React.useState<string>('netex@1.2-nc')
  const [scripts, setScripts] = React.useState<string[]>(scriptOptions.map(v => v.value))

  const handleSelectSchema = (event: SelectChangeEvent): void => {
    if (event.target?.name === '') {
      return
    }

    setSchema(event.target.value)
  }

  const handleScriptToggle = (v: string): void => {
    const i = scripts.indexOf(v)
    const s = [...scripts]

    if (i === -1) {
      s.push(v)
    } else {
      s.splice(i, 1)
    }

    setScripts(s)
  }

  const handleNextClick = (): void => {
    if (props.disabled === true) {
      return
    }

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
        <Typography variant="h5">Profile</Typography>
        <Typography><b>1.</b> Begin by selecting which profile to use for validation</Typography>
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
            <MenuItem key="netex-light" value="netex@1.2-nc">NeTEx Fast (v1.2)</MenuItem>
            <MenuItem key="epip" value="epip@1.1.1">EPIP (v1.1.1)</MenuItem>
            <MenuItem key="epip-light" value="epip@1.1.1-nc">EPIP Fast (v1.1.1)</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h5">Rules</Typography>
        <Typography><b>2.</b> In addition to the schema validation, we have also included a few optional rules that validate the consistency of the documents</Typography>
        <List
          sx={{
            bgcolor: 'background.paper',
            border: `1px solid ${grey[300]}`,
            borderBottom: 0,
            padding: 0
          }}
        >
          { scriptOptions.map(opt => {
            const labelId = `cb-list-label-${opt.value}`

            return (
              <ListItem
                key={opt.value}
                secondaryAction={
                  <Tooltip
                    placement="left"
                    title={opt.description}
                  >
                    <IconButton>
                      <HelpOutlineIcon />
                    </IconButton>
                  </Tooltip>
                }
                disablePadding
                divider
              >
                <ListItemButton onClick={() => {
                  handleScriptToggle(opt.value)
                }}>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={scripts.includes(opt.value)}
                      tabIndex={-1}
                      disableRipple
                      inputProps={{ 'aria-labelledby': labelId }}
                    />
                  </ListItemIcon>
                  <ListItemText id={labelId} primary={opt.label} />
                </ListItemButton>
              </ListItem>
            )
          }) }
        </List>
      </Stack>
      <Stack alignItems="center">
        <Button
          disabled={props.disabled}
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
