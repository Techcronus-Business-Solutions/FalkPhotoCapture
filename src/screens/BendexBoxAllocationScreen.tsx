import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera } from 'react-native-camera-kit';
import Toast from 'react-native-toast-message';
import Ionicons from '@react-native-vector-icons/ionicons';
import Header from '../components/Header';
import CustomInput2 from '../components/CustomInput2';
import CustomText from '../components/CustomText';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import useBackHandler from '../hooks/useBackHandler';
import useCameraScanner from '../hooks/useCameraScanner';
import { toDigitsOnly } from '../utils/input';
import { apiClient } from '../services/apiClient';
import { API_ROUTES } from '../services/ApiRoutes';
import type { BendexItem } from '../types/bendex';
import type { BendexBoxAllocationNavigationProp } from '../navigation/types';

// ─── Screen ──────────────────────────────────────────────────────────────────

const BendexBoxAllocationScreen: React.FC<{
  navigation: BendexBoxAllocationNavigationProp;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const handleBack = useBackHandler(navigation);
  const [orderNumber, setOrderNumber] = useState('');
  const [boxNumber, setBoxNumber] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [trimList, setTrimList] = useState<BendexItem[]>([]);
  const [trimListLoading, setTrimListLoading] = useState(false);
  const { scannerVisible, openScanner, closeScanner } = useCameraScanner();

  const fetchBendexItems = useCallback(async (order: string) => {
    const trimmedOrder = order.trim();
    if (!trimmedOrder) {
      return;
    }

    setSelectedIds(new Set());
    setTrimListLoading(true);
    try {
      const response = await apiClient.get(
        `${API_ROUTES.GET_BENDEX_DATA}/${trimmedOrder}`,
      );
      const json = await response.json();

      if (json.success && Array.isArray(json.data)) {
        setTrimList(json.data as BendexItem[]);
      } else {
        setTrimList([]);
        Toast.show({
          type: 'error',
          text1: 'No Items Found',
          text2: json.message || 'No available items found for this order.',
        });
      }
    } catch {
      setTrimList([]);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch available items. Please try again.',
      });
    } finally {
      setTrimListLoading(false);
    }
  }, []);

  const handleReadCode = useCallback(
    (event: { nativeEvent: { codeStringValue: string } }) => {
      const codeStringValue = event.nativeEvent.codeStringValue;
      if (!codeStringValue) {
        return;
      }

      const scannedOrderNumber = toDigitsOnly(codeStringValue);
      setOrderNumber(scannedOrderNumber);
      fetchBendexItems(scannedOrderNumber);

      Toast.show({
        type: 'info',
        text1: 'BarcodeScanner scanned value',
        text2: codeStringValue,
      });

      setTimeout(closeScanner, 800);
    },
    [closeScanner, fetchBendexItems],
  );

  const handleBarcodePress = openScanner;

  const toggleItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleBoxContents = useCallback(() => {
    if (!boxNumber.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter Box Number.',
      });
      return;
    }
    navigation.navigate('BoxContents', { boxNumber });
  }, [boxNumber, navigation]);

  const handleAssignToBox = useCallback(() => {
    // TODO: handle assign to box action
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header
        title="Inventory Scanner"
        leftIconName="arrow-back"
        onLeftPress={handleBack}
      />

      {/* ── Fixed top section ── */}
      <View style={styles.topSection}>
        <View style={styles.entityTypeField}>
          <CustomText
            size={FontSize.smallText}
            color={COLORS.greyText}
            weight="regular"
          >
            Entity Type
          </CustomText>
          <CustomText
            size={FontSize.normalLargeText}
            color={COLORS.black}
            weight="medium"
          >
            Trim Box
          </CustomText>
        </View>

        <CustomInput2
          label="Order Number"
          placeholder=""
          value={orderNumber}
          onChangeText={v => setOrderNumber(toDigitsOnly(v))}
          keyboardType="number-pad"
          returnKeyType="search"
          onSubmitEditing={() => fetchBendexItems(orderNumber)}
          rightIconName="barcode-outline"
          onRightPress={handleBarcodePress}
        />
      </View>

      {/* ── Available Trims card (scrollable interior) ── */}
      <View style={styles.trimsCard}>
        <View style={styles.trimsHeader}>
          <CustomText
            size={FontSize.mediumLargeText}
            color={COLORS.primary}
            weight="bold"
          >
            Available Trims
          </CustomText>

          <View style={styles.itemCountBadge}>
            <CustomText
              size={FontSize.smallText}
              color={COLORS.white}
              weight="bold"
            >
              {`${trimList.length} Item`}
            </CustomText>
          </View>
        </View>

        <View style={styles.trimsDivider} />

        {trimListLoading ? (
          <View style={styles.trimsEmptyState}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : trimList.length === 0 ? (
          <View style={styles.trimsEmptyState}>
            <CustomText size={FontSize.normalText} color={COLORS.greyText}>
              {orderNumber
                ? 'No available items found for this order.'
                : 'Enter or scan an Order Number to load items.'}
            </CustomText>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {trimList.map((item, index) => {
              const itemId = `${item.bendexOrderID}-${item.title}-${index}`;
              return (
                <React.Fragment key={itemId}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.trimRow}
                    onPress={() => toggleItem(itemId)}
                  >
                    <View style={styles.trimRowText}>
                      <CustomText
                        size={FontSize.normalLargeText}
                        color={COLORS.black}
                        weight="medium"
                      >
                        {item.trimName + ' (Pos ' + item.position + ')'}
                      </CustomText>
                      <CustomText
                        size={FontSize.smallText}
                        color={COLORS.greyText}
                      >
                        {`${item.color} • Qty - ${item.availableQuantity}`}
                      </CustomText>
                    </View>

                    <Ionicons
                      name={
                        selectedIds.has(itemId) ? 'checkbox' : 'square-outline'
                      }
                      size={wp(6)}
                      color={
                        selectedIds.has(itemId)
                          ? COLORS.primary
                          : COLORS.greyText
                      }
                    />
                  </TouchableOpacity>

                  {index < trimList.length - 1 && (
                    <View style={styles.trimRowDivider} />
                  )}
                </React.Fragment>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* ── Box Number (fixed between list and buttons) ── */}
      <View style={styles.boxNumberSection}>
        <CustomInput2
          label="Box Number"
          placeholder=""
          value={boxNumber}
          onChangeText={v => setBoxNumber(toDigitsOnly(v))}
          keyboardType="number-pad"
        />
      </View>

      {/* ── Sticky bottom buttons ── */}
      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + wp(2) }]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.actionButton, styles.outlineButton]}
          onPress={handleBoxContents}
        >
          <CustomText
            size={FontSize.normalText}
            color={COLORS.primary}
            weight="semibold"
          >
            BOX CONTENTS
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleAssignToBox}
        >
          <CustomText
            size={FontSize.normalText}
            color={COLORS.white}
            weight="semibold"
          >
            ASSIGN TO BOX
          </CustomText>
        </TouchableOpacity>
      </View>

      {/* ── Barcode scanner overlay ── */}
      {scannerVisible && (
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerPopup}>
            <Camera
              style={styles.camera}
              scanBarcode
              showFrame
              resizeMode="cover"
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
    </KeyboardAvoidingView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // ── Top section ──
  topSection: {
    paddingHorizontal: wp(4),
    paddingTop: wp(4),
  },
  entityTypeField: {
    marginBottom: wp(6),
  },

  // ── Available Trims card ──
  trimsCard: {
    flex: 1,
    marginHorizontal: wp(4),
    marginBottom: wp(2),
    borderRadius: wp(4),
    borderWidth: wp(0.3),
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  trimsHeader: {
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
  trimsDivider: {
    height: wp(0.3),
    backgroundColor: COLORS.border,
  },
  trimsEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: wp(8),
  },
  trimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: wp(3),
  },
  trimRowText: {
    flex: 1,
    marginRight: wp(3),
  },
  trimRowDivider: {
    height: wp(0.3),
    backgroundColor: COLORS.border,
    marginHorizontal: wp(4),
  },

  // ── Box Number section ──
  boxNumberSection: {
    paddingHorizontal: wp(4),
    paddingTop: wp(3),
  },

  // ── Bottom bar ──
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: wp(4),
    paddingTop: wp(3),
    backgroundColor: COLORS.white,
    borderTopWidth: wp(0.3),
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flex: 1,
    height: wp(12),
    borderRadius: wp(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButton: {
    backgroundColor: COLORS.lightBlue,
    marginRight: wp(3),
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
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

export default BendexBoxAllocationScreen;
