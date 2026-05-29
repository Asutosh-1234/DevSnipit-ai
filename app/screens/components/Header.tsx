import React from 'react';
import { StyleSheet, View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from './Theme';
import { Text } from './Text';

export const Header: React.FC<{
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ title, showBack = false, onBackPress, rightAction, style }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.headerContainer, { borderBottomColor: colors.border }, style]}>
      <View style={styles.headerLeft}>
        {showBack && (
          <TouchableOpacity 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (onBackPress) onBackPress();
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text variant="title">{title}</Text>
      </View>
      {rightAction && <View style={styles.headerRight}>{rightAction}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});
