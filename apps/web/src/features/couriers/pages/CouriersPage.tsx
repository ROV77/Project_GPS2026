import { useState } from 'react';
import { PageHeader } from '@/shared/components/PageHeader';
import { VacanciesTab } from '../components/VacanciesTab';
import { ApplicationsTab } from '../components/ApplicationsTab';
import { RatingsTab } from '../components/RatingsTab';

export function CouriersPage() {
  const [activeTab, setActiveTab] = useState<'vacancies' | 'applications' | 'ratings'>('vacancies');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repartidores"
        description="Gestiona las vacantes, revisa las postulaciones y evalúa a tus repartidores."
      />
      
      {/* Navegación de Pestañas (Tabs) */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('vacancies')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'vacancies'
                ? 'border-brand-500 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bolsa de Trabajo
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'applications'
                ? 'border-brand-500 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Postulaciones
          </button>
          <button
            onClick={() => setActiveTab('ratings')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'ratings'
                ? 'border-brand-500 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Mis Repartidores
          </button>
        </nav>
      </div>

      {/* Contenido de la Pestaña */}
      <div className="pt-2">
        {activeTab === 'vacancies' && <VacanciesTab />}
        {activeTab === 'applications' && <ApplicationsTab />}
        {activeTab === 'ratings' && <RatingsTab />}
      </div>
    </div>
  );
}
