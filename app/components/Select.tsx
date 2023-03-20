import {
  FormControl,
  InputLabel,
  MenuItem,
  Select as MUISelect,
  type SelectChangeEvent,
  type SelectProps
} from '@mui/material'
import React from 'react'

const Select = (props: SelectProps): JSX.Element => {
  return <MUISelect {...props} />
}

interface FormSelectOption {
  label: string
  value: string
}

interface FormSelectProps {
  labelId?: string
  label?: string
  name: string
  value?: string | string[]
  multiple?: boolean
  onChange: (event: SelectChangeEvent<any>) => void
  options: FormSelectOption[]
}

export const FormSelect = (props: FormSelectProps): JSX.Element => {
  const { name, value, onChange, options } = props
  const labelId = props.labelId ?? ''
  const label = props.label ?? ''
  const multiple = props.multiple ?? false
  let v = value
  if (value === null || value === undefined) {
    v = multiple ? [] : ''
  }
  if (multiple && !Array.isArray(v) && v !== '') {
    v = (v ?? '').split(',')
  }

  return (
    <FormControl fullWidth>
      { labelId !== '' && label !== '' && (
        <InputLabel id={labelId}>{label}</InputLabel>
      ) }
      <Select
        labelId={labelId}
        name={name}
        value={v as any}
        onChange={onChange}
        multiple={multiple}
      >
        {options.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default Select
