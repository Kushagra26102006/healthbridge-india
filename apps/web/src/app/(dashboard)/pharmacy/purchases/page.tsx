'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileSpreadsheet, PlusCircle, RefreshCw } from 'lucide-react';
import {
  usePurchaseOrders,
  useApprovePurchaseOrder,
  useSendPurchaseOrder,
  useProcurementMetrics,
} from '@/features/pharmacy/hooks/use-pharmacy';
import {
  PurchaseOrderTable,
  ProcurementSummaryCards,
  PurchaseApprovalPanel,
} from '@/components/pharmacy';
import { Button } from '@/components/ui/button';
import type { PurchaseOrderDto, PurchaseOrderFilterDto } from '@healthbridge/shared-types';

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<PurchaseOrderFilterDto>({
    page: 1,
    limit: 10,
    search: '',
    status: 'ALL',
  });

  const [approvalOrder, setApprovalOrder] = useState<PurchaseOrderDto | null>(null);
  const [isApprovalPanelOpen, setIsApprovalPanelOpen] = useState(false);

  const { data: metrics, isLoading: isMetricsLoading, refetch: refetchMetrics } =
    useProcurementMetrics();
  const { data: response, isLoading, refetch } = usePurchaseOrders(filters);
  const approveMutation = useApprovePurchaseOrder();
  const sendMutation = useSendPurchaseOrder();

  const handleRefresh = () => {
    refetch();
    refetchMetrics();
  };

  const handleViewOrder = (order: PurchaseOrderDto) => {
    router.push(`/pharmacy/purchases/${order.id}`);
  };

  const handleReceiveGoods = (order: PurchaseOrderDto) => {
    router.push(`/pharmacy/purchases/${order.id}/receive`);
  };

  const handleApproveOrder = (order: PurchaseOrderDto) => {
    setApprovalOrder(order);
    setIsApprovalPanelOpen(true);
  };

  const handleSendOrder = async (order: PurchaseOrderDto) => {
    await sendMutation.mutateAsync(order.id);
    refetch();
  };

  const handleAddNew = () => {
    router.push('/pharmacy/purchases/new');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            Purchase Orders & Procurement
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create, approve, and dispatch medication purchase orders, manage goods receiving notes (GRN), and reconcile invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-1.5 h-9"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>

          <Button
            onClick={handleAddNew}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 h-9"
          >
            <PlusCircle className="w-4 h-4" />
            Create Purchase Order
          </Button>
        </div>
      </div>

      {/* Procurement Summary Cards */}
      <ProcurementSummaryCards metrics={metrics} isLoading={isMetricsLoading} />

      {/* Orders Table */}
      <PurchaseOrderTable
        orders={response?.data || []}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={setFilters}
        onViewOrder={handleViewOrder}
        onReceiveGoods={handleReceiveGoods}
        onApproveOrder={handleApproveOrder}
        onSendOrder={handleSendOrder}
        onAddNew={handleAddNew}
        totalPages={response?.meta?.totalPages || 1}
        totalCount={response?.meta?.total || 0}
      />

      {/* Approval Panel */}
      <PurchaseApprovalPanel
        order={approvalOrder}
        isOpen={isApprovalPanelOpen}
        onClose={() => setIsApprovalPanelOpen(false)}
        onApprove={async (id, comments) => {
          await approveMutation.mutateAsync({ id, dto: { comments } });
          refetch();
        }}
        onReject={async () => {
          refetch();
        }}
      />
    </div>
  );
}
