'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Tag, Receipt, Percent, FileText, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { cn } from '@/lib/utils';
import { FeeCategoriesTab } from '@/components/billing/fee-categories-tab';
import { FeeStructuresTab } from '@/components/billing/fee-structures-tab';
import { DiscountsTab } from '@/components/billing/discounts-tab';

const tabs = [
  { key: 'categories', label: 'Fee Categories', icon: Tag },
  { key: 'structures', label: 'Fee Structures', icon: Receipt },
  { key: 'discounts', label: 'Discounts', icon: Percent },
] as const;

type TabKey = (typeof tabs)[number]['key'];

export default function BillingPage() {
  const [active, setActive] = useState<TabKey>('categories');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing Setup"
        description="Manage fee categories, per-class fee structures, and discounts"
        action={
          <div className="flex gap-2">
            <Link href="/billing/invoices">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-1" /> Invoices
              </Button>
            </Link>
            <Link href="/billing/generate">
              <Button>
                <Calendar className="h-4 w-4 mr-1" /> Generate Monthly Invoices
              </Button>
            </Link>
          </div>
        }
      />

      <Card className="p-1.5 inline-flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              active === t.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </Card>

      {active === 'categories' && <FeeCategoriesTab />}
      {active === 'structures' && <FeeStructuresTab />}
      {active === 'discounts' && <DiscountsTab />}
    </div>
  );
}
