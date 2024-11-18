import React from 'react';
import { 
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';

export const AlertContext = React.createContext();

export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = React.useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const showAlert = React.useCallback((message, severity = 'success') => {
    setAlertState({
      open: true,
      message,
      severity
    });
  }, []);

  const handleAlertClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlertState(prev => ({ ...prev, open: false }));
  };

  return (
    <AlertContext.Provider value={showAlert}>
      {children}
      <Snackbar
        open={alertState.open}
        autoHideDuration={3000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert 
          onClose={handleAlertClose}
          severity={alertState.severity} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {alertState.message}
        </MuiAlert>
      </Snackbar>
    </AlertContext.Provider>
  );
};

// Custom hook for easy alert usage
export const useAlert = () => {
  const context = React.useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};