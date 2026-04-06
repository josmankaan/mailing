const axios = require('axios');
const cheerio = require('cheerio');

class ScrapingService {
  constructor() {
    this.emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    this.timeout = 10000; // 10 seconds
  }

  async scrapeWebsite(url) {
    try {
      // Ensure URL has protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      console.log(`Scraping: ${url}`);

      // Use axios with older version
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      const $ = cheerio.load(response.data);
      const pageText = $('body').text();

      // Extract emails using regex
      const emails = this.extractEmails(pageText);

      // Also check specific elements that commonly contain emails
      const specificElements = ['a[href^="mailto:"]', 'span[class*="email"]', 'div[class*="email"]', '.email', '[data-email]'];
      
      specificElements.forEach(selector => {
        $(selector).each((i, element) => {
          const text = $(element).text() || $(element).attr('href') || $(element).data('email');
          const foundEmails = this.extractEmails(text);
          emails.push(...foundEmails);
        });
      });

      // Remove duplicates and filter
      const uniqueEmails = [...new Set(emails)]
        .filter(email => this.isValidEmail(email))
        .map(email => email.toLowerCase());

      return {
        success: true,
        url: url,
        emails: uniqueEmails,
        emailCount: uniqueEmails.length
      };

    } catch (error) {
      console.error(`Scraping error for ${url}:`, error.message);
      return {
        success: false,
        url: url,
        error: error.message,
        emails: [],
        emailCount: 0
      };
    }
  }

  extractEmails(text) {
    if (!text) return [];
    
    const matches = text.match(this.emailRegex);
    return matches || [];
  }

  isValidEmail(email) {
    // Basic email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && !email.includes('..') && email.length > 5 && email.length < 100;
  }

  async scrapeMultipleWebsites(websites, progressCallback) {
    const results = [];
    const total = websites.length;

    for (let i = 0; i < websites.length; i++) {
      const website = websites[i];
      
      // Update progress
      if (progressCallback) {
        progressCallback({
          current: i + 1,
          total: total,
          percentage: Math.round(((i + 1) / total) * 100),
          currentWebsite: website
        });
      }

      // Add delay between requests to be respectful
      if (i > 0) {
        await this.delay(1000); // 1 second delay
      }

      const result = await this.scrapeWebsite(website);
      results.push(result);
    }

    return results;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get scraping statistics
  getStats(results) {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalEmails = results.reduce((sum, r) => sum + r.emailCount, 0);
    const uniqueEmails = [...new Set(results.flatMap(r => r.emails))];

    return {
      totalWebsites: results.length,
      successful,
      failed,
      totalEmails,
      uniqueEmailCount: uniqueEmails.length,
      uniqueEmails
    };
  }
}

module.exports = new ScrapingService();
