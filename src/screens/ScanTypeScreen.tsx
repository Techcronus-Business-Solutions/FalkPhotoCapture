import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import CustomInput2 from '../components/CustomInput2';
import CustomDropdown from '../components/CustomDropdown';
import { COLORS } from '../assets/constants';
import { wp } from '../utils/responsive';
import useBackHandler from '../hooks/useBackHandler';
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

const LOCATION_OPTIONS = [
  { label: 'QC1', value: 'QC1' },
  { label: 'QC2', value: 'QC2' },
  { label: 'QCTRM', value: 'QCTRM' },
];

const HOLD_REASON_OPTIONS = [
  { label: 'Damage (forklift/handling)', value: 'Damage (forklift/handling)' },
  { label: 'Wrap / Packaging issue', value: 'Wrap / Packaging issue' },
  { label: 'Missing Components', value: 'Missing Components' },
  { label: 'QC dimensional issue', value: 'QC dimensional issue' },
  { label: 'Finish/Coating issue', value: 'Finish/Coating issue' },
  { label: 'Labeling / ID issue', value: 'Labeling / ID issue' },
  { label: 'Documentation hold', value: 'Documentation hold' },
  {
    label: 'Customer change / pending approval',
    value: 'Customer change / pending approval',
  },
  { label: 'Other', value: 'Other' },
];

interface ScanTypeScreenProps {
  navigation: ScanTypeNavigationProp;
  route: ScanTypeRouteProp;
}

const ScanTypeScreen: React.FC<ScanTypeScreenProps> = ({
  navigation,
  route,
}) => {
  const { csvNumber, entryType } = route.params;
  const insets = useSafeAreaInsets();
  const handleBack = useBackHandler(navigation);

  const [scanType, setScanType] = useState<ScanTypeValue>('Load');
  const [boxNumber, setBoxNumber] = useState('');
  const [location, setLocation] = useState('');
  const [bol, setBol] = useState('');
  const [holdLocation, setHoldLocation] = useState('');
  const [holdReason, setHoldReason] = useState('');
  const [holdNotes, setHoldNotes] = useState('');

  const handleScanTypeChange = useCallback((value: string) => {
    setScanType(value as ScanTypeValue);
    setBoxNumber('');
    setLocation('');
    setBol('');
    setHoldLocation('');
    setHoldReason('');
    setHoldNotes('');
  }, []);

  const handleSubmit = useCallback(() => {
    // TODO: dispatch scan submission
  }, []);

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
          <CustomDropdown
            label="Hold Location"
            placeholder="Find Items"
            options={LOCATION_OPTIONS}
            value={holdLocation}
            onValueChange={setHoldLocation}
          />
          <CustomDropdown
            label="Hold Reason"
            placeholder="Find Items"
            options={HOLD_REASON_OPTIONS}
            value={holdReason}
            onValueChange={setHoldReason}
          />
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
        keyboardType="numeric"
      />
    );
  };

  return (
    <View style={styles.root}>
      <Header
        title={csvNumber}
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
          {entryType === 'Trip Box' && (
            <CustomInput2
              label="Box Number"
              placeholder=""
              value={boxNumber}
              onChangeText={setBoxNumber}
              keyboardType="numeric"
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
});

export default ScanTypeScreen;
