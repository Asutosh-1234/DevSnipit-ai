import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getSnippets, toggleFavoriteSnippet } from '../../../lib/db';
import { Snippet } from '../../../lib/types';
import {
  Card,
  Input,
  LanguageBadge,
  TagBadge,
  Text,
  useTheme
} from '../_components';

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');

  // Load snippets from SQLite
  const loadSnippets = async () => {
    setLoading(true);
    const data = await getSnippets();
    setSnippets(data);
    setLoading(false);
  };

  // Reload snippets when screen is focused (handles returning from Create/Edit)
  useFocusEffect(
    useCallback(() => {
      loadSnippets();
    }, [])
  );

  // Favorite toggle straight from card
  const handleToggleFavorite = async (id: string, currentFavState: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleFavoriteSnippet(id, !currentFavState);
    // Optimistic UI update
    setSnippets(prev =>
      prev.map(s => s.id === id ? { ...s, is_favorite: !currentFavState } : s)
    );
  };

  // Get unique tags from all snippets
  const getUniqueTags = () => {
    const tags = new Set<string>();
    snippets.forEach(s => s.tags.forEach(t => tags.add(t)));
    return ['All', ...Array.from(tags)];
  };

  // Filter logic
  const filteredSnippets = snippets.filter(s => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLanguage =
      selectedLanguage === 'All' ||
      s.language.trim().toLowerCase() === selectedLanguage.trim().toLowerCase();

    const matchesTag =
      selectedTag === 'All' ||
      s.tags.includes(selectedTag);

    return matchesSearch && matchesLanguage && matchesTag;
  });

  const uniqueLanguages = ['All', 'JavaScript', 'TypeScript', 'Python', 'HTML', 'CSS', 'Rust', 'Go', 'JSON', 'SQL', 'Bash', 'C++', 'Java'];
  const uniqueTags = getUniqueTags();

  return (
    <SafeAreaProvider>
      <View style={[styles.container, { backgroundColor: colors.background }]}>

        {/* Top Header Section */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.headerSubtitle}>Offline Workspace</Text>
            <Text style={styles.headerTitle}>DevSnippets AI</Text>
          </View>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/screens/managementScreen/Create_Snippet_Screen' as any);
            }}
          >
            <Ionicons name="add" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Database Quick Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statsCard}>
            <Text variant="caption">Total Snippets</Text>
            <Text style={[styles.statsNumber, { color: colors.primary }]}>{snippets.length}</Text>
          </Card>
          <Card style={styles.statsCard}>
            <Text variant="caption">Favorites</Text>
            <Text style={[styles.statsNumber, { color: colors.accent }]}>
              {snippets.filter(s => s.is_favorite).length}
            </Text>
          </Card>
        </View>

        {/* Search Input Bar */}
        <View style={{ paddingHorizontal: 16 }}>
          <Input
            placeholder="Search title, description or code..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            iconName="search-outline"
          />
        </View>

        {/* Horizontal Language Filter Slider */}
        <View style={styles.filterSection}>
          <Text variant="caption" style={styles.sectionLabel}>Filter by Language</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {uniqueLanguages.map(lang => {
              const isSelected = selectedLanguage === lang;
              return (
                <TouchableOpacity
                  key={lang}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedLanguage(lang);
                  }}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected ? colors.primaryLight : colors.cardBackground,
                      borderColor: isSelected ? colors.primary : colors.border
                    }
                  ]}
                >
                  <Text
                    variant="caption"
                    style={{
                      color: isSelected ? colors.primary : colors.text,
                      fontWeight: isSelected ? '700' : '500'
                    }}
                  >
                    {lang}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Horizontal Tags Filter Slider */}
        {uniqueTags.length > 1 && (
          <View style={[styles.filterSection, { marginTop: 4, marginBottom: 12 }]}>
            <Text variant="caption" style={styles.sectionLabel}>Filter by Tags</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {uniqueTags.map(tag => {
                const isSelected = selectedTag === tag;
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedTag(tag);
                    }}
                    style={[
                      styles.tagChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.cardBackground,
                        borderColor: isSelected ? colors.primary : colors.border
                      }
                    ]}
                  >
                    <Text
                      variant="caption"
                      style={{
                        color: isSelected ? '#111827' : colors.text,
                        fontWeight: isSelected ? '700' : '500'
                      }}
                    >
                      {tag === 'All' ? 'All Tags' : `#${tag}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Snippet Lists */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredSnippets.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="code-working" size={48} color={colors.subtext} />
            <Text style={{ marginTop: 12, color: colors.subtext, textAlign: 'center' }}>
              No snippets found matching your filters.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredSnippets}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <Card
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: '/screens/managementScreen/Snippet_Details_Screen',
                    params: { id: item.id }
                  } as any);
                }}
                style={styles.snippetCard}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.snippetTitle} numberOfLines={1}>{item.title}</Text>
                  <TouchableOpacity
                    onPress={() => handleToggleFavorite(item.id, item.is_favorite)}
                    style={styles.favoriteIcon}
                  >
                    <Ionicons
                      name={item.is_favorite ? "star" : "star-outline"}
                      size={20}
                      color={item.is_favorite ? "#fbbf24" : colors.subtext}
                    />
                  </TouchableOpacity>
                </View>

                <LanguageBadge language={item.language} style={{ marginVertical: 8 }} />

                {/* Monospace Code Preview Box */}
                <View style={[styles.codePreview, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                  <Text
                    numberOfLines={2}
                    style={styles.codeText}
                  >
                    {item.code}
                  </Text>
                </View>

                {/* Snippet Tags Footer */}
                {item.tags.length > 0 && (
                  <View style={styles.tagsFooter}>
                    {item.tags.slice(0, 3).map(tag => (
                      <TagBadge key={tag} tag={tag} />
                    ))}
                    {item.tags.length > 3 && (
                      <Text variant="caption" style={{ alignSelf: 'center', marginLeft: 4 }}>
                        +{item.tags.length - 3} more
                      </Text>
                    )}
                  </View>
                )}
              </Card>
            )}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
    color: '#06b6d4',
  },
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  statsCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 0,
  },
  statsNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  filterSection: {
    marginVertical: 4,
  },
  sectionLabel: {
    paddingHorizontal: 16,
    marginBottom: 6,
    fontWeight: '600',
  },
  horizontalScroll: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  tagChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  snippetCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snippetTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  favoriteIcon: {
    padding: 4,
  },
  codePreview: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 4,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    color: '#94a3b8',
  },
  tagsFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  }
});
