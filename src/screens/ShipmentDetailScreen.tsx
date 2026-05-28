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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Ionicons from '@react-native-vector-icons/ionicons';
import Header from '../components/Header';
import CustomText from '../components/CustomText';
import CustomButton from '../components/CustomButton';
import ImageCard from '../components/ImageCard';
import DeleteImageModal from '../components/DeleteImageModal';
import Loader from '../components/Loader';
import { COLORS, FONTS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import { usePhotoStore, type PhotoItem } from '../store/photoStore';
import { useShipmentStore } from '../store/shipmentStore';
import { useImagePicker } from '../hooks/useImagePicker';
import { uploadService } from '../services/uploadService';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { usePendingUploadsStore } from '../store/pendingUploadsStore';
import type {
  ShipmentDetailNavigationProp,
  ShipmentDetailRouteProp,
} from '../navigation/types';

const MAX_PHOTOS = 20;
const EMPTY_PHOTOS: PhotoItem[] = [];

const ShipmentDetailScreen: React.FC<{
  navigation: ShipmentDetailNavigationProp;
  route: ShipmentDetailRouteProp;
}> = ({ navigation, route }) => {
  const { shipmentId, bolNumber } = route.params;
  const [uploading, setUploading] = useState(false);
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
  const { updateShipmentStatus } = useShipmentStore();
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
        uri: `data:image/png;base64,${upload.base64Image}`,
        fileName: upload.fileName,
        pendingUploadId: upload.id,
      })),
    [pendingUploads],
  );

  const displayedPhotos = useMemo(
    () => [...pendingPhotos, ...photos],
    [pendingPhotos, photos],
  );

  const photosCountRef = useRef(photos.length);

  useEffect(() => {
    photosCountRef.current = photos.length;
  }, [photos.length]);

  useEffect(() => {
    return () => {
      if (photosCountRef.current > 0) {
        void clearPhotos(shipmentId);
      }
    };
  }, [clearPhotos, shipmentId]);

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
            await addPhoto(shipmentId, photo);
          }
        } else {
          const selectedPhotos = await pickFromGallery(
            MAX_PHOTOS - displayedPhotos.length,
          );
          if (selectedPhotos?.length) {
            await addPhotos(shipmentId, selectedPhotos);
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
    if (!photos.length && !(pendingUploads?.length ?? 0)) {
      Toast.show({
        type: 'error',
        text1: 'No Photos',
        text2: 'Please add at least one photo before uploading.',
      });
      return;
    }

    try {
      setUploading(true);

      if (isConnected) {
        let totalUploadedCount = 0;

        if (pendingUploads?.length) {
          const pendingResult =
            await uploadService.uploadPendingUploadsForShipment(
              shipmentId,
              bolNumber,
              pendingUploads,
            );
          totalUploadedCount += pendingResult.uploadedCount;
        }

        if (photos.length) {
          const result = await uploadService.uploadPhotos(
            shipmentId,
            bolNumber,
            photos,
          );
          totalUploadedCount += result.uploadedCount;
        }

        if (totalUploadedCount > 0) {
          updateShipmentStatus(shipmentId, 'Uploaded', totalUploadedCount);
        }

        await clearPhotos(shipmentId);
        Toast.show({
          type: 'success',
          text1: 'Upload Successful',
          text2: `${totalUploadedCount} photo(s) uploaded successfully.`,
        });
        navigation.goBack();
      } else {
        if (!photos.length) {
          Toast.show({
            type: 'info',
            text1: 'Offline Mode',
            text2:
              'Images are already saved locally and will sync when online.',
          });
          return;
        }

        await uploadService.uploadPhotosOffline(shipmentId, bolNumber, photos);
        updateShipmentStatus(shipmentId, 'Failed');
        await clearPhotos(shipmentId);
        Toast.show({
          type: 'info',
          text1: 'Offline Mode',
          text2: 'Images saved locally. Will sync when online.',
        });
        navigation.goBack();
      }
    } catch (err: unknown) {
      updateShipmentStatus(shipmentId, 'Failed');
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setUploading(false);
    }
  }, [
    photos,
    pendingUploads,
    shipmentId,
    bolNumber,
    isConnected,
    updateShipmentStatus,
    navigation,
    clearPhotos,
  ]);

  const renderPhoto = useCallback(
    ({ item }: { item: PhotoItem }) => (
      <ImageCard uri={item.uri} onRemove={() => handleRemove(item.id)} />
    ),
    [handleRemove],
  );

  return (
    <View style={styles.root}>
      <Header
        title="Shipment"
        onLeftPress={() => navigation.goBack()}
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
            style={{ fontFamily: FONTS.REGULAR }}
          >
            BoL Number
          </CustomText>
          <View style={styles.bolContainer}>
            <CustomText
              size={FontSize.largeText}
              color={COLORS.primary}
              style={{ fontFamily: FONTS.BOLD }}
            >
              {bolNumber}
            </CustomText>
          </View>
        </View>

        {/* Choose Photos */}
        <View style={styles.section}>
          <CustomText
            size={FontSize.normalText}
            color={COLORS.black}
            style={styles.sectionTitle}
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
                  style={{ fontFamily: FONTS.BOLD }}
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
                  style={{ fontFamily: FONTS.BOLD }}
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
          disabled={!displayedPhotos.length}
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

      <Modal visible={selectingPhotos} transparent animationType="fade">
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
    fontFamily: FONTS.SEMIBOLD,
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
    fontFamily: FONTS.REGULAR,
    marginTop: wp(2),
  },
  hint: {
    fontFamily: FONTS.REGULAR,
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
    fontFamily: FONTS.REGULAR,
  },
});

export default ShipmentDetailScreen;
