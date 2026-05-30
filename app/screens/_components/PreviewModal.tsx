import React from 'react';
import { StyleSheet, View, Modal, ScrollView } from 'react-native';
import { useTheme } from './Theme';
import { Header } from './Header';
import { CodeSyntaxHighlighter } from './CodeSyntaxHighlighter';

interface PreviewModalProps {
  visible: boolean;
  onClose: () => void;
  fileName: string;
  content: string;
  language: string;
}

export function PreviewModal({
  visible,
  onClose,
  fileName,
  content,
  language
}: PreviewModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <Header 
          title={fileName}
          showBack 
          onBackPress={onClose}
        />
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <CodeSyntaxHighlighter code={content} language={language} maxHeight={600} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  }
});
