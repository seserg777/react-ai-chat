import { createTheme } from '@mui/material/styles';

const defaultShadows = createTheme().shadows;
const appShadows = [...defaultShadows] as typeof defaultShadows;
appShadows[1] =
  '0px 2px 12px rgba(0, 0, 0, 0.07), 0px 1px 4px rgba(0, 0, 0, 0.05)';
appShadows[2] =
  '0px 4px 18px rgba(0, 0, 0, 0.09), 0px 2px 6px rgba(0, 0, 0, 0.06)';
appShadows[3] =
  '0px 6px 24px rgba(0, 0, 0, 0.11), 0px 3px 8px rgba(0, 0, 0, 0.07)';
appShadows[4] =
  '0px 8px 28px rgba(0, 0, 0, 0.13), 0px 4px 10px rgba(0, 0, 0, 0.08)';

export const appTheme = createTheme({
  shadows: appShadows,
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#047857',
          light: '#34d399',
          dark: '#065f46',
          contrastText: '#fff',
        },
        secondary: {
          main: '#4f46e5',
        },
        error: {
          main: '#dc2626',
        },
        text: {
          primary: '#0f172a',
          secondary: '#64748b',
        },
        background: {
          default: '#f4f5f8',
          paper: '#ffffff',
        },
      },
    },
    dark: {
      palette: {
        mode: 'dark',
        primary: {
          main: '#34d399',
          light: '#6ee7b7',
          dark: '#059669',
          contrastText: '#0c0e12',
        },
        secondary: {
          main: '#a5b4fc',
        },
        error: {
          main: '#f87171',
        },
        text: {
          primary: '#e2e8f0',
          secondary: '#94a3b8',
        },
        background: {
          default: '#0c0e12',
          paper: '#151922',
        },
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"DM Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 15,
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    subtitle2: { lineHeight: 1.4 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitFontSmoothing: 'antialiased',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: false,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
          backgroundColor:
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
          '&:hover': {
            backgroundColor:
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
          },
          '&.Mui-focused': {
            backgroundColor:
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
          },
        }),
        inputMultiline: {
          paddingTop: 10,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
            borderColor: theme.palette.primary.main,
          },
        }),
      },
    },
  },
});
