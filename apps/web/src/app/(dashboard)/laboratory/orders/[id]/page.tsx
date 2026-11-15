'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  useLaboratoryOrderDetail,
  useSpecimenRequirements,
} from '@/features/laboratory/hooks/use-laboratory';
import {
  LabOrderStatusBadge,
  SpecimenTypeBadge,
  OrderReviewModal,
  AssignTestModal,
} from '@/components/laboratory';
import {
  ArrowLeft,
  User,
  Stethoscope,
  FlaskConical,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  UserCheck,
  AlertCircle,
  Layers,
  Droplet,
} from 'lucide-react';

export default function LaboratoryOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const { data: order, isLoading, error, refetch } = useLaboratoryOrderDetail(orderId);
  const { data: specimenRequirements, isLoading: loadingRequirements } =
    useSpecimenRequirements(orderId);

  // Review Modals
  const [reviewModalMode, setReviewModalMode] = useState<
    'ACCEPT' | 'REJECT' | 'CLARIFY' | null
  >(null);

  // Assign Modal
  const [assigningTest, setAssigningTest] = useState<{
    code: string;
    name: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-muted-foreground">
        Loading laboratory order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 text-center bg-card rounded-2xl border border-destructive/20 my-6 shadow-xs max-w-lg mx-auto">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-foreground mb-1">
          Order Not Found
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          The requested laboratory order could not be located or you lack permissions to view it.
        </p>
        <Link
          href="/laboratory/orders"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Queue
        </Link>
      </div>
    );
  }

  const isReviewable = order.status === 'ORDERED' || order.status === 'CLARIFICATION_REQUESTED';
  const isAccepted = order.status === 'ACCEPTED';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/laboratory/orders"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-foreground font-mono">
                Order #{order.orderNumber}
              </h1>
              <LabOrderStatusBadge status={order.status} />
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  order.priority === 'STAT'
                    ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                    : order.priority === 'URGENT'
                    ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {order.priority || 'ROUTINE'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ordered On: {new Date(order.orderedAt || order.createdAt).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isReviewable && (
            <>
              <button
                onClick={() => setReviewModalMode('ACCEPT')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Accept Order
              </button>
              <button
                onClick={() => setReviewModalMode('CLARIFY')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                Clarification
              </button>
              <button
                onClick={() => setReviewModalMode('REJECT')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </>
          )}

          {isAccepted && (
            <Link
              href={`/laboratory/samples/collect?orderId=${order.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <FlaskConical className="w-4 h-4" />
              Collect / Register Specimen
            </Link>
          )}
        </div>
      </div>

      {/* Patient & Ordering Physician Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Patient Info Card */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
            <User className="w-4 h-4 text-teal-600" />
            Patient Information
          </div>
          <div className="space-y-1">
            <span className="text-base font-bold text-foreground block">
              {order.patient?.name || 'Patient'}
            </span>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>
                ABHA Address:{' '}
                <span className="font-mono font-semibold text-foreground">
                  {order.patient?.abhaAddress || 'N/A'}
                </span>
              </p>
              <p>
                Demographics:{' '}
                <span className="text-foreground">
                  {order.patient?.gender || 'N/A'}, {order.patient?.age ? `${order.patient.age} yrs` : 'Age N/A'}
                </span>
              </p>
              {order.patient?.phone && (
                <p>
                  Contact: <span className="font-mono text-foreground">{order.patient.phone}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Doctor & Facility Card */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
            <Stethoscope className="w-4 h-4 text-teal-600" />
            Ordering Clinical Provider
          </div>
          <div className="space-y-1">
            <span className="text-base font-bold text-foreground block">
              {order.doctor?.name || 'Ordering Practitioner'}
            </span>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>
                Specialization:{' '}
                <span className="text-foreground">
                  {order.doctor?.specialty || 'General Medicine'}
                </span>
              </p>
              <p>
                Facility / Clinic:{' '}
                <span className="text-foreground">
                  {order.doctor?.facilityName || 'Health Center'}
                </span>
              </p>
              {order.doctor?.licenseNumber && (
                <p>
                  Medical Registration:{' '}
                  <span className="font-mono text-foreground">{order.doctor.licenseNumber}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rejection / Clarification Notice if present */}
      {order.status === 'REJECTED' && order.rejectionReason && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Order Rejection Code: {order.rejectionReasonCode || 'OTHER'}</span>
          </div>
          <p className="pl-5 text-muted-foreground">{order.rejectionReason}</p>
        </div>
      )}

      {order.status === 'CLARIFICATION_REQUESTED' && order.clarificationNotes && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>Clarification Requested from Physician:</span>
          </div>
          <p className="pl-5 text-muted-foreground">{order.clarificationNotes}</p>
        </div>
      )}

      {/* Resolved Specimen Requirements Card */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Droplet className="w-4 h-4 text-teal-600" />
            Catalogue Specimen Resolution
          </h2>
          <p className="text-xs text-muted-foreground">
            Automatically resolved specimen containers, tube volumes, and pre-analytical instructions for ordered tests
          </p>
        </div>

        {loadingRequirements ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            Resolving specimen requirements from catalogue...
          </div>
        ) : !specimenRequirements || specimenRequirements.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            Standard laboratory accessioning rules apply.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {specimenRequirements.map((req: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">
                    {req.testName} ({req.testCode})
                  </span>
                  <SpecimenTypeBadge specimenType={req.specimenType} />
                </div>
                <div className="text-[11px] text-muted-foreground space-y-1">
                  <p>
                    Container / Tube:{' '}
                    <span className="text-foreground font-medium">
                      {req.containerRequirements || 'Standard sterile tube'}
                    </span>
                  </p>
                  {req.fastingRequirement && (
                    <p className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Fasting: {req.fastingDurationHours ? `${req.fastingDurationHours} hours` : 'Required'}
                    </p>
                  )}
                  {req.preparationInstructions && (
                    <p>
                      Prep: <span className="text-foreground">{req.preparationInstructions}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ordered Tests & Assignments List */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-600" />
          Ordered Diagnostic Tests ({order.tests.length})
        </h2>

        <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden">
          {order.tests.map((test) => {
            const assignment = order.testAssignments?.find(
              (a) => a.testCode === test.testCode
            );

            return (
              <div
                key={test.testCode}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {test.testName}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-teal-600 font-bold">
                      {test.testCode}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                    {test.category && <span>Category: {test.category}</span>}
                    {test.specimenType && <span>• Specimen: {test.specimenType}</span>}
                    {test.instructions && (
                      <span>• Instructions: {test.instructions}</span>
                    )}
                  </div>

                  {assignment && (
                    <div className="mt-2 text-[11px] bg-teal-500/10 border border-teal-500/20 text-teal-800 dark:text-teal-300 p-2 rounded-lg flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Assigned to: <strong>{assignment.department || 'Processing Unit'}</strong>
                        {assignment.assignedTechnicianName && ` (${assignment.assignedTechnicianName})`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() =>
                      setAssigningTest({
                        code: test.testCode,
                        name: test.testName,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>{assignment ? 'Reassign' : 'Assign Unit'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {reviewModalMode && (
        <OrderReviewModal
          order={order}
          mode={reviewModalMode}
          isOpen={true}
          onClose={() => setReviewModalMode(null)}
          onSuccess={() => refetch()}
        />
      )}

      {assigningTest && (
        <AssignTestModal
          orderId={order.id}
          orderNumber={order.orderNumber}
          testCode={assigningTest.code}
          testName={assigningTest.name}
          isOpen={true}
          onClose={() => setAssigningTest(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
