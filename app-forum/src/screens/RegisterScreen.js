import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Animated,
  Easing,
  Dimensions // Para obter o tamanho da tela
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// Obtém as dimensões da tela para o posicionamento
const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --- Nova Lógica de Animação ---
  // Um único Animated.Value para controlar todo o progresso da animação
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // A animação vai de 0 a 1 e depois volta para 0, em loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 10000, // Metade da duração total (20s)
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true, // A animação de transformação é otimizada
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 10000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Interpolação para a rotação (de 0deg para 360deg)
  const rotateAnimation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Interpolação para a translação (movimento)
  // O movimento será suave do canto superior esquerdo para o inferior direito
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.5, width * 0.1], // De -50% a +10% da largura
  });

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-height * 0.5, height * 0.1], // De -50% a +10% da altura
  });

  const animatedStyle = {
    transform: [
      { translateX: translateX },
      { translateY: translateY },
      { rotate: rotateAnimation },
    ],
  };
  // --- Fim da Nova Lógica de Animação ---

  const handleRegister = async () => { /* Sua lógica de cadastro */ };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Container de fundo com uma cor base e overflow hidden */}
      <View style={styles.backgroundContainer}>
        <Animated.View style={[styles.gradient, animatedStyle]}>
          <LinearGradient
            // As suas cores!
            colors={['#F7D4E0', '#FD7AC0', '#7AD7F0', '#44C8E0']}
            style={styles.gradientInner}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 1, y: 0.7 }}
          />
        </Animated.View>
      </View>

      {/* Conteúdo da tela fica por cima */}
      <SafeAreaView style={styles.contentContainer}>
        {/* Adicione um ScrollView se o conteúdo puder exceder a tela */}
        <Text style={styles.title}>Crie sua conta</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome de Usuário"
          placeholderTextColor="#eee"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#eee"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#eee"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <View style={styles.buttonContainer}>
          <Button title="Cadastrar" onPress={handleRegister} color="#FD7AC0"/>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginText}>Já tem uma conta? Faça login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7bb7f2', // Cor de fundo base do seu CSS
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden', // Garante que o gradiente gigante não cause scroll
  },
  gradient: {
    width: '200%',
    height: '200%',
    opacity: 0.8, // Opacidade do seu CSS
  },
  gradientInner: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'transparent',
    zIndex: 1, // Garante que o conteúdo fique na frente da animação
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#fff",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    color: "#fff",
    fontSize: 16,
  },
  buttonContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  loginText: {
    marginTop: 20,
    color: "#fff",
    textDecorationLine: "underline",
    textAlign: "center",
    fontWeight: "bold",
  },
});

export default RegisterScreen;