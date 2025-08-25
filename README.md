# Projeto Rede Social

Aplicativo de fórum estilo Twitter desenvolvido com **React Native for Web (Expo)** no frontend e **Node.js (Express)** com **MySQL** no backend. O projeto implementa funcionalidades essenciais como autenticação de usuários, criação de posts, curtidas, comentários, favoritos e gerenciamento de perfil.

## Tecnologias Utilizadas
- **Frontend:** React Native for Web (Expo)  
- **Backend:** Node.js com Express  
- **Banco de Dados:** MySQL  
- **Principais bibliotecas:**  
  - express, mysql2, bcryptjs, jsonwebtoken, multer, cors (backend)  
  - @react-navigation/native, axios, async-storage, expo-image-picker (frontend)  

## Funcionalidades
- Cadastro e login de usuários com autenticação JWT  
- Criação, edição e exclusão de posts e comentários  
- Curtir e favoritar publicações  
- Upload e gerenciamento de fotos de perfil e imagens em posts  
- Visualização de posts favoritos no perfil  
- Interface responsiva para web e mobile  

## Pré-requisitos
Antes de começar, instale em sua máquina:
- [Node.js (com npm)](https://nodejs.org/en/download/)  
- [MySQL Server](https://dev.mysql.com/downloads/mysql/)  
- [Expo CLI](https://docs.expo.dev/get-started/installation/)  

---

## Instalação

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
```

### 2. Configurar o Backend
```bash
mkdir backend
cd backend
npm install
```
Edite o arquivo `db.js` com suas credenciais do MySQL.

#### Crie o banco de dados:
```sql
CREATE DATABASE forum_db;
```
Execute os scripts SQL para criar as tabelas `users`, `posts`, `comments`, `likes`, `favorites`.

#### Inicie o servidor:
```bash
node server.js
```
> O backend rodará em [http://localhost:3001](http://localhost:3001).

---

### 3. Configurar o Frontend
```bash
cd ..
cd app-forum
npm install
```
Edite `src/services/api.js` para ajustar a URL da API:
```javascript
const API_BASE_URL = 'http://localhost:3001/api';
```
> Em dispositivos físicos ou emuladores, substitua `localhost` pelo IP da sua máquina.

#### Inicie o frontend:
```bash
npx expo start --web
```

---

## Melhorias Implementadas
- Interface responsiva com tema visual unificado  
- Feedback visual nos botões (favoritar/curtir)  
- Exibição do nome do usuário logado na Home  
- Paginação de posts para melhorar desempenho  
- Tratamento de erros com mensagens amigáveis  
- Refatoração de componentes reutilizáveis  

---

## Como Usar
1. Acesse a tela de **registro** para criar sua conta.  
2. Faça **login** para acessar o feed de posts.  
3. Publique, curta, comente e favorite posts.  
4. Gerencie seu perfil e visualize seus favoritos na aba correspondente.  

---

## Entrega
- Repositório com o projeto pronto  
- Vídeo demonstrando as funcionalidades e o fluxo completo do aplicativo  

---

## Autor
**Marina Menezes**  
Desenvolvido como projeto prático do curso **Técnico em Informática (SENAC RS)**  
Orientador: **Prof. Iuri Nascimento Santos**
