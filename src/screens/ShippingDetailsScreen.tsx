import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import CustomText from '../components/CustomText';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import type { ShippingDetailsNavigationProp } from '../navigation/types';

interface ShippingData {
  approvalStatus: string;
  shippingDetails: string;
  project: string;
  orderNumber: string;
  customerType: string;
  customer: string;
  shipTo: string;
  truckLoads: number;
  extendedLoad: boolean;
  specification: {
    projectManager: string;
    panelType: string;
    thickness: number;
    exteriorPanel: string;
    interiorPanel: string;
    trims: boolean;
    accessories: boolean;
    flatSheets: boolean;
  };
}

const MOCK_DATA: ShippingData = {
  approvalStatus: 'Approved',
  shippingDetails: '26005484',
  project: 'PR03061',
  orderNumber: '24254992',
  customerType: 'Falk Canada West',
  customer: 'Metal Structure Concepts',
  shipTo: '1000 KLO Road, Kelowna, BC V1Y 4XB',
  truckLoads: 17,
  extendedLoad: false,
  specification: {
    projectManager: 'Nick Kesik',
    panelType: 'HFW40',
    thickness: 0,
    exteriorPanel: 'PVDF Dove Grey 24ga Micro',
    interiorPanel: 'PVDF Dove Grey 26ga Micro',
    trims: false,
    accessories: false,
    flatSheets: false,
  },
};

const InfoRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View style={styles.infoRow}>
    <CustomText
      size={FontSize.smallText}
      color={COLORS.greyText}
      weight="medium"
    >
      {label}
    </CustomText>
    <CustomText
      size={FontSize.normalText}
      color={COLORS.black}
      weight="semibold"
    >
      {value}
    </CustomText>
  </View>
);

const SpecRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View style={styles.specRow}>
    <CustomText
      size={FontSize.smallText}
      color={COLORS.greyText}
      weight="medium"
    >
      {label}
    </CustomText>
    <CustomText
      size={FontSize.normalText}
      color={COLORS.black}
      weight="semibold"
    >
      {value}
    </CustomText>
  </View>
);

const ShippingDetailsScreen: React.FC<{
  navigation: ShippingDetailsNavigationProp;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const data = MOCK_DATA;
  const spec = data.specification;

  return (
    <View style={styles.root}>
      <Header
        title="Shipping Details"
        leftIconName="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + wp(22) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Approval Status Badge */}
        <View style={styles.approvalBadge}>
          <CustomText
            size={FontSize.normalText}
            color={COLORS.white}
            weight="semibold"
          >
            {`Shipment Approval : ${data.approvalStatus}`}
          </CustomText>
        </View>

        {/* Shipping Info Card */}
        <View style={styles.infoCard}>
          <InfoRow
            label="Shipping Details for CSV:"
            value={data.shippingDetails}
          />
          <InfoRow label="Project:" value={data.project} />

          <View style={styles.twoColRow}>
            <View style={styles.twoColItem}>
              <CustomText
                size={FontSize.smallText}
                color={COLORS.greyText}
                weight="medium"
              >
                Order #
              </CustomText>
              <CustomText
                size={FontSize.normalText}
                color={COLORS.black}
                weight="semibold"
              >
                {data.orderNumber}
              </CustomText>
            </View>
            <View style={styles.twoColItem}>
              <CustomText
                size={FontSize.smallText}
                color={COLORS.greyText}
                weight="medium"
              >
                Customer Type:
              </CustomText>
              <CustomText
                size={FontSize.normalText}
                color={COLORS.black}
                weight="semibold"
              >
                {data.customerType}
              </CustomText>
            </View>
          </View>

          <InfoRow label="Customer:" value={data.customer} />
          <InfoRow label="Ship To:" value={data.shipTo} />

          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <CustomText
                size={FontSize.smallText}
                color={COLORS.black}
                weight="semibold"
              >
                Truck Loads
              </CustomText>
              <CustomText
                size={FontSize.xxLargeText}
                color={COLORS.black}
                weight="bold"
              >
                {data.truckLoads}
              </CustomText>
            </View>
            <View style={styles.metricBox}>
              <CustomText
                size={FontSize.smallText}
                color={COLORS.black}
                weight="semibold"
              >
                Extended Load
              </CustomText>
              <CustomText
                size={FontSize.xxLargeText}
                color={COLORS.black}
                weight="bold"
              >
                {data.extendedLoad ? 'YES' : 'NO'}
              </CustomText>
            </View>
          </View>
        </View>

        {/* Specification Details Card */}
        <View style={styles.specCard}>
          <View style={styles.specHeader}>
            <CustomText
              size={FontSize.normalLargeText}
              color={COLORS.white}
              weight="semibold"
            >
              Specification Details
            </CustomText>
          </View>
          <View style={styles.specBody}>
            <SpecRow label="Project Manager :" value={spec.projectManager} />
            <SpecRow label="Panel Type:" value={spec.panelType} />
            <SpecRow label="Thickness" value={String(spec.thickness)} />
            <View style={styles.specDivider} />
            <SpecRow label="Exterior Panel:" value={spec.exteriorPanel} />
            <SpecRow label="Interior Panel:" value={spec.interiorPanel} />
            <View style={styles.specDivider} />
            <SpecRow label="Trims:" value={spec.trims ? 'Yes' : 'No'} />
            <SpecRow
              label="Accessories:"
              value={spec.accessories ? 'Yes' : 'No'}
            />
            <SpecRow
              label="Flat Sheets:"
              value={spec.flatSheets ? 'Yes' : 'No'}
            />
          </View>
        </View>
      </ScrollView>

      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + wp(2) }]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.fulfillmentButton}
          onPress={() => navigation.navigate('OrderFulfillment')}
        >
          <CustomText
            size={FontSize.normalLargeText}
            color={COLORS.white}
            weight="semibold"
          >
            Order fulfillment
          </CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contentContainer: {
    padding: wp(4),
    flexGrow: 1,
  },
  approvalBadge: {
    backgroundColor: COLORS.uploaded,
    borderRadius: wp(3),
    paddingVertical: wp(3),
    alignItems: 'center',
    marginBottom: wp(4),
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: wp(3),
    padding: wp(4),
    borderWidth: wp(0.3),
    borderColor: COLORS.border,
    marginBottom: wp(4),
  },
  infoRow: {
    marginBottom: wp(3),
  },
  twoColRow: {
    flexDirection: 'row',
    marginBottom: wp(3),
  },
  twoColItem: {
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: wp(3),
    marginTop: wp(1),
  },
  metricBox: {
    flex: 1,
    backgroundColor: COLORS.lightgray,
    borderRadius: wp(2),
    paddingVertical: wp(3),
    paddingHorizontal: wp(4),
    alignItems: 'center',
    gap: wp(1),
  },
  specCard: {
    borderRadius: wp(3),
    borderWidth: wp(0.3),
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  specHeader: {
    backgroundColor: COLORS.primary,
    paddingVertical: wp(3),
    paddingHorizontal: wp(4),
    alignItems: 'center',
  },
  specBody: {
    paddingHorizontal: wp(4),
    paddingVertical: wp(2),
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: wp(2),
  },
  specDivider: {
    height: wp(0.3),
    backgroundColor: COLORS.border,
    marginVertical: wp(1),
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: wp(4),
    paddingTop: wp(3),
  },
  fulfillmentButton: {
    height: wp(12),
    borderRadius: wp(2),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
});

export default ShippingDetailsScreen;
