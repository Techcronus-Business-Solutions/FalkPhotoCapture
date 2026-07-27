import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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
import type { ShippingManagementNavigationProp } from '../navigation/types';

const ENTRY_TYPES = [
  { label: 'Panel', value: 'Panel' },
  { label: 'Trip Box', value: 'Trip Box' },
];

const ShippingManagementScreen: React.FC<{
  navigation: ShippingManagementNavigationProp;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const handleBack = useBackHandler(navigation);
  const [entryType, setEntryType] = useState('Panel');
  const [csvNumber, setCsvNumber] = useState('');
  const [boxNumber, setBoxNumber] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);

  const handleReadCode = useCallback(
    (event: { nativeEvent: { codeStringValue: string } }) => {
      const codeStringValue = event.nativeEvent.codeStringValue;
      if (!codeStringValue) {
        return;
      }

      Toast.show({
        type: 'info',
        text1: 'BarcodeScanner scanned value',
        text2: codeStringValue,
      });

      setTimeout(() => {
        setScannerVisible(false);
      }, 800);
    },
    [],
  );

  const tripBoxDetails = useMemo(
    () => [
      {
        boxName: 'Box 1',
        status: 'Active',
        location: 'B2',
      },
      {
        boxName: 'Box 2',
        status: 'Active',
        location: 'C2',
      },
      {
        boxName: 'Box 3',
        status: 'Active',
        location: 'D1',
      },
    ],
    [],
  );

  const handleBarcodePress = useCallback(() => {
    setScannerVisible(true);
  }, []);

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
            />
          )}

          {entryType === 'Trip Box' && (
            <>
              <CustomInput2
                label="Order Number"
                placeholder=""
                value={orderNumber}
                onChangeText={setOrderNumber}
                rightIconName="barcode-outline"
                onRightPress={handleBarcodePress}
              />
              <CustomInput2
                label="Box Number"
                placeholder=""
                value={boxNumber}
                onChangeText={setBoxNumber}
              />
            </>
          )}
        </View>

        {entryType === 'Panel' ? (
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
                  color={COLORS.primary}
                  weight="semibold"
                >
                  Active - A5
                </CustomText>
                <CustomText size={FontSize.smallText} color={COLORS.greyText}>
                  Current Location: A5
                </CustomText>
              </View>
            </View>
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
                  Shipped
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
                  Move
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
                  3/9/2026, 10:12 AM
                </CustomText>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons
                name="checkmark-circle"
                size={wp(10)}
                color={COLORS.primary}
                style={{ marginRight: wp(3) }}
              />
              <CustomText
                size={FontSize.normalLargeText}
                color={COLORS.primary}
                weight="semibold"
              >
                Current Status
              </CustomText>
            </View>
            {tripBoxDetails.map(item => (
              <View key={item.boxName} style={styles.tripBoxRow}>
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
                    {item.boxName}
                  </CustomText>
                  <CustomText size={FontSize.normalText} color={COLORS.black}>
                    Status: {item.status}
                  </CustomText>
                  <CustomText
                    size={FontSize.normalText}
                    color={COLORS.greyText}
                  >
                    Location: {item.location}
                  </CustomText>
                </View>
              </View>
            ))}
          </View>
        )}
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
                  : 'Order - ' + orderNumber + ' | Box - ' + boxNumber,
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
          onPress={() => navigation.navigate('ShippingDetails')}
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
              onPress={() => setScannerVisible(false)}
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
    borderRadius: wp(20),
    justifyContent: 'center',
    alignItems: 'center',
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
