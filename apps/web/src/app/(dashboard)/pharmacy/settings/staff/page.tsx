'use client';

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Ban,
  Trash2,
  Edit2,
  Mail,
  X,
  RefreshCw,
  Check,
} from 'lucide-react';
import {
  usePharmacyStaffList,
  useInvitePharmacyStaff,
  useUpdatePharmacyStaffMember,
  useSuspendPharmacyStaff,
  useReactivatePharmacyStaff,
  useRevokePharmacyStaff,
} from '@/features/pharmacy/hooks/use-pharmacy';
import { PharmacySettingsNav } from '@/components/pharmacy/settings/PharmacySettingsNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type {
  PharmacyStaffDto,
  PharmacyStaffRole,
  PharmacyPermission,
  PharmacyStaffStatus,
} from '@healthbridge/shared-types';

const ALL_ROLES: PharmacyStaffRole[] = [
  'PHARMACY_OWNER',
  'PHARMACY_MANAGER',
  'PHARMACIST',
  'INVENTORY_STAFF',
  'PROCUREMENT_STAFF',
  'ORDER_STAFF',
];

const ALL_PERMISSIONS: { key: PharmacyPermission; label: string; desc: string }[] = [
  { key: 'VIEW_DASHBOARD', label: 'View Dashboard', desc: 'Read dispensary metrics and summary activity' },
  { key: 'MANAGE_INVENTORY', label: 'Manage Inventory', desc: 'Add batches, adjust stock, handle quarantine' },
  { key: 'VERIFY_PRESCRIPTIONS', label: 'Verify Prescriptions', desc: 'Review e-prescriptions & match items' },
  { key: 'DISPENSE_MEDICINES', label: 'Dispense Medicines', desc: 'Complete full & partial medicine dispensing' },
  { key: 'MANAGE_PROCUREMENT', label: 'Manage Procurement', desc: 'Requisitions, suppliers, POs, and GRNs' },
  { key: 'MANAGE_ORDERS', label: 'Manage Orders', desc: 'Process patient orders and pickup handovers' },
  { key: 'VIEW_REPORTS', label: 'View Reports', desc: 'Access financial, ledger, and expiry analytics' },
  { key: 'MANAGE_STAFF', label: 'Manage Staff', desc: 'Invite staff members and configure access roles' },
  { key: 'MANAGE_SETTINGS', label: 'Manage Settings', desc: 'Configure store hours, profiles and services' },
  { key: 'VIEW_AUDIT_LOGS', label: 'View Audit Logs', desc: 'Inspect security and transaction audit trail' },
];

export default function PharmacyStaffPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data: staffData, isLoading, refetch } = usePharmacyStaffList({
    search: search || undefined,
    role: roleFilter !== 'ALL' ? (roleFilter as PharmacyStaffRole) : undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as PharmacyStaffStatus) : undefined,
  });

  const inviteMutation = useInvitePharmacyStaff();
  const updateMutation = useUpdatePharmacyStaffMember();
  const suspendMutation = useSuspendPharmacyStaff();
  const reactivateMutation = useReactivatePharmacyStaff();
  const revokeMutation = useRevokePharmacyStaff();

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteDesignation, setInviteDesignation] = useState('');
  const [inviteRole, setInviteRole] = useState<PharmacyStaffRole>('PHARMACIST');
  const [inviteRegNumber, setInviteRegNumber] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<PharmacyPermission[]>([
    'VIEW_DASHBOARD',
    'VERIFY_PRESCRIPTIONS',
    'DISPENSE_MEDICINES',
  ]);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Edit Staff Modal
  const [editingStaff, setEditingStaff] = useState<PharmacyStaffDto | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editRole, setEditRole] = useState<PharmacyStaffRole>('PHARMACIST');
  const [editPermissions, setEditPermissions] = useState<PharmacyPermission[]>([]);
  const [editRegNumber, setEditRegNumber] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleOpenInvite = () => {
    setInviteFullName('');
    setInviteEmail('');
    setInvitePhone('');
    setInviteDesignation('Staff Pharmacist');
    setInviteRole('PHARMACIST');
    setInviteRegNumber('');
    setSelectedPermissions([
      'VIEW_DASHBOARD',
      'VERIFY_PRESCRIPTIONS',
      'DISPENSE_MEDICINES',
    ]);
    setInviteError(null);
    setShowInviteModal(true);
  };

  const handleRoleChangeForInvite = (role: PharmacyStaffRole) => {
    setInviteRole(role);
    if (role === 'PHARMACY_OWNER' || role === 'PHARMACY_MANAGER') {
      setSelectedPermissions([
        'VIEW_DASHBOARD',
        'MANAGE_INVENTORY',
        'VERIFY_PRESCRIPTIONS',
        'DISPENSE_MEDICINES',
        'MANAGE_PROCUREMENT',
        'MANAGE_ORDERS',
        'VIEW_REPORTS',
        'MANAGE_STAFF',
        'VIEW_AUDIT_LOGS',
      ]);
    } else if (role === 'PHARMACIST') {
      setSelectedPermissions([
        'VIEW_DASHBOARD',
        'VERIFY_PRESCRIPTIONS',
        'DISPENSE_MEDICINES',
        'VIEW_REPORTS',
      ]);
    } else if (role === 'INVENTORY_STAFF') {
      setSelectedPermissions(['VIEW_DASHBOARD', 'MANAGE_INVENTORY', 'VIEW_REPORTS']);
    } else if (role === 'PROCUREMENT_STAFF') {
      setSelectedPermissions(['VIEW_DASHBOARD', 'MANAGE_PROCUREMENT', 'VIEW_REPORTS']);
    } else if (role === 'ORDER_STAFF') {
      setSelectedPermissions(['VIEW_DASHBOARD', 'MANAGE_ORDERS', 'VIEW_REPORTS']);
    }
  };

  const toggleInvitePermission = (perm: PharmacyPermission) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);

    try {
      await inviteMutation.mutateAsync({
        fullName: inviteFullName.trim(),
        email: inviteEmail.trim(),
        phone: invitePhone.trim() || undefined,
        designation: inviteDesignation.trim(),
        role: inviteRole,
        permissions: selectedPermissions,
        pharmacistRegistrationNumber: inviteRegNumber.trim() || undefined,
      });

      setShowInviteModal(false);
      setFeedback({ type: 'success', message: `Staff invitation issued to ${inviteEmail.trim()}` });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setInviteError(err.message || 'Failed to issue staff invitation');
    }
  };

  const handleOpenEdit = (staff: PharmacyStaffDto) => {
    setEditingStaff(staff);
    setEditFullName(staff.fullName);
    setEditPhone(staff.phone || '');
    setEditDesignation(staff.designation);
    setEditRole(staff.role);
    setEditPermissions(staff.permissions);
    setEditRegNumber(staff.pharmacistRegistrationNumber || '');
    setEditError(null);
  };

  const toggleEditPermission = (perm: PharmacyPermission) => {
    setEditPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setEditError(null);

    try {
      await updateMutation.mutateAsync({
        id: editingStaff.id,
        dto: {
          fullName: editFullName.trim(),
          phone: editPhone.trim() || undefined,
          designation: editDesignation.trim(),
          role: editRole,
          permissions: editPermissions,
          pharmacistRegistrationNumber: editRegNumber.trim() || undefined,
        },
      });

      setEditingStaff(null);
      setFeedback({ type: 'success', message: 'Staff member updated successfully' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update staff member');
    }
  };

  const handleSuspend = async (staff: PharmacyStaffDto) => {
    const reason = prompt(`Enter reason for suspending ${staff.fullName}'s access:`, 'Administrative review');
    if (reason === null) return;

    try {
      await suspendMutation.mutateAsync({ id: staff.id, reason });
      setFeedback({ type: 'success', message: `${staff.fullName} access suspended` });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to suspend staff' });
    }
  };

  const handleReactivate = async (staff: PharmacyStaffDto) => {
    if (!confirm(`Reactivate dispensary access for ${staff.fullName}?`)) return;

    try {
      await reactivateMutation.mutateAsync(staff.id);
      setFeedback({ type: 'success', message: `${staff.fullName} access reactivated` });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to reactivate staff' });
    }
  };

  const handleRevoke = async (staff: PharmacyStaffDto) => {
    if (!confirm(`Are you sure you want to permanently revoke ${staff.fullName}'s dispensary access? This cannot be undone.`)) {
      return;
    }

    try {
      await revokeMutation.mutateAsync(staff.id);
      setFeedback({ type: 'success', message: `${staff.fullName} access permanently revoked` });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to revoke staff access' });
    }
  };

  const getRoleBadgeColor = (role: PharmacyStaffRole) => {
    switch (role) {
      case 'PHARMACY_OWNER':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PHARMACY_MANAGER':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'PHARMACIST':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'INVENTORY_STAFF':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PROCUREMENT_STAFF':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'ORDER_STAFF':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusBadgeColor = (status: PharmacyStaffStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'INVITED':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'SUSPENDED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'REVOKED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Identity & Access Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Dispensary Staff & Role Permissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage authorized pharmacists, stock managers, and dispensary associates with granular scopes.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleOpenInvite}
          className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          Invite Staff Member
        </Button>
      </div>

      <PharmacySettingsNav />

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or staff ID..."
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          >
            <option value="ALL">All Roles</option>
            {ALL_ROLES.map((role) => (
              <option key={role} value={role}>
                {role.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INVITED">INVITED</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="REVOKED">REVOKED</option>
          </select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-9 px-3 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading staff directory...</div>
        ) : !staffData || staffData.staff.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No staff members found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Invite dispensary assistants, certified pharmacists, or procurement managers.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role & Designation</th>
                  <th className="py-3 px-4">Permissions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffData.staff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{staff.fullName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{staff.email}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        ID: {staff.staffId}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <Badge className={getRoleBadgeColor(staff.role)}>
                        {staff.role.replace(/_/g, ' ')}
                      </Badge>
                      <div className="text-[11px] text-slate-600 mt-1">
                        {staff.designation}
                      </div>
                      {staff.pharmacistRegistrationNumber && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Reg: {staff.pharmacistRegistrationNumber}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {staff.permissions.slice(0, 3).map((p) => (
                          <span
                            key={p}
                            className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium"
                          >
                            {p.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {staff.permissions.length > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold">
                            +{staff.permissions.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <Badge className={getStatusBadgeColor(staff.status)}>
                        {staff.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(staff)}
                          disabled={staff.status === 'REVOKED'}
                          className="h-8 px-2 text-slate-600 hover:text-sky-600"
                          title="Edit Permissions & Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        {staff.status === 'ACTIVE' && !staff.isOwner && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSuspend(staff)}
                            className="h-8 px-2 text-slate-600 hover:text-amber-600"
                            title="Suspend Access"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {staff.status === 'SUSPENDED' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReactivate(staff)}
                            className="h-8 px-2 text-slate-600 hover:text-emerald-600"
                            title="Reactivate Access"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {staff.status !== 'REVOKED' && !staff.isOwner && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevoke(staff)}
                            className="h-8 px-2 text-slate-600 hover:text-rose-600"
                            title="Revoke Access"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Staff Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Invite Dispensary Staff Member
                </h3>
                <p className="text-xs text-slate-500">
                  Assign pharmacy-scoped role and granular clinical permissions
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="p-6 space-y-4 overflow-y-auto flex-1">
              {inviteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {inviteError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Legal Name *
                  </label>
                  <Input
                    value={inviteFullName}
                    onChange={(e) => setInviteFullName(e.target.value)}
                    placeholder="e.g. Priya Nair"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Work Email Address *
                  </label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="priya.nair@pharmacy.in"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Contact Phone (Indian 10-digit)
                  </label>
                  <Input
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="9876543210"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Staff Designation *
                  </label>
                  <Input
                    value={inviteDesignation}
                    onChange={(e) => setInviteDesignation(e.target.value)}
                    placeholder="e.g. Senior Dispensing Pharmacist"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pharmacy Role *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) =>
                      handleRoleChangeForInvite(e.target.value as PharmacyStaffRole)
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    State Pharmacy Council Registration No.
                  </label>
                  <Input
                    value={inviteRegNumber}
                    onChange={(e) => setInviteRegNumber(e.target.value)}
                    placeholder="e.g. DPC-2023-88912"
                  />
                </div>
              </div>

              {/* Granular Permissions Matrix */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-900 mb-2">
                  Assigned Clinical & Operational Permissions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {ALL_PERMISSIONS.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-amber-50/60 border-amber-300 text-amber-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleInvitePermission(perm.key)}
                          className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <div className="font-medium">{perm.label}</div>
                          <div className="text-[10px] text-slate-400">{perm.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {inviteMutation.isPending ? 'Issuing...' : 'Issue Invitation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Edit Staff Details & Permissions
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {editingStaff.fullName} ({editingStaff.staffId})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Legal Name
                  </label>
                  <Input
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Designation
                  </label>
                  <Input
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as PharmacyStaffRole)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pharmacist Registration Number
                  </label>
                  <Input
                    value={editRegNumber}
                    onChange={(e) => setEditRegNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Permissions Matrix */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-900 mb-2">
                  Configured Granular Permissions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {ALL_PERMISSIONS.map((perm) => {
                    const isChecked = editPermissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-amber-50/60 border-amber-300 text-amber-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEditPermission(perm.key)}
                          className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <div className="font-medium">{perm.label}</div>
                          <div className="text-[10px] text-slate-400">{perm.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingStaff(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Permissions'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
