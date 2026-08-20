import React, { memo, useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import FastImage, { type Source } from '@d11/react-native-fast-image';
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setHasError(false);
    setLoading(false);
    setErrorMessage(null);
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
            weight="regular"
            style={{ marginTop: wp(1) }}
          >
            {message}
          </CustomText>
        </View>
        <View style={styles.placeholderOverlay} />
      </View>
    );
  }

  const imageSource: Source = headers
    ? { uri, headers, cache: FastImage.cacheControl.web }
    : { uri, cache: FastImage.cacheControl.web };

  return (
    <View style={styles.container}>
      <FastImage
        source={imageSource}
        style={styles.image}
        resizeMode={FastImage.resizeMode.cover}
        onLoadStart={() => {
          // start loader and reset any previous error state for this item
          setLoading(true);
          setHasError(false);
          setErrorMessage(null);
        }}
        onLoad={() => {
          setLoading(false);
        }}
        onLoadEnd={() => {
          setLoading(false);
        }}
        onError={() => {
          // always stop loader on error and mark this item errored so
          // placeholder logic can pick it up when showPlaceholderOnError is true
          setLoading(false);
          setErrorMessage('Image Not Available');
          setHasError(true);
        }}
      />
      {loading ? (
        <View style={styles.loaderContainer} pointerEvents="none">
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : null}
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
  loaderContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});

export default memo(ImageCard);
