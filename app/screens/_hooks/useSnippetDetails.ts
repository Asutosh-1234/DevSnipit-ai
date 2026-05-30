import { useState, useEffect } from 'react';
import { Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';

import { 
  getSnippetById, 
  deleteSnippet, 
  getAttachments, 
  toggleFavoriteSnippet 
} from '../../../lib/db';
import { exportSnippetFile } from '../../../lib/fileHelper';
import { Snippet, Attachment } from '../../../lib/types';

export function useSnippetDetails(snippetId: string) {
  const router = useRouter();

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
      await exportSnippetFile(snippet.title, snippet.code, ext);
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
      let apiKey = await SecureStore.getItemAsync('GEMINI_API_KEY');
      
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

      const expMatch = rawText.match(/\[EXPLANATION_START\]([\s\S]*?)\[EXPLANATION_END\]/);
      const sumMatch = rawText.match(/\[SUMMARY_START\]([\s\S]*?)\[SUMMARY_END\]/);
      const sugMatch = rawText.match(/\[SUGGESTIONS_START\]([\s\S]*?)\[SUGGESTIONS_END\]/);

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

  return {
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
  };
}
