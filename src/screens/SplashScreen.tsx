import React from 'react';
import { View, StyleSheet, ActivityIndicator, Image } from 'react-native';
import CustomText from '../components/CustomText';
import { COLORS } from '../assets/constants';
import { hp, wp } from '../utils/responsive';
import { FontSize } from '../assets/constants';

const SplashScreen: React.FC = () => (
  <View style={styles.container}>
    <Image
      source={require('../assets/images/splash_bg.png')}
      resizeMode="cover"
      style={styles.backgroundImage}
    />

    {/* Bottom Loader Section */}
    <View style={styles.bottomContainer}>
      <ActivityIndicator color={COLORS.white} size="large" />

      <CustomText
        size={FontSize.smallMediumText}
        color={COLORS.white}
        style={styles.loadingText}
      >
        Loading...
      </CustomText>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  backgroundImage: {
    width: wp(100),
    height: hp(100),
  },

  bottomContainer: {
    position: 'absolute',
    bottom: wp(8),
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: wp(2),
  },
});

export default SplashScreen;
