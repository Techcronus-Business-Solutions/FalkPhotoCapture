import { useEffect, useState } from 'react';
import { bendexService } from '../services/bendexService';
import type { BendexAssignmentItem } from '../types/bendex';
import type { AddBoxItem } from '../navigation/types';

const mapToAddBoxItem = (item: BendexAssignmentItem): AddBoxItem => {
  const assignedQuantity = Number(item.assignedQuantity);
  const availableQuantity = Number(item.availableQuantity);
  const totalQuantity = assignedQuantity + availableQuantity;

  return {
    id: String(item.bendexItemKey),
    name:
      item.trimname +
      ' (Pos ' +
      item.position +
      ') (Qty - ' +
      totalQuantity +
      ')',
    trimName: item.trimname,
    position: String(item.position),
    description:
      item.length !== 0 && item.width !== 0
        ? `${item.color}\n${item.length} mm x ${item.width} mm`
        : item.color,
    quantity: assignedQuantity,
    availableQuantity: totalQuantity,
  };
};

const useBendexAssignedItems = (orderNumber: string, boxNumber: number) => {
  const [items, setItems] = useState<AddBoxItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const assignments = await bendexService.fetchBendexAssignment(
          orderNumber,
          boxNumber,
        );
        if (!cancelled) {
          setItems(assignments.map(mapToAddBoxItem));
        }
      } catch {
        if (!cancelled) {
          setItems([]);
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
  }, [orderNumber, boxNumber]);

  return { items, setItems, loading };
};

export default useBendexAssignedItems;
