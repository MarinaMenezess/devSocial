// server/src/routes/postRoutes.js

const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rota para buscar posts (com ou sem pesquisa)
router.get('/', postController.searchPosts);

// Rota para buscar um post específico
router.get('/:id', postController.getPostById);

// Rota para criar um post
router.post('/', authMiddleware.verifyToken, postController.createPost);

// Rota para atualizar um post
router.put('/:id', authMiddleware.verifyToken, postController.updatePost);

// Rota para deletar um post
router.delete('/:id', authMiddleware.verifyToken, postController.deletePost);

// Rota CORRIGIDA para curtir/descurtir um post
// Esta é a linha 25 que estava causando o erro
router.post('/:postId/like', authMiddleware.verifyToken, postController.toggleLike);

// Rota para favoritar/desfavoritar um post
router.post('/:postId/favorite', authMiddleware.verifyToken, postController.toggleFavorite);

module.exports = router;