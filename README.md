# 🖥️ Dijital Donanım Laboratuvarı 3D — Öğretmen Bozok

5. sınıf **Bilişim Teknolojileri ve Yazılım** dersi için dokunmatik akıllı tahta öncelikli, Three.js WebGL tabanlı etkileşimli 3D bilgisayar donanımları eğitim platformu.

---

## 🚀 Hızlı Başlangıç

Uygulamayı yerel bilgisayarınızda çalıştırmak için:

### Geliştirme Modu:
```bash
npm run dev
```
*(Tarayıcınızda açılan adrese gidin, varsayılan: `http://localhost:3000`)*

### Canlı Önizleme (Production Preview):
```bash
npm run build
npm run preview
```

---

## 🌟 Öne Çıkan Özellikler

1. **WebGL 3D İnteraktif Görüntüleyici:**
   - Bilgisayar parçalarını saf 3D ortamda döndürme, yakınlaştırma ve üst/izometrik açılardan inceleme.
   - CPU, RAM, GPU, Anakart, SSD, HDD, PSU, Kasa vb. tüm temel donanımlar için özel prosedürel 3D modeller.
   - Harici `.glb` / `.gltf` 3D modelleri otomatik algılar, yükler ve kusursuz merkezler; özel model yoksa prosedürel 3D modele pürüzsüz geri düşer.
2. **3D Hotspot (Açıklama Noktaları):**
   - Parça üzerindeki önemli kısımlara dokunulduğunda 3D uzaydan ekrana yansıtılan interaktif bilgi balonları.
3. **Dinamik Bilgi Paneli & Türkçe Seslendirme (TTS):**
   - Kategori, Görevi, Nerede Bulunur?, Önemli Bilgiler ve **1 Cümlede Özet**.
   - **🔊 Dinle:** Donanım bilgilerini Web SpeechSynthesis API ile akıcı Türkçe seslendirme.
4. **28 Parçalık Zengin Donanım Kütüphanesi & Dinamik Kategoriler:**
   - İşlem, Bellek, Depolama, Görüntü, Ana Donanım, Güç, Soğutma, Giriş, Çıkış, Giriş/Çıkış ve Ağ kategorileri.
5. **Donanım Karşılaştırma Modu:**
   - İki donanımı yan yana koyarak hız, görev ve çalışma mantığı kıyaslaması (Örn: RAM vs SSD, HDD vs SSD, CPU vs GPU).
6. **"Hazır Mısın?" Mini Pekiştirme Testleri:**
   - Nota tabi olmayan, doğru cevapta konfeti ve sesli kutlama sunan pekiştirme mini testleri.
7. **Öğretmen Yönetim Paneli (`Admin`):**
   - **Donanım Yönetimi:** Kod yazmadan yeni donanım ekleme, belirgin butonla donanım silme, açıklamaları, soruları ve 3D modelleri düzenleme.
   - **Kategori Yönetimi:** Yeni kategori ekleme, kategorileri yeniden adlandırma (otomatik tüm parçalara yansır), güvenli kategori silme (parçaları yedek kategoriye aktarma).
   - JSON formatında verileri indirme (Export) ve yükleme (Import).
   - Fabrika ayarlarına tek tıkla geri dönebilme.
8. **Akıllı Tahta & Dokunmatik Ekran Desteği:**
   - Minimum 48px dokunma hedefleri.
   - Tam ekran modu.
   - Büyük Yazı / Sınıf Ekranı modu.
   - Web Audio API sentezli ses efektleri.

---

## 🛠️ Teknoloji Yığını
- **Frontend:** React 19, TypeScript, Vite
- **3D Motoru:** Three.js (WebGL, OrbitControls)
- **Tasarım:** Tailwind CSS, Lucide React İkonları
- **Efektler & Ses:** Canvas-Confetti, Web SpeechSynthesis API, Web Audio API
- **Veri:** LocalStorage kalıcılığı ve JSON içe/dışa aktarma
