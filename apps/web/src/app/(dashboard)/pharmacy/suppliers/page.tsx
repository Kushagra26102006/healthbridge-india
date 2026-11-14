'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, PlusCircle, RefreshCw } from 'lucide-react';
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useProcurementMetrics,
} from '@/features/pharmacy/hooks/use-pharmacy';
import {
  SupplierTable,
  SupplierFormModal,
  SupplierDetailsModal,
  ProcurementSummaryCards,
} from '@/components/pharmacy';
import { Button } from '@/components/ui/button';
import type { SupplierDto, SupplierFilterDto } from '@healthbridge/shared-types';

export default function SuppliersPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<SupplierFilterDto>({
    page: 1,
    limit: 10,
    search: '',
    status: 'ALL',
    supplierType: 'ALL',
  });

  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDto | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<SupplierDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: metrics, isLoading: isMetricsLoading, refetch: refetchMetrics } =
    useProcurementMetrics();
  const { data: response, isLoading, refetch } = useSuppliers(filters);
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  const handleRefresh = () => {
    refetch();
    refetchMetrics();
  };

  const handleViewSupplier = (supplier: SupplierDto) => {
    setSelectedSupplier(supplier);
    setIsDetailOpen(true);
  };

  const handleEditSupplier = (supplier: SupplierDto) => {
    setEditingSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingSupplier(null);
    setIsFormOpen(true);
  };

  const handleManageProducts = (supplier: SupplierDto) => {
    router.push(`/pharmacy/suppliers/${supplier.id}`);
  };

  const handleCreatePO = (supplier: SupplierDto) => {
    router.push(`/pharmacy/purchases/new?supplierId=${supplier.id}`);
  };

  const handleFormSubmit = async (data: any) => {
    if (editingSupplier) {
      await updateMutation.mutateAsync({ id: editingSupplier.id, dto: data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setIsFormOpen(false);
    refetch();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            Supplier Directory & Vendor Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Maintain authorized pharmaceutical distributors, contracted purchase rates, and compliance licenses.
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
            Register Supplier
          </Button>
        </div>
      </div>

      {/* Procurement Metrics */}
      <ProcurementSummaryCards metrics={metrics} isLoading={isMetricsLoading} />

      {/* Main Table */}
      <SupplierTable
        suppliers={response?.data || []}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={setFilters}
        onViewSupplier={handleViewSupplier}
        onEditSupplier={handleEditSupplier}
        onManageProducts={handleManageProducts}
        onCreatePO={handleCreatePO}
        onAddNew={handleAddNew}
        totalPages={response?.meta?.totalPages || 1}
        totalCount={response?.meta?.total || 0}
      />

      {/* Modals */}
      <SupplierFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        supplier={editingSupplier}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <SupplierDetailsModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        supplier={selectedSupplier}
        onEdit={handleEditSupplier}
        onManageProducts={handleManageProducts}
        onCreatePO={handleCreatePO}
      />
    </div>
  );
}
