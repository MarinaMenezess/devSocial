import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  // Definimos isLoading como false, pois não vamos mais esperar o carregamento do token
  const [isLoading, setIsLoading] = useState(false); 

  const signIn = async (token, userData) => {
    try {
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
    } catch (e) {
      console.error('Erro ao salvar token no AsyncStorage', e);
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setUserToken(null);
    } catch (e) {
      console.error('Erro ao remover token do AsyncStorage:', e);
    }
  };

  // MODIFICAÇÃO: O useEffect foi alterado para não carregar mais o token ao iniciar.
  // Isto força a aplicação a começar sempre como se o utilizador estivesse deslogado.
  useEffect(() => {
    // A lógica para carregar o token foi removida daqui.
    // Se quiser reverter para o comportamento normal (lembrar o login),
    // basta adicionar a função loadToken de volta aqui.
  }, []);

  return (
    <AuthContext.Provider value={{ userToken, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;