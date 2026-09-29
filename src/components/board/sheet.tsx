import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { Txt } from './Txt';
import { TextButton } from './controls';

/**
 * A native page sheet for a focused task (log a meal, record a measurement).
 * Header: Cancel · title · optional action. Content scrolls; the keyboard never covers it.
 */
export function Sheet({
  visible,
  title,
  onClose,
  action,
  children,
  contentStyle,
  footer,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  action?: { label: string; onPress: () => void; disabled?: boolean };
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** Pinned below the scroll area (e.g. the primary button) */
  footer?: React.ReactNode;
}) {
  const { p } = useKit();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: p.board }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: p.rule }}>
          <View style={{ minWidth: 72, alignItems: 'flex-start' }}>
            <TextButton label={t('common.cancel')} onPress={onClose} color={p.inkSoft} />
          </View>
          <Txt v="headline" style={{ flex: 1 }} align="center" numberOfLines={1} accessibilityRole="header">
            {title}
          </Txt>
          <View style={{ minWidth: 72, alignItems: 'flex-end' }}>
            {action ? <TextButton label={action.label} onPress={action.onPress} disabled={action.disabled} color={action.disabled ? p.inkFaint : p.markerText} /> : null}
          </View>
        </View>
        <ScrollView contentContainerStyle={[{ padding: 16, gap: 14, paddingBottom: footer ? 16 : 32 + insets.bottom }, contentStyle]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {footer ? <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 + insets.bottom, borderTopWidth: 1, borderTopColor: p.rule, backgroundColor: p.boardDeep }}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}
