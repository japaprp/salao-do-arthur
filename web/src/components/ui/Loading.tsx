import React from 'react';
import {
  CircularProgress,
  CircularProgressProps,
  Box,
  Typography,
  Backdrop,
} from '@mui/material';
import { styled } from '@mui/material/styles';

interface LoadingProps extends CircularProgressProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullScreen?: boolean;
}

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(4),
}));

const FullScreenBackdrop = styled(Backdrop)(({ theme }) => ({
  zIndex: theme.zIndex.modal + 1,
  color: '#fff',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const getSize = (size: LoadingProps['size']) => {
  switch (size) {
    case 'small':
      return 20;
    case 'large':
      return 60;
    case 'medium':
    default:
      return 40;
  }
};

export const Loading: React.FC<LoadingProps> = ({
  size = 'medium',
  text,
  fullScreen = false,
  ...props
}) => {
  const progressSize = getSize(size);

  if (fullScreen) {
    return (
      <FullScreenBackdrop open>
        <CircularProgress size={progressSize} color="inherit" {...props} />
        {text && (
          <Typography variant="h6" color="inherit">
            {text}
          </Typography>
        )}
      </FullScreenBackdrop>
    );
  }

  return (
    <LoadingContainer>
      <CircularProgress size={progressSize} {...props} />
      {text && (
        <Typography variant="body2" color="text.secondary">
          {text}
        </Typography>
      )}
    </LoadingContainer>
  );
};

export default Loading;