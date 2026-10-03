import React, { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { GLYPH_FAMILIES, GlyphFamily } from '../brand/glyphs';
import { Emblem, familyOf, firstEmoji, glyphId, PATCH_COLORS, PATCH_EMOJI, PATCH_PAINT } from '../../lib/emblem';
import { Patch } from './Patch';
import { Press } from './Press';
import { Txt } from './Txt';
import { Field, SectionHeading, Segmented } from './controls';

type Tab = GlyphFamily | 'emoji' | 'letters';
const TABS: Tab[] = ['sport', 'beasts', 'myths', 'marks', 'emoji', 'letters'];
const EDGE: Record<string, string> = { '#023C3C': 'rgba(244,241,234,0.32)', '#F4F1EA': 'rgba(2,60,60,0.30)' };

/** Choose a pack's patch: a symbol (beasts, myths, marks, emoji, letters) and a colourway. */
export function PatchPicker({ value, onChange, name }: { value: Emblem; onChange: (e: Emblem) => void; name: string }) {
  const { p } = useKit();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>(() => (value.kind === 'glyph' ? familyOf(glyphId(value.value)) : value.kind));
  const [typed, setTyped] = useState('');

  const cols = tab === 'emoji' ? 5 : 4;
  const gap = 6;
  const cell = Math.floor((Math.min(width, 560) - 40 - gap * (cols - 1)) / cols);
  const size = Math.min(tab === 'emoji' ? 50 : 60, cell - 12);
  const pick = (next: Partial<Emblem>) => onChange({ ...value, ...next });

  const emoji = value.kind === 'emoji' && value.value && !PATCH_EMOJI.includes(value.value) ? [value.value, ...PATCH_EMOJI] : PATCH_EMOJI;

  return (
    <View style={{ gap: 14 }}>
      <Segmented options={TABS.map((k) => ({ value: k, label: t(`pack.kinds.${k}`) }))} value={tab} onChange={setTab} />

      {tab === 'emoji' ? (
        <View style={{ gap: 12 }}>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
            {emoji.map((e) => (
              <Option key={e} on={value.kind === 'emoji' && value.value === e} width={cell} label={e} onPress={() => pick({ kind: 'emoji', value: e })}>
                <Patch emblem={{ kind: 'emoji', value: e, color: value.color }} size={size} />
              </Option>
            ))}
          </View>
          <Field
            value={typed}
            onChangeText={(v) => {
              const e = firstEmoji(v);
              setTyped(e ?? '');
              if (e) pick({ kind: 'emoji', value: e });
            }}
            placeholder={t('pack.anyEmoji')}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="done"
            accessibilityLabel={t('pack.anyEmoji')}
          />
          <Txt v="meta">{t('pack.anyEmojiHint')}</Txt>
        </View>
      ) : tab === 'letters' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Option on={value.kind === 'letters'} width={84} label={t('pack.useLetters')} onPress={() => pick({ kind: 'letters', value: null })}>
            <Patch emblem={{ kind: 'letters', value: null, color: value.color }} name={name} size={68} />
          </Option>
          <Txt v="body" color={p.inkSoft} style={{ flex: 1 }}>
            {t('pack.lettersHint')}
          </Txt>
        </View>
      ) : (
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
          {GLYPH_FAMILIES[tab].map((id) => (
            <Option key={id} on={value.kind === 'glyph' && glyphId(value.value) === id} width={cell} label={t(`pack.glyphs.${id}`)} showLabel onPress={() => pick({ kind: 'glyph', value: id })}>
              <Patch emblem={{ kind: 'glyph', value: id, color: value.color }} size={size} />
            </Option>
          ))}
        </View>
      )}

      <SectionHeading title={t('pack.colour')} />
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -6 }}>
        {PATCH_COLORS.map((c) => {
          const { ground, ink } = PATCH_PAINT[c];
          const on = value.color === c;
          return (
            <Press
              key={c}
              onPress={() => pick({ color: c })}
              feedback="selection"
              depress={0.94}
              accessibilityRole="radio"
              accessibilityLabel={t(`pack.colours.${c}`)}
              accessibilityState={{ selected: on }}
              style={{ padding: 3, borderRadius: 99, borderWidth: 2, borderColor: on ? p.ink : 'transparent' }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: ground, alignItems: 'center', justifyContent: 'center', borderWidth: EDGE[ground] ? 1.5 : 0, borderColor: EDGE[ground] }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: ink }} />
              </View>
            </Press>
          );
        })}
      </View>
    </View>
  );
}

function Option({ on, width, label, showLabel, onPress, children }: { on: boolean; width: number; label: string; showLabel?: boolean; onPress: () => void; children: React.ReactNode }) {
  const { p } = useKit();
  return (
    <Press onPress={onPress} feedback="selection" depress={0.94} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ selected: on }} style={{ width, alignItems: 'center', gap: 5, paddingVertical: 2 }}>
      <View style={{ padding: 3, borderRadius: 99, borderWidth: 2, borderColor: on ? p.ink : 'transparent' }}>{children}</View>
      {showLabel ? (
        <Txt v="label" size={12} color={on ? p.ink : p.inkSoft} numberOfLines={1} align="center">
          {label}
        </Txt>
      ) : null}
    </Press>
  );
}
