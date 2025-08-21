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
  Dimensions,
  Platform // Para sombras
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get('window');
const GRADIENT_SIZE = Math.max(width, height) * 2.5;

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 1. Estado para controlar o foco
  const [focusedInput, setFocusedInput] = useState(null);

  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 10000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
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

  const rotateAnimation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.25, width * 0.25],
  });

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-height * 0.25, height * 0.25],
  });

  const animatedStyle = {
    transform: [
      { translateX: translateX },
      { translateY: translateY },
      { rotate: rotateAnimation },
    ],
  };

  const handleRegister = async () => { /* Sua lógica */ };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.backgroundContainer}>
        <Animated.View style={[styles.gradient, animatedStyle]}>
          <LinearGradient
            colors={['#A3EBB1', '#116530', '#18A558', '#21B6A8']}
            style={styles.gradientInner}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 1, y: 0.7 }}
          />
        </Animated.View>
      </View>

      <SafeAreaView style={styles.contentContainer}>
        <Text style={styles.title}>Crie sua conta</Text>
        
        {/* 2. Aplicar os estilos e handlers de foco/blur */}
        <TextInput
          style={[styles.input, focusedInput === 'username' && styles.inputFocused]}
          placeholder="Nome de Usuário"
          placeholderTextColor="#eee"
          value={username}
          onChangeText={setUsername}
          onFocus={() => setFocusedInput('username')}
          onBlur={() => setFocusedInput(null)}
        />
        <TextInput
          style={[styles.input, focusedInput === 'email' && styles.inputFocused]}
          placeholder="E-mail"
          placeholderTextColor="#eee"
          value={email}
          onChangeText={setEmail}
          onFocus={() => setFocusedInput('email')}
          onBlur={() => setFocusedInput(null)}
        />
        <TextInput
          style={[styles.input, focusedInput === 'password' && styles.inputFocused]}
          placeholder="Senha"
          placeholderTextColor="#eee"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          onFocus={() => setFocusedInput('password')}
          onBlur={() => setFocusedInput(null)}
        />
        
        <View style={styles.buttonContainer}>
          <Button title="Cadastrar" onPress={handleRegister} color="#116530"/>
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
    backgroundColor: '#21B6A8',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gradient: {
    width: GRADIENT_SIZE,
    height: GRADIENT_SIZE,
    left: (width - GRADIENT_SIZE) / 2,
    top: (height - GRADIENT_SIZE) / 2,
    opacity: 0.8,
  },
  gradientInner: {
    flex: 1,
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '60%',
    height: '70%',
    padding: 40,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#fff",
    textAlign: "center",
  },
  input: {
    width: "80%",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 40,
    marginBottom: 15,
    color: "#fff",
    fontSize: 16,
    textAlign: 'flex-start'
  },
  // 3. Novo estilo para o estado focado
  inputFocused: {
    borderColor: 'rgba(255, 255, 255, 1)', // Borda mais visível
    backgroundColor: "rgba(255, 255, 255, 0.3)", // Simula o brilho interior
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    outlineStyle: 'none',
  },
  buttonContainer: {
    width: '30%',
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