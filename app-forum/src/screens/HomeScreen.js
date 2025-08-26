// src/screens/HomeScreen.js

import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
} from "react-native";
import AuthContext from "../context/AuthContext";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Header from "../components/Header";

const HomeScreen = ({ navigation }) => {
  const { signOut } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userLikes, setUserLikes] = useState({});
  const [userFavorites, setUserFavorites] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [newPostImageUri, setNewPostImageUri] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Busca os posts da API. Usamos useCallback para memoizar a função.
  const fetchPosts = useCallback(async () => {
    console.log(`Buscando posts com o termo: "${searchTerm}"`);
    setLoadingPosts(true);
    try {
      // O termo de busca é passado como um query parameter para a API
      const response = await api.get(`/posts?q=${searchTerm}`);
      const userToken = await AsyncStorage.getItem("userToken");
      let initialUserLikes = {};
      let initialUserFavorites = {};

      if (userToken) {
        try {
          // Busca os likes e favoritos do usuário para marcar os posts corretamente
          const [likesResponse, favoritesResponse] = await Promise.all([
            api.get(`/users/likes`, {
              headers: { Authorization: `Bearer ${userToken}` },
            }),
            api.get(`/users/me/favorites/ids`, {
              headers: { Authorization: `Bearer ${userToken}` },
            }),
          ]);

          likesResponse.data.forEach((like) => {
            initialUserLikes[like.post_id] = true;
          });
          favoritesResponse.data.forEach((favorite) => {
            initialUserFavorites[favorite.post_id] = true;
          });
        } catch (error) {
          console.error(
            "Erro ao buscar likes ou favoritos do usuário:",
            error.response?.data || error.message
          );
        }
      }
      setUserLikes(initialUserLikes);
      setUserFavorites(initialUserFavorites);
      setPosts(response.data);
    } catch (error) {
      console.error(
        "Erro ao buscar posts:",
        error.response?.data || error.message
      );
      Alert.alert("Erro", "Não foi possível carregar os posts.");
    } finally {
      setLoadingPosts(false);
    }
  }, [searchTerm]); // A função é recriada apenas se `searchTerm` mudar.

  // Efeito para carregar dados iniciais e pedir permissões
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const userToken = await AsyncStorage.getItem("userToken");
        if (userToken) {
          const meResponse = await api.get("/users/me", {
            headers: { Authorization: `Bearer ${userToken}` },
          });
          setCurrentUserId(meResponse.data.id);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      }
      fetchPosts(); // Busca inicial de posts
    };

    loadInitialData();

    // Pede permissão para acessar a galeria de imagens
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permissão Negada",
            "Desculpe, precisamos de permissões de galeria para isso funcionar!"
          );
        }
      }
    })();
  }, [fetchPosts]); // Depende de fetchPosts

  // Função para o "pull-to-refresh"
  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchPosts();
    setIsRefreshing(false);
  };

  // Função para selecionar uma imagem da galeria
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

  // Função para criar um novo post
  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      Alert.alert("Erro", "Título e conteúdo do post não podem ser vazios.");
      return;
    }

    setIsSubmitting(true);
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) {
        Alert.alert(
          "Erro de Autenticação",
          "Você precisa estar logado para criar um post."
        );
        signOut();
        setIsSubmitting(false);
        return;
      }

      let imageUrlToSave = null;
      if (newPostImageUri) {
        const formData = new FormData();
        const filename = newPostImageUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image";

        // Adapta o upload para web e nativo
        if (Platform.OS === "web") {
          const response = await fetch(newPostImageUri);
          const blob = await response.blob();
          formData.append("postImage", blob, filename);
        } else {
          formData.append("postImage", {
            uri: newPostImageUri,
            name: filename,
            type,
          });
        }

        try {
          const uploadResponse = await api.post(
            "/upload/post-image",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${userToken}`,
              },
            }
          );
          imageUrlToSave = uploadResponse.data.imageUrl;
        } catch (uploadError) {
          console.error(
            "Erro ao fazer upload da imagem:",
            uploadError.response?.data || uploadError.message
          );
          Alert.alert("Erro", "Não foi possível fazer upload da imagem.");
          setIsSubmitting(false);
          return;
        }
      }

      // Envia os dados do post para a API
      await api.post(
        "/posts",
        {
          title: newPostTitle,
          content: newPostContent,
          image_url: imageUrlToSave,
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      Alert.alert("Sucesso", "Post criado com sucesso!");
      // Limpa os campos após o sucesso
      setNewPostTitle("");
      setNewPostContent("");
      setNewPostImageUri(null);
      await fetchPosts(); // Atualiza a lista de posts
    } catch (error) {
      console.error(
        "Erro ao criar post:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Erro",
        error.response?.data?.message || "Ocorreu um erro ao criar o post."
      );
      if (error.response?.status === 401 || error.response?.status === 403) {
        signOut();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funções para curtir e favoritar
  const handleToggleLike = async (postId) => {
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) {
        Alert.alert("Erro", "Você precisa estar logado para curtir posts.");
        signOut();
        return;
      }
      const response = await api.post(`/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      const { liked } = response.data;
      setUserLikes((prev) => ({ ...prev, [postId]: liked }));

      // Atualiza a contagem de likes localmente para resposta imediata da UI
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likes_count: liked ? post.likes_count + 1 : Math.max(0, post.likes_count - 1) }
            : post
        )
      );
    } catch (error) {
      console.error("Erro no like:", error.response?.data || error.message);
      if (error.response?.status === 401 || error.response?.status === 403) {
        signOut();
      }
    }
  };

  const handleToggleFavorite = async (postId) => {
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      if (!userToken) {
        Alert.alert("Erro", "Você precisa estar logado para favoritar.");
        signOut();
        return;
      }
      const response = await api.post(`/posts/${postId}/favorite`, {}, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      Alert.alert("Sucesso", response.data.message);
      setUserFavorites((prev) => ({ ...prev, [postId]: response.data.favorited }));
    } catch (error) {
      console.error("Erro ao favoritar:", error.response?.data || error.message);
      if (error.response?.status === 401 || error.response?.status === 403) {
        signOut();
      }
    }
  };

  // Componente para renderizar cada item da lista de posts
  const renderPostItem = ({ item }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        {item.profile_picture_url ? (
          <Image
            source={{ uri: `${api.defaults.baseURL.replace("/api", "")}${item.profile_picture_url}` }}
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
          source={{ uri: `${api.defaults.baseURL.replace("/api", "")}${item.image_url}` }}
          style={styles.postImage}
        />
      )}
      <View style={styles.postFooter}>
        <TouchableOpacity
          style={styles.interactionButton}
          onPress={() => handleToggleLike(item.id)}
        >
          <Ionicons
            name={userLikes[item.id] ? "heart" : "heart-outline"}
            size={24}
            color={userLikes[item.id] ? "red" : "#666"}
          />
          <Text style={styles.interactionText}>{item.likes_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.interactionButton}
          onPress={() => navigation.navigate("PostDetail", { postId: item.id })}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#666" />
          <Text style={styles.interactionText}>{item.comments_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.interactionButton}
          onPress={() => handleToggleFavorite(item.id)}
        >
          <Ionicons
            name={userFavorites[item.id] ? "bookmark" : "bookmark-outline"}
            size={24}
            color={userFavorites[item.id] ? "#FFC107" : "#666"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Tela de loading inicial
  if (loadingPosts && posts.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#116530" />
        <Text style={styles.loadingText}>Carregando posts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={"devSocial"} />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPostItem}
        contentContainerStyle={styles.postListContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#116530"]} />
        }
        ListHeaderComponent={
          <>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Pesquisar posts..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                onSubmitEditing={fetchPosts} // Busca ao pressionar "Enter"
                returnKeyType="search"
              />
              <TouchableOpacity onPress={fetchPosts} style={styles.searchButton}>
                <Ionicons name="search" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.createPostContainer}>
              <TextInput
                style={styles.input}
                placeholder="Título do seu post"
                value={newPostTitle}
                onChangeText={setNewPostTitle}
              />
              <TextInput
                style={[styles.input, { height: 100, textAlignVertical: "top" }]}
                placeholder="O que você quer compartilhar?"
                value={newPostContent}
                onChangeText={setNewPostContent}
                multiline
              />
              <TouchableOpacity onPress={pickPostImage} style={styles.imagePickerButton}>
                <Ionicons name="image-outline" size={24} color="#0c411fff" />
                <Text style={styles.imagePickerButtonText}>Adicionar Imagem</Text>
              </TouchableOpacity>
              {newPostImageUri && (
                <Image source={{ uri: newPostImageUri }} style={styles.previewImage} />
              )}
              <Button
                title={isSubmitting ? "Publicando..." : "Criar Post"}
                onPress={handleCreatePost}
                disabled={isSubmitting}
                color="#116530"
              />
            </View>
          </>
        }
        ListFooterComponent={
          loadingPosts && posts.length > 0 ? (
            <ActivityIndicator size="large" color="#116530" style={{ marginVertical: 20 }} />
          ) : null
        }
        ListEmptyComponent={
          !loadingPosts ? (
            <Text style={styles.noPostsText}>
              Nenhum post encontrado. Tente ajustar sua pesquisa ou seja o primeiro a postar!
            </Text>
          ) : null
        }
      />
    </View>
  );
};


const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#A3EBB1",
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: '#116530',
    },
    postListContainer: {
        maxWidth: "800px",
        width: "100%",
        marginHorizontal: "auto",
        paddingBottom: 20,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "rgba(255, 255, 255, 0.5)",
      borderRadius: 25,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      margin: 15,
      shadowColor: "#252121ff",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 3,
    },
    searchInput: {
      flex: 1,
      padding: 10,
      fontSize: 16,
      color: '#333',
    },
    searchButton: {
      backgroundColor: "#116530",
      padding: 8,
      borderTopRightRadius: 25,
      borderBottomRightRadius: 25,
    },
    createPostContainer: {
      backgroundColor: "#fff",
      padding: 20,
      marginHorizontal: 15,
      marginBottom: 15,
      borderRadius: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 5,
    },
    input: {
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 5,
      padding: 10,
      marginBottom: 10,
      backgroundColor: "#f9f9f9",
    },
    imagePickerButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#e9f5ff",
      padding: 10,
      borderRadius: 5,
      justifyContent: "center",
      marginBottom: 10,
    },
    imagePickerButtonText: {
      marginLeft: 10,
      color: "#116530",
      fontWeight: "bold",
    },
    previewImage: {
      width: "100%",
      height: 150,
      borderRadius: 8,
      resizeMode: "cover",
      marginBottom: 10,
    },
    postCard: {
      backgroundColor: "#fff",
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 3,
      marginHorizontal: 15,
    },
    postHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    profilePicture: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
    },
    profilePicturePlaceholder: {
      marginRight: 10,
    },
    postUsername: {
      fontWeight: "bold",
      fontSize: 16,
      color: "#555",
    },
    postTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 8,
      color: "#333",
    },
    postContent: {
      fontSize: 15,
      lineHeight: 22,
      color: "#666",
      marginBottom: 10,
    },
    postImage: {
      width: "100%",
      height: 200,
      borderRadius: 8,
      marginTop: 10,
      resizeMode: "cover",
    },
    postFooter: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: "#eee",
    },
    interactionButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
    },
    interactionText: {
      marginLeft: 5,
      fontSize: 14,
      color: "#666",
    },
    noPostsText: {
      textAlign: "center",
      marginTop: 50,
      fontSize: 16,
      color: "#777",
    },
  });


export default HomeScreen;