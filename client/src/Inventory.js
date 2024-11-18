import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Typography, 
  IconButton, 
  Tooltip, 
  List, 
  ListItem, 
  ListItemText, 
  Button, 
  Box 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAlert } from './AlertProvider'; // Import the new hook

export const Inventory = ({ 
  inventory, 
  onRemoveFromInventory, 
  onClose 
}) => {
  const showAlert = useAlert();

  const handleRemoveArticle = (articleToRemove) => {
    // Call the remove function
    onRemoveFromInventory(articleToRemove);
    
    // Show success alert
    showAlert(`Article "${articleToRemove.source_title}" removed from inventory`);
  };

  const tooltipContent = (
    <Typography 
      variant="body2" 
      sx={{
        fontSize: '0.8rem',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
      }}
    >
      In MissingPedia, your watchlist syncs with Wikipedia's watchlist, 
      available <a href="https://en.wikipedia.org/wiki/Special:Watchlist" target="_blank" rel="noopener noreferrer" style={{ color: '#4fc3f7', textDecoration: 'underline' }}>here</a>. 
      Use it to monitor updates to your tracked articles.
    </Typography>
  );

  if (!inventory || inventory.length === 0) {
    return (
      <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Your Article Watchlist
          <Tooltip
            title={tooltipContent}
            placement="top"
          >
            <IconButton
              aria-label="help"
              sx={{
                ml: 1,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
            Your inventory is empty.
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Your Article Watchlist
        <Tooltip
          title={tooltipContent}
          placement="top"
        >
          <IconButton
            aria-label="help"
            sx={{
              ml: 1,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <HelpOutlineIcon />
          </IconButton>
        </Tooltip>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <List>
          {inventory.map((article, index) => (
            <ListItem 
              key={article}
              secondaryAction={
                <IconButton 
                  edge="end" 
                  aria-label="delete"
                  onClick={() => handleRemoveArticle({'source_title': article})}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText 
                primary={article}
                primaryTypographyProps={{ 
                  variant: 'body1',
                  sx: { fontWeight: 500 }
                }}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          p: 2 
        }}
      >
        <Button 
          onClick={onClose} 
          color="primary" 
          variant="contained"
        >
          Close Inventory
        </Button>
      </Box>
    </Dialog>
  );
};

export default Inventory;
