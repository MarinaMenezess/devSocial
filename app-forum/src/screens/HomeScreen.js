// src/screens/HomeScreen.js

import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import AuthContext from "../context/AuthContext";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Header from "../components/Header";
import { LinearGradient } from 'expo-linear-gradient';

const HomeScreen = ({ navigation }) => {
  const { signOut } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userLikes, setUserLikes] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [newPostImageUri, setNewPostImageUri] = useState(null);

  useEffect(() => {
    const loadInitialData = async () => {
        const userToken = await AsyncStorage.getItem("userToken");
        if (userToken) {
            try {
                const meResponse = await api.get('/users/me', {
                    headers: { Authorization: `Bearer ${userToken}` }
                });
                setCurrentUserId(meResponse.data.id);
            } catch (error) {
                console.error("Erro ao buscar dados do usuário:", error);
                signOut(); // Desloga se o token for inválido
            }
        }
    };
    
    loadInitialData();
    fetchPosts();

    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão Negada",
          "Desculpe, precisamos de permissões de galeria para isso funcionar!"
        );
      }
    })();
  }, []);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const response = await api.get(`/posts?q=${searchTerm}`);
      const userToken = await AsyncStorage.getItem("userToken");
      let initialUserLikes = {};

      if (userToken) {
        try {
            const likesResponse = await api.get(`/users/likes`, {
              headers: { Authorization: `Bearer ${userToken}` },
            });
            likesResponse.data.forEach((like) => {
              initialUserLikes[like.post_id] = true;
            });
        } catch (likesError) {
            console.error( "Erro ao buscar likes do usuário:", likesError.response?.data || likesError.message);
        }
      }
      
      setUserLikes(initialUserLikes);
      setPosts(response.data);
    } catch (error) {
      console.error("Erro ao buscar posts:", error.response?.data || error.message);
      Alert.alert("Erro", "Não foi possível carregar os posts.");
    } finally {
      setLoadingPosts(false);
    }
  };

  const pickPostImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewPostImageUri(result.assets[0].uri);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      Alert.alert("Erro", "Título e conteúdo do post não podem ser vazios.");
      return;
    }

    setIsSubmitting(true);
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) {
        Alert.alert("Erro de Autenticação", "Você precisa estar logado para criar um post.");
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
          const uploadResponse = await api.post("/upload/post-image", formData, {
            headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${userToken}` },
          });
          imageUrlToSave = uploadResponse.data.imageUrl;
        } catch (uploadError) {
          console.error("Erro ao fazer upload da imagem:", JSON.stringify(uploadError.response?.data) || uploadError.message);
          Alert.alert("Erro de Upload", "Não foi possível fazer upload da imagem.");
          setIsSubmitting(false);
          return;
        }
      }

      await api.post("/posts", {
        title: newPostTitle,
        content: newPostContent,
        image_url: imageUrlToSave,
      }, { headers: { Authorization: `Bearer ${userToken}` } });

      Alert.alert("Sucesso", "Post criado com sucesso!");
      setNewPostTitle("");
      setNewPostContent("");
      setNewPostImageUri(null);
      fetchPosts();
    } catch (error) {
      console.error("Erro ao criar post:", JSON.stringify(error.response?.data) || error.message);
      Alert.alert("Erro ao Criar Post", error.response?.data?.message || "Ocorreu um erro.");
      if (error.response?.status === 401 || error.response?.status === 403) {
        signOut();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) {
        Alert.alert("Erro", "Você precisa estar logado para curtir posts.");
        signOut();
        return;
      }
      const response = await api.post(`/posts/${postId}/like`, {}, { headers: { Authorization: `Bearer ${userToken}` } });

      setUserLikes(prev => ({ ...prev, [postId]: response.data.liked }));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: response.data.liked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1) } : p));
    } catch (error) {
      console.error("Erro ao curtir:", error.response?.data || error.message);
      Alert.alert("Erro", error.response?.data?.message || "Não foi possível processar o like.");
    }
  };

  const handleToggleFavorite = async (postId) => {
    try {
        const userToken = await AsyncStorage.getItem("userToken");
        if (!userToken) {
          Alert.alert("Erro", "Você precisa estar logado para favoritar posts.");
          signOut();
          return;
        }
        const response = await api.post(`/posts/${postId}/favorite`, {}, { headers: { Authorization: `Bearer ${userToken}` } });
        Alert.alert("Sucesso", response.data.message);
      } catch (error) {
        console.error("Erro ao favoritar:", error.response?.data || error.message);
        Alert.alert("Erro", error.response?.data?.message || "Não foi possível processar o favorito.");
      }
  };

  const renderPostItem = ({ item }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        {item.profile_picture_url ? (
          <Image
            source={{ uri: `${api.defaults.baseURL.replace('/api', '')}${item.profile_picture_url}` }}
            style={styles.profilePicture}
          />
        ) : (
          <Ionicons
            name="person-circle"
            size={40}
            color="#ccc"
            style={styles.profilePicturePlaceholder}
          />
        )}
        <Text style={styles.postUsername}>{item.username}</Text>
      </View>
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postContent}>{item.content}</Text>
      {item.image_url && (
        <Image
          source={{ uri: `${api.defaults.baseURL.replace('/api', '')}${item.image_url}` }}
          style={styles.postImage}
        />
      )}
      <View style={styles.postFooter}>
        <TouchableOpacity style={styles.interactionButton} onPress={() => handleToggleLike(item.id)}>
          <Ionicons
            name={userLikes[item.id] ? "heart" : "heart-outline"}
            size={24}
            color={userLikes[item.id] ? "#E91E63" : "#116530"}
          />
          <Text style={styles.interactionText}>{item.likes_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.interactionButton} onPress={() => navigation.navigate("PostDetail", { postId: item.id })}>
          <Ionicons name="chatbubble-outline" size={24} color="#116530" />
          <Text style={styles.interactionText}>{item.comments_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.interactionButton} onPress={() => handleToggleFavorite(item.id)}>
          <Ionicons name="bookmark-outline" size={24} color="#116530" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title={"DevSocial"} />

      <FlatList
        ListHeaderComponent={
          <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center' }}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Pesquisar no DevSocial..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                onSubmitEditing={fetchPosts}
                placeholderTextColor="#666"
              />
              <TouchableOpacity onPress={fetchPosts} style={styles.searchButton}>
                <Ionicons name="search" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.createPostContainer}>
              <TextInput
                style={styles.inputTitle}
                placeholder="No que você está pensando?"
                value={newPostTitle}
                onChangeText={setNewPostTitle}
                placeholderTextColor="#555"
              />
              <TextInput
                style={styles.inputContent}
                placeholder="Compartilhe mais detalhes..."
                value={newPostContent}
                onChangeText={setNewPostContent}
                multiline
                placeholderTextColor="#777"
              />
               {newPostImageUri && <Image source={{ uri: newPostImageUri }} style={styles.previewImage}/>}
              <View style={styles.createPostFooter}>
                <TouchableOpacity onPress={pickPostImage} style={styles.imagePickerButton}>
                  <Ionicons name="image-outline" size={24} color="#18A558" />
                  <Text style={styles.imagePickerButtonText}>Foto</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreatePost} disabled={isSubmitting}>
                    <LinearGradient
                        colors={['#18A558', '#116530']}
                        style={styles.submitButton}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Publicar</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPostItem}
        contentContainerStyle={styles.postListContainer}
        ListFooterComponent={loadingPosts && <ActivityIndicator size="large" color="#116530" style={{ marginVertical: 20 }} />}
        ListEmptyComponent={!loadingPosts && (
            <Text style={styles.noPostsText}>
              Nenhum post encontrado. Que tal criar o primeiro?
            </Text>
        )}
        onRefresh={fetchPosts}
        refreshing={loadingPosts}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  postListContainer: {
    paddingBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    margin: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: "#116530",
    padding: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  createPostContainer: {
    backgroundColor: "#fff",
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  inputTitle: {
    fontSize: 18,
    fontWeight: '500',
    paddingBottom: 10,
    color: '#111',
  },
  inputContent: {
      fontSize: 16,
      minHeight: 60,
      textAlignVertical: 'top',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#F0F2F5',
      color: '#333'
  },
  createPostFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 10,
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#F0F2F5',
  },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#A3EBB1'
  },
  imagePickerButtonText: {
    marginLeft: 8,
    color: "#116530",
    fontWeight: "bold",
    fontSize: 14
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    resizeMode: "cover",
    marginBottom: 10,
    marginTop: 10
  },
  submitButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  postCard: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    marginHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  profilePicture: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 10,
  },
  profilePicturePlaceholder: {
    marginRight: 10,
  },
  postUsername: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#111",
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
  },
  postImage: {
    width: "100%",
    height: 220,
    borderRadius: 10,
    marginTop: 15,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F2F5",
  },
  interactionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  interactionText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#116530",
    fontWeight: '500'
  },
  noPostsText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#777",
  },
});

export default HomeScreen;