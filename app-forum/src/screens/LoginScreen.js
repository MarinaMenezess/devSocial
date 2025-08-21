import React, { useState, useContext, useEffect, useRef } from 'react';
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
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import AuthContext from '../context/AuthContext';

const { width, height } = Dimensions.get('window');
const GRADIENT_SIZE = Math.max(width, height) * 2.5;

const LoginScreen = ({ navigation }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const { signIn } = useContext(AuthContext);

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
  }, [animatedValue]);

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

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
    try {
      const response = await api.post('/auth/login', { identifier, password });
      await signIn(response.data.token, response.data.user);
    } catch (error) {
      console.error('Erro no login:', error.response?.data || error.message);
      Alert.alert('Erro no Login', error.response?.data?.message || 'Ocorreu um erro ao tentar fazer login.');
    }
  };

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
        <Text style={styles.title}>Bem-vindo!</Text>
        
        <TextInput
          style={[styles.input, focusedInput === 'identifier' && styles.inputFocused]}
          placeholder="Usuário ou E-mail"
          placeholderTextColor="#eee"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          onFocus={() => setFocusedInput('identifier')}
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
          <Button title="Entrar" onPress={handleLogin} color="#116530"/>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.switchScreenText}>Não tem uma conta? Cadastre-se</Text>
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
  inputFocused: {
    borderColor: 'rgba(255, 255, 255, 1)',
    backgroundColor: "rgba(255, 255, 255, 0.3)",
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
  switchScreenText: {
    marginTop: 20,
    color: "#fff",
    textDecorationLine: "underline",
    textAlign: "center",
    fontWeight: "bold",
  },
});

export default LoginScreen;