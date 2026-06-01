'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { School, Palette, Receipt, Download, Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/page-header';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';
import { settingsService, SchoolSettings, backupService } from '@/services/settings.service';

export default function SettingsPage() {
  const { toast } = useToast();
  const { accessToken } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { register, handleSubmit, reset } = useForm<Partial<SchoolSettings>>();

  useEffect(() => {
    settingsService.get()
      .then((s) => reset(s))
      .catch(() => toast({ variant: 'destructive', title: 'Failed to load settings' }))
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: Partial<SchoolSettings>) => {
    setSaving(true);
    try {
      // Only send fields the backend accepts (exclude id and read-only props).
      const str = (v: unknown) => {
        if (v == null) return undefined;
        const s = String(v).trim();
        return s === '' ? undefined : s;
      };
      const payload = {
        schoolName: str(data.schoolName),
        address: str(data.address),
        phone: str(data.phone),
        email: str(data.email),
        website: str(data.website),
        registrationNumber: str(data.registrationNumber),
        logoUrl: str(data.logoUrl),
        primaryColor: str(data.primaryColor),
        accentColor: str(data.accentColor),
        invoiceFooter: str(data.invoiceFooter),
        receiptFooter: str(data.receiptFooter),
        finePerDay: data.finePerDay != null && String(data.finePerDay) !== '' ? Number(data.finePerDay) : undefined,
        fineGraceDays: data.fineGraceDays != null && String(data.fineGraceDays) !== '' ? Number(data.fineGraceDays) : undefined,
      };
      await settingsService.update(payload);
      toast({ title: 'Settings saved' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: e.response?.data?.message?.[0] ?? 'Try again' });
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    setDownloading(true);
    try {
      const res = await fetch(backupService.exportUrl(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `school-erp-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Backup downloaded' });
    } catch {
      toast({ variant: 'destructive', title: 'Backup failed' });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Settings" description="Manage school information, branding, and finance configuration" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><School className="h-4 w-4 text-primary" /> School Information</CardTitle>
            <CardDescription>Appears on invoices, receipts, and report cards.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>School Name</Label>
              <Input {...register('schoolName')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Phone</Label><Input {...register('phone')} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input {...register('email')} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Website</Label><Input {...register('website')} /></div>
              <div className="space-y-1.5"><Label>Registration No.</Label><Input {...register('registrationNumber')} /></div>
            </div>
            <div className="space-y-1.5"><Label>Address</Label><Textarea rows={2} {...register('address')} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4 text-primary" /> Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Primary Color</Label>
                <div className="flex gap-2 items-center">
                  <Input type="color" {...register('primaryColor')} className="w-14 h-10 p-1" />
                  <Input {...register('primaryColor')} className="flex-1" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Accent Color</Label>
                <div className="flex gap-2 items-center">
                  <Input type="color" {...register('accentColor')} className="w-14 h-10 p-1" />
                  <Input {...register('accentColor')} className="flex-1" />
                </div>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Logo URL</Label><Input {...register('logoUrl')} placeholder="https://..." /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" /> Finance & Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Fine per day (NPR)</Label>
                <Input type="number" step="0.01" {...register('finePerDay')} />
              </div>
              <div className="space-y-1.5">
                <Label>Fine grace days</Label>
                <Input type="number" {...register('fineGraceDays')} />
              </div>
            </div>
            <div className="space-y-1.5"><Label>Invoice Footer</Label><Textarea rows={2} {...register('invoiceFooter')} placeholder="Thank you for your payment" /></div>
            <div className="space-y-1.5"><Label>Receipt Footer</Label><Textarea rows={2} {...register('receiptFooter')} /></div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
        </div>
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4 text-primary" /> Backup & Export</CardTitle>
          <CardDescription>Download a complete JSON backup of all system data.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleBackup} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download Backup (JSON)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
