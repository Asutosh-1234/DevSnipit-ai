import React from 'react';
import { Text as RNText, StyleProp, TextStyle } from 'react-native';
import { useTheme } from './Theme';

export const Text: React.FC<{
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  variant?: 'title' | 'subtitle' | 'body' | 'caption' | 'bold';
  numberOfLines?: number;
}> = ({ children, style, variant = 'body', numberOfLines }) => {
  const { colors } = useTheme();

  let textStyle: TextStyle = { color: colors.text };

  switch (variant) {
    case 'title':
      textStyle = { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: 0.5 };
      break;
    case 'subtitle':
      textStyle = { color: colors.subtext, fontSize: 15, fontWeight: '500' };
      break;
    case 'caption':
      textStyle = { color: colors.subtext, fontSize: 12, letterSpacing: 0.2 };
      break;
    case 'bold':
      textStyle = { color: colors.text, fontSize: 16, fontWeight: '600' };
      break;
    case 'body':
    default:
      textStyle = { color: colors.text, fontSize: 15, lineHeight: 22 };
      break;
  }

  return (
    <RNText style={[textStyle, style]} numberOfLines={numberOfLines}>
      {children}
    </RNText>
  );
};
