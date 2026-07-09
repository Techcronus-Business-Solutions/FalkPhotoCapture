import React, { memo, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
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
}

const CustomInput: React.FC<CustomInputProps> = ({
  leftIconName,
  rightIconName,
  onRightPress,
  isPassword = false,
  containerStyle,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
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
        placeholderTextColor={COLORS.primary}
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
  },
  leftIcon: {
    marginRight: wp(2), // horizontal margin → wp
  },
  input: {
    paddingVertical: 0,
    flex: 1,
    fontFamily: FONTS.REGULAR,
    fontSize: FontSize.normalLargeText, // font size → rf
    color: COLORS.black,
    height: '100%',
  },
  rightIcon: {
    padding: wp(1), // tap area padding → wp
  },
});

export default memo(CustomInput);
