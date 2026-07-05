import { useState } from 'react';
import { PageHeader } from '@/shared/components/PageHeader';
import { VacanciesTab } from '../components/VacanciesTab';
import { ApplicationsTab } from '../components/ApplicationsTab';
import { RatingsTab } from '../components/RatingsTab';
import { cn } from '@/lib/utils';

type TabId = 'vacancies' | 'applications' | 'ratings';

export function CouriersPage() {
  const [activeTab, setActiveTab] = useState<TabId>('vacancies');

  const tabs = [
    { id: 'vacancies', label: 'Publicaciones' },
    { id: 'applications', label: 'Postulaciones' },
    { id: 'ratings', label: 'Repartidores Actuales' },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repartidores"
        subtitle="Administra tus vacantes de entrega, revisa postulaciones y califica a tus repartidores."
      />

      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-2">
        {activeTab === 'vacancies' && <VacanciesTab />}
        {activeTab === 'applications' && <ApplicationsTab />}
        {activeTab === 'ratings' && <RatingsTab />}
      </div>
    </div>
  );
}
