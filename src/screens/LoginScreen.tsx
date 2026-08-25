import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  type TextInput as RNTextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import CustomText from '../components/CustomText';
import CustomButton from '../components/CustomButton';
import { COLORS } from '../assets/constants';
import { wp } from '../utils/responsive';
import authService from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { FontSize } from '../assets/constants';
import AppLogo from '../assets/images/logo-blue.svg';
import CustomInput2 from '../components/CustomInput2';
import type { LoginNavigationProp } from '../navigation/types';
import DeviceInfo from 'react-native-device-info';

const APP_VERSION = DeviceInfo.getVersion();

const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<RNTextInput>(null);
  const login = useAuthStore(state => state.login);
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LoginNavigationProp>();

  const handleLogin = useCallback(async () => {
    if (!username.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter both username and password.',
      });
      return;
    }

    if (!isConnected) {
      Toast.show({
        type: 'error',
        text1: 'No Internet',
        text2: 'Please check your internet connection.',
      });
      return;
    }

    try {
      setLoading(true);

      const { user, message } = await authService.login({ username, password });
      await login(user);
      Toast.show({
        type: 'success',
        text1: 'Login Successful',
        text2: message || 'You are now logged in.',
      });
      navigation.replace('ManagerDashboard');
    } catch (err: unknown) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: err instanceof Error ? err.message : 'Something went wrong.',
      });
    } finally {
      setLoading(false);
    }
  }, [username, password, login, isConnected, navigation]);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + wp(15),
              paddingBottom: insets.bottom + wp(6),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoArea}>
            <AppLogo width={wp(50)} height={wp(20)} />
            <CustomText
              size={FontSize.hugeText}
              color={COLORS.black}
              weight="semibold"
              style={styles.logoSubtitle}
            >
              Login
            </CustomText>
            <CustomText
              size={FontSize.normalText}
              color={COLORS.primary}
              style={styles.tagline}
            >
              Login with your {'\n'}registered account
            </CustomText>
          </View>

          <View style={{ marginTop: wp(5) }}>
            <CustomInput2
              label="Email"
              placeholder=""
              value={username}
              onChangeText={setUsername}
              returnKeyType="next"
              autoComplete="username"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <CustomInput2
              label="Password"
              // @ts-ignore — ref forwarding handled internally
              ref={passwordRef}
              placeholder=""
              value={password}
              onChangeText={setPassword}
              isPassword
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              autoComplete="password"
              containerStyle={styles.passwordInput}
            />

            <CustomButton
              title="Login"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginBtn}
            />
          </View>

          <CustomText
            size={FontSize.normalText}
            color={COLORS.primary}
            style={styles.version}
          >
            Version. {APP_VERSION}
          </CustomText>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: wp(6),
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: wp(5),
  },
  logoSubtitle: {
    marginTop: wp(6),
  },
  tagline: {
    marginTop: wp(2),
    textAlign: 'center',
    lineHeight: wp(6),
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: wp(8),
    padding: wp(5),
  },
  passwordInput: {},
  loginBtn: {
    marginTop: wp(5),
  },
  version: {
    position: 'absolute',
    bottom: wp(8),
    textAlign: 'center',
    alignSelf: 'center',
    fontSize: FontSize.normalText,
  },
});

export default LoginScreen;
