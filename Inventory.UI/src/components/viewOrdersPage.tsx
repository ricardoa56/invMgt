import React, { useMemo, useState, useEffect } from "react";
import { Box, Button, Chip, IconButton } from "@mui/material";
import {
  Visibility as ViewIcon,
  Add as AddIcon,
  Payments as PaidIcon,
} from "@mui/icons-material";
import axiosClient from "./util/axiosClient";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import type { OrdersOnly } from "./interface/OrdersOnly";
import OrdersDialog from "./popOrders";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const ViewOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<OrdersOnly[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ordersDialogOpen, setOrdersDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const handleSave = async (data: OrdersOnly) => {
    const isUpdate = selectedOrderId && selectedOrderId > 0;
    const payload = {
      orderId: 0,
      customerId: data.customerId,
      status: data.status,
      remarks: data.remarks,
      totalAmount: data.totalAmount,
      createdBy: isUpdate
        ? data.createdBy
        : Number(localStorage.getItem("userid")),
      items: data.orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    try {
      if (isUpdate) payload.orderId = selectedOrderId;
      await axiosClient.post("order", payload);

      await fetchOrders();
      setOrdersDialogOpen(false);
    } catch (error) {
      console.error("Failed to save order:", error);
    }
  };

  const handleMarkAsPaid = async (orderId: number) => {
    try {
      // 1. Backend Call
      await axiosClient.put(`order/paid/${orderId}`);
      await fetchOrders();
    } catch (error) {
      console.error("Payment failed", error);
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await axiosClient.get("order/ordersonly"); // Adjust to your endpoint
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const columns = useMemo<MRT_ColumnDef<OrdersOnly>[]>(
    () => [
      {
        accessorKey: "orderId",
        header: "Order #",
        size: 150,
      },
      {
        accessorKey: "customerName",
        header: "Customer",
        size: 200,
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 150,
        // Using Chips for that professional color-coded look
        Cell: ({ cell }) => {
          const status = cell.getValue<number>();
          let color: "warning" | "success" | "error" | "info" = "info";
          if (status === 1) color = "warning";
          if (status === 2) color = "success";
          if (status === 3) color = "error";
          let label = "Unknown";
          if (status === 0) label = "Pending";
          if (status === 1) label = "Paid";
          if (status === 2) label = "Cancelled";
          if (status === 3) label = "Completed";
          return (
            <Chip label={label} color={color} size="small" variant="outlined" />
          );
        },
      },
      {
        accessorKey: "orderDate",
        header: "Order Date",
        size: 180,
        Cell: ({ cell }) =>
          new Date(cell.getValue<string>()).toLocaleDateString(),
      },
      {
        accessorKey: "totalAmount",
        header: "Total Amount",
        size: 150,
        Cell: ({ cell }) => (
          <Box sx={{ fontWeight: "bold" }}>
            {cell.getValue<number>().toLocaleString()}
          </Box>
        ),
      },
    ],
    [orders],
  );

  const table = useMaterialReactTable({
    columns,
    data: orders,
    enableTableFooter: true,
    state: { isLoading },
    enableRowActions: true,
    renderTopToolbarCustomActions: () => (
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => {
          setSelectedOrderId(null); // Clear any previous selection
          setOrdersDialogOpen(true); // Open the dialog for adding a new product
        }}
        sx={{
          bgcolor: "#2e7d32",
          "&:hover": { bgcolor: "#1b5e20" },
          textTransform: "none",
          fontWeight: "bold",
        }}
      >
        Add
      </Button>
    ),
    renderRowActions: ({ row }) => {
      const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
      const open = Boolean(anchorEl);

      const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
      };

      const handleCloseMenu = () => {
        setAnchorEl(null);
      };

      return (
        <Box>
          {/* Primary Action Button */}
          <Button
            startIcon={<ViewIcon />}
            size="small"
            onClick={() => {
              setSelectedOrderId(row.original.orderId);
              setOrdersDialogOpen(true);
            }}
            sx={{ textTransform: "none" }}
          >
            View
          </Button>

          {/* The "More" Trigger (Dropdown) */}
          <IconButton size="small" onClick={handleOpenMenu}>
            <MoreVertIcon fontSize="small" />
          </IconButton>

          {/* The Dropdown Menu */}
          <Menu anchorEl={anchorEl} open={open} onClose={handleCloseMenu}>
            <MenuItem
              onClick={() => {
                handleMarkAsPaid(row.original.orderId);
                handleCloseMenu();
              }}
              disabled={row.original.status === 1} // Logic check
              sx={{ color: "success.main", gap: 1 }}
            >
              <PaidIcon fontSize="small" />
              Mark as Paid
            </MenuItem>

            {/* You can easily add "Delete" or "Print" here later without crowding the row */}
          </Menu>
        </Box>
      );
    },
    initialState: {
      density: "compact",
      pagination: { pageSize: 15, pageIndex: 0 },
    },
    // Reusing your clean styling
    muiTablePaperProps: {
      elevation: 0,
      sx: { borderRadius: "8px", border: "1px solid #e0e0e0" },
    },
    muiTableHeadCellProps: {
      sx: { backgroundColor: "#f5f5f5", fontWeight: "bold" },
    },
  });

  return (
    <Box sx={{ p: 4 }}>
      <MaterialReactTable table={table} />
      <OrdersDialog
        open={ordersDialogOpen}
        onClose={() => setOrdersDialogOpen(false)}
        initialData={orders.find((o) => o.orderId === selectedOrderId) || null}
        onSave={handleSave}
      />
    </Box>
  );
};

export default ViewOrdersPage;
