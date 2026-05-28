import { useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type ImagePickerResponse,
  type Asset,
} from 'react-native-image-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import type { PhotoItem } from '../store/photoStore';

const generateId = () =>
  `photo_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const checkCameraPermission = async (): Promise<boolean> => {
  const permission =
    Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
  const result = await check(permission);
  if (result === RESULTS.GRANTED) {
    return true;
  }
  if (result === RESULTS.DENIED) {
    const requested = await request(permission);
    return requested === RESULTS.GRANTED;
  }
  return false;
};

const checkLibraryPermission = async (): Promise<boolean> => {
  const permission =
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.PHOTO_LIBRARY
      : Number(Platform.Version) >= 33
      ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
      : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

  const result = await check(permission);
  if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
    return true;
  }
  if (result === RESULTS.DENIED) {
    const requested = await request(permission);
    return requested === RESULTS.GRANTED || requested === RESULTS.LIMITED;
  }
  return false;
};

const assetToPhotoItem = (asset: Asset): PhotoItem => ({
  id: generateId(),
  uri: asset.uri ?? '',
  fileName: asset.fileName,
  fileSize: asset.fileSize,
  type: asset.type,
  base64: asset.base64,
});

export const useImagePicker = () => {
  const takePhoto = useCallback(async (): Promise<PhotoItem | null> => {
    const hasPermission = await checkCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Camera permission is needed to take photos.',
      );
      return null;
    }

    return new Promise(resolve => {
      launchCamera(
        {
          mediaType: 'photo',
          quality: 0.8,
          saveToPhotos: false,
          includeBase64: true,
        },
        (response: ImagePickerResponse) => {
          if (
            response.didCancel ||
            response.errorCode ||
            !response.assets?.length
          ) {
            resolve(null);
            return;
          }
          resolve(assetToPhotoItem(response.assets[0]));
        },
      );
    });
  }, []);

  const pickFromGallery = useCallback(async (): Promise<PhotoItem | null> => {
    const hasPermission = await checkLibraryPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Photo library permission is needed to select photos.',
      );
      return null;
    }

    return new Promise(resolve => {
      launchImageLibrary(
        {
          mediaType: 'photo',
          quality: 0.8,
          selectionLimit: 1,
          includeBase64: true,
        },
        (response: ImagePickerResponse) => {
          if (
            response.didCancel ||
            response.errorCode ||
            !response.assets?.length
          ) {
            resolve(null);
            return;
          }
          resolve(assetToPhotoItem(response.assets[0]));
        },
      );
    });
  }, []);

  return { takePhoto, pickFromGallery };
};
