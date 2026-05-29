import React from 'react';
import { StyleSheet, TouchableOpacity, View, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from './Theme';

export const Card: React.FC<{
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  glow?: boolean;
}> = ({ children, style, onPress, glow = false }) => {
  const { colors } = useTheme();

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    // @ts-ignore
    <CardWrapper 
      onPress={onPress} 
      activeOpacity={0.8}
      style={[
        styles.card, 
        { 
          backgroundColor: colors.cardBackground, 
          borderColor: glow ? colors.primary : colors.border 
        }, 
        glow && { shadowColor: colors.primary, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
        style
      ]}
    >
      {children}
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  }
});
