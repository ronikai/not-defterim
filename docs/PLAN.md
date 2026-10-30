# Plan

## Amaç

Tek günde, jüri önünde çalışan; not, takvim, tablo, belge, akış ve kod ihtiyacını tek yerde karşılayan; cihaz içi asistanı olan kurulabilir bir web uygulaması.

## Kapsam (bu sürüm)

1. Uygulama başlatıcı ve ortak kabuk (üst bar, arama, tema, ayarlar, indirme)
2. Notlar: başlıklı notlar, tek ızgara (kategori yok), 6 not türü
3. Takvim: ay görünümü, etkinlik + özel gün, gün notu, 24 saat önce hatırlatma
4. Tablo: formül motoru, CSV
5. Belge: zengin metin
6. Akış: kutu/ok tuvali, PNG
7. Kod: editör, çalıştırma, statik inceleme
8. Asistan: komut anlama + gerçek işlem + sohbet geçmişi
9. Ayarlar: 3 tema, 8 palet, TR/EN, bildirim, yedek
10. PWA ve mobil uyum
11. README, kabul testi, ekran görüntüleri

## Kapsam dışı (bilinçli)

- Kullanıcı hesabı, abonelik, ödeme
- Bulut yapay zekâsı (mimari hazır, anahtar yok)
- Cihazlar arası gerçek zamanlı senkronizasyon
- Gerçek zamanlı işbirliği

## Mimari kararlar

| Karar | Gerekçe |
|---|---|
| Vite + React + TS | Hızlı geliştirme, tip güvenliği, tek sayfa uygulama |
| Tailwind v4 + CSS değişkenleri | 3 tema ve 8 paleti tek yerden yönetmek |
| IndexedDB + JSON yedek | Sunucusuz, çevrimdışı, taşınabilir |
| Tek `AppState` + immer | Modüller arası tutarlılık, kolay kalıcılık |
| Yerel AI motoru | Maliyetsiz, gizlilik dostu, sunumda riske girmeyen |
| PWA | Tek kod tabanıyla telefon + masaüstü |

## Zaman çizelgesi (gerçekleşen)

| Blok | İş | Durum |
|---|---|---|
| 1 | Skill kurulumu, iskelet, tasarım sistemi | tamam |
| 2 | Veri katmanı, kabuk, başlatıcı | tamam |
| 3 | Notlar + editörler | tamam |
| 4 | Takvim + hatırlatma | tamam |
| 5 | Tablo + belge | tamam |
| 6 | Akış + kod | tamam |
| 7 | Asistan motoru ve paneli | tamam |
| 8 | Ayarlar, temalar, PWA, mobil | tamam |
| 9 | Tarayıcı testi, README, ekran görüntüleri | tamam |

## Sonraki adımlar (isteğe bağlı)

- Bulut asistan için sunucu tarafı proxy ve kullanım kotası
- Şablon galerisi (haftalık plan, ders programı, bütçe)
- Tablo grafikleri
- PDF dışa aktarma
- İsteğe bağlı hesap + uçtan uca şifreli senkronizasyon
