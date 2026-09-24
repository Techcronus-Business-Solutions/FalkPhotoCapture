import type { AddBoxItem } from '../navigation/types';
import type { AvailableItem } from '../navigation/types';
import type {
  ProcessBendexQuantityItem,
  ProcessBendexQuantityRequest,
} from '../services/bendexService';

const toProcessItem = (
  item: AddBoxItem,
  assignedQuantity: number,
  flag: ProcessBendexQuantityItem['flag'],
): ProcessBendexQuantityItem => ({
  trimname: item.trimName.trim(),
  assignedQuantity: String(assignedQuantity),
  bendexItemKey: item.id,
  position: item.position.trim(),
  flag,
});

export const buildProcessBendexRequest = (
  orderNumber: string,
  boxNumber: string | number,
  items: AddBoxItem[],
  deletedItems: AddBoxItem[] = [],
): ProcessBendexQuantityRequest => {
  const changedItems = items.flatMap(item => {
    if (item.isNew) {
      return item.quantity > 0
        ? [toProcessItem(item, item.quantity, 'add')]
        : [];
    }

    const delta = item.quantity - item.originalAssignedQuantity;
    return delta === 0 ? [] : [toProcessItem(item, delta, 'update')];
  });

  const removedItems = deletedItems.map(item =>
    toProcessItem(item, -item.originalAssignedQuantity, 'update'),
  );

  return {
    orderNumber: String(orderNumber).trim(),
    boxNumber: String(boxNumber).trim(),
    itemList: [...changedItems, ...removedItems],
  };
};

export const addReturnedQuantitiesToAvailableItems = (
  availableItems: AvailableItem[],
  deletedItems: AddBoxItem[],
): AvailableItem[] =>
  availableItems.map(item => {
    const deletedItem = deletedItems.find(deleted => deleted.id === item.id);
    if (!deletedItem) {
      return item;
    }

    const availableQuantity =
      item.availableQuantity + deletedItem.originalAssignedQuantity;
    return {
      ...item,
      availableQuantity,
      quantityLabel: `(Qty - ${availableQuantity})`,
    };
  });
