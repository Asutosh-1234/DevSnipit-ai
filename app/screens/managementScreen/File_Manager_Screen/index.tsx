import React from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { 
  useTheme, 
  Text, 
  Card, 
  NewFolderDialog,
  MoveFileDialog,
  PreviewModal
} from '../../_components';
import { useFileManager } from '../../_hooks/useFileManager';

export default function FileManagerScreen() {
  const { colors } = useTheme();

  // Bind states & actions using our custom hook
  const {
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
    handleCreateNewFolder
  } = useFileManager();

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
      <PreviewModal 
        visible={previewModalVisible}
        onClose={() => setPreviewModalVisible(false)}
        fileName={previewFileName}
        content={previewContent}
        language={previewLang}
      />

      {/* 2. MOVE / COPY DIRECTORY DIALOG */}
      <MoveFileDialog 
        visible={moveModalVisible}
        onClose={() => setMoveModalVisible(false)}
        fileName={selectedFileForMove?.name || ''}
        onExecuteMove={handleExecuteMove}
      />

      {/* 3. CREATE FOLDER DIALOG */}
      <NewFolderDialog 
        visible={newFolderModalVisible}
        onClose={() => {
          setNewFolderModalVisible(false);
          setNewFolderName('');
        }}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        onCreate={handleCreateNewFolder}
      />

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
  }
});
