import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Button,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";

const Header = ({ title, user }) => {
  const navigation = useNavigation();
  const { signOut } = useContext(AuthContext);

  const handleLogout = () => {
    signOut();
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={28} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerButtons}>
        {!!user && (
          <TouchableOpacity
            onPress={() => navigation.navigate("EditProfile", { user })}
            style={styles.editButton}
          >
            <Ionicons name="settings-outline" size={24} color="#007bff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => navigation.navigate("Profile")}
          style={styles.profileButton}
        >
          <Ionicons name="person-circle-outline" size={30} color="#007bff" />
        </TouchableOpacity>
        <Button title="Sair" onPress={handleLogout} />
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
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingTop: 40,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  profileButton: {
    marginRight: 15,
  },
  editButton: {
    padding: 5,
  },
});

export default Header;
