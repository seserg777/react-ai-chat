import type { TokenTurnUsage } from '../types/tokenUsage';
import { formatTokenCount } from '../lib/formatTokens';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

type Props = {
  lastTurn: TokenTurnUsage | null;
  sessionIn: number;
  sessionOut: number;
  contextWindow: number | null;
};

export function TokenStatusBar({ lastTurn, sessionIn, sessionOut, contextWindow }: Props) {
  const theme = useTheme();
  const remaining =
    lastTurn && contextWindow != null && contextWindow > 0
      ? Math.max(0, contextWindow - lastTurn.input_tokens)
      : null;

  const paper = theme.palette.background.paper;
  const ink = theme.palette.text.primary;
  const muted = theme.palette.text.secondary;

  return (
    <Box
      component="footer"
      aria-label="API token usage (last reply and session)"
      sx={{
        flexShrink: 0,
        px: 2,
        py: 1,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: paper,
        color: ink,
      }}
    >
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1} rowGap={0.75}>
        <Typography
          variant="caption"
          component="span"
          sx={{
            fontWeight: 800,
            letterSpacing: 0.08,
            textTransform: 'uppercase',
            color: 'primary.main',
          }}
        >
          Tokens
        </Typography>
        {lastTurn ? (
          <>
            <Chip
              size="small"
              variant="outlined"
              label={`in ${formatTokenCount(lastTurn.input_tokens)}`}
              title="Input tokens for this request (prompt)"
              sx={{
                borderColor: 'divider',
                color: ink,
                '& .MuiChip-label': { px: 1, color: ink },
              }}
            />
            <Chip
              size="small"
              variant="outlined"
              label={`out ${formatTokenCount(lastTurn.output_tokens)}`}
              title="Output tokens in this reply"
              sx={{
                borderColor: 'divider',
                color: ink,
                '& .MuiChip-label': { px: 1, color: ink },
              }}
            />
            {remaining != null && (
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={`~${formatTokenCount(remaining)} ctx`}
                title="Rough headroom: context window minus last input (see GEMINI_CONTEXT_WINDOW on server)"
                sx={{
                  borderColor: 'primary.main',
                  '& .MuiChip-label': {
                    px: 1,
                    color: theme.palette.primary.main,
                  },
                }}
              />
            )}
          </>
        ) : (
          <Typography variant="caption" sx={{ color: muted }}>
            No usage yet — send a message
          </Typography>
        )}
        {(sessionIn > 0 || sessionOut > 0) && (
          <Typography
            variant="caption"
            sx={{
              ml: { sm: 'auto' },
              fontVariantNumeric: 'tabular-nums',
              color: muted,
            }}
            title="Cumulative in this browser session (resets on reload)"
          >
            Σ in {formatTokenCount(sessionIn)} · out {formatTokenCount(sessionOut)}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
