const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const placesRoutes = require('./routes/places');
const scrapingRoutes = require('./routes/scraping');
const authRoutes = require('./routes/auth');
const historyRoutes = require('./routes/history');
const adminRoutes = require('./routes/admin');
const db = require('./models');

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/places', placesRoutes);
app.use('/api/scrape', scrapingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'B2B Lead Generation Backend is running',
    timestamp: new Date().toISOString()
  });
});

db.sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error("Failed to sync database:", err);
});
