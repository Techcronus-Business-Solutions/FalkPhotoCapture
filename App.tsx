import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';
import BootSplash from 'react-native-bootsplash';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import { useAuthStore } from './src/store/authStore';
import { usePhotoStore } from './src/store/photoStore';
import { COLORS } from './src/assets/constants';

function App(): React.JSX.Element {
  const [isReady, setIsReady] = useState(false);
  const hydrate = useAuthStore(state => state.hydrate);
  const loadPhotos = usePhotoStore(state => state.loadPhotos);

  // useEffect(() => {
  //   const init = async () => {
  //     try {
  //       await Promise.all([hydrate(), loadPhotos()]);
  //     } finally {
  //       setIsReady(true);
  //       await BootSplash.hide({ fade: true });
  //     }
  //   };
  //   init();
  // }, [hydrate, loadPhotos]);

  useEffect(() => {
    const init = async () => {
      try {
        await hydrate();
      } finally {
        await new Promise<void>(resolve => setTimeout(resolve, 2000));
        await BootSplash.hide({ fade: true });
        setIsReady(true);
      }
    };

    init();
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <StatusBar
            barStyle="light-content"
            backgroundColor={COLORS.primary}
          />
          {isReady ? (
            <>
              <AppNavigator />
              <Toast />
            </>
          ) : (
            <SplashScreen />
          )}
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;
