import { useCallback, useEffect } from 'react';
import { BackHandler } from 'react-native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';

/**
 * Unifies all three back-navigation paths so they behave identically:
 *  1. Android hardware back button  (via BackHandler)
 *  2. iOS swipe-back gesture        (via beforeRemove 'POP' event)
 *  3. UI back button in the header  (call the returned handleBack directly)
 *
 * Returns `handleBack`, which screens pass to the Header's onLeftPress.
 * The optional `onData` callback fires on every back action and is used
 * by parent screens that pass a route-param callback to receive a signal
 * when the child is dismissed.
 */
const useBackHandler = (
  navigation: NavigationProp<ParamListBase>,
  onData?: () => void,
): (() => void) => {
  const handleBack = useCallback(() => {
    navigation.goBack();
    onData?.();
  }, [navigation, onData]);

  useEffect(() => {
    // Android hardware back — intercept and unify with the other paths
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });

    // iOS swipe-back — navigation is already in progress; only fire callback
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (e.data.action.type === 'POP') {
        onData?.();
      }
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, [handleBack, navigation, onData]);

  return handleBack;
};

export default useBackHandler;
