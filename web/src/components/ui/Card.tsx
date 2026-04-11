import React from 'react';
import {
  Card as MuiCard,
  CardProps as MuiCardProps,
  CardContent,
  CardHeader,
  Typography,
  Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';

interface CustomCardProps extends MuiCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  padding?: 'none' | 'small' | 'medium' | 'large';
  hover?: boolean;
}

const StyledCard = styled(MuiCard)<{ hover?: boolean }>(({ theme, hover }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[1],
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.2s ease-in-out',

  ...(hover && {
    '&:hover': {
      boxShadow: theme.shadows[4],
      transform: 'translateY(-2px)',
      cursor: 'pointer',
    },
  }),
}));

const getPadding = (padding: CustomCardProps['padding']) => {
  switch (padding) {
    case 'none':
      return 0;
    case 'small':
      return 1;
    case 'large':
      return 3;
    case 'medium':
    default:
      return 2;
  }
};

export const Card: React.FC<CustomCardProps> = ({
  title,
  subtitle,
  action,
  children,
  padding = 'medium',
  hover = false,
  ...props
}) => {
  return (
    <StyledCard hover={hover} {...props}>
      {(title || subtitle || action) && (
        <CardHeader
          title={title && (
            <Typography variant="h6" component="h2" fontWeight={600}>
              {title}
            </Typography>
          )}
          subheader={subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          action={action}
        />
      )}
      <CardContent sx={{ p: getPadding(padding) }}>
        {children}
      </CardContent>
    </StyledCard>
  );
};

export default Card;