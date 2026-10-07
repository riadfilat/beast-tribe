import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { SportId, sportsByPopularity } from '../../lib/sports';
import { Txt } from './Txt';
import { Icon } from './Icon';
import { Press } from './Press';
import { Field } from './controls';

/**
 * Every sport, most popular first, with a search box on top (matches the name in either language).
 * Single choice (Play) or several (onboarding, My sports).
 */
export function SportSearchList({ selected, onPick, autoFocus }: { selected: string[]; onPick: (id: SportId) => void; autoFocus?: boolean }) {
  const { p } = useKit();
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const all = useMemo(() => sportsByPopularity(), []);
  const needle = q.trim().toLowerCase();
  const list = needle
    ? all.filter((x) => [t(`sports.${x.id}`), x.id.replace('_', ' '), x.dbName || ''].some((name) => name.toLowerCase().includes(needle)))
    : all;
  return (
    <View style={{ gap: 6 }}>
      <Field value={q} onChangeText={setQ} placeholder={t('sportPicker.search')} autoCorrect={false} autoCapitalize="none" returnKeyType="search" autoFocus={autoFocus} accessibilityLabel={t('sportPicker.search')} />
      {list.length ? (
        <View accessibilityRole="list">
          {list.map((x, i) => {
            const on = selected.includes(x.id);
            return (
              <Press
                key={x.id}
                onPress={() => onPick(x.id)}
                feedback="selection"
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, borderTopWidth: i ? 1 : 0, borderTopColor: p.rule }}
              >
                <Icon sport={x.id} size={22} color={on ? p.markerText : p.inkSoft} />
                <Txt v="label" size={16} color={on ? p.ink : p.ink} style={{ flex: 1 }}>
                  {t(`sports.${x.id}`)}
                </Txt>
                {on ? <Icon name="check" size={16} color={p.aqua} weight="bold" /> : null}
              </Press>
            );
          })}
        </View>
      ) : (
        <Txt v="meta" style={{ paddingVertical: 12 }}>
          {t('sportPicker.none')}
        </Txt>
      )}
    </View>
  );
}
