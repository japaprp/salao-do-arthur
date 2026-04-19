import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';

type MuiVariant = NonNullable<MuiButtonProps['variant']>;
type ButtonTone = 'primary' | 'secondary' | 'accent' | 'success' | 'error';
type ButtonVariant = ButtonTone | MuiVariant;

interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: ButtonVariant;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

interface StyledButtonProps {
  $tone: ButtonTone;
}

const StyledButton = styled(MuiButton, {
  shouldForwardProp: (prop) => prop !== '$tone',
})<StyledButtonProps>(({ theme, $tone }) => ({
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
  ...($tone === 'primary' && {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  }),

  ...($tone === 'secondary' && {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.secondary.dark,
    },
  }),

  ...($tone === 'accent' && {
    backgroundColor: '#F59E0B',
    color: '#FFFFFF',
    '&:hover': {
      backgroundColor: '#D97706',
    },
  }),

  ...($tone === 'success' && {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.success.dark,
    },
  }),

  ...($tone === 'error' && {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.error.dark,
    },
  }),
}));

const isMuiVariant = (variant: ButtonVariant): variant is MuiVariant =>
  variant === 'contained' || variant === 'outlined' || variant === 'text';

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  children,
  ...props
}) => {
  // Mapeia variants customizados para variants MUI
  const muiVariant = isMuiVariant(variant) ? variant : 'contained';
  const tone: ButtonTone = isMuiVariant(variant) ? 'primary' : variant;

  return (
    <StyledButton
      $tone={tone}
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
