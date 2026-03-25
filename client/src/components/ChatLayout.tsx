import { useChatSession } from '../hooks/useChatSession';
import { ThemeToggle } from './ThemeToggle';
import { Sidebar } from './Sidebar';
import { MessageList } from './MessageList';
import { Composer } from './Composer';
import { TokenStatusBar } from './TokenStatusBar';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

export function ChatLayout() {
  const chat = useChatSession();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar
        threads={chat.threads}
        activeId={chat.activeId}
        onSelect={chat.selectChat}
        onNew={chat.newChat}
        onDelete={chat.deleteChat}
      />
      <Box component="main" sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" elevation={0} color="default" sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ height: 3, bgcolor: 'primary.main', width: '100%', opacity: 0.95 }} aria-hidden />
          <Toolbar variant="dense" sx={{ gap: 2, py: 0.5, minHeight: 56 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" component="h1">
                AI Chat
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.25 }}>
                Gemini via Express proxy — demo
              </Typography>
            </Box>
            <ThemeToggle />
          </Toolbar>
        </AppBar>
        {chat.error && (
          <Alert
            severity="error"
            role="alert"
            sx={{ borderRadius: 0 }}
            action={
              <Stack direction="row" spacing={1}>
                <Button color="inherit" size="small" onClick={chat.retryAfterError}>
                  Retry
                </Button>
                <Button color="inherit" size="small" onClick={chat.dismissError}>
                  Dismiss
                </Button>
              </Stack>
            }
          >
            {chat.error}
          </Alert>
        )}
        <MessageList thread={chat.activeThread} streaming={chat.streaming} />
        <Composer
          disabled={!chat.activeId || chat.streaming}
          streaming={chat.streaming}
          onSend={chat.sendMessage}
        />
        <TokenStatusBar
          lastTurn={chat.lastTokenUsage}
          sessionIn={chat.sessionTokenIn}
          sessionOut={chat.sessionTokenOut}
          contextWindow={chat.contextWindowHint}
        />
      </Box>
    </Box>
  );
}
