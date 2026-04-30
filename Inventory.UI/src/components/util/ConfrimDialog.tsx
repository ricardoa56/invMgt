import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Divider } from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void; // Made optional for Alert mode
  loading?: boolean;
  isAlert?: boolean; // New prop: if true, shows only one button
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  open, 
  title = "Notification", 
  message, 
  onClose, 
  onConfirm,
  loading = false,
  isAlert = false 
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>{title}</DialogTitle>
      <Divider />
      <DialogContent sx={{ mt: 1 }}>
        <Typography variant="body1">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        
        {/* Only show Cancel if it's NOT an alert */}
        {!isAlert && (
          <Button onClick={onClose} color="inherit" disabled={loading}>
            Cancel
          </Button>
        )}

        <Button 
          onClick={isAlert ? onClose : onConfirm} 
          color={isAlert ? "primary" : "error"} 
          variant="contained" 
          autoFocus
          disabled={loading}
          sx={{ minWidth: 80 }}
        >
          {loading ? 'Processing...' : isAlert ? 'OK' : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;