import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Autocomplete,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import {
  AddCircle as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import axiosClient from "./util/axiosClient";
import type { DDProduct } from "./interface/DDProduct";
import type { OrderLineItem } from "./interface/OrderLineItem";
import type { Customer } from "./interface/Customer";
import ConfirmDialog from "./util/ConfrimDialog";

interface OrdersDialogProps {
  open: boolean;
  onClose: () => void;
  initialData?: any;
  onSave: (payload: any) => void;
}

const OrdersDialog: React.FC<OrdersDialogProps> = ({
  open,
  onClose,
  initialData,
  onSave,
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<DDProduct[]>([]);
  const [isPaid, setIsPaid] = useState<boolean>(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [selectedProduct, setSelectedProduct] = useState<DDProduct | null>(
    null,
  );
  const [qty, setQty] = useState<number>(1);
  const [orderLines, setOrderLines] = useState<OrderLineItem[]>([]);

  // --- Data Loading ---
  const fetchMetadata = useCallback(async () => {
    try {
      const [resCust, resProd] = await Promise.all([
        axiosClient.get("customers"),
        axiosClient.get("product/dd"),
      ]);

      const custData = resCust.data;
      const prodData = resProd.data.products || resProd.data;

      setCustomers(custData);
      setProducts(Array.isArray(prodData) ? prodData : []);

      // If Editing: Sync selected customer from the freshly loaded list
      if (initialData?.customerId) {
        const found = custData.find(
          (c: Customer) => c.id === initialData.customerId,
        );
        if (found) setSelectedCustomer(found);
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
    }
  }, [initialData]);

  const fetchOrderedItems = async () => {
    try {
      const response = await axiosClient.get(`order/${initialData.orderId}`);
      setOrderLines(response.data.items);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
    }
  };

  useEffect(() => {
    if (open) {
      fetchMetadata();
      setIsPaid(initialData?.status === 1);
      if (initialData) {
        fetchOrderedItems();
      } else {
        // Mode: Create - Reset everything
        setOrderLines([]);
        setSelectedCustomer(null);
      }
      setSelectedProduct(null);
      setQty(1);
    }
  }, [open, initialData, fetchMetadata]);

  // --- Actions ---
  const handleProductChange = (event: SelectChangeEvent<number>) => {
    const prodId = event.target.value as number;
    const prod = products.find((p) => p.id === prodId);
    setSelectedProduct(prod || null);
  };

  const addLineItem = () => {
    if (!selectedProduct || qty <= 0) return;
    if (Number(qty) > selectedProduct.quantity) 
      {
        setConfirmOpen(true);
        return;
      }
    const newItem: OrderLineItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: Number(qty),
      sellingPrice: selectedProduct.sellingPrice,
      subtotal: Number(qty) * selectedProduct.sellingPrice,
    };

    setOrderLines((prev) => [...prev, newItem]);
    setSelectedProduct(null);
    setQty(1);
  };

  const updateLineQuantity = (index: number, newQty: number) => {
    setOrderLines((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity: newQty, subtotal: newQty * item.sellingPrice }
          : item,
      ),
    );
  };

  const removeLineItem = (index: number) => {
    setOrderLines((prev) => prev.filter((_, i) => i !== index));
  };

  var totalAmount = 0.0;

  const handleSubmit = () => {
    onSave({
      id: initialData?.id, // Sent only if editing
      customerId: selectedCustomer?.id,
      orderItems: orderLines,
      totalAmount: totalAmount,
    });
  };

  return (
    <Box>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold" }}>
          {initialData
            ? `Edit Order #${initialData.orderId}`
            : "Create New Order"}
        </DialogTitle>
        <Divider />

        <DialogContent>
          {/* Header Section */}
          <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
            <Autocomplete
              options={customers}
              getOptionLabel={(opt) => opt.name || ""}
              value={selectedCustomer}
              disabled={isPaid}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, val) => setSelectedCustomer(val)}
              sx={{ width: 300 }}
              renderInput={(params) => (
                <TextField {...params} label="Customer *" size="small" />
              )}
            />
            <TextField
              label="Order Date"
              type="date"
              size="small"
              disabled
              value={
                initialData?.orderDate?.split("T")[0] ||
                new Date().toISOString().split("T")[0]
              }
            />
          </Box>

          <Divider sx={{ mb: 2 }}>Order Items</Divider>

          {/* Entry Section */}
          <Box sx={{ mb: 2, display: "flex", gap: 1, alignItems: "center" }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Product</InputLabel>
              <Select
                label="Select Product"
                value={selectedProduct?.id || ""}
                onChange={handleProductChange}
              >
                {products.map((prod) => (
                  <MenuItem key={prod.id} value={prod.id}>
                    {prod.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Qty"
              type="number"
              size="small"
              sx={{ width: 100 }}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />

            <Button
              variant="contained"
              onClick={addLineItem}
              disabled={!selectedProduct && isPaid}
              startIcon={<AddIcon />}
            >
              Add
            </Button>
          </Box>

          {/* Items Table */}
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ maxHeight: 300 }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: "#f5f5f5", fontWeight: "bold" }}>
                    Product
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ bgcolor: "#f5f5f5", fontWeight: "bold" }}
                  >
                    Qty
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ bgcolor: "#f5f5f5", fontWeight: "bold" }}
                  >
                    Price
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ bgcolor: "#f5f5f5", fontWeight: "bold" }}
                  >
                    Subtotal
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ bgcolor: "#f5f5f5", fontWeight: "bold" }}
                  >
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderLines.map((item, index) => {
                  // Calculate here so we can reuse it in the cell and for logic
                  const itemSubtotal = item.quantity * item.sellingPrice;
                  totalAmount += itemSubtotal;
                  return (
                    <TableRow key={index}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          size="small"
                          variant="standard"
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineQuantity(index, Number(e.target.value))
                          }
                          slotProps={{
                            htmlInput: {
                              style: { textAlign: "right", width: "60px" },
                              min: 1,
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {item.sellingPrice.toFixed(2)}
                      </TableCell>

                      {/* COMPUTED VALUE */}
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        {itemSubtotal.toFixed(2)}
                      </TableCell>

                      <TableCell align="center">
                        <IconButton
                          color="error"
                          onClick={() => removeLineItem(index)}
                          size="small"
                          disabled={isPaid}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, textAlign: "right" }}>
            <Typography
              variant="h6"
              color="primary.main"
              sx={{ fontWeight: "bold" }}
            >
              Grand Total:{" "}
              {totalAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={(!selectedCustomer && orderLines.length === 0) || isPaid}
          >
            {initialData ? "Update Order" : "Submit Order"}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={confirmOpen}
        title="Quantiy too large"
        message={`Quantity entered is greater than the available stock (${selectedProduct?.quantity}). Please adjust accordingly.`}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
        isAlert={true}
      />
    </Box>
  );
};

export default OrdersDialog;
