import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';

import { getSnippets, getDbFileStats, getDb } from '../../../lib/db';
import * as fileHelper from '../../../lib/fileHelper';

export function useSettings() {
  // Settings states
  const [apiKey, setApiKey] = useState('');
  const [loadingKey, setLoadingKey] = useState(true);
  const [savingKey, setSavingKey] = useState(false);

  // Statistics states
  const [snippetCount, setSnippetCount] = useState(0);
  const [attachmentCount, setAttachmentCount] = useState(0);
  const [attachmentSize, setAttachmentSize] = useState(0);

  useEffect(() => {
    loadStats();
    loadSecureKey();
  }, []);

  const loadStats = async () => {
    try {
      const snips = await getSnippets();
      setSnippetCount(snips.length);

      const stats = await getDbFileStats();
      setAttachmentCount(stats.count);
      setAttachmentSize(stats.totalSize);
    } catch (e) {
      console.error("Stats fetching error:", e);
    }
  };

  const loadSecureKey = async () => {
    setLoadingKey(true);
    try {
      const key = await SecureStore.getItemAsync('GEMINI_API_KEY');
      if (key) {
        setApiKey(key);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingKey(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert("Input Error", "Please enter a valid API Key.");
      return;
    }
    setSavingKey(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await SecureStore.setItemAsync('GEMINI_API_KEY', apiKey.trim());
      Alert.alert("Success", "Google Gemini API Key saved securely to device keychain.");
    } catch {
      Alert.alert("Error", "Failed to secure API Key.");
    } finally {
      setSavingKey(false);
    }
  };

  const handleClearApiKey = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await SecureStore.deleteItemAsync('GEMINI_API_KEY');
      setApiKey('');
      Alert.alert("Cleared", "API Key removed from secure storage.");
    } catch {
      Alert.alert("Error", "Failed to clear key.");
    }
  };

  const handleResetData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Reset App Database",
      "This will permanently delete all snippets, attachments, and files in local storage. This action is irreversible.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset Everything", 
          style: "destructive",
          onPress: async () => {
            try {
              const database = getDb();
              await database.execAsync('DELETE FROM snippets;');
              await database.execAsync('DELETE FROM attachments;');
              
              await fileHelper.deleteFile(fileHelper.SCREENSHOTS_DIR);
              await fileHelper.deleteFile(fileHelper.EXPORTS_DIR);
              await fileHelper.deleteFile(fileHelper.DOWNLOADS_DIR);

              await fileHelper.initFileSystem();
              await fileHelper.seedDefaultTemplates();

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Success", "All local application data reset successfully.");
              loadStats();
            } catch (e) {
              Alert.alert("Error", "Reset transaction failed.");
            }
          }
        }
      ]
    );
  };

  return {
    apiKey,
    setApiKey,
    loadingKey,
    savingKey,
    snippetCount,
    attachmentCount,
    attachmentSize,
    loadStats,
    handleSaveApiKey,
    handleClearApiKey,
    handleResetData
  };
}
