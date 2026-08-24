import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Camera } from 'react-native-camera-kit';
import Header from '../components/Header';
import CustomText from '../components/CustomText';
import CustomInput2 from '../components/CustomInput2';
import CustomDropdown from '../components/CustomDropdown';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import useBackHandler from '../hooks/useBackHandler';
import useCameraScanner from '../hooks/useCameraScanner';
import { displayValue, toDigitsOnly } from '../utils/input';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { apiClient } from '../services/apiClient';
import { API_ROUTES } from '../services/ApiRoutes';
import { getShipmentDetailsRequestConfig } from '../utils/shipmentDetails';
import type { ShippingDetailsResponseData } from '../types/shippingDetails';
import type {
  ShippingManagementNavigationProp,
  ScanCompletedResult,
} from '../navigation/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PanelData {
  entityType: string;
  csv: string;
  lastScanType: string;
  currentLocation: string;
  holdLocation: string;
  status: string;
  lastScanTime: string;
  created: string;
  modified: string;
}

type PanelStatus =
  | 'active'
  | 'hold'
  | 'not-found'
  | 'new-entity'
  | 'error'
  | null;

interface TrimBox {
  orderNumber: number;
  entityType: string;
  boxNumber: number;
  status: string;
  currentLocation: string;
  holdLocation: string;
  lastScanType?: string;
}

type TrimBoxStatus =
  | 'active'
  | 'partial-hold'
  | 'not-found'
  | 'new-entity'
  | 'error'
  | null;

// ─── Fetch result types ───────────────────────────────────────────────────────

interface PanelFetchResult {
  orderExists: boolean;
  shipmentData: ShippingDetailsResponseData | null;
  panelData: PanelData | null;
  panelStatus: PanelStatus;
}

interface TrimBoxFetchResult {
  orderExists: boolean;
  shipmentData: ShippingDetailsResponseData | null;
  trimBoxList: TrimBox[];
  trimBoxStatus: TrimBoxStatus;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatScanTime = (iso: string): string => {
  if (!iso || iso.startsWith('0001')) return '—';
  return new Date(iso).toLocaleString();
};

const getLocationDisplay = (
  data: PanelData,
): { label: string; value: string } => {
  const useHold =
    (data.lastScanType === 'QA Hold' || data.lastScanType === 'Release Hold') &&
    !!data.holdLocation;
  return useHold
    ? { label: 'Hold Location', value: data.holdLocation }
    : { label: 'Current Location', value: data.currentLocation };
};

const getBoxLocation = (box: TrimBox): string =>
  box.status === 'QA Hold' ? box.holdLocation : box.currentLocation;

// ─── Constants ───────────────────────────────────────────────────────────────

const ENTRY_TYPES = [
  { label: 'Panel', value: 'Panel' },
  { label: 'Trim Box', value: 'Trim Box' },
];

// ─── Screen ──────────────────────────────────────────────────────────────────

const ShippingManagementScreen: React.FC<{
  navigation: ShippingManagementNavigationProp;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const handleBack = useBackHandler(navigation);
  const { isConnected } = useNetworkStatus();

  const [entryType, setEntryType] = useState('Panel');
  const [csvNumber, setCsvNumber] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const { scannerVisible, openScanner, closeScanner } = useCameraScanner();

  // Whether the base order/CSV was confirmed to exist by the Shipment Details API.
  // null = not yet determined, true = exists, false = does not exist.
  const [orderExists, setOrderExists] = useState<boolean | null>(null);
  const [shipmentDetailsData, setShipmentDetailsData] =
    useState<ShippingDetailsResponseData | null>(null);

  const [panelStatus, setPanelStatus] = useState<PanelStatus>(null);
  const [panelData, setPanelData] = useState<PanelData | null>(null);
  const [panelMessage, setPanelMessage] = useState('');
  const [panelLoading, setPanelLoading] = useState(false);

  const [trimBoxStatus, setTrimBoxStatus] = useState<TrimBoxStatus>(null);
  const [trimBoxList, setTrimBoxList] = useState<TrimBox[]>([]);
  const [trimBoxMessage, setTrimBoxMessage] = useState('');
  const [trimBoxLoading, setTrimBoxLoading] = useState(false);

  // Prevents the focus listener from re-fetching immediately after returning
  // from ScanTypeScreen (the screen updates state via the onScanComplete callback instead).
  const skipNextFocusRefetchRef = useRef(false);

  // In-flight guards to prevent concurrent duplicate fetches.
  const panelFetchInFlightRef = useRef(false);
  const trimBoxFetchInFlightRef = useRef(false);

  const [scanTypeNavigationLoading, setScanTypeNavigationLoading] =
    useState(false);
  const [viewShippingDetailsLoading, setViewShippingDetailsLoading] =
    useState(false);

  useEffect(() => {
    setCsvNumber('');
    setOrderNumber('');
    setOrderExists(null);
    setShipmentDetailsData(null);
    setPanelStatus(null);
    setPanelData(null);
    setPanelMessage('');
    setTrimBoxStatus(null);
    setTrimBoxList([]);
    setTrimBoxMessage('');
  }, [entryType]);

  // ─── Combined fetch: Shipment Details → Panel Status ─────────────────────
  // Determines order existence (Shipment Details API) then fetches panel scan
  // history (Panel Status API). Returns the resolved result for use in button
  // handlers that may call this if the user hasn't searched yet.

  const fetchPanelWithDetails = useCallback(
    async (csv: string): Promise<PanelFetchResult> => {
      const empty: PanelFetchResult = {
        orderExists: false,
        shipmentData: null,
        panelData: null,
        panelStatus: null,
      };

      if (!csv.trim()) return empty;
      if (panelFetchInFlightRef.current) return empty;

      if (!isConnected) {
        Toast.show({
          type: 'error',
          text1: 'No Internet',
          text2: 'Please check your internet connection.',
        });
        return empty;
      }

      panelFetchInFlightRef.current = true;
      Keyboard.dismiss();
      setPanelData(null);
      setPanelStatus(null);
      setPanelMessage('');
      setOrderExists(null);
      setShipmentDetailsData(null);
      setPanelLoading(true);

      try {
        // Step 1 — Shipment Details API (source of truth for order existence)
        const { endpoint } = getShipmentDetailsRequestConfig('Panel', csv);
        const detailRes = await apiClient.get(endpoint);
        const detailJson = await detailRes.json();

        if (!detailJson.success || !detailJson.data) {
          const msg = detailJson.message || 'Order not found.';
          setOrderExists(false);
          setPanelMessage(msg);
          setPanelStatus('not-found');
          return {
            orderExists: false,
            shipmentData: null,
            panelData: null,
            panelStatus: 'not-found',
          };
        }

        const shipmentData = detailJson.data as ShippingDetailsResponseData;
        setOrderExists(true);
        setShipmentDetailsData(shipmentData);

        // Step 2 — Panel Status API (scan history only; failure = new panel)
        const statusRes = await apiClient.get(
          `${API_ROUTES.PANEL_BY_CSV}/${csv.trim()}`,
        );
        const statusJson = await statusRes.json();

        if (statusJson.success && statusJson.data) {
          const pd = statusJson.data as PanelData;
          const pStatus: PanelStatus =
            pd.status === 'QA Hold' ? 'hold' : 'active';
          setPanelData(pd);
          setPanelStatus(pStatus);
          return {
            orderExists: true,
            shipmentData,
            panelData: pd,
            panelStatus: pStatus,
          };
        } else {
          const msg =
            statusJson.message || 'No previous scan found for this panel.';
          setPanelMessage(msg);
          setPanelStatus('new-entity');
          return {
            orderExists: true,
            shipmentData,
            panelData: null,
            panelStatus: 'new-entity',
          };
        }
      } catch {
        setPanelMessage('Failed to fetch panel status. Please try again.');
        setPanelStatus('error');
        setOrderExists(false);
        return { ...empty, panelStatus: 'error' };
      } finally {
        panelFetchInFlightRef.current = false;
        setPanelLoading(false);
      }
    },
    [isConnected],
  );

  // ─── Combined fetch: Shipment Details → Trim Box Status ──────────────────

  const fetchTrimBoxWithDetails = useCallback(
    async (order: string): Promise<TrimBoxFetchResult> => {
      const empty: TrimBoxFetchResult = {
        orderExists: false,
        shipmentData: null,
        trimBoxList: [],
        trimBoxStatus: null,
      };

      if (!order.trim()) return empty;
      if (trimBoxFetchInFlightRef.current) return empty;

      if (!isConnected) {
        Toast.show({
          type: 'error',
          text1: 'No Internet',
          text2: 'Please check your internet connection.',
        });
        return empty;
      }

      trimBoxFetchInFlightRef.current = true;
      Keyboard.dismiss();
      setTrimBoxList([]);
      setTrimBoxStatus(null);
      setTrimBoxMessage('');
      setOrderExists(null);
      setShipmentDetailsData(null);
      setTrimBoxLoading(true);

      try {
        // Step 1 — Shipment Details API
        const { endpoint } = getShipmentDetailsRequestConfig('Trim Box', order);
        const detailRes = await apiClient.get(endpoint);
        const detailJson = await detailRes.json();

        if (!detailJson.success || !detailJson.data) {
          const msg = detailJson.message || 'Order not found.';
          setOrderExists(false);
          setTrimBoxMessage(msg);
          setTrimBoxStatus('not-found');
          return {
            orderExists: false,
            shipmentData: null,
            trimBoxList: [],
            trimBoxStatus: 'not-found',
          };
        }

        const shipmentData = detailJson.data as ShippingDetailsResponseData;
        setOrderExists(true);
        setShipmentDetailsData(shipmentData);

        // Step 2 — Trim Box Status API (failure = new trim box)
        const statusRes = await apiClient.get(
          `${API_ROUTES.TRIM_BOX_BY_ORDER}/${order.trim()}`,
        );
        const statusJson = await statusRes.json();

        if (statusJson.success && (statusJson.data as TrimBox[]).length > 0) {
          const sorted = [...(statusJson.data as TrimBox[])].sort(
            (a, b) => a.boxNumber - b.boxNumber,
          );
          const hasHold = sorted.some(b => b.status === 'QA Hold');
          const tbStatus: TrimBoxStatus = hasHold ? 'partial-hold' : 'active';
          setTrimBoxList(sorted);
          setTrimBoxStatus(tbStatus);
          return {
            orderExists: true,
            shipmentData,
            trimBoxList: sorted,
            trimBoxStatus: tbStatus,
          };
        } else {
          const msg =
            statusJson.message || 'No previous scan found for this order.';
          setTrimBoxMessage(msg);
          setTrimBoxStatus('new-entity');
          return {
            orderExists: true,
            shipmentData,
            trimBoxList: [],
            trimBoxStatus: 'new-entity',
          };
        }
      } catch {
        setTrimBoxMessage('Failed to fetch trim box status. Please try again.');
        setTrimBoxStatus('error');
        setOrderExists(false);
        return { ...empty, trimBoxStatus: 'error' };
      } finally {
        trimBoxFetchInFlightRef.current = false;
        setTrimBoxLoading(false);
      }
    },
    [isConnected],
  );

  // ─── Focus listener ───────────────────────────────────────────────────────

  const onFocusRef = useRef<() => void>(() => {});
  useEffect(() => {
    onFocusRef.current = () => {
      if (skipNextFocusRefetchRef.current) {
        skipNextFocusRefetchRef.current = false;
        return;
      }
      if (entryType === 'Panel' && csvNumber.trim()) {
        fetchPanelWithDetails(csvNumber);
      } else if (entryType === 'Trim Box' && orderNumber.trim()) {
        fetchTrimBoxWithDetails(orderNumber);
      }
    };
  });

  useEffect(() => {
    return navigation.addListener('focus', () => onFocusRef.current());
  }, [navigation]);

  // ─── Barcode scanner ─────────────────────────────────────────────────────

  const handleReadCode = useCallback(
    (event: { nativeEvent: { codeStringValue: string } }) => {
      const scanned = event.nativeEvent.codeStringValue;
      if (!scanned) return;

      if (entryType === 'Panel') {
        setCsvNumber(scanned);
        closeScanner();
        fetchPanelWithDetails(scanned);
      } else {
        setOrderNumber(scanned);
        closeScanner();
        fetchTrimBoxWithDetails(scanned);
      }
    },
    [entryType, fetchPanelWithDetails, fetchTrimBoxWithDetails, closeScanner],
  );

  const handleBarcodePress = openScanner;

  // ─── Apply scan result (callback from ScanTypeScreen) ────────────────────
  // Updates local state directly so no redundant API call is needed on return.
  // Handles first-time scans where panelData was null / trimBoxList was empty.

  const applyScanResult = useCallback(
    (result: ScanCompletedResult) => {
      if (result.entityType === 'Panel') {
        setPanelData(prev => {
          const base: PanelData = prev ?? {
            entityType: 'Panel',
            csv: result.csv,
            lastScanType: '',
            currentLocation: '',
            holdLocation: '',
            status: '',
            lastScanTime: '',
            created: new Date().toISOString(),
            modified: '',
          };
          const updated: PanelData = {
            ...base,
            lastScanType: result.scanType,
            modified: new Date().toISOString(),
          };
          if (result.scanType === 'QA Hold') {
            updated.status = 'QA Hold';
            updated.holdLocation = result.holdLocation;
          } else if (result.scanType === 'Load') {
            updated.status = 'Loaded';
            updated.currentLocation = result.location;
            updated.holdLocation = '';
          } else if (result.scanType === 'Move') {
            updated.status = 'Active';
            updated.currentLocation = result.location;
            updated.holdLocation = '';
          } else if (result.scanType === 'Ship') {
            updated.status = 'Shipped';
            updated.currentLocation = '';
            updated.holdLocation = '';
          } else if (result.scanType === 'Release Hold') {
            updated.status = 'Active';
            updated.currentLocation = result.location;
            updated.holdLocation = '';
          }
          return updated;
        });
        setPanelStatus(result.scanType === 'QA Hold' ? 'hold' : 'active');
      } else {
        const boxNum = Number(result.boxNumber);
        const prevList = trimBoxList;
        const exists = prevList.some(b => b.boxNumber === boxNum);
        const baseList: TrimBox[] = exists
          ? prevList
          : [
              ...prevList,
              {
                orderNumber: Number(result.orderNumber) || 0,
                entityType: 'Trim Box',
                boxNumber: boxNum,
                status: '',
                currentLocation: '',
                holdLocation: '',
                lastScanType: '',
              },
            ];

        const updatedList = baseList.map(b => {
          if (b.boxNumber !== boxNum) return b;
          const u: TrimBox = { ...b, lastScanType: result.scanType };
          if (result.scanType === 'QA Hold') {
            u.status = 'QA Hold';
            u.holdLocation = result.holdLocation;
          } else if (result.scanType === 'Load') {
            u.status = 'Loaded';
            u.currentLocation = result.location;
            u.holdLocation = '';
          } else if (result.scanType === 'Move') {
            u.status = 'Active';
            u.currentLocation = result.location;
            u.holdLocation = '';
          } else if (result.scanType === 'Ship') {
            u.status = 'Shipped';
            u.currentLocation = '';
            u.holdLocation = '';
          } else if (result.scanType === 'Release Hold') {
            u.status = 'Active';
            u.currentLocation = result.location;
            u.holdLocation = '';
          }
          return u;
        });

        setTrimBoxList(updatedList);
        const hasHold = updatedList.some(b => b.status === 'QA Hold');
        setTrimBoxStatus(hasHold ? 'partial-hold' : 'active');
      }
    },
    [trimBoxList],
  );

  // ─── Scan Type button handler ─────────────────────────────────────────────
  // Allows navigation when the base order exists, even if no scan history yet.
  // Blocks only when the order genuinely does not exist.

  const handleScanTypePress = useCallback(async () => {
    if (scanTypeNavigationLoading) return;

    const identifier = entryType === 'Panel' ? csvNumber : orderNumber;
    if (!identifier.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a valid identifier.',
      });
      return;
    }

    setScanTypeNavigationLoading(true);

    try {
      let resolvedOrderExists = orderExists;
      let resolvedPanelData = panelData;
      let resolvedTrimBoxList = trimBoxList;
      let resolvedShipmentData = shipmentDetailsData;

      if (resolvedOrderExists === null) {
        if (entryType === 'Panel') {
          const res = await fetchPanelWithDetails(csvNumber);
          resolvedOrderExists = res.orderExists;
          resolvedPanelData = res.panelData;
          resolvedShipmentData = res.shipmentData;
        } else {
          const res = await fetchTrimBoxWithDetails(orderNumber);
          resolvedOrderExists = res.orderExists;
          resolvedTrimBoxList = res.trimBoxList;
        }
      }

      if (!resolvedOrderExists) return;

      skipNextFocusRefetchRef.current = true;
      navigation.navigate('ScanType', {
        entityType: entryType as 'Panel' | 'Trim Box',
        csv: entryType === 'Panel' ? csvNumber : '',
        orderNumber:
          entryType === 'Panel'
            ? resolvedShipmentData?.orderNumber ?? ''
            : orderNumber,
        panelCurrentStatus: resolvedPanelData?.status ?? '',
        panelLastScanType: resolvedPanelData?.lastScanType ?? '',
        trimBoxStatuses: resolvedTrimBoxList.map(b => ({
          boxNumber: b.boxNumber,
          status: b.status,
          lastScanType: b.lastScanType,
        })),
        onScanComplete: applyScanResult,
      });
    } finally {
      setScanTypeNavigationLoading(false);
    }
  }, [
    scanTypeNavigationLoading,
    entryType,
    csvNumber,
    orderNumber,
    orderExists,
    shipmentDetailsData,
    panelData,
    trimBoxList,
    navigation,
    applyScanResult,
    fetchPanelWithDetails,
    fetchTrimBoxWithDetails,
  ]);

  // ─── View Shipping Details button handler ─────────────────────────────────

  const handleViewShippingDetailsPress = useCallback(async () => {
    if (viewShippingDetailsLoading) return;

    const identifier = entryType === 'Panel' ? csvNumber : orderNumber;
    if (!identifier.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a valid identifier.',
      });
      return;
    }

    setViewShippingDetailsLoading(true);

    try {
      let resolvedOrderExists = orderExists;
      let resolvedShipmentData = shipmentDetailsData;

      if (resolvedOrderExists === null) {
        if (entryType === 'Panel') {
          const res = await fetchPanelWithDetails(csvNumber);
          resolvedOrderExists = res.orderExists;
          resolvedShipmentData = res.shipmentData;
        } else {
          const res = await fetchTrimBoxWithDetails(orderNumber);
          resolvedOrderExists = res.orderExists;
          resolvedShipmentData = res.shipmentData;
        }
      }

      navigation.navigate('ShippingDetails', {
        entityType: entryType === 'Panel' ? 'Panel' : 'Trim Box',
        identifier,
        shipmentDetails: resolvedOrderExists ? resolvedShipmentData : null,
      });
    } finally {
      setViewShippingDetailsLoading(false);
    }
  }, [
    viewShippingDetailsLoading,
    entryType,
    csvNumber,
    orderNumber,
    orderExists,
    shipmentDetailsData,
    navigation,
    fetchPanelWithDetails,
    fetchTrimBoxWithDetails,
  ]);

  // ─── Trim Box status card ─────────────────────────────────────────────────

  const renderTrimBoxStatusCard = () => {
    if (trimBoxLoading) {
      return (
        <View style={styles.panelStatusCard}>
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={styles.panelLoader}
          />
        </View>
      );
    }

    if (trimBoxStatus === null) return null;

    if (trimBoxStatus === 'not-found' || trimBoxStatus === 'error') {
      return (
        <View style={styles.panelStatusCard}>
          <View style={[styles.panelTopRow, { marginBottom: 0 }]}>
            <Ionicons
              style={styles.panelIconWrapper}
              name="close-circle"
              size={wp(10)}
              color={COLORS.failed}
            />
            <View style={styles.panelTextWrapper}>
              <CustomText
                size={FontSize.normalLargeText}
                color={COLORS.failed}
                weight="semibold"
              >
                Not Found
              </CustomText>
              <CustomText size={FontSize.smallText} color={COLORS.greyText}>
                {trimBoxMessage}
              </CustomText>
            </View>
          </View>
        </View>
      );
    }

    if (trimBoxStatus === 'new-entity') {
      return (
        <View style={styles.panelStatusCard}>
          <View style={[styles.panelTopRow, { marginBottom: 0 }]}>
            <Ionicons
              style={styles.panelIconWrapper}
              name="scan-outline"
              size={wp(10)}
              color={COLORS.primary}
            />
            <View style={styles.panelTextWrapper}>
              <CustomText
                size={FontSize.normalLargeText}
                color={COLORS.primary}
                weight="semibold"
              >
                New Trim Box — Ready for First Scan
              </CustomText>
              {/* <CustomText size={FontSize.smallText} color={COLORS.greyText}>
                {trimBoxMessage}
              </CustomText> */}
            </View>
          </View>
        </View>
      );
    }

    const isAllActive = trimBoxStatus === 'active';
    const bannerColor = isAllActive ? COLORS.uploaded : COLORS.orange;
    const bannerText = isAllActive
      ? `ACTIVE — ${trimBoxList.length} BOXES`
      : `BOXES FOUND — ${trimBoxList.length} (PARTIAL HOLD)`;

    return (
      <View style={styles.panelStatusCard}>
        <View style={styles.panelTopRow}>
          <Ionicons
            style={styles.panelIconWrapper}
            name={isAllActive ? 'checkmark-circle' : 'alert-circle'}
            size={wp(10)}
            color={bannerColor}
          />
          <View style={styles.panelTextWrapper}>
            <CustomText
              size={FontSize.normalLargeText}
              color={bannerColor}
              weight="semibold"
            >
              {bannerText}
            </CustomText>
          </View>
        </View>
        {trimBoxList.map(box => (
          <View key={box.boxNumber} style={styles.tripBoxRow}>
            <View style={styles.tripBoxIconWrapper}>
              <Ionicons
                name="cube-outline"
                size={wp(8)}
                color={COLORS.primary}
              />
            </View>
            <View style={styles.tripBoxTextWrapper}>
              <CustomText
                size={FontSize.smallText}
                color={COLORS.black}
                weight="semibold"
              >
                {`Box ${box.boxNumber}`}
              </CustomText>
              <CustomText size={FontSize.normalText} color={COLORS.black}>
                Status: {displayValue(box.status) as string}
              </CustomText>
              <CustomText size={FontSize.normalText} color={COLORS.greyText}>
                Location: {displayValue(getBoxLocation(box)) as string}
              </CustomText>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // ─── Panel data rows (shared between active and hold cards) ──────────────

  const renderPanelDataRows = (data: PanelData) => (
    <>
      <View style={styles.divider} />
      <View style={styles.panelDataRow}>
        <Ionicons
          name="trending-up-outline"
          size={wp(8)}
          color={COLORS.primary}
          style={styles.panelDataIcon}
        />
        <View style={styles.panelDataText}>
          <CustomText size={FontSize.smallText} color={COLORS.greyText}>
            Status
          </CustomText>
          <CustomText
            size={FontSize.normalText}
            color={COLORS.black}
            weight="semibold"
          >
            {displayValue(data.status) as string}
          </CustomText>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.panelDataRow}>
        <Ionicons
          name="scan-outline"
          size={wp(8)}
          color={COLORS.primary}
          style={styles.panelDataIcon}
        />
        <View style={styles.panelDataText}>
          <CustomText size={FontSize.smallText} color={COLORS.greyText}>
            Last Scan Type
          </CustomText>
          <CustomText
            size={FontSize.normalText}
            color={COLORS.black}
            weight="semibold"
          >
            {displayValue(data.lastScanType) as string}
          </CustomText>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.panelDataRow}>
        <Ionicons
          name="calendar-outline"
          size={wp(8)}
          color={COLORS.primary}
          style={styles.panelDataIcon}
        />
        <View style={styles.panelDataText}>
          <CustomText size={FontSize.smallText} color={COLORS.greyText}>
            Last Scan Time
          </CustomText>
          <CustomText
            size={FontSize.normalText}
            color={COLORS.black}
            weight="semibold"
          >
            {formatScanTime(data.modified)}
          </CustomText>
        </View>
      </View>
    </>
  );

  // ─── Panel status card ────────────────────────────────────────────────────

  const renderPanelStatusCard = () => {
    if (panelLoading) {
      return (
        <View style={styles.panelStatusCard}>
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={styles.panelLoader}
          />
        </View>
      );
    }

    if (panelStatus === null) return null;

    if (panelStatus === 'not-found' || panelStatus === 'error') {
      return (
        <View style={styles.panelStatusCard}>
          <View style={[styles.panelTopRow, { marginBottom: 0 }]}>
            <Ionicons
              style={styles.panelIconWrapper}
              name="close-circle"
              size={wp(10)}
              color={COLORS.failed}
            />
            <View style={styles.panelTextWrapper}>
              <CustomText
                size={FontSize.normalLargeText}
                color={COLORS.failed}
                weight="semibold"
              >
                Not Found
              </CustomText>
              <CustomText size={FontSize.smallText} color={COLORS.greyText}>
                {panelMessage}
              </CustomText>
            </View>
          </View>
        </View>
      );
    }

    if (panelStatus === 'new-entity') {
      return (
        <View style={styles.panelStatusCard}>
          <View style={[styles.panelTopRow, { marginBottom: 0 }]}>
            <Ionicons
              style={styles.panelIconWrapper}
              name="scan-outline"
              size={wp(10)}
              color={COLORS.primary}
            />
            <View style={styles.panelTextWrapper}>
              <CustomText
                size={FontSize.normalLargeText}
                color={COLORS.primary}
                weight="semibold"
              >
                New Panel — Ready for First Scan
              </CustomText>
              {/* <CustomText size={FontSize.smallText} color={COLORS.greyText}>
                {panelMessage}
              </CustomText> */}
            </View>
          </View>
        </View>
      );
    }

    if (panelStatus === 'hold' && panelData) {
      return (
        <View style={styles.panelStatusCard}>
          <View style={styles.panelTopRow}>
            <Ionicons
              style={styles.panelIconWrapper}
              name="alert-circle"
              size={wp(10)}
              color={COLORS.orange}
            />
            <View style={styles.panelTextWrapper}>
              <CustomText
                size={FontSize.normalLargeText}
                color={COLORS.orange}
                weight="semibold"
              >
                On Hold
              </CustomText>
              <CustomText size={FontSize.smallText} color={COLORS.greyText}>
                {`Hold location: ${displayValue(panelData.holdLocation)}`}
              </CustomText>
            </View>
          </View>
          {renderPanelDataRows(panelData)}
        </View>
      );
    }

    if (panelStatus === 'active' && panelData) {
      const loc = getLocationDisplay(panelData);
      return (
        <View style={styles.panelStatusCard}>
          <View style={styles.panelTopRow}>
            <Ionicons
              style={styles.panelIconWrapper}
              name="checkmark-circle"
              size={wp(10)}
              color={COLORS.uploaded}
            />
            <View style={styles.panelTextWrapper}>
              <CustomText
                size={FontSize.normalLargeText}
                color={COLORS.uploaded}
                weight="semibold"
              >
                {`Active`}
              </CustomText>
              <CustomText size={FontSize.smallText} color={COLORS.greyText}>
                {`${loc.label}: ${displayValue(loc.value)}`}
              </CustomText>
            </View>
          </View>
          {renderPanelDataRows(panelData)}
        </View>
      );
    }

    return null;
  };

  // ─── JSX ─────────────────────────────────────────────────────────────────

  const scanTypeBlocked = orderExists === false;

  return (
    <View style={styles.root}>
      <Header
        title="Shipping Management"
        leftIconName="arrow-back"
        onLeftPress={handleBack}
      />

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.headerSection}>
            <View style={styles.headerIconWrapper}>
              <Ionicons
                name="layers-outline"
                size={wp(8)}
                color={COLORS.primary}
              />
            </View>
            <View style={styles.headerTextWrapper}>
              <CustomText
                size={FontSize.mediumLargeText}
                color={COLORS.black}
                weight="semibold"
              >
                Select Entity Type
              </CustomText>
              <CustomText size={FontSize.smallText} color={COLORS.greyText}>
                Choose the type of item you want to process
              </CustomText>
            </View>
          </View>

          <CustomDropdown
            label="Entity Type"
            placeholder="Panel"
            options={ENTRY_TYPES}
            value={entryType}
            onValueChange={setEntryType}
          />

          {entryType === 'Panel' && (
            <CustomInput2
              label="CSV Number"
              placeholder=""
              value={csvNumber}
              onChangeText={setCsvNumber}
              rightIconName="barcode-outline"
              onRightPress={handleBarcodePress}
              returnKeyType="search"
              onSubmitEditing={() => fetchPanelWithDetails(csvNumber)}
            />
          )}

          {entryType === 'Trim Box' && (
            <>
              <CustomInput2
                label="Order Number"
                placeholder=""
                value={orderNumber}
                onChangeText={v => setOrderNumber(toDigitsOnly(v))}
                keyboardType="number-pad"
                rightIconName="barcode-outline"
                onRightPress={handleBarcodePress}
                returnKeyType="search"
                onSubmitEditing={() => fetchTrimBoxWithDetails(orderNumber)}
              />
            </>
          )}
        </View>

        {entryType === 'Panel'
          ? renderPanelStatusCard()
          : renderTrimBoxStatusCard()}
      </ScrollView>

      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + wp(2) }]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.actionButton,
            styles.leftButton,
            (scanTypeNavigationLoading || scanTypeBlocked) &&
              styles.disabledOpacity,
          ]}
          onPress={handleScanTypePress}
          disabled={scanTypeNavigationLoading || scanTypeBlocked}
        >
          {scanTypeNavigationLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <CustomText
              size={FontSize.normalText}
              color={COLORS.primary}
              weight="semibold"
            >
              Scan Type
            </CustomText>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.actionButton,
            styles.primaryAction,
            (viewShippingDetailsLoading || scanTypeBlocked) &&
              styles.disabledOpacity,
          ]}
          onPress={handleViewShippingDetailsPress}
          disabled={viewShippingDetailsLoading || scanTypeBlocked}
        >
          {viewShippingDetailsLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <CustomText
              size={FontSize.normalText}
              color={COLORS.white}
              weight="semibold"
            >
              View Shipping Details
            </CustomText>
          )}
        </TouchableOpacity>
      </View>

      {scannerVisible && (
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerPopup}>
            <Camera
              style={styles.camera}
              scanBarcode
              showFrame
              resizeMode="cover"
              laserColor={COLORS.white}
              frameColor={COLORS.primary}
              ratioOverlay="1:1"
              ratioOverlayColor="rgba(0,0,0,0.5)"
              onReadCode={handleReadCode}
            />
            <TouchableOpacity
              style={styles.scannerClose}
              onPress={closeScanner}
            >
              <CustomText size={FontSize.normalLargeText} color={COLORS.white}>
                Close
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contentContainer: {
    padding: wp(4),
    paddingBottom: wp(26),
    flexGrow: 1,
  },
  card: {
    borderRadius: wp(4),
    marginVertical: wp(4),
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: wp(3),
    padding: wp(4),
    borderWidth: wp(0.3),
    borderColor: COLORS.border,
  },
  panelStatusCard: {
    backgroundColor: COLORS.white,
    borderRadius: wp(3),
    padding: wp(4),
    borderWidth: wp(0.3),
    borderColor: COLORS.border,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: wp(4),
  },
  statusTextWrapper: {
    marginLeft: wp(3),
    flex: 1,
  },
  panelTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: wp(4),
  },
  panelIconWrapper: {
    marginRight: wp(3),
  },
  panelTextWrapper: {
    flex: 1,
  },
  panelDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: wp(3),
  },
  panelDataIcon: {
    marginRight: wp(3),
  },
  panelDataText: {
    flex: 1,
    marginLeft: wp(2),
  },
  divider: {
    height: wp(0.5),
    backgroundColor: COLORS.border,
  },
  panelLoader: {
    marginVertical: wp(4),
  },
  tripBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: wp(3),
    borderTopWidth: wp(0.5),
    borderTopColor: COLORS.border,
  },
  tripBoxIconWrapper: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(3),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  tripBoxTextWrapper: {
    flex: 1,
  },
  detailList: {
    marginTop: wp(2),
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: wp(10),
  },
  headerIconWrapper: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(3),
    backgroundColor: COLORS.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  headerTextWrapper: {
    flex: 1,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: wp(2),
    borderTopWidth: wp(0.5),
    borderTopColor: COLORS.border,
  },
  detailIconWrapper: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(3),
    backgroundColor: COLORS.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  detailTextWrapper: {
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: wp(4),
    paddingTop: wp(3),
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    height: wp(10),
    borderRadius: wp(2),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlue,
  },
  leftButton: {
    marginRight: wp(3),
  },
  primaryAction: {
    backgroundColor: COLORS.primary,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerPopup: {
    width: '90%',
    height: wp(60),
    borderRadius: wp(4),
    overflow: 'hidden',
    backgroundColor: COLORS.black,
  },
  camera: {
    flex: 1,
  },
  scannerClose: {
    paddingVertical: wp(3),
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  disabledOpacity: {
    opacity: 0.6,
  },
});

export default ShippingManagementScreen;
