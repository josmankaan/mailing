const express = require('express');
const placesService = require('../services/placesServiceSimple');
const auth = require('../middleware/auth');
const db = require('../models');

const router = express.Router();

router.post('/search', auth, async (req, res) => {
  const { sector, city, leadLimit } = req.body;

  if (!sector || !city) {
    return res.status(400).json({
      success: false,
      error: 'Sector and city are required'
    });
  }

  // Geçerli lead limiti: 20, 40 veya 60. Varsayılan: 20
  const VALID_LIMITS = [20, 40, 60];
  const resolvedLimit = VALID_LIMITS.includes(Number(leadLimit)) ? Number(leadLimit) : 20;

  try {
    const result = await placesService.searchPlaces(sector.trim(), city.trim(), resolvedLimit);
    
    if (result.success) {
      const placesCount = result.places.length;

      // ─── Token Kontrolü ───────────────────────────────────────────────────
      // Token miktarı artık dinamik: pagination ile kaç sonuç geldiyse o kadar
      // token düşülür (1 token = 1 lead). Bakiye yetersizse işlem başlamaz.
      const user = await db.User.findByPk(req.user.id);
      if (!user || user.tokens < placesCount) {
        return res.status(402).json({
          success: false,
          error: `Yetersiz Token. Bu arama ${placesCount} token gerektiriyor, bakiyeniz: ${user ? user.tokens : 0}`
        });
      }

      // Token düşüşü: pagination tamamlandıktan sonra, scraping başlamadan önce
      user.tokens -= placesCount;
      await user.save();

      // Auto-save to History
      const historyRecord = await db.History.create({
        userId: req.user.id,
        sector: sector.trim(),
        city: city.trim(),
        dataPayload: JSON.stringify(result.places)
      });

      res.json({
        success: true,
        places: result.places,
        count: placesCount,
        tokensDeducted: placesCount,
        tokensRemaining: user.tokens,
        historyId: historyRecord.id
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Search places error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
