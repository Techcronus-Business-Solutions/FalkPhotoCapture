import React, { memo } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomButton from './CustomButton';
import CustomInput2 from './CustomInput2';
import CustomText from './CustomText';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';

interface ItemQuantityModalProps {
  visible: boolean;
  title: string;
  label: string;
  buttonTitle: string;
  quantity: string;
  onQuantityChange: (quantity: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const ItemQuantityModal: React.FC<ItemQuantityModalProps> = ({
  visible,
  title,
  label,
  buttonTitle,
  quantity,
  onQuantityChange,
  onCancel,
  onConfirm,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    onRequestClose={onCancel}
  >
    <TouchableOpacity
      style={styles.overlay}
      activeOpacity={1}
      onPress={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          <CustomText
            size={FontSize.mediumLargeText}
            color={COLORS.primary}
            weight="bold"
            style={styles.title}
          >
            {title}
          </CustomText>
          <View style={styles.inputWrapper}>
            <CustomInput2
              label={label}
              value={quantity}
              onChangeText={onQuantityChange}
              keyboardType="number-pad"
              returnKeyType="done"
              containerStyle={styles.quantityInput}
            />
          </View>
          <CustomButton
            title={buttonTitle}
            variant="filled"
            onPress={onConfirm}
            style={styles.updateButton}
          />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </TouchableOpacity>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(6),
  },
  keyboardAvoidingView: {
    width: '100%',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: wp(4),
    padding: wp(6),
    width: '100%',
    alignItems: 'center',
  },
  title: {
    alignSelf: 'flex-start',
    marginBottom: wp(3),
  },
  quantityInput: {
    width: '100%',
  },
  inputWrapper: {
    width: '100%',
    marginVertical: wp(1),
  },
  updateButton: {
    width: '100%',
    marginTop: wp(2),
  },
});

export default memo(ItemQuantityModal);
