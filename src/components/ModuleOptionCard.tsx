import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import CustomText from './CustomText';
import { COLORS, FONTS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';

interface ModuleOptionCardProps {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onPress?: () => void;
}

const ModuleOptionCard: React.FC<ModuleOptionCardProps> = ({
  title,
  subtitle,
  selected = false,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.card, selected && styles.selected]}
    >
      <View style={styles.textWrapper}>
        <CustomText
          size={FontSize.mediumText}
          color={selected ? COLORS.primary : COLORS.black}
          style={{ fontFamily: FONTS.SEMIBOLD }}
        >
          {title}
        </CustomText>
        {subtitle && (
          <CustomText
            size={FontSize.smallMediumText}
            color={COLORS.greyText}
            style={{ marginTop: wp(1) }}
          >
            {subtitle}
          </CustomText>
        )}
      </View>

      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: wp(4),
    marginHorizontal: wp(4),
    marginTop: wp(4),
    borderRadius: wp(3),
    borderWidth: wp(0.4),
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  selected: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    backgroundColor: '#EFF3FD',
  },
  textWrapper: {
    flex: 1,
  },
  radioOuter: {
    width: wp(6),
    height: wp(6),
    borderRadius: wp(6),
    borderWidth: wp(0.5),
    borderColor: COLORS.greyText,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: wp(3),
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(3),
    backgroundColor: COLORS.primary,
  },
});

export default memo(ModuleOptionCard);
