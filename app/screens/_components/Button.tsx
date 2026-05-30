import React from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, Colors } from './Theme';
import { Text } from './Text';

export const Button: React.FC<{
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}> = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  loading = false, 
  iconName,
  style,
  textStyle
}) => {
  const { colors } = useTheme();

  let btnBg = colors.primary;
  let btnTxt = Colors.dark.text;
  let btnBorder = 'transparent';

  switch (variant) {
    case 'secondary':
      btnBg = colors.cardBackground;
      btnTxt = colors.text;
      btnBorder = colors.border;
      break;
    case 'danger':
      btnBg = colors.danger;
      btnTxt = '#ffffff';
      break;
    case 'ghost':
      btnBg = 'transparent';
      btnTxt = colors.primary;
      break;
    case 'primary':
    default:
      btnBg = colors.primary;
      btnTxt = '#111827'; // Dark text for neon primary highlight
      break;
  }

  const handlePress = () => {
    if (loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity 
      onPress={handlePress}
      activeOpacity={0.8}
      style={[
        styles.button, 
        { 
          backgroundColor: btnBg, 
          borderColor: btnBorder,
          borderWidth: btnBorder !== 'transparent' ? 1 : 0
        }, 
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={btnTxt} />
      ) : (
        <View style={styles.buttonInner}>
          {iconName && <Ionicons name={iconName} size={18} color={btnTxt} style={{ marginRight: 6 }} />}
          <Text style={[{ color: btnTxt, fontWeight: '600', fontSize: 15 }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
