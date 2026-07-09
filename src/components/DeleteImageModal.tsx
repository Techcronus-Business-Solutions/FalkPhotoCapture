import React, { memo } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import CustomText from './CustomText';
import CustomButton from './CustomButton';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';

interface DeleteImageModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteImageModal: React.FC<DeleteImageModalProps> = ({
  visible,
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
      <TouchableOpacity activeOpacity={1} style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name="trash-outline" size={wp(12)} color={COLORS.primary} />
        </View>
        <CustomText
          size={FontSize.mediumLargeText}
          color={COLORS.primary}
          weight="bold"
          style={styles.title}
        >
          Remove Photo
        </CustomText>
        <CustomText
          size={FontSize.normalText}
          color={COLORS.greyText}
          weight="regular"
          style={styles.message}
        >
          Are you sure you want to remove this photo?
        </CustomText>
        <View style={styles.buttons}>
          <CustomButton
            title="Cancel"
            variant="outline"
            onPress={onCancel}
            style={[styles.btn, { marginRight: wp(3) }]}
          />
          <CustomButton
            title="Remove"
            variant="filled"
            onPress={onConfirm}
            style={styles.btn}
          />
        </View>
      </TouchableOpacity>
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: wp(4),
    padding: wp(6),
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: wp(4),
  },
  title: {
    marginBottom: wp(1),
    textAlign: 'center',
  },
  message: {
    marginBottom: wp(3),
    lineHeight: wp(6),
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    marginTop: wp(3),
  },
  btn: {
    flex: 1,
  },
});

export default memo(DeleteImageModal);
