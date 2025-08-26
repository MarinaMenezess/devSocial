// src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware'); // Para proteger as rotas
const pool = require('../../db');

// Rota para obter informações do próprio usuário (requer autenticação)
router.get('/me', authMiddleware.verifyToken, userController.getMe);

// Rota para obter os posts do usuário logado (requer autenticação)
router.get('/me/posts', authMiddleware.verifyToken, userController.getMyPosts);

// Rota para obter os posts favoritados pelo usuário logado (requer autenticação)
router.get('/me/favorites', authMiddleware.verifyToken, userController.getMyFavoritePosts);

// Rota para atualizar o perfil do usuário (requer autenticação)
router.put('/me', authMiddleware.verifyToken, userController.updateProfile);

// Endpoint adicional para buscar likes de um usuário (para o frontend saber o que colorir)
// Este endpoint pode ser usado pelo frontend para popular o `userLikes` ao carregar a HomeScreen
router.get('/likes', authMiddleware.verifyToken, async (req, res) => {
  try {
      const [rows] = await pool.query('SELECT post_id FROM likes WHERE user_id = ?', [req.user.id]);
      res.status(200).json(rows);
  } catch (error) {
      console.error('Erro ao buscar likes do usuário:', error);
      res.status(500).json({ message: 'Erro interno do servidor ao buscar likes do usuário.' });
  }
});

// Endpoint adicional para buscar os IDs dos posts favoritados por um usuário
router.get('/me/favorites/ids', authMiddleware.verifyToken, async (req, res) => {
  try {
      const [rows] = await pool.query('SELECT post_id FROM favorites WHERE user_id = ?', [req.user.id]);
      res.status(200).json(rows);
  } catch (error) {
      console.error('Erro ao buscar IDs de posts favoritos do usuário:', error);
      res.status(500).json({ message: 'Erro interno do servidor ao buscar IDs de posts favoritos.' });
  }
});


module.exports = router;