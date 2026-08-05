import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera } from 'react-native-camera-kit';
import Toast from 'react-native-toast-message';
import Ionicons from '@react-native-vector-icons/ionicons';
import Header from '../components/Header';
import CustomInput2 from '../components/CustomInput2';
import CustomDropdown from '../components/CustomDropdown';
import CustomButton from '../components/CustomButton';
import CustomText from '../components/CustomText';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import useBackHandler from '../hooks/useBackHandler';
import useCameraScanner from '../hooks/useCameraScanner';
import type { DriverAllocationNavigationProp } from '../navigation/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Driver {
  id: string;
  name: string;
}

type ItemType = 'Panel' | 'TrimBox';

interface AllocationItem {
  id: string;
  type: ItemType;
  name: string;
}

// ─── Dummy Data (replace with API data later) ────────────────────────────────

const DRIVER_LIST: Driver[] = [
  { id: '1', name: 'John Smith' },
  { id: '2', name: 'David Wilson' },
  { id: '3', name: 'Michael Brown' },
  { id: '4', name: 'James Anderson' },
];

const DRIVER_OPTIONS = DRIVER_LIST.map(d => ({ label: d.name, value: d.id }));

const ITEM_LIST: AllocationItem[] = [
  { id: '1', type: 'Panel', name: 'Panel 123445575768P1' },
  { id: '2', type: 'Panel', name: 'Panel 123445575768P5' },
  { id: '3', type: 'Panel', name: 'Panel 123445575768P6' },
  { id: '4', type: 'TrimBox', name: 'Trim Box 2' },
  { id: '5', type: 'TrimBox', name: 'Trim Box 3' },
  { id: '6', type: 'TrimBox', name: 'Trim Box 4' },
  { id: '7', type: 'Panel', name: 'Panel 123445575768P11' },
  { id: '8', type: 'Panel', name: 'Panel 123445575768P12' },
  { id: '9', type: 'TrimBox', name: 'Trim Box 5' },
  { id: '10', type: 'TrimBox', name: 'Trim Box 6' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getItemIconName = (type: ItemType): string =>
  type === 'Panel' ? 'layers-outline' : 'cube-outline';

// ─── Screen ──────────────────────────────────────────────────────────────────

const DriverAllocationScreen: React.FC<{
  navigation: DriverAllocationNavigationProp;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const handleBack = useBackHandler(navigation);
  const [bol, setBol] = useState('');
  const [driverId, setDriverId] = useState('');
  const { scannerVisible, openScanner, closeScanner } = useCameraScanner();

  const itemList = useMemo(() => ITEM_LIST, []);

  const handleReadCode = useCallback(
    (event: { nativeEvent: { codeStringValue: string } }) => {
      const codeStringValue = event.nativeEvent.codeStringValue;
      if (!codeStringValue) {
        return;
      }

      setBol(codeStringValue);

      Toast.show({
        type: 'info',
        text1: 'BarcodeScanner scanned value',
        text2: codeStringValue,
      });

      setTimeout(closeScanner, 800);
    },
    [closeScanner],
  );

  const handleBarcodePress = openScanner;

  const handleSubmit = useCallback(() => {
    // TODO: dispatch driver allocation submission
  }, []);

  return (
    <View style={styles.root}>
      <Header
        title="Driver Assignment"
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
        {/* ── BOL + Driver card ── */}
        <View style={styles.card}>
          <CustomInput2
            label="BOL"
            placeholder=""
            value={bol}
            onChangeText={setBol}
            rightIconName="barcode-outline"
            onRightPress={handleBarcodePress}
          />

          <CustomDropdown
            label="Driver"
            placeholder=""
            options={DRIVER_OPTIONS}
            value={driverId}
            onValueChange={setDriverId}
          />
        </View>

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
                {`${itemList.length} Item`}
              </CustomText>
            </View>
          </View>

          <View style={styles.itemListDivider} />

          {/* Rows */}
          {itemList.map((item, index) => (
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

              {index < itemList.length - 1 && (
                <View style={styles.itemRowDivider} />
              )}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      {/* ── Sticky submit button ── */}
      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + wp(2) }]}
      >
        <CustomButton
          title="SUBMIT"
          onPress={handleSubmit}
          style={styles.submitBtn}
        />
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
    flexGrow: 1,
  },

  // ── BOL + Driver card ──
  card: {
    borderRadius: wp(4),
    marginVertical: wp(4),
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
  submitBtn: {
    height: wp(12),
    borderRadius: wp(2),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Scanner ──
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

export default DriverAllocationScreen;
