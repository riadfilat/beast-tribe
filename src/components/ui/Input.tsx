import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { COLORS, FONTS } from '../../lib/constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, style, ...props }: InputProps) {
  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View style={styles.row}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
          style={[styles.input, error ? styles.inputError : undefined, style]}
          placeholderTextColor={COLORS.textTertiary}
          {...props}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontFamily: FONTS.body,
    width: 70,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 10,
    fontSize: 13,
    color: COLORS.white,
    fontFamily: FONTS.body,
  },
  inputError: {
    borderColor: '#EF5B5B',
    backgroundColor: 'rgba(239,91,91,0.06)',
  },
  errorText: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: '#EF5B5B',
    marginTop: 4,
    marginLeft: 76, // align with input (label width + gap)
  },
});
