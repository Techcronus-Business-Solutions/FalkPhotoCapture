import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Header from '../components/Header';
import CustomText from '../components/CustomText';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import useBackHandler from '../hooks/useBackHandler';
import type {
  BoxContentsNavigationProp,
  BoxContentsRouteProp,
} from '../navigation/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BoxItem {
  id: string;
  name: string;
  qty: number;
}

// ─── Mock Data (replace with API data later) ─────────────────────────────────

const MOCK_BOX_ITEMS: BoxItem[] = [
  { id: '1', name: 'Parapet Trim 12.5', qty: 27 },
  { id: '2', name: 'Support Channel', qty: 13 },
  { id: '3', name: 'Fasteners', qty: 255 },
  { id: '4', name: 'Support Channel', qty: 100 },
  { id: '5', name: 'Support Channel', qty: 100 },
  { id: '6', name: 'Support Channel', qty: 100 },
  { id: '7', name: 'Parapet Trim 12.5', qty: 550 },
];

// ─── Screen ──────────────────────────────────────────────────────────────────

const BoxContentsScreen: React.FC<{
  navigation: BoxContentsNavigationProp;
  route: BoxContentsRouteProp;
}> = ({ navigation, route }) => {
  const { boxNumber } = route.params;
  const handleBack = useBackHandler(navigation);
  const items = useMemo(() => MOCK_BOX_ITEMS, []);

  return (
    <View style={styles.root}>
      <Header
        title="Item List"
        leftIconName="arrow-back"
        onLeftPress={handleBack}
      />

      <View style={styles.itemsCard}>
        <View style={styles.cardHeader}>
          <CustomText
            size={FontSize.mediumLargeText}
            color={COLORS.primary}
            weight="bold"
          >
            {`Item in Box - ${boxNumber}`}
          </CustomText>

          <View style={styles.itemCountBadge}>
            <CustomText
              size={FontSize.smallText}
              color={COLORS.white}
              weight="bold"
            >
              {`${items.length} Item`}
            </CustomText>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              <View style={styles.itemRow}>
                <CustomText
                  size={FontSize.normalLargeText}
                  color={COLORS.black}
                  weight="medium"
                >
                  {item.name}
                </CustomText>
                <CustomText
                  size={FontSize.smallText}
                  color={COLORS.greyText}
                >
                  {`Qty - ${item.qty}`}
                </CustomText>
              </View>

              {index < items.length - 1 && (
                <View style={styles.rowDivider} />
              )}
            </React.Fragment>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  itemsCard: {
    flex: 1,
    marginHorizontal: wp(4),
    marginVertical: wp(4),
    borderRadius: wp(4),
    borderWidth: wp(0.3),
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: wp(4),
  },
  itemCountBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: wp(3),
    paddingVertical: wp(2),
    borderRadius: wp(5),
  },
  cardDivider: {
    height: wp(0.3),
    backgroundColor: COLORS.border,
  },
  itemRow: {
    paddingHorizontal: wp(4),
    paddingVertical: wp(3),
  },
  rowDivider: {
    height: wp(0.3),
    backgroundColor: COLORS.border,
    marginHorizontal: wp(4),
  },
});

export default BoxContentsScreen;
