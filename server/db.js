const mysql = require("mysql2/promise"); // Importa o mysql2 com suporte a Promises
require("dotenv/config");

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DATABASE
};

// Cria um pool de conexões
const pool = mysql.createPool(dbConfig);

// Testa a conexão ao iniciar o pool
pool
  .getConnection()
  .then((connection) => {
    console.log("Conectado ao MySQL com sucesso!");
    connection.release(); // Libera a conexão de volta para o pool
  })
  .catch((err) => {
    console.error("Erro ao conectar ao MySQL:", err.message);
    process.exit(1); // Encerra o processo se a conexão falhar
  });

module.exports = pool; // Exporta o pool para ser usado em outras partes do app
