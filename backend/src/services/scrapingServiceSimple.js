const https = require('https');
const http = require('http');
const cheerio = require('cheerio');
const URL = require('url').URL;
const zlib = require('zlib');

class ScrapingService {
  constructor() {
    this.emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.timeout = 15000; // 15 seconds
  }

  async scrapeWebsite(url) {
    try {
      // Ensure URL has protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      console.log(`Starting deep scrape: ${url}`);
      const allEmails = new Set();
      const allJunkEmails = new Set();
      const allSocials = { instagram: null, linkedin: null, facebook: null, twitter: null };

      const mergeSocials = (newSocials) => {
        if (!allSocials.instagram && newSocials?.instagram) allSocials.instagram = newSocials.instagram;
        if (!allSocials.linkedin && newSocials?.linkedin) allSocials.linkedin = newSocials.linkedin;
        if (!allSocials.facebook && newSocials?.facebook) allSocials.facebook = newSocials.facebook;
        if (!allSocials.twitter && newSocials?.twitter) allSocials.twitter = newSocials.twitter;
      };

      // Scrape main page and find contact links
      const mainPageResult = await this.scrapeSinglePage(url);
      (mainPageResult?.emails || []).forEach(email => allEmails.add(email));
      (mainPageResult?.junkEmails || []).forEach(email => allJunkEmails.add(email));
      if (mainPageResult?.socials) mergeSocials(mainPageResult.socials);
      
      // Find contact page links
      const contactLinks = await this.findContactLinks(url);
      console.log(`Found ${contactLinks.length} contact page links:`, contactLinks);

      // Scrape contact pages
      for (const link of contactLinks) {
        try {
          await this.delay(1000); // Respect rate limiting
          const contactPageResult = await this.scrapeSinglePage(link);
          (contactPageResult?.emails || []).forEach(email => allEmails.add(email));
          (contactPageResult?.junkEmails || []).forEach(email => allJunkEmails.add(email));
          if (contactPageResult?.socials) mergeSocials(contactPageResult.socials);
          console.log(`Scraped contact page: ${link}, found ${(contactPageResult?.emails || []).length} emails`);
        } catch (error) {
          console.warn(`Failed to scrape contact page ${link}:`, error.message);
        }
      }

      let uniqueEmails = Array.from(allEmails).filter(email => this.isValidEmail(email));
      const finalFilterResult = this.cleanAndFilterEmails(uniqueEmails);
      
      uniqueEmails = finalFilterResult.cleaned;
      finalFilterResult.junk.forEach(email => allJunkEmails.add(email));
      
      const uniqueJunkEmails = Array.from(allJunkEmails);

      console.log(`Total unique emails found for ${url}: ${uniqueEmails.length}`);
      if (uniqueEmails.length > 0) {
        console.log('Found emails:', uniqueEmails);
      }

      return {
        success: true,
        url: url,
        emails: uniqueEmails,
        junkEmails: uniqueJunkEmails,
        emailCount: uniqueEmails.length,
        socials: allSocials
      };

    } catch (error) {
      console.error(`Scraping error for ${url}:`, error.message);
      
      // If it's a 301 redirect, try to follow it
      if (error.message.includes('301') || error.message.includes('Moved Permanently')) {
        console.log(`Attempting to follow redirect for ${url}`);
        try {
          // Try HTTPS version
          if (url.startsWith('http://')) {
            const httpsUrl = url.replace('http://', 'https://');
            console.log(`Trying HTTPS version: ${httpsUrl}`);
            return await this.scrapeWebsite(httpsUrl);
          }
        } catch (redirectError) {
          console.error(`Redirect failed for ${url}:`, redirectError.message);
        }
      }
      
      return {
        success: false,
        url: url,
        error: error.message,
        emails: [],
        junkEmails: [],
        emailCount: 0,
        socials: { instagram: null, linkedin: null, facebook: null, twitter: null }
      };
    }
  }

  async scrapeSinglePage(url) {
    console.log(`Scraping page: ${url}`);
    
    const html = await this.fetchHtml(url);
    console.log(`HTML length: ${html.length}`);
    console.log(`First 500 chars: ${html.substring(0, 500)}`);
    
    const $ = cheerio.load(html);
    const allEmails = new Set();
    const socials = { instagram: null, linkedin: null, facebook: null, twitter: null };

    // Extract emails from raw HTML text (more aggressive)
    const rawHtml = $.html();
    const htmlEmails = this.extractEmails(rawHtml);
    (htmlEmails || []).forEach(email => allEmails.add(email));

    // Extract emails from body text
    const pageText = $('body').text();
    console.log(`Body text length: ${pageText.length}`);
    console.log(`Body text first 500 chars: ${pageText.substring(0, 500)}`);
    
    const textEmails = this.extractEmails(pageText);
    (textEmails || []).forEach(email => allEmails.add(email));

    // Extract emails and social links from anchor tags
    $('a[href]').each((i, element) => {
      const href = $(element).attr('href');
      const lowerHref = href.toLowerCase();
      
      if (lowerHref.startsWith('mailto:')) {
        const email = href.replace(/^mailto:/i, '').split('?')[0];
        if (this.isValidEmail(email)) {
          allEmails.add(email);
        }
      }

      // Social Links extraction
      if (!socials.instagram && lowerHref.includes('instagram.com/') && !lowerHref.includes('explore/tags')) {
        socials.instagram = href;
      }
      if (!socials.linkedin && (lowerHref.includes('linkedin.com/company/') || lowerHref.includes('linkedin.com/in/'))) {
        socials.linkedin = href;
      }
      if (!socials.facebook && lowerHref.includes('facebook.com/') && !lowerHref.includes('sharer/')) {
        socials.facebook = href;
      }
      if (!socials.twitter && (lowerHref.includes('twitter.com/') || lowerHref.includes('x.com/')) && !lowerHref.includes('intent/tweet')) {
        socials.twitter = href;
      }
    });

    // Check specific elements that commonly contain emails
    const specificElements = ['span[class*="email"]', 'div[class*="email"]', '.email', '[data-email]', 'td[class*="email"]', 'p[class*="email"]'];
    
    specificElements.forEach(selector => {
      $(selector).each((i, element) => {
        const text = $(element).text() || $(element).data('email');
        const foundEmails = this.extractEmails(text);
        (foundEmails || []).forEach(email => allEmails.add(email));
      });
    });

    // Also check all elements for email patterns
    $('*').each((i, element) => {
      const text = $(element).text();
      if (text.includes('@')) {
        const foundEmails = this.extractEmails(text);
        (foundEmails || []).forEach(email => allEmails.add(email));
      }
    });

    let validEmails = Array.from(allEmails).filter(email => this.isValidEmail(email));
    const filterResult = this.cleanAndFilterEmails(validEmails);
    const emails = filterResult.cleaned;
    const junkEmails = filterResult.junk;
    
    console.log(`Found ${emails.length} emails on page: ${url} (Junk: ${junkEmails.length})`);
    if (emails.length > 0) {
      console.log('Found emails:', emails);
    }
    
    return { emails, junkEmails, socials };
  }

  async findContactLinks(baseUrl) {
    try {
      console.log(`Finding contact links on: ${baseUrl}`);
      const html = await this.fetchHtml(baseUrl);
      const $ = cheerio.load(html);
      const contactLinks = new Set();

      // Find links with contact-related text
      $('a').each((i, element) => {
        const href = $(element).attr('href');
        const text = $(element).text().toLowerCase();
        
        if (href) {
          const hrefLower = href.toLowerCase();
          
          // Check if link text or href contains contact keywords
          const contactKeywords = ['contact', 'about', 'iletişim', 'iletisim', 'kurumsal', 'hakkımızda', 'hakkimda', 'support', 'help', 'reach', 'connect'];
          
          if (contactKeywords.some(keyword => 
            text.includes(keyword) || hrefLower.includes(keyword)
          )) {
            // Use Node.js URL module for proper absolute URL resolution
            let fullUrl;
            try {
              fullUrl = new URL(href, baseUrl).href;
            } catch (error) {
              console.warn(`Invalid URL combination: ${href} + ${baseUrl}`);
              return;
            }
            
            contactLinks.add(fullUrl);
            console.log(`Found contact link: ${fullUrl} (from text: "${text.substring(0, 50)}...")`);
          }
        }
      });

      const linksArray = Array.from(contactLinks);
      console.log(`Total contact links found: ${linksArray.length}`);
      
      // If no contact links found, try common patterns
      if (linksArray.length === 0) {
        const commonPaths = ['/contact', '/contact-us', '/about', '/support', '/help'];
        for (const path of commonPaths) {
          try {
            const testUrl = new URL(path, baseUrl).href;
            console.log(`Testing common path: ${testUrl}`);
            linksArray.push(testUrl);
          } catch (error) {
            console.warn(`Failed to create common path URL: ${path}`);
          }
        }
        console.log(`Added ${commonPaths.length} common contact paths for testing`);
      }
      
      return linksArray;
    } catch (error) {
      console.warn(`Failed to find contact links for ${baseUrl}:`, error.message);
      return [];
    }
  }

  fetchHtml(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https://') ? https : http;
      
      const options = {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: this.timeout
      };

      const req = protocol.get(url, options, (res) => {
        let data = [];

        console.log(`HTTP Response for ${url}: ${res.statusCode} ${res.statusMessage}`);

        // Handle redirects properly
        if (res.statusCode >= 300 && res.statusCode < 400) {
          const location = res.headers.location;
          if (location) {
            console.log(`Redirecting from ${url} to ${location}`);
            
            // Convert relative redirects to absolute
            let finalUrl;
            try {
              finalUrl = new URL(location, url).href;
            } catch (error) {
              console.warn(`Invalid redirect URL: ${location}`);
              reject(new Error(`Invalid redirect: ${location}`));
              return;
            }
            
            // Follow the redirect
            this.fetchHtml(finalUrl).then(resolve).catch(reject);
            return;
          }
        }

        // Handle gzip compression
        let stream = res;
        if (res.headers['content-encoding'] === 'gzip') {
          console.log('Decompressing gzip content');
          stream = res.pipe(zlib.createGunzip());
        } else if (res.headers['content-encoding'] === 'deflate') {
          console.log('Decompressing deflate content');
          stream = res.pipe(zlib.createInflate());
        }

        stream.on('data', (chunk) => {
          data.push(chunk);
        });

        stream.on('end', () => {
          const buffer = Buffer.concat(data);
          const html = buffer.toString();
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(html);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  extractEmails(text) {
    if (!text) return [];
    
    // Try multiple regex patterns
    const patterns = [
      /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi
    ];
    
    let allMatches = [];
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        allMatches.push(...matches);
      }
    });
    
    // Remove duplicates
    return [...new Set(allMatches)];
  }

  isValidEmail(email) {
    // Basic email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && !email.includes('..') && email.length > 5 && email.length < 100;
  }

  cleanAndFilterEmails(emails) {
    if (!emails || !Array.isArray(emails)) return { cleaned: [], junk: [] };
    
    const cleaned = [];
    const junk = [];
    
    for (const rawEmail of emails) {
      let email = rawEmail;
      
      // 1. URL-Encoded Hataları Temizle (Örn: %20phase2... -> phase2...)
      try {
        email = decodeURIComponent(email);
      } catch(e) {}
      
      email = email.trim();
      
      // 2. Başa Yanlışlıkla Yapışan Telefon Numaralarını Budama İşlemi
      email = email.replace(/^(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/, '');
      
      // 3. Başa Yapışan Çalışma Saatleri İşlemi (Örn: 11am-4pmcrew@... -> crew@...)
      email = email.replace(/^(?:sun|mon|tue|wed|thu|fri|sat|sunday|monday|tuesday|wednesday|thursday|friday|saturday)?\s*\d{1,2}(?::\d{2})?(?:am|pm)?\s*-\s*\d{1,2}(?::\d{2})?(?:am|pm)/i, '');
      
      const originalEmail = email; // Keep original for junk tracking
      
      const lower = email.toLowerCase();
      
      // Kullanıcının Özel Beklentisi: Son 9 harfi instagram/Instagram olanları ELE
      if (lower.endsWith('instagram')) {
        junk.push(originalEmail);
        continue;
      }
      // Kullanıcının Özel Beklentisi: Son harfleri jpg/png/jpeg olanları ELE
      if (lower.endsWith('jpg') || lower.endsWith('jpeg') || lower.endsWith('png') || lower.endsWith('gif')) {
        junk.push(originalEmail);
        continue;
      }
      
      // 1. Agresif Çöp / Resim Filtresi (Eleme İşlemi)
      // Sadece sona değil herhangi bir yere bakar. @2x vb barındırıyorsa anında eler.
      if (lower.includes('@2x') || lower.includes('@3x') || /\.(jpg|jpeg|png|gif|svg|webp)/i.test(email)) {
        junk.push(originalEmail);
        continue;
      }
      
      // 2. Uzantı Budama / Temizleme İşlemi (Kurtarma İşlemi)
      // Uzantıdan hemen sonra BÜYÜK HARF ile başlayan bir kelime geliyorsa kes (case-sensitive check)
      email = email.replace(/(\.(com|co|net|org|io|us|uk|ca|au|info|biz|tr))[A-Z].*$/, '$1');
      
      // Kelime bazlı agresif uzantı temizleyici
      email = email.replace(/(\.(com|co|net|org|io|us|uk|ca|au|info|biz|tr))(instagram|facebook|twitter|linkedin|phone|tel|contact).*$/i, '$1');
      
      // Artık kalanı standart kontrol için küçük harfe çevirebiliriz
      email = email.toLowerCase();
      
      // Tam Eşleşme (Exact Match) Kontrolü
      const exactPlaceholders = [
        'user@domain.com', 'email@example.com', 'name@company.com', 
        'info@domain.com', 'info@company.com', 'johndoe@example.com', 
        'your@email.com', 'hello@yourdomain.com', 'test@test.com',
        'example@mail.com', 'example@email.com', 'abuse@company.site'
      ];
      if (exactPlaceholders.includes(email) || email.startsWith('example@')) {
        junk.push(originalEmail);
        continue;
      }

      // Log/Sistem Mailleri Reddi
      const invalidDomains = ['sentry.io', 'wixpress.com', 'sentry.wixpress.com', 'example.com', 'domain.com', 'company.com', 'yourdomain.com', 'yoursite.com', 'company.site'];
      if (invalidDomains.some(domain => email.includes('@' + domain) || email.endsWith('.' + domain))) {
        junk.push(originalEmail);
        continue;
      }
      
      // Son Validasyon Kontrolü
      if (this.isValidEmail(email) && email !== 'user@domain.com') { // Çift kontrol
        cleaned.push(email);
      } else {
        junk.push(originalEmail);
      }
    }
    
    return {
      cleaned: [...new Set(cleaned)],
      junk: [...new Set(junk)]
    };
  }

  async scrapeMultipleWebsites(websites, progressCallback) {
    const results = [];
    const total = websites.length;
    let completed = 0;

    const concurrencyLimit = 5;
    const queue = websites.map((website, index) => ({ website, index }));

    const worker = async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;

        const { website } = item;

        // Add a small delay between concurrent requests to be respectful
        await this.delay(Math.random() * 1000 + 500);

        try {
          const result = await this.scrapeWebsite(website);
          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            url: website,
            error: error.message,
            emails: [],
            junkEmails: [],
            emailCount: 0,
            socials: { instagram: null, linkedin: null, facebook: null, twitter: null }
          });
        }

        completed++;

        // Update progress
        if (progressCallback) {
          progressCallback({
            current: completed,
            total: total,
            percentage: Math.round((completed / total) * 100),
            currentWebsite: website
          });
        }
      }
    };

    // Create workers array and start them
    const workers = Array(Math.min(concurrencyLimit, total)).fill(null).map(() => worker());
    await Promise.all(workers);

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
