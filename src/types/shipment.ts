export type ShipmentStatus = 'Pending' | 'Uploaded' | 'Failed';

export interface Shipment {
  id: string;
  bolNumber: string;
  date: string;
  status: ShipmentStatus;
  photoCount: number;
}
