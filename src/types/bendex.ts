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
  id: string;
  trimname: string;
  color: string;
  length: number;
  width: number;
}
