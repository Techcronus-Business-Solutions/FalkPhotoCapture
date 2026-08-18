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

type PanelStatus = 'active' | 'hold' | 'not-found' | 'error' | null;

interface TrimBox {
  orderNumber: number;
  entityType: string;
  boxNumber: number;
  status: string;
  currentLocation: string;
  holdLocation: string;
  lastScanType?: string;
}

type TrimBoxStatus = 'active' | 'partial-hold' | 'not-found' | 'error' | null;

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

  // Loading state for when user taps Scan Type button and we're fetching status before navigation
  const [scanTypeNavigationLoading, setScanTypeNavigationLoading] =
    useState(false);

  // Loading state for when user taps View Shipping Details button and we're fetching status before navigation
  const [viewShippingDetailsLoading, setViewShippingDetailsLoading] =
    useState(false);

  useEffect(() => {
    setCsvNumber('');
    setOrderNumber('');
    setPanelStatus(null);
    setPanelData(null);
    setPanelMessage('');
    setTrimBoxStatus(null);
    setTrimBoxList([]);
    setTrimBoxMessage('');
  }, [entryType]);

  // Keep a ref with the latest refresh logic so the focus listener never goes stale
  const onFocusRef = useRef<() => void>(() => {});
  useEffect(() => {
    onFocusRef.current = () => {
      if (skipNextFocusRefetchRef.current) {
        skipNextFocusRefetchRef.current = false;
        return;
      }
      if (entryType === 'Panel' && csvNumber.trim()) {
        fetchPanelStatus(csvNumber);
      } else if (entryType === 'Trim Box' && orderNumber.trim()) {
        fetchTrimBoxStatus(orderNumber);
      }
    };
  });

  useEffect(() => {
    return navigation.addListener('focus', () => onFocusRef.current());
  }, [navigation]);

  const fetchPanelStatus = useCallback(
    async (csv: string): Promise<boolean> => {
      if (!csv.trim() || panelLoading) return false;

      if (!isConnected) {
        Toast.show({
          type: 'error',
          text1: 'No Internet',
          text2: 'Please check your internet connection.',
        });
        return false;
      }

      Keyboard.dismiss();
      setPanelData(null);
      setPanelStatus(null);
      setPanelMessage('');
      setPanelLoading(true);

      try {
        const res = await apiClient.get(
          `${API_ROUTES.PANEL_BY_CSV}/${csv.trim()}`,
        );
        const json = await res.json();

        if (json.success) {
          const data = json.data as PanelData;
          setPanelData(data);
          setPanelStatus(data.status === 'QA Hold' ? 'hold' : 'active');
          return true;
        } else {
          setPanelMessage(json.message || 'Panel not found.');
          setPanelStatus('not-found');
          return false;
        }
      } catch {
        setPanelMessage('Failed to fetch panel status. Please try again.');
        setPanelStatus('error');
        return false;
      } finally {
        setPanelLoading(false);
      }
    },
    [isConnected, panelLoading],
  );

  const fetchTrimBoxStatus = useCallback(
    async (order: string): Promise<boolean> => {
      if (!order.trim() || trimBoxLoading) return false;

      if (!isConnected) {
        Toast.show({
          type: 'error',
          text1: 'No Internet',
          text2: 'Please check your internet connection.',
        });
        return false;
      }

      Keyboard.dismiss();
      setTrimBoxList([]);
      setTrimBoxStatus(null);
      setTrimBoxMessage('');
      setTrimBoxLoading(true);

      try {
        const res = await apiClient.get(
          `${API_ROUTES.TRIM_BOX_BY_ORDER}/${order.trim()}`,
        );
        const json = await res.json();

        if (json.success && (json.data as TrimBox[]).length > 0) {
          const sorted = [...(json.data as TrimBox[])].sort(
            (a, b) => a.boxNumber - b.boxNumber,
          );
          setTrimBoxList(sorted);
          const hasHold = sorted.some(b => b.status === 'QA Hold');
          setTrimBoxStatus(hasHold ? 'partial-hold' : 'active');
          return true;
        } else {
          setTrimBoxMessage(json.message || 'No trim boxes found.');
          setTrimBoxStatus('not-found');
          return false;
        }
      } catch {
        setTrimBoxMessage('Failed to fetch trim box status. Please try again.');
        setTrimBoxStatus('error');
        return false;
      } finally {
        setTrimBoxLoading(false);
      }
    },
    [isConnected, trimBoxLoading],
  );

  const handleReadCode = useCallback(
    (event: { nativeEvent: { codeStringValue: string } }) => {
      const scanned = event.nativeEvent.codeStringValue;
      if (!scanned) return;

      if (entryType === 'Panel') {
        setCsvNumber(scanned);
      } else {
        setOrderNumber(scanned);
      }

      closeScanner();

      if (entryType === 'Panel') {
        fetchPanelStatus(scanned);
      } else {
        fetchTrimBoxStatus(scanned);
      }
    },
    [entryType, fetchPanelStatus, fetchTrimBoxStatus, closeScanner],
  );

  const handleBarcodePress = openScanner;

  // Applies a successful scan result directly to local state, avoiding a redundant API call.
  const applyScanResult = useCallback(
    (result: ScanCompletedResult) => {
      if (result.entityType === 'Panel') {
        setPanelData(prev => {
          if (!prev) return prev;
          const updated: PanelData = {
            ...prev,
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
        const updatedList = trimBoxList.map(b => {
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

  // ─── Shared validation function ───────────────────────────────────────────
  // Validates that status data is available before navigation.
  // Returns true if status is valid and available, false otherwise.
  const validateStatusBeforeNavigation =
    useCallback(async (): Promise<boolean> => {
      const identifier = entryType === 'Panel' ? csvNumber : orderNumber;
      if (!identifier.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Please enter a valid identifier.',
        });
        return false;
      }

      if (entryType === 'Panel') {
        // If panel data is not available, fetch it
        if (!panelData) {
          const success = await fetchPanelStatus(csvNumber);
          if (!success) {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2:
                panelMessage ||
                'Unable to fetch panel status. Please try again.',
            });
          }
          return success;
        } else {
          // Data is already available, validate it's not in error state
          const isValid =
            panelStatus !== 'not-found' && panelStatus !== 'error';
          if (!isValid) {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2:
                panelMessage ||
                'Unable to fetch panel status. Please try again.',
            });
          }
          return isValid;
        }
      } else {
        // Trim Box case
        // If trim box list is empty, fetch it
        if (trimBoxList.length === 0) {
          const success = await fetchTrimBoxStatus(orderNumber);
          if (!success) {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2:
                trimBoxMessage ||
                'Unable to fetch trim box status. Please try again.',
            });
          }
          return success;
        } else {
          // Data is already available, validate it's not in error state
          const isValid =
            trimBoxStatus !== 'not-found' && trimBoxStatus !== 'error';
          if (!isValid) {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2:
                trimBoxMessage ||
                'Unable to fetch trim box status. Please try again.',
            });
          }
          return isValid;
        }
      }
    }, [
      entryType,
      csvNumber,
      orderNumber,
      panelData,
      panelStatus,
      panelMessage,
      trimBoxList,
      trimBoxStatus,
      trimBoxMessage,
      fetchPanelStatus,
      fetchTrimBoxStatus,
    ]);

  const handleScanTypePress = useCallback(async () => {
    // Prevent multiple taps while loading
    if (scanTypeNavigationLoading) return;

    setScanTypeNavigationLoading(true);

    try {
      const isValid = await validateStatusBeforeNavigation();
      if (!isValid) return;

      // If we reach here, status is available and valid
      // Now navigate to ScanTypeScreen with the latest data
      skipNextFocusRefetchRef.current = true;
      navigation.navigate('ScanType', {
        entityType: entryType as 'Panel' | 'Trim Box',
        csv: entryType === 'Panel' ? csvNumber : '',
        orderNumber: entryType === 'Trim Box' ? orderNumber : '',
        panelCurrentStatus: panelData?.status ?? '',
        panelLastScanType: panelData?.lastScanType ?? '',
        trimBoxStatuses: trimBoxList.map(b => ({
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
    panelData,
    trimBoxList,
    navigation,
    applyScanResult,
    validateStatusBeforeNavigation,
  ]);

  // ─── View Shipping Details handler ───────────────────────────────────────

  const handleViewShippingDetailsPress = useCallback(async () => {
    // Prevent multiple taps while loading
    if (viewShippingDetailsLoading) return;

    setViewShippingDetailsLoading(true);

    try {
      const isValid = await validateStatusBeforeNavigation();
      if (!isValid) return;

      // If we reach here, status is available and valid
      // Now navigate to ShippingDetails with the latest data
      const identifier = entryType === 'Panel' ? csvNumber : orderNumber;
      navigation.navigate('ShippingDetails', {
        entityType: entryType === 'Panel' ? 'Panel' : 'Trim Box',
        identifier,
      });
    } finally {
      setViewShippingDetailsLoading(false);
    }
  }, [
    viewShippingDetailsLoading,
    entryType,
    csvNumber,
    orderNumber,
    navigation,
    validateStatusBeforeNavigation,
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
              onSubmitEditing={() => fetchPanelStatus(csvNumber)}
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
                onSubmitEditing={() => fetchTrimBoxStatus(orderNumber)}
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
            scanTypeNavigationLoading && { opacity: 0.6 },
          ]}
          onPress={handleScanTypePress}
          disabled={scanTypeNavigationLoading}
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
            viewShippingDetailsLoading && { opacity: 0.6 },
          ]}
          onPress={handleViewShippingDetailsPress}
          disabled={viewShippingDetailsLoading}
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
});

export default ShippingManagementScreen;
