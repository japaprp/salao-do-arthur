import { GridProps } from '@mui/material';

type GridSpanProps = Pick<GridProps, 'xs' | 'sm' | 'md' | 'lg' | 'xl'>;

export const metricGridProps: GridSpanProps = {
  xs: 6,
  md: 3,
};

export const featureGridProps: GridSpanProps = {
  xs: 6,
  md: 6,
  xl: 3,
};

export const entityGridProps: GridSpanProps = {
  xs: 6,
  md: 4,
  xl: 3,
};

export const widePanelGridProps: GridSpanProps = {
  xs: 12,
  lg: 8,
};

export const sidePanelGridProps: GridSpanProps = {
  xs: 12,
  lg: 4,
};
