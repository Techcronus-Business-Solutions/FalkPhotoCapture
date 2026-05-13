import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  type TextInput as RNTextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';
import CustomText from '../components/CustomText';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { COLORS } from '../assets/constants';
import { wp } from '../utils/responsive';
import authService from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { FontSize } from '../assets/constants';
import AppLogo from '../assets/images/logo-blue.svg';
import { FONTS } from '../assets/constants';

const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<RNTextInput>(null);
  const login = useAuthStore(state => state.login);
  const insets = useSafeAreaInsets();

  const handleLogin = useCallback(async () => {
    if (!username.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter both username and password.',
      });
      return;
    }

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      Toast.show({
        type: 'error',
        text1: 'No Internet',
        text2: 'Please check your internet connection.',
      });
      return;
    }

    try {
      setLoading(true);
      const result = await authService.login({ username, password });
      await login({ username: result.username, token: result.token });
      Toast.show({
        type: 'success',
        text1: 'Login Successful',
        text2: result.message || 'You are now logged in.',
      });
    } catch (err: unknown) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: err instanceof Error ? err.message : 'Something went wrong.',
      });
    } finally {
      setLoading(false);
    }
  }, [username, password, login]);

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
          {/* Logo */}
          <View style={styles.logoArea}>
            <AppLogo width={wp(50)} height={wp(20)} />
            {/* <CustomText size={32} color={COLORS.white} weight="bold">
              FALK
            </CustomText> */}
            <CustomText
              size={FontSize.hugeText}
              color={COLORS.black}
              style={styles.logoSubtitle}
            >
              Login
            </CustomText>
            <CustomText
              size={FontSize.normalText}
              color={COLORS.primary}
              style={styles.tagline}
            >
              Login with your {'\n'}Business Central credentials
            </CustomText>
          </View>

          {/* Form card */}
          <View style={{ marginTop: wp(5) }}>
            <CustomInput
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              leftIconName="person-outline"
              returnKeyType="next"
              autoComplete="username"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <CustomInput
              // @ts-ignore — ref forwarding handled internally
              ref={passwordRef}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              leftIconName="lock-closed-outline"
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
            Version. 1.0
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
    paddingHorizontal: wp(6), // horizontal padding → wp
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: wp(5), // vertical margin → hp
  },
  logoSubtitle: {
    marginTop: wp(6), // vertical margin → hp
    fontFamily: FONTS.SEMIBOLD,
  },
  tagline: {
    marginTop: wp(2), // vertical margin → hp
    textAlign: 'center',
    lineHeight: wp(6),

    fontFamily: FONTS.REGULAR,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: wp(8), // radius → rf
    padding: wp(5), // uniform card padding → wp
  },
  passwordInput: {
    marginTop: wp(5), // vertical margin → hp
  },
  loginBtn: {
    marginTop: wp(5), // vertical margin → hp
  },
  version: {
    position: 'absolute',
    bottom: wp(8),
    textAlign: 'center',
    alignSelf: 'center',
    fontSize: FontSize.normalText,
    fontFamily: FONTS.REGULAR,
  },
});

export default LoginScreen;
