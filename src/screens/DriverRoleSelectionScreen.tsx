import React from 'react';
import { View, StyleSheet } from 'react-native';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import CustomText from '../components/CustomText';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import useBackHandler from '../hooks/useBackHandler';
import type {
  DriverRoleConfig,
  DriverRoleSelectionNavigationProp,
} from '../navigation/types';

const ROLE_CONFIGS: DriverRoleConfig[] = [
  {
    driverRole: 'Production Combi Driver',
    defaultEntityType: 'Panel',
    defaultScanType: 'Move',
  },
  {
    driverRole: 'Trims Combi Driver',
    defaultEntityType: 'Trim Box',
    defaultScanType: 'Move',
  },
  {
    driverRole: 'Logistic Combi Driver',
    defaultEntityType: 'Panel',
    defaultScanType: 'Ship',
  },
];

interface DriverRoleSelectionScreenProps {
  navigation: DriverRoleSelectionNavigationProp;
}

const DriverRoleSelectionScreen: React.FC<DriverRoleSelectionScreenProps> = ({
  navigation,
}) => {
  const handleBack = useBackHandler(navigation);

  const handleRoleSelect = (config: DriverRoleConfig) => {
    navigation.navigate('ShippingManagement', config);
  };

  return (
    <View style={styles.root}>
      <Header
        title="Driver Role Selection"
        leftIconName="arrow-back"
        onLeftPress={handleBack}
      />
      <View style={styles.content}>
        <CustomText
          size={FontSize.mediumLargeText}
          color={COLORS.black}
          weight="semibold"
        >
          Select Driver Role
        </CustomText>
        <CustomText
          size={FontSize.smallText}
          color={COLORS.greyText}
          style={styles.subtitle}
        >
          Choose the driver role to continue.
        </CustomText>
        <View style={styles.buttonGroup}>
          {ROLE_CONFIGS.map(config => (
            <CustomButton
              key={config.driverRole}
              title={config.driverRole}
              onPress={() => handleRoleSelect(config)}
              style={styles.roleButton}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: wp(4),
    marginTop: wp(4),
  },
  subtitle: {
    marginTop: wp(1),
  },
  buttonGroup: {
    marginTop: wp(6),
  },
  roleButton: {
    width: '100%',
    marginBottom: wp(4),
  },
});

export default DriverRoleSelectionScreen;
