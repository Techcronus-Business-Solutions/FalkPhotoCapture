import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
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
import { FONTS } from '../assets/constants';
import CustomInput2 from '../components/CustomInput2';
import type { LoginNavigationProp } from '../navigation/types';

const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'driver' | 'manager'>('driver');
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
      const result = await authService.login({ username, password });
      await login({
        username: result.username,
        token: result.token,
        role,
        driverID: result.driverID,
      });
      Toast.show({
        type: 'success',
        text1: 'Login Successful',
        text2: result.message || 'You are now logged in.',
      });
      navigation.replace(role === 'driver' ? 'Dashboard' : 'ManagerDashboard');
    } catch (err: unknown) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: err instanceof Error ? err.message : 'Something went wrong.',
      });
    } finally {
      setLoading(false);
    }
  }, [username, password, login, isConnected, navigation, role]);

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
            <CustomInput2
              label="Username"
              placeholder="Username"
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
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              isPassword
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              autoComplete="password"
              containerStyle={styles.passwordInput}
            />

            <View style={styles.roleWrapper}>
              <CustomText
                size={FontSize.smallMediumText}
                color={COLORS.greyText}
                style={styles.roleLabel}
              >
                Login as
              </CustomText>
              <View style={styles.roleOptions}>
                {[
                  { key: 'driver', label: 'Driver' },
                  { key: 'manager', label: 'Manager' },
                ].map(item => (
                  <TouchableOpacity
                    key={item.key}
                    style={styles.roleOption}
                    onPress={() => setRole(item.key as 'driver' | 'manager')}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        role === item.key && styles.radioOuterSelected,
                      ]}
                    >
                      {role === item.key && <View style={styles.radioInner} />}
                    </View>
                    <CustomText
                      size={FontSize.normalText}
                      color={COLORS.black}
                      style={{ fontFamily: FONTS.MEDIUM }}
                    >
                      {item.label}
                    </CustomText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

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
  passwordInput: {},
  roleWrapper: {
    marginBottom: wp(4),
  },
  roleLabel: {
    marginBottom: wp(2),
    fontFamily: FONTS.SEMIBOLD,
  },
  roleOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: wp(3),
    paddingHorizontal: wp(3),
    borderRadius: wp(2),
    borderWidth: wp(0.4),
    borderColor: COLORS.border,
    marginRight: wp(2),
    backgroundColor: COLORS.white,
  },
  radioOuter: {
    width: wp(5),
    height: wp(5),
    borderRadius: wp(5),
    borderWidth: wp(0.8),
    borderColor: COLORS.greyText,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: wp(2.5),
    height: wp(2.5),
    borderRadius: wp(2.5),
    backgroundColor: COLORS.primary,
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
