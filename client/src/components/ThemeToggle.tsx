import { useColorScheme } from '@mui/material/styles';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

export function ThemeToggle() {
  const { mode, setMode } = useColorScheme();
  const resolved = mode === 'dark' || mode === 'light' ? mode : 'dark';

  return (
    <Tooltip title={resolved === 'dark' ? 'Light theme' : 'Dark theme'}>
      <IconButton
        type="button"
        onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}
        color="inherit"
        aria-label={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        edge="end"
        size="small"
      >
        {resolved === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
}
