import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import CustomText from './CustomText';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';

const SyncingOverlay: React.FC = () => (
  <View style={styles.overlay} pointerEvents="none">
    <ActivityIndicator size="large" color={COLORS.primary} />
    <CustomText
      style={styles.text}
      size={FontSize.normalLargeText}
      color={COLORS.black}
      weight="bold"
    >
      Syncing...
    </CustomText>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  text: {
    marginTop: wp(4),
  },
});

export default SyncingOverlay;
