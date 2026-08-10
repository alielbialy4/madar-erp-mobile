import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
import { resolveMediaUrl } from '@/utils/media';
import type { PickedImage } from '@/types/api';
import { radius, spacing } from '@/constants/spacing';
import { appWritingDirection, appTextAlignStart } from '@/constants/layout';

type Props = {
  label?: string;
  value?: PickedImage | null;
  remoteUrl?: string | null;
  onChange: (image: PickedImage | null) => void;
};

export function ImagePickerField({ label, value, remoteUrl, onChange }: Props) {
  const c = useColors();
  const preview = value?.uri ?? resolveMediaUrl(remoteUrl);

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    onChange({
      uri: asset.uri,
      name: asset.fileName ?? 'image.jpg',
      mimeType: asset.mimeType ?? 'image/jpeg',
    });
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text> : null}
      <Pressable
        onPress={() => void pick()}
        style={[styles.box, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}
      >
        {preview ? (
          <Image source={{ uri: preview }} style={styles.image} resizeMode="cover" />
        ) : (
          <MaterialIcons name="add-a-photo" size={32} color={c.textCaption} />
        )}
      </Pressable>
      {preview ? (
        <Pressable onPress={() => onChange(null)}>
          <Text style={{ color: c.danger, fontSize: 13 }}>إزالة الصورة</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: { fontSize: 13, textAlign: appTextAlignStart, writingDirection: appWritingDirection },
  box: {
    width: 96,
    height: 96,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
});
