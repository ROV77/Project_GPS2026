import { useState, useCallback } from 'react';

/**
 * Estado de paginación server-side reutilizable por todas las listas.
 * Expone `page`/`limit` (para la query) y un `onChange(page, pageSize)` listo
 * para el componente `Pagination`. NO pagina en cliente: solo refleja qué pedir.
 */
export function useTablePagination(initialLimit = 20) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);

  const onChange = useCallback((nextPage: number, nextLimit: number) => {
    setPage(nextPage);
    setLimit(nextLimit);
  }, []);

  return { page, limit, setPage, setLimit, onChange };
}
