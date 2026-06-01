'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Banknote, Building2, Smartphone } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { paymentsService, Invoice, PaymentMethod } from '@/services/billing.service';
import { formatCurrency, cn } from '@/lib/utils';

const schema = z.object({
  amount: z.coerce.number().min(0.01, 'Must be greater than 0'),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'ESEWA', 'KHALTI']),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const methods: { value: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'BANK_TRANSFER', label: 'Bank', icon: Building2 },
  { value: 'ESEWA', label: 'eSewa', icon: Smartphone },
  { value: 'KHALTI', label: 'Khalti', icon: Smartphone },
];

export function RecordPaymentDialog({
  open, onOpenChange, invoice, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoice: Invoice;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const method = watch('method');

  useEffect(() => {
    if (open) {
      reset({ amount: invoice.dueAmount, method: 'CASH', transactionId: '', notes: '' });
    }
  }, [open, invoice, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await paymentsService.create({
        invoiceId: invoice.id,
        amount: data.amount,
        method: data.method,
        transactionId: data.transactionId || undefined,
        notes: data.notes || undefined,
      });
      toast({ title: 'Payment recorded', description: `${formatCurrency(data.amount)} received` });
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Failed',
        description: e.response?.data?.message?.[0] ?? 'Try again',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Invoice {invoice.invoiceNumber} · Due: {formatCurrency(invoice.dueAmount)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Amount Received (NPR)</Label>
            <Input type="number" step="0.01" min="0.01" max={invoice.dueAmount} {...register('amount')} />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            <p className="text-xs text-muted-foreground">
              Max: {formatCurrency(invoice.dueAmount)} (remaining due)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-4 gap-2">
              {methods.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setValue('method', m.value)}
                  className={cn(
                    'p-3 border rounded-lg flex flex-col items-center gap-1 transition-colors',
                    method === m.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:bg-accent',
                  )}
                >
                  <m.icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {(method === 'BANK_TRANSFER' || method === 'ESEWA' || method === 'KHALTI') && (
            <div className="space-y-1.5">
              <Label>Transaction / Reference ID</Label>
              <Input {...register('transactionId')} placeholder="Optional" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea {...register('notes')} rows={2} placeholder="Optional" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
