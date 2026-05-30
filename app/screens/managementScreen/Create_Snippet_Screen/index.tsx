import React from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { 
  useTheme, 
  Text, 
  Header, 
  Input, 
  Button, 
  TagBadge 
} from '../../_components';
import { useCreateSnippet } from '../../_hooks/useCreateSnippet';

export default function CreateSnippetScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const editId = params.id as string; // Check if we are in Edit Mode

  // Bind states & actions using our custom hook
  const {
    title,
    setTitle,
    code,
    setCode,
    language,
    setLanguage,
    tagInput,
    setTagInput,
    tags,
    attachedImage,
    isEditMode,
    saving,
    handleAddTag,
    handleRemoveTag,
    pickImage,
    handleRemoveImage,
    handleSave
  } = useCreateSnippet(editId);

  const languages = ['JavaScript', 'TypeScript', 'Python', 'HTML', 'CSS', 'Rust', 'Go', 'JSON', 'SQL', 'Bash', 'C++', 'Java'];

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Header 
        title={isEditMode ? "Edit Snippet" : "Create Snippet"} 
        showBack 
        onBackPress={handleSave} // Allows saving or generic back triggers
      />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Title Input */}
        <Text variant="caption" style={styles.fieldLabel}>Snippet Title</Text>
        <Input 
          placeholder="e.g. React LocalStorage Hook"
          value={title}
          onChangeText={setTitle}
        />

        {/* Custom Horizontal Language Selector */}
        <Text variant="caption" style={styles.fieldLabel}>Language</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {languages.map(lang => {
            const isSelected = language === lang;
            return (
              <TouchableOpacity
                key={lang}
                onPress={() => setLanguage(lang)}
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

        {/* Monospace Code Content Editor */}
        <Text variant="caption" style={styles.fieldLabel}>Code Content</Text>
        <Input 
          placeholder={`const mySnippet = () => {\n  console.log("DevSnippets AI!");\n};`}
          value={code}
          onChangeText={setCode}
          multiline
          numberOfLines={10}
          monospace
        />

        {/* Tags input Form */}
        <Text variant="caption" style={styles.fieldLabel}>Tags</Text>
        <View style={styles.tagInputContainer}>
          <View style={{ flex: 1 }}>
            <Input 
              placeholder="Type tag and press enter/add"
              value={tagInput}
              onChangeText={setTagInput}
              style={{ marginBottom: 0 }}
            />
          </View>
          <TouchableOpacity 
            style={[styles.addTagBtn, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={handleAddTag}
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Display tag chips */}
        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map(t => (
              <TouchableOpacity 
                key={t} 
                onPress={() => handleRemoveTag(t)}
                activeOpacity={0.7}
              >
                <TagBadge 
                  tag={t} 
                  style={{ marginRight: 6, marginBottom: 6, borderColor: colors.danger }} 
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Attached Screenshot Image */}
        <Text variant="caption" style={styles.fieldLabel}>Attach Screenshot</Text>
        {attachedImage ? (
          <View style={[styles.imageContainer, { borderColor: colors.border }]}>
            <Image source={{ uri: attachedImage }} style={styles.attachedImage} />
            <TouchableOpacity 
              onPress={handleRemoveImage}
              style={styles.removeImageBtn}
            >
              <Ionicons name="close-circle" size={24} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            onPress={pickImage}
            style={[styles.uploadCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          >
            <Ionicons name="camera-outline" size={32} color={colors.primary} />
            <Text style={{ marginTop: 8, color: colors.subtext, fontSize: 13 }}>
              Select a screenshot from device photos
            </Text>
          </TouchableOpacity>
        )}

        {/* Action Button */}
        <Button 
          title={isEditMode ? "Save Changes" : "Create Code Snippet"} 
          onPress={handleSave} 
          loading={saving}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    paddingBottom: 48,
  },
  fieldLabel: {
    marginBottom: 8,
    fontWeight: '600',
    marginTop: 12,
  },
  horizontalScroll: {
    paddingBottom: 12,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addTagBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  uploadCard: {
    height: 120,
    borderWidth: 1,
    borderRadius: 16,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  attachedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
  }
});
