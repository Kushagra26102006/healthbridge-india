import React from 'react';
import Link from 'next/link';
import { AlertTriangle, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PharmacyInventoryAlertDto } from '@healthbridge/shared-types';

export interface InventoryAlertsCardProps {
  alerts: PharmacyInventoryAlertDto[];
  className?: string;
}

export function InventoryAlertsCard({ alerts, className }: InventoryAlertsCardProps) {
  return (
    <Card className={cn('border border-border/80 bg-card/60 rounded-2xl shadow-sm', className)}>
      <CardHeader className="p-5 pb-3 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Critical Inventory Alerts
        </CardTitle>
        <Link
          href="/pharmacy/inventory"
          className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 inline-flex items-center gap-1"
        >
          Manage Stock <ArrowRight className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent className="p-4 space-y-2.5">
        {alerts.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            No stock deficits or imminent batch expirations detected.
          </div>
        ) : (
          alerts.map((alert) => {
            const isExpired = alert.alertStatus === 'EXPIRED';
            const isNearExpiry = alert.alertStatus === 'NEAR_EXPIRY';

            return (
              <div
                key={alert.id}
                className="p-3 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  {isExpired ? (
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  ) : isNearExpiry ? (
                    <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{alert.medicineName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Batch: <span className="font-mono">{alert.batchNumber}</span> • Qty:{' '}
                      <span className="font-bold text-foreground">{alert.availableQuantity}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-[10px] font-semibold',
                      isExpired
                        ? 'bg-red-500/10 text-red-500'
                        : isNearExpiry
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-orange-500/10 text-orange-500'
                    )}
                  >
                    {alert.alertStatus.replace('_', ' ')}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono mt-1">
                    Exp: {new Date(alert.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
export default InventoryAlertsCard;

