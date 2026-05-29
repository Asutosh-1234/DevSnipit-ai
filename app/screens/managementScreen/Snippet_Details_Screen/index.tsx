import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Image,
  ActivityIndicator,
  Share
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';

import { 
  useTheme, 
  Text, 
  Header, 
  Card, 
  Button, 
  LanguageBadge, 
  TagBadge,
  CodeSyntaxHighlighter
} from '../../components';
import { 
  getSnippetById, 
  deleteSnippet, 
  getAttachments, 
  toggleFavoriteSnippet 
} from '../../../../lib/db';
import { exportSnippetFile } from '../../../../lib/fileHelper';
import { Snippet, Attachment } from '../../../../lib/types';

export default function SnippetDetailsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const snippetId = params.id as string;

  // Snippet states
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [loading, setLoading] = useState(true);

  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);

  useEffect(() => {
    if (snippetId) {
      loadSnippetDetails(snippetId);
    }
  }, [snippetId]);

  const loadSnippetDetails = async (id: string) => {
    setLoading(true);
    const snip = await getSnippetById(id);
    if (snip) {
      setSnippet(snip);
      const attachs = await getAttachments(id);
      if (attachs && attachs.length > 0) {
        setAttachment(attachs[0]);
      }
    }
    setLoading(false);
  };

  const handleToggleFavorite = async () => {
    if (!snippet) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newState = !snippet.is_favorite;
    await toggleFavoriteSnippet(snippet.id, newState);
    setSnippet({ ...snippet, is_favorite: newState });
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Delete Snippet",
      "Are you sure you want to delete this code snippet? This action is irreversible.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            if (snippet) {
              await deleteSnippet(snippet.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            }
          }
        }
      ]
    );
  };

  // Export snippet locally
  const handleExport = async (ext: 'txt' | 'js' | 'json') => {
    if (!snippet) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await exportSnippetFile(snippet.title, snippet.code, ext);
      Alert.alert("Success", `Snippet exported successfully as a .${ext} file in local storage!`);
    } catch (e) {
      Alert.alert("Error", "Failed to export snippet file.");
    }
  };

  // Share snippet with other apps
  const handleShare = async (ext: 'txt' | 'js' | 'json') => {
    if (!snippet) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await exportSnippetFile(snippet.title, snippet.code, ext);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri);
      } else {
        // Fallback to standard share
        await Share.share({
          title: snippet.title,
          message: snippet.code,
        });
      }
    } catch (e) {
      Alert.alert("Error", "Failed to share snippet.");
    }
  };

  // Trigger Gemini AI Code Explanation
  const handleGenerateAIExplanation = async () => {
    if (!snippet) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAiLoading(true);

    try {
      // 1. Fetch Key from Secure Store
      let apiKey = await SecureStore.getItemAsync('GEMINI_API_KEY');
      
      // 2. Fallback to process.env
      if (!apiKey) {
        apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
      }

      if (!apiKey) {
        setAiLoading(false);
        Alert.alert(
          "API Key Required",
          "Please configure a Google Gemini API Key in the Settings screen to analyze code offline-first.",
          [{ text: "OK" }]
        );
        return;
      }

      // 3. Craft strict structured markdown prompt
      const promptText = `
        You are an elite software architecture expert. Analyze the following code snippet carefully.
        Snippet Language: ${snippet.language}
        Code Content:
        \`\`\`
        ${snippet.code}
        \`\`\`

        Provide an extensive evaluation containing exactly three distinct parts:
        - Part 1: Start with the marker "[EXPLANATION_START]" and end with "[EXPLANATION_END]". Provide a detailed code analysis explaining what the logic does line-by-line or structurally.
        - Part 2: Start with the marker "[SUMMARY_START]" and end with "[SUMMARY_END]". Provide a simple, clear 1-2 sentence overview summarizing its utility.
        - Part 3: Start with the marker "[SUGGESTIONS_START]" and end with "[SUGGESTIONS_END]". Provide 2-3 advanced code-level suggestions to optimize performance, handle edge cases, or improve security with concrete examples.
      `;

      // 4. API fetch call
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: promptText }]
            }]
          })
        }
      );

      const json = await response.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!rawText) {
        throw new Error("Empty response received from AI model.");
      }

      // 5. Parse parsed segments from markers
      const expMatch = rawText.match(/\[EXPLANATION_START\]([\s\S]*?)\[EXPLANATION_END\]/);
      const sumMatch = rawText.match(/\[SUMMARY_START\]([\s\S]*?)\[SUMMARY_END\]/);
      const sugMatch = rawText.match(/\[SUGGESTIONS_START\]([\s\S]*?)\[SUGGESTIONS_END\]/);

      // Clean markdown tags inside markers
      const cleanMarkdown = (str: string) => str.trim().replace(/^###\s+/i, '');

      setAiExplanation(expMatch ? cleanMarkdown(expMatch[1]) : rawText);
      setAiSummary(sumMatch ? cleanMarkdown(sumMatch[1]) : "Code analyzed successfully.");
      setAiSuggestions(sugMatch ? cleanMarkdown(sugMatch[1]) : "No critical performance suggestions.");

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error(e);
      Alert.alert("AI Error", "Failed to connect to Gemini API. Please check your network connection and API key.");
    } finally {
      setAiLoading(false);
    }
  };

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
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
          
          {aiLoading ? (
            <Card style={styles.aiLoadingCard}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ marginTop: 12, color: colors.primary, fontWeight: '600' }}>
                Analyzing structural performance...
              </Text>
            </Card>
          ) : aiExplanation ? (
            <View>
              {/* Summary Capsule */}
              <Card style={[styles.aiCard, { borderLeftColor: colors.accent, borderLeftWidth: 4 }]}>
                <View style={styles.aiCardHeader}>
                  <Ionicons name="bulb-outline" size={18} color={colors.accent} />
                  <Text variant="bold" style={{ marginLeft: 8, color: colors.accent }}>Executive Summary</Text>
                </View>
                <Text style={styles.aiCardBody}>{aiSummary}</Text>
              </Card>

              {/* In-depth breakdown */}
              <Card style={[styles.aiCard, { borderLeftColor: colors.primary, borderLeftWidth: 4 }]}>
                <View style={styles.aiCardHeader}>
                  <Ionicons name="book-outline" size={18} color={colors.primary} />
                  <Text variant="bold" style={{ marginLeft: 8, color: colors.primary }}>Step-by-Step Breakdown</Text>
                </View>
                <Text style={styles.aiCardBody}>{aiExplanation}</Text>
              </Card>

              {/* Optimizations */}
              <Card style={[styles.aiCard, { borderLeftColor: colors.success, borderLeftWidth: 4 }]}>
                <View style={styles.aiCardHeader}>
                  <Ionicons name="trending-up-outline" size={18} color={colors.success} />
                  <Text variant="bold" style={{ marginLeft: 8, color: colors.success }}>Optimization & Safety Tips</Text>
                </View>
                <Text style={styles.aiCardBody}>{aiSuggestions}</Text>
              </Card>
              
              <Button 
                title="Re-Generate Explanations" 
                onPress={handleGenerateAIExplanation}
                variant="secondary"
                iconName="refresh-outline"
                style={{ marginTop: 8 }}
              />
            </View>
          ) : (
            <Card style={styles.aiPromptCard}>
              <Ionicons name="sparkles-outline" size={32} color={colors.primary} />
              <Text style={styles.aiPromptHeading}>Generate Deep Explanations</Text>
              <Text style={styles.aiPromptBody}>
                Analyze complexity, trace performance constraints, and review structural optimization recommendations using offline Google Gemini tokens.
              </Text>
              <Button 
                title="Generate AI Analysis" 
                onPress={handleGenerateAIExplanation}
                iconName="sparkles"
                style={{ alignSelf: 'stretch', marginTop: 12 }}
              />
            </Card>
          )}
        </View>

      </ScrollView>
    </View>
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
  },
  aiPromptCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
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
