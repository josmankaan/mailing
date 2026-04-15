const https = require('https');

// ─── Sayfalama Sabitleri ────────────────────────────────────────────────────
const MAX_PAGES = 3;          // Maksimum sayfa sayısı (3 sayfa × 20 = 60 sonuç)
const PAGE_DELAY_MS = 3000;   // Google next_page_token aktif olmadan önce en az 2 sn bekle (3 sn güvenlik marjıyla)

class PlacesService {
  constructor() {
    this.apiKey = 'AIzaSyAkMxMY-T3CZX1e4lrKdr1QE2IVT87tNL4';
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
  }

  // Belirtilen süre kadar bekler (next_page_token aktivasyon gecikmesi için zorunlu)
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async searchPlaces(sector, city, maxLeads = 20) {
    // Her sayfa max 20 sonuç döner. maxLeads'e göre kaç sayfa çekeceğimizi hesapla.
    const pagesToFetch = Math.min(Math.ceil(maxLeads / 20), MAX_PAGES); // max 3 sayfa
    try {
      console.log('=== API DEBUG ===');
      console.log('API Key exists:', !!this.apiKey);
      console.log('API Key length:', this.apiKey ? this.apiKey.length : 0);
      console.log('API Key starts with:', this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'null');
      console.log(`[Pagination] Hedef: ${maxLeads} lead → ${pagesToFetch} sayfa çekilecek`);

      const query = `${sector} in ${city}`;

      // ─── Pagination Döngüsü ────────────────────────────────────────────────
      let allRawResults = [];   // Tüm sayfalardan toplanan ham place nesneleri
      let nextPageToken = null; // Google'dan gelen sayfalama tokeni
      let currentPage = 0;

      do {
        currentPage++;

        // next_page_token Google tarafından üretildikten hemen sonra aktif olmaz.
        // İkinci ve sonraki sayfalarda MUTLAKA beklenmeli, yoksa
        // API "INVALID_REQUEST" hatası döner.
        if (currentPage > 1 && nextPageToken) {
          console.log(`[Pagination] Sayfa ${currentPage} için ${PAGE_DELAY_MS}ms bekleniyor (next_page_token aktivasyonu)...`);
          await this.delay(PAGE_DELAY_MS);
        }

        // İstek URL'ini hazırla.
        // ÖNEMLİ: Google Places API, pagetoken ile birlikte orijinal query 
        // parametresinin de gönderilmesini zorunlu kılıyor. Aksi halde INVALID_REQUEST döner.
        let requestUrl;
        if (currentPage === 1) {
          requestUrl = `${this.baseUrl}/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`;
        } else {
          requestUrl = `${this.baseUrl}/textsearch/json?query=${encodeURIComponent(query)}&pagetoken=${nextPageToken}&key=${this.apiKey}`;
        }

        // Debug: gönderilen URL ve token değerini logla
        if (currentPage > 1) {
          console.log(`[Pagination] next_page_token (ilk 60 char): ${nextPageToken.substring(0, 60)}...`);
          console.log(`[Pagination] Request URL (ilk 120 char): ${requestUrl.substring(0, 120)}...`);
        }

        console.log(`[Pagination] Sayfa ${currentPage}/${pagesToFetch} isteniyor...`);
        const response = await this.makeRequest(requestUrl);
        let data = JSON.parse(response);

        // INVALID_REQUEST genelde token henüz aktif olmadığında gelir.
        // Bir kez daha bekleyip tekrar deneyelim (retry mekanizması).
        if (data.status === 'INVALID_REQUEST' && currentPage > 1) {
          console.log(`[Pagination] INVALID_REQUEST alındı — ek ${PAGE_DELAY_MS}ms bekleniyor ve tekrar deneniyor...`);
          await this.delay(PAGE_DELAY_MS);
          const retryResponse = await this.makeRequest(requestUrl);
          data = JSON.parse(retryResponse);
          console.log(`[Pagination] Retry sonucu: ${data.status}`);
        }

        if (currentPage === 1) {
          // Sadece ilk sayfada ham yanıtı logla
          console.log('=== GOOGLE API RAW RESPONSE ===');
          console.log('First place object:', data.results && data.results[0] ? JSON.stringify(data.results[0], null, 2) : 'No results');
          console.log('Status:', data.status);
          console.log('next_page_token present:', !!data.next_page_token);
          console.log('================================');
        }

        if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
          const pageResults = data.results || [];
          allRawResults = [...allRawResults, ...pageResults];
          console.log(`[Pagination] Sayfa ${currentPage}: ${pageResults.length} sonuç geldi. Toplam: ${allRawResults.length}`);

          // Bir sonraki sayfa için token'ı güncelle (yoksa döngü durur)
          nextPageToken = data.next_page_token || null;

          if (!nextPageToken) {
            console.log(`[Pagination] next_page_token yok — son sayfa ulaşıldı.`);
          }
        } else {
          // API'den hata geldi; mevcut sonuçlarla devam et, döngüyü kır
          console.error(`[Pagination] Google Places API hatası (Sayfa ${currentPage}):`, data.status, data.error_message || '');
          console.error(`[Pagination] Tam API yanıtı:`, JSON.stringify(data, null, 2));
          break;
        }

      } while (nextPageToken && currentPage < pagesToFetch);
      // ─── Döngü Sonu ──────────────────────────────────────────────────────

      console.log(`[Pagination] Tamamlandı. Toplam ham sonuç: ${allRawResults.length} (${currentPage} sayfa)`);

      if (allRawResults.length === 0) {
        return { success: true, places: [], message: 'No results found' };
      }

      // ─── Her İşletme için Place Details API'yi Çağır ─────────────────────
      // Website, telefon gibi detaylar textsearch'te gelmez; details endpoint gerekir.
      const placesWithDetails = await Promise.all(
        allRawResults.map(async (place) => {
          const detailsUrl = `${this.baseUrl}/details/json?place_id=${place.place_id}&key=${this.apiKey}&fields=name,formatted_address,website,formatted_phone_number,rating`;

          try {
            const detailsResponse = await this.makeRequest(detailsUrl);
            const detailsData = JSON.parse(detailsResponse);

            if (detailsData.status === 'OK' && detailsData.result) {
              return {
                name: detailsData.result.name || place.name,
                address: detailsData.result.formatted_address || place.formatted_address,
                website: detailsData.result.website || null,
                phone: detailsData.result.formatted_phone_number || null,
                rating: detailsData.result.rating || null,
                placeId: place.place_id
              };
            }
          } catch (error) {
            console.warn(`[Details] ${place.name} için detay alınamadı:`, error.message);
          }

          // Details API başarısız olursa textsearch verisine geri dön
          return {
            name: place.name,
            address: place.formatted_address,
            website: place.website || null,
            phone: place.formatted_phone_number || null,
            rating: place.rating || null,
            placeId: place.place_id
          };
        })
      );

      return {
        success: true,
        places: placesWithDetails
      };

    } catch (error) {
      console.error('Places API error:', error.message);

      if (error.response && error.response.data) {
        console.log('=== GOOGLE API ERROR DETAILS ===');
        console.log('Status:', error.response.status);
        console.log('Data:', JSON.stringify(error.response.data, null, 2));
        console.log('==================================');
      }

      return {
        success: false,
        error: error.message,
        places: []
      };
    }
  }

  makeRequest(requestUrl) {
    return new Promise((resolve, reject) => {
      // https.get doğrudan URL string kabul eder — url.parse() KULLANMIYORUZ
      // çünkü url.parse() next_page_token içindeki özel karakterleri bozabilir.
      const req = https.get(requestUrl, {
        headers: { 'User-Agent': 'B2B-Lead-Scraper/1.0' }
      }, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }
}

module.exports = new PlacesService();
