import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Autocomplete,
  Alert,
} from "@mui/material";
import axiosClient from "./util/axiosClient";
import type { DDProduct } from "./interface/DDProduct";

interface StatusMessage {
  type: "success" | "error";
  msg: string;
}

const StockAdjustmentPage = () => {
  const [products, setProducts] = useState<DDProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<DDProduct | null>(
    null,
  );
  const [quantity, setQuantity] = useState("");
  const [reference, setReference] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState<StatusMessage | null>(null);

  const fetchProducts = async () => {
    try {
      const response = await axiosClient.get("product/dd");
      const productArray = response.data.products || response.data;
      setProducts(Array.isArray(productArray) ? productArray : []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSave = async () => {
    const payload = {
      productId: selectedProduct?.id,
      quantity: parseFloat(quantity),
      referenceNumber: reference,
      remarks: remarks,
      createdBy: Number(localStorage.getItem("userid")),
    };
    try {
      await axiosClient.post("inventory/stock-adjustment", payload);
      setStatus({ type: "success", msg: "Stock updated successfully!" });
      // Reset form fields
      setSelectedProduct(null);
      setQuantity("");
      setReference("");
      setRemarks("");
    } catch (err) {
      setStatus({ type: "error", msg: "Error saving transaction." });
    }
  };

  return (
    <Box
      sx={{
        p: 4,
        maxWidth: 700,
        mx: "auto",
      }}
    >
      {status && (
        <Alert severity={status.type} sx={{ mb: 2 }}>
          {status.msg}
        </Alert>
      )}

      <Paper sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        <Autocomplete
          options={products}
          getOptionLabel={(option) => option.name}
          value={selectedProduct}
          onChange={(_, val) => setSelectedProduct(val)}
          renderInput={(params) => (
            <TextField {...params} label="Select Product" required />
          )}
        />
        <TextField
          label="Current Stock on Hand"
          value={selectedProduct ? selectedProduct.quantity : "0"}
          variant="filled"
          slotProps={{
            htmlInput: { readOnly: true },
          }}
          sx={{ backgroundColor: "#f5f5f5" }} // Gray it out slightly
        />
        <TextField
          label="Quantity to Adjust"
          type="number"
          value={quantity}
          required
          onChange={(e) => setQuantity(e.target.value)}
          slotProps={{
            htmlInput: {
              min: 0,
              step: 0.01,
            },
          }}
        />

        <TextField
          label="Reference Number"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />

        <TextField
          label="Adjustment Reason / Remarks"
          multiline
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          required // Adds the asterisk
          error={remarks.trim() === "" && status?.type === "error"} // Highlights red if empty on fail
          helperText={
            remarks.trim() === ""
              ? "Please provide a reason for this adjustment"
              : ""
          }
        />

        <Button variant="contained" size="large" onClick={handleSave}>
          Confirm
        </Button>
      </Paper>
    </Box>
  );
};

export default StockAdjustmentPage;
