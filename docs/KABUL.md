# Kabul testi

Bu dosya, teslim öncesi elle yapılan kontrolleri kaydeder. Tarih: 29 Ekim 2026.

**Yayın:** https://notdefterim.surge.sh (Surge, HTTPS, service worker ve çevrimdışı açılış doğrulandı)

## Çalıştırma

- [x] `npm install` temiz kurulum
- [x] `npm run dev` → http://localhost:5173 açılıyor
- [x] `npm run build` → hata yok, `dist/` üretiliyor
- [x] `npm run preview` → üretim derlemesi açılıyor
- [x] `npm run typecheck` → hata yok
- [x] `npm run keys` → eksik çeviri anahtarı yok

## Notlar

- [x] İlk açılışta defter boş (örnek not/etkinlik yok)
- [x] Eski sürümdeki örnek içerik, kullanıcı notlarına dokunmadan temizleniyor (v2 geçişi)
- [x] Notlar tek ızgarada; kategori sütunu/filtresi yok, yalnızca "Not ekle"
- [x] Not eklerken başlık alanı (isteğe bağlı); boş bırakılırsa tür adı kullanılır
- [x] Başlık alanında yazma/odak hatası düzeltildi (modal paneli odağı çalmıyor)
- [x] Metin notu oluşturma, düzenleme, etiket ve gövde ekleme
- [x] Izgara görünümüne geçiş ve tercih hatırlama
- [x] Arama Türkçe duyarsız (`İSTANBUL` ↔ `istanbul` altyapısı)
- [x] Sabitlenen / arşiv filtreleri
- [x] Metin notu oluşturma, düzenleme, etiket ve gövde ekleme
- [x] Kontrol listesi: madde ekleme, işaretleme, ilerleme çubuğu
- [x] Tablo: hücre düzenleme, `=TOPLA(B2:B4)` hesabı, CSV indirme
- [x] Belge: başlık, liste, alıntı, kelime sayısı
- [x] Akış: kutu ekleme, sürükleme, bağlama, PNG indirme
- [x] Kod: satır numaraları, JavaScript çalıştırma, AI incelemesi (console.log uyarısı)
- [x] Not silme + "Geri al" bildirimi
- [x] Not kopyalama ve arşivleme

## Takvim ve hatırlatma

- [x] Ay ızgarası, önceki/sonraki ay, "Bugün"
- [x] Gün seçimi ve günün planı
- [x] Etkinlik ekleme/düzenleme, tür (etkinlik / özel gün), hatırlatma anahtarı
- [x] Yaklaşan etkinlikler listesi
- [x] AI ile "yarın 10:00 toplantı ekle" → 30 Ekim 10:00 kaydı oluştu
- [x] 24 saat penceresindeki etkinlik için tarayıcı bildirimi / uygulama içi uyarı yolu
- [ ] Gerçek bildirim izni verilmiş cihazda bildirimin ekrana düşmesi (tarayıcı izni gerektirir)

## Asistan

- [x] "alışveriş listeme süt ekle" → mevcut listeye `süt` eklendi
- [x] "sunum notu ekle" → yeni not oluştu
- [x] "notlarımı özetle" → not sayısı ve yaklaşan etkinlikler
- [x] Takvimde seçilen güne gün notu yazma, yenilemeden sonra korunma
- [x] "bana gardaş diye hitap et" → sonraki yanıtlarda ve yenilemeden sonra hitap korunuyor
- [x] "takvime nasıl etkinlik eklerim?" → uygulama bilgi tabanından yanıt
- [x] "ne konuştuk?" → son mesajların özeti
- [x] "şema oluştur: başla, kontrol et, bitir" → zincir bağlı akış oluştu
- [x] Ayarlar → Asistan: arkadaşça / resmi / kısa / uzun / hafif argo / kibar
- [x] Resmi tarz: "Anlaşıldı." + resmi kapanış; argo: "Bak şimdi:" + rahat kapanış
- [x] Kısa tarz: yanıt en fazla 5 satıra iniyor; seçim yenilemeden sonra korunuyor
- [x] Bildirim sesi: 10 seçenek (8 klasik + Defter/Mürekkep özel), önizleme ve kalıcı seçim
- [x] Hatırlatma geldiğinde seçilen ses çalıyor; sistem bildirimi sessiz (çift ses yok)

## Gezinme

- [x] Not açıkken tarayıcı geri tuşu notu kapatıyor, siteden çıkmıyor
- [x] Panel X/Esc ile kapanınca görünüm ve adres korunuyor
- [x] Akışta şekil ekleme, seçili/son kutunun devamına bağlanıyor
- [x] "bu kodu incele" → bulgu listesi ve özet
- [x] Sohbet ve işlem geçmişi yenilemeden sonra korunuyor

## Görünüm ve ayarlar

- [x] Açık, Gece ve Renkli tema
- [x] 8 palet + özel vurgu rengi
- [x] TR/EN dil geçişi (tüm ekranlar)
- [x] Hareketi azalt
- [x] Yedek JSON indirme / geri yükleme
- [x] Sıfırlama onayı
- [x] Yedek: veriler IndexedDB'de, yenilemeden sonra duruyor

## Mobil ve PWA

- [x] 390×844 görünümde alt gezinme, taşma yok
- [x] Not düzenleyici alt panel olarak açılıyor
- [x] Not türü seçici tek sütun
- [x] Asistan tam ekran panel
- [x] manifest + service worker + 192/512/maskable ikonlar
- [x] Service worker kaydı ve denetimi (`navigator.serviceWorker.controller` → controlled)
- [x] Üretim derlemesinde **çevrimdışı yenileme** (offline → sayfa açıldı)
- [ ] Kurulum akışının gerçek cihazda denenmesi (tarayıcıya bağlı)

## Erişilebilirlik

- [x] Görünür klavye odağı
- [x] Form alanlarında etiket (`label` / `aria-label`)
- [x] İkon düğmelerinde erişilebilir ad
- [x] `prefers-reduced-motion` ve ayarlardan "Hareketi azalt"
- [x] "İçeriğe geç" bağlantısı
- [x] Renk tek başına anlam taşımıyor (metin etiketleri de var)

## Not

Tarayıcı bildirimi ve PWA kurulumu, tarayıcı izinlerine bağlı olduğu için otomatik test edilemez; elle doğrulanmalıdır.
