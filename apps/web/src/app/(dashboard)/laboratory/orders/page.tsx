'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLaboratoryOrders } from '@/features/laboratory/hooks/use-laboratory';
import {
  LabOrderStatusBadge,
} from '@/components/laboratory';
import {
  ClipboardList,
  Search,
  ArrowRight,
  Flame,
} from 'lucide-react';
import type { LabOrderPriority } from '@healthbridge/shared-types';

const STATUS_TABS = [
  { key: '', label: 'All Orders' },
  { key: 'ORDERED', label: 'New / Review Needed' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'SAMPLE_COLLECTED', label: 'Sample Collected' },
  { key: 'IN_ANALYSIS', label: 'In Analysis' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'CLARIFICATION_REQUESTED', label: 'Clarification' },
];

export default function LaboratoryOrdersQueuePage() {
  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  const { data: orders, isLoading } = useLaboratoryOrders({
    status: activeTab || undefined,
    search: search.trim() || undefined,
    priority: (priorityFilter as LabOrderPriority) || undefined,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-teal-600" />
            Laboratory Order Queue
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review incoming physician diagnostic orders, accept tests, resolve specimen criteria, and coordinate sample accessioning
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-border">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? 'bg-card text-teal-600 dark:text-teal-400 border-t-2 border-teal-500 border-x border-border shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Priority Controls */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, patient name, or ABHA address..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-muted/40 border border-border focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs rounded-xl bg-background border border-border px-3 py-2 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Priorities</option>
            <option value="ROUTINE">ROUTINE</option>
            <option value="URGENT">URGENT</option>
            <option value="STAT">STAT / EMERGENCY</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-card border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-muted-foreground">
              Loading laboratory order queue...
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <ClipboardList className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">
                No laboratory orders found matching the filter criteria.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/60">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Ordered Tests</th>
                  <th className="py-3 px-4">Ordering Physician</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-foreground block">
                        {order.patient?.name || 'Patient'}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {order.patient?.abhaAddress || order.patientId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-foreground font-medium block truncate max-w-[200px]">
                        {order.tests.map((t) => t.testName).join(', ')}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {order.tests.length} test(s)
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-foreground block font-medium">
                        {order.doctor?.name || 'Ordering Doctor'}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[150px] block">
                        {order.doctor?.facilityName || 'Clinic / Hospital'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.priority === 'STAT'
                            ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                            : order.priority === 'URGENT'
                            ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {order.priority === 'STAT' && <Flame className="w-3 h-3" />}
                        {order.priority || 'ROUTINE'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <LabOrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(order.orderedAt || order.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/laboratory/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 transition-colors"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
