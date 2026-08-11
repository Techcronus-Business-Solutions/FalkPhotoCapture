import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Header from '../components/Header';
import CustomInput2 from '../components/CustomInput2';
import CustomDropdown from '../components/CustomDropdown';
import { COLORS } from '../assets/constants';
import { wp } from '../utils/responsive';
import useBackHandler from '../hooks/useBackHandler';
import { toDigitsOnly } from '../utils/input';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { apiClient } from '../services/apiClient';
import { API_ROUTES } from '../services/ApiRoutes';
import type {
  ScanTypeNavigationProp,
  ScanTypeRouteProp,
} from '../navigation/types';
import CustomButton from '../components/CustomButton';

type ScanTypeValue = 'Load' | 'Move' | 'Ship' | 'QA Hold' | 'Release Hold';

const SCAN_TYPES = [
  { label: 'Load', value: 'Load' },
  { label: 'Move', value: 'Move' },
  { label: 'Ship', value: 'Ship' },
  { label: 'QA Hold', value: 'QA Hold' },
  { label: 'Release Hold', value: 'Release Hold' },
];

const toDropdownOptions = (items: string[]) =>
  items.map(item => ({ label: item, value: item }));

interface ScanTypeScreenProps {
  navigation: ScanTypeNavigationProp;
  route: ScanTypeRouteProp;
}

const ScanTypeScreen: React.FC<ScanTypeScreenProps> = ({
  navigation,
  route,
}) => {
  const { entityType, csv, orderNumber, panelCurrentStatus, trimBoxStatuses } = route.params;
  const insets = useSafeAreaInsets();
  const handleBack = useBackHandler(navigation);
  const { isConnected } = useNetworkStatus();

  const [scanType, setScanType] = useState<ScanTypeValue>('Load');
  const [boxNumber, setBoxNumber] = useState('');
  const [location, setLocation] = useState('');
  const [bol, setBol] = useState('');
  const [holdLocation, setHoldLocation] = useState('');
  const [holdReason, setHoldReason] = useState('');
  const [holdNotes, setHoldNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [holdLocationOptions, setHoldLocationOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [holdReasonOptions, setHoldReasonOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [masterDataLoading, setMasterDataLoading] = useState(false);

  useEffect(() => {
    const fetchMasterData = async () => {
      if (!isConnected) {
        Toast.show({
          type: 'error',
          text1: 'No Internet',
          text2: 'Please check your internet connection.',
        });
        return;
      }

      setMasterDataLoading(true);
      try {
        const [locRes, reasonRes] = await Promise.all([
          apiClient.get(API_ROUTES.HOLD_LOCATION_OPTIONS),
          apiClient.get(API_ROUTES.HOLD_REASON_OPTIONS),
        ]);

        const locJson = await locRes.json();
        if (locJson.success) {
          setHoldLocationOptions(toDropdownOptions(locJson.data.holdLocations));
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: locJson.message || 'Failed to load hold location options.',
          });
        }

        const reasonJson = await reasonRes.json();
        if (reasonJson.success) {
          setHoldReasonOptions(toDropdownOptions(reasonJson.data.holdReasons));
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: reasonJson.message || 'Failed to load hold reason options.',
          });
        }
      } catch {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load master data. Please try again.',
        });
      } finally {
        setMasterDataLoading(false);
      }
    };

    fetchMasterData();
  }, [isConnected]);

  const handleScanTypeChange = useCallback((value: string) => {
    setScanType(value as ScanTypeValue);
    setBoxNumber('');
    setLocation('');
    setBol('');
    setHoldLocation('');
    setHoldReason('');
    setHoldNotes('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;

    if (entityType === 'Trim Box' && !boxNumber.trim()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter a Box Number.' });
      return;
    }
    if ((scanType === 'Load' || scanType === 'Move' || scanType === 'Release Hold') && !location.trim()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter a Location.' });
      return;
    }
    if (scanType === 'Ship' && !bol.trim()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter a BOL.' });
      return;
    }
    if (scanType === 'QA Hold') {
      if (!holdLocation) {
        Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select a Hold Location.' });
        return;
      }
      if (!holdReason) {
        Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select a Hold Reason.' });
        return;
      }
    }

    if (entityType === 'Panel' && panelCurrentStatus === 'QA Hold' && scanType !== 'Release Hold') {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'This panel is currently on QA Hold. Please select "Release Hold" as the Scan Type.',
      });
      return;
    }

    if (entityType === 'Trim Box') {
      const matchedBox = trimBoxStatuses.find(b => b.boxNumber === Number(boxNumber));
      if (matchedBox?.status === 'QA Hold' && scanType !== 'Release Hold') {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'This Trim Box is currently on QA Hold. Please select "Release Hold" as the Scan Type.',
        });
        return;
      }
    }

    if (!isConnected) {
      Toast.show({ type: 'error', text1: 'No Internet', text2: 'Please check your internet connection.' });
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        csv: entityType === 'Panel' ? csv : '',
        orderNumber: entityType === 'Trim Box' ? orderNumber : '',
        boxNumber: entityType === 'Trim Box' ? boxNumber : '0',
        scanType,
        location: (scanType === 'Load' || scanType === 'Move' || scanType === 'Release Hold') ? location : '',
        bol: scanType === 'Ship' ? bol : '',
        holdLocation: scanType === 'QA Hold' ? holdLocation : '',
        holdReason: scanType === 'QA Hold' ? holdReason : '',
        holdNotes: scanType === 'QA Hold' ? holdNotes : '',
        entityType,
      };

      console.log('[ScanTypeScreen] Submit request:', { url: API_ROUTES.SCAN_SHIPMENT, body });
      const res = await apiClient.post(API_ROUTES.SCAN_SHIPMENT, body);
      const json = await res.json();
      console.log('[ScanTypeScreen] Submit response:', { status: res.status, json });

      if (json.success) {
        Toast.show({ type: 'success', text1: 'Success', text2: json.message || 'Scan submitted successfully.' });
        navigation.goBack();
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: json.message || 'Failed to submit scan.' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to submit scan. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }, [submitting, entityType, csv, orderNumber, panelCurrentStatus, trimBoxStatuses, boxNumber, scanType, location, bol, holdLocation, holdReason, holdNotes, isConnected, navigation]);

  const renderDynamicFields = () => {
    if (scanType === 'Ship') {
      return (
        <CustomInput2
          label="BOL"
          placeholder=""
          value={bol}
          onChangeText={setBol}
          keyboardType="numeric"
        />
      );
    }

    if (scanType === 'QA Hold') {
      return (
        <>
          {masterDataLoading ? (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
              style={styles.loader}
            />
          ) : (
            <>
              <CustomDropdown
                label="Hold Location"
                placeholder="Find Items"
                options={holdLocationOptions}
                value={holdLocation}
                onValueChange={setHoldLocation}
              />
              <CustomDropdown
                label="Hold Reason"
                placeholder="Find Items"
                options={holdReasonOptions}
                value={holdReason}
                onValueChange={setHoldReason}
              />
            </>
          )}
          <CustomInput2
            label="Hold Notes"
            placeholder="Notes"
            value={holdNotes}
            onChangeText={setHoldNotes}
            multiline
          />
        </>
      );
    }

    // Load | Move | Release Hold
    return (
      <CustomInput2
        label="Location"
        placeholder=""
        value={location}
        onChangeText={setLocation}
      />
    );
  };

  return (
    <View style={styles.root}>
      <Header
        title={entityType === 'Panel' ? `CSV - ${csv}` : `Order - ${orderNumber}`}
        leftIconName="arrow-back"
        onLeftPress={handleBack}
      />

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <CustomDropdown
            label="Scan Type"
            placeholder="Load"
            options={SCAN_TYPES}
            value={scanType}
            onValueChange={handleScanTypeChange}
          />
          {entityType === 'Trim Box' && (
            <CustomInput2
              label="Box Number"
              placeholder=""
              value={boxNumber}
              onChangeText={v => setBoxNumber(toDigitsOnly(v))}
              keyboardType="number-pad"
            />
          )}
          {renderDynamicFields()}
        </View>
      </ScrollView>

      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + wp(2) }]}
      >
        <CustomButton
          title="SUBMIT"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.nextBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  nextBtn: {
    height: wp(12),
    borderRadius: wp(2),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    padding: wp(4),
    paddingBottom: wp(22),
    flexGrow: 1,
  },
  card: {
    borderRadius: wp(4),
    marginVertical: wp(4),
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: wp(4),
    paddingTop: wp(3),
  },
  submitButton: {
    height: wp(10),
    borderRadius: wp(2),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  loader: {
    marginVertical: wp(4),
  },
});

export default ScanTypeScreen;
