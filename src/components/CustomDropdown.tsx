import React, { memo, useMemo, useState } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import CustomText from './CustomText';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';

interface DropdownOption {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  label?: string;
  value?: string;
  placeholder?: string;
  options: DropdownOption[];
  onValueChange: (value: string) => void;
  containerStyle?: ViewStyle;
  disabled?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  value,
  placeholder,
  options,
  onValueChange,
  containerStyle,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = useMemo(
    () => options.find(option => option.value === value),
    [options, value],
  );

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <CustomText
            size={FontSize.normalText}
            color={COLORS.greyText}
            weight="regular"
          >
            {label}
          </CustomText>
        </View>
      )}

      <TouchableOpacity
        style={[styles.container, disabled && styles.disabled]}
        activeOpacity={0.8}
        onPress={() => {
          if (!disabled) {
            setIsOpen(true);
          }
        }}
      >
        <CustomText
          size={FontSize.normalLargeText}
          color={selectedOption ? COLORS.black : COLORS.greyText}
          weight={selectedOption ? 'regular' : 'regular'}
          style={selectedOption ? undefined : styles.placeholder}
        >
          {selectedOption?.label ?? placeholder}
        </CustomText>
        <Ionicons
          name="chevron-down-outline"
          size={wp(5)}
          color={COLORS.primary}
        />
      </TouchableOpacity>

      <Modal
        transparent
        visible={isOpen}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            {options.map(option => (
              <TouchableOpacity
                key={option.value}
                style={styles.optionItem}
                onPress={() => {
                  setIsOpen(false);
                  onValueChange(option.value);
                }}
              >
                <CustomText
                  size={FontSize.normalText}
                  color={COLORS.black}
                  weight="regular"
                >
                  {option.label}
                </CustomText>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: wp(5),
  },
  labelContainer: {
    position: 'absolute',
    top: wp(-2.5),
    left: wp(3),
    backgroundColor: COLORS.white,
    paddingHorizontal: wp(1),
    zIndex: 10,
  },
  container: {
    height: wp(12),
    borderRadius: wp(2),
    borderWidth: wp(0.5),
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: wp(3),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholder: {
    color: COLORS.greyText,
  },
  disabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: wp(4),
    borderTopRightRadius: wp(4),
    paddingVertical: wp(3),
    paddingHorizontal: wp(4),
  },
  optionItem: {
    paddingVertical: wp(3),
    borderBottomWidth: wp(0.3),
    borderBottomColor: COLORS.border,
  },
});

export default memo(CustomDropdown);
