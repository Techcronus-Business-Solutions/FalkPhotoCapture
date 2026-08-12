import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import useBackHandler from '../hooks/useBackHandler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Ionicons from '@react-native-vector-icons/ionicons';
import Header from '../components/Header';
import CustomText from '../components/CustomText';
import CustomButton from '../components/CustomButton';
import ImageCard from '../components/ImageCard';
import DeleteImageModal from '../components/DeleteImageModal';
import Loader from '../components/Loader';
import EmptyView from '../components/EmptyView';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import { usePhotoStore, type PhotoItem } from '../store/photoStore';
import { useShipmentStore } from '../store/shipmentStore';
import { useImagePicker } from '../hooks/useImagePicker';
import { uploadService } from '../services/uploadService';
import { API_BASE_HOST } from '../services/ApiRoutes';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { usePendingUploadsStore } from '../store/pendingUploadsStore';
import { assignBolFileNames } from '../utils/bolSequence';
import type {
  UploadImageNavigationProp,
  UploadImageRouteProp,
} from '../navigation/types';

const MAX_PHOTOS = 20;
const EMPTY_PHOTOS: PhotoItem[] = [];

const UploadImageScreen: React.FC<{
  navigation: UploadImageNavigationProp;
  route: UploadImageRouteProp;
}> = ({ navigation, route }) => {
  const { shipmentId, bolNumber, images } = route.params;
  const handleBack = useBackHandler(navigation);
  const [uploading, setUploading] = useState(false);
  const uploadingRef = useRef(false);
  const [selectingPhotos, setSelectingPhotos] = useState(false);
  const [deleteImageModalVisible, setDeleteImageModalVisible] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { isConnected } = useNetworkStatus();

  const addPhoto = usePhotoStore(state => state.addPhoto);
  const addPhotos = usePhotoStore(state => state.addPhotos);
  const removePhoto = usePhotoStore(state => state.removePhoto);
  const clearPhotos = usePhotoStore(state => state.clearPhotos);
  const photosByShipment = usePhotoStore(state => state.photosByShipment);
  const photos = useMemo(
    () => photosByShipment[shipmentId] ?? EMPTY_PHOTOS,
    [photosByShipment, shipmentId],
  );
  const { updateShipmentStatus, persistShipments, shipments, mergeBolImages } =
    useShipmentStore();
  const shipment = useMemo(
    () => shipments.find(item => item.id === shipmentId),
    [shipments, shipmentId],
  );
  const [serverPhotos, setServerPhotos] = useState<PhotoItem[]>([]);
  const { takePhoto, pickFromGallery } = useImagePicker();
  const pendingUploadEntries = usePendingUploadsStore(
    state => state.pendingUploads,
  );
  const pendingUploads = useMemo(
    () =>
      pendingUploadEntries.filter(
        upload =>
          upload.shipmentNumber === bolNumber &&
          upload.uploadStatus === 'pending',
      ),
    [pendingUploadEntries, bolNumber],
  );
  const pendingPhotos = useMemo<PhotoItem[]>(
    () =>
      pendingUploads.map(upload => ({
        id: `offline-${upload.id}`,
        uri: upload.uri,
        fileName: upload.fileName,
        pendingUploadId: upload.id,
      })),
    [pendingUploads],
  );

  const displayedPhotos = useMemo(
    () => [...serverPhotos, ...pendingPhotos, ...photos],
    [serverPhotos, pendingPhotos, photos],
  );

  const photosCountRef = useRef(photos.length);

  useEffect(() => {
    photosCountRef.current = photos.length;
  }, [photos.length]);

  useEffect(() => {
    usePendingUploadsStore
      .getState()
      .loadPendingUploads()
      .catch(() => {
        /* ignore pending upload hydration errors */
      });
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (isMounted) {
      if (!images?.length) {
        setServerPhotos([]);
      } else {
        setServerPhotos(
          images.map((img, idx) => ({
            id: `server-${shipmentId}-${idx + 1}`,
            uri: API_BASE_HOST + img.imageUrl,
            fileName: img.fileName,
            isServerImage: true,
            isPlaceholder: false,
          })) as PhotoItem[],
        );
      }
    }

    return () => {
      isMounted = false;
    };
  }, [images, shipmentId]);

  useEffect(() => {
    return () => {
      if (photosCountRef.current > 0) {
        clearPhotos(shipmentId);
      }
    };
  }, [clearPhotos, shipmentId]);

  const applyBolFileNames = useCallback(
    async (newPhotos: PhotoItem[]): Promise<PhotoItem[]> => {
      const existingFileNames = [
        ...serverPhotos.map(p => p.fileName ?? ''),
        ...pendingUploads.map(u => u.fileName),
        ...photos.map(p => p.fileName ?? ''),
      ];
      const { renamedPhotos, persist } = await assignBolFileNames(
        bolNumber,
        newPhotos,
        existingFileNames,
      );
      await persist();
      return renamedPhotos;
    },
    [bolNumber, serverPhotos, pendingUploads, photos],
  );

  const handleAddPhoto = useCallback(
    async (source: 'camera' | 'gallery') => {
      if (displayedPhotos.length >= MAX_PHOTOS) {
        Toast.show({
          type: 'error',
          text1: 'Limit Reached',
          text2: `You can add up to ${MAX_PHOTOS} photos.`,
        });
        return;
      }
      try {
        setSelectingPhotos(true);
        if (source === 'camera') {
          const photo = await takePhoto();
          if (photo) {
            const [renamed] = await applyBolFileNames([photo]);
            await addPhoto(shipmentId, renamed);
          }
        } else {
          const selectedPhotos = await pickFromGallery(
            MAX_PHOTOS - displayedPhotos.length,
          );
          if (selectedPhotos?.length) {
            const renamed = await applyBolFileNames(selectedPhotos);
            await addPhotos(shipmentId, renamed);
          }
        }
      } finally {
        setSelectingPhotos(false);
      }
    },
    [
      displayedPhotos.length,
      takePhoto,
      pickFromGallery,
      addPhoto,
      addPhotos,
      shipmentId,
      applyBolFileNames,
    ],
  );

  const handleRemove = useCallback((photoId: string) => {
    setSelectedPhotoId(photoId);
    setDeleteImageModalVisible(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (selectedPhotoId) {
      if (selectedPhotoId.startsWith('offline-')) {
        const pendingUploadId = selectedPhotoId.replace('offline-', '');
        await usePendingUploadsStore
          .getState()
          .removePendingUpload(pendingUploadId);
      } else {
        await removePhoto(shipmentId, selectedPhotoId);
      }
      setDeleteImageModalVisible(false);
      setSelectedPhotoId(null);
    }
  }, [removePhoto, shipmentId, selectedPhotoId]);

  const handleUpload = useCallback(async () => {
    if (uploadingRef.current) return;

    if (!photos.length && !(pendingUploads?.length ?? 0)) {
      Toast.show({
        type: 'error',
        text1: 'No Photos',
        text2: 'Please add at least one photo before uploading.',
      });
      return;
    }

    if (!photos.length) {
      Toast.show({
        type: 'info',
        text1: 'Offline Mode',
        text2: 'Images are already saved locally and will appear on reopen.',
      });
      return;
    }

    const orderNumber = shipment?.salesOrderNo ?? '';

    const saveOffline = async () => {
      await uploadService.uploadPhotosOffline(
        shipmentId,
        bolNumber,
        orderNumber,
        photos,
      );
      updateShipmentStatus(shipmentId, 'Offline');
      await persistShipments();
      await clearPhotos(shipmentId);
    };

    try {
      uploadingRef.current = true;
      setUploading(true);

      if (isConnected) {
        const newImages = await uploadService.uploadPhotosOnline(
          bolNumber,
          orderNumber,
          photos,
        );
        await mergeBolImages(bolNumber, newImages);
        await clearPhotos(shipmentId);
        Toast.show({
          type: 'success',
          text1: 'Upload Successful',
          text2: `${newImages.length} image(s) uploaded successfully.`,
        });
        navigation.pop(2);
      } else {
        await saveOffline();
        Toast.show({
          type: 'info',
          text1: 'Offline Mode',
          text2:
            'Images saved locally. They will appear when this record is reopened.',
        });
        navigation.pop(2);
      }
    } catch (err: unknown) {
      try {
        await saveOffline();
        Toast.show({
          type: 'error',
          text1: 'Upload Error',
          text2: 'Images saved locally for retry via Sync Now.',
        });
        navigation.pop(2);
      } catch {
        Toast.show({
          type: 'error',
          text1: 'Upload Error',
          text2: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  }, [
    photos,
    pendingUploads,
    shipment,
    shipmentId,
    bolNumber,
    isConnected,
    mergeBolImages,
    updateShipmentStatus,
    persistShipments,
    clearPhotos,
    navigation,
  ]);

  const renderPhoto = useCallback(
    ({ item }: { item: PhotoItem }) => {
      if (item.isServerImage) {
        return (
          <ImageCard
            uri={isConnected ? item.uri : ''}
            onRemove={undefined}
            showPlaceholderOnError
            placeholderMessage={isConnected ? undefined : 'Offline'}
          />
        );
      }

      return (
        <ImageCard
          uri={item.uri}
          onRemove={() => handleRemove(item.id)}
          showPlaceholderOnError
        />
      );
    },
    [handleRemove, isConnected],
  );

  const isBusy = selectingPhotos;

  // If shipment not found, show empty state
  if (!shipment) {
    return (
      <View style={styles.root}>
        <Header
          title="Shipment"
          onLeftPress={handleBack}
          leftIconName="arrow-back"
        />
        <EmptyView
          message="No shipment found"
          iconName="alert-circle-outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Header
        title="Shipment"
        onLeftPress={handleBack}
        leftIconName="arrow-back"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + wp(4) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* BoL Number */}
        <View style={styles.section}>
          <CustomText
            size={FontSize.normalText}
            color={COLORS.primary}
            weight="regular"
          >
            BoL Number
          </CustomText>
          <View style={styles.bolContainer}>
            <CustomText
              size={FontSize.largeText}
              color={COLORS.primary}
              weight="bold"
            >
              {bolNumber}
            </CustomText>
          </View>

          <CustomText
            size={FontSize.normalText}
            color={COLORS.primary}
            weight="regular"
            style={{ marginTop: wp(4) }}
          >
            Order Number
          </CustomText>
          <View style={styles.bolContainer}>
            <CustomText
              size={FontSize.largeText}
              color={COLORS.primary}
              weight="bold"
            >
              {shipment.salesOrderNo}
            </CustomText>
          </View>
        </View>

        {/* Choose Photos */}
        <View style={styles.section}>
          <CustomText
            size={FontSize.normalText}
            color={COLORS.black}
            weight="semibold"
            style={{ marginBottom: wp(2) }}
          >
            Choose Photos
          </CustomText>
          <View style={styles.photoOptions}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleAddPhoto('camera')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="camera-outline"
                size={wp(10)}
                color={COLORS.primary}
                style={{ marginRight: wp(4) }}
              />
              <View>
                <CustomText
                  size={FontSize.normalText}
                  weight="bold"
                  color={COLORS.primary}
                >
                  Take Photo
                </CustomText>
                <CustomText size={FontSize.smallText} color={COLORS.primary}>
                  Open Camera
                </CustomText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleAddPhoto('gallery')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="images-outline"
                size={wp(10)}
                color={COLORS.primary}
                style={{ marginRight: wp(4) }}
              />
              <View>
                <CustomText
                  size={FontSize.normalText}
                  weight="bold"
                  color={COLORS.primary}
                >
                  Choose from Gallery
                </CustomText>
                <CustomText size={FontSize.smallText} color={COLORS.primary}>
                  Select from device
                </CustomText>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Selected Photos */}
        <View style={styles.section}>
          <CustomText
            size={FontSize.normalText}
            color={COLORS.black}
            style={styles.sectionTitle}
          >
            Selected Photos ({displayedPhotos.length}/{MAX_PHOTOS})
          </CustomText>

          {displayedPhotos.length > 0 ? (
            <FlatList
              data={displayedPhotos}
              renderItem={renderPhoto}
              keyExtractor={item => item.id}
              numColumns={3}
              scrollEnabled={false}
              contentContainerStyle={styles.photoGrid}
            />
          ) : (
            <View style={styles.emptyPhotos}>
              <Ionicons
                name="image-outline"
                size={wp(10)}
                color={COLORS.greyText}
              />
              <CustomText
                size={FontSize.normalText}
                color={COLORS.greyText}
                style={styles.emptyText}
              >
                No photos selected yet.
              </CustomText>
            </View>
          )}

          <CustomText
            size={FontSize.smallMediumText}
            color={COLORS.greyText}
            style={styles.hint}
          >
            You can add up to {MAX_PHOTOS} photos.
          </CustomText>
        </View>

        <CustomButton
          title="  Upload"
          onPress={handleUpload}
          loading={uploading}
          disabled={!displayedPhotos.length || uploading}
          style={styles.uploadBtn}
        />
      </ScrollView>

      <DeleteImageModal
        visible={deleteImageModalVisible}
        onCancel={() => {
          setDeleteImageModalVisible(false);
          setSelectedPhotoId(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      <Modal visible={isBusy} transparent animationType="fade">
        <View style={styles.loaderOverlay}>
          <Loader />
          <CustomText
            size={FontSize.normalText}
            color={COLORS.white}
            style={styles.loaderText}
          >
            Processing images...
          </CustomText>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scroll: {
    padding: wp(4),
  },
  section: {
    marginBottom: wp(4),
  },
  sectionTitle: {
    marginBottom: wp(2),
  },
  bolContainer: {},
  photoOptions: {},
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: wp(4),
    backgroundColor: COLORS.white,
    borderRadius: wp(2),
    padding: wp(4),
    borderWidth: wp(0.2),
    borderColor: COLORS.primary,
  },
  photoGrid: {},
  emptyPhotos: {
    backgroundColor: COLORS.white,
    borderRadius: wp(2),
    paddingVertical: wp(4),
    alignItems: 'center',
    borderWidth: wp(0.5),
    borderColor: COLORS.border,
  },
  emptyText: {
    marginTop: wp(2),
  },
  placeholderCard: {
    width: wp(28),
    height: wp(28),
    margin: wp(1),
    borderRadius: wp(2),
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    marginTop: wp(1),
    textAlign: 'center',
  },
  hint: {
    marginTop: wp(2),
    textAlign: 'center',
  },
  uploadBtn: {
    marginTop: wp(4),
  },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: wp(4),
  },
});

export default UploadImageScreen;
