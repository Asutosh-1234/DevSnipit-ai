import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';

import * as fileHelper from '../../../lib/fileHelper';
import { FileItem } from '../../../lib/types';

export function useFileManager() {
  // Navigation states
  const [currentSubFolder, setCurrentSubFolder] = useState(''); // Empty string is root 'DevSnippets/'
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Preview modal states
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [previewLang, setPreviewLang] = useState('javascript');

  // Copy/Move modal states
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [selectedFileForMove, setSelectedFileForMove] = useState<FileItem | null>(null);

  // New folder modal states
  const [newFolderModalVisible, setNewFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    loadDirectoryFiles();
  }, [currentSubFolder]);

  const loadDirectoryFiles = async () => {
    setLoading(true);
    const data = await fileHelper.browseDirectory(currentSubFolder);
    setFiles(data);
    setLoading(false);
  };

  const handleFolderTap = (folderName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentSubFolder(currentSubFolder ? `${currentSubFolder}/${folderName}` : folderName);
  };

  const handleNavigateUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const parts = currentSubFolder.split('/');
    parts.pop();
    setCurrentSubFolder(parts.join('/'));
  };

  // Preview file action
  const handleFileTap = async (file: FileItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ext = file.fileExtension?.toLowerCase();
    
    // If it's a screenshot, just show standard share
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
      Alert.alert(
        file.name,
        `Image screenshot (${(file.size / 1024).toFixed(1)} KB)`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Share Screenshot", onPress: () => handleShareFile(file.path) }
        ]
      );
      return;
    }

    // Load and preview code files
    try {
      const content = await fileHelper.readFileContent(file.path);
      setPreviewFileName(file.name);
      setPreviewContent(content);
      
      let lang = 'javascript';
      if (ext === 'py') lang = 'python';
      else if (ext === 'json') lang = 'json';
      else if (ext === 'txt') lang = 'txt';
      
      setPreviewLang(lang);
      setPreviewModalVisible(true);
    } catch {
      Alert.alert("Error", "Could not read file contents.");
    }
  };

  const handleShareFile = async (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path);
      } else {
        Alert.alert("Sharing Unvailable", "Sharing is not supported on this platform.");
      }
    } catch (e) {
      Alert.alert("Error", "Could not share file.");
    }
  };

  const handleDeleteFile = (file: FileItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Delete Resource",
      `Are you sure you want to permanently delete "${file.name}"? This file will be removed from device storage.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Permanently", 
          style: "destructive",
          onPress: async () => {
            await fileHelper.deleteFile(file.path);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadDirectoryFiles();
          }
        }
      ]
    );
  };

  // Open move dialog
  const handleOpenMoveDialog = (file: FileItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFileForMove(file);
    setMoveModalVisible(true);
  };

  const handleExecuteMove = async (destFolder: string) => {
    if (!selectedFileForMove) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      const filename = selectedFileForMove.name;
      const targetDir = destFolder ? `${fileHelper.BASE_DIR}${destFolder}/` : fileHelper.BASE_DIR;
      const destPath = `${targetDir}${filename}`;

      await fileHelper.moveOrCopyFile(selectedFileForMove.path, destPath, 'move');
      setMoveModalVisible(false);
      setSelectedFileForMove(null);
      loadDirectoryFiles();
    } catch (e) {
      Alert.alert("Move Failed", "Cannot relocate file to the selected directory.");
    }
  };

  const handleCreateNewFolder = async () => {
    if (!newFolderName.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await fileHelper.createFolder(newFolderName.trim(), currentSubFolder);
      setNewFolderModalVisible(false);
      setNewFolderName('');
      loadDirectoryFiles();
    } catch {
      Alert.alert("Folder Error", "Failed to create directory.");
    }
  };

  return {
    currentSubFolder,
    files,
    loading,
    previewModalVisible,
    setPreviewModalVisible,
    previewFileName,
    previewContent,
    previewLang,
    moveModalVisible,
    setMoveModalVisible,
    selectedFileForMove,
    newFolderModalVisible,
    setNewFolderModalVisible,
    newFolderName,
    setNewFolderName,
    handleFolderTap,
    handleNavigateUp,
    handleFileTap,
    handleShareFile,
    handleDeleteFile,
    handleOpenMoveDialog,
    handleExecuteMove,
    handleCreateNewFolder,
    loadDirectoryFiles
  };
}
