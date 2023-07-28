import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Stack,
  Typography,
  OutlinedInput,
  DialogActions
} from '@mui/material'
import { grey } from '@mui/material/colors'
import TuneOutlineIcon from '@mui/icons-material/TuneOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import React from 'react'
import type { Profile, Script } from '../api/types'
import scriptData from '../public/scripts.json'

const scriptOptions = scriptData.filter(v => v.name !== 'xsd')

export interface CustomConfigurationProps {
  onNext: (profile: Profile) => void
  disabled?: boolean
}

interface ScriptRowProps {
  script: Script
  checked: boolean
  defaults?: Record<string, any>
  onToggle: (script: Script) => void
  onChange: (script: Script, changes: Record<string, any>) => void
}

const ScriptRow = ({
  script,
  checked,
  defaults,
  onToggle,
  onChange
}: ScriptRowProps): JSX.Element => {
  const [open, setOpen] = React.useState<boolean>(false)
  const [changes, setChanges] = React.useState<Record<string, any>>(defaults ?? {})
  const labelId = `cb-list-label-${script.name}`

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setChanges({
      ...changes,
      [event.target.name]: event.target.type === 'number' ? parseInt(event.target.value) : event.target.value
    })
  }

  const handleClose = (): void => {
    setOpen(false)

    if (Object.keys(changes).length > 0) {
      onChange(script, changes)
    }
  }

  return (
    <>
      <ListItem
        key={script.name}
        secondaryAction={(
          script.configOptions !== undefined && (
            <IconButton onClick={() => {
              setOpen(true)
            }}>
              <TuneOutlineIcon />
            </IconButton>
          )
        )}
        divider
      >
        <ListItemIcon>
          <Checkbox
            edge="start"
            checked={checked}
            tabIndex={-1}
            disableRipple
            inputProps={{ 'aria-labelledby': labelId }}
            onClick={() => {
              onToggle(script)
            }}
          />
        </ListItemIcon>
        <Stack>
          <ListItemText
            id={labelId}
            primary={script.description}
            secondary={script.longDescription}
          />
        </Stack>
      </ListItem>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Configuration</DialogTitle>
        <DialogContent>
          <Stack gap={2}>
            {script.configOptions?.map(opt => (
              <Stack key={opt.name} gap={1}>
                <InputLabel>{opt.description}</InputLabel>
                <OutlinedInput
                  placeholder={opt.default?.toString()}
                  size="small"
                  type={opt.type}
                  name={opt.name}
                  value={changes[opt.name] ?? ''}
                  onChange={handleChange}
                />
              </Stack>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

const CustomConfiguration = (props: CustomConfigurationProps): JSX.Element => {
  const [schema, setSchema] = React.useState<string>('netex@1.2-nc')
  const [scripts, setScripts] = React.useState<string[]>(scriptOptions.map(v => v.name))
  const [scriptOpts, setScriptOpts] = React.useState<Record<string, Record<string, any>>>({})

  const handleSelectSchema = (event: SelectChangeEvent): void => {
    if (event.target?.name === '') {
      return
    }

    setSchema(event.target.value)
  }

  const handleScriptToggle = (v: Script): void => {
    const i = scripts.indexOf(v.name)
    const s = [...scripts]

    if (i === -1) {
      s.push(v.name)
    } else {
      s.splice(i, 1)
    }

    setScripts(s)
  }

  const handleConfigChange = (script: Script, changes: Record<string, any>): void => {
    setScriptOpts({
      ...scriptOpts,
      [script.name]: changes
    })
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
      longDescription: '',
      scripts: [
        xsdScript as Script,
        ...scripts.map(name => {
          const script = scriptData.find(v => v.name === name) as Script

          script.config = scriptOpts[script.name]

          return script
        })
      ]
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
            <li>NeTEx Fast - NeTEx schema without constraint (<a href="https://data4pt.org/w/index.php?title=NeTEX" target="_blank" rel="noreferrer">more info</a>)</li>
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
          {scriptOptions.map(script => (
            <ScriptRow
              key={script.name}
              script={script}
              checked={scripts.includes(script.name)}
              onToggle={handleScriptToggle}
              onChange={handleConfigChange}
              defaults={scriptOpts[script.name]}
            />
          ))}
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
