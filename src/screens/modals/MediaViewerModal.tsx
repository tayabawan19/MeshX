import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { useChatStore } from '../../store/useChatStore';

export const MediaViewerModal: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { activeMediaViewer, closeMediaViewer } = useChatStore();

  if (!activeMediaViewer) return null;

  const handleClose = () => {
    closeMediaViewer();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
        <X size={28} color="#FFFFFF" />
      </TouchableOpacity>
      {activeMediaViewer.title && <Text style={styles.title}>{activeMediaViewer.title}</Text>}

      <Image source={{ uri: activeMediaViewer.url }} style={styles.image} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 48, right: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  title: { position: 'absolute', top: 52, left: 20, color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  image: { width: '100%', height: '80%' },
});
