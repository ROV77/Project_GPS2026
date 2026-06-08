export function parseBigIntId(value: string): bigint | null {
  if (!/^\d+$/.test(value)) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

export interface Pagination {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export function getPagination(query: Record<string, unknown>): Pagination {
  const rawPage = Number(query.page);
  const rawLimit = Number(query.limit);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit =
    Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;
  return { skip: (page - 1) * limit, take: limit, page, limit };
}
