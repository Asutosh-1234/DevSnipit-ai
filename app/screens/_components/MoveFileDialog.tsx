import React from 'react';
import { StyleSheet, View, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './Theme';
import { Card } from './Card';
import { Text } from './Text';
import { Button } from './Button';

interface MoveFileDialogProps {
  visible: boolean;
  onClose: () => void;
  fileName: string;
  onExecuteMove: (destFolder: string) => void;
}

export function MoveFileDialog({
  visible,
  onClose,
  fileName,
  onExecuteMove
}: MoveFileDialogProps) {
  const { colors } = useTheme();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Card style={[styles.dialogCard, { backgroundColor: colors.cardBackground }]}>
          <Text variant="bold" style={{ fontSize: 18, marginBottom: 8 }}>Move File</Text>
          <Text variant="caption" style={{ marginBottom: 16 }}>
            Select target destination folder for: "{fileName}"
          </Text>
          
          <TouchableOpacity onPress={() => onExecuteMove('')} style={[styles.dialogItem, { borderBottomColor: colors.border }]}>
            <Ionicons name="folder" size={20} color="#fbbf24" style={{ marginRight: 10 }} />
            <Text style={{ color: colors.text }}>Root Directory (DevSnippets/)</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onExecuteMove('exports')} style={[styles.dialogItem, { borderBottomColor: colors.border }]}>
            <Ionicons name="folder" size={20} color="#06b6d4" style={{ marginRight: 10 }} />
            <Text style={{ color: colors.text }}>Exports folder (exports/)</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onExecuteMove('screenshots')} style={[styles.dialogItem, { borderBottomColor: colors.border }]}>
            <Ionicons name="folder" size={20} color="#06b6d4" style={{ marginRight: 10 }} />
            <Text style={{ color: colors.text }}>Screenshots folder (screenshots/)</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onExecuteMove('downloads')} style={[styles.dialogItem, { borderBottomColor: colors.border }]}>
            <Ionicons name="folder" size={20} color="#06b6d4" style={{ marginRight: 10 }} />
            <Text style={{ color: colors.text }}>Downloads folder (downloads/)</Text>
          </TouchableOpacity>

          <Button title="Cancel" onPress={onClose} variant="secondary" style={{ marginTop: 16 }} />
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
