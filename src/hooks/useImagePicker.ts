import { useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import {
  launchCamera,
  launchImageLibrary,
  type ImagePickerResponse,
  type Asset,
} from 'react-native-image-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs';
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

const convertToPngBase64 = async (
  uri: string,
  width?: number,
  height?: number,
): Promise<{ uri: string; base64: string }> => {
  const targetWidth = width ?? 1000;
  const targetHeight = height ?? 1000;
  const resized = await ImageResizer.createResizedImage(
    uri,
    targetWidth,
    targetHeight,
    'PNG',
    100,
  );
  const base64 = await RNFS.readFile(resized.uri, 'base64');
  return { uri: resized.uri, base64 };
};

const assetToPhotoItem = async (asset: Asset): Promise<PhotoItem> => {
  const id = generateId();
  const sourceUri = asset.uri ?? '';

  const converted = await convertToPngBase64(sourceUri, 1080, 1920);

  const fileName = asset.fileName
    ? asset.fileName.replace(/\.[^.]+$/, '.png')
    : `${id}.png`;

  return {
    id,
    uri: converted.uri,
    fileName,
    fileSize: asset.fileSize,
    type: 'image/png',
    base64: converted.base64,
  };
};

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
          maxHeight: 1920,
          maxWidth: 1080,
          mediaType: 'photo',
          quality: 0.8,
          saveToPhotos: false,
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
          // capture asset in local variable to satisfy TypeScript narrow
          const _asset = response.assets[0];
          (async () => {
            const item = await assetToPhotoItem(_asset);
            resolve(item);
          })();
        },
      );
    });
  }, []);

  const pickFromGallery = useCallback(
    async (selectionLimit?: number): Promise<PhotoItem[] | null> => {
      const hasPermission = await checkLibraryPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Photo library permission is needed to select photos.',
        );
        return null;
      }

      if (!selectionLimit || selectionLimit < 1) {
        return null;
      }

      return new Promise(resolve => {
        launchImageLibrary(
          {
            mediaType: 'photo',
            maxHeight: 1920,
            maxWidth: 1080,
            quality: 0.8,
            selectionLimit,
          },
          async (response: ImagePickerResponse) => {
            if (
              response.didCancel ||
              response.errorCode ||
              !response.assets?.length
            ) {
              resolve(null);
              return;
            }

            const selectedAssets = response.assets;
            if (selectionLimit && selectedAssets.length > selectionLimit) {
              Toast.show({
                type: 'error',
                text1: 'Selection Limit',
                text2: `You can only select up to ${selectionLimit} images.`,
              });
              resolve(null);
              return;
            }

            const items = await Promise.all(
              selectedAssets.map(asset => assetToPhotoItem(asset)),
            );
            resolve(items);
          },
        );
      });
    },
    [],
  );

  return { takePhoto, pickFromGallery };
};
