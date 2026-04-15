const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const placesRoutes = require('./routes/places');
const scrapingRoutes = require('./routes/scraping');
const authRoutes = require('./routes/auth');
const historyRoutes = require('./routes/history');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Webhook body'si raw olarak okunması gerektiği için, payments route'unu json() parser'ından önce tanımlıyoruz.
app.use('/api/payments', paymentRoutes);

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

db.sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error("Failed to sync database:", err);
});
