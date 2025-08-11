export function parsePagination(q: any) {
  const page = Math.max(1, Number(q.page || 1));
  const page_size = Math.min(100, Math.max(1, Number(q.page_size || 25)));
  const from = (page - 1) * page_size;
  const to = from + page_size - 1;
  return { page, page_size, from, to };
}