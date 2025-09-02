// src/components/EditPostModal.js

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Modal, Alert, ActivityIndicator } from 'react-native';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditPostModal = ({ isVisible, onClose, post, onPostUpdated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Efeito para popular o formulário quando um post é selecionado para edição
  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
    }
  }, [post]);

  const handleUpdate = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Erro', 'Título e conteúdo não podem ser vazios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      await api.put(
        `/posts/${post.id}`,
        { title, content },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      Alert.alert('Sucesso', 'Post atualizado com sucesso!');
      onPostUpdated(); // Chama a função para fechar o modal e atualizar a lista
    } catch (error) {
      console.error('Erro ao atualizar post:', error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível atualizar o post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!post) return null;

  return (
    <Modal
      visible={isVisible}
      onRequestClose={onClose}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Editar Post</Text>
          <TextInput
            style={styles.input}
            placeholder="Título do post"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Conteúdo do post"
            value={content}
            onChangeText={setContent}
            multiline
          />
          <View style={styles.buttonContainer}>
            <Button title="Cancelar" onPress={onClose} color="#777" />
            {isSubmitting ? (
              <ActivityIndicator color="#116530" />
            ) : (
              <Button title="Salvar Alterações" onPress={handleUpdate} color="#116530" />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 10,
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
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
});

export default EditPostModal;