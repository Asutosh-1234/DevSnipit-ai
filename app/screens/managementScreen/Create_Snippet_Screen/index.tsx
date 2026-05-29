import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { 
  useTheme, 
  Text, 
  Header, 
  Input, 
  Button, 
  TagBadge 
} from '../../components';
import { 
  insertSnippet, 
  getSnippetById, 
  updateSnippet,
  getAttachments,
  insertAttachment,
  deleteAttachment
} from '../../../../lib/db';
import { saveScreenshot } from '../../../../lib/fileHelper';
import { Snippet, Attachment } from '../../../../lib/types';

export default function CreateSnippetScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const editId = params.id as string; // Check if we are in Edit Mode

  // Form states
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('JavaScript');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  
  // Edit mode tracking
  const [existingAttachment, setExistingAttachment] = useState<Attachment | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editId) {
      setIsEditMode(true);
      loadSnippetForEditing(editId);
    }
  }, [editId]);

  const loadSnippetForEditing = async (id: string) => {
    const snip = await getSnippetById(id);
    if (snip) {
      setTitle(snip.title);
      setCode(snip.code);
      setLanguage(snip.language);
      setTags(snip.tags);
      
      // Load attachments
      const attachs = await getAttachments(id);
      if (attachs && attachs.length > 0) {
        setExistingAttachment(attachs[0]);
        setAttachedImage(attachs[0].file_path);
      }
    }
  };

  const handleAddTag = () => {
    const cleanTag = tagInput.trim().toLowerCase().replace(/#/g, '');
    if (!cleanTag) return;
    
    if (tags.includes(cleanTag)) {
      setTagInput('');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTags([...tags, cleanTag]);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Allow access to photos to attach screenshots.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAttachedImage(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttachedImage(null);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Please enter a snippet title.");
      return;
    }
    if (!code.trim()) {
      Alert.alert("Validation Error", "Please enter some code content.");
      return;
    }

    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const snippetId = isEditMode ? editId : `snippet_${Date.now()}`;
      const now = new Date().toISOString();

      const snippetData: Snippet = {
        id: snippetId,
        title: title.trim(),
        code: code,
        language: language,
        tags: tags,
        is_favorite: isEditMode ? false : false, // Maintain favorite or default false
        created_at: isEditMode ? now : now, // Simplification
        updated_at: now
      };

      if (isEditMode) {
        // Load original snippet to keep its favorited state
        const orig = await getSnippetById(editId);
        if (orig) {
          snippetData.is_favorite = orig.is_favorite;
          snippetData.created_at = orig.created_at;
        }
        await updateSnippet(snippetData);
      } else {
        await insertSnippet(snippetData);
      }

      // Handle Attachment
      if (attachedImage) {
        // If image has changed or is new
        const isNewImage = !existingAttachment || existingAttachment.file_path !== attachedImage;
        if (isNewImage && attachedImage.startsWith('file://') === false) {
          // If it's a temporary device picker path
          const savedFile = await saveScreenshot(attachedImage);
          
          // Delete old attachment from DB if exists
          if (existingAttachment) {
            await deleteAttachment(existingAttachment.id);
          }

          // Insert new attachment
          const newAttach: Attachment = {
            id: `attach_${Date.now()}`,
            snippet_id: snippetId,
            file_path: savedFile.uri,
            file_name: savedFile.name,
            file_type: 'screenshot',
            file_size: savedFile.size,
            created_at: now
          };
          await insertAttachment(newAttach);
        }
      } else {
        // Image was removed in edit mode
        if (existingAttachment) {
          await deleteAttachment(existingAttachment.id);
        }
      }

      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "An error occurred while saving the snippet.");
    } finally {
      setSaving(false);
    }
  };

  const languages = ['JavaScript', 'TypeScript', 'Python', 'HTML', 'CSS', 'Rust', 'Go', 'JSON', 'SQL', 'Bash', 'C++', 'Java'];

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Header 
        title={isEditMode ? "Edit Snippet" : "Create Snippet"} 
        showBack 
        onBackPress={() => router.back()} 
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
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLanguage(lang);
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
  codeTextInput: {
    fontFamily: 'monospace',
    fontSize: 13,
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
