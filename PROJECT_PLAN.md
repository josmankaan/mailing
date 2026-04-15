# B2B Lead Generation & Email Scraper - Project Plan

## Proje Genel Bakış
Kullanıcıların sektör ve şehir bazında işletme bilgileri ve e-posta adresleri toplamasını sağlayan web uygulaması.

## Teknoloji Yığını
- **Frontend**: React (Vite), Tailwind CSS
- **Backend**: Node.js, Express
- **Veri Kaynakları**: Google Places API, Axios + Cheerio
- **Email Regex**: `/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g`

---

## AŞAMA 1: Proje Altyapısı ve Backend Kurulumu ✅ [x]

### 1.1 Proje Yapısı Oluşturma ✅
```
b2b-lead-scraper/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── public/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   ├── package.json
│   └── .env
└── README.md
```

### 1.2 Backend Kurulumu ✅
- Node.js ve Express server kurulumu
- CORS middleware konfigürasyonu
- Environment variables (.env) yapısı
- Google Places API key entegrasyonu hazırlığı
- Temel route yapısı oluşturma

### 1.3 Frontend Kurulumu ✅
- React + Vite projesi oluşturma
- Tailwind CSS kurulumu ve konfigürasyonu
- Temel proje yapısı ve routing
- Axios kurulumu for API calls

---

## AŞAMA 2: Google Places API Entegrasyonu ✅ [x]

### 2.1 Google Places API Servisi ✅
- Google Places API client oluşturma
- Text Search API endpoint'i için servis fonksiyonu
- API rate limiting ve error handling
- Response data parsing ve standardizasyon

### 2.2 Backend API Endpoint'leri ✅
- `POST /api/places/search` - Sektör ve şehir bazında arama
- Request validation (sector, city parametreleri)
- Response format standardizasyonu:
```json
{
  "places": [
    {
      "name": "Business Name",
      "address": "Full Address",
      "website": "https://example.com",
      "phone": "+1234567890",
      "rating": 4.5
    }
  ]
}
```

### 2.3 Frontend Arama Arayüzü ✅
- Arama formu component'i (sector + city inputları)
- Loading state management
- Sonuçları gösteren liste component'i
- Error handling ve kullanıcı bildirimleri

---

## AŞAMA 3: Web Scraping ve Email Extraction ✅ [x]

### 3.1 Web Scraping Servisi ✅ [x]
- ✅ Node.js built-in HTTP/HTTPS modülleri ile web sitelerine HTTP istekleri
- ✅ Cheerio ile HTML parsing
- ✅ Gzip/Deflate decompression desteği
- ✅ Timeout ve error handling
- ✅ Real Chrome User-Agent kullanımı
- ✅ HTTP 301/302 redirect takibi
- ✅ Rate limiting (1 saniye bekleme)

### 3.2 Email Extraction Logic ✅ [x]
- ✅ Regex pattern implementasyonu: `/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g`
- ✅ Multiple regex patterns ile gelişmiş email yakalama
- ✅ Email validation (format kontrolü)
- ✅ Duplicate email filtering
- ✅ mailto: link'lerinden email extraction
- ✅ HTML ve body text'ten email arama

### 3.3 Deep Crawl ve Contact Page Detection ✅ [x]
- ✅ Ana sayfadaki contact/about/help link'lerini bulma
- ✅ Türkçe keyword'ler: 'iletişim', 'iletisim', 'kurumsal', 'hakkımızda', 'hakkimda'
- ✅ İngilizce keyword'ler: 'contact', 'about', 'support', 'help', 'reach', 'connect'
- ✅ Common path'leri test etme: `/contact`, `/contact-us`, `/about`, `/support`, `/help`
- ✅ Absolute URL çözümleme (Node.js URL modülü)
- ✅ Recursive contact page scraping

### 3.4 Backend Scraping Endpoint ✅ [x]
- ✅ `POST /api/scrape/emails` - Web sitelerinden email çekme
- ✅ `GET /api/scrape/status/:jobId` - Scraping durumu takibi
- ✅ In-memory job management
- ✅ Progress tracking ve real-time updates

### 3.5 Frontend Email Extraction Interface ✅ [x]
- ✅ "Extract Emails" butonu
- ✅ Scraping job management
- ✅ Progress tracking ve status polling
- ✅ Email results display
- ✅ Copy to clipboard functionality
- ✅ Error handling ve kullanıcı bildirimleri

### 3.6 Scraping Pipeline ✅ [x]
- ✅ Multiple websites batch processing
- ✅ Progress tracking ve real-time status updates
- ✅ Failed websites handling
- ✅ In-memory job storage
- ✅ Email deduplication across sites

---

## AŞAMA 4: Frontend Tamamlama ve Veri Yönetimi ✅ [x]

### 4.1 Sonuç Arayüzü ✅ [x]
- ✅ Bulunan email'lerin liste formatında gösterimi
- ✅ Export functionality (CSV, JSON)
- ✅ Filter ve search özellikleri
- ✅ Pagination for large result sets

### 4.2 State Management ✅ [x]
- ✅ React Context for global state
- ✅ Loading states ve error handling
- ✅ Cache management for API responses
- ✅ Local storage for user preferences

### 4.3 UI/UX İyileştirmeleri ✅ [x]
- ✅ Responsive design
- ✅ Loading spinners ve progress bars
- ✅ Search history tracking
- ✅ User preferences management
- Toast notifications
- Form validation
- Dark/light mode (opsiyonel)

### 4.4 Deployment ve Production
- Environment variable management
- Docker containerization (opsiyonel)
- CI/CD pipeline kurulumu
- Performance optimization
- Security hardening (rate limiting, input sanitization)

---

## AŞAMA 5: Gelişmiş Veri Toplama (Sosyal Medya & İletişim) ✅ [x]

### 5.1 Sosyal Medya Avcısı ✅ [x]
- Kazıma (scraping) esnasında Instagram, LinkedIn, Facebook ve X (Twitter) hesap URL'lerini tespit etme.
- Bulunan sosyal platform bağlantılarını frontend üzerinde dükkan kartlarında tıklanabilir ikonlar olarak gösterme.
- CSV ve JSON dışa aktarım dosyalarına Sosyal Medya sütunları ekleme.

### 5.2 Telefon Numarası Senkronizasyonu ✅ [x]
- Google Places API'dan dönen `formatted_phone_number` alanını frontend arayüzünde "tel:+..." linki ile tıklanabilir yapma.
- Bu bilgiyi CSV/JSON dışa aktarma (export) süreçlerine dahil etme.

---

## AŞAMA 6: Eşzamanlı Kazıma (Concurrency) & Hızlandırma ✅ [x]

### 6.1 Gelişmiş Eşzamanlı Tarama ✅ [x]
- Botların tek tek beklemek yerine siteleri belirlenen limitlerle (örn. 5 site paralel) gruplar halinde taramasını sağlama (`Promise.all` ile).
- Eşzamanlı kazıma havuzu yardımıyla tarama hızını optimize etme.

---

## AŞAMA 7: Veri Temizleme (Data Validation & Cleaning) ✅ [x]

### 7.1 Gelişmiş E-posta Filtreleme ✅ [x]
- Resim/medya uzantılı taklit mailleri temizleme (`.jpg`, `.png`, `.svg` vb.)
- Log ve Tracking domain'lerini filtreleme (`sentry.io`, `wixpress.com`)
- Placeholder / Şablon mailleri engelleme (`user@domain.com`, `email@example.com`)
- Uzantıdan (TLD) sonrasına yapışmış hatalı metinleri temizleme (`.comPhone` -> `.com`)

---

## AŞAMA 8: SaaS Altyapısı (Auth, DB & Token Sistemi) ⏳ [ ]

### 8.1 Lokal Veritabanı ve Authentication ⏳
- SQLite tabanlı lokal ve taşınabilir veritabanı kurulumu (ORM olarak Sequelize veya Prisma).
- Kayıt Ol (Register) ve Giriş Yap (Login) arayüzleri, JWT (JSON Web Token) altyapısı.
- Kullanıcı şifrelerinin güvenli şifrelenmesi (Bcrypt).

### 8.2 Token ve Kredi Sistemi ⏳
- Her yeni kayıt olan kullanıcıya 50 Token hediye edilmesi.
- Başarılı Email Kazıma (Extract Emails) işlemi başına hesaptan 20 Token düşülmesi.
- Token bakiyesi 20'nin altına düşen kullanıcıların tarama yapmasının engellenmesi.
- Arayüzde giriş yapan kullanıcının güncel token bakiyesinin sağ üstte gösterilmesi.

### 8.3 Geçmiş Aramalar (History) & Toplu Dışa Aktarma ⏳
- Yapılan her başarılı kazıma/tarama işleminin detaylarının (şehir, sektör, temiz e-postalar, spam mailler) DB'ye kaydedilmesi.
- Giriş yapan kullanıcılara özel yeni `/history` sayfasının (Geçmiş Aramalar) oluşturulması.
- Geçmiş sayfasında "Tarih Filtresi" ve filtrelenen tüm verileri tek bir CSV (Excel) veya JSON dokümanında birleştiren **Toplu İndirme (Bulk Export)** butonunun eklenmesi.

---

## API Endpoints Özeti

### Places API
- `POST /api/places/search` - İşletme arama
- `GET /api/places/:placeId` - Detay bilgiler

### Scraping API
- `POST /api/scrape/emails` - Email çekme işlemi
- `GET /api/scrape/status/:jobId` - İşlem durumu
- `GET /api/scrape/results/:jobId` - Sonuçları getir

### Data Management
- `POST /api/leads/export` - Veri export
- `DELETE /api/leads/:id` - Veri silme
- `GET /api/leads/history` - Geçmiş aramalar

---

## Güvenlik ve Etik Hususlar

### Rate Limiting
- Google Places API quota management
- Scraping rate limiting (saygı duymak için)
- IP blocking prevention

### Data Privacy
- GDPR compliance considerations
- Data retention policies
- User data encryption

### Scraping Ethics
- Robots.txt respect
- Request delay between scrapes
- User-Agent identification
- Terms of service compliance

---

## Başarı Metrikleri

### Teknik Metrikler
- API response time < 2saniye
- Scraping success rate > 80%
- Concurrent user support > 50
- Uptime > 99%

### İş Metrikleri
- Email finding accuracy > 70%
- User satisfaction score
- Daily active users
- Export functionality usage

---

## Riskler ve Çözümler

### Teknik Riskler
- **Google API quota exhaustion** -> Fallback stratejileri
- **Website blocking** -> Proxy rotation
- **Email format changes** -> Multiple regex patterns

### İş Riskler
- **Legal compliance** -> Terms of service review
- **Data quality** -> Validation system
- **User adoption** -> UI/UX testing
