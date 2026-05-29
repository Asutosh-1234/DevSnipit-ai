import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme, Text } from './screens/components';
import { initDb } from '../lib/db';
import { seedDefaultTemplates } from '../lib/fileHelper';

// Import screens
import HomeScreen from './screens/managementScreen/index';
import FavoritesScreen from './screens/managementScreen/Favorites_Screen/index';
import FileManagerScreen from './screens/managementScreen/File_Manager_Screen/index';
import SettingsScreen from './screens/managementScreen/Settings_Screen/index';

export default function Index() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    const setupApp = async () => {
      try {
        await initDb();
        await seedDefaultTemplates();
        setDbInitialized(true);
      } catch (err) {
        console.error("App startup database initialization error:", err);
      }
    };
    setupApp();
  }, []);

  const handleTabPress = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(index);
  };

  const renderActiveScreen = () => {
    if (!dbInitialized) {
      return (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.subtext }}>Initializing DevSnippets AI...</Text>
        </View>
      );
    }
    switch (activeTab) {
      case 0:
        return <HomeScreen />;
      case 1:
        return <FavoritesScreen />;
      case 2:
        return <FileManagerScreen />;
      case 3:
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.screenWrapper}>
        {renderActiveScreen()}
      </View>
      
      {/* Bottom Floating Glassmorphic Tab Bar */}
      <View style={[
        styles.tabBar, 
        { 
          backgroundColor: colors.cardBackground, 
          borderTopColor: colors.border,
          shadowColor: colors.text
        }
      ]}>
        <TouchableOpacity 
          style={styles.tabButton} 
          onPress={() => handleTabPress(0)}
        >
          <Ionicons 
            name={activeTab === 0 ? "code-slash" : "code-slash-outline"} 
            size={22} 
            color={activeTab === 0 ? colors.primary : colors.subtext} 
          />
          <Text style={[
            styles.tabText, 
            { color: activeTab === 0 ? colors.primary : colors.subtext, fontWeight: activeTab === 0 ? '600' : '400' }
          ]}>
            Snippets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabButton} 
          onPress={() => handleTabPress(1)}
        >
          <Ionicons 
            name={activeTab === 1 ? "heart" : "heart-outline"} 
            size={22} 
            color={activeTab === 1 ? colors.primary : colors.subtext} 
          />
          <Text style={[
            styles.tabText, 
            { color: activeTab === 1 ? colors.primary : colors.subtext, fontWeight: activeTab === 1 ? '600' : '400' }
          ]}>
            Favorites
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabButton} 
          onPress={() => handleTabPress(2)}
        >
          <Ionicons 
            name={activeTab === 2 ? "folder-open" : "folder-open-outline"} 
            size={22} 
            color={activeTab === 2 ? colors.primary : colors.subtext} 
          />
          <Text style={[
            styles.tabText, 
            { color: activeTab === 2 ? colors.primary : colors.subtext, fontWeight: activeTab === 2 ? '600' : '400' }
          ]}>
            Explorer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabButton} 
          onPress={() => handleTabPress(3)}
        >
          <Ionicons 
            name={activeTab === 3 ? "settings" : "settings-outline"} 
            size={22} 
            color={activeTab === 3 ? colors.primary : colors.subtext} 
          />
          <Text style={[
            styles.tabText, 
            { color: activeTab === 3 ? colors.primary : colors.subtext, fontWeight: activeTab === 3 ? '600' : '400' }
          ]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 76 : 64,
    borderTopWidth: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 14 : 4,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingTop: 8,
  },
  tabText: {
    fontSize: 10,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});