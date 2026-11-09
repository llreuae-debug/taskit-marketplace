import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../theme/tokens';
import { useAppStore } from '../../stores/useAppStore';

interface AvatarBlobProps {
  imageUri?: string;
  name: string;
  role?: string;
  size?: number;
  verified?: boolean;
  style?: ViewStyle;
}

export const AvatarBlob: React.FC<AvatarBlobProps> = ({
  imageUri,
  name,
  role,
  size = 72,
  verified = true,
  style,
}) => {
  const isDark = useAppStore((s) => s.theme === 'dark');

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.blobWrapper,
          {
            width: size,
            height: size,
            backgroundColor: COLORS.lime.DEFAULT,
          },
        ]}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: size - 8, height: size - 8, borderRadius: (size - 8) / 2 }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.fallbackInitials,
              { width: size - 8, height: size - 8, borderRadius: (size - 8) / 2 },
            ]}
          >
            <Text style={[styles.initialsText, { fontSize: size * 0.35 }]}>
              {name.charAt(0)}
            </Text>
          </View>
        )}

        {verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  blobWrapper: {
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.ink.border,
    position: 'relative',
  },
  fallbackInitials: {
    backgroundColor: COLORS.ink.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.status.success,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
});
