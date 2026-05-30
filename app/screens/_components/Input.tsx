import React from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './Theme';

export const Input: React.FC<{
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  style?: StyleProp<ViewStyle>;
  multiline?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  iconName?: keyof typeof Ionicons.glyphMap;
  onIconPress?: () => void;
  numberOfLines?: number;
  monospace?: boolean;
}> = ({ 
  placeholder, 
  value, 
  onChangeText, 
  style, 
  multiline = false, 
  secureTextEntry = false,
  keyboardType = 'default',
  iconName,
  onIconPress,
  numberOfLines,
  monospace = false
}) => {
  const { colors } = useTheme();

  return (
    <View style={[
      styles.inputContainer, 
      { 
        backgroundColor: colors.inputBackground, 
        borderColor: colors.border,
        alignItems: multiline ? 'flex-start' : 'center',
        paddingVertical: multiline ? 12 : 0,
      }, 
      style
    ]}>
      {iconName && !multiline && (
        <Ionicons name={iconName} size={18} color={colors.subtext} style={styles.inputIcon} />
      )}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.subtext}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={numberOfLines}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={[
          styles.textInput, 
          { 
            color: colors.text,
            textAlignVertical: multiline ? 'top' : 'center',
            minHeight: multiline ? 100 : 48,
            fontFamily: monospace ? 'monospace' : 'System',
          }
        ]}
      />
      {iconName && onIconPress && (
        <TouchableOpacity onPress={onIconPress} style={styles.inputIconButton}>
          <Ionicons name={iconName} size={18} color={colors.subtext} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
    alignSelf: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
    fontFamily: 'System',
  },
  inputIconButton: {
    padding: 8,
    alignSelf: 'center',
  }
});
