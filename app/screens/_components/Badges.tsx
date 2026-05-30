import React from 'react';
import { StyleSheet, View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from './Theme';
import { Text } from './Text';

// Stylized Programming Language indicator badge
export const LanguageBadge: React.FC<{
  language: string;
  style?: StyleProp<ViewStyle>;
}> = ({ language, style }) => {
  const { colors } = useTheme();

  // Pick color representation
  let dotColor = '#94a3b8';
  const lang = language.trim().toLowerCase();

  if (lang.includes('js') || lang.includes('javascript')) dotColor = '#eab308';
  else if (lang.includes('ts') || lang.includes('typescript')) dotColor = '#3b82f6';
  else if (lang.includes('py') || lang.includes('python')) dotColor = '#0284c7';
  else if (lang.includes('html')) dotColor = '#f97316';
  else if (lang.includes('css')) dotColor = '#3b82f6';
  else if (lang.includes('rs') || lang.includes('rust')) dotColor = '#ea580c';
  else if (lang.includes('java')) dotColor = '#dc2626';
  else if (lang.includes('go')) dotColor = '#06b6d4';
  else if (lang.includes('sh') || lang.includes('bash')) dotColor = '#22c55e';
  else if (lang.includes('json')) dotColor = '#a855f7';

  return (
    <View style={[styles.badge, { backgroundColor: colors.inputBackground, borderColor: colors.border }, style]}>
      <View style={[styles.badgeDot, { backgroundColor: dotColor }]} />
      <Text variant="caption" style={{ textTransform: 'capitalize', fontWeight: '600', color: colors.text }}>
        {language}
      </Text>
    </View>
  );
};

// Stylized Tag badges
export const TagBadge: React.FC<{
  tag: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}> = ({ tag, onPress, style }) => {
  const { colors } = useTheme();

  const BadgeWrapper = onPress ? TouchableOpacity : View;

  return (
    // @ts-ignore
    <BadgeWrapper 
      onPress={() => onPress?.()}
      style={[
        styles.tagBadge, 
        { 
          backgroundColor: colors.primaryLight,
          borderColor: colors.primary
        }, 
        style
      ]}
    >
      <Text variant="caption" style={{ color: colors.primary, fontWeight: '600' }}>
        #{tag}
      </Text>
    </BadgeWrapper>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  }
});
