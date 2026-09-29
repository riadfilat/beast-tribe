import React from 'react';
import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { makeStyles, useKit } from '../src/theme';
import { useI18n } from '../src/i18n';
import { Txt } from '../src/components/board/Txt';
import { Icon } from '../src/components/board/Icon';
import { ZigZag } from '../src/components/board/marks';
import { OutlineButton } from '../src/components/board/controls';

export default function NotFoundScreen() {
  const s = useStyles();
  const { p } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.screen}>
        <Icon name="board" size={34} color={p.inkFaint} />
        <Txt v="title" size={24} align="center" accessibilityRole="header">
          {t('notFound.title')}
        </Txt>
        <ZigZag style={{ alignSelf: 'stretch', marginHorizontal: 40 }} />
        <Txt v="body" color={p.inkSoft} align="center">
          {t('notFound.body')}
        </Txt>
        <OutlineButton label={t('notFound.home')} onPress={() => router.replace('/(tabs)/home')} style={{ alignSelf: 'stretch', marginTop: 8 }} />
      </View>
    </>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32, backgroundColor: p.board },
}));
