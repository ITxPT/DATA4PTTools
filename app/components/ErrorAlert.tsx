import { Alert, Snackbar } from '@mui/material';

export type ErrorAlertProps = {
  message: string;
  open: boolean;
  onClose: () => void;
}

const ErrorAlert = (props: ErrorAlertProps) => {
  const { message, open, onClose } = props;

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert severity="error" onClose={onClose}>{message}</Alert>
    </Snackbar>
  );
};

export default ErrorAlert;
