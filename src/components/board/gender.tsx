import React, { useState } from 'react';
import { View } from 'react-native';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabase';
import { PREVIEW } from '../../data/preview';
import { Sheet } from './sheet';
import { Txt } from './Txt';
import { MarkerButton, Segmented, TextButton } from './controls';
import { toast } from './toast';

// Members who joined before gender was asked at sign-up: ask once, so women-only and men-only
// groups and sessions work for them. "Not now" hides it until the app is opened again.
let dismissed = false;

export function GenderAsk() {
  const { p } = useKit();
  const { t } = useI18n();
  const { user, profile, refreshProfile } = useAuth();
  const [open, setOpen] = useState(true);
  const [gender, setGender] = useState<'female' | 'male' | ''>('');
  const [busy, setBusy] = useState(false);
  const prof: any = profile;
  if (PREVIEW || dismissed || !user || !prof || !prof.onboarding_completed || prof.gender) return null;

  const close = () => {
    dismissed = true;
    setOpen(false);
  };
  async function save() {
    if (!gender || !user) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('profiles').update({ gender }).eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      close();
    } catch {
      toast.show(t('onboarding.saveError'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={open} title={t('onboarding.genderAskTitle')} onClose={close}>
      <Txt v="body" color={p.inkSoft}>
        {t('onboarding.genderAskSub')}
      </Txt>
      <Segmented
        value={gender || 'none'}
        onChange={(v) => setGender(v === 'none' ? '' : (v as 'female' | 'male'))}
        options={[
          { value: 'female', label: t('onboarding.female') },
          { value: 'male', label: t('onboarding.male') },
        ]}
      />
      <View style={{ gap: 6 }}>
        <MarkerButton label={t('common.save')} onPress={save} loading={busy} disabled={!gender} />
        <TextButton label={t('onboarding.genderAskLater')} onPress={close} style={{ alignSelf: 'center' }} />
      </View>
    </Sheet>
  );
}
