import React, { useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Linking
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { 
  useTheme, 
  Text, 
  Card, 
  Button, 
  Input 
} from '../../_components';
import { useSettings } from '../../_hooks/useSettings';

export default function SettingsScreen() {
  const { theme, colors, setTheme } = useTheme();

  // Bind states & actions using our custom hook
  const {
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
  } = useSettings();

  // Reload statistics when Settings screen gets focus
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.headerTitle}>Application Settings</Text>

      {/* 1. VISUAL THEME PREFERENCES SECTION */}
      <Text variant="bold" style={styles.sectionHeading}>Theme & Preferences</Text>
      <Card style={styles.card}>
        <Text variant="caption" style={{ marginBottom: 12 }}>
          Select custom developer interface theme colorways.
        </Text>
        
        <View style={styles.themeGrid}>
          <TouchableOpacity 
            style={[
              styles.themeBtn, 
              { 
                backgroundColor: colors.inputBackground, 
                borderColor: theme === 'dark' ? colors.primary : colors.border 
              }
            ]}
            onPress={() => setTheme('dark')}
          >
            <Ionicons name="moon-outline" size={18} color={theme === 'dark' ? colors.primary : colors.text} />
            <Text variant="caption" style={[styles.themeBtnText, { color: theme === 'dark' ? colors.primary : colors.text }]}>
              Modern Dark
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.themeBtn, 
              { 
                backgroundColor: colors.inputBackground, 
                borderColor: theme === 'amoled' ? colors.primary : colors.border 
              }
            ]}
            onPress={() => setTheme('amoled')}
          >
            <Ionicons name="contrast-outline" size={18} color={theme === 'amoled' ? colors.primary : colors.text} />
            <Text variant="caption" style={[styles.themeBtnText, { color: theme === 'amoled' ? colors.primary : colors.text }]}>
              Amoled Black
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.themeBtn, 
              { 
                backgroundColor: colors.inputBackground, 
                borderColor: theme === 'light' ? colors.primary : colors.border 
              }
            ]}
            onPress={() => setTheme('light')}
          >
            <Ionicons name="sunny-outline" size={18} color={theme === 'light' ? colors.primary : colors.text} />
            <Text variant="caption" style={[styles.themeBtnText, { color: theme === 'light' ? colors.primary : colors.text }]}>
              Light Mode
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* 2. GEMINI AI SECURE TOKEN KEYCHAIN SECTION */}
      <Text variant="bold" style={styles.sectionHeading}>Google Gemini AI Keys</Text>
      <Card style={styles.card}>
        <Text variant="caption" style={{ marginBottom: 10 }}>
          Input your Google Gemini API Key to enable offline-first code explanations, optimization hints, and documentation generation.
        </Text>
        <TouchableOpacity 
          onPress={() => Linking.openURL('https://aistudio.google.com/')}
          style={styles.keyLink}
        >
          <Ionicons name="help-circle-outline" size={16} color={colors.primary} />
          <Text variant="caption" style={{ color: colors.primary, fontWeight: '600', marginLeft: 4 }}>
            Get a free Gemini API Key from Google AI Studio
          </Text>
        </TouchableOpacity>

        {loadingKey ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
        ) : (
          <View style={{ marginTop: 12 }}>
            <Input 
              placeholder="AIzaSy..."
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry
              iconName="key-outline"
            />
            
            <View style={styles.btnRow}>
              <Button 
                title="Save Key" 
                onPress={handleSaveApiKey} 
                loading={savingKey}
                style={{ flex: 1, marginRight: 8 }}
              />
              {apiKey ? (
                <Button 
                  title="Clear" 
                  onPress={handleClearApiKey} 
                  variant="secondary"
                  style={{ width: 80 }}
                />
              ) : null}
            </View>
          </View>
        )}
      </Card>

      {/* 3. METRICS AND STATISTICS SECTION */}
      <Text variant="bold" style={styles.sectionHeading}>Storage Statistics</Text>
      <Card style={styles.card}>
        <View style={[styles.statRow, { borderBottomColor: colors.border }]}>
          <Text variant="body" style={{ color: colors.text }}>Total Saved Snippets</Text>
          <Text style={{ fontWeight: '700', color: colors.primary }}>{snippetCount}</Text>
        </View>
        <View style={[styles.statRow, { borderBottomColor: colors.border }]}>
          <Text variant="body" style={{ color: colors.text }}>Total Linked Media Files</Text>
          <Text style={{ fontWeight: '700', color: colors.accent }}>{attachmentCount}</Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="body" style={{ color: colors.text }}>Total File Space Used</Text>
          <Text style={{ fontWeight: '700', color: colors.success }}>{formatSize(attachmentSize)}</Text>
        </View>
      </Card>

      {/* 4. DANGER ZONE RESET SECTION */}
      <Text variant="bold" style={[styles.sectionHeading, { color: colors.danger }]}>Danger Zone</Text>
      <Card style={[styles.card, { borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
        <Text variant="caption" style={{ marginBottom: 12 }}>
          Purge memory frames, and clean local offline SQLite relational databases permanently.
        </Text>
        <Button 
          title="Reset Application Workspace" 
          onPress={handleResetData}
          variant="danger"
          iconName="trash-outline"
        />
      </Card>

      <Text variant="caption" style={styles.footerText}>
        DevSnippets AI v1.0.0 • Offline-First Mobile Snippet Manager
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 48,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 16,
  },
  card: {
    marginBottom: 12,
    borderRadius: 16,
  },
  themeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  themeBtn: {
    flex: 1,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  themeBtnText: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '600',
  },
  keyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 16,
  }
});
