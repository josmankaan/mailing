# Skate Shop Mail Gönderim Sistemi - Proje Planı

## Proje Genel Bakış
Yurtdışındaki skate shop'lara çorap satmak için kullanılacak toplu e-mail gönderim ve yönetim sistemi.

## Teknoloji Stack
- **Frontend**: React (Vite)
- **Backend**: Node.js (Express.js)
- **Veritabanı**: SQLite + Prisma ORM
- **Mail Gönderim**: Nodemailer (SMTP)
- **Mail Senkronizasyon**: IMAP
- **Deployment**: Localhost

## Proje Mimarisi

### Veritabanı Şeması
```
Shops (Mağazalar)
- id, name, email, website, country, status
- created_at, updated_at

MailTemplates (Mail Şablonları)
- id, name, subject, html_content
- created_at, updated_at

MailHistory (Mail Geçmişi)
- id, shop_id, template_id, sent_at, status
- error_message, imap_uid

MailQueue (Mail Kuyruğu)
- id, shop_id, template_id, scheduled_at, status
- retry_count, sent_at
```

### Sistem Akışı
1. Mağaza bilgileri sisteme kaydedilir
2. Mail şablonları oluşturulur
3. Toplu mail gönderimi başlatılır
4. Kuyruk sistemi dakikada 2-3 mail gönderir
5. IMAP ile geçmiş mailler senkronize edilir
6. Raporlama ve durum takibi yapılır

## Geliştirme Aşamaları

### 📋 Phase 1: Kurulum ve Temel Yapı
- [ ] Node.js projesi oluşturma (package.json)
- [ ] Vite + React frontend kurulumu
- [ ] Express.js backend kurulumu
- [ ] Prisma ORM ve SQLite kurulumu
- [ ] Temel proje yapısı oluşturma (frontend/backend klasörleri)
- [ ] Development server konfigürasyonu

### 🗄️ Phase 2: Veritabanı ve Modeller
- [ ] Prisma schema dosyasını oluşturma
- [ ] Shops modeli (mağaza bilgileri)
- [ ] MailTemplates modeli (mail şablonları)
- [ ] MailHistory modeli (gönderim geçmişi)
- [ ] MailQueue modeli (gönderim kuyruğu)
- [ ] Veritabanı migrasyonu
- [ ] Basit şifre koruma sistemi

### 🎨 Phase 3: Frontend Arayüzü
- [ ] Ana sayfa layout'u
- [ ] Mağaza listesi sayfası
- [ ] Mağaza ekleme/düzenleme formu
- [ ] Mail şablonları yönetimi sayfası
- [ ] Toplu mail gönderim sayfası
- [ ] Raporlama ve durum takibi sayfası
- [ ] Responsive tasarım

### 🔧 Phase 4: Backend API
- [ ] Express.js route yapılandırması
- [ ] Mağaza CRUD işlemleri
- [ ] Mail şablonu CRUD işlemleri
- [ ] Mail geçmişi listeleme API'leri
- [ ] Basit şifre doğrulama middleware

### 📧 Phase 5: Mail Entegrasyonu
- [ ] Nodemailer SMTP konfigürasyonu (Titan Mail)
- [ ] Mail gönderim servisi
- [ ] Rate limiter ve kuyruk sistemi (dakikada 2-3 mail)
- [ ] Mail gönderim hata yönetimi
- [ ] Gönderim durum güncelleme

### 📥 Phase 6: IMAP Senkronizasyonu
- [ ] IMAP client kurulumu (Titan Mail)
- [ ] Giden mailleri senkronizasyon
- [ ] Gelen mailleri okuma ve cevap tespiti
- [ ] Mağaza durumlarını otomatik güncelleme
- [ ] Çift mail gönderimi önleme

### 📊 Phase 7: Raporlama ve Analiz
- [ ] Gönderim istatistikleri
- [ ] Mağaza durum filtreleme
- [ ] Mail açma/cevaplama oranları
- [ ] Excel CSV export özelliği
- [ ] Görsel grafikler ve dashboard

### 🧪 Phase 8: Test ve Optimizasyon
- [ ] Unit test'leri
- [ ] Mail gönderim test'leri
- [ ] IMAP senkronizasyon test'leri
- [ ] Performans optimizasyonu
- [ ] Hata yönetimi ve logging

### 🚀 Phase 9: Final ve Dokümantasyon
- [ ] README.md dosyası oluşturma
- [ ] Kurulum talimatları
- [ ] Kullanım kılavuzu
- [ ] Sistem gereksinimleri
- [ ] Troubleshooting guide

## Önemli Notlar

### Spam Önlemleri
- Dakikada maksimum 2-3 mail gönderim limiti
- Mail içeriklerinde spam kelimelerinden kaçınma
- Farklı subject satırları kullanımı
- Unsubscribe linki ekleme

### Güvenlik
- Basit şifre koruma sistemi
- Environment variables kullanımı
- Mail bilgilerinin güvenli saklanması

### Performans
- SQLite optimizasyonu
- Frontend state management
- Efficient API responses
- Memory management

## Başlangıç Kontrol Listesi
- [ ] Titan Mail SMTP/IMAP bilgileri
- [ ] Node.js ve npm kurulu mu?
- [ ] VS Code ve gerekli eklentiler
- [ ] Git reposu oluşturma

---
*Bu proje planı geliştirme sürecinde güncellenecektir.*
