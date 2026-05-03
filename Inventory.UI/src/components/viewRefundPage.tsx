import React, { useMemo, useState, useEffect } from "react";
import { Box, Button } from "@mui/material";
import { Undo as RefundIcon } from "@mui/icons-material";
import axiosClient from "./util/axiosClient";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import type { OrdersOnly } from "./interface/OrdersOnly";
import RefundDialog from "./popRefund"; // The new dialog we'll define below

const ViewRefundsPage: React.FC = () => {
  const [orders, setOrders] = useState<OrdersOnly[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrdersOnly | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await axiosClient.get("order/ordersonly");
      // Only "Paid" orders are eligible for refunds
      setOrders(response.data.filter((o: OrdersOnly) => o.status === 1));
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
      { accessorKey: "orderId", header: "Order #", size: 100 },
      { accessorKey: "customerName", header: "Customer", size: 200 },
      {
        accessorKey: "orderDate",
        header: "Order Date",
        Cell: ({ cell }) =>
          new Date(cell.getValue<string>()).toLocaleDateString(),
      },
      {
        accessorKey: "totalAmount",
        header: "Total Paid",
        Cell: ({ cell }) => <b>{cell.getValue<number>().toLocaleString()}</b>,
      },
    ],
    [],
  );

  const table = useMaterialReactTable({
    columns,
    data: orders,
    state: { isLoading },
    enableRowActions: true,
    renderRowActions: ({ row }) => (
      <Button
        startIcon={<RefundIcon />}
        color="error"
        variant="outlined"
        size="small"
        onClick={() => {
          setSelectedOrder(row.original);
          setRefundDialogOpen(true);
        }}
      >
        View
      </Button>
    ),
  });

  return (
    <Box sx={{ p: 4 }}>
      <MaterialReactTable table={table} />
      {selectedOrder && (
        <RefundDialog
          open={refundDialogOpen}
          onClose={() => setRefundDialogOpen(false)}
          orderId={selectedOrder.orderId}
          onSuccess={fetchOrders}
        />
      )}
    </Box>
  );
};

export default ViewRefundsPage;
