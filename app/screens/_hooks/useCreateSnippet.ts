import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import { 
  insertSnippet, 
  getSnippetById, 
  updateSnippet,
  getAttachments,
  insertAttachment,
  deleteAttachment
} from '../../../lib/db';
import { saveScreenshot } from '../../../lib/fileHelper';
import { Snippet, Attachment } from '../../../lib/types';

export function useCreateSnippet(editId?: string) {
  const router = useRouter();

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
      const snippetId = isEditMode ? editId! : `snippet_${Date.now()}`;
      const now = new Date().toISOString();

      const snippetData: Snippet = {
        id: snippetId,
        title: title.trim(),
        code: code,
        language: language,
        tags: tags,
        is_favorite: false, // Default false, will be overwritten if in EditMode
        created_at: now,
        updated_at: now
      };

      if (isEditMode) {
        // Load original snippet to keep its favorited state & created_at
        const orig = await getSnippetById(editId!);
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
        // Image was removed
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

  return {
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
  };
}
