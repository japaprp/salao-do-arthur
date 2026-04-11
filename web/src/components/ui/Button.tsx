import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';

interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'error' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

const StyledButton = styled(MuiButton)<ButtonProps>(({ theme, variant }) => ({
  borderRadius: theme.shape.borderRadius,
  fontWeight: 500,
  textTransform: 'none',
  boxShadow: 'none',
  transition: 'all 0.2s ease-in-out',

  '&:hover': {
    boxShadow: theme.shadows[2],
    transform: 'translateY(-1px)',
  },

  '&:active': {
    transform: 'translateY(0)',
  },

  // Variants customizados
  ...(variant === 'primary' && {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  }),

  ...(variant === 'secondary' && {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.secondary.dark,
    },
  }),

  ...(variant === 'accent' && {
    backgroundColor: '#F59E0B',
    color: '#FFFFFF',
    '&:hover': {
      backgroundColor: '#D97706',
    },
  }),

  ...(variant === 'success' && {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.success.dark,
    },
  }),

  ...(variant === 'error' && {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.error.dark,
    },
  }),
}));

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  children,
  ...props
}) => {
  // Mapeia variants customizados para variants MUI
  const muiVariant = variant === 'outlined' || variant === 'text' ? variant : 'contained';

  return (
    <StyledButton
      variant={muiVariant}
      size={size}
      fullWidth={fullWidth}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

export default Button;