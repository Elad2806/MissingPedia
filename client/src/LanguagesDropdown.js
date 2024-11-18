import React, { useState } from 'react';
import { 
  Typography, 
  Link, 
  Popover, 
  List, 
  ListItem, 
  ListItemText,
  Box,
  Chip,
  createTheme,
  ThemeProvider
} from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0'
    },
    background: {
      paper: '#f5f5f5'
    }
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif'
  },
  components: {
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          border: '1px solid rgba(0,0,0,0.12)',
          maxHeight: 400,
          overflowY: 'auto'
        }
      }
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.04)',
            transition: 'background-color 0.3s ease'
          }
        }
      }
    }
  }
});

const LanguagesDropdown = ({ languages }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    setIsHovering(true);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setIsHovering(false);
  };

  const handlePopoverMouseEnter = () => {
    setIsHovering(true);
  };

  const handlePopoverMouseLeave = () => {
    setIsHovering(false);
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <ThemeProvider theme={theme}>
      <Box 
        sx={{ 
          display: 'inline-block',
          position: 'relative' 
        }}
      >
        <Typography 
          variant="body2" 
          color="primary" 
          onMouseEnter={handleOpen}
          onMouseLeave={() => {
            if (!isHovering) {
              handleClose();
            }
          }}
          sx={{ 
            cursor: 'pointer', 
            textDecoration: 'underline',
            fontWeight: 'medium',
            transition: 'color 0.2s ease',
            '&:hover': { 
              color: 'primary.dark' 
            },
            display: 'inline-block'
          }}
        >
          Other Languages 
          <Chip 
            label={languages.length} 
            size="small" 
            color="primary" 
            sx={{ 
              ml: 1, 
              height: 20, 
              fontSize: '0.675rem' 
            }} 
          />
        </Typography>
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            onMouseEnter: handlePopoverMouseEnter,
            onMouseLeave: handlePopoverMouseLeave,
            sx: {
              maxWidth: 350,
              maxHeight: 400,
              overflow: 'auto',
              p: 1
            }
          }}
        >
          <List 
            dense 
            sx={{ 
              maxHeight: 350, 
              overflowY: 'auto' 
            }}
          >
            {languages.map((lang, index) => (
              <ListItem 
                key={index} 
                disablePadding
                sx={{ 
                  my: 0.5,
                  borderRadius: 1 
                }}
              >
                <ListItemText
                  primary={
                    <Link
                      href={`https://${lang.language}.wikipedia.org/wiki/${lang.title.replace(/ /g, '_')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="primary"
                      underline="hover"
                      sx={{ 
                        fontWeight: 'medium',
                        transition: 'color 0.2s ease'
                      }}
                    >
                      {lang.language}: {lang.title}
                    </Link>
                  }
                  secondary={
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mt: 0.5 
                      }}
                    >
                      <Chip 
                        label={`Length: ${lang.length}`} 
                        size="small" 
                        variant="outlined" 
                        color="secondary"
                        sx={{ 
                          mr: 1, 
                          height: 20, 
                          fontSize: '0.625rem' 
                        }} 
                      />
                      <Chip 
                        label={`Views: ${lang.views}`} 
                        size="small" 
                        variant="outlined" 
                        color="secondary"
                        sx={{ 
                          height: 20, 
                          fontSize: '0.625rem' 
                        }} 
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Popover>
      </Box>
    </ThemeProvider>
  );
};

export default LanguagesDropdown;