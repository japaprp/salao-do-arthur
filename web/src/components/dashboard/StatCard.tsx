import React from 'react';
import { Box, Typography } from '@mui/material';
import Card from '@/components/ui/Card';

interface StatCardProps {
  title: string;
  subtitle: string;
  value: string;
  icon: React.ReactNode;
  footnote?: string;
  valueColor?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  subtitle,
  value,
  icon,
  footnote,
  valueColor = 'primary.main',
  onClick,
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!onClick) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      title={title}
      subtitle={subtitle}
      hover={Boolean(onClick)}
      density="compact"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      sx={{
        minHeight: { xs: 170, md: 186 },
        ...(onClick && {
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }),
      }}
    >
      <Box
        display="flex"
        alignItems="flex-start"
        justifyContent="space-between"
        gap={1.5}
        sx={{ mb: footnote ? 1.25 : 0 }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'action.hover',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="h4"
          fontWeight={800}
          color={valueColor}
          sx={{ lineHeight: 1.05, textAlign: 'right' }}
        >
          {value}
        </Typography>
      </Box>
      {footnote ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            lineHeight: 1.6,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {footnote}
        </Typography>
      ) : null}
    </Card>
  );
};
