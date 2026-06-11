import { PageHeader } from '@/shared/components/PageHeader';
import { Badge, Pagination, Table, type Column } from '@/shared/ui';
import { useTablePagination } from '@/shared/hooks/useTablePagination';
import { formatCLP } from '@/shared/lib/format';
import { usePlans } from '../hooks/usePlans';
import type { Plan } from '../types';

export function PlansListPage() {
  const { page, limit, onChange } = useTablePagination();
  const { data, isLoading } = usePlans({ page, limit });

  const columns: Column<Plan>[] = [
    { key: 'name', header: 'Nombre', dataIndex: 'name' },
    { key: 'price', header: 'Precio', align: 'right', render: (p) => formatCLP(p.price) },
    { key: 'billing_period', header: 'Periodo', dataIndex: 'billing_period' },
    {
      key: 'is_active',
      header: 'Estado',
      render: (p) =>
        p.is_active === false ? <Badge>Inactivo</Badge> : <Badge tone="green">Activo</Badge>,
    },
  ];

  return (
    <>
      <PageHeader title="Planes" subtitle="Planes de suscripción para comercios" />
      <Table<Plan>
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        emptyText="Sin planes"
      />
      <Pagination
        page={data?.page ?? page}
        pageSize={data?.limit ?? limit}
        total={data?.total ?? 0}
        onChange={onChange}
      />
    </>
  );
}
