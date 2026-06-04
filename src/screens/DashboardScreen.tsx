import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
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
import { usePendingUploadsStore } from '../store/pendingUploadsStore';
import { useAuthStore } from '../store/authStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import type { DashboardNavigationProp } from '../navigation/types';
import type { Shipment, ShipmentStatus } from '../types/shipment';
import CustomInput from '../components/CustomInput';

const DashboardScreen: React.FC<{ navigation: DashboardNavigationProp }> = ({
  navigation,
}) => {
  const [logoutVisible, setLogoutVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const {
    shipments,
    filteredShipments,
    searchQuery,
    isLoading,
    syncShipments,
    syncPendingUploads,
    loadShipments,
    searchShipments,
  } = useShipmentStore();
  const logout = useAuthStore(state => state.logout);
  const { isConnected } = useNetworkStatus();
  const pendingUploadEntries = usePendingUploadsStore(
    state => state.pendingUploads,
  );

  const displayShipments = useMemo<
    Array<{ shipment: Shipment; displayStatus: ShipmentStatus }>
  >(
    () =>
      filteredShipments.map(shipment => {
        const status = shipment.status;
        if (status !== 'Offline') {
          return { shipment, displayStatus: status };
        }

        const sharePointCount = shipment.sharePointLinks?.length ?? 0;
        const pendingCount = pendingUploadEntries.filter(
          upload =>
            upload.shipmentNumber === shipment.bolNumber &&
            upload.uploadStatus === 'pending',
        ).length;

        if (pendingCount === 0) {
          return {
            shipment,
            displayStatus: sharePointCount > 0 ? 'Uploaded' : 'Pending',
          };
        }

        return { shipment, displayStatus: 'Offline' };
      }),
    [filteredShipments, pendingUploadEntries],
  );
  const initialLoadRequestedRef = useRef(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);

  const handleSync = useCallback(async () => {
    if (isSyncingRef.current) return;
    if (!isConnected) {
      Toast.show({
        type: 'error',
        text1: 'Offline',
        text2: 'No internet connection. Connect to sync.',
      });
      return;
    }
    // immediate guard to prevent double-starts (double-tap or concurrent calls)
    isSyncingRef.current = true;
    setIsSyncing(true);
    try {
      await syncPendingUploads();

      try {
        await syncShipments();
        Toast.show({
          type: 'success',
          text1: 'Synced',
          text2: 'Shipments and pending uploads are up to date.',
        });
      } catch {
        Toast.show({
          type: 'success',
          text1: 'Synced',
          text2: 'Pending uploads are up to date.',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Sync Error',
        text2:
          error instanceof Error
            ? error.message
            : 'Unable to sync uploads. Please try again.',
      });
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [isConnected, syncShipments, syncPendingUploads]);

  useEffect(() => {
    loadShipments().catch(() => {
      /* ignore cached load errors */
    });
  }, [loadShipments]);

  useEffect(() => {
    if (initialLoadRequestedRef.current) {
      return;
    }

    initialLoadRequestedRef.current = true;

    if (!isConnected) {
      return;
    }

    syncShipments().catch(() => {
      /* ignore initial fetch errors; user can pull to refresh */
    });
  }, [isConnected, syncShipments]);

  const handleLogout = useCallback(() => {
    // Check for offline shipments or pending uploads before logging out
    const hasOfflineShipment = shipments.some(s => s.status === 'Offline');
    const allPendingUploads = usePendingUploadsStore
      .getState()
      .getAllPendingUploads();
    const hasPendingUploads = allPendingUploads.length > 0;

    const proceedLogout = async () => {
      setLogoutVisible(false);
      await logout();
    };

    if (hasOfflineShipment || hasPendingUploads) {
      Alert.alert(
        'Warning',
        'There are offline shipments or pending uploads. If you logout now, syncing will stop. Do you want to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: proceedLogout },
        ],
      );
      return;
    }

    // No problems, logout immediately
    proceedLogout();
  }, [shipments, logout]);

  const renderItem = useCallback(
    ({
      item,
    }: {
      item: { shipment: Shipment; displayStatus: ShipmentStatus };
    }) => (
      <ShipmentCard
        shipment={item.shipment}
        displayStatus={item.displayStatus}
        onPress={() =>
          // Prevent navigation while a sync/refresh is in progress
          !(isLoading || isSyncing) &&
          navigation.navigate('ShipmentDetail', {
            shipmentId: item.shipment.id,
            bolNumber: item.shipment.bolNumber,
          })
        }
      />
    ),
    [navigation, isLoading, isSyncing],
  );

  const keyExtractor = useCallback(
    (item: { shipment: Shipment }) => item.shipment.id,
    [],
  );

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
            You are offline.
          </CustomText>
        </View>
      )}

      <View style={styles.searchContainer}>
        <CustomInput
          placeholder="Search by BoL / Shipment No..."
          value={searchQuery}
          onChangeText={searchShipments}
          editable={!isLoading && !isSyncing}
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
        data={displayShipments}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + wp(2) + wp(14) }, // vertical safe area + bottom bar height → hp
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyView
            message={isLoading ? 'Syncing...' : 'No shipments found.'}
            iconName="cube-outline"
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleSync}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
            title="Syncing..."
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
          loading={isLoading || isSyncing}
          disabled={isLoading || isSyncing}
        />
      </View>

      {/* Interaction blocker while syncing/refreshing */}
      {(isLoading || isSyncing) && (
        <View style={styles.interactionBlocker} pointerEvents="auto" />
      )}

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
    backgroundColor: COLORS.offline,
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
  interactionBlocker: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0)',
    zIndex: 999,
  },
});

export default DashboardScreen;
