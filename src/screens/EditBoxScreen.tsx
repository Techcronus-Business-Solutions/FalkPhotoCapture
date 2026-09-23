import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
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
import useBendexAssignedItems from '../hooks/useBendexAssignedItems';
import type {
  AddBoxItem,
  EditBoxNavigationProp,
  EditBoxRouteProp,
  AvailableItem,
} from '../navigation/types';

const EditBoxScreen: React.FC<{
  navigation: EditBoxNavigationProp;
  route: EditBoxRouteProp;
}> = ({ navigation, route }) => {
  const { orderNumber, box } = route.params;
  const insets = useSafeAreaInsets();
  const {
    items,
    setItems,
    loading: itemsLoading,
  } = useBendexAssignedItems(orderNumber, box.boxNumber);
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
  const [addQuantityError, setAddQuantityError] = useState<string | null>(null);
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
        trimName: selectedAvailableItem.trimName,
        position: selectedAvailableItem.position,
        description: selectedAvailableItem.description,
        quantity: Number(addQuantity),
        availableQuantity: selectedAvailableItem.availableQuantity,
      },
    ]);
    closeAddItem();
  };

  const handleUpdate = () => {
    console.log('Box ready to update:', {
      boxNumber: box.boxNumber,
      orderNumber,
      items,
    });
  };

  return (
    <View style={styles.root}>
      <Header title="Edit Box" onLeftPress={handleBack} />

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
              {`Item in Box- ${box.boxNumber}`}
            </CustomText>
            <View style={styles.countBadge}>
              <CustomText
                size={FontSize.smallText}
                color={COLORS.white}
                weight="bold"
              >
                {`${items.length} Item`}
              </CustomText>
            </View>
          </View>

          {itemsLoading ? (
            <View style={styles.itemsEmptyState}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : items.length === 0 ? (
            <View style={styles.itemsEmptyState}>
              <CustomText size={FontSize.normalText} color={COLORS.greyText}>
                No items in this box yet.
              </CustomText>
            </View>
          ) : (
            items.map(item => (
              <View
                key={item.id}
                style={[styles.itemRow, styles.itemRowBorder]}
              >
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
            ))
          )}
        </View>
      </ScrollView>

      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + wp(3) }]}
      >
        <CustomButton title="Update" onPress={handleUpdate} />
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
  itemsEmptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: wp(8),
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

export default EditBoxScreen;
