export type ShipmentStatus = 'Pending' | 'Uploaded' | 'Failed';

export interface ShipmentSharePointLink {
  attachmentNo: number;
  url1: string;
  fileName: string;
}

export interface Shipment {
  id: string;
  bolNumber: string;
  date: string;
  status: ShipmentStatus;
  photoCount: number;
  sharePointLinks: ShipmentSharePointLink[];
}
