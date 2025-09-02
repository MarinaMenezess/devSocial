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
import EditPostModal from "../components/EditPostModal"; // Make sure you have created this component

const HomeScreen = ({ navigation }) => {
  const { signOut } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userLikes, setUserLikes] = useState({});
  const [userFavorites, setUserFavorites] = useState({});
  const [newPostImageUri, setNewPostImageUri] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // States to control the edit modal
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  useEffect(() => {
    const loadInitialUserData = async () => {
      try {
        const userToken = await AsyncStorage.getItem("userToken");
        if (!userToken) { signOut(); return; }
        if (Platform.OS !== "web") {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") { Alert.alert("Permissão Negada", "Precisamos de acesso à galeria para o upload de imagens."); }
        }
        const [meResponse, favoritesResponse] = await Promise.all([
          api.get("/users/me", { headers: { Authorization: `Bearer ${userToken}` } }),
          api.get("/users/me/favorites/ids", { headers: { Authorization: `Bearer ${userToken}` } }),
        ]);
        setUser(meResponse.data);
        const initialUserFavorites = {};
        favoritesResponse.data.forEach((fav) => { initialUserFavorites[fav.post_id] = true; });
        setUserFavorites(initialUserFavorites);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error.response?.data || error.message);
        if (error.response?.status === 401 || error.response?.status === 403) { signOut(); }
      }
    };
    loadInitialUserData();
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      const response = await api.get(`/posts?q=${searchTerm}`, {
        headers: userToken ? { Authorization: `Bearer ${userToken}` } : {}
      });
      const postsData = response.data;
      const initialUserLikes = {};
      postsData.forEach(post => { if (post.liked_by_user) { initialUserLikes[post.id] = true; } });
      setUserLikes(initialUserLikes);
      setPosts(postsData);
    } catch (error) {
      console.error("Erro ao buscar posts:", error.response?.data || error.message);
      Alert.alert("Erro", "Não foi possível carregar os posts.");
    } finally {
      setLoadingPosts(false);
      setIsRefreshing(false);
    }
  }, [searchTerm]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const onRefresh = () => { setIsRefreshing(true); fetchPosts(); };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const pickPostImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) { setNewPostImageUri(result.assets[0].uri); }
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      Alert.alert("Erro", "Título e conteúdo são obrigatórios.");
      return;
    }
    setIsSubmitting(true);
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      let imageUrlToSave = null;
      if (newPostImageUri) {
        const formData = new FormData();
        const filename = newPostImageUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image";
        formData.append("postImage", { uri: newPostImageUri, name: filename, type });
        const uploadResponse = await api.post("/upload/post-image", formData, {
          headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${userToken}` },
        });
        imageUrlToSave = uploadResponse.data.imageUrl;
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
      await fetchPosts();
    } catch (error) {
      console.error("Erro ao criar post:", error.response?.data || error.message);
      Alert.alert("Erro", error.response?.data?.message || "Ocorreu um erro ao criar o post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Functions to handle editing and deleting
  const handleOpenEditModal = (post) => {
    setEditingPost(post);
    setEditModalVisible(true);
  };

  const handlePostUpdated = () => {
    setEditModalVisible(false);
    setEditingPost(null);
    onRefresh();
  };

  const handleDeletePost = (postId) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Você tem certeza que deseja excluir este post?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const userToken = await AsyncStorage.getItem("userToken");
              await api.delete(`/posts/${postId}`, {
                headers: { Authorization: `Bearer ${userToken}` },
              });
              Alert.alert("Sucesso", "Post excluído.");
              setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId));
            } catch (error) {
              console.error("Erro ao excluir post:", error.response?.data || error.message);
              Alert.alert("Erro", "Não foi possível excluir o post.");
            }
          },
        },
      ]
    );
  };

  const handleToggleLike = async (postId) => {
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      setUserLikes((prev) => ({ ...prev, [postId]: !prev[postId] }));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likes_count: userLikes[postId] ? Math.max(0, post.likes_count - 1) : post.likes_count + 1 }
            : post
        )
      );
      await api.post(`/posts/${postId}/like`, {}, { headers: { Authorization: `Bearer ${userToken}` } });
    } catch (error) {
      console.error("Erro no like:", error.response?.data || error.message);
      setUserLikes((prev) => ({ ...prev, [postId]: !prev[postId] }));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likes_count: userLikes[postId] ? Math.max(0, post.likes_count - 1) : post.likes_count + 1 }
            : post
        )
      );
    }
  };

  const handleToggleFavorite = async (postId) => {
    try {
      const userToken = await AsyncStorage.getItem("userToken");
      const response = await api.post(`/posts/${postId}/favorite`, {}, { headers: { Authorization: `Bearer ${userToken}` } });
      setUserFavorites((prev) => ({ ...prev, [postId]: response.data.favorited }));
    } catch (error) {
      console.error("Erro ao favoritar:", error.response?.data || error.message);
    }
  };

  const renderPostItem = ({ item }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postHeaderInfo}>
          {item.profile_picture_url ? (
            <Image source={{ uri: `${api.defaults.baseURL.replace("/api", "")}${item.profile_picture_url}` }} style={styles.profilePicture} />
          ) : (
            <Ionicons name="person-circle" size={40} color="#ccc" style={styles.profilePicturePlaceholder} />
          )}
          <Text style={styles.postUsername}>{item.username}</Text>
        </View>

        {user && user.id === item.user_id && (
          <View style={styles.postActions}>
            <TouchableOpacity onPress={() => handleOpenEditModal(item)}>
              <Ionicons name="create-outline" size={24} color="#555" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeletePost(item.id)} style={{ marginLeft: 15 }}>
              <Ionicons name="trash-outline" size={24} color="#E53935" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postContent}>{item.content}</Text>
      {item.image_url && (
        <Image source={{ uri: `${api.defaults.baseURL.replace("/api", "")}${item.image_url}` }} style={styles.postImage} />
      )}
      <View style={styles.postFooter}>
        <TouchableOpacity style={styles.interactionButton} onPress={() => handleToggleLike(item.id)}>
          <Ionicons name={userLikes[item.id] ? "heart" : "heart-outline"} size={24} color={userLikes[item.id] ? "red" : "#666"} />
          <Text style={styles.interactionText}>{item.likes_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.interactionButton} onPress={() => navigation.navigate("PostDetail", { postId: item.id })}>
          <Ionicons name="chatbubble-outline" size={24} color="#666" />
          <Text style={styles.interactionText}>{item.comments_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.interactionButton} onPress={() => handleToggleFavorite(item.id)}>
          <Ionicons name={userFavorites[item.id] ? "bookmark" : "bookmark-outline"} size={24} color={userFavorites[item.id] ? "#FFC107" : "#666"} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loadingPosts && posts.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#116530" />
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
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#116530"]} />}
        ListHeaderComponent={
          <>
            <View style={styles.greetingContainer}>
              {user && <Text style={styles.greetingText}>{getGreeting()}, {user.username}!</Text>}
            </View>
            <View style={styles.searchContainer}>
              <TextInput style={styles.searchInput} placeholder="Pesquisar posts..." value={searchTerm} onChangeText={setSearchTerm} onSubmitEditing={fetchPosts} returnKeyType="search" />
              <TouchableOpacity onPress={fetchPosts} style={styles.searchButton}>
                <Ionicons name="search" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.createPostContainer}>
              <TextInput style={styles.input} placeholder="Título do seu post" value={newPostTitle} onChangeText={setNewPostTitle} />
              <TextInput style={[styles.input, { height: 100, textAlignVertical: "top" }]} placeholder="O que você quer compartilhar?" value={newPostContent} onChangeText={setNewPostContent} multiline />
              <TouchableOpacity onPress={pickPostImage} style={styles.imagePickerButton}>
                <Ionicons name="image-outline" size={24} color="#0c411fff" />
                <Text style={styles.imagePickerButtonText}>Adicionar Imagem</Text>
              </TouchableOpacity>
              {newPostImageUri && <Image source={{ uri: newPostImageUri }} style={styles.previewImage} />}
              <Button title={isSubmitting ? "Publicando..." : "Criar Post"} onPress={handleCreatePost} disabled={isSubmitting} color="#116530" />
            </View>
          </>
        }
        ListEmptyComponent={!loadingPosts ? <Text style={styles.noPostsText}>Nenhum post encontrado.</Text> : null}
      />
      <EditPostModal
        isVisible={isEditModalVisible}
        onClose={() => setEditModalVisible(false)}
        post={editingPost}
        onPostUpdated={handlePostUpdated}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#A3EBB1" },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  greetingContainer: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: '#eee' }, // Background corrected
  greetingText: { fontSize: 22, fontWeight: "bold", color: '#333' },
  postListContainer: { maxWidth: "800px", width: "100%", marginHorizontal: "auto", paddingBottom: 20 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 15, marginTop: 15, borderRadius: 25, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  searchInput: { flex: 1, padding: 12, fontSize: 16, color: '#333', paddingLeft: 20 },
  searchButton: { backgroundColor: "#116530", padding: 10, borderTopRightRadius: 25, borderBottomRightRadius: 25 },
  createPostContainer: { backgroundColor: "#fff", padding: 20, marginHorizontal: 15, marginVertical: 15, borderRadius: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 5 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 5, padding: 10, marginBottom: 10, backgroundColor: "#f9f9f9" },
  imagePickerButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#e9f5ff", padding: 10, borderRadius: 5, justifyContent: "center", marginBottom: 10 },
  imagePickerButtonText: { marginLeft: 10, color: "#116530", fontWeight: "bold" },
  previewImage: { width: "100%", height: 180, borderRadius: 8, resizeMode: "cover", marginBottom: 10 },
  postCard: { backgroundColor: "#fff", padding: 15, borderRadius: 10, marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 3, marginHorizontal: 15 },
  postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10, justifyContent: 'space-between' },
  postHeaderInfo: { flexDirection: "row", alignItems: "center" },
  postActions: { flexDirection: 'row' },
  profilePicture: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  profilePicturePlaceholder: { marginRight: 10 },
  postUsername: { fontWeight: "bold", fontSize: 16, color: "#555" },
  postTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8, color: "#333" },
  postContent: { fontSize: 15, lineHeight: 22, color: "#666", marginBottom: 10 },
  postImage: { width: "100%", height: 200, borderRadius: 8, marginTop: 10, resizeMode: "cover" },
  postFooter: { flexDirection: "row", justifyContent: "space-around", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#eee" },
  interactionButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10 },
  interactionText: { marginLeft: 5, fontSize: 14, color: "#666" },
  noPostsText: { textAlign: "center", marginTop: 50, fontSize: 16, color: "#777", marginHorizontal: 20 },
});

export default HomeScreen;