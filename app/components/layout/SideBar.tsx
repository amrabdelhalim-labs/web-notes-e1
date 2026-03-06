'use client';

/**
 * SideBar — navigation drawer.
 *
 * Shows links to Notes and Profile.
 * Responsive: permanent on desktop (md+), temporary on mobile.
 */

import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import NotesIcon from '@mui/icons-material/StickyNote2';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';

export const DRAWER_WIDTH = 240;

interface SideBarProps {
  open: boolean;
  onClose: () => void;
}

export default function SideBar({ open, onClose }: SideBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const navigate = (path: string) => {
    router.push(path);
    onClose();
  };

  const items = [
    { label: 'الملاحظات', icon: <NotesIcon />, path: '/notes' },
    { label: 'الملف الشخصي', icon: <PersonIcon />, path: '/profile' },
  ];

  const activeItemSx = {
    mx: 1,
    mb: 0.5,
    borderRadius: 2,
    transition: 'background-color 0.2s',
    '&.Mui-selected': {
      bgcolor: 'primary.main',
      color: 'primary.contrastText',
      '& .MuiListItemIcon-root': {
        color: 'primary.contrastText',
      },
      '&:hover': {
        bgcolor: 'primary.dark',
      },
    },
    '&:not(.Mui-selected):hover': {
      bgcolor: 'action.hover',
      borderRadius: 2,
    },
  } as const;

  const drawerContent = (
    <>
      <Toolbar /> {/* spacer for AppBar height */}
      <List sx={{ pt: 1 }}>
        {items.map((item) => (
          <ListItemButton
            key={item.path}
            selected={pathname.startsWith(item.path)}
            onClick={() => navigate(item.path)}
            sx={activeItemSx}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ mx: 2 }} />
      <List sx={{ mt: 'auto' }}>
        <ListItemButton
          onClick={() => {
            logout();
            router.push('/login');
          }}
          sx={{
            mx: 1,
            borderRadius: 2,
            color: 'error.main',
            '& .MuiListItemIcon-root': { color: 'error.main' },
            '&:hover': {
              bgcolor: 'error.main',
              color: 'error.contrastText',
              '& .MuiListItemIcon-root': { color: 'error.contrastText' },
            },
            transition: 'background-color 0.2s, color 0.2s',
          }}
        >
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText primary="تسجيل الخروج" />
        </ListItemButton>
      </List>
    </>
  );

  return (
    <>
      {/* Mobile drawer — anchor="left" يتحول تلقائياً لليمين في theme RTL */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, display: 'flex', flexDirection: 'column' },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer — permanent, anchor="left" يتحول لليمين في RTL theme */}
      <Drawer
        variant="permanent"
        anchor="left"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
