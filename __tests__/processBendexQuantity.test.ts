import {
  addReturnedQuantitiesToAvailableItems,
  buildProcessBendexRequest,
} from '../src/utils/processBendexQuantity';
import type { AddBoxItem } from '../src/navigation/types';

const item = (overrides: Partial<AddBoxItem> = {}): AddBoxItem => ({
  id: 'key-1',
  name: 'FSJ1-003 (Pos 10)',
  trimName: 'FSJ1-003',
  position: '10',
  description: 'Red',
  quantity: 35,
  availableQuantity: 50,
  originalAssignedQuantity: 35,
  isNew: false,
  ...overrides,
});

describe('buildProcessBendexRequest', () => {
  it('builds deltas and omits unchanged items', () => {
    const request = buildProcessBendexRequest(
      '16264741',
      20,
      [
        item(),
        item({
          id: 'key-2',
          trimName: 'FSJ1-004',
          position: '11',
          quantity: 18,
          originalAssignedQuantity: 15,
        }),
        item({
          id: 'key-3',
          trimName: 'FSJ1-005',
          position: '12',
          quantity: 15,
          originalAssignedQuantity: 15,
        }),
        item({
          id: 'key-4',
          trimName: 'FSJ1-006',
          position: '13',
          quantity: 8,
          originalAssignedQuantity: 0,
          isNew: true,
        }),
      ],
      [
        item({
          id: 'key-5',
          trimName: 'FSJ1-007',
          position: '14',
          quantity: 5,
          originalAssignedQuantity: 5,
        }),
      ],
    );

    expect(request).toEqual({
      orderNumber: '16264741',
      boxNumber: '20',
      itemList: [
        {
          trimname: 'FSJ1-004',
          assignedQuantity: '3',
          bendexItemKey: 'key-2',
          position: '11',
          flag: 'update',
        },
        {
          trimname: 'FSJ1-006',
          assignedQuantity: '8',
          bendexItemKey: 'key-4',
          position: '13',
          flag: 'add',
        },
        {
          trimname: 'FSJ1-007',
          assignedQuantity: '-5',
          bendexItemKey: 'key-5',
          position: '14',
          flag: 'update',
        },
      ],
    });
  });

  it('omits an item returned to its original quantity', () => {
    const request = buildProcessBendexRequest(
      'order',
      'box',
      [item({ quantity: 35 })],
      [],
    );

    expect(request.itemList).toEqual([]);
  });

  it('nets a deleted existing item when it is re-added', () => {
    const request = buildProcessBendexRequest('order', 'box', [
      item({ quantity: 8, originalAssignedQuantity: 5 }),
    ]);

    expect(request.itemList).toEqual([
      {
        trimname: 'FSJ1-003',
        assignedQuantity: '3',
        bendexItemKey: 'key-1',
        position: '10',
        flag: 'update',
      },
    ]);
  });

  it('omits a new item deleted before save', () => {
    const request = buildProcessBendexRequest('order', 'box', [
      item({ quantity: 0, originalAssignedQuantity: 0, isNew: true }),
    ]);

    expect(request.itemList).toEqual([]);
  });

  it('returns deleted quantity to the available item quantity', () => {
    const availableItem = {
      id: 'key-1',
      name: 'FSJ1-003 (Pos 10)',
      trimName: 'FSJ1-003',
      position: '10',
      quantityLabel: '(Qty - 10)',
      description: 'Red',
      availableQuantity: 10,
    };

    expect(
      addReturnedQuantitiesToAvailableItems(
        [availableItem],
        [item({ quantity: 5, originalAssignedQuantity: 5 })],
      ),
    ).toEqual([
      { ...availableItem, availableQuantity: 15, quantityLabel: '(Qty - 15)' },
    ]);
  });
});
