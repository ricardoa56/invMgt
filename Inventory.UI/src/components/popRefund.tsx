import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from "@mui/material";
import axiosClient from "./util/axiosClient";

interface RefundDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: number;
  onSuccess: () => void;
}

const RefundDialog: React.FC<RefundDialogProps> = ({
  open,
  onClose,
  orderId,
  onSuccess,
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [refundRows, setRefundRows] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState<string>("");
  const [orderDate, setOrderDate] = useState<string>("");

  useEffect(() => {
    if (open) {
      axiosClient.get(`order/${orderId}`).then((res) => {
        const originalSales = res.data.items;
        setItems(originalSales);
        setOrderDate(res.data.orderDate.split("T")[0]);
        setCustomerName(res.data.customerName || "N/A");
        setRefundRows(
          originalSales.map((i: any) => ({
            productId: i.productId,
            quantity: 0,
            remarks: "",
          }))
        );
      });
    }
  }, [open, orderId]);

  const handleQtyChange = (index: number, val: number) => {
    const item = items[index];
    // Remaining = Total bought - Already Refunded in DB
    const maxAllowed = item.quantity; 
    const updated = [...refundRows];

    // Clamp value between 0 and the remaining available quantity
    if (val > maxAllowed) {
        updated[index].quantity = maxAllowed;
    } else if (val < 0) {
        updated[index].quantity = 0;
    } else {
        updated[index].quantity = val;
    }

    setRefundRows(updated);
  };

  const handleRemarkChange = (index: number, val: string) => {
    const updated = [...refundRows];
    updated[index].remarks = val;
    setRefundRows(updated);
  };

  const handleConfirmRefund = async () => {
    const itemsToRefund = refundRows.filter((r) => r.quantity > 0);
    if (itemsToRefund.length === 0) return;

    const payload = {
      orderId: orderId,
      items: itemsToRefund,
    };

    try {
      await axiosClient.post("order/refund", payload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Refund failed:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold", color: "error.main" }}>
        Process Refund for Order #{orderId}
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
          <TextField
            label="Customer"
            variant="outlined"
            size="small"
            fullWidth
            value={customerName}
            disabled
            slotProps={{ input: { readOnly: true } }}
          />

          <TextField
            label="Order Date"
            type="date"
            size="small"
            disabled
            value={orderDate || ""}
          />
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: "bold" }}>Product</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>Bought</TableCell>
                {/* NEW COLUMN */}
                <TableCell align="right" sx={{ fontWeight: "bold", color: 'error.main' }}>Refunded</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>Qty to Refund</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Defect / Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => {
                const remaining = item.quantity;
                return (
                  <TableRow key={item.productId}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    {/* DISPLAY THE ALREADY REFUNDED COUNT */}
                    <TableCell align="right" sx={{ color: 'error.main' }}>
                        {item.refundedQty}
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        type="number"
                        size="small"
                        sx={{ width: 80 }}
                        disabled={remaining <= 0}
                        value={refundRows[index]?.quantity || 0}
                        onChange={(e) => handleQtyChange(index, Number(e.target.value))}
                        slotProps={{
                          htmlInput: {
                            style: { textAlign: "right" },
                            min: 0,
                            max: remaining,
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        disabled={remaining <= 0}
                        placeholder={remaining <= 0 ? "Fully Refunded" : "e.g. Broken BMS"}
                        value={refundRows[index]?.remarks || ""}
                        onChange={(e) => handleRemarkChange(index, e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirmRefund}
          disabled={
            !refundRows.some((r) => r.quantity > 0) ||
            refundRows.some((r, idx) => r.quantity > (items[idx].quantity))
          }
        >
          Confirm Defective Refund
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RefundDialog;