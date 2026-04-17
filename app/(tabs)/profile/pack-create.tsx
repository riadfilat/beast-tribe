import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BeastIcon } from '../../../src/components/ui';
import { COLORS, FONTS } from '../../../src/lib/constants';
import { useCreatePack } from '../../../src/hooks';

export default function PackCreateScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const { createPack, loading } = useCreatePack();

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handleCreate() {
    if (!name.trim()) return;
    try {
      const pack = await createPack(name.trim(), 'custom');
      if (pack) {
        router.replace('/(tabs)/profile/pack');
      }
    } catch (err: any) {
      const detail = err?.message || err?.details || err?.hint || JSON.stringify(err) || 'Something went wrong.';
      Alert.alert('Could not create pack', detail);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <BeastIcon size={22} color={COLORS.orange} />
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Phase label */}
        <Text style={styles.phaseLabel}>CREATE YOUR BEAST PACK</Text>
        <Text style={styles.title}>Set up your{'\n'}pack</Text>

        {/* Pack image */}
        <Text style={styles.label}>PACK IMAGE</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.7}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
          ) : (
            <View style={styles.imagePickerEmpty}>
              <View style={styles.imagePickerIcon}>
                <Ionicons name="camera-outline" size={32} color={COLORS.orange} />
              </View>
              <Text style={styles.imagePickerTitle}>Upload pack image</Text>
              <Text style={styles.imagePickerSub}>Add a logo or photo for your pack</Text>
            </View>
          )}
          {imageUri && (
            <TouchableOpacity
              style={styles.imageChangeBtn}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={14} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Pack name */}
        <Text style={styles.label}>PACK NAME</Text>
        <View style={styles.nameInputWrap}>
          <TextInput
            style={styles.nameInput}
            placeholder="Enter pack name..."
            placeholderTextColor={COLORS.textMuted}
            value={name}
            onChangeText={setName}
            maxLength={30}
          />
          <Ionicons name="pencil" size={16} color={COLORS.orange} />
        </View>

        {/* Initialize Button */}
        <TouchableOpacity
          style={[styles.initButton, (!name.trim() || loading) && styles.initButtonDisabled]}
          onPress={handleCreate}
          disabled={loading || !name.trim()}
          activeOpacity={0.8}
        >
          <Ionicons name="flash" size={18} color={COLORS.dark} />
          <Text style={styles.initButtonText}>
            {loading ? 'CREATING...' : 'CREATE PACK'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  scroll: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 100 },

  phaseLabel: {
    fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.orange,
    letterSpacing: 2, marginTop: 4, marginBottom: 6,
  },
  title: {
    fontSize: 26, fontFamily: FONTS.heading, color: COLORS.textPrimary,
    fontStyle: 'italic', lineHeight: 32, marginBottom: 24,
  },

  label: {
    fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.orange,
    letterSpacing: 1.5, marginBottom: 8, marginTop: 16,
  },

  // Image picker
  imagePicker: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePickerEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(232,143,36,0.2)',
    borderStyle: 'dashed',
    borderRadius: 16,
    gap: 8,
  },
  imagePickerIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(232,143,36,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  imagePickerTitle: {
    fontSize: 14, fontFamily: FONTS.heading, color: COLORS.textPrimary,
  },
  imagePickerSub: {
    fontSize: 10, fontFamily: FONTS.body, color: COLORS.textMuted,
  },
  imagePreview: {
    width: '100%', height: '100%', borderRadius: 16,
  },
  imageChangeBtn: {
    position: 'absolute', bottom: 10, right: 10,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Name input
  nameInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: COLORS.orange, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 28,
  },
  nameInput: {
    flex: 1, fontSize: 16, fontFamily: FONTS.heading, color: COLORS.textPrimary,
  },

  // Create button
  initButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.orange, borderRadius: 14, paddingVertical: 16, marginTop: 8,
  },
  initButtonDisabled: { opacity: 0.4 },
  initButtonText: {
    fontSize: 14, fontFamily: FONTS.heading, color: COLORS.dark, letterSpacing: 1.5,
  },
  cancelButton: { alignItems: 'center', marginTop: 16 },
  cancelText: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.textTertiary },
});
