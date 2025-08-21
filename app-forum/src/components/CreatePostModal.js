// src/components/CreatePostModal.js

import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthContext from '../context/AuthContext';

const CreatePostModal = ({ isVisible, onClose, onPostCreated }) => {
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPostImageUri, setNewPostImageUri] = useState(null);
  const { signOut } = useContext(AuthContext);

  const pickPostImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewPostImageUri(result.assets[0].uri);
    }
  };

  const resetForm = () => {
    setNewPostTitle('');
    setNewPostContent('');
    setNewPostImageUri(null);
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      Alert.alert('Erro', 'Título e conteúdo do post não podem ser vazios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('Erro de Autenticação', 'Você precisa estar logado para criar um post.');
        signOut();
        setIsSubmitting(false);
        return;
      }

      let imageUrlToSave = null;
      if (newPostImageUri) {
        const formData = new FormData();
        const filename = newPostImageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';

        if (Platform.OS === 'web') {
            const response = await fetch(newPostImageUri);
            const blob = await response.blob();
            formData.append('postImage', blob, filename);
        } else {
            const postImageFile = {
                uri: newPostImageUri,
                name: filename,
                type: type,
            };
            formData.append("postImage", postImageFile);
        }

        try {
          const uploadResponse = await api.post('/upload/post-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${userToken}` },
          });
          imageUrlToSave = uploadResponse.data.imageUrl;
        } catch (uploadError) {
          console.error('Erro ao fazer upload da imagem do post:', JSON.stringify(uploadError.response?.data) || uploadError.message);
          Alert.alert('Erro de Upload', 'Não foi possível fazer upload da imagem do post.');
          setIsSubmitting(false);
          return;
        }
      }

      await api.post('/posts', {
        title: newPostTitle,
        content: newPostContent,
        image_url: imageUrlToSave,
      }, { headers: { Authorization: `Bearer ${userToken}` } });

      Alert.alert('Sucesso', 'Post criado com sucesso!');
      resetForm();
      onPostCreated(); // Callback para atualizar a lista de posts
      onClose(); // Fecha o modal
    } catch (error) {
      console.error('Erro ao criar post:', JSON.stringify(error.response?.data) || error.message);
      Alert.alert('Erro ao Criar Post', error.response?.data?.message || 'Ocorreu um erro ao criar o post.');
      if (error.response?.status === 401 || error.response?.status === 403) {
        signOut();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {
        onClose();
        resetForm();
      }}
    >
      <TouchableWithoutFeedback onPress={() => { onClose(); resetForm(); }}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.createPostContainer}>
              <Text style={styles.modalTitle}>Criar Novo Post</Text>
              <TextInput
                style={styles.input}
                placeholder="Título do seu post"
                value={newPostTitle}
                onChangeText={setNewPostTitle}
              />
              <TextInput
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                placeholder="O que você quer compartilhar?"
                value={newPostContent}
                onChangeText={setNewPostContent}
                multiline
              />
              <TouchableOpacity onPress={pickPostImage} style={styles.imagePickerButton}>
                <Ionicons name="image-outline" size={24} color="#0c411fff" />
                <Text style={styles.imagePickerButtonText}>Adicionar Imagem</Text>
              </TouchableOpacity>
              {newPostImageUri && <Image source={{ uri: newPostImageUri }} style={styles.previewImage} />}
              <Button
                title={isSubmitting ? 'Publicando...' : 'Criar Post'}
                onPress={handleCreatePost}
                disabled={isSubmitting}
                color="#116530"
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  createPostContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9f5ff',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    marginBottom: 10,
  },
  imagePickerButtonText: {
    marginLeft: 10,
    color: '#116530',
    fontWeight: 'bold',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: 10,
  },
});

export default CreatePostModal;