import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text as RNText, StyleProp, ViewStyle, Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from './Theme';
import { Text } from './Text';
import { LanguageBadge } from './Badges';

export const CodeSyntaxHighlighter: React.FC<{
  code: string;
  language: string;
  style?: StyleProp<ViewStyle>;
  maxHeight?: number;
}> = ({ code, language, style, maxHeight = 300 }) => {
  const { colors } = useTheme();

  const handleCopy = () => {
    Clipboard.setString(code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const renderHighlightedLine = (line: string, index: number) => {
    if (!line) {
      return <RNText key={index} style={{ height: 20 }}>{'\n'}</RNText>;
    }

    const tokenRegex = /(\/\/.*|#.*|"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|`(?:\\`|[^`])*`|\b(?:const|let|var|function|def|import|from|export|class|return|if|else|for|while|try|catch|except|async|await|require|module)\b|\b\d+\b)/g;

    const parts = line.split(tokenRegex);
    
    return (
      <RNText key={index} style={[styles.codeText, { color: colors.text }]}>
        {parts.map((part, pIdx) => {
          let partColor = colors.text;
          let fontStyle: 'normal' | 'italic' = 'normal';
          
          if (part.startsWith('//') || part.startsWith('#')) {
            partColor = colors.subtext;
            fontStyle = 'italic';
          } else if ((part.startsWith('"') && part.endsWith('"')) || 
                     (part.startsWith("'") && part.endsWith("'")) || 
                     (part.startsWith('`') && part.endsWith('`'))) {
            partColor = colors.success;
          } else if (['const', 'let', 'var', 'function', 'def', 'import', 'from', 'export', 'class', 'return', 'if', 'else', 'for', 'while', 'try', 'catch', 'except', 'async', 'await', 'require', 'module'].includes(part)) {
            partColor = colors.accent;
          } else if (/^\d+$/.test(part)) {
            partColor = '#f97316';
          }

          return (
            <RNText key={pIdx} style={{ color: partColor, fontStyle, fontFamily: 'monospace' }}>
              {part}
            </RNText>
          );
        })}
      </RNText>
    );
  };

  const lines = code.split('\n');

  return (
    <View style={[styles.codeContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }, style]}>
      <View style={[styles.codeHeader, { borderBottomColor: colors.border }]}>
        <LanguageBadge language={language} />
        <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
          <Ionicons name="copy-outline" size={16} color={colors.primary} />
          <Text variant="caption" style={{ color: colors.primary, fontWeight: '600', marginLeft: 4 }}>
            Copy
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.codeBody, { maxHeight }]}>
        <View style={styles.lineNumbersColumn}>
          {lines.map((_, idx) => (
            <RNText key={idx} style={[styles.lineNumberText, { color: colors.subtext }]}>
              {idx + 1}
            </RNText>
          ))}
        </View>
        <View style={styles.codeColumn}>
          {lines.map((line, idx) => renderHighlightedLine(line, idx))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  codeContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 12,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  codeBody: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  lineNumbersColumn: {
    width: 24,
    alignItems: 'flex-end',
    marginRight: 8,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.05)',
    paddingRight: 6,
  },
  lineNumberText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  codeColumn: {
    flex: 1,
    paddingLeft: 4,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 20,
  }
});
