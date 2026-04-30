import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Divider,
  Box,
} from "@mui/material";
import { type Customer } from "./interface/Customer";

interface CustomerDialogProps {
  open: boolean;
  onClose: () => void;
  initialData: Customer | null;
  onSave: (payload: Customer) => void;
}

const CustomerDialog: React.FC<CustomerDialogProps> = ({
  open,
  onClose,
  initialData,
  onSave,
}) => {
  const [formData, setFormData] = useState<Customer>({
    name: "",
    email: "",
    messengerId: "",
    mobileNo: "",
    address: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ name: "", email: "", messengerId: "", mobileNo: "", address: "" });
    }
  }, [initialData, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>
        {initialData ? "Edit Customer" : "New Customer"}
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          {/* Full Width Field */}
          <TextField
            label="Full Name *"
            name="name"
            fullWidth
            size="small"
            value={formData.name}
            onChange={handleChange}
          />

          <TextField
            label="Email Address"
            name="email"
            fullWidth
            size="small"
            value={formData.email || ""}
            onChange={handleChange}
          />

          {/* Side-by-Side Fields */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <TextField
              label="Mobile Number"
              name="mobileNo"
              sx={{ flex: 1 }}
              size="small"
              value={formData.mobileNo || ""}
              onChange={handleChange}
            />
            <TextField
              label="Messenger ID"
              name="messengerId"
              sx={{ flex: 1 }}
              size="small"
              value={formData.messengerId || ""}
              onChange={handleChange}
            />
          </Box>
          <TextField
            label="Address"
            name="address"
            sx={{ flex: 1 }}
            size="small"
            value={formData.address || ""}
            onChange={handleChange}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={() => onSave(formData)}
          variant="contained"
          disabled={!formData.name}
        >
          Save Customer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerDialog;
