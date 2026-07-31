import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Header from '../components/Header';
import CustomText from '../components/CustomText';
import Loader from '../components/Loader';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import useBackHandler from '../hooks/useBackHandler';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { apiClient } from '../services/apiClient';
import { getShipmentDetailsRequestConfig } from '../utils/shipmentDetails';
import type {
  ShippingDetailsNavigationProp,
  ShippingDetailsRouteProp,
} from '../navigation/types';

interface ShippingDetailsResponseData {
  csv?: string;
  title?: string;
  orderNumber?: string;
  customerType?: string;
  customer?: string;
  shipToName?: string;
  truckLoadCount?: number;
  extendedLoad?: string;
  projectManager?: string;
  panel?: string;
  thickness?: string;
  exteriorGa?: string;
  exteriorProfile?: string;
  exteriorColor?: string;
  interiorProfile?: string;
  interiorColor?: string;
  interiorGa?: string;
  trims?: string;
  accessories?: string;
  flatSheets?: string;
  paymentStatus?: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data: ShippingDetailsResponseData | null;
}

interface ShippingDetailsScreenProps {
  navigation: ShippingDetailsNavigationProp;
  route: ShippingDetailsRouteProp;
}

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

const ShippingDetailsScreen: React.FC<ShippingDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { entityType, identifier } = route.params || {};
  const insets = useSafeAreaInsets();
  const handleBack = useBackHandler(navigation);
  const { isConnected } = useNetworkStatus();

  const [loading, setLoading] = useState(false);
  const [shipmentData, setShipmentData] =
    useState<ShippingDetailsResponseData | null>(null);
  const [apiMessage, setApiMessage] = useState('');
  const [statusColor, setStatusColor] = useState<string>(COLORS.uploaded);
  const requestInFlightRef = useRef(false);

  const buildPanelDisplay = useCallback(
    (value1 = '', value2 = '', value3 = '') => {
      return [value1, value2, value3].filter(Boolean).join(' ');
    },
    [],
  );

  const resetState = useCallback(() => {
    setShipmentData(null);
    setApiMessage('');
    setStatusColor(COLORS.uploaded);
  }, []);

  useEffect(() => {
    const fetchShipmentDetails = async () => {
      if (!entityType || !identifier?.trim()) {
        resetState();
        setApiMessage('');
        return;
      }

      if (requestInFlightRef.current) {
        return;
      }

      if (!isConnected) {
        resetState();
        Toast.show({
          type: 'error',
          text1: 'No Internet',
          text2: 'Please check your internet connection.',
        });
        setStatusColor(COLORS.failed);
        return;
      }

      requestInFlightRef.current = true;
      setLoading(true);
      setApiMessage('');
      setStatusColor(COLORS.uploaded);
      setShipmentData(null);

      try {
        const { endpoint } = getShipmentDetailsRequestConfig(
          entityType,
          identifier,
        );
        const response = await apiClient.get(endpoint);
        const json: ApiResponse = await response.json();

        if (json.success && json.data) {
          setShipmentData(json.data);
          setApiMessage(
            json.message || 'Shipment details retrieved successfully.',
          );
          setStatusColor(COLORS.uploaded);
        } else {
          resetState();
          setApiMessage(json.message || 'No shipment details found.');
          setStatusColor(COLORS.failed);
        }
      } catch {
        resetState();
        setApiMessage('Failed to fetch shipment details. Please try again.');
        setStatusColor(COLORS.failed);
      } finally {
        requestInFlightRef.current = false;
        setLoading(false);
      }
    };

    fetchShipmentDetails();
  }, [entityType, identifier, isConnected, resetState]);

const renderHeaderStatus = () => {
  const paymentStatus = shipmentData?.paymentStatus?.trim();

  const isApiError = statusColor === COLORS.failed;
  const isApproved = paymentStatus === 'Approved';

  return (
    <View
      style={[
        styles.approvalBadge,
        (!isApproved || isApiError) && styles.failedBadge,
      ]}
    >
      <CustomText
        size={FontSize.normalText}
        color={COLORS.white}
        weight="semibold"
      >
        {paymentStatus
          ? `Shipment Prepayment : ${paymentStatus}`
          : isApiError
            ? apiMessage || 'Unable to load shipment details.'
            : 'Shipment Prepayment : Pending'}
      </CustomText>
    </View>
  );
};

  const renderContent = () => {
    if (loading) {
      return (
        <>
          {renderHeaderStatus()}
          <View style={styles.loaderWrapper}>
            <Loader visible />
          </View>
        </>
      );
    }

    const details = shipmentData;
    const exteriorPanel = buildPanelDisplay(
      details?.exteriorColor,
      details?.exteriorGa,
      details?.exteriorProfile,
    );
    const interiorPanel = buildPanelDisplay(
      details?.interiorColor,
      details?.interiorGa,
      details?.interiorProfile,
    );

    return (
      <>
        {renderHeaderStatus()}

        <View style={styles.infoCard}>
          <InfoRow
            label="Shipping Details for CSV:"
            value={details?.csv || ''}
          />
          <InfoRow label="Project:" value={details?.title || ''} />

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
                {details?.orderNumber || ''}
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
                {details?.customerType || ''}
              </CustomText>
            </View>
          </View>

          <InfoRow label="Customer:" value={details?.customer || ''} />
          <InfoRow label="Ship To:" value={details?.shipToName || ''} />

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
                {details?.truckLoadCount ?? ''}
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
                {details?.extendedLoad ? details.extendedLoad : ''}
              </CustomText>
            </View>
          </View>
        </View>

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
            <SpecRow
              label="Project Manager :"
              value={details?.projectManager || ''}
            />
            <SpecRow label="Panel Type:" value={details?.panel || ''} />
            <SpecRow label="Thickness" value={details?.thickness || ''} />
            <View style={styles.specDivider} />
            <SpecRow label="Exterior Panel:" value={exteriorPanel} />
            <SpecRow label="Interior Panel:" value={interiorPanel} />
            <View style={styles.specDivider} />
            <SpecRow label="Trims:" value={details?.trims || ''} />
            <SpecRow label="Accessories:" value={details?.accessories || ''} />
            <SpecRow label="Flat Sheets:" value={details?.flatSheets || ''} />
          </View>
        </View>
      </>
    );
  };

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
        {renderContent()}
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
  approvalValue: {
    marginTop: wp(1),
    textAlign: 'center',
  },
  failedBadge: {
    backgroundColor: COLORS.failed,
  },
  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: wp(40),
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
