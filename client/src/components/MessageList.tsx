import { useEffect, useRef } from 'react';
import type { ChatThread } from '../types/chat';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useColorScheme, useTheme } from '@mui/material/styles';

type Props = {
  thread: ChatThread | null;
  streaming: boolean;
};

function resolveColorScheme(
  mode: 'light' | 'dark' | 'system' | undefined,
  systemMode: 'light' | 'dark' | undefined,
): 'light' | 'dark' {
  if (mode === 'system' || mode == null) {
    return systemMode ?? 'light';
  }
  return mode;
}

function EmptyState({
  title,
  subtitle,
  icon,
  isDark,
}: {
  title: string;
  subtitle: string;
  icon: 'forum' | 'smart';
  isDark: boolean;
}) {
  const Icon = icon === 'forum' ? ForumOutlinedIcon : SmartToyOutlinedIcon;
  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        py: 4,
      }}
    >
      <Stack alignItems="center" spacing={2} maxWidth={400} textAlign="center">
        <Box
          sx={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
            color: 'primary.main',
            boxShadow: isDark
              ? '0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.35)'
              : '0 8px 28px rgba(15,23,42,0.08)',
          }}
        >
          <Icon sx={{ fontSize: 44, opacity: 0.95 }} />
        </Box>
        <Typography variant="body1" fontWeight={600} color="text.primary">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" lineHeight={1.55}>
          {subtitle}
        </Typography>
      </Stack>
    </Box>
  );
}

export function MessageList({ thread, streaming }: Props) {
  const theme = useTheme();
  const { mode, systemMode } = useColorScheme();
  const isDark = resolveColorScheme(mode, systemMode) === 'dark';

  const scrollRootRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scrollRootRef.current;
    if (!root) return;
    if (streaming) {
      root.scrollTop = root.scrollHeight;
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thread?.messages, streaming]);

  if (!thread) {
    return (
      <EmptyState
        icon="smart"
        title="Start a conversation"
        subtitle="Create a new chat to get started — your history stays in this browser."
        isDark={isDark}
      />
    );
  }

  if (thread.messages.length === 0) {
    return (
      <EmptyState
        icon="forum"
        title="Say hello"
        subtitle="Type a message below. History is saved in localStorage on this device."
        isDark={isDark}
      />
    );
  }

  const assistantSurface = isDark
    ? {
        bgcolor: '#1c2433',
        color: '#e2e8f0',
        borderColor: 'rgba(148,163,184,0.35)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)',
        captionColor: '#94a3b8',
      }
    : {
        bgcolor: theme.palette.grey[50],
        color: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
        captionColor: theme.palette.text.secondary,
      };

  return (
    <Box
      ref={scrollRootRef}
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      sx={{ flex: 1, overflow: 'auto', px: { xs: 2, sm: 3 }, py: 2 }}
    >
      <Stack spacing={2.25}>
        {thread.messages.map((m, i) => {
          const isUser = m.role === 'user';
          const isLastAssistant = m.role === 'assistant' && i === thread.messages.length - 1;
          return (
            <Box
              key={`${thread.id}-${i}`}
              sx={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
              }}
              data-testid={isLastAssistant ? 'assistant-message' : undefined}
            >
              <Paper
                elevation={0}
                sx={{
                  maxWidth: 'min(100%, 720px)',
                  px: 2,
                  py: 1.5,
                  borderRadius: 3,
                  border: 1,
                  ...(isUser
                    ? {
                        borderColor: 'transparent',
                        bgcolor: isDark ? theme.palette.primary.dark : theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        boxShadow: isDark
                          ? '0 4px 20px rgba(52, 211, 153, 0.18)'
                          : '0 6px 24px rgba(4, 120, 87, 0.28)',
                      }
                    : {
                        bgcolor: assistantSurface.bgcolor,
                        color: assistantSurface.color,
                        borderColor: assistantSurface.borderColor,
                        boxShadow: assistantSurface.boxShadow,
                        borderLeftWidth: 3,
                        borderLeftStyle: 'solid',
                        borderLeftColor: 'primary.light',
                        borderTopWidth: 1,
                        borderRightWidth: 1,
                        borderBottomWidth: 1,
                      }),
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    opacity: isUser ? 0.9 : 1,
                    color: isUser ? 'inherit' : assistantSurface.captionColor,
                  }}
                  display="block"
                  gutterBottom
                >
                  {isUser ? 'You' : 'Assistant'}
                </Typography>
                <Typography
                  variant="body1"
                  component="div"
                  sx={{
                    color: isUser ? 'inherit' : assistantSurface.color,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    '& .stream-cursor': {
                      display: 'inline-block',
                      width: 6,
                      height: 14,
                      ml: 0.25,
                      verticalAlign: 'text-bottom',
                      bgcolor: 'primary.light',
                      animation: 'muiPulse 1s ease-in-out infinite',
                      '@keyframes muiPulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.25 },
                      },
                    },
                  }}
                >
                  {m.content || (isLastAssistant && streaming ? '\u00a0' : '')}
                  {isLastAssistant && streaming && m.content.length > 0 && <span className="stream-cursor" aria-hidden />}
                </Typography>
              </Paper>
            </Box>
          );
        })}
      </Stack>
      <div ref={bottomRef} />
    </Box>
  );
}
