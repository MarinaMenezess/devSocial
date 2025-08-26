// server/src/controllers/postController.js

const pool = require('../../db');

// ... (outras funções: createPost, searchPosts, etc., permanecem as mesmas)

// Função para CRIAR um novo post
exports.createPost = async (req, res) => {
  const { title, content, image_url } = req.body; // Corrigido para pegar image_url
  const userId = req.user.id; 

  if (!title || !content) {
    return res.status(400).json({ message: 'Título e conteúdo são obrigatórios.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO posts (user_id, title, content, image_url) VALUES (?, ?, ?, ?)',
      [userId, title, content, image_url || null] // Usar o image_url do body
    );
    res.status(201).json({
      message: 'Post criado com sucesso!',
      postId: result.insertId,
    });
  } catch (error) {
    console.error('Erro ao criar post:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao criar o post.' });
  }
};

// Função para BUSCAR todos os posts (com funcionalidade de pesquisa)
exports.searchPosts = async (req, res) => {
  const { q } = req.query;
  // Opcional: obter o ID do usuário do token se ele estiver logado para verificar se ele curtiu o post
  const token = req.headers.authorization?.split(' ')[1];
  let userId = null;
  if (token) {
      try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'senhajwt');
          userId = decoded.id;
      } catch (e) {
          // Token inválido ou expirado, continua sem userId
      }
  }

  let query = `
    SELECT
        p.id, p.title, p.content, p.image_url, p.created_at, p.updated_at,
        u.id AS user_id, u.username, u.profile_picture_url,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count
    FROM posts p
    JOIN users u ON p.user_id = u.id
  `;
  let params = [];

  if (q) {
    query += ` WHERE p.title LIKE ? OR p.content LIKE ?`;
    params.push(`%${q}%`, `%${q}%`);
  }

  query += ` ORDER BY p.created_at DESC`;

  try {
    const [rows] = await pool.query(query, params);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar/pesquisar posts:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar/pesquisar posts.' });
  }
};


// Função para BUSCAR um post específico pelo ID
exports.getPostById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(`
        SELECT
            p.id, p.title, p.content, p.image_url, p.created_at, p.updated_at,
            u.id AS user_id, u.username, u.profile_picture_url,
            (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes_count,
            (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
      `, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Post não encontrado.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar post por ID:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// ... (funções updatePost e deletePost permanecem as mesmas)
exports.updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const userId = req.user.id;

  if (!title || !content) {
    return res.status(400).json({ message: 'Título e conteúdo são obrigatórios.' });
  }

  try {
    const [post] = await pool.query('SELECT * FROM posts WHERE id = ? AND user_id = ?', [id, userId]);
    if (post.length === 0) {
      return res.status(404).json({ message: 'Post não encontrado ou você não tem permissão para editá-lo.' });
    }

    await pool.query(
      'UPDATE posts SET title = ?, content = ? WHERE id = ?',
      [title, content, id]
    );
    res.status(200).json({ message: 'Post atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar post:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

exports.deletePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [post] = await pool.query('SELECT * FROM posts WHERE id = ? AND user_id = ?', [id, userId]);
    if (post.length === 0) {
      return res.status(404).json({ message: 'Post não encontrado ou você não tem permissão para deletá-lo.' });
    }

    await pool.query('DELETE FROM posts WHERE id = ?', [id]);
    res.status(200).json({ message: 'Post deletado com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar post:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};


// Função para CURTIR/DESCUTIR um post
exports.toggleLike = async (req, res) => {
  // Alterado para postId para corresponder à rota corrigida
  const { postId } = req.params; 
  const userId = req.user.id;

  try {
    const [like] = await pool.query('SELECT * FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId]);

    if (like.length > 0) {
      await pool.query('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
      // Adicionado 'liked: false' para ajudar o frontend a atualizar o estado
      res.status(200).json({ message: 'Like removido.', liked: false });
    } else {
      await pool.query('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [postId, userId]);
      // Adicionado 'liked: true'
      res.status(200).json({ message: 'Post curtido!', liked: true });
    }
  } catch (error) {
    console.error('Erro ao curtir/descurtir post:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// Adicione esta função que estava faltando no seu controller original
exports.toggleFavorite = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    try {
        const [favorite] = await pool.query('SELECT * FROM favorites WHERE post_id = ? AND user_id = ?', [postId, userId]);

        if (favorite.length > 0) {
            await pool.query('DELETE FROM favorites WHERE post_id = ? AND user_id = ?', [postId, userId]);
            res.status(200).json({ message: 'Favorito removido.', favorited: false });
        } else {
            await pool.query('INSERT INTO favorites (post_id, user_id) VALUES (?, ?)', [postId, userId]);
            res.status(201).json({ message: 'Post adicionado aos favoritos.', favorited: true });
        }
    } catch (error) {
        console.error('Erro ao favoritar/desfavoritar post:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};