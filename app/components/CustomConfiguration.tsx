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
  DialogActions,
  Card
} from '@mui/material'
import { grey } from '@mui/material/colors'
import TuneOutlineIcon from '@mui/icons-material/TuneOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import React from 'react'
import FileUpload, { type FileList } from './FileUpload'
import type { Profile, Script, Session, XSDUploadFile } from '../api/types'
import scriptData from '../public/scripts.json'
import useApiClient from '../hooks/useApiClient'

const scriptOptions = scriptData.filter(v => v.name !== 'xsd')

export interface CustomConfigurationProps {
  session: Session | null
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

const CustomConfiguration = ({
  session,
  disabled,
  onNext
}: CustomConfigurationProps): JSX.Element => {
  const [schema, setSchema] = React.useState<string>('netex@1.2-nc')
  const [schemaEntry, setSchemaEntry] = React.useState<string>('')
  const [scripts, setScripts] = React.useState<string[]>(scriptOptions.map(v => v.name))
  const [scriptOpts, setScriptOpts] = React.useState<Record<string, Record<string, any>>>({})
  const [fileList, setFileList] = React.useState<Record<string, unknown>>({})
  const [schemaFiles, setSchemaFiles] = React.useState<XSDUploadFile[]>([])
  const apiClient = useApiClient()

  const handleSelectSchema = (event: SelectChangeEvent): void => {
    if (event.target?.name === '') {
      return
    }

    setSchema(event.target.value)
  }

  const handleSelectSchemaEntry = (event: SelectChangeEvent): void => {
    if (event.target?.name === '') {
      return
    }

    setSchemaEntry(event.target.value)
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
    if (disabled === true) {
      return
    }

    const xsdScript = {
      ...scriptData.find(v => v.name === 'xsd'),
      config: schema === 'custom'
        ? { schema: 'custom', entry: schemaEntry }
        : { schema }
    }

    onNext({
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

  React.useEffect(() => {
    if (session == null) {
      return
    }
    if (session.xsdFiles != null) {
      const { xsdFiles } = session

      setFileList(xsdFiles.reduce((o: Record<string, any>, { name }) => {
        o[name] = {
          name,
          status: 'uploaded',
          progress: 100
        }
        return o
      }, {}) ?? {})
      setSchemaFiles(xsdFiles.reduce((o: XSDUploadFile[], v) => {
        if (v.files != null) {
          o.push(...v.files)
        }
        return o
      }, []) ?? [])
    }
    if (session.profile != null) {
      const { profile } = session
      const xsdScript = profile.scripts?.find(v => v.name === 'xsd')

      setSchema(xsdScript?.config?.schema)
      setSchemaEntry(xsdScript?.config?.entry)
    }
  }, [session, setFileList])

  return (
    <Stack spacing={8}>
      <Stack spacing={4}>
        <Stack spacing={2}>
          <Typography variant="h4">Profile</Typography>
          <Typography><b>1.</b> Begin by selecting which profile to use for validation</Typography>
          <Typography>
            <ul style={{ marginTop: 0 }}>
              <li>NeTEx - The full NeTEx schema (<a href="https://github.com/NeTEx-CEN/NeTEx/tree/12848763e6a9340b703de048368f2dd518ac3e27" target="_blank" rel="noreferrer">more info</a>)</li>
              <li>NeTEx Fast - NeTEx schema without constraint (<a href="https://github.com/NeTEx-CEN/NeTEx/tree/12848763e6a9340b703de048368f2dd518ac3e27" target="_blank" rel="noreferrer">more info</a>)</li>
              <li>EPIP - NeTEx European Passenger Information Profile (<a href="https://data4pt.org/w/index.php?title=NeTEX#NeTEx_EPIP_Light" target="_blank" rel="noreferrer">more info</a>)</li>
              <li>EPIP Fast - NeTEx European Passenger Information Profile (<a href="https://data4pt.org/w/index.php?title=NeTEX#NeTEx_EPIP_Light" target="_blank" rel="noreferrer">more info</a>)</li>
            </ul>
          </Typography>
          <FormControl>
            <InputLabel id="netex-schema-label">Profile</InputLabel>
            <Select
              labelId="netex-schema-label"
              name="netex-schema"
              value={schema}
              onChange={handleSelectSchema}
            >
              <MenuItem key="netex" value="netex@1.2">NeTEx (v1.2)</MenuItem>
              <MenuItem key="netex-light" value="netex@1.2-nc">NeTEx Fast (v1.2)</MenuItem>
              <MenuItem key="epip" value="epip@1.1.2">EPIP (v1.1.2)</MenuItem>
              <MenuItem key="epip-light" value="epip@1.1.2-nc">EPIP Fast (v1.1.2)</MenuItem>
              <MenuItem key="custom" value="custom">Custom</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        {schema === 'custom' && (
          <Card style={{ padding: 16 }}>
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Typography variant="h5">Upload custom profile</Typography>
                <Typography gutterBottom>Select which file to use as profile &apos;Select file(s)&apos;</Typography>
              </Stack>
              <Stack alignItems="center" spacing={2}>
                <FileUpload
                  values={fileList}
                  disabled={false}
                  supportedFormats={['xml', 'zip']}
                  onUpload={async (file: any, cb: any) => {
                    await apiClient.xsdUpload(session?.id ?? '', file, cb)
                      .then(res => {
                        setSchemaFiles(res.data?.xsdFiles?.reduce((o: XSDUploadFile[], v: any) => {
                          if (v.files != null) {
                            o.push(...v.files)
                          }
                          return o
                        }, []) ?? [])
                      })
                  }}
                  onChange={(fileList: FileList) => {
                    setFileList({ ...fileList })
                  }}
                  onError={({ errorMessage }: { errorMessage: string }) => {
                    return `Error caught uploading file, message: ${errorMessage}`
                  }}
                />
              </Stack>
              <FormControl>
                <InputLabel id="schema-entry">Main entry point</InputLabel>
                <Select
                  labelId="schema-entry-label"
                  name="schema-entry"
                  value={schemaEntry}
                  onChange={handleSelectSchemaEntry}
                  disabled={Object.values(fileList).length === 0}
                >
                  {schemaFiles.map(({ id, name }) => (
                    <MenuItem key={id} value={id}>{name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Card>
        )}
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h4">Rules</Typography>
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
          disabled={(disabled ?? false) || (schema === 'custom' && schemaEntry === '')}
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
