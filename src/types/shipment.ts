export type ShipmentStatus = 'Ready to Ship' | 'Uploaded' | 'Offline';

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
  salesOrderNo?: string;
}

export interface ShipmentBOLImage {
  id: string;
  fileName: string;
  imageUrl: string;
}

export interface ShipmentBOLDetails {
  orderNumber?: string | null;
  csv?: string | null;
  customer?: string | null;
  shipToAddress?: string | null;
}

export interface ShipmentBOL {
  bol: string;
  csv: string;
  createdDate: string;
  modified: String;
  details?: ShipmentBOLDetails | null;
  panels: string[];
  trimBoxes: number[];
  images: ShipmentBOLImage[];
}
