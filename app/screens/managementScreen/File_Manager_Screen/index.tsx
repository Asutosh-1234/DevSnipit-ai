import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Image,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';

import { 
  useTheme, 
  Text, 
  Card, 
  Button, 
  Input,
  Header,
  CodeSyntaxHighlighter
} from '../../components';
import * as fileHelper from '../../../../lib/fileHelper';
import { FileItem } from '../../../../lib/types';

export default function FileManagerScreen() {
  const { colors } = useTheme();

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
    
    // If it's a screenshot, just show standard share or native view
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

  // Open move/copy controller
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header with quick creation toggle */}
      <View style={styles.headerBar}>
        <View>
          {currentSubFolder ? (
            <TouchableOpacity onPress={handleNavigateUp} style={styles.backBreadcrumb}>
              <Ionicons name="chevron-back" size={16} color={colors.primary} />
              <Text variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>
                DevSnippets / {currentSubFolder}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.headerSubtitle}>File Explorer</Text>
          )}
          <Text style={styles.headerTitle}>Local Storage</Text>
        </View>

        <TouchableOpacity 
          style={[styles.createFolderBtn, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}
          onPress={() => setNewFolderModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Directory List View */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : files.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="folder-open-outline" size={48} color={colors.subtext} />
          <Text style={{ marginTop: 12, color: colors.subtext, textAlign: 'center' }}>
            Empty Directory. Export snippets or attach files to populate this folder.
          </Text>
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={item => item.path}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <Card 
              onPress={() => item.isDirectory ? handleFolderTap(item.name) : handleFileTap(item)}
              style={styles.fileCard}
            >
              <View style={styles.fileRow}>
                {item.isDirectory ? (
                  <View style={[styles.iconFrame, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                    <Ionicons name="folder" size={26} color="#06b6d4" />
                  </View>
                ) : item.fileExtension?.toLowerCase() === 'png' ? (
                  <View style={[styles.iconFrame, { padding: 0 }]}>
                    <Image source={{ uri: item.path }} style={styles.thumbnail} />
                  </View>
                ) : (
                  <View style={[styles.iconFrame, { backgroundColor: 'rgba(124, 58, 237, 0.15)' }]}>
                    <Ionicons 
                      name={item.fileExtension?.toLowerCase() === 'json' ? "logo-javascript" : "document-text"} 
                      size={24} 
                      color={colors.accent} 
                    />
                  </View>
                )}

                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
                  {item.isDirectory ? (
                    <Text variant="caption">Directory</Text>
                  ) : (
                    <Text variant="caption">
                      {(item.size / 1024).toFixed(1)} KB • {item.fileExtension?.toUpperCase()}
                    </Text>
                  )}
                </View>

                {/* Actions Hub */}
                <View style={styles.actionsHub}>
                  {!item.isDirectory && (
                    <TouchableOpacity onPress={() => handleOpenMoveDialog(item)} style={styles.actionBtn}>
                      <Ionicons name="arrow-redo-outline" size={18} color={colors.subtext} />
                    </TouchableOpacity>
                  )}
                  {!item.isDirectory && (
                    <TouchableOpacity onPress={() => handleShareFile(item.path)} style={styles.actionBtn}>
                      <Ionicons name="share-social-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDeleteFile(item)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
        />
      )}

      {/* 1. CODE FILE PREVIEW MODAL */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={previewModalVisible}
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <Header 
            title={previewFileName}
            showBack 
            onBackPress={() => setPreviewModalVisible(false)}
          />
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <CodeSyntaxHighlighter code={previewContent} language={previewLang} maxHeight={600} />
          </ScrollView>
        </View>
      </Modal>

      {/* 2. MOVE / COPY DIRECTORY DIALOG */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={moveModalVisible}
        onRequestClose={() => setMoveModalVisible(false)}
      >
        <View style={styles.backdrop}>
          <Card style={[styles.dialogCard, { backgroundColor: colors.cardBackground }]}>
            <Text variant="bold" style={{ fontSize: 18, marginBottom: 8 }}>Move File</Text>
            <Text variant="caption" style={{ marginBottom: 16 }}>
              Select target destination folder for: "{selectedFileForMove?.name}"
            </Text>
            
            <TouchableOpacity onPress={() => handleExecuteMove('')} style={[styles.dialogItem, { borderBottomColor: colors.border }]}>
              <Ionicons name="folder" size={20} color="#fbbf24" style={{ marginRight: 10 }} />
              <Text>Root Directory (DevSnippets/)</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleExecuteMove('exports')} style={[styles.dialogItem, { borderBottomColor: colors.border }]}>
              <Ionicons name="folder" size={20} color="#06b6d4" style={{ marginRight: 10 }} />
              <Text>Exports folder (exports/)</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleExecuteMove('screenshots')} style={[styles.dialogItem, { borderBottomColor: colors.border }]}>
              <Ionicons name="folder" size={20} color="#06b6d4" style={{ marginRight: 10 }} />
              <Text>Screenshots folder (screenshots/)</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleExecuteMove('downloads')} style={[styles.dialogItem, { borderBottomColor: colors.border }]}>
              <Ionicons name="folder" size={20} color="#06b6d4" style={{ marginRight: 10 }} />
              <Text>Downloads folder (downloads/)</Text>
            </TouchableOpacity>

            <Button title="Cancel" onPress={() => setMoveModalVisible(false)} variant="secondary" style={{ marginTop: 16 }} />
          </Card>
        </View>
      </Modal>

      {/* 3. CREATE FOLDER DIALOG */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={newFolderModalVisible}
        onRequestClose={() => setNewFolderModalVisible(false)}
      >
        <View style={styles.backdrop}>
          <Card style={[styles.dialogCard, { backgroundColor: colors.cardBackground }]}>
            <Text variant="bold" style={{ fontSize: 18, marginBottom: 8 }}>New Folder</Text>
            <Input 
              placeholder="e.g. scripts"
              value={newFolderName}
              onChangeText={setNewFolderName}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <Button 
                title="Cancel" 
                onPress={() => {
                  setNewFolderModalVisible(false);
                  setNewFolderName('');
                }} 
                variant="ghost" 
                style={{ marginRight: 12 }} 
              />
              <Button 
                title="Create" 
                onPress={handleCreateNewFolder} 
              />
            </View>
          </Card>
        </View>
      </Modal>

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
  headerSubtitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
    color: '#06b6d4',
  },
  backBreadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  createFolderBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  fileCard: {
    padding: 10,
    marginBottom: 8,
    borderRadius: 12,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconFrame: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionsHub: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 2,
  },
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dialogCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 0,
  },
  dialogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  }
});
