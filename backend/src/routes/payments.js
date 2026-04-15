const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { Webhook } = require('standardwebhooks');

// Polar Webhook Secret
const POLAR_WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET || 'fallback_secret';

let cleanSecret = POLAR_WEBHOOK_SECRET;
if (cleanSecret.startsWith('polar_whs_')) {
  cleanSecret = cleanSecret.substring(10);
} else if (cleanSecret.startsWith('whsec_')) {
  cleanSecret = cleanSecret.substring(6);
}

const wh = new Webhook(cleanSecret);

// Polar.sh Webhook Endpoint
// express.raw ile ham veriyi okuyoruz çünkü signature doğrulamasında orijinal raw body gerekiyor.
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const rawBody = req.body.toString('utf8');
    const headers = req.headers;
    
    let payload;
    try {
      // Signature Verification
      payload = wh.verify(rawBody, headers);
    } catch (err) {
      console.error('[Polar Webhook] Signature verification failed:', err.message);
      return res.status(400).send('Webhook Error: Verification failed');
    }

    console.log('=== POLAR WEBHOOK VERIFIED ===');
    console.log('Type:', payload.type);

    // Sadece kabul ettiğimiz event türlerini süzelim
    if (['order.created', 'subscription.created', 'subscription.updated'].includes(payload.type)) {
      const { data } = payload;
      
      // Kullanıcı bilgisini çekmeye çalışalım (metadata destekli veya direkt müşteri emaili)
      const email = data.customer_email || (data.customer && data.customer.email) || data.billing_address?.email;
      const metadataUserId = data.metadata?.user_id || data.custom_field_data?.user_id || data.client_reference_id;

      let user = null;

      // Önce metadata'da UUID var mı diye bakarız
      if (metadataUserId) {
        user = await User.findByPk(metadataUserId);
      } 
      
      // Yok ise email ile eşleştiririz
      if (!user && email) {
        user = await User.findOne({ where: { email: email.toLowerCase() } });
      }

      if (!user) {
        console.error(`[Polar Webhook] User not found for email: ${email} or id: ${metadataUserId}`);
        // 404 dönebiliriz. (Polar bu isteği ileride tekrar edecektir, duruma göre 200 de dönülebilir).
        return res.status(200).send('User not found in system (Acknowledged).');
      }

      const amount = data.amount || 0;
      let tokensToAdd = 0;

      // Fiyattan doğrudan token (kredi) karşılıkları
      if (amount === 1500 || amount === 15) {
        tokensToAdd = 1000;
      } else if (amount === 3900 || amount === 39) {
        tokensToAdd = 5000;
      } else if (amount === 19900 || amount === 199) {
        tokensToAdd = 20000;
      } else {
        console.warn(`[Polar Webhook] Bilinmeyen tutar: ${amount}. Kredi hesaplanamadı.`);
      }

      if (tokensToAdd > 0) {
        user.tokens += tokensToAdd;
        await user.save();
        console.log(`[Polar Webhook] SUCCESS: Kullanıcıya ${tokensToAdd} kredi eklendi. (User: ${user.email}, Yeni Bakiye: ${user.tokens})`);
      }
    }

    // Başarı yanıtı dönerek polar'ın yeniden istek atmasını durduruyoruz.
    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('[Polar Webhook] Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
