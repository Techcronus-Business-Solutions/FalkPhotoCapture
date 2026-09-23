import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Ionicons from '@react-native-vector-icons/ionicons';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import CustomInput2 from '../components/CustomInput2';
import CustomText from '../components/CustomText';
import DeleteItemModal from '../components/DeleteItemModal';
import AvailableItemsModal from '../components/AvailableItemsModal';
import ItemQuantityModal from '../components/ItemQuantityModal';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import { toDigitsOnly } from '../utils/input';
import { getQuantityValidationError } from '../utils/quantity';
import useBackHandler from '../hooks/useBackHandler';
import useAvailableBendexItems from '../hooks/useAvailableBendexItems';
import type {
  AddBoxNavigationProp,
  AddBoxRouteProp,
  AddBoxItem,
  AvailableItem,
} from '../navigation/types';

const AddBoxScreen: React.FC<{
  navigation: AddBoxNavigationProp;
  route: AddBoxRouteProp;
}> = ({ navigation, route }) => {
  const { orderNumber } = route.params;
  const insets = useSafeAreaInsets();
  const [boxNumber, setBoxNumber] = useState('');
  const [items, setItems] = useState<AddBoxItem[]>([]);
  const [editItem, setEditItem] = useState<AddBoxItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<AddBoxItem | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editQuantityError, setEditQuantityError] = useState<string | null>(
    null,
  );
  const [showAvailableItems, setShowAvailableItems] = useState(false);
  const [selectedAvailableItem, setSelectedAvailableItem] =
    useState<AvailableItem | null>(null);
  const [addQuantity, setAddQuantity] = useState('1');
  const [addQuantityError, setAddQuantityError] = useState<string | null>(
    null,
  );
  const handleBack = useBackHandler(navigation);
  const { availableItems } = useAvailableBendexItems(orderNumber);

  const openEditItem = (item: AddBoxItem) => {
    setEditQuantity(String(item.quantity));
    setEditQuantityError(null);
    setEditItem(item);
  };

  const closeEditItem = () => {
    setEditItem(null);
    setEditQuantityError(null);
  };

  const handleUpdateItem = () => {
    if (!editItem) {
      return;
    }

    const validationError = getQuantityValidationError(
      editQuantity,
      editItem.availableQuantity,
    );
    if (validationError) {
      setEditQuantityError(validationError);
      return;
    }

    setItems(previousItems =>
      previousItems.map(item =>
        item.id === editItem.id
          ? { ...item, quantity: Number(editQuantity) }
          : item,
      ),
    );
    closeEditItem();
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

  const handleSelectAvailableItem = (item: AvailableItem) => {
    setSelectedAvailableItem(item);
    setShowAvailableItems(false);
    setAddQuantity('1');
    setAddQuantityError(null);
  };

  const closeAddItem = () => {
    setSelectedAvailableItem(null);
    setAddQuantityError(null);
  };

  const handleAddItem = () => {
    if (!selectedAvailableItem) {
      return;
    }

    const validationError = getQuantityValidationError(
      addQuantity,
      selectedAvailableItem.availableQuantity,
    );
    if (validationError) {
      setAddQuantityError(validationError);
      return;
    }

    setItems(previousItems => [
      ...previousItems,
      {
        id: selectedAvailableItem.id,
        name: `${selectedAvailableItem.name} ${selectedAvailableItem.quantityLabel}`,
        description: selectedAvailableItem.description,
        quantity: Number(addQuantity),
        availableQuantity: selectedAvailableItem.availableQuantity,
      },
    ]);
    closeAddItem();
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
          onPress={() => setShowAvailableItems(true)}
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

      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + wp(3) }]}
      >
        <CustomButton title="Save" onPress={handleSave} />
      </View>

      <ItemQuantityModal
        visible={editItem !== null}
        onCancel={closeEditItem}
        onConfirm={handleUpdateItem}
        title={editItem ? editItem.name.replace(/\s+\(Qty.*\)$/, '') : ''}
        label="Edit Quantity"
        buttonTitle="Update"
        quantity={editQuantity}
        onQuantityChange={(value: string) => {
          setEditQuantity(toDigitsOnly(value));
          setEditQuantityError(null);
        }}
        error={editQuantityError}
      />

      <DeleteItemModal
        visible={deleteItem !== null}
        onCancel={() => setDeleteItem(null)}
        onConfirm={handleDeleteItem}
      />

      <AvailableItemsModal
        visible={showAvailableItems}
        items={availableItems.filter(
          availableItem => !items.some(item => item.id === availableItem.id),
        )}
        onCancel={() => setShowAvailableItems(false)}
        onSelect={handleSelectAvailableItem}
      />

      <ItemQuantityModal
        visible={selectedAvailableItem !== null}
        onCancel={closeAddItem}
        onConfirm={handleAddItem}
        title={selectedAvailableItem?.name ?? ''}
        label="Add Quantity"
        buttonTitle="Add"
        quantity={addQuantity}
        onQuantityChange={(value: string) => {
          setAddQuantity(toDigitsOnly(value));
          setAddQuantityError(null);
        }}
        error={addQuantityError}
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
