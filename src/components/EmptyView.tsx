import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Ionicons, {
  type IoniconsIconName,
} from '@react-native-vector-icons/ionicons';
import CustomText from './CustomText';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';

interface EmptyViewProps {
  message?: string;
  iconName?: IoniconsIconName;
}

const EmptyView: React.FC<EmptyViewProps> = ({
  message = 'No results found.',
  iconName = 'document-outline',
}) => (
  <View style={styles.container}>
    <Ionicons name={iconName} size={wp(12)} color={COLORS.greyText} />
    <CustomText
      size={FontSize.normalText}
      color={COLORS.greyText}
      weight="regular"
      style={styles.text}
    >
      {message}
    </CustomText>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: wp(10), // vertical padding → hp
    paddingHorizontal: wp(6), // horizontal padding → wp
  },
  text: {
    marginTop: wp(2), // vertical margin → hp
    textAlign: 'center',
  },
});

export default memo(EmptyView);
