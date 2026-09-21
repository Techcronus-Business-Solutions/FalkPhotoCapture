import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import CustomText from '../components/CustomText';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import useBackHandler from '../hooks/useBackHandler';
import type {
  BoxDetailNavigationProp,
  BoxDetailRouteProp,
} from '../navigation/types';

const BoxDetailScreen: React.FC<{
  navigation: BoxDetailNavigationProp;
  route: BoxDetailRouteProp;
}> = ({ navigation, route }) => {
  const { orderNumber, boxes } = route.params;
  const handleBack = useBackHandler(navigation);

  return (
    <View style={styles.root}>
      <Header title="Box Detail" onLeftPress={handleBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.orderCard}>
          <View style={styles.orderDetail}>
            <CustomText
              size={FontSize.smallText}
              color={COLORS.greyText}
              weight="regular"
            >
              Order Number
            </CustomText>
            <CustomText
              size={FontSize.normalLargeText}
              color={COLORS.black}
              weight="semibold"
            >
              {orderNumber}
            </CustomText>
          </View>
          <View style={styles.entityDetail}>
            <CustomText
              size={FontSize.smallText}
              color={COLORS.greyText}
              weight="regular"
            >
              Entity Type
            </CustomText>
            <CustomText
              size={FontSize.normalLargeText}
              color={COLORS.black}
              weight="semibold"
            >
              Trim Box
            </CustomText>
          </View>
        </View>

        <View style={styles.boxCard}>
          <View style={styles.cardHeader}>
            <CustomText
              size={FontSize.mediumLargeText}
              color={COLORS.primary}
              weight="bold"
            >
              Box List
            </CustomText>
            <View style={styles.countBadge}>
              <CustomText
                size={FontSize.smallText}
                color={COLORS.white}
                weight="bold"
              >
                {`${boxes.length} Boxes`}
              </CustomText>
            </View>
          </View>

          {boxes.map((box, index) => (
            <TouchableOpacity
              key={`${box.boxName}-${index}`}
              style={[styles.boxRow, index > 0 && styles.boxRowBorder]}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('EditBox', { orderNumber, box })
              }
            >
              <Ionicons
                name="cube-outline"
                size={wp(8)}
                color={COLORS.primary}
                style={styles.boxIcon}
              />
              <View style={styles.boxText}>
                <CustomText
                  size={FontSize.normalLargeText}
                  color={COLORS.primary}
                  weight="semibold"
                >
                  {box.boxName}
                </CustomText>
                <CustomText
                  size={FontSize.normalText}
                  color={COLORS.primary}
                  weight="regular"
                >
                  {`${box.itemCount} Items`}
                </CustomText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={wp(6)}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <CustomButton
          title="Add New Box"
          onPress={() => navigation.navigate('AddBox', { orderNumber, boxes })}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contentContainer: {
    padding: wp(4),
    paddingBottom: wp(24),
  },
  orderCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightBlue,
    borderRadius: wp(2),
    padding: wp(4),
    marginBottom: wp(4),
  },
  orderDetail: {
    flex: 1,
    borderRightWidth: wp(0.3),
    borderRightColor: COLORS.border,
  },
  entityDetail: {
    flex: 0.8,
    paddingLeft: wp(4),
  },
  boxCard: {
    borderWidth: wp(0.3),
    borderColor: COLORS.border,
    borderRadius: wp(3),
    padding: wp(2),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp(2),
    marginBottom: wp(1),
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: wp(5),
    paddingHorizontal: wp(3),
    paddingVertical: wp(2),
  },
  boxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: wp(0.3),
    borderColor: COLORS.border,
    borderRadius: wp(2),
    padding: wp(3),
    margin: wp(1),
  },
  boxRowBorder: {
    marginTop: wp(2),
  },
  boxIcon: {
    marginRight: wp(4),
  },
  boxText: {
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: wp(4),
    paddingTop: wp(3),
    paddingBottom: wp(3),
  },
});

export default BoxDetailScreen;
