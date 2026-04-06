const express = require('express');
const placesService = require('../services/placesServiceSimple');
const auth = require('../middleware/auth');
const db = require('../models');

const router = express.Router();

router.post('/search', auth, async (req, res) => {
  const { sector, city } = req.body;

  if (!sector || !city) {
    return res.status(400).json({
      success: false,
      error: 'Sector and city are required'
    });
  }

  try {
    const result = await placesService.searchPlaces(sector.trim(), city.trim());
    
    if (result.success) {
      const placesCount = result.places.length;
      
      // Token Deduction Logic (1 token per lead)
      const user = await db.User.findByPk(req.user.id);
      if (!user || user.tokens < placesCount) {
        return res.status(402).json({
          success: false,
          error: `Yetersiz Token. Bu arama ${placesCount} token gerektiriyor, bakiyeniz: ${user ? user.tokens : 0}`
        });
      }

      // Deduct tokens
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
