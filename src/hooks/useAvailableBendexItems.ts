import { useEffect, useState } from 'react';
import { bendexService } from '../services/bendexService';
import type { BendexItem } from '../types/bendex';
import type { AvailableItem } from '../navigation/types';

const mapToAvailableItem = (item: BendexItem, index: number): AvailableItem => ({
  id: `${item.bendexOrderID}-${item.title}-${index}`,
  name: item.trimName,
  quantityLabel: `(Qty - ${item.availableQuantity})`,
  description: item.color,
  availableQuantity: item.availableQuantity,
});

const useAvailableBendexItems = (orderNumber: string) => {
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await bendexService.fetchBendexData(orderNumber);
        if (!cancelled) {
          setAvailableItems(data.map(mapToAvailableItem));
        }
      } catch {
        if (!cancelled) {
          setAvailableItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  return { availableItems, loading };
};

export default useAvailableBendexItems;
