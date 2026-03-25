import type { ChatThread } from '../types/chat';
import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

const DRAWER_WIDTH = 280;

type Props = {
  threads: ChatThread[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
};

export function Sidebar({ threads, activeId, onSelect, onNew, onDelete }: Props) {
  return (
    <Drawer
      variant="permanent"
      aria-label="Chats"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '4px 0 24px rgba(0,0,0,0.35)'
              : '4px 0 24px rgba(15, 23, 42, 0.06)',
        },
      }}
    >
      <Toolbar sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<AddCommentOutlinedIcon />}
          data-testid="new-chat"
          onClick={onNew}
          sx={{
            fontWeight: 700,
            py: 1.25,
            boxShadow: 'none',
            '&:hover': { boxShadow: 3 },
          }}
        >
          New chat
        </Button>
      </Toolbar>
      <List disablePadding sx={{ px: 1, py: 1, flex: 1, overflow: 'auto' }}>
        {threads.map((t) => {
          const selected = t.id === activeId;
          return (
            <ListItem
              key={t.id}
              disablePadding
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label={`Delete ${t.title}`}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(t.id);
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              }
              data-testid="thread-item"
              data-thread-id={t.id}
              sx={{
                mb: 0.75,
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
                ...(selected
                  ? {
                      boxShadow: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '0 0 0 1px rgba(52,211,153,0.35)'
                          : '0 0 0 2px rgba(4, 120, 87, 0.25)',
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark' ? 'rgba(52,211,153,0.1)' : 'rgba(4, 120, 87, 0.08)',
                    }
                  : {
                      '&:hover': { bgcolor: 'action.hover' },
                    }),
              }}
            >
              <ListItemButton
                selected={selected}
                onClick={() => onSelect(t.id)}
                aria-current={selected ? 'true' : undefined}
                sx={{
                  borderRadius: 2,
                  pr: 6,
                  borderLeft: 3,
                  borderLeftStyle: 'solid',
                  borderLeftColor: selected ? 'primary.main' : 'transparent',
                  py: 1.1,
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={selected ? 600 : 500} noWrap>
                      {t.title}
                    </Typography>
                  }
                  secondary={`${t.messages.length} msgs`}
                  primaryTypographyProps={{ component: 'span' }}
                  secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}
