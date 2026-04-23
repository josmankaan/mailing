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

// Backend tabanlı Email Doğrulama Rotası (Email içerisindeki link direkt buraya gelir)
app.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await db.User.findOne({ where: { verificationToken: token } });

    if (!user) {
      return res.status(400).send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 100px;">
          <h2 style="color: #ef4444;">Link Geçersiz veya Süresi Dolmuş</h2>
          <p>Lütfen hesabınıza giriş yapın veya yeni bir doğrulama talebinde bulunun.</p>
          <a href="https://atlasdatamining.com" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Ana Sayfaya Dön</a>
        </div>
      `);
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    // Başarılı doğrulama mesajı ve yönlendirme
    res.send(`
      <div style="font-family: sans-serif; text-align: center; margin-top: 100px;">
        <h2 style="color: #22c55e;">E-posta Başarıyla Doğrulanıp Aktive Edildi!</h2>
        <p>Atlas Data Mining hesabınız başarıyla aktifleştirildi.</p>
        <a href="https://atlasdatamining.com" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Sisteme Giriş Yapın</a>
      </div>
    `);
  } catch (error) {
    console.error('Verification mapping error:', error);
    res.status(500).send('<div style="text-align:center;margin-top:50px;"><h2>Sunucu Hatası</h2></div>');
  }
});

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
