import { useEffect, useState } from 'react';
import { bendexService } from '../services/bendexService';
import type { BendexItem } from '../types/bendex';
import type { AvailableItem } from '../navigation/types';

const mapToAvailableItem = (item: BendexItem): AvailableItem => ({
  id: String(item.bendexItemKey),
  name: item.trimName + ' (Pos ' + item.position + ')',
  trimName: item.trimName,
  position: String(item.position),
  quantityLabel: `(Qty - ${item.availableQuantity})`,
  description:
    item.length !== 0 && item.width !== 0
      ? `${item.color}\n${item.length} mm x ${item.width} mm`
      : item.color,
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
