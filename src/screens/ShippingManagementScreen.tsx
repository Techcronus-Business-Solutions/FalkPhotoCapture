import React, { useState, useCallback, useEffect } from 'react';
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
import { toDigitsOnly } from '../utils/input';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { apiClient } from '../services/apiClient';
import { API_ROUTES } from '../services/ApiRoutes';
import type { ShippingManagementNavigationProp } from '../navigation/types';

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
}

type PanelStatus = 'active' | 'hold' | 'not-found' | 'error' | null;

interface TrimBox {
  orderNumber: number;
  entityType: string;
  boxNumber: number;
  status: string;
  currentLocation: string;
  holdLocation: string;
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
  { label: 'Trip Box', value: 'Trip Box' },
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

  const fetchPanelStatus = useCallback(
    async (csv: string) => {
      if (!csv.trim() || panelLoading) return;

      if (!isConnected) {
        Toast.show({
          type: 'error',
          text1: 'No Internet',
          text2: 'Please check your internet connection.',
        });
        return;
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
        } else {
          setPanelMessage(json.message || 'Panel not found.');
          setPanelStatus('not-found');
        }
      } catch {
        setPanelMessage('Failed to fetch panel status. Please try again.');
        setPanelStatus('error');
      } finally {
        setPanelLoading(false);
      }
    },
    [isConnected, panelLoading],
  );

  const fetchTrimBoxStatus = useCallback(
    async (order: string) => {
      if (!order.trim() || trimBoxLoading) return;

      if (!isConnected) {
        Toast.show({
          type: 'error',
          text1: 'No Internet',
          text2: 'Please check your internet connection.',
        });
        return;
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
        } else {
          setTrimBoxMessage(json.message || 'No trim boxes found.');
          setTrimBoxStatus('not-found');
        }
      } catch {
        setTrimBoxMessage('Failed to fetch trim box status. Please try again.');
        setTrimBoxStatus('error');
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

      setScannerVisible(false);

      if (entryType === 'Panel') {
        fetchPanelStatus(scanned);
      } else {
        fetchTrimBoxStatus(scanned);
      }
    },
    [entryType, fetchPanelStatus, fetchTrimBoxStatus],
  );

  const handleBarcodePress = openScanner;

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
                Status: {box.status}
              </CustomText>
              <CustomText size={FontSize.normalText} color={COLORS.greyText}>
                Location: {getBoxLocation(box)}
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
            {data.status}
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
            {data.lastScanType}
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
            {formatScanTime(data.lastScanTime)}
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
                {`Hold location: ${panelData.holdLocation}`}
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
                {`${loc.label}: ${loc.value}`}
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

          {entryType === 'Trip Box' && (
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
          style={[styles.actionButton, styles.leftButton]}
          onPress={() =>
            navigation.navigate('ScanType', {
              csvNumber:
                entryType === 'Panel'
                  ? 'CSV - ' + csvNumber
                  : 'Order - ' + orderNumber,
              entryType: entryType as 'Panel' | 'Trip Box',
            })
          }
        >
          <CustomText
            size={FontSize.normalText}
            color={COLORS.primary}
            weight="semibold"
          >
            Scan Type
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.actionButton, styles.primaryAction]}
          onPress={() => {
            const identifier = entryType === 'Panel' ? csvNumber : orderNumber;
            if (!identifier.trim()) {
              Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2:
                  'Please enter a valid identifier before viewing shipment details.',
              });
              return;
            }

            navigation.navigate('ShippingDetails', {
              entityType: entryType === 'Panel' ? 'Panel' : 'Trip Box',
              identifier,
            });
          }}
        >
          <CustomText
            size={FontSize.normalText}
            color={COLORS.white}
            weight="semibold"
          >
            View Shipping Details
          </CustomText>
        </TouchableOpacity>
      </View>

      {scannerVisible && (
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerPopup}>
            <Camera
              style={styles.camera}
              scanBarcode
              showFrame
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
