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
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  subtitle,
  value,
  icon,
  footnote,
  valueColor = 'primary.main',
}) => {
  return (
    <Card title={title} subtitle={subtitle} hover>
      <Box display="flex" alignItems="center" gap={1}>
        {icon}
        <Typography variant="h4" fontWeight={700} color={valueColor}>
          {value}
        </Typography>
      </Box>
      {footnote ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {footnote}
        </Typography>
      ) : null}
    </Card>
  );
};
