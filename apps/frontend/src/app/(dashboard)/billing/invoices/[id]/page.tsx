'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, CreditCard, Receipt, User, Calendar, Loader2, Printer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/layout/page-header';
import { useToast } from '@/hooks/use-toast';
import {
  invoicesService, Invoice, InvoiceStatus,
} from '@/services/billing.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { RecordPaymentDialog } from '@/components/billing/record-payment-dialog';
import { printElement } from '@/lib/print';
import { downloadFile } from '@/lib/download';
import { Download } from 'lucide-react';
import { formatBs, billingPeriodBs } from '@/lib/nepali-date';

const statusVariant: Record<InvoiceStatus, 'success' | 'warning' | 'info' | 'destructive' | 'secondary' | 'outline'> = {
  DRAFT: 'outline', SENT: 'info', PARTIALLY_PAID: 'warning', PAID: 'success', OVERDUE: 'destructive', CANCELLED: 'secondary',
};

const methodLabel: Record<string, string> = {
  CASH: 'Cash', BANK_TRANSFER: 'Bank Transfer', ESEWA: 'eSewa', KHALTI: 'Khalti',
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setDownloading(true);
    try {
      await downloadFile(`/invoices/${invoice.id}/pdf`, `${invoice.invoiceNumber}.pdf`);
    } catch {
      toast({ variant: 'destructive', title: 'Download failed' });
    } finally {
      setDownloading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try { setInvoice(await invoicesService.get(id)); }
    catch { toast({ variant: 'destructive', title: 'Invoice not found' }); router.push('/billing/invoices'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  if (loading || !invoice) {
    return (
      <div className="space-y-6 max-w-5xl">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/billing/invoices"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back to invoices</Button></Link>

      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        description={`${monthName(invoice.billingMonth)} ${invoice.billingYear} billing`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadPdf} disabled={downloading}>
              {downloading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
              Download PDF
            </Button>
            <Button variant="outline" onClick={() => printElement(document.getElementById('invoice-print'), `Invoice ${invoice.invoiceNumber}`)}>
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
            {invoice.dueAmount > 0 && invoice.status !== 'CANCELLED' && (
              <Button onClick={() => setPayOpen(true)}>
                <CreditCard className="h-4 w-4 mr-1" /> Record Payment
              </Button>
            )}
          </div>
        }
      />

      <div id="invoice-print" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Invoice Details</CardTitle>
                <CardDescription className="font-mono">{invoice.invoiceNumber}</CardDescription>
              </div>
              <Badge variant={statusVariant[invoice.status]} className="text-sm">{invoice.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {invoice.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium">{item.description}</p>
                    {item.discount && (
                      <p className="text-xs text-muted-foreground">Discount: {item.discount.name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {item.discountAmount > 0 && (
                      <p className="text-xs text-muted-foreground line-through">{formatCurrency(item.amount)}</p>
                    )}
                    <p className="font-mono font-medium">{formatCurrency(item.netAmount)}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <Row label="Subtotal" value={formatCurrency(invoice.subtotal)} />
              {invoice.discountAmount > 0 && (
                <Row label="Discounts" value={`− ${formatCurrency(invoice.discountAmount)}`} className="text-blue-600 dark:text-blue-400" />
              )}
              {invoice.fineAmount > 0 && (
                <Row label="Late Fine" value={`+ ${formatCurrency(invoice.fineAmount)}`} className="text-red-600 dark:text-red-400" />
              )}
              <Separator />
              <Row label="Total" value={formatCurrency(invoice.totalAmount)} className="font-bold text-base" />
              <Row label="Paid" value={formatCurrency(invoice.paidAmount)} className="text-green-600 dark:text-green-400" />
              <Row label="Due" value={formatCurrency(invoice.dueAmount)} className="font-bold text-base text-orange-600 dark:text-orange-400" />
            </div>

            {invoice.notes && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Student
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.student && (
                <Link href={`/students/${invoice.student.id}`} className="block hover:bg-accent/40 -m-2 p-2 rounded-md transition-colors">
                  <p className="font-semibold">{invoice.student.firstName} {invoice.student.lastName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{invoice.student.studentId}</p>
                  {invoice.student.section && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {invoice.student.section.class.name} — {invoice.student.section.name}
                    </p>
                  )}
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Issued" value={`${formatBs(invoice.createdAt)} BS`} />
              <Row label="Issued (AD)" value={formatDate(invoice.createdAt)} />
              <Row label="Due Date" value={`${formatBs(invoice.dueDate)} BS`} />
              <Row label="Due Date (AD)" value={formatDate(invoice.dueDate)} />
              <Row label="Period" value={`${billingPeriodBs(invoice.billingMonth, invoice.billingYear)} BS`} />
              <Row label="Period (AD)" value={`${monthName(invoice.billingMonth)} ${invoice.billingYear}`} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" /> Payment History
          </CardTitle>
          <CardDescription>{invoice.payments?.length ?? 0} payment(s) recorded</CardDescription>
        </CardHeader>
        <CardContent>
          {!invoice.payments?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">No payments yet.</p>
          ) : (
            <div className="space-y-2">
              {invoice.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-950 rounded-lg p-2">
                      <Receipt className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium font-mono text-sm">{p.receiptNumber}</p>
                        <Badge variant="outline">{methodLabel[p.method] ?? p.method}</Badge>
                        {p.status !== 'COMPLETED' && <Badge variant="warning">{p.status}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt)}
                        {p.transactionId && ` · TXN ${p.transactionId}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-mono font-semibold text-green-600 dark:text-green-400">
                      + {formatCurrency(p.amount)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Download receipt PDF"
                      onClick={() => downloadFile(`/payments/${p.id}/pdf`, `${p.receiptNumber}.pdf`).catch(() => toast({ variant: 'destructive', title: 'Download failed' }))}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RecordPaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        invoice={invoice}
        onSaved={load}
      />
    </div>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex items-center justify-between ${className ?? ''}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function monthName(m: number): string {
  return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1] ?? '';
}
