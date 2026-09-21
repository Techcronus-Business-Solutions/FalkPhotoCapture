import React, { memo } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomText from './CustomText';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} onPress={onCancel} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom }]}>
          <CustomText
            size={FontSize.mediumLargeText}
            color={COLORS.primary}
            weight="bold"
            style={styles.title}
          >
            Available Items
          </CustomText>
          <FlatList
            data={items}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.itemRow}
                onPress={() => onSelect(item)}
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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    maxHeight: '75%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: wp(4),
    borderTopRightRadius: wp(4),
    paddingHorizontal: wp(4),
    paddingTop: wp(5),
  },
  title: {
    marginBottom: wp(3),
  },
  itemRow: {
    paddingVertical: wp(3),
    borderBottomWidth: wp(0.3),
    borderBottomColor: COLORS.border,
  },
});

export default memo(AvailableItemsModal);
