import React, { memo } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import CustomText from './CustomText';
import { COLORS, FONTS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';

type Variant = 'filled' | 'outline';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'filled',
  style,
}) => {
  const isFilled = variant === 'filled';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        isFilled ? styles.filled : styles.outline,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={isFilled ? COLORS.white : COLORS.primary}
          size="small"
        />
      ) : (
        <CustomText
          size={FontSize.normalLargeText}
          color={isFilled ? COLORS.white : COLORS.primary}
          style={styles.btnText}
        >
          {title}
        </CustomText>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: wp(12), // height → hp
    borderRadius: wp(2), // radius → rf
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(4), // horizontal padding → wp
  },
  filled: {
    backgroundColor: COLORS.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: wp(0.4), // border width → wp
    borderColor: COLORS.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  btnText: {
    fontFamily: FONTS.SEMIBOLD,
  },
});

export default memo(CustomButton);
