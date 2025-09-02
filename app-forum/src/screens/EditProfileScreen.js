// src/screens/EditProfileScreen.js

import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, Alert,
  ScrollView, ActivityIndicator, Image, TouchableOpacity,
  Platform
} from 'react-native';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Header from '../components/Header';

const EditProfileScreen = ({ route, navigation }) => {
  const { user: initialUser } = route.params;
  const { signOut } = useContext(AuthContext);

  const [username, setUsername] = useState(initialUser.username);
  const [email, setEmail] = useState(initialUser.email);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState(initialUser.profile_picture_url);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  // --- NOVO: Estado para controlar se a foto foi removida ---
  const [isPhotoRemoved, setIsPhotoRemoved] = useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão Negada', 'Desculpe, precisamos de permissões de galeria para isso funcionar!');
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedImageUri(asset.uri);
      setProfilePictureUrl(asset.uri);
      // --- NOVO: Se o usuário escolher uma nova foto, resetamos o estado de remoção ---
      setIsPhotoRemoved(false);
    }
  };
  
  // --- NOVA FUNÇÃO: Para lidar com a remoção da foto ---
  const handleRemovePhoto = () => {
    setProfilePictureUrl(null); // Limpa a imagem da tela
    setSelectedImageUri(null); // Limpa a imagem selecionada
    setIsPhotoRemoved(true); // Define a flag de remoção
  };

  const handleUpdateProfile = async () => {
    if (newPassword && newPassword !== confirmNewPassword) {
      Alert.alert('Erro', 'A nova senha e a confirmação de senha não coincidem.');
      return;
    }

    setIsSubmitting(true);
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('Erro de Autenticação', 'Você não está logado.');
        signOut();
        return;
      }

      let finalProfilePictureUrl = profilePictureUrl;

      // Upload só acontece se uma nova imagem foi selecionada
      if (selectedImageUri) {
        const formData = new FormData();
        const filename = selectedImageUri.split('/').pop();
        
        const response = await fetch(selectedImageUri);
        const blob = await response.blob();
        
        formData.append('profilePicture', blob, filename);

        try {
          const uploadResponse = await api.post('/upload/profile-picture', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${userToken}`,
            },
          });
          finalProfilePictureUrl = uploadResponse.data.imageUrl;
        } catch (uploadError) {
          console.error('Erro ao fazer upload da imagem de perfil:', uploadError.response?.data);
          Alert.alert('Erro de Upload', uploadError.response?.data?.message || 'Não foi possível fazer upload da foto de perfil.');
          setIsSubmitting(false);
          return;
        }
      }

      const updateData = {
        username: username.trim() !== initialUser.username ? username.trim() : undefined,
        email: email.trim() !== initialUser.email ? email.trim() : undefined,
      };

      // --- LÓGICA ATUALIZADA: Para lidar com a remoção da foto ---
      if (isPhotoRemoved) {
        updateData.profile_picture_url = null; // Envia null para o backend
      } else if (selectedImageUri) {
        // Só envia a nova URL se uma nova imagem foi selecionada e enviada com sucesso
        updateData.profile_picture_url = finalProfilePictureUrl;
      }
      // Se nem removeu nem selecionou, não adicionamos a propriedade e nada muda no backend

      if (newPassword) {
        updateData.old_password = oldPassword;
        updateData.new_password = newPassword;
      }

      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([, value]) => value !== undefined)
      );

      // Verifica se há algo para atualizar
      if (Object.keys(filteredUpdateData).length === 0) {
        Alert.alert('Aviso', 'Nenhuma alteração detetada para salvar.');
        setIsSubmitting(false);
        return;
      }

      await api.put('/users/me', filteredUpdateData, { headers: { Authorization: `Bearer ${userToken}` } });

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      navigation.goBack();

    } catch (error) {
      console.error('Erro ao atualizar perfil:', error.response?.data || error.message);
      Alert.alert('Erro', error.response?.data?.message || 'Ocorreu um erro ao atualizar o perfil.');
      if (error.response?.status === 401 || error.response?.status === 403) {
        signOut();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title={"Editar Perfil"} />

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.profilePictureContainer}>
          <TouchableOpacity onPress={pickImage}>
            {profilePictureUrl ? (
              <Image source={{ uri: profilePictureUrl }} style={styles.profilePicture} />
            ) : (
              <Ionicons name="camera-outline" size={80} color="#ccc" style={styles.profilePicturePlaceholder} />
            )}
          </TouchableOpacity>
          <View style={styles.photoActionsContainer}>
            <TouchableOpacity onPress={pickImage}>
              <Text style={styles.changePhotoText}>Trocar foto</Text>
            </TouchableOpacity>
            {/* --- NOVO: Botão para remover a foto --- */}
            {profilePictureUrl && ( // Só mostra o botão se houver uma foto
              <TouchableOpacity onPress={handleRemovePhoto}>
                <Text style={[styles.changePhotoText, styles.removePhotoText]}>Remover Foto</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* O resto do código dos inputs e botão de salvar permanece o mesmo... */}
        <TextInput
          style={[styles.input, focusedInput === 'username' && styles.inputFocused]}
          onFocus={() => setFocusedInput('username')}
          onBlur={() => setFocusedInput(null)}
          placeholder="Nome de Usuário"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, focusedInput === 'email' && styles.inputFocused]}
          onFocus={() => setFocusedInput('email')}
          onBlur={() => setFocusedInput(null)}
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.sectionTitle}>Mudar Senha (Opcional)</Text>
        <TextInput
          style={[styles.input, focusedInput === 'old-password' && styles.inputFocused]}
          onFocus={() => setFocusedInput('old-password')}
          onBlur={() => setFocusedInput(null)}
          placeholder="Senha Antiga"
          value={oldPassword}
          onChangeText={setOldPassword}
          secureTextEntry
        />
        <TextInput
          style={[styles.input, focusedInput === 'new-password' && styles.inputFocused]}
          onFocus={() => setFocusedInput('new-password')}
          onBlur={() => setFocusedInput(null)}
          placeholder="Nova Senha"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <TextInput
          style={[styles.input, focusedInput === 'confirm-password' && styles.inputFocused]}
          onFocus={() => setFocusedInput('confirm-password')}
          onBlur={() => setFocusedInput(null)}
          placeholder="Confirmar Nova Senha"
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          secureTextEntry
        />
        <Button
          title={isSubmitting ? "Salvando..." : "Salvar Alterações"}
          onPress={handleUpdateProfile}
          disabled={isSubmitting}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#A3EBB1' },
    scrollViewContent: { padding: 20, alignItems: 'center', maxWidth: "800px", marginHorizontal: "auto", width: "100%" },
    profilePictureContainer: { alignItems: 'center', marginBottom: "40px" },
    profilePicture: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#007bff' },
    profilePicturePlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', display: "flex" },
    // --- NOVO: Estilos para os botões de foto ---
    photoActionsContainer: {
      flexDirection: 'row',
      marginTop: 10,
      justifyContent: 'center',
    },
    changePhotoText: {
      color: '#007bff',
      textDecorationLine: 'underline',
      marginHorizontal: 15, // Espaçamento entre os botões
      fontSize: 16,
    },
    removePhotoText: {
      color: '#dc3545', // Cor vermelha para indicar remoção
    },
    input: { width: "80%", paddingVertical: 10, paddingHorizontal: 20, borderWidth: 2, borderRadius: 40, borderColor: "rgba(255, 255, 255, 0.5)", backgroundColor: "rgba(255, 255, 255, 0.2)", marginBottom: 15, color: "#fff", fontSize: 16, textAlign: 'flex-start' },
    inputFocused: { borderColor: 'rgba(255, 255, 255, 1)', backgroundColor: "rgba(255, 255, 255, 0.3)", shadowColor: '#fff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 15, outlineStyle: 'none' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 10, alignSelf: 'flex-start', width: '100%' },
});

export default EditProfileScreen;