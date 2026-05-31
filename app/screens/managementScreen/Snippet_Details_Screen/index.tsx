import React from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { 
  useTheme, 
  Text, 
  Header, 
  Card, 
  Button, 
  LanguageBadge, 
  TagBadge,
  CodeSyntaxHighlighter,
  AiExplanationHub
} from '../../_components';
import { useSnippetDetails } from '../../_hooks/useSnippetDetails';

export default function SnippetDetailsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const snippetId = params.id as string;

  // Bind states & actions using our custom hook
  const {
    snippet,
    attachment,
    loading,
    aiLoading,
    aiExplanation,
    aiSummary,
    aiSuggestions,
    handleToggleFavorite,
    handleDelete,
    handleExport,
    handleShare,
    handleGenerateAIExplanation
  } = useSnippetDetails(snippetId);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!snippet) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={{ marginTop: 12, color: colors.subtext }}>Snippet not found.</Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Custom Navigation Header */}
      <Header 
        title="Details" 
        showBack 
        onBackPress={() => router.back()} 
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleToggleFavorite} style={styles.actionIcon}>
              <Ionicons 
                name={snippet.is_favorite ? "star" : "star-outline"} 
                size={22} 
                color={snippet.is_favorite ? "#fbbf24" : colors.text} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push({
                pathname: '/screens/managementScreen/Create_Snippet_Screen',
                params: { id: snippet.id }
              } as any)} 
              style={styles.actionIcon}
            >
              <Ionicons name="create-outline" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.actionIcon}>
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Title */}
        <Text style={styles.titleText}>{snippet.title}</Text>
        
        {/* Language Badge */}
        <View style={styles.metaRow}>
          <LanguageBadge language={snippet.language} />
          <Text variant="caption" style={{ marginLeft: 12 }}>
            Saved {new Date(snippet.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Code Content Monospace Block */}
        <CodeSyntaxHighlighter code={snippet.code} language={snippet.language} maxHeight={400} />

        {/* Tags Row */}
        {snippet.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {snippet.tags.map((t: string) => (
              <TagBadge key={t} tag={t} />
            ))}
          </View>
        )}

        {/* Attached Screenshot preview */}
        {attachment && (
          <View style={styles.screenshotSection}>
            <Text variant="bold" style={styles.sectionHeading}>Linked Screenshot</Text>
            <Card style={styles.imageCard}>
              <Image source={{ uri: attachment.file_path }} style={styles.screenshotImage} />
            </Card>
          </View>
        )}

        {/* Export & Sharing Hub */}
        <View style={styles.exportSection}>
          <Text variant="bold" style={styles.sectionHeading}>Export & Share Options</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.gridBtn, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={() => handleExport('js')}
            >
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <Text variant="caption" style={styles.gridBtnText}>Local .js</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.gridBtn, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={() => handleExport('json')}
            >
              <Ionicons name="logo-javascript" size={20} color={colors.primary} />
              <Text variant="caption" style={styles.gridBtnText}>Local .json</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.gridBtn, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={() => handleShare('js')}
            >
              <Ionicons name="share-outline" size={20} color={colors.accent} />
              <Text variant="caption" style={styles.gridBtnText}>Share Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Explainer Dashboard */}
        <View style={styles.aiSection}>
          <Text variant="bold" style={styles.sectionHeading}>AI Code Analysis</Text>
          <AiExplanationHub 
            loading={aiLoading}
            explanation={aiExplanation}
            summary={aiSummary}
            suggestions={aiSuggestions}
            onTrigger={handleGenerateAIExplanation}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    padding: 8,
    marginLeft: 8,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 48,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 16,
  },
  screenshotSection: {
    marginBottom: 16,
  },
  imageCard: {
    padding: 4,
    borderRadius: 16,
    overflow: 'hidden',
    height: 250,
    marginBottom: 0,
  },
  screenshotImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  exportSection: {
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridBtn: {
    flex: 1,
    height: 60,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  gridBtnText: {
    marginTop: 4,
    fontWeight: '600',
  },
  aiSection: {
    marginBottom: 24,
  }
});
