export interface BendexItem {
  orderNumber: string;
  bendexOrderID: string;
  bendexOrderStatus: string;
  availableQuantity: number;
  quantity: number;
  title: string;
  trimName: string;
  boxNumber: number;
  color: string;
  position: string;
  length: number;
  width: number;
  bendexItemKey: string;
}

export interface BoxTrimCount {
  boxNumber: number;
  uniqueTrimCount: number;
}

export interface BendexAssignmentItem {
  boxNumber: number;
  orderNumber: string;
  bandexOrderID: string;
  assignedQuantity: number;
  availableQuantity: number;
  id: string;
  trimname: string;
  color: string;
  length: number;
  width: number;
  position: string;
  bendexItemKey: string;
}
