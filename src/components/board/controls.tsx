import React, { forwardRef, useState } from 'react';
import { ActivityIndicator, Image, StyleProp, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { useKit } from '../../theme';
import { Press } from './Press';
import { Txt } from './Txt';
import { Icon, IconName } from './Icon';
import type { HapticKind } from '../../lib/haptics';

// ─── Buttons ────────────────────────────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  feedback?: HapticKind | null;
  accessibilityLabel?: string;
}

/** The orange CTA: brand spot color, teal bold caps. One per screen. */
export function MarkerButton({ label, onPress, icon, loading, disabled, style, feedback = 'medium', accessibilityLabel }: ButtonProps) {
  const { p } = useKit();
  return (
    <Press
      onPress={onPress}
      disabled={disabled || loading}
      feedback={feedback}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        {
          height: 54,
          borderRadius: 10,
          backgroundColor: p.marker,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 20,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.onMarker} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={18} color={p.onMarker} weight="bold" /> : null}
          <Txt v="button" size={16} color={p.onMarker}>
            {label}
          </Txt>
        </>
      )}
    </Press>
  );
}

/** Secondary action: chalk outline, same shape. */
export function OutlineButton({ label, onPress, icon, loading, disabled, style, feedback = 'light', accessibilityLabel, tone }: ButtonProps & { tone?: 'ink' | 'danger' }) {
  const { p } = useKit();
  const c = tone === 'danger' ? p.danger : p.ink;
  return (
    <Press
      onPress={onPress}
      disabled={disabled || loading}
      feedback={feedback}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        {
          height: 50,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: tone === 'danger' ? p.danger : p.ruleStrong,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 18,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={17} color={c} weight="bold" /> : null}
          <Txt v="button" size={14} color={c}>
            {label}
          </Txt>
        </>
      )}
    </Press>
  );
}

export function TextButton({ label, onPress, color, style, disabled }: { label: string; onPress?: () => void; color?: string; style?: StyleProp<ViewStyle>; disabled?: boolean }) {
  const { p } = useKit();
  return (
    <Press onPress={onPress} disabled={disabled} feedback="selection" depress={1} hitSlop={10} style={[{ minHeight: 44, justifyContent: 'center' }, style]}>
      <Txt v="label" size={15} color={color ?? p.aqua}>
        {label}
      </Txt>
    </Press>
  );
}

/** 44pt icon hit target with an optional orange unread dot. */
export function IconButton({
  name,
  onPress,
  color,
  label,
  dot,
  size = 22,
  style,
}: {
  name: IconName;
  onPress?: () => void;
  color?: string;
  label: string;
  dot?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { p } = useKit();
  return (
    <Press
      onPress={onPress}
      feedback="selection"
      depress={0.9}
      accessibilityLabel={label}
      style={[{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Icon name={name} size={size} color={color ?? p.ink} />
      {dot ? (
        <View style={{ position: 'absolute', top: 9, end: 9, width: 9, height: 9, borderRadius: 5, backgroundColor: p.marker, borderWidth: 1.5, borderColor: p.board }} />
      ) : null}
    </Press>
  );
}

// ─── Selection ──────────────────────────────────────────────────────────────
/** Filter/selection chip. Selection is chalk-filled; orange stays reserved. */
export function Chip({
  label,
  selected,
  onPress,
  icon,
  sport,
  disabled,
  struck,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  sport?: string;
  disabled?: boolean;
  struck?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { p } = useKit();
  const fg = selected ? p.board : p.ink;
  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      feedback="selection"
      depress={0.95}
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      style={[
        {
          minHeight: 38,
          paddingHorizontal: 13,
          borderRadius: 8,
          borderWidth: 1.5,
          borderColor: selected ? p.ink : p.rule,
          backgroundColor: selected ? p.ink : 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
        },
        style,
      ]}
    >
      {sport ? <Icon sport={sport} size={16} color={fg} /> : icon ? <Icon name={icon} size={15} color={fg} /> : null}
      <Txt v="label" size={14} color={fg} style={struck ? { textDecorationLine: 'line-through' } : null}>
        {label}
      </Txt>
    </Press>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { p } = useKit();
  return (
    <View
      accessibilityRole="tablist"
      style={[{ flexDirection: 'row', backgroundColor: p.wash, borderRadius: 10, padding: 3, gap: 3 }, style]}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Press
            key={o.value}
            onPress={() => onChange(o.value)}
            feedback="selection"
            depress={0.97}
            accessibilityRole="tab"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: on }}
            style={{
              flex: 1,
              minHeight: 36,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? p.ink : 'transparent',
            }}
          >
            <Txt v="label" size={14} color={on ? p.board : p.inkSoft}>
              {o.label}
            </Txt>
          </Press>
        );
      })}
    </View>
  );
}

// ─── Text field ─────────────────────────────────────────────────────────────
interface FieldProps extends TextInputProps {
  error?: string;
  trailing?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Field = forwardRef<TextInput, FieldProps>(function Field({ error, trailing, containerStyle, style, multiline, onFocus, onBlur, ...rest }, ref) {
  const { p, f, isRTL } = useKit();
  const [focused, setFocused] = useState(false);
  return (
    <View style={containerStyle}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          minHeight: multiline ? 104 : 52,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: error ? p.danger : focused ? p.ink : p.ruleStrong,
          backgroundColor: p.wash,
          paddingHorizontal: 14,
          gap: 8,
        }}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={p.inkFaint}
          selectionColor={p.marker}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            {
              flex: 1,
              // lets the input shrink beside a trailing unit (web inputs have an intrinsic width)
              minWidth: 0,
              color: p.ink,
              fontSize: 17,
              ...f.ui,
              paddingVertical: multiline ? 14 : 12,
              textAlign: isRTL ? 'right' : 'left',
              textAlignVertical: multiline ? 'top' : 'center',
            },
            style,
          ]}
          {...rest}
        />
        {trailing}
      </View>
      {error ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <Icon name="warning" size={13} color={p.danger} />
          <Txt v="meta" color={p.danger} style={{ flex: 1 }}>
            {error}
          </Txt>
        </View>
      ) : null}
    </View>
  );
});

/** Section heading on a board screen: a heading, never an eyebrow. */
export function SectionHeading({ title, action, onAction, style }: { title: string; action?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  const { p } = useKit();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }, style]}>
      <Txt v="title" size={18}>
        {title}
      </Txt>
      {action ? <TextButton label={action} onPress={onAction} color={p.aqua} /> : null}
    </View>
  );
}

// ─── Dropdowns ──────────────────────────────────────────────────────────────
/** A field that opens a list (in a Sheet): shows the choice, with its photo or icon, or a placeholder. */
export function Dropdown({ label, sub, image, icon, left, open, placeholder, onPress, accessibilityLabel }: { label: string; sub?: string | null; image?: string | null; icon?: IconName; left?: React.ReactNode; open?: boolean; placeholder?: boolean; onPress: () => void; accessibilityLabel?: string }) {
  const { p } = useKit();
  return (
    <Press
      onPress={onPress}
      feedback="selection"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ? `${accessibilityLabel}: ${label}` : label}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: p.ruleStrong, backgroundColor: p.wash }}
    >
      {left ?? (image ? <Image source={{ uri: image }} style={{ width: 44, height: 44, borderRadius: 8 }} /> : icon ? <Icon name={icon} size={18} color={p.inkSoft} /> : null)}
      <View style={{ flex: 1 }}>
        <Txt v={placeholder ? 'body' : 'label'} size={15} color={placeholder ? p.inkFaint : p.ink} numberOfLines={1}>
          {label}
        </Txt>
        {sub ? (
          <Txt v="caption" numberOfLines={2}>
            {sub}
          </Txt>
        ) : null}
      </View>
      <Icon name="chevron" size={12} color={p.inkSoft} weight="bold" style={{ transform: [{ rotate: open ? '-90deg' : '90deg' }] }} />
    </Press>
  );
}

export interface Choice<T extends string> {
  value: T;
  label: string;
  sub?: string | null;
  icon?: IconName;
  /** Drawn in place of the icon, e.g. a small preview of the choice */
  left?: React.ReactNode;
  disabled?: boolean;
}

/** The rows inside a dropdown's sheet: one line each, with a short explanation and a check on the choice. */
export function ChoiceList<T extends string>({ options, value, onChange }: { options: Choice<T>[]; value: T | null; onChange: (v: T) => void }) {
  const { p } = useKit();
  return (
    <View accessibilityRole="radiogroup">
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <Press
            key={o.value}
            onPress={() => onChange(o.value)}
            disabled={o.disabled}
            feedback="selection"
            accessibilityRole="radio"
            accessibilityState={{ selected: on, disabled: !!o.disabled }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: i ? 1 : 0, borderTopColor: p.rule, opacity: o.disabled ? 0.45 : 1 }}
          >
            {o.left ?? (o.icon ? <Icon name={o.icon} size={20} color={on ? p.ink : p.inkSoft} /> : null)}
            <View style={{ flex: 1, gap: 2 }}>
              <Txt v="label" size={16}>
                {o.label}
              </Txt>
              {o.sub ? <Txt v="caption">{o.sub}</Txt> : null}
            </View>
            {on ? <Icon name="check" size={18} color={p.aqua} weight="bold" /> : null}
          </Press>
        );
      })}
    </View>
  );
}
