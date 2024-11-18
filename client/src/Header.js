import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Avatar, 
  Container, 
  Box,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { styled } from '@mui/material/styles';
import LogoutIcon from '@mui/icons-material/Logout';
import InventoryIcon from '@mui/icons-material/Inventory';
import { FaWikipediaW } from 'react-icons/fa';
import { Inventory } from './Inventory';

const GradientAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(135deg, #002a5a 0%, #3366cc 100%)',
  boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
}));

const HeaderWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 0),
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

const UserAvatarButton = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1),
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const Header = ({ 
  wikipediaUsername, 
  setWikipediaUsername,
  handleLogout, 
  handleEditProfile,
  handleWikipediaSignIn,
  LoginForm,
  userInventory,
  removeFromInventory
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [showInventory, setShowInventory] = useState(false);

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleShowInventory = () => {
    setShowInventory(true);
    handleUserMenuClose();
  };

  const handleLogoutClick = () => {
    handleLogout();
    handleUserMenuClose();
  };

  return (
    <>
      <GradientAppBar position="static">
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <HeaderWrapper width="100%">
              <LogoContainer>
                <FaWikipediaW 
                  style={{ 
                    fontSize: '2.5rem', 
                    color: 'white',
                    opacity: 0.8 
                  }} 
                />
                <Typography 
                  variant="h4" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 700, 
                    letterSpacing: '-0.5px',
                    color: 'white',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                  }}
                >
                  MissingPedia
                </Typography>
              </LogoContainer>

              {!wikipediaUsername ? (
                <LoginForm 
                  wikipediaUsername={wikipediaUsername}
                  setWikipediaUsername={setWikipediaUsername}
                  handleWikipediaSignIn={handleWikipediaSignIn}
                />
              ) : (
                <UserAvatarButton 
                  onClick={handleUserMenuOpen}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2 
                  }}
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: 'secondary.main',
                      width: 40,
                      height: 40,
                      boxShadow: '0 3px 6px rgba(0,0,0,0.2)'
                    }}
                  >
                    {wikipediaUsername[0].toUpperCase()}
                  </Avatar>
                  
                  <Typography 
                    variant="body1" 
                    color="inherit" 
                    sx={{ 
                      fontWeight: 600,
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    {wikipediaUsername}
                  </Typography>
                </UserAvatarButton>
              )}
            </HeaderWrapper>
          </Toolbar>
        </Container>
      </GradientAppBar>

      {/* User Menu Popover */}
      <Popover
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <List>
          <StyledListItem onClick={handleShowInventory}>
            <ListItemIcon>
              <InventoryIcon />
            </ListItemIcon>
            <ListItemText primary="Article Watchlist" />
          </StyledListItem>
          <StyledListItem onClick={handleLogoutClick}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </StyledListItem>
        </List>
      </Popover>

      {/* Inventory Modal */}
      {showInventory && (
        <Inventory 
          inventory={userInventory} 
          onRemoveFromInventory={removeFromInventory}
          onClose={() => setShowInventory(false)}
        />
      )}
    </>
  );
};

export default Header;