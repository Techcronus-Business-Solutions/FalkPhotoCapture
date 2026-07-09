import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons, {
  type IoniconsIconName,
} from '@react-native-vector-icons/ionicons';
import CustomText from './CustomText';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';

interface HeaderProps {
  title: string;
  onLeftPress?: () => void;
  leftIconName?: IoniconsIconName;
  onRightPress?: () => void;
  rightIconName?: IoniconsIconName;
}

const Header: React.FC<HeaderProps> = ({
  title,
  onLeftPress,
  leftIconName = 'arrow-back',
  onRightPress,
  rightIconName,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + wp(2) }]}>
      <TouchableOpacity
        onPress={onLeftPress}
        disabled={!onLeftPress}
        style={styles.iconBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {onLeftPress && (
          <Ionicons
            name={leftIconName}
            size={wp(6)} // icon size → rf
            color={COLORS.white}
          />
        )}
      </TouchableOpacity>

      <CustomText
        size={FontSize.mediumLargeText} // font size → rf
        color={COLORS.white}
        weight="semibold"
        numberOfLines={1}
        style={styles.title}
      >
        {title}
      </CustomText>

      <TouchableOpacity
        onPress={onRightPress}
        disabled={!onRightPress}
        style={styles.iconBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {rightIconName && (
          <Ionicons
            name={rightIconName}
            size={wp(6)} // icon size → rf
            color={COLORS.white}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4), // horizontal padding → wp
    paddingBottom: wp(2), // vertical padding → hp
  },
  iconBtn: {
    width: wp(9), // width → wp
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: wp(2), // horizontal padding → wp
  },
});

export default memo(Header);
