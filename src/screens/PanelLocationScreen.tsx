import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import Header from '../components/Header';
import CustomText from '../components/CustomText';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import useBackHandler from '../hooks/useBackHandler';
import type {
  PanelLocationNavigationProp,
  PanelLocationRouteProp,
} from '../navigation/types';
import CSV from '../assets/images/csv.svg';

// ─── Types ───────────────────────────────────────────────────────────────────

type PanelStatus = 'Shipped' | 'On Hold' | 'Active';

interface PanelItem {
  id: string;
  panelId: string;
  status: PanelStatus;
  location: string;
}

// ─── Dummy Data (replace with API data later) ────────────────────────────────

const PANEL_LIST: PanelItem[] = [
  { id: '1', panelId: '2600464P1', status: 'Shipped', location: 'B2' },
  { id: '2', panelId: '2600464P2', status: 'On Hold', location: 'Shipping' },
  { id: '3', panelId: '2600464P3', status: 'Active', location: 'C2' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getPanelStatusColor = (status: PanelStatus): string => {
  switch (status) {
    case 'Shipped':
      return COLORS.uploaded;
    case 'On Hold':
      return COLORS.failed;
    case 'Active':
      return COLORS.orange;
  }
};

// ─── PanelCard ───────────────────────────────────────────────────────────────

const PanelCard: React.FC<{ item: PanelItem }> = ({ item }) => {
  const statusColor = getPanelStatusColor(item.status);

  return (
    <View style={styles.panelCard}>
      {/* Panel ID row */}
      <View style={styles.panelCardHeader}>
        <Ionicons name="cube-outline" size={wp(7)} color={COLORS.primary} />

        <CustomText
          size={FontSize.normalLargeText}
          color={COLORS.primary}
          weight="bold"
          style={styles.panelId}
        >
          {item.panelId}
        </CustomText>
      </View>

      <View style={styles.panelDivider} />

      {/* Status and Location row */}
      <View style={styles.panelInfoRow}>
        <View style={styles.panelInfoCol}>
          <CustomText
            size={FontSize.smallText}
            color={COLORS.greyText}
            weight="medium"
          >
            Status:
          </CustomText>

          <CustomText
            size={FontSize.normalText}
            color={statusColor}
            weight="bold"
          >
            {item.status}
          </CustomText>
        </View>

        <View style={styles.panelInfoSeparator} />

        <View style={styles.panelInfoCol}>
          <CustomText
            size={FontSize.smallText}
            color={COLORS.greyText}
            weight="medium"
          >
            Location:
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

// ─── Screen ──────────────────────────────────────────────────────────────────

const PanelLocationScreen: React.FC<{
  navigation: PanelLocationNavigationProp;
  route: PanelLocationRouteProp;
}> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { csvNumber } = route.params;
  const panelList = useMemo(() => PANEL_LIST, []);
  const handleBack = useBackHandler(navigation);

  return (
    <View style={styles.root}>
      <Header
        title="Panel Location"
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
        {/* CSV Header Card */}
        <View style={styles.csvHeaderCard}>
          <View style={styles.csvIconContainer}>
            <CSV width={wp(8)} height={wp(8)} />
          </View>

          <View style={styles.csvHeaderText}>
            <CustomText
              size={FontSize.smallText}
              color={COLORS.greyText}
              weight="medium"
            >
              Panel Location For CSV
            </CustomText>

            <CustomText
              size={FontSize.extraLargeText}
              color={COLORS.primary}
              weight="bold"
            >
              {csvNumber}
            </CustomText>
          </View>
        </View>

        {/* Panel Cards */}
        {panelList.map(item => (
          <PanelCard key={item.id} item={item} />
        ))}
      </ScrollView>
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
    flexGrow: 1,
  },

  // ── CSV header card ──
  csvHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: wp(3),
    borderWidth: wp(0.5),
    borderColor: COLORS.border,
    paddingVertical: wp(4),
    paddingHorizontal: wp(4),
    marginBottom: wp(4),
  },
  csvIconContainer: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(12),
    backgroundColor: COLORS.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(4),
  },
  csvHeaderText: {
    flex: 1,
    gap: wp(1),
  },

  // ── Panel cards ──
  panelCard: {
    backgroundColor: COLORS.white,
    borderRadius: wp(4),
    borderWidth: wp(0.5),
    borderColor: COLORS.border,
    paddingHorizontal: wp(4),
    paddingVertical: wp(4),
    marginBottom: wp(4),
  },
  panelCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelId: {
    marginLeft: wp(3),
  },
  panelDivider: {
    height: wp(0.3),
    backgroundColor: COLORS.border,
    marginVertical: wp(3),
  },
  panelInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelInfoCol: {
    flex: 1,
    gap: wp(1),
  },
  panelInfoSeparator: {
    width: wp(0.3),
    height: wp(10),
    backgroundColor: COLORS.border,
    marginHorizontal: wp(4),
  },
});

export default PanelLocationScreen;
