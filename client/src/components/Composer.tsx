import { useCallback, useRef, useState, type FormEvent } from 'react';
import SendIcon from '@mui/icons-material/Send';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

type Props = {
  disabled: boolean;
  streaming: boolean;
  onSend: (text: string) => void;
};

export function Composer({ disabled, streaming, onSend }: Props) {
  const [value, setValue] = useState('');
  const valueRef = useRef('');

  const submit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const t = valueRef.current.trim();
      if (!t || disabled) return;
      onSend(t);
      valueRef.current = '';
      setValue('');
    },
    [disabled, onSend],
  );

  return (
    <Box
      component="form"
      onSubmit={submit}
      sx={{
        flexShrink: 0,
        px: { xs: 2, sm: 3 },
        py: 2,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 -8px 32px rgba(0,0,0,0.35)'
            : '0 -4px 24px rgba(15, 23, 42, 0.06)',
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField
          id="chat-input"
          label="Message"
          variant="filled"
          multiline
          minRows={3}
          maxRows={8}
          fullWidth
          hiddenLabel={false}
          placeholder={streaming ? 'Waiting for response…' : 'Write a message…'}
          value={value}
          disabled={disabled}
          slotProps={{
            htmlInput: { 'data-testid': 'chat-composer-input' },
            inputLabel: { shrink: true },
          }}
          onChange={(e) => {
            const v = e.target.value;
            valueRef.current = v;
            setValue(v);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit(e);
            }
          }}
        />
        <Tooltip title="Send">
          <span>
            <IconButton
              type="submit"
              data-testid="chat-send"
              color="primary"
              disabled={disabled || !value.trim()}
              sx={{
                mb: 0.25,
                bgcolor: 'action.hover',
                boxShadow: 1,
                '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
              }}
              aria-label="Send"
            >
              <SendIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
}
