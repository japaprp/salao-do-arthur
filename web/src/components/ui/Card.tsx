import React from 'react';
import {
  Card as MuiCard,
  CardProps as MuiCardProps,
  CardContent,
  CardHeader,
  SxProps,
  Theme,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';

interface CustomCardProps extends MuiCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  padding?: 'none' | 'small' | 'medium' | 'large';
  hover?: boolean;
  density?: 'default' | 'compact';
  contentSx?: SxProps<Theme>;
}

const StyledCard = styled(MuiCard)<{ hover?: boolean }>(({ theme, hover }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
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

const getPadding = (
  padding: CustomCardProps['padding'],
  density: CustomCardProps['density'],
) => {
  const compact = density === 'compact';

  switch (padding) {
    case 'none':
      return 0;
    case 'small':
      return compact ? 1.5 : 1.75;
    case 'large':
      return compact ? 2.5 : 3;
    case 'medium':
    default:
      return compact ? 2 : 2.5;
  }
};

export const Card: React.FC<CustomCardProps> = ({
  title,
  subtitle,
  action,
  children,
  padding = 'medium',
  hover = false,
  density = 'default',
  contentSx,
  ...props
}) => {
  const basePadding = getPadding(padding, density);
  const isCompact = density === 'compact';

  return (
    <StyledCard hover={hover} {...props}>
      {(title || subtitle || action) && (
        <CardHeader
          sx={{
            px: isCompact ? 2 : 2.5,
            py: isCompact ? 1.75 : 2.25,
            alignItems: 'flex-start',
            '& .MuiCardHeader-action': {
              mt: 0,
              ml: 1.25,
              alignSelf: 'center',
            },
            '& .MuiCardHeader-content': {
              overflow: 'hidden',
            },
          }}
          title={title && (
            <Typography
              variant={isCompact ? 'subtitle1' : 'h6'}
              component="h2"
              fontWeight={700}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {title}
            </Typography>
          )}
          subheader={subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.35,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: isCompact ? 2 : 3,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {subtitle}
            </Typography>
          )}
          action={action}
        />
      )}
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: basePadding,
          pt: title || subtitle || action ? 0 : basePadding,
          '&:last-child': {
            pb: basePadding,
          },
          ...contentSx,
        }}
      >
        {children}
      </CardContent>
    </StyledCard>
  );
};

export default Card;
