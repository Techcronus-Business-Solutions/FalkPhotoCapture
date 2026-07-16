import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import Header from '../components/Header';
import CustomText from '../components/CustomText';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import type { OrderFulfillmentNavigationProp } from '../navigation/types';
import Box from '../assets/images/box.svg';
import Shop from '../assets/images/shop.svg';
import CSV from '../assets/images/csv.svg';
// ─── Types ──────────────────────────────────────────────────────────────────

type CsvStage = 'Shipped' | 'PM HOLD' | 'Active' | 'On Hold';
type TrimBoxStatus = 'Shipped' | 'On Hold' | 'Active';

interface OrderSummary {
  orderNumber: string;
  csvCount: number;
  boxCount: number;
}

interface CsvItem {
  id: string;
  csvNumber: string;
  stage: CsvStage;
  panelLocation: string;
  panel: string;
  trim: string;
  accessories: string;
  shop: string;
}

interface TrimBoxItem {
  id: string;
  boxName: string;
  status: TrimBoxStatus;
  location: string;
}

// ─── Dummy Data (replace with API data later) ────────────────────────────────

const ORDER_SUMMARY: OrderSummary = {
  orderNumber: '11241376',
  csvCount: 2,
  boxCount: 3,
};

const CSV_LIST: CsvItem[] = [
  {
    id: '1',
    csvNumber: '121215610',
    stage: 'Shipped',
    panelLocation: 'Shipped',
    panel: 'Completed',
    trim: 'No',
    accessories: 'No',
    shop: 'No(Customer provide a cut list)',
  },
  {
    id: '2',
    csvNumber: '121215610',
    stage: 'PM HOLD',
    panelLocation: 'Shipped',
    panel: 'Completed',
    trim: 'No',
    accessories: 'No',
    shop: 'No(Customer provide a cut list)',
  },
];

const TRIM_BOX_LIST: TrimBoxItem[] = [
  { id: '1', boxName: 'Box 1', status: 'Shipped', location: 'B2' },
  { id: '2', boxName: 'Box 2', status: 'On Hold', location: 'Shipping' },
  { id: '3', boxName: 'Box 3', status: 'Active', location: 'C2' },
];

// ─── Color constants ──────────────────────────────────────────────────────────

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getStageColor = (stage: string): string => {
  const lower = stage.toLowerCase();
  if (lower === 'shipped') {
    return COLORS.uploaded;
  }
  if (lower.includes('hold')) {
    return COLORS.failed;
  }
  if (lower === 'active') {
    return COLORS.orange;
  }
  return COLORS.primary;
};

const getTrimBoxStatusColor = (status: TrimBoxStatus): string => {
  switch (status) {
    case 'Shipped':
      return COLORS.uploaded;
    case 'On Hold':
      return COLORS.failed;
    case 'Active':
      return COLORS.orange;
  }
};

// ─── CsvCard ─────────────────────────────────────────────────────────────────

const CsvCard: React.FC<{ item: CsvItem; onPress: () => void }> = ({
  item,
  onPress,
}) => {
  const stageColor = getStageColor(item.stage);

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
            {`CSV: ${item.csvNumber}`}
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
        {renderGridItem('location', 'Panel Location', item.panelLocation)}

        {renderGridItem('location', 'Panel', item.panel)}

        {renderGridItem('cube', 'Trim', item.trim)}

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
            {item.shop}
          </CustomText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── TrimBoxCard ─────────────────────────────────────────────────────────────

const TrimBoxCard: React.FC<{ item: TrimBoxItem }> = ({ item }) => {
  const statusColor = getTrimBoxStatusColor(item.status);

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
          {item.boxName}
        </CustomText>
      </View>

      {/* Center */}
      <View style={{ flex: 1 }}>
        <View style={[styles.trimBoxBadge, { backgroundColor: statusColor }]}>
          <CustomText
            size={FontSize.normalText}
            color={COLORS.white}
            weight="bold"
          >
            {item.status}
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
            {item.location}
          </CustomText>
        </View>
      </View>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const OrderFulfillmentScreen: React.FC<{
  navigation: OrderFulfillmentNavigationProp;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const csvList = useMemo(() => CSV_LIST, []);
  const trimBoxList = useMemo(() => TRIM_BOX_LIST, []);

  return (
    <View style={styles.root}>
      <Header
        title="Order fulfillment"
        leftIconName="arrow-back"
        onLeftPress={() => navigation.goBack()}
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
          <View style={styles.summaryItem}>
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
              {ORDER_SUMMARY.orderNumber}
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
              {ORDER_SUMMARY.csvCount}
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
              {ORDER_SUMMARY.boxCount}
            </CustomText>
          </View>
        </View>

        {/* ── CSV Cards ── */}
        {csvList.map(item => (
          <CsvCard
            key={item.id}
            item={item}
            onPress={() =>
              navigation.navigate('PanelLocation', {
                csvNumber: item.csvNumber,
              })
            }
          />
        ))}

        {/* ── Trim Box Details ── */}
        <CustomText
          size={FontSize.mediumLargeText}
          color={COLORS.greyText}
          weight="bold"
          style={styles.sectionTitle}
        >
          Trim Box Details
        </CustomText>

        {trimBoxList.map(item => (
          <TrimBoxCard key={item.id} item={item} />
        ))}
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
  // Left-aligned: icon+label on one row, bold value below
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

  csvHeaderIcon: {
    marginRight: wp(3),
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
