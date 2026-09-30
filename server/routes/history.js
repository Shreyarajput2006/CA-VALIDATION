const express = require('express');
const Validation = require('../models/Validation');

const router = express.Router();

// Save validation
router.post('/save', async (req, res) => {
  try {
    const validation = await Validation.create(req.body);
    res.json(validation);
  } catch (err) {
    res.status(500).json({ message: 'Error saving history' });
  }
});

// Get history with filters
router.get('/', async (req, res) => {
  try {
    const { userId, type, status, date } = req.query;

   let filter = { userId };

    if (type) filter.type = type;
    if (status) filter.status = status;

    if (date) {
      const start = new Date(date);
      const end = new Date(date);

      end.setDate(end.getDate() + 1);

      filter.createdAt = {
        $gte: start,
        $lt: end
      };
    }

    const history = await Validation
      .find(filter)
      .sort({ createdAt: -1 });

    res.json(history);

  } catch (err) {
    res.status(500).json({ message: 'Error fetching history' });
  }
});

router.get('/stats', async (req, res) => {

  try {

    const { userId } = req.query;

    const total = await Validation.countDocuments({ userId });

    const success = await Validation.countDocuments({
      userId,
      status: 'Valid'
    });

    const failed = await Validation.countDocuments({
      userId,
      status: 'Invalid'
    });

    res.json({
      total,
      success,
      failed
    });

  } catch (err) {

    res.status(500).json({ message: 'Error fetching stats' });

  }

});

// Delete single history record
router.delete('/:id', async (req, res) => {

  try {

    await Validation.findByIdAndDelete(req.params.id);

    res.json({ message: 'Record deleted' });

  } catch (err) {

    res.status(500).json({ message: 'Delete failed' });

  }

});





module.exports = router;