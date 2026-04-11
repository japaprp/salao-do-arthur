import React from 'react';
import {
  TextField,
  TextFieldProps,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';

interface InputProps extends Omit<TextFieldProps, 'variant'> {
  variant?: 'outlined' | 'filled' | 'standard';
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  onEndIconClick?: () => void;
}

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius,
    transition: 'all 0.2s ease-in-out',

    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
    },

    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderWidth: 2,
    },
  },

  '& .MuiInputLabel-root': {
    '&.Mui-focused': {
      color: theme.palette.primary.main,
    },
  },
}));

export const Input: React.FC<InputProps> = ({
  variant = 'outlined',
  startIcon,
  endIcon,
  onEndIconClick,
  ...props
}) => {
  const inputProps: any = {};

  if (startIcon || endIcon) {
    inputProps.startAdornment = startIcon ? (
      <InputAdornment position="start">{startIcon}</InputAdornment>
    ) : undefined;

    inputProps.endAdornment = endIcon ? (
      <InputAdornment position="end">
        {onEndIconClick ? (
          <IconButton onClick={onEndIconClick} size="small">
            {endIcon}
          </IconButton>
        ) : (
          endIcon
        )}
      </InputAdornment>
    ) : undefined;
  }

  return (
    <StyledTextField
      variant={variant}
      fullWidth
      InputProps={inputProps}
      {...props}
    />
  );
};

export default Input;