'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Star,
  Edit2,
  PlusCircle,
  Package,
} from 'lucide-react';
import {
  useSupplier,
  useSupplierProducts,
  useAddSupplierProduct,
  useDeleteSupplierProduct,
  usePharmacyMedicines,
} from '@/features/pharmacy/hooks/use-pharmacy';
import {
  SupplierProductTable,
} from '@/components/pharmacy';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CreateSupplierProductDto } from '@healthbridge/shared-types';

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params.id as string;

  const { data: supplier, isLoading: isSupplierLoading } =
    useSupplier(supplierId);

  const { data: productsData, isLoading: isProductsLoading, refetch: refetchProducts } =
    useSupplierProducts({ supplierId });

  const { data: medicinesData } = usePharmacyMedicines({ limit: 100 });

  const addProductMutation = useAddSupplierProduct();
  const deleteProductMutation = useDeleteSupplierProduct();

  const handleAddProduct = async (dto: CreateSupplierProductDto) => {
    await addProductMutation.mutateAsync(dto);
    refetchProducts();
  };

  const handleDeleteProduct = async (productId: string) => {
    await deleteProductMutation.mutateAsync(productId);
    refetchProducts();
  };

  if (isSupplierLoading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p>Loading supplier profile...</p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="py-24 text-center text-slate-400">
        <p>Supplier not found or you lack permission to view it.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/pharmacy/suppliers')}
          className="mt-4"
        >
          Return to Suppliers
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/pharmacy/suppliers')}
          className="gap-1.5 text-slate-500"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Suppliers
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/pharmacy/suppliers/${supplier.id}/edit`)}
            className="gap-1 text-xs"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Profile
          </Button>

          {supplier.status === 'ACTIVE' && (
            <Button
              size="sm"
              onClick={() => router.push(`/pharmacy/purchases/new?supplierId=${supplier.id}`)}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 text-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Create Purchase Order
            </Button>
          )}
        </div>
      </div>

      {/* Supplier Profile Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {supplier.name}
              </h1>
              <Badge
                className={
                  supplier.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-slate-500/10 text-slate-600 border border-slate-500/20'
                }
              >
                {supplier.status}
              </Badge>
              <Badge variant="outline">{supplier.supplierType}</Badge>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Code: {supplier.supplierCode} • {supplier.legalName || 'Registered Vendor'}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {supplier.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {supplier.phone}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {supplier.address.city},{' '}
                {supplier.address.state}
              </span>
            </div>
          </div>
        </div>

        {/* Commercial Quick Summary */}
        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 shrink-0 text-xs">
          <div>
            <span className="text-slate-400 block">Payment Terms</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Net {supplier.paymentTermsDays}d
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Avg. Lead Time</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {supplier.leadTimeDays} days
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Vendor Rating</span>
            <span className="font-bold text-amber-600 text-sm flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              {supplier.rating?.toFixed(1) || '5.0'}
            </span>
          </div>
        </div>
      </div>

      {/* Supplier Mapped Products */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Product Catalogue & Contracted Pricing
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Link medications from your medicine master to this supplier to track purchase rates and minimum order quantities.
          </p>
        </div>

        <SupplierProductTable
          products={productsData?.data || []}
          supplierId={supplier.id}
          supplierName={supplier.name}
          catalogMedicines={medicinesData?.items || []}
          isLoading={isProductsLoading}
          onAddProduct={handleAddProduct}
          onDeleteProduct={handleDeleteProduct}
        />
      </div>
    </div>
  );
}
