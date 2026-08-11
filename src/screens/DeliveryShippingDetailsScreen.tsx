import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import Header from '../components/Header';
import CustomText from '../components/CustomText';
import CustomButton from '../components/CustomButton';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import useBackHandler from '../hooks/useBackHandler';
import type {
  DeliveryShippingDetailsNavigationProp,
  DeliveryShippingDetailsRouteProp,
} from '../navigation/types';

// ─── Types ───────────────────────────────────────────────────────────────────

type ItemType = 'Panel' | 'TrimBox';

interface ShipmentItem {
  id: string;
  type: ItemType;
  name: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getItemIconName = (type: ItemType): string =>
  type === 'Panel' ? 'layers-outline' : 'cube-outline';

// ─── Sub-components ──────────────────────────────────────────────────────────

const InfoField: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View style={styles.infoField}>
    <CustomText
      size={FontSize.smallText}
      color={COLORS.greyText}
      weight="regular"
    >
      {label}
    </CustomText>
    <CustomText
      size={FontSize.normalLargeText}
      color={COLORS.black}
      weight="bold"
    >
      {value}
    </CustomText>
  </View>
);

// ─── Screen ──────────────────────────────────────────────────────────────────

const DeliveryShippingDetailsScreen: React.FC<{
  navigation: DeliveryShippingDetailsNavigationProp;
  route: DeliveryShippingDetailsRouteProp;
}> = ({ navigation, route }) => {
  const { shipmentBol } = route.params;
  const insets = useSafeAreaInsets();
  const handleBack = useBackHandler(navigation);

  const items = useMemo<ShipmentItem[]>(
    () => [
      ...shipmentBol.panels.map(panel => ({
        id: panel,
        type: 'Panel' as ItemType,
        name: `Panel ${panel}`,
      })),
      ...shipmentBol.trimBoxes.map(box => ({
        id: String(box),
        type: 'TrimBox' as ItemType,
        name: `Trim Box ${box}`,
      })),
    ],
    [shipmentBol],
  );

  const handleUploadImages = useCallback(() => {
    navigation.navigate('UploadImage', {
      shipmentId: shipmentBol.bol,
      bolNumber: shipmentBol.bol,
    });
  }, [navigation, shipmentBol.bol]);

  return (
    <View style={styles.root}>
      <Header
        title="Shipping Details"
        leftIconName="arrow-back"
        onLeftPress={handleBack}
      />

      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + wp(22) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Info fields ── */}
        <InfoField
          label="Customer Name"
          value={shipmentBol.details.customer}
        />
        <InfoField
          label="Customer Address"
          value={shipmentBol.details.shipToAddress}
        />
        <InfoField label="BOL Number" value={shipmentBol.bol} />
        <InfoField
          label="Order Number"
          value={shipmentBol.details.orderNumber}
        />

        {/* ── Item List card ── */}
        <View style={styles.itemListCard}>
          {/* Header */}
          <View style={styles.itemListHeader}>
            <CustomText
              size={FontSize.mediumLargeText}
              color={COLORS.primary}
              weight="bold"
            >
              Item List
            </CustomText>

            <View style={styles.itemCountBadge}>
              <CustomText
                size={FontSize.smallText}
                color={COLORS.white}
                weight="bold"
              >
                {`${items.length} Item`}
              </CustomText>
            </View>
          </View>

          <View style={styles.itemListDivider} />

          {/* Rows */}
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              <View style={styles.itemRow}>
                <Ionicons
                  name={getItemIconName(item.type) as any}
                  size={wp(8)}
                  color={COLORS.primary}
                  style={styles.itemIcon}
                />

                <CustomText
                  size={FontSize.normalLargeText}
                  color={COLORS.black}
                  weight="medium"
                >
                  {item.name}
                </CustomText>
              </View>

              {index < items.length - 1 && (
                <View style={styles.itemRowDivider} />
              )}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      {/* ── Sticky upload button ── */}
      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + wp(2) }]}
      >
        <CustomButton title="UPLOAD IMAGES" onPress={handleUploadImages} />
      </View>
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

  // ── Info fields ──
  infoField: {
    marginBottom: wp(4),
  },

  // ── Item List card ──
  itemListCard: {
    borderRadius: wp(4),
    borderWidth: wp(0.3),
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginTop: wp(2),
  },
  itemListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: wp(4),
  },
  itemCountBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: wp(3),
    paddingVertical: wp(2),
    borderRadius: wp(5),
  },
  itemListDivider: {
    height: wp(0.3),
    backgroundColor: COLORS.border,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: wp(4),
  },
  itemIcon: {
    marginRight: wp(3),
  },
  itemRowDivider: {
    height: wp(0.3),
    backgroundColor: COLORS.border,
    marginHorizontal: wp(4),
  },

  // ── Bottom bar ──
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: wp(4),
    paddingTop: wp(3),
  },
});

export default DeliveryShippingDetailsScreen;
