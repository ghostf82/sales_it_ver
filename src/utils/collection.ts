export interface CollectionGroup {
  key: string;
  amount: number;
  firstRowId: string;
}

export function groupCollectionsByRepMonth(data: any[]): Map<string, CollectionGroup> {
  const groups = new Map<string, CollectionGroup>();
  
  // Sort data to ensure consistent display
  const sortedData = [...data].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    if (a.month !== b.month) return a.month - b.month;
    if (a.representative.name !== b.representative.name) {
      return a.representative.name.localeCompare(b.representative.name);
    }
    return a.category.localeCompare(b.category);
  });

  // Create a map of unique collection values per rep/month
  const collectionMap = new Map<string, number>();
  sortedData.forEach(row => {
    const key = `${row.representative.id}-${row.year}-${row.month}`;
    if (!collectionMap.has(key)) {
      collectionMap.set(key, row.collection || 0);
    }
  });

  // Create groups with first row IDs
  let lastKey = '';
  sortedData.forEach(row => {
    const key = `${row.representative.id}-${row.year}-${row.month}`;
    if (key !== lastKey) {
      groups.set(key, {
        key,
        amount: collectionMap.get(key) || 0,
        firstRowId: row.id
      });
      lastKey = key;
    }
  });

  return groups;
}

export function calculateTotalCollection(groups: Map<string, CollectionGroup>): number {
  return Array.from(groups.values())
    .reduce((sum, group) => sum + group.amount, 0);
}