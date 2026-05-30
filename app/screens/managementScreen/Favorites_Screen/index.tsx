import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { 
  useTheme, 
  Text, 
  Card, 
  Input, 
  LanguageBadge, 
  TagBadge 
} from '../../_components';
import { getSnippets, toggleFavoriteSnippet } from '../../../../lib/db';
import { Snippet } from '../../../../lib/types';

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [favorites, setFavorites] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load only favorited snippets from database
  const loadFavorites = async () => {
    setLoading(true);
    const data = await getSnippets();
    const favs = data.filter(s => s.is_favorite);
    setFavorites(favs);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const handleToggleFavorite = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Favorite is always true when in this screen, so we toggling it to false
    await toggleFavoriteSnippet(id, false);
    // Instantly filter out of view
    setFavorites(prev => prev.filter((s: Snippet) => s.id !== id));
  };

  const filteredFavorites = favorites.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.language.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header bar */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Favorite Snippets</Text>
        <Ionicons name="heart" size={24} color={colors.accent} />
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <Input 
          placeholder="Search favorite code templates..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          iconName="search-outline"
        />
      </View>

      {/* Favorites List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredFavorites.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="heart-dislike-outline" size={48} color={colors.subtext} />
          <Text style={{ marginTop: 12, color: colors.subtext, textAlign: 'center' }}>
            {favorites.length === 0 
              ? "You haven't favorited any snippets yet. Star templates in the main dashboard to access them rapidly here!"
              : "No favorites matching your search query."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFavorites}
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
                  onPress={() => handleToggleFavorite(item.id)}
                  style={styles.favoriteIcon}
                >
                  <Ionicons 
                    name="star" 
                    size={20} 
                    color="#fbbf24" 
                  />
                </TouchableOpacity>
              </View>

              <LanguageBadge language={item.language} style={{ marginVertical: 8 }} />

              <View style={[styles.codePreview, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                <Text 
                  numberOfLines={2} 
                  style={styles.codeText}
                >
                  {item.code}
                </Text>
              </View>

              {item.tags.length > 0 && (
                <View style={styles.tagsFooter}>
                  {item.tags.slice(0, 3).map((tag: string) => (
                    <TagBadge key={tag} tag={tag} />
                  ))}
                </View>
              )}
            </Card>
          )}
        />
      )}
    </View>
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
    color: '#ffffff',
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
