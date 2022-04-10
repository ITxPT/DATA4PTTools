import {
  FormControl,
  InputLabel,
  MenuItem,
  Select as MUISelect,
  SelectChangeEvent,
  SelectProps,
} from '@mui/material';
import { styled } from '@mui/system';
import theme from '../styles/theme';

const Select = (props: SelectProps) => {
  return <MUISelect {...props} />;
};

type FormSelectProps = {
  labelId?: string;
  label?: string;
  name: string;
  value?: string | string[];
  multiple?: boolean;
  onChange: (event: SelectChangeEvent<any>) => void;
  options: { label: string; value: string }[];
};

export const FormSelect = (props: FormSelectProps) => {
  const { labelId, label, multiple, name, value, onChange, options } = props;
  let v = value;
  if (value === null || value === undefined) {
    v = multiple ? [] : '';
  }
  if (multiple && !Array.isArray(v) && v) {
    v = v.split(',');
  }

  return (
    <FormControl fullWidth>
      {labelId && label && <InputLabel id={labelId}>{label}</InputLabel>}
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
  );
};

export default Select;
