import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Header from '../components/Header';
import ShipmentCard from '../components/ShipmentCard';
import CustomButton from '../components/CustomButton';
import EmptyView from '../components/EmptyView';
import LogoutModal from '../components/LogoutModal';
import CustomText from '../components/CustomText';
import { COLORS, FONTS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import { useShipmentStore } from '../store/shipmentStore';
import { useAuthStore } from '../store/authStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import type { DashboardNavigationProp } from '../navigation/types';
import type { Shipment } from '../data/mockData';
import CustomInput from '../components/CustomInput';

const DashboardScreen: React.FC<{ navigation: DashboardNavigationProp }> = ({
  navigation,
}) => {
  const [logoutVisible, setLogoutVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const {
    filteredShipments,
    searchQuery,
    isLoading,
    syncShipments,
    searchShipments,
  } = useShipmentStore();
  const logout = useAuthStore(state => state.logout);
  const { isConnected } = useNetworkStatus();

  const handleSync = useCallback(async () => {
    if (!isConnected) {
      Toast.show({
        type: 'error',
        text1: 'Offline',
        text2: 'No internet connection. Connect to sync.',
      });
      return;
    }

    try {
      await syncShipments();
      Toast.show({
        type: 'success',
        text1: 'Synced',
        text2: 'Shipments are up to date.',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Sync failed',
        text2:
          error instanceof Error
            ? error.message
            : 'Unable to load shipments. Please try again.',
      });
    }
  }, [isConnected, syncShipments]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    syncShipments().catch(() => {
      /* ignore initial fetch errors; user can pull to refresh */
    });
  }, [isConnected, syncShipments]);

  const handleLogout = useCallback(async () => {
    setLogoutVisible(false);
    await logout();
  }, [logout]);

  const renderItem = useCallback(
    ({ item }: { item: Shipment }) => (
      <ShipmentCard
        shipment={item}
        onPress={() =>
          navigation.navigate('ShipmentDetail', {
            shipmentId: item.id,
            bolNumber: item.bolNumber,
          })
        }
      />
    ),
    [navigation],
  );

  const keyExtractor = useCallback((item: Shipment) => item.id, []);

  return (
    <View style={styles.root}>
      <Header
        title="Dashboard"
        leftIconName="log-out-outline"
        onLeftPress={() => setLogoutVisible(true)}
      />

      {!isConnected && (
        <View style={styles.offlineBanner}>
          <CustomText size={FontSize.smallMediumText} color={COLORS.white}>
            You are offline. Changes will sync when connected.
          </CustomText>
        </View>
      )}

      <View style={styles.searchContainer}>
        <CustomInput
          placeholder="Search by BoL / Shipment No..."
          value={searchQuery}
          onChangeText={searchShipments}
          leftIconName="search-outline"
          returnKeyType="next"
          autoComplete="username"
          onSubmitEditing={() => {}}
        />
      </View>

      <CustomText
        size={FontSize.normalLargeText}
        color={COLORS.black}
        style={{ fontFamily: FONTS.BOLD, paddingHorizontal: wp(4) }} // horizontal margin → wp
      >
        Shipments
      </CustomText>

      <FlatList
        data={filteredShipments}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + wp(2) + wp(14) }, // vertical safe area + bottom bar height → hp
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyView
            message={isLoading ? 'Loading shipments...' : 'No shipments found.'}
            iconName="cube-outline"
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleSync}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + wp(2) }, // vertical safe area → hp
        ]}
      >
        <CustomButton
          title="Sync Now"
          onPress={handleSync}
          loading={isLoading}
        />
      </View>

      <LogoutModal
        visible={logoutVisible}
        onCancel={() => setLogoutVisible(false)}
        onConfirm={handleLogout}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  offlineBanner: {
    backgroundColor: COLORS.failed,
    alignItems: 'center',
    paddingVertical: wp(2), // vertical padding → hp
    paddingHorizontal: wp(4), // horizontal padding → wp
  },
  searchContainer: {
    paddingHorizontal: wp(4), // horizontal padding → wp
    paddingVertical: wp(5), // vertical padding → hp
  },

  list: {},
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: wp(4), // horizontal padding → wp
    paddingTop: wp(2), // vertical padding → hp
  },
});

export default DashboardScreen;
