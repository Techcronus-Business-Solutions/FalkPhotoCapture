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
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Header from '../components/Header';
import ShipmentCard from '../components/ShipmentCard';
import CustomButton from '../components/CustomButton';
import EmptyView from '../components/EmptyView';
import Loader from '../components/Loader';
import LogoutModal from '../components/LogoutModal';
import CustomText from '../components/CustomText';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import { useShipmentStore } from '../store/shipmentStore';
import { usePendingUploadsStore } from '../store/pendingUploadsStore';
import { useAuthStore } from '../store/authStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import type { DashboardNavigationProp } from '../navigation/types';
import type { Shipment, ShipmentStatus } from '../types/shipment';
import CustomInput from '../components/CustomInput';
import { Camera } from 'react-native-camera-kit';
import useBackHandler from '../hooks/useBackHandler';
import useCameraScanner from '../hooks/useCameraScanner';

const DashboardScreen: React.FC<{ navigation: DashboardNavigationProp }> = ({
  navigation,
}) => {
  const [logoutVisible, setLogoutVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const { scannerVisible, openScanner, closeScanner } = useCameraScanner();

  const {
    shipments,
    shipmentBols,
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
  const handleBack = useBackHandler(navigation);

  const displayShipments = useMemo<
    Array<{ shipment: Shipment; displayStatus: ShipmentStatus }>
  >(
    () =>
      filteredShipments.map(shipment => {
        const pendingCount = pendingUploadEntries.filter(
          upload =>
            upload.shipmentNumber === shipment.bolNumber &&
            upload.uploadStatus === 'pending',
        ).length;

        if (pendingCount > 0) {
          return { shipment, displayStatus: 'Offline' };
        }

        const sharePointCount = shipment.sharePointLinks?.length ?? 0;
        return {
          shipment,
          displayStatus: sharePointCount > 0 ? 'Uploaded' : 'Ready to Ship',
        };
      }),
    [filteredShipments, pendingUploadEntries],
  );
  const initialLoadRequestedRef = useRef(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isSyncingRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const wasConnectedRef = useRef(isConnected);

  const handleReadCode = useCallback(
    (event: { nativeEvent: { codeStringValue: string } }) => {
      const codeStringValue = event.nativeEvent.codeStringValue;
      if (!codeStringValue) {
        return;
      }

      console.log('BarcodeScanner scanned value:', codeStringValue);
      Toast.show({
        type: 'info',
        text1: 'BarcodeScanner scanned value',
        text2: codeStringValue,
      });

      setTimeout(closeScanner, 800);
    },
    [closeScanner],
  );

  const handleSync = useCallback(async () => {
    if (isSyncingRef.current || isRefreshingRef.current) return;
    if (!isConnected) {
      Toast.show({
        type: 'error',
        text1: 'Offline',
        text2: 'No internet connection. Connect to sync.',
      });
      return;
    }

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

  const handleRefresh = useCallback(async () => {
    if (isRefreshingRef.current || isSyncingRef.current) return;
    if (!isConnected) {
      Toast.show({
        type: 'error',
        text1: 'Offline',
        text2: 'No internet connection. Connect to refresh.',
      });
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);

    try {
      await syncShipments();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Refresh Error',
        text2:
          error instanceof Error
            ? error.message
            : 'Unable to refresh shipments. Please try again.',
      });
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [isConnected, syncShipments]);

  useEffect(() => {
    usePendingUploadsStore
      .getState()
      .loadPendingUploads()
      .catch(() => {
        /* ignore pending upload hydration errors */
      });

    loadShipments().catch(() => {
      /* ignore cached load errors */
    });
  }, [loadShipments]);

  useEffect(() => {
    const wasConnected = wasConnectedRef.current;
    wasConnectedRef.current = isConnected;
    const pendingCount =
      usePendingUploadsStore.getState().pendingUploads.length;

    if (!wasConnected && isConnected && pendingCount > 0) {
      const uploadOfflineData = async () => {
        if (isSyncingRef.current) return;

        isSyncingRef.current = true;
        setIsSyncing(true);

        try {
          await syncPendingUploads();

          Toast.show({
            type: 'success',
            text1: 'Offline Data Synced',
            text2: 'Pending offline uploads were delivered successfully.',
          });
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: 'Sync Error',
            text2:
              error instanceof Error
                ? error.message
                : 'Unable to sync offline uploads. Please try again.',
          });
        } finally {
          isSyncingRef.current = false;
          setIsSyncing(false);
        }
      };

      uploadOfflineData();
    }
  }, [isConnected, syncPendingUploads]);

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
        onPress={() => {
          if (isLoading || isSyncing) {
            return;
          }
          const selectedBol = shipmentBols.find(
            b => b.bol === item.shipment.bolNumber,
          );
          if (selectedBol) {
            navigation.navigate('DeliveryShippingDetails', {
              shipmentBol: selectedBol,
            });
          }
        }}
      />
    ),
    [navigation, isLoading, isSyncing, shipmentBols],
  );

  const keyExtractor = useCallback(
    (item: { shipment: Shipment }) => item.shipment.id,
    [],
  );

  return (
    <View style={styles.root}>
      <Header
        title="Shipment List"
        leftIconName="arrow-back"
        onLeftPress={handleBack}
        rightIconName="barcode-outline"
        onRightPress={openScanner}
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
        weight="bold"
        style={{ paddingHorizontal: wp(4) }}
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
          <EmptyView message="No shipments found." iconName="cube-outline" />
        }
        refreshControl={
          <RefreshControl
            refreshing={false}
            enabled={!isLoading && !isRefreshing && !isSyncing}
            onRefresh={handleRefresh}
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
          disabled={isLoading || isSyncing}
        />
      </View>

      <Loader visible={isLoading || isRefreshing || isSyncing} fullScreen />

      {/* Interaction blocker while syncing/refreshing */}
      {(isLoading || isRefreshing || isSyncing) && (
        <View style={styles.interactionBlocker} pointerEvents="none" />
      )}

      <LogoutModal
        visible={logoutVisible}
        onCancel={() => setLogoutVisible(false)}
        onConfirm={handleLogout}
      />
      {scannerVisible && (
        <View style={styles.modalBackdrop}>
          <View style={styles.scannerPopup}>
            <Camera
              style={styles.camera}
              scanBarcode
              showFrame
              laserColor={COLORS.white}
              frameColor={COLORS.primary}
              ratioOverlay="1:1"
              ratioOverlayColor="rgba(0,0,0,0.5)"
              onReadCode={handleReadCode}
            />
            <TouchableOpacity style={styles.closeButton} onPress={closeScanner}>
              <CustomText
                size={FontSize.normalText}
                color={COLORS.white}
                weight="bold"
              >
                Close
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  modalBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    elevation: 20,
  },
  scannerPopup: {
    width: '90%',
    height: wp(50), // make it a square based on screen width
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.black,
  },
  camera: {
    flex: 1,
  },

  closeButton: {
    paddingVertical: wp(3),
    alignItems: 'center',
    backgroundColor: COLORS.primary,
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
