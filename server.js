require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 🔹 Correctif : créer la DB si elle n'existe pas avant d'initialiser le pool
const initializeDatabase = async () => {
  try {
    // Connexion temporaire sans DB
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    // Crée la base si elle n'existe pas
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'form_app_db'}`);
    console.log('Database checked/created successfully');

    // Fermer la connexion temporaire
    await tempConnection.end();

    // Crée le pool maintenant sur la DB existante
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'form_app_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Crée la table si elle n'existe pas
    const connection = await pool.getConnection();
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    connection.release();

    console.log('Table initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

let pool; // Déclarer pool ici pour qu’il soit global

// 🔹 Routes identiques au code précédent (GET, POST, DELETE)

// Health check
app.get("/", (req, res) => res.status(200).send("OK"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Backend server running on port ${PORT}`);
  await initializeDatabase();
});
