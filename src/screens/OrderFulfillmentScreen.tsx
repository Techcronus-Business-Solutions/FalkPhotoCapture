import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import Toast from 'react-native-toast-message';
import Header from '../components/Header';
import CustomText from '../components/CustomText';
import Loader from '../components/Loader';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import useBackHandler from '../hooks/useBackHandler';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { apiClient } from '../services/apiClient';
import { API_ROUTES } from '../services/ApiRoutes';
import type {
  OrderFulfillmentNavigationProp,
  OrderFulfillmentRouteProp,
  PanelLocationItem,
} from '../navigation/types';
import Box from '../assets/images/box.svg';
import Shop from '../assets/images/shop.svg';
import CSV from '../assets/images/csv.svg';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Panel {
  orderNumber: number;
  csv: string;
  stage: string;
  shops: string;
  accessories: string;
  trims: string;
  panel: string;
  currentLocation: string;
  status: string;
  panelLocations: PanelLocationItem[];
}

interface TrimBox {
  boxNumber: number;
  status: string;
  currentLocation: string;
  holdLocation: string;
}

interface FullOrderData {
  panels: Panel[];
  trimBoxes: TrimBox[];
}

interface FullOrderApiResponse {
  success: boolean;
  message?: string;
  data: FullOrderData | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getStageColor = (stage: string): string => {
  const value = (stage || '').trim().toLowerCase();

  switch (value) {
    case 'shipped':
      return COLORS.uploaded;

    case 'cancelled':
    case 'pm hold':
    case 'logistic - quality hold':
      return COLORS.failed;

    case 'new order':
    case 'shop drawings':
    case 'awaiting approved cut list':
    case 'create csv':
    case 'csv pm review':
    case 'csv production review':
    case 'ready for production':
      return COLORS.primary;

    case 'waiting on vendor':
    case 'logistics - ready to ship':
    case 'logistics - partial shipment':
      return COLORS.orange;

    default:
      return COLORS.black;
  }
};

const getTrimBoxStatusColor = (status: string): string => {
  if (status === 'Shipped') return COLORS.uploaded;
  if (status === 'Active') return COLORS.orange;
  return COLORS.failed;
};

const getPanelLocationItemDisplay = (loc: PanelLocationItem): string => {
  if (loc.status === 'Shipped') return 'Shipped';
  if (loc.status === 'QA Hold') return loc.holdLocation || loc.currentLocation;
  return loc.currentLocation;
};

const buildPanelLocationItemSummary = (locations: PanelLocationItem[]): string => {
  if (!locations?.length) return '';
  const counts: Record<string, number> = {};
  for (const loc of locations) {
    const key = getPanelLocationItemDisplay(loc) || 'Unknown';
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([loc, count]) => `${loc} (${count})`)
    .join(', ');
};

const getTrimBoxLocation = (box: TrimBox): string => {
  if (box.status === 'QA Hold') return box.holdLocation || box.currentLocation;
  return box.currentLocation;
};

// ─── CsvCard ─────────────────────────────────────────────────────────────────

const CsvCard: React.FC<{ item: Panel; onPress: () => void }> = ({
  item,
  onPress,
}) => {
  const stageColor = getStageColor(item.stage);
  const panelLocationSummary = buildPanelLocationItemSummary(item.panelLocations);

  const renderGridItem = (icon: string, label: string, value: string) => (
    <View style={styles.csvGridItem}>
      <View style={styles.csvGridContent}>
        <Ionicons
          name={icon as any}
          size={wp(6)}
          color={COLORS.white}
          style={styles.csvGridIcon}
        />
        <View style={styles.csvGridTextContainer}>
          <CustomText
            size={FontSize.smallText}
            color={COLORS.white}
            weight="medium"
          >
            {label}
          </CustomText>
          <CustomText
            size={FontSize.normalLargeText}
            color={COLORS.white}
            weight="bold"
          >
            {value}
          </CustomText>
        </View>
      </View>
    </View>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.csvCard, { backgroundColor: stageColor }]}
    >
      {/* Header */}
      <View style={styles.csvCardHeader}>
        <Box width={wp(9)} height={wp(9)} />
        <View style={styles.csvCardHeaderText}>
          <CustomText
            size={FontSize.normalLargeText}
            color={COLORS.white}
            weight="bold"
          >
            {`CSV: ${item.csv}`}
          </CustomText>
          <CustomText
            size={FontSize.extraLargeText}
            color={COLORS.white}
            weight="bold"
          >
            {`Stage: ${item.stage}`}
          </CustomText>
        </View>
      </View>

      <View style={styles.csvDivider} />

      {/* Details */}
      <View style={styles.csvGrid}>
        {renderGridItem('location', 'Panel Locations', panelLocationSummary)}
        {renderGridItem('location', 'Panel', item.panel)}
        {renderGridItem('cube', 'Trim', item.trims)}
        {renderGridItem('settings-outline', 'Accessories', item.accessories)}
      </View>

      <View style={styles.csvDivider} />

      {/* Shop */}
      <View style={styles.csvShopRow}>
        <Shop width={wp(5)} height={wp(5)} style={styles.csvShopIcon} />
        <View style={styles.csvShopText}>
          <CustomText
            size={FontSize.smallText}
            color={COLORS.white}
            weight="medium"
          >
            Shop
          </CustomText>
          <CustomText
            size={FontSize.normalLargeText}
            color={COLORS.white}
            weight="bold"
          >
            {item.shops}
          </CustomText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── TrimBoxCard ─────────────────────────────────────────────────────────────

const TrimBoxCard: React.FC<{ item: TrimBox }> = ({ item }) => {
  const statusColor = getTrimBoxStatusColor(item.status);
  const location = getTrimBoxLocation(item);

  return (
    <View style={styles.trimBoxCard}>
      {/* Left */}
      <View style={styles.trimLeftSection}>
        <Ionicons name="cube" size={wp(6)} color={statusColor} />
        <CustomText
          size={FontSize.normalLargeText}
          color={COLORS.greyText}
          weight="bold"
          style={styles.trimBoxName}
        >
          {`Box ${item.boxNumber}`}
        </CustomText>
      </View>

      {/* Center */}
      <View style={styles.trimBadgeWrapper}>
        <View style={[styles.trimBoxBadge, { backgroundColor: statusColor }]}>
          <CustomText
            size={FontSize.normalText}
            color={COLORS.white}
            weight="bold"
          >
            {item.status || 'Unknown'}
          </CustomText>
        </View>
      </View>

      {/* Right */}
      <View style={styles.trimLocationSection}>
        <Ionicons name="location-sharp" size={wp(6)} color={statusColor} />
        <View style={styles.trimLocationText}>
          <CustomText
            size={FontSize.smallText}
            color={COLORS.greyText}
            weight="medium"
          >
            Location
          </CustomText>
          <CustomText
            size={FontSize.normalText}
            color={COLORS.black}
            weight="bold"
          >
            {location}
          </CustomText>
        </View>
      </View>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const OrderFulfillmentScreen: React.FC<{
  navigation: OrderFulfillmentNavigationProp;
  route: OrderFulfillmentRouteProp;
}> = ({ navigation, route }) => {
  const { orderNumber } = route.params;
  const insets = useSafeAreaInsets();
  const handleBack = useBackHandler(navigation);
  const { isConnected } = useNetworkStatus();

  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<FullOrderData | null>(null);
  const [apiMessage, setApiMessage] = useState('');
  const requestInFlightRef = useRef(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderNumber?.trim()) return;
      if (requestInFlightRef.current) return;

      if (!isConnected) {
        setOrderData(null);
        setApiMessage('No internet connection.');
        Toast.show({
          type: 'error',
          text1: 'No Internet',
          text2: 'Please check your internet connection.',
        });
        return;
      }

      requestInFlightRef.current = true;
      setLoading(true);
      setApiMessage('');
      setOrderData(null);

      try {
        const response = await apiClient.get(
          `${API_ROUTES.FULL_ORDER_DETAILS}/${orderNumber.trim()}`,
        );
        const json: FullOrderApiResponse = await response.json();

        if (json.success && json.data) {
          setOrderData(json.data);
          setApiMessage(json.message || '');
        } else {
          setOrderData(null);
          setApiMessage(json.message || 'No order details found.');
        }
      } catch {
        setOrderData(null);
        setApiMessage('Failed to fetch order details. Please try again.');
      } finally {
        requestInFlightRef.current = false;
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderNumber, isConnected]);

  const panels = orderData?.panels ?? [];
  const trimBoxes = orderData?.trimBoxes ?? [];

  return (
    <View style={styles.root}>
      <Header
        title="Order fulfillment"
        leftIconName="arrow-back"
        onLeftPress={handleBack}
      />

      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + wp(6) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Order Summary Card ── */}
        <View style={styles.summaryCard}>
          <View style={[styles.summaryItem,{flex: 1.5}]}>
            <View style={styles.summaryIconRow}>
              <View style={styles.summaryIconBg}>
                <Ionicons
                  name="document-text"
                  size={wp(5)}
                  color={COLORS.primary}
                />
              </View>
              <CustomText
                size={FontSize.normalText}
                color={COLORS.greyText}
                weight="medium"
              >
                Order
              </CustomText>
            </View>
            <CustomText
              size={FontSize.extraLargeText}
              color={COLORS.black}
              weight="bold"
            >
              {orderNumber}
            </CustomText>
          </View>

          <View style={styles.summarySeparator} />

          <View style={styles.summaryItem}>
            <View style={styles.summaryIconRow}>
              <View style={styles.summaryIconBg}>
                <CSV width={wp(5)} height={wp(5)} />
              </View>
              <CustomText
                size={FontSize.normalText}
                color={COLORS.greyText}
                weight="medium"
              >
                CSV
              </CustomText>
            </View>
            <CustomText
              size={FontSize.extraLargeText}
              color={COLORS.black}
              weight="bold"
            >
              {panels.length}
            </CustomText>
          </View>

          <View style={styles.summarySeparator} />

          <View style={styles.summaryItem}>
            <View style={styles.summaryIconRow}>
              <View style={styles.summaryIconBg}>
                <Ionicons name="cube" size={wp(5)} color={COLORS.primary} />
              </View>
              <CustomText
                size={FontSize.normalText}
                color={COLORS.greyText}
                weight="medium"
              >
                BOX
              </CustomText>
            </View>
            <CustomText
              size={FontSize.extraLargeText}
              color={COLORS.black}
              weight="bold"
            >
              {trimBoxes.length}
            </CustomText>
          </View>
        </View>

        {/* ── Loading ── */}
        {loading && (
          <View style={styles.loaderWrapper}>
            <Loader visible />
          </View>
        )}

        {/* ── Empty / Error State ── */}
        {!loading && !orderData && (
          <View style={styles.emptyWrapper}>
            <CustomText
              size={FontSize.normalLargeText}
              color={COLORS.greyText}
              weight="medium"
            >
              {apiMessage || 'No order details found.'}
            </CustomText>
          </View>
        )}

        {/* ── CSV Cards ── */}
        {!loading &&
          panels.map((item, index) => (
            <CsvCard
              key={`${item.csv}-${index}`}
              item={item}
              onPress={() =>
                navigation.navigate('PanelLocation', {
                  csv: item.csv,
                  panelLocations: item.panelLocations,
                })
              }
            />
          ))}

        {/* ── Trim Box Details ── */}
        {!loading && trimBoxes.length > 0 && (
          <>
            <CustomText
              size={FontSize.mediumLargeText}
              color={COLORS.greyText}
              weight="bold"
              style={styles.sectionTitle}
            >
              Trim Box Details
            </CustomText>

            {trimBoxes.map(item => (
              <TrimBoxCard key={item.boxNumber} item={item} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contentContainer: {
    padding: wp(4),
    flexGrow: 1,
  },

  // ── Summary card ──
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: wp(3),
    borderWidth: wp(0.5),
    borderColor: COLORS.border,
    marginBottom: wp(4),
    overflow: 'hidden',
  },
  summaryItem: {
    flex: 1,
    paddingVertical: wp(4),
    paddingHorizontal: wp(3),
    gap: wp(2),
  },
  summaryIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  summaryIconBg: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(9),
    backgroundColor: COLORS.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summarySeparator: {
    width: wp(0.5),
    backgroundColor: COLORS.border,
    marginVertical: wp(4),
  },

  // ── Loading / Empty ──
  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: wp(40),
  },
  emptyWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: wp(40),
  },

  // ── CSV cards ──
  csvCard: {
    borderRadius: wp(4),
    paddingHorizontal: wp(5),
    paddingVertical: wp(4.5),
    marginBottom: wp(4),
  },
  csvCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  csvCardHeaderText: {
    flex: 1,
    marginLeft: wp(4),
  },
  csvDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginVertical: wp(4),
  },
  csvGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: wp(4),
  },
  csvGridItem: {
    width: '50%',
  },
  csvGridContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  csvGridIcon: {
    marginRight: wp(2),
    marginTop: wp(0.5),
  },
  csvGridTextContainer: {
    flex: 1,
  },
  csvShopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  csvShopIcon: {
    marginRight: wp(2),
    marginTop: wp(0.5),
  },
  csvShopText: {
    flex: 1,
  },

  // ── Section title ──
  sectionTitle: {
    marginTop: wp(2),
    marginBottom: wp(3),
  },

  // ── Trim Box cards ──
  trimBoxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: wp(4),
    borderWidth: wp(0.5),
    borderColor: COLORS.border,
    paddingHorizontal: wp(4),
    paddingVertical: wp(4),
    marginBottom: wp(4),
  },
  trimLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trimBoxName: {
    marginLeft: wp(3),
  },
  trimBadgeWrapper: {
    flex: 1,
  },
  trimBoxBadge: {
    minWidth: wp(22),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: wp(2.3),
    borderRadius: wp(5),
  },
  trimLocationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  trimLocationText: {
    marginLeft: wp(1.5),
  },
});

export default OrderFulfillmentScreen;
