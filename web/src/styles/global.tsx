import React from 'react';
import { GlobalStyles } from '@mui/material';

export const globalStyles = (
  <GlobalStyles
    styles={{
      '*': {
        boxSizing: 'border-box',
      },
      html: {
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        height: '100%',
      },
      body: {
        height: '100%',
        margin: 0,
        padding: 0,
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        backgroundColor: '#FAFAFA',
        color: '#1F2937',
      },
      '#__next': {
        height: '100%',
      },
      a: {
        color: 'inherit',
        textDecoration: 'none',
      },
      'input:-webkit-autofill': {
        WebkitBoxShadow: '0 0 0 1000px white inset',
        WebkitTextFillColor: '#1F2937',
      },
      '.MuiDataGrid-root': {
        border: 'none',
        '& .MuiDataGrid-cell': {
          borderBottom: '1px solid #F3F4F6',
        },
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: '#F9FAFB',
          borderBottom: '2px solid #E5E7EB',
        },
        '& .MuiDataGrid-row:hover': {
          backgroundColor: '#F9FAFB',
        },
      },
      '.scrollbar-hide': {
        '-ms-overflow-style': 'none',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      },
    }}
  />
);
