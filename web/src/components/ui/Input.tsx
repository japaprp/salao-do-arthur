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

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'outlined',
      startIcon,
      endIcon,
      onEndIconClick,
      InputProps: materialInputProps,
      ...props
    },
    ref,
  ) => {
    const inputProps: NonNullable<TextFieldProps['InputProps']> = {
      ...materialInputProps,
    };

    if (startIcon) {
      inputProps.startAdornment = <InputAdornment position="start">{startIcon}</InputAdornment>;
    }

    if (endIcon) {
      inputProps.endAdornment = (
        <InputAdornment position="end">
          {onEndIconClick ? (
            <IconButton onClick={onEndIconClick} size="small">
              {endIcon}
            </IconButton>
          ) : (
            endIcon
          )}
        </InputAdornment>
      );
    }

    return (
      <StyledTextField
        variant={variant}
        fullWidth
        InputProps={inputProps}
        inputRef={ref}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';

export default Input;
