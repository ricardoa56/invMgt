import React, { useState, useEffect } from "react";
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

interface OrdersDialogProps {
  open: boolean;
  onClose: () => void;
  initialData?: any;
  onSave: (payload: any) => void;
}

const OrdersDialog: React.FC<OrdersDialogProps> = ({open, onClose, initialData, onSave }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<DDProduct[]>([]);

  const [selectedProduct, setSelectedProduct] = useState<DDProduct | null>(
    null,
  );
  const [qty, setQty] = useState<number>(1);
  const [orderLines, setOrderLines] = useState<OrderLineItem[]>([]);

  useEffect(() => {
    if (open) {
      fetchMetadata();
      setOrderLines([]);
      setSelectedCustomer(null);
      setSelectedProduct(null);
      setQty(1);
    }
  }, [open]);

  const fetchMetadata = async () => {
    try {
      const responseCustomers = await axiosClient.get("customers");
      setCustomers(responseCustomers.data);

      const response = await axiosClient.get("product/dd");
      const productArray = response.data.products || response.data;
      setProducts(Array.isArray(productArray) ? productArray : []);
    } catch (error) {
      console.error("Error fetching metadata:", error);
    }
  };

  // Handle Product Selection from the Dropdown
  const handleProductChange = (event: SelectChangeEvent<number>) => {
    const prodId = event.target.value as number;
    const prod = products.find((p) => p.id === prodId);
    setSelectedProduct(prod || null);
  };

  const addLineItem = () => {
    console.log(
      "Adding line item with product:",
      selectedProduct,
      "and qty:",
      qty,
    );
    if (!selectedProduct || qty <= 0) return;

    const newItem: OrderLineItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: Number(qty),
      sellingPrice: selectedProduct.sellingPrice,
      subtotal: Number(qty) * selectedProduct.sellingPrice,
    };

    setOrderLines([...orderLines, newItem]);
    setSelectedProduct(null);
    setQty(1);
  };

  const updateLineQuantity = (index: number, newQty: number) => {
    const updatedLines = [...orderLines];
    const item = updatedLines[index];

    // Update quantity and recalculate subtotal for this row
    item.quantity = newQty;
    item.subtotal = newQty * item.sellingPrice;

    setOrderLines(updatedLines);
  };

  const removeLineItem = (index: number) => {
    setOrderLines(orderLines.filter((_, i) => i !== index));
  };

  const totalAmount = orderLines.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmit = () => {
    const payload = {
      customerId: selectedCustomer?.id,
      orderItems: orderLines,
      totalAmount: totalAmount,
    };
    onSave(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>Create New Order</DialogTitle>
      <Divider />
      <DialogContent>
        {/* HEADER AREA */}
        <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
          <Autocomplete
            options={customers}
            getOptionLabel={(opt) => opt.name || ""}
            sx={{ width: 300 }}
            onChange={(_, val) => setSelectedCustomer(val)}
            renderInput={(params) => (
              <TextField {...params} label="Select Customer *" size="small" />
            )}
          />
          <TextField
            label="Order Date"
            type="date"
            size="small"
            defaultValue={new Date().toISOString().split("T")[0]}
            disabled
          />
        </Box>

        <Divider sx={{ mb: 2 }}>Add Items</Divider>

        {/* LINE ENTRY AREA */}
        <Box sx={{ mb: 2, display: "flex", gap: 1, alignItems: "center" }}>
          <FormControl fullWidth size="small">
            <InputLabel>Product</InputLabel>
            <Select
              label="Product"
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
            disabled={!selectedProduct}
            startIcon={<AddIcon />}
          >
            Add
          </Button>
        </Box>

        {/* DRAFT TABLE */}
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
              {orderLines.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.productName}</TableCell>

                  {/* EDITABLE QUANTITY CELL */}
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
                      sx={{
                        "& .MuiInput-underline:before": { borderBottom: "none",
                        },
                        "& .MuiInput-underline:hover:not(.Mui-disabled):before":
                          { borderBottom: "1px solid rgba(0, 0, 0, 0.42)" },
                      }}
                    />
                  </TableCell>

                  <TableCell align="right">
                    {item.sellingPrice.toFixed(2)}
                  </TableCell>

                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    {item.subtotal.toFixed(2)}
                  </TableCell>

                  <TableCell align="center">
                    <IconButton
                      color="error"
                      onClick={() => removeLineItem(index)}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {orderLines.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{ py: 3, color: "text.secondary" }}
                  >
                    No items added yet.
                  </TableCell>
                </TableRow>
              )}
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
          disabled={!selectedCustomer || orderLines.length === 0}
        >
          Submit Order
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrdersDialog;
