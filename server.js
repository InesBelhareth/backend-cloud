require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'form_app_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Create table if it doesn't exist
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
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Routes

// Get all submissions
app.get('/api/submissions', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [submissions] = await connection.execute(
      'SELECT * FROM submissions ORDER BY created_at DESC'
    );
    connection.release();
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Submit form with image
app.post('/api/submit', upload.single('image'), async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const image = req.file ? `uploads/${req.file.filename}` : null;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const connection = await pool.getConnection();
    await connection.execute(
      'INSERT INTO submissions (name, email, message, image) VALUES (?, ?, ?, ?)',
      [name, email, message, image]
    );
    connection.release();

    res.json({ message: 'Submission received successfully' });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

// Delete a submission
app.delete('/api/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the image path first
    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      'SELECT image FROM submissions WHERE id = ?',
      [id]
    );

    if (result.length > 0 && result[0].image) {
      const imagePath = path.join(__dirname, result[0].image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await connection.execute('DELETE FROM submissions WHERE id = ?', [id]);
    connection.release();

    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  initializeDatabase();
});
