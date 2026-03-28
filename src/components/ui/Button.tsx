import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { COLORS, FONTS } from '../../lib/constants';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const variantStyles = VARIANT_STYLES[variant];

  return (
    <TouchableOpacity
      style={[styles.base, variantStyles.container, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.textColor} size="small" />
      ) : (
        <Text style={[styles.text, { color: variantStyles.textColor }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const VARIANT_STYLES = {
  primary: {
    container: { backgroundColor: COLORS.orange, borderWidth: 0 } as ViewStyle,
    textColor: COLORS.teal,
  },
  secondary: {
    container: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    } as ViewStyle,
    textColor: COLORS.white,
  },
  ghost: {
    container: { backgroundColor: 'transparent', borderWidth: 0 } as ViewStyle,
    textColor: COLORS.aqua,
  },
};

const styles = StyleSheet.create({
  base: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  text: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.5,
  },
});
