import React from 'react';
import { StyleProp, Switch, View, ViewStyle } from 'react-native';
import { useKit } from '../../theme';
import { Press } from './Press';
import { Txt } from './Txt';
import { Icon, IconName } from './Icon';

/** iOS inset-grouped list for settings-shaped content. */
export function Group({ children, style, footer }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; footer?: string }) {
  const { p } = useKit();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={style}>
      <View style={{ borderRadius: 12, backgroundColor: p.wash, borderWidth: 1, borderColor: p.rule, overflow: 'hidden' }}>
        {items.map((child, i) => (
          <View key={i}>
            {child}
            {i < items.length - 1 ? <View style={{ height: 1, backgroundColor: p.rule, marginStart: 52 }} /> : null}
          </View>
        ))}
      </View>
      {footer ? (
        <Txt v="caption" style={{ marginTop: 8, marginHorizontal: 4 }}>
          {footer}
        </Txt>
      ) : null}
    </View>
  );
}

export function GroupRow({
  icon,
  label,
  value,
  onPress,
  tone,
  chevron = true,
  toggle,
  onToggle,
  sub,
}: {
  icon?: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  tone?: 'danger' | 'aqua';
  chevron?: boolean;
  toggle?: boolean;
  onToggle?: (v: boolean) => void;
  sub?: string;
}) {
  const { p } = useKit();
  const c = tone === 'danger' ? p.danger : tone === 'aqua' ? p.aqua : p.ink;
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: 14, gap: 12 }}>
      {icon ? (
        <View style={{ width: 26, alignItems: 'center' }}>
          <Icon name={icon} size={18} color={c} />
        </View>
      ) : null}
      <View style={{ flex: 1, paddingVertical: 10 }}>
        <Txt v="body" color={c}>
          {label}
        </Txt>
        {sub ? <Txt v="caption">{sub}</Txt> : null}
      </View>
      {value ? <Txt v="meta">{value}</Txt> : null}
      {toggle !== undefined ? (
        <Switch
          value={toggle}
          onValueChange={onToggle}
          trackColor={{ false: p.ruleStrong, true: p.marker }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={p.ruleStrong}
        />
      ) : onPress && chevron ? (
        <Icon name="chevron" size={14} color={p.inkFaint} weight="bold" />
      ) : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Press onPress={onPress} feedback="selection" depress={0.99}>
      {body}
    </Press>
  );
}
