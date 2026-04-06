const express = require('express');
const router = express.Router();
const db = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/history - Get logged in user's history
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let whereClause = { userId: req.user.id };
    
    // Add date filter if provided
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.createdAt = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.createdAt = {
        [Op.lte]: new Date(endDate)
      };
    }

    const historyReconds = await db.History.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, history: historyReconds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error retrieving history' });
  }
});

// PATCH /api/history/:id - Update history record (isMailed status)
router.patch('/:id', auth, async (req, res) => {
  try {
    const { isMailed } = req.body;
    const record = await db.History.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!record) {
      return res.status(404).json({ success: false, error: 'History record not found' });
    }

    if (typeof isMailed === 'boolean') {
      record.isMailed = isMailed;
    }

    await record.save();
    res.json({ success: true, record });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error updating history' });
  }
});

// DELETE /api/history/:id - Delete a history record
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('DELETE request for history id:', req.params.id);
    console.log('User id from token:', req.user.id);
    
    const record = await db.History.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!record) {
      console.log('Record not found or user unauthorized for this record');
      return res.status(404).json({ success: false, error: 'History record not found' });
    }

    await record.destroy();
    console.log('Record deleted successfully');
    res.json({ success: true, message: 'History record deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/history/:id:', error);
    res.status(500).json({ success: false, error: 'Server error deleting history' });
  }
});

module.exports = router;
