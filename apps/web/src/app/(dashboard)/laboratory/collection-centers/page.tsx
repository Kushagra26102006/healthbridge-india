'use client';

import React, { useState } from 'react';
import {
  useCollectionCenters,
  useCreateCollectionCenter,
  useUpdateCollectionCenter,
} from '@/features/laboratory/hooks/use-laboratory';
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  Clock,
  AlertCircle,
  X,
  Edit2,
} from 'lucide-react';
import type { CollectionCenterDto } from '@healthbridge/shared-types';

export default function CollectionCentersPage() {
  const { data: centers, isLoading, refetch } = useCollectionCenters();
  const createMutation = useCreateCollectionCenter();
  const updateMutation = useUpdateCollectionCenter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<CollectionCenterDto | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [operatingHours, setOperatingHours] = useState('07:00 AM - 08:00 PM');
  const [servicesInput, setServicesInput] = useState('Blood, Urine, Swab');
  const [isActive, setIsActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const openCreateModal = () => {
    setEditingCenter(null);
    setName('');
    setStreet('');
    setCity('');
    setState('');
    setPostalCode('');
    setContactPhone('');
    setContactEmail('');
    setContactPerson('');
    setOperatingHours('07:00 AM - 08:00 PM');
    setServicesInput('Blood, Urine, Swab');
    setIsActive(true);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (center: CollectionCenterDto) => {
    setEditingCenter(center);
    setName(center.name);
    setStreet(center.address.street);
    setCity(center.address.city);
    setState(center.address.state);
    setPostalCode(center.address.postalCode);
    setContactPhone(center.contactPhone);
    setContactEmail(center.contactEmail || '');
    setContactPerson(center.contactPerson || '');
    setOperatingHours(center.operatingHours || '07:00 AM - 08:00 PM');
    setServicesInput(center.collectionServices?.join(', ') || 'Blood, Urine, Swab');
    setIsActive(center.isActive);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !contactPhone.trim() || !city.trim()) {
      setErrorMessage('Please provide center name, city, and primary contact phone.');
      return;
    }

    const services = servicesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editingCenter?.id) {
        await updateMutation.mutateAsync({
          centerId: editingCenter.id,
          dto: {
            name: name.trim(),
            address: {
              street: street.trim(),
              city: city.trim(),
              state: state.trim(),
              postalCode: postalCode.trim(),
              country: 'India',
            },
            contactPhone: contactPhone.trim(),
            contactEmail: contactEmail.trim() || undefined,
            contactPerson: contactPerson.trim() || undefined,
            operatingHours: operatingHours.trim() || undefined,
            collectionServices: services,
            isActive,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          address: {
            street: street.trim(),
            city: city.trim(),
            state: state.trim(),
            postalCode: postalCode.trim(),
            country: 'India',
          },
          contactPhone: contactPhone.trim(),
          contactEmail: contactEmail.trim() || undefined,
          contactPerson: contactPerson.trim() || undefined,
          operatingHours: operatingHours.trim() || undefined,
          collectionServices: services,
          isActive,
        });
      }
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Failed to save collection center'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-teal-600" />
            Collection Centers & Phlebotomy Stations
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage satellite collection centers, operating hours, contact staff, and specimen transit logistics
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Collection Center
        </button>
      </div>

      {/* Centers Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-muted-foreground">
          Loading collection network...
        </div>
      ) : !centers || centers.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-border shadow-xs space-y-3">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-bold text-foreground">
            No Collection Centers Registered
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Add satellite phlebotomy booths or diagnostic collection centers to expand your specimen collection footprint.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add First Center
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {centers.map((center) => (
            <div
              key={center.id}
              className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-teal-500/40 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-600 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground truncate max-w-[160px]">
                        {center.name}
                      </h3>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          center.isActive
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {center.isActive ? 'OPERATIONAL' : 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => openEditModal(center)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="Edit Center"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs text-muted-foreground space-y-1.5 mt-3">
                  <p className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <span>
                      {center.address.street}, {center.address.city}, {center.address.state} -{' '}
                      {center.address.postalCode}
                    </span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="font-mono">{center.contactPhone}</span>
                  </p>
                  {center.operatingHours && (
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>{center.operatingHours}</span>
                    </p>
                  )}
                </div>
              </div>

              {center.collectionServices && center.collectionServices.length > 0 && (
                <div className="pt-3 border-t border-border flex flex-wrap gap-1">
                  {center.collectionServices.map((srv, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-muted/60 text-muted-foreground"
                    >
                      {srv}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in-50">
          <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
              <h3 className="text-base font-bold text-foreground">
                {editingCenter ? 'Edit Collection Center' : 'Register New Collection Center'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Collection Center Name <span className="text-teal-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. HealthBridge South Ext Center"
                  required
                  className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. Shop 4, Community Centre"
                  className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    City <span className="text-teal-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    PIN
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Contact Phone <span className="text-teal-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(e.target.value)}
                    placeholder="e.g. 07:00 AM - 08:00 PM"
                    className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Supported Services
                  </label>
                  <input
                    type="text"
                    value={servicesInput}
                    onChange={(e) => setServicesInput(e.target.value)}
                    placeholder="Blood, Urine, Swab"
                    className="w-full text-xs rounded-xl bg-muted/40 border border-border p-2.5 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Center is currently operational and accepting specimens</span>
              </label>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-xs disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : 'Save Collection Center'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
