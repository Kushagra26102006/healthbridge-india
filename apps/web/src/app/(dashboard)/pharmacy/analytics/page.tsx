'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Boxes,
  AlertTriangle,
  ClipboardCheck,
  ShoppingBag,
  Info,
} from 'lucide-react';
import {
  usePharmacyDashboardSummary,
  usePharmacyInventoryAnalytics,
  usePharmacyDispensingRecords,
  usePharmacyOrders,
} from '@/features/pharmacy/hooks/use-pharmacy';
import {
  AnalyticsBarChart,
  AnalyticsDonutChart,
  AnalyticsFilterBar,
  AnalyticsKpiCard,
  AnalyticsLineChart,
} from '@/components/analytics';
import {
  bucketTimeSeries,
  downloadAnalyticsCsv,
  filterByDateRange,
  triggerPrintableReport,
  type AnalyticsTimeframe,
} from '@/lib/analytics/export';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { useToast } from '@/components/ui/toast';
import { StaggerList, StaggerItem } from '@/components/motion/MotionPrimitives';

export default function PharmacyAnalyticsPage() {
  const { toast } = useToast();
  const { data: summary, isLoading: summaryLoading } = usePharmacyDashboardSummary();
  const { data: invAnalytics, isLoading: invLoading } = usePharmacyInventoryAnalytics();
  const { data: dispensingRes, isLoading: dispLoading } = usePharmacyDispensingRecords({
    page: 1,
    limit: 100,
  });
  const { data: ordersRes, isLoading: ordersLoading } = usePharmacyOrders({
    page: 1,
    limit: 100,
  });

  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dosageFilter, setDosageFilter] = useState('');

  const dispensingItems = useMemo(() => dispensingRes?.items ?? [], [dispensingRes]);
  const orderItems = useMemo(() => ordersRes?.items ?? [], [ordersRes]);

  const filteredDispensing = useMemo(
    () =>
      filterByDateRange(
        dispensingItems,
        (d) => d.dispensedAt || d.createdAt,
        timeframe,
        fromDate,
        toDate
      ),
    [dispensingItems, timeframe, fromDate, toDate]
  );

  const filteredOrders = useMemo(
    () => filterByDateRange(orderItems, (o) => o.createdAt, timeframe, fromDate, toDate),
    [orderItems, timeframe, fromDate, toDate]
  );

  const dispensingSeries = useMemo(
    () =>
      bucketTimeSeries(
        filteredDispensing,
        (d) => d.dispensedAt || d.createdAt,
        timeframe
      ),
    [filteredDispensing, timeframe]
  );

  const orderSeries = useMemo(
    () => bucketTimeSeries(filteredOrders, (o) => o.createdAt, timeframe),
    [filteredOrders, timeframe]
  );

  const dosageData = useMemo(() => {
    const raw = invAnalytics?.dosageFormDistribution ?? [];
    const mapped = raw.map((d) => ({
      key: d.dosageForm,
      label: d.dosageForm,
      value: d.units,
    }));
    return dosageFilter ? mapped.filter((m) => m.key === dosageFilter) : mapped;
  }, [invAnalytics, dosageFilter]);

  const stockStatusData = useMemo(() => {
    const raw = invAnalytics?.stockStatusDistribution ?? [];
    return raw.map((s) => ({
      key: s.status,
      label: s.status.replace(/_/g, ' '),
      value: s.count,
    }));
  }, [invAnalytics]);

  const dosageOptions = useMemo(() => {
    const forms = (invAnalytics?.dosageFormDistribution ?? []).map((d) => ({
      value: d.dosageForm,
      label: d.dosageForm,
    }));
    return [{ value: '', label: 'All Dosage Categories' }, ...forms];
  }, [invAnalytics]);

  const handleExportCsv = () => {
    const rows = [
      ...dosageData.map((d) => ({ section: 'Dosage Form Units', label: d.label, value: d.value })),
      ...stockStatusData.map((s) => ({ section: 'Stock Availability', label: s.label, value: s.value })),
      ...dispensingSeries.map((pt) => ({ section: 'Dispensing Trend', label: pt.label, value: pt.value })),
    ];
    downloadAnalyticsCsv({
      filename: `healthbridge-pharmacy-analytics-${new Date().toISOString().slice(0, 10)}.csv`,
      columns: [
        { header: 'Category', accessor: (r) => r.section },
        { header: 'Label / Period', accessor: (r) => r.label },
        { header: 'Count / Units', accessor: (r) => r.value },
      ],
      rows,
    });
    toast({
      variant: 'success',
      title: 'Pharmacy analytics exported',
      description: `Exported ${rows.length} filtered inventory and dispensing metrics.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge variant="teal" size="sm">
            Live Inventory &amp; Dispensing Ledger
          </Badge>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-secondary" aria-hidden="true" />
          <span>Pharmacy Inventory &amp; Dispensing Analytics</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Real stock distribution, medicine category breakdown, low-stock alerts, dispensing volume, and order history (zero fabricated revenue figures).
        </p>
      </div>

      <AnalyticsFilterBar
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        categoryLabel="Medicine category"
        categoryValue={dosageFilter}
        categoryOptions={dosageOptions}
        onCategoryChange={setDosageFilter}
        onReset={() => {
          setTimeframe('all');
          setFromDate('');
          setToDate('');
          setDosageFilter('');
        }}
        onExportCsv={handleExportCsv}
        onPrintReport={() => triggerPrintableReport()}
      />

      <StaggerList inView={false} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <AnalyticsKpiCard
            label="Total Medicines Catalogued"
            value={summary?.metrics?.totalActiveMedicines ?? 0}
            helperText="Active pharmacy inventory items"
            icon={Boxes}
            tone="primary"
            loading={summaryLoading}
          />
        </StaggerItem>
        <StaggerItem>
          <AnalyticsKpiCard
            label="Low Stock / Out of Stock"
            value={
              (summary?.metrics?.lowStockMedicines ?? 0) +
              (summary?.metrics?.outOfStockMedicines ?? 0)
            }
            helperText={`${summary?.metrics?.expiringMedicines ?? 0} batches expiring soon`}
            icon={AlertTriangle}
            tone={(summary?.metrics?.lowStockMedicines ?? 0) > 0 ? 'warning' : 'success'}
            loading={summaryLoading}
          />
        </StaggerItem>
        <StaggerItem>
          <AnalyticsKpiCard
            label="Dispensing Records (Filtered)"
            value={filteredDispensing.length}
            helperText="Verified prescription dispensations"
            icon={ClipboardCheck}
            tone="secondary"
            loading={dispLoading}
          />
        </StaggerItem>
        <StaggerItem>
          <AnalyticsKpiCard
            label="Patient Orders (Filtered)"
            value={filteredOrders.length}
            helperText="Across selected timeframe"
            icon={ShoppingBag}
            tone="info"
            loading={ordersLoading}
          />
        </StaggerItem>
      </StaggerList>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsDonutChart
          title="Inventory Distribution by Dosage Form"
          description="Available stock units categorized by medicine dosage form"
          centerLabel="Units"
          unit="units"
          data={dosageData}
          loading={invLoading}
        />

        <AnalyticsBarChart
          title="Stock Availability & Alert Distribution"
          description="Live batch counts by availability and expiry/quarantine status"
          orientation="horizontal"
          data={stockStatusData}
          loading={invLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsLineChart
          title="Dispensing History Trend"
          description="Chronological dispensing records from your pharmacy ledger"
          seriesLabel="Dispensations"
          colorVar="hsl(var(--chart-2))"
          data={dispensingSeries}
          loading={dispLoading}
          emptyTitle="No dispensing records in selected timeframe"
        />

        <AnalyticsLineChart
          title="Order Volume Trend"
          description="Chronological pharmacy order activity within selected date range"
          seriesLabel="Orders"
          colorVar="hsl(var(--chart-1))"
          data={orderSeries}
          loading={ordersLoading}
          emptyTitle="No pharmacy orders in selected timeframe"
        />
      </div>

      <Alert variant="info" title="Financial Valuation Note">
        <div className="flex items-start gap-2 text-xs">
          <Info className="h-4 w-4 shrink-0 mt-0.5 hidden sm:block" aria-hidden="true" />
          <span>
            Inventory analytics strictly reflect verified batch stock quantities and dispensing records from your pharmacy ledger. Unrecorded retail sales or revenue figures are never estimated or fabricated.
          </span>
        </div>
      </Alert>
    </div>
  );
}
