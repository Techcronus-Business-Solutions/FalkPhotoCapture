import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import CustomText from './CustomText';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import type { Shipment, ShipmentStatus } from '../types/shipment';
import { usePendingUploadsStore } from '../store/pendingUploadsStore';

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  'Ready to Ship': COLORS.pending,
  Uploaded: COLORS.uploaded,
  Offline: COLORS.offline,
};

interface ShipmentCardProps {
  shipment: Shipment;
  displayStatus?: ShipmentStatus;
  onPress: () => void;
}

const ShipmentCard: React.FC<ShipmentCardProps> = ({
  shipment,
  displayStatus,
  onPress,
}) => {
  const status = displayStatus ?? shipment.status;
  const sharePointCount =
    (shipment as any)?.sharePointLinks?.length ?? shipment.photoCount ?? 0;

  const pendingCount = usePendingUploadsStore(
    state =>
      state.pendingUploads.filter(
        u =>
          u.shipmentNumber === shipment.bolNumber &&
          u.uploadStatus === 'pending',
      ).length,
  );

  let imageCount = sharePointCount;
  if (shipment.status === 'Offline') {
    imageCount = sharePointCount + pendingCount;
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.card}>
      <View style={styles.content}>
        <CustomText
          size={FontSize.normalLargeText}
          color={COLORS.black}
          weight="bold"
        >
          {shipment.bolNumber}
        </CustomText>

        <CustomText
          size={FontSize.smallMediumText}
          color={COLORS.greyText}
          style={styles.sub}
        >
          {`SO: ${shipment.salesOrderNo}`}
        </CustomText>

        <CustomText
          size={FontSize.smallMediumText}
          color={COLORS.greyText}
          style={styles.sub}
        >
          {shipment.date}
          {imageCount > 0
            ? `  •  ${imageCount} Photo${imageCount !== 1 ? 's' : ''}`
            : ''}
        </CustomText>
      </View>

      <View style={styles.right}>
        <View
          style={[styles.badge, { backgroundColor: STATUS_COLORS[status] }]}
        >
          <CustomText
            size={FontSize.tinyText}
            color={COLORS.white}
            weight="semibold"
          >
            {status}
          </CustomText>
        </View>
        <Ionicons
          name="chevron-forward"
          size={wp(6)} // icon size → rf
          color={COLORS.greyText}
          style={styles.chevron}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: wp(2), // radius → rf
    paddingHorizontal: wp(4), // uniform card padding → wp
    paddingVertical: wp(2), // uniform card padding → wp
    marginHorizontal: wp(4), // horizontal margin → wp
    marginVertical: wp(2), // vertical margin → hp
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: wp(1), // shadow radius → rf
    elevation: 1,
  },
  content: {
    flex: 1,
  },
  sub: {
    marginTop: wp(1), // vertical margin → hp
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: wp(3), // horizontal padding → wp
    paddingVertical: wp(1), // vertical padding → hp
    borderRadius: wp(2), // radius → rf
  },
  chevron: {
    marginLeft: wp(2), // horizontal margin → wp
  },
});

export default memo(ShipmentCard);
