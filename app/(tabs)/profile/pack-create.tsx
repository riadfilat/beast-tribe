import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../src/components/ui';
import { COLORS, FONTS } from '../../../src/lib/constants';
import { useCreatePack } from '../../../src/hooks';

const ANIMALS = [
  { id: 'wolf', name: 'Wolf', emoji: '🐺', color: '#8B9DC3' },
  { id: 'eagle', name: 'Eagle', emoji: '🦅', color: '#E8B024' },
  { id: 'tiger', name: 'Tiger', emoji: '🐯', color: '#E88F24' },
  { id: 'rhino', name: 'Rhino', emoji: '🦏', color: '#7B8D8E' },
];

export default function PackCreateScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState('wolf');
  const { createPack, loading } = useCreatePack();

  async function handleCreate() {
    if (!name.trim()) return;
    const pack = await createPack(name.trim(), selectedAnimal);
    if (pack) {
      router.replace('/(tabs)/profile/pack');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Create your Pack</Text>
        <Text style={styles.subtitle}>Pick a name and mascot for your crew</Text>

        {/* Pack name */}
        <Text style={styles.label}>PACK NAME</Text>
        <TextInput
          style={styles.nameInput}
          placeholder="e.g. Dawn Patrol"
          placeholderTextColor={COLORS.textMuted}
          value={name}
          onChangeText={setName}
          maxLength={30}
        />

        {/* Animal picker */}
        <Text style={styles.label}>CHOOSE YOUR MASCOT</Text>
        <View style={styles.animalGrid}>
          {ANIMALS.map((animal) => (
            <TouchableOpacity
              key={animal.id}
              style={[
                styles.animalCard,
                selectedAnimal === animal.id && { borderColor: animal.color, borderWidth: 2 },
              ]}
              onPress={() => setSelectedAnimal(animal.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.animalEmoji}>{animal.emoji}</Text>
              <Text style={[styles.animalName, selectedAnimal === animal.id && { color: animal.color }]}>
                {animal.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview */}
        {name.trim() && (
          <View style={styles.preview}>
            <Text style={styles.previewEmoji}>
              {ANIMALS.find(a => a.id === selectedAnimal)?.emoji}
            </Text>
            <Text style={styles.previewName}>{name.trim()}</Text>
            <Text style={styles.previewSub}>Your invite code will be generated automatically</Text>
          </View>
        )}

        <Button
          title={loading ? 'Creating...' : 'Create Pack'}
          onPress={handleCreate}
          disabled={loading || !name.trim()}
        />

        <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 22, fontFamily: FONTS.heading, color: COLORS.white, marginTop: 8, marginBottom: 4 },
  subtitle: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textSecondary, marginBottom: 24 },
  label: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 8, marginTop: 8 },
  nameInput: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    fontFamily: FONTS.heading, color: COLORS.white, marginBottom: 16,
  },
  animalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  animalCard: {
    width: '47%', alignItems: 'center', paddingVertical: 20,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
  },
  animalEmoji: { fontSize: 40 },
  animalName: { fontSize: 12, fontFamily: FONTS.bodyMedium, color: COLORS.textSecondary, marginTop: 6 },
  preview: {
    alignItems: 'center', backgroundColor: 'rgba(232,143,36,0.06)',
    borderWidth: 1, borderColor: 'rgba(232,143,36,0.2)', borderRadius: 14, padding: 20, marginBottom: 20,
  },
  previewEmoji: { fontSize: 36 },
  previewName: { fontSize: 18, fontFamily: FONTS.heading, color: COLORS.white, marginTop: 8 },
  previewSub: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textMuted, marginTop: 4 },
  cancelButton: { alignItems: 'center', marginTop: 12 },
  cancelText: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.textTertiary },
});
