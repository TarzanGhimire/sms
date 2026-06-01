'use client';

import { useState } from 'react';
import { Calendar, BookOpen, Users, GraduationCap, ClipboardList } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { cn } from '@/lib/utils';
import { AcademicYearsTab } from '@/components/academic/years-tab';
import { ClassesTab } from '@/components/academic/classes-tab';
import { SectionsTab } from '@/components/academic/sections-tab';
import { SubjectsTab } from '@/components/academic/subjects-tab';
import { ClassSubjectsTab } from '@/components/academic/class-subjects-tab';

const tabs = [
  { key: 'years', label: 'Academic Years', icon: Calendar },
  { key: 'classes', label: 'Classes', icon: BookOpen },
  { key: 'sections', label: 'Sections', icon: Users },
  { key: 'subjects', label: 'Subjects', icon: GraduationCap },
  { key: 'class-subjects', label: 'Class Subjects', icon: ClipboardList },
] as const;

type TabKey = (typeof tabs)[number]['key'];

export default function AcademicsPage() {
  const [active, setActive] = useState<TabKey>('years');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academics"
        description="Manage academic years, classes, sections, and subjects"
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

      {active === 'years' && <AcademicYearsTab />}
      {active === 'classes' && <ClassesTab />}
      {active === 'sections' && <SectionsTab />}
      {active === 'subjects' && <SubjectsTab />}
      {active === 'class-subjects' && <ClassSubjectsTab />}
    </div>
  );
}
