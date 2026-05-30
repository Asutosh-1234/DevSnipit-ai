import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './Theme';
import { Card } from './Card';
import { Text } from './Text';
import { Button } from './Button';

interface AiExplanationHubProps {
  loading: boolean;
  explanation: string | null;
  summary: string | null;
  suggestions: string | null;
  onTrigger: () => void;
}

export function AiExplanationHub({
  loading,
  explanation,
  summary,
  suggestions,
  onTrigger
}: AiExplanationHubProps) {
  const { colors } = useTheme();

  if (loading) {
    return (
      <Card style={styles.aiLoadingCard}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.primary, fontWeight: '600' }}>
          Analyzing structural performance...
        </Text>
      </Card>
    );
  }

  if (explanation) {
    return (
      <View>
        {/* Summary Capsule */}
        <Card style={[styles.aiCard, { borderLeftColor: colors.accent, borderLeftWidth: 4 }]}>
          <View style={styles.aiCardHeader}>
            <Ionicons name="bulb-outline" size={18} color={colors.accent} />
            <Text variant="bold" style={{ marginLeft: 8, color: colors.accent }}>Executive Summary</Text>
          </View>
          <Text style={styles.aiCardBody}>{summary}</Text>
        </Card>

        {/* In-depth breakdown */}
        <Card style={[styles.aiCard, { borderLeftColor: colors.primary, borderLeftWidth: 4 }]}>
          <View style={styles.aiCardHeader}>
            <Ionicons name="book-outline" size={18} color={colors.primary} />
            <Text variant="bold" style={{ marginLeft: 8, color: colors.primary }}>Step-by-Step Breakdown</Text>
          </View>
          <Text style={styles.aiCardBody}>{explanation}</Text>
        </Card>

        {/* Optimizations */}
        <Card style={[styles.aiCard, { borderLeftColor: colors.success, borderLeftWidth: 4 }]}>
          <View style={styles.aiCardHeader}>
            <Ionicons name="trending-up-outline" size={18} color={colors.success} />
            <Text variant="bold" style={{ marginLeft: 8, color: colors.success }}>Optimization & Safety Tips</Text>
          </View>
          <Text style={styles.aiCardBody}>{suggestions}</Text>
        </Card>
        
        <Button 
          title="Re-Generate Explanations" 
          onPress={onTrigger}
          variant="secondary"
          iconName="refresh-outline"
          style={{ marginTop: 8 }}
        />
      </View>
    );
  }

  return (
    <Card style={styles.aiPromptCard}>
      <Ionicons name="sparkles-outline" size={32} color={colors.primary} />
      <Text style={styles.aiPromptHeading}>Generate Deep Explanations</Text>
      <Text style={styles.aiPromptBody}>
        Analyze complexity, trace performance constraints, and review structural optimization recommendations using offline Google Gemini tokens.
      </Text>
      <Button 
        title="Generate AI Analysis" 
        onPress={onTrigger}
        iconName="sparkles"
        style={{ alignSelf: 'stretch', marginTop: 12 }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  aiPromptCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  aiPromptHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  aiPromptBody: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  aiLoadingCard: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 12,
  },
  aiCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiCardBody: {
    fontSize: 13,
    lineHeight: 20,
    color: '#cbd5e1',
  }
});
