import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const useCameraScanner = () => {
  const [scannerVisible, setScannerVisible] = useState(false);

  const openScanner = useCallback(async () => {
    const permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;

    const result = await check(permission);

    if (result === RESULTS.GRANTED) {
      setScannerVisible(true);
      return;
    }

    if (result === RESULTS.DENIED) {
      const requested = await request(permission);
      if (requested === RESULTS.GRANTED) {
        setScannerVisible(true);
      } else {
        Alert.alert(
          'Permission Required',
          'Camera permission is needed to scan barcodes.',
        );
      }
      return;
    }

    Alert.alert(
      'Permission Required',
      'Camera permission is needed to scan barcodes. Please enable it in your device settings.',
    );
  }, []);

  const closeScanner = useCallback(() => {
    setScannerVisible(false);
  }, []);

  return { scannerVisible, openScanner, closeScanner };
};

export default useCameraScanner;
