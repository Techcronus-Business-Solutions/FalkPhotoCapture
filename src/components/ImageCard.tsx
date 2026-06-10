import React, { memo, useEffect, useState } from 'react';
import { Image, View, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { COLORS, FontSize } from '../assets/constants';
import { wp } from '../utils/responsive';
import CustomText from './CustomText';

interface ImageCardProps {
  uri: string;
  headers?: Record<string, string>;
  onRemove?: () => void;
  showPlaceholderOnError?: boolean;
  placeholderMessage?: string;
}

// Square thumbnail — width-driven so wp is the right anchor
const IMAGE_SIZE = wp(28);

const ImageCard: React.FC<ImageCardProps> = ({
  uri,
  headers,
  onRemove,
  showPlaceholderOnError,
  placeholderMessage,
}) => {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setHasError(false);
  }, [uri]);

  const shouldShowPlaceholder = showPlaceholderOnError
    ? hasError || !uri
    : !uri;

  if (shouldShowPlaceholder) {
    const message = errorMessage ?? placeholderMessage ?? 'No Image Available';
    return (
      <View style={styles.container}>
        <View style={styles.placeholderInner}>
          <Ionicons
            name="image-outline"
            size={wp(16)}
            color={COLORS.greyText}
          />
          <CustomText
            size={FontSize.tinyText}
            color={COLORS.greyText}
            style={{ marginTop: wp(1) }}
          >
            {message}
          </CustomText>
        </View>
        <View style={styles.placeholderOverlay} />
      </View>
    );
  }

  const imageSource = headers ? { uri, headers } : { uri };

  return (
    <View style={styles.container}>
      <Image
        source={imageSource}
        style={styles.image}
        resizeMode="cover"
        onError={() => {
          if (showPlaceholderOnError) {
            setErrorMessage('Image Not Available');
            setHasError(true);
          }
        }}
      />
      {onRemove ? (
        <TouchableOpacity
          onPress={onRemove}
          style={styles.removeBtn}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Ionicons name="close-circle" size={wp(6)} color={COLORS.failed} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: IMAGE_SIZE, // width → wp
    height: IMAGE_SIZE, // square → same wp value for height
    margin: wp(1), // uniform margin → wp
    borderRadius: wp(2), // radius → rf
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderInner: {
    flex: 1,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});

export default memo(ImageCard);
