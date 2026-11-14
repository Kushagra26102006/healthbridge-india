'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { PharmacyPrescriptionQueueItemDto } from '@healthbridge/shared-types';
import {
  Search,
  FileText,
  User,
  Stethoscope,
  Calendar,
  Clock,
  Eye,
  CheckCircle2,
  Pill,
} from 'lucide-react';

interface PrescriptionQueueTableProps {
  items: PharmacyPrescriptionQueueItemDto[];
  isLoading?: boolean;
  onSelectPrescription: (item: PharmacyPrescriptionQueueItemDto) => void;
}

export const PrescriptionQueueTable: React.FC<PrescriptionQueueTableProps> = ({
  items,
  isLoading = false,
  onSelectPrescription,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesRx = item.prescriptionNumber.toLowerCase().includes(query);
        const matchesPatient = item.patientName.toLowerCase().includes(query);
        const matchesDoctor = item.doctorName.toLowerCase().includes(query);
        if (!matchesRx && !matchesPatient && !matchesDoctor) {
          return false;
        }
      }
      return true;
    });
  }, [items, statusFilter, searchTerm]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Active
          </span>
        );
      case 'COMPLETED':
      case 'DISPENSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Completed
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <Clock className="w-3.5 h-3.5 text-rose-600" />
            Expired
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Search & Filter Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Rx number, patient or doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-400"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-medium">
          {(
            [
              { label: 'All Prescriptions', value: 'ALL' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Completed', value: 'COMPLETED' },
              { label: 'Expired', value: 'EXPIRED' },
            ] as const
          ).map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                Prescription Ref
              </th>
              <th scope="col" className="px-4 py-3.5">
                Patient Info
              </th>
              <th scope="col" className="px-4 py-3.5">
                Prescribing Doctor
              </th>
              <th scope="col" className="px-4 py-3.5">
                Issue / Valid Until
              </th>
              <th scope="col" className="px-4 py-3.5 text-center">
                Items
              </th>
              <th scope="col" className="px-4 py-3.5 text-center">
                Status
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-5 py-4">
                    <div className="h-4 bg-slate-200 rounded w-28 mb-1"></div>
                    <div className="h-3 bg-slate-100 rounded w-16"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                    <div className="h-3 bg-slate-100 rounded w-20"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                    <div className="h-3 bg-slate-100 rounded w-24"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-slate-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-slate-100 rounded w-20"></div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="h-4 bg-slate-200 rounded w-8 mx-auto"></div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="h-6 bg-slate-200 rounded-full w-20 mx-auto"></div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="h-8 bg-slate-200 rounded w-24 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : filteredItems.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={7} className="px-6 py-14 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-semibold text-slate-800 mb-1">
                      No Prescriptions In Queue
                    </h4>
                    <p className="text-xs text-slate-500">
                      {searchTerm || statusFilter !== 'ALL'
                        ? 'No prescriptions match your search criteria.'
                        : 'There are currently no active prescriptions awaiting fulfillment.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  {/* Prescription Ref */}
                  <td className="px-5 py-3.5">
                    <div className="font-mono font-medium text-slate-900">
                      {item.prescriptionNumber}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <FileText className="w-3 h-3" />
                      <span>ABDM E-Rx</span>
                    </div>
                  </td>

                  {/* Patient Info */}
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.patientName}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.patientAge ? `${item.patientAge}y` : ''}
                      {item.patientGender ? ` • ${item.patientGender}` : ''}
                      {item.patientPhone ? ` • ${item.patientPhone}` : ''}
                    </div>
                  </td>

                  {/* Prescriber */}
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-slate-900 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                      <span>{item.doctorName}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.doctorSpecialization || 'Registered Medical Practitioner'}
                    </div>
                  </td>

                  {/* Issue Date & Validity */}
                  <td className="px-4 py-3.5 text-xs">
                    <div className="flex items-center gap-1 text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Issued: {formatDate(item.issueDate)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Valid: {formatDate(item.validUntil)}</span>
                    </div>
                  </td>

                  {/* Items Count */}
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
                      <Pill className="w-3 h-3 text-slate-500" />
                      {item.itemCount || item.medications?.length || 0}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 text-center">
                    {getStatusBadge(item.status)}
                  </td>

                  {/* Action */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectPrescription(item)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                      <Link
                        href={`/pharmacy/dispensing?prescriptionId=${item.id}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                      >
                        <Pill className="w-3.5 h-3.5" />
                        Dispense
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count indicator */}
      {!isLoading && filteredItems.length > 0 && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Showing <strong className="text-slate-700">{filteredItems.length}</strong> of{' '}
            <strong className="text-slate-700">{items.length}</strong> prescriptions
          </span>
          <span className="text-[11px] text-slate-400">
            Protected by ABDM Consent Framework & Data Minimization
          </span>
        </div>
      )}
    </div>
  );
};
