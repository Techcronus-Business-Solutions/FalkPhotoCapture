import React, { memo } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { rf } from '../utils/responsive';
import { COLORS, FONTS } from '../assets/constants';

type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold';

interface CustomTextProps extends TextProps {
  size?: number;
  color?: string;
  weight?: FontWeight;
  style?: TextStyle | TextStyle[];
}

const FONT_FAMILY_MAP: Record<FontWeight, string> = {
  regular: FONTS.REGULAR,
  medium: FONTS.MEDIUM,
  semibold: FONTS.SEMIBOLD,
  bold: FONTS.BOLD,
};

const CustomText: React.FC<CustomTextProps> = ({
  size = 14,
  color = COLORS.black,
  weight = 'regular',
  style,
  children,
  ...props
}) => (
  <Text
    style={[
      {
        fontSize: rf(size),
        color,
        fontFamily: FONT_FAMILY_MAP[weight],
      },
      style,
    ]}
    {...props}
  >
    {children}
  </Text>
);

export default memo(CustomText);
