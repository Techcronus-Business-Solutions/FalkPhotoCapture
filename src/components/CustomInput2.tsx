import React, { memo, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import CustomText from './CustomText';
import Ionicons, {
  type IoniconsIconName,
} from '@react-native-vector-icons/ionicons';
import { COLORS, FONTS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';

interface CustomInputProps extends TextInputProps {
  leftIconName?: IoniconsIconName;
  rightIconName?: IoniconsIconName;
  onRightPress?: () => void;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
  label?: string;
}

const CustomInput2: React.FC<CustomInputProps> = ({
  leftIconName,
  rightIconName,
  onRightPress,
  isPassword = false,
  containerStyle,
  label,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && (
        <View style={styles.labelContainer}>
          <CustomText size={FontSize.normalText} color={COLORS.greyText} weight="regular">{label}</CustomText>
        </View>
      )}

      <View style={[styles.container, containerStyle]}>
        {leftIconName && (
          <Ionicons
            name={leftIconName}
            size={wp(5)}
            color={COLORS.primary}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={styles.input}
          placeholderTextColor={COLORS.greyText}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword(v => !v)}
            style={styles.rightIcon}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={wp(5)}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        ) : (
          rightIconName && (
            <TouchableOpacity
              onPress={onRightPress}
              style={styles.rightIcon}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={rightIconName}
                size={wp(5)}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: wp(2), // radius → rf
    borderWidth: wp(0.5), // border width → wp
    borderColor: COLORS.border,
    paddingHorizontal: wp(3), // horizontal padding → wp
    height: wp(12), // height → hp
    backgroundColor: COLORS.white,
  },
  leftIcon: {
    marginRight: wp(2), // horizontal margin → wp
  },
  input: {
    flex: 1,
    fontFamily: FONTS.REGULAR,
    fontSize: FontSize.normalLargeText, // font size → rf
    color: COLORS.black,
    height: '100%',
  },
  rightIcon: {
    padding: wp(1), // tap area padding → wp
  },
  wrapper: {
    position: 'relative',
    marginBottom: wp(5), // space for next input
  },

  labelContainer: {
    position: 'absolute',
    top: wp(-2.5), // vertical position → hp
    left: wp(3), // horizontal padding → wp
    backgroundColor: COLORS.white,
    paddingHorizontal: wp(1), // horizontal padding → wp
    zIndex: 10,
  },

});

export default memo(CustomInput2);
