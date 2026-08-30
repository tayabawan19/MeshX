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
        <X size={22} color="#FFFFFF" />
      </TouchableOpacity>
      {activeMediaViewer.title && <Text style={styles.title}>{activeMediaViewer.title}</Text>}

      <Image source={{ uri: activeMediaViewer.url }} style={styles.image} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1F22', justifyContent: 'center', alignItems: 'center' },
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    position: 'absolute',
    top: 54,
    left: 20,
    color: '#F2F3F5',
    fontSize: 15,
    fontWeight: '600',
  },
  image: { width: '100%', height: '80%' },
});
