import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native"; // <-- Platform foi adicionado aqui
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import AuthContext from "../context/AuthContext";

const Header = ({ title, user }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { signOut } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert("Sair", "Você tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", onPress: () => signOut(), style: "destructive" },
    ]);
  };

  // Não mostra o botão de voltar na HomeScreen
  const canGoBack = navigation.canGoBack() && route.name !== 'Home';

  return (
    <View style={styles.header}>
      {canGoBack ? (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <Ionicons name="arrow-back" size={26} color="#116530" />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} /> // Mantém o título centralizado
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerButtons}>
        {!!user && (
          <TouchableOpacity
            onPress={() => navigation.navigate("EditProfile", { user })}
            style={styles.iconButton}
          >
            <Ionicons name="settings-outline" size={24} color="#116530" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => navigation.navigate("Profile")}
          style={styles.iconButton}
        >
          <Ionicons name="person-circle-outline" size={28} color="#116530" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
          <Ionicons name="log-out-outline" size={26} color="#116530" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
    paddingTop: Platform.OS === 'web' ? 12 : 40, // Ajuste para web
    width: '100%',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#116530", // Cor Primária Escura
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'flex-end',
    flex: 1,
    gap: 15,
  },
  iconButton: {
    padding: 5,
  },
  placeholder: {
      flex: 1, // Ocupa o mesmo espaço que os botões
  }
});

export default Header;