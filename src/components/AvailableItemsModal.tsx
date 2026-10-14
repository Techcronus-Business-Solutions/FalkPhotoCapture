import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera } from 'react-native-camera-kit';
import CustomInput2 from './CustomInput2';
import CustomText from './CustomText';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import useCameraScanner from '../hooks/useCameraScanner';
import type { AvailableItem } from '../navigation/types';

interface AvailableItemsModalProps {
  visible: boolean;
  items: AvailableItem[];
  onCancel: () => void;
  onSelect: (item: AvailableItem) => void;
}

const AvailableItemsModal: React.FC<AvailableItemsModalProps> = ({
  visible,
  items,
  onCancel,
  onSelect,
}) => {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const { scannerVisible, openScanner, closeScanner } = useCameraScanner();

  useEffect(() => {
    if (visible) {
      setSearchText('');
    } else {
      Keyboard.dismiss();
      closeScanner();
    }
  }, [visible, closeScanner]);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    );
    const hideSubscription = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const filteredItems = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase();
    if (!query) return items;

    return items.filter(item => {
      const name = item.name.toLocaleLowerCase();
      const trimName = item.trimName.toLocaleLowerCase();
      return name.includes(query) || trimName.includes(query);
    });
  }, [items, searchText]);

  const handleReadCode = useCallback(
    (event: { nativeEvent: { codeStringValue: string } }) => {
      const scannedTrimName = event.nativeEvent.codeStringValue.trim();
      if (!scannedTrimName) return;

      setSearchText(scannedTrimName);
      closeScanner();
    },
    [closeScanner],
  );

  const handleOpenScanner = useCallback(() => {
    Keyboard.dismiss();
    return openScanner();
  }, [openScanner]);

  const handleSelectItem = useCallback(
    (item: AvailableItem) => {
      Keyboard.dismiss();
      onSelect(item);
    },
    [onSelect],
  );

  const handleCancel = useCallback(() => {
    Keyboard.dismiss();
    onCancel();
  }, [onCancel]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={handleCancel}
        />
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={[
              styles.sheet,
              {
                paddingBottom: keyboardVisible ? wp(2) : insets.bottom,
              },
            ]}
          >
            <CustomText
              size={FontSize.mediumLargeText}
              color={COLORS.primary}
              weight="bold"
              style={styles.title}
            >
              Available Items
            </CustomText>
            <CustomInput2
              placeholder="Search by trim name"
              value={searchText}
              onChangeText={setSearchText}
              rightIconName="barcode-outline"
              onRightPress={handleOpenScanner}
              returnKeyType="search"
              containerStyle={styles.searchInput}
            />
            <FlatList
              data={filteredItems}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.itemList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.itemRow}
                  onPress={() => handleSelectItem(item)}
                >
                  <CustomText
                    size={FontSize.smallText}
                    color={COLORS.black}
                    weight="semibold"
                  >
                    {`${item.name} `}
                    <CustomText
                      size={FontSize.smallText}
                      color={COLORS.greyText}
                      weight="regular"
                    >
                      {item.quantityLabel}
                    </CustomText>
                  </CustomText>
                  <CustomText
                    size={FontSize.smallText}
                    color={COLORS.greyText}
                    weight="regular"
                  >
                    {item.description}
                  </CustomText>
                </TouchableOpacity>
              )}
            />
          </View>
        </KeyboardAvoidingView>
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
                <CustomText
                  size={FontSize.normalLargeText}
                  color={COLORS.white}
                >
                  Close
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    ...StyleSheet.absoluteFill,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '75%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: wp(4),
    borderTopRightRadius: wp(4),
    paddingHorizontal: wp(4),
    paddingTop: wp(5),
  },
  title: {
    marginBottom: wp(3),
  },
  searchInput: {
    marginBottom: 0,
  },
  itemList: {
    flex: 1,
  },
  itemRow: {
    paddingVertical: wp(3),
    borderBottomWidth: wp(0.3),
    borderBottomColor: COLORS.border,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFill,
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

export default memo(AvailableItemsModal);
