import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Ionicons from '@react-native-vector-icons/ionicons';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import CustomInput2 from '../components/CustomInput2';
import CustomText from '../components/CustomText';
import DeleteItemModal from '../components/DeleteItemModal';
import EditItemModal from '../components/EditItemModal';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import { toDigitsOnly } from '../utils/input';
import useBackHandler from '../hooks/useBackHandler';
import type {
  AddBoxNavigationProp,
  AddBoxRouteProp,
  AddBoxItem,
} from '../navigation/types';

const DUMMY_ITEMS: AddBoxItem[] = [
  {
    id: '1',
    name: 'Parapet Trim 12.5 (Qty - 27)',
    description: 'PVDF - Slate Gray-6,172.2 mm × 151.2',
    quantity: 15,
  },
  {
    id: '2',
    name: 'Parapet Trim 12.5 (Qty - 27)',
    description: 'PVDF - Slate Gray-6,172.2 mm × 151.2',
    quantity: 15,
  },
];

const AddBoxScreen: React.FC<{
  navigation: AddBoxNavigationProp;
  route: AddBoxRouteProp;
}> = ({ navigation, route }) => {
  const { orderNumber } = route.params;
  const [boxNumber, setBoxNumber] = useState('');
  const [items, setItems] = useState<AddBoxItem[]>(DUMMY_ITEMS);
  const [editItem, setEditItem] = useState<AddBoxItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<AddBoxItem | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const handleBack = useBackHandler(navigation);

  const openEditItem = (item: AddBoxItem) => {
    setEditQuantity(String(item.quantity));
    setEditItem(item);
  };

  const handleUpdateItem = () => {
    if (!editItem || !editQuantity.trim()) {
      return;
    }

    setItems(previousItems =>
      previousItems.map(item =>
        item.id === editItem.id
          ? { ...item, quantity: Number(editQuantity) }
          : item,
      ),
    );
    setEditItem(null);
  };

  const handleDeleteItem = () => {
    if (!deleteItem) {
      return;
    }

    setItems(previousItems =>
      previousItems.filter(item => item.id !== deleteItem.id),
    );
    setDeleteItem(null);
  };

  const handleSave = () => {
    if (!boxNumber.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a box number.',
      });
      return;
    }

    console.log('Box ready to save:', {
      orderNumber,
      boxNumber: boxNumber.trim(),
      items,
    });
  };

  return (
    <View style={styles.root}>
      <Header title="Add Box" onLeftPress={handleBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.orderSection}>
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

        <CustomInput2
          label="Box Number"
          value={boxNumber}
          onChangeText={value => setBoxNumber(toDigitsOnly(value))}
          keyboardType="number-pad"
          returnKeyType="done"
        />

        <CustomButton
          title="Add New Item"
          onPress={() => undefined}
          style={styles.addItemButton}
        />

        <View style={styles.itemsCard}>
          <View style={styles.cardHeader}>
            <CustomText
              size={FontSize.mediumLargeText}
              color={COLORS.primary}
              weight="bold"
            >
              Item In Box
            </CustomText>
            <View style={styles.countBadge}>
              <CustomText
                size={FontSize.smallText}
                color={COLORS.white}
                weight="bold"
              >
                {`${items.length} Items`}
              </CustomText>
            </View>
          </View>

          {items.map(item => (
            <View key={item.id} style={[styles.itemRow, styles.itemRowBorder]}>
              <View style={styles.itemText}>
                <CustomText
                  size={FontSize.smallText}
                  color={COLORS.black}
                  weight="semibold"
                >
                  {item.name}
                </CustomText>
                <CustomText
                  size={FontSize.smallText}
                  color={COLORS.greyText}
                  weight="regular"
                >
                  {item.description}
                </CustomText>
              </View>
              <View style={styles.quantityBox}>
                <CustomText
                  size={FontSize.normalText}
                  color={COLORS.black}
                  weight="regular"
                >
                  {item.quantity}
                </CustomText>
              </View>
              <TouchableOpacity
                style={styles.itemAction}
                onPress={() => openEditItem(item)}
              >
                <Ionicons
                  name="create-outline"
                  size={wp(5)}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.itemAction}
                onPress={() => setDeleteItem(item)}
              >
                <Ionicons
                  name="trash-outline"
                  size={wp(5)}
                  color={COLORS.failed}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <CustomButton title="Save" onPress={handleSave} />
      </View>

      <EditItemModal
        visible={editItem !== null}
        onCancel={() => setEditItem(null)}
        onConfirm={handleUpdateItem}
        title={editItem ? editItem.name.replace(/\s+\(Qty.*\)$/, '') : ''}
        quantity={editQuantity}
        onQuantityChange={value => setEditQuantity(toDigitsOnly(value))}
      />

      <DeleteItemModal
        visible={deleteItem !== null}
        onCancel={() => setDeleteItem(null)}
        onConfirm={handleDeleteItem}
      />
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
  orderSection: {
    marginBottom: wp(6),
  },
  addItemButton: {
    marginBottom: wp(4),
  },
  itemsCard: {
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(2),
  },
  itemRowBorder: {
    borderTopWidth: wp(0.3),
    borderTopColor: COLORS.border,
  },
  itemText: {
    flex: 1,
    paddingRight: wp(2),
  },
  quantityBox: {
    minWidth: wp(11),
    height: wp(8),
    borderWidth: wp(0.3),
    borderColor: COLORS.border,
    borderRadius: wp(2),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(1),
  },
  itemAction: {
    padding: wp(1),
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

export default AddBoxScreen;
