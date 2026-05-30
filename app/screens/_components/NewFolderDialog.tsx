import React from 'react';
import { StyleSheet, View, Modal } from 'react-native';
import { useTheme } from './Theme';
import { Card } from './Card';
import { Text } from './Text';
import { Input } from './Input';
import { Button } from './Button';

interface NewFolderDialogProps {
  visible: boolean;
  onClose: () => void;
  newFolderName: string;
  setNewFolderName: (val: string) => void;
  onCreate: () => void;
}

export function NewFolderDialog({
  visible,
  onClose,
  newFolderName,
  setNewFolderName,
  onCreate
}: NewFolderDialogProps) {
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
          <Text variant="bold" style={{ fontSize: 18, marginBottom: 8 }}>New Folder</Text>
          <Input 
            placeholder="e.g. scripts"
            value={newFolderName}
            onChangeText={setNewFolderName}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
            <Button 
              title="Cancel" 
              onPress={onClose} 
              variant="ghost" 
              style={{ marginRight: 12 }} 
            />
            <Button 
              title="Create" 
              onPress={onCreate} 
            />
          </View>
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
  }
});
