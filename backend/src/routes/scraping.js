const express = require('express');
const scrapingService = require('../services/scrapingServiceSimple');
const auth = require('../middleware/auth');
const db = require('../models');

const router = express.Router();

// Store scraping jobs in memory (for demo purposes)
const scrapingJobs = new Map();

// POST /api/scrape/emails - Start email scraping
router.post('/emails', auth, async (req, res) => {
  const { websites, sector, city, placesData, historyId } = req.body;

  if (!websites || !Array.isArray(websites)) {
    return res.status(400).json({
      success: false,
      error: 'Websites array is required'
    });
  }

  if (websites.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'At least one website is required'
    });
  }

  if (websites.length > 20) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 20 websites allowed per request'
    });
  }

  // Verify user exists
  const user = await db.User.findByPk(req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Generate unique job ID
  const jobId = Date.now().toString(36) + Math.random().toString(36).substr(2);

  // Initialize job
  scrapingJobs.set(jobId, {
    id: jobId,
    status: 'processing',
    progress: {
      current: 0,
      total: websites.length,
      percentage: 0
    },
    results: [],
    startTime: new Date(),
    endTime: null
  });

  // Start scraping in background
  scrapeWebsitesAsync(jobId, websites, req.user.id, sector, city, placesData, historyId);

  res.json({
    success: true,
    jobId: jobId,
    message: 'Scraping started',
    totalWebsites: websites.length
  });
});

// GET /api/scrape/status/:jobId - Get scraping status
router.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = scrapingJobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found'
    });
  }

  res.json({
    success: true,
    job: {
      id: job.id,
      status: job.status,
      progress: job.progress,
      results: job.results,
      resultCount: job.results.length,
      startTime: job.startTime,
      endTime: job.endTime
    }
  });
});

// GET /api/scrape/results/:jobId - Get scraping results
router.get('/results/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = scrapingJobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found'
    });
  }

  if (job.status !== 'completed') {
    return res.status(400).json({
      success: false,
      error: 'Job not completed yet'
    });
  }

  const stats = scrapingService.getStats(job.results);

  res.json({
    success: true,
    jobId: jobId,
    stats: stats,
    results: job.results
  });
});

// Async function to handle scraping
async function scrapeWebsitesAsync(jobId, websites, userId, sector, city, placesData, historyId) {
  const job = scrapingJobs.get(jobId);
  
  try {
    const results = await scrapingService.scrapeMultipleWebsites(
      websites,
      (progress) => {
        // Update progress
        job.progress = progress;
        scrapingJobs.set(jobId, job);
      }
    );

    // Extraction of emails is now included in the initial lead extraction cost.
    // No tokens deducted here.

    // Prepare History Data
    let enrichedData = results;
    if (placesData && Array.isArray(placesData)) {
      enrichedData = placesData.map(place => {
        const match = results.find(r => 
          r.url === place.website || (place.website && place.website.includes(r.url)) || (r.url && r.url.includes(place.website))
        );
        return {
          ...place,
          socials: match ? match.socials : null,
          scrapedEmails: match ? match.emails : [],
          scrapedJunkEmails: match ? match.junkEmails : []
        };
      });
    }

    // Save or Update history
    if (historyId) {
      const existingHistory = await db.History.findByPk(historyId);
      if (existingHistory) {
        existingHistory.dataPayload = JSON.stringify(enrichedData);
        await existingHistory.save();
        console.log(`History record ${historyId} updated with enriched data`);
      } else {
        // Fallback if record was deleted in the meantime
        await db.History.create({
          userId: userId,
          sector: sector || '',
          city: city || '',
          dataPayload: JSON.stringify(enrichedData)
        });
      }
    } else {
      // Create new history if no historyId provided
      await db.History.create({
        userId: userId,
        sector: sector || '',
        city: city || '',
        dataPayload: JSON.stringify(enrichedData)
      });
    }

    // Update job with results
    job.status = 'completed';
    job.results = results;
    job.endTime = new Date();
    scrapingJobs.set(jobId, job);

    console.log(`Scraping job ${jobId} completed and DB updated/saved`);

  } catch (error) {
    console.error(`Scraping job ${jobId} failed:`, error);
    job.status = 'failed';
    job.error = error.message;
    job.endTime = new Date();
    scrapingJobs.set(jobId, job);
  }
}

// Clean up old jobs (older than 1 hour)
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  for (const [jobId, job] of scrapingJobs.entries()) {
    if (job.endTime && job.endTime < oneHourAgo) {
      scrapingJobs.delete(jobId);
    }
  }
}, 30 * 60 * 1000); // Clean up every 30 minutes

module.exports = router;
