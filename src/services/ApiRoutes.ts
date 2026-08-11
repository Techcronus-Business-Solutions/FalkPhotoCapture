const BASE_URL = 'http://192.168.1.162:8080/api';

export const API_ROUTES = {
  LOGIN: `${BASE_URL}/Login`,
  SHIPMENTS: `${BASE_URL}/postedSalesShipment`,
  IMAGE_UPLOAD: `${BASE_URL}/image?$expand=salesAttachment`,
  HOLD_LOCATION_OPTIONS: `${BASE_URL}/master-data/GetHoldLocationOptions`,
  HOLD_REASON_OPTIONS: `${BASE_URL}/master-data/GetHoldReasonOptions`,
  DRIVER_LIST: `${BASE_URL}/master-data/GetDriverList`,
  PANEL_BY_CSV: `${BASE_URL}/Order/GetPanelByCsv`,
  TRIM_BOX_BY_ORDER: `${BASE_URL}/Order/GetTrimBoxByOrderNumber`,
  SHIPMENT_DETAILS_BY_CSV: `${BASE_URL}/Order/GetShipmentDetailsByCSV`,
  SHIPMENT_DETAILS_BY_ORDER: `${BASE_URL}/Order/GetShipmentDetailsByOrderNo`,
  FULL_ORDER_DETAILS: `${BASE_URL}/Order/GetFullOrderDetails`,
  SCAN_SHIPMENT: `${BASE_URL}/Shipment/scan`,
} as const;
