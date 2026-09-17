# Donanım Laboratuvarı 3D — Antigravity Uygulama Geliştirme Promptu

## 1. Proje Tanımı

5. sınıf **Bilişim Teknolojileri ve Yazılım** dersinde “Bilgisayar Donanımları” konusunu öğretmek için etkileşimli, akıllı tahta uyumlu bir web uygulaması geliştir.

Uygulamanın temel fikri:

> Öğrenci ekranda gerçek bir bilgisayar parçasını elinde inceliyormuş gibi hissetsin; parçayı döndürebilsin, yakınlaştırabilsin, farklı açılardan görebilsin ve parçanın bilgilerini aynı ekranda okuyabilsin.

Uygulama öğretmen tarafından verilen donanım verilerini kullanmalı. Ben daha sonra donanım parçalarını, açıklamalarını ve görsellerini/3D modellerini sisteme ekleyebilmeliyim.

---

# 2. HEDEF KİTLE

- 5. sınıf öğrencileri
- Yaklaşık 10–12 yaş
- Bilişim Teknolojileri ve Yazılım dersi
- Akıllı tahta kullanımı
- Bilgisayar laboratuvarı olmadan sınıf ortamında kullanım
- Dokunmatik ekran öncelikli

Arayüz çocukça veya oyuncak gibi görünmemeli.

Tasarım:
- modern
- teknolojik
- sade
- merak uyandırıcı
- premium eğitim teknolojisi uygulaması hissi vermeli.

---

# 3. TEMEL EKRAN YAPISI

Ana ekran iki ana bölüme ayrılmalı.

## SOL / MERKEZ ALAN

Büyük bir 3D görüntüleyici bulunmalı.

Öğrenci:

- parçayı parmağıyla sürükleyerek döndürebilmeli
- iki parmakla yakınlaştırıp uzaklaştırabilmeli
- parçayı farklı açılardan inceleyebilmeli
- mümkünse parçayı sağa/sola otomatik döndürebilmeli
- “Ön Görünüm”
- “Arka Görünüm”
- “Otomatik Döndür”
- “Sıfırla”

butonlarını kullanabilmeli.

3D model mevcut değilse sistem alternatif olarak yüksek kaliteli görsel üzerinde benzer bir “ürünü inceleme” deneyimi sunmalı.

---

# 4. SAĞ BİLGİ PANELİ

3D modelin yanında sabit bir bilgi paneli bulunmalı.

Örnek:

DONANIM

### İŞLEMCİ (CPU)

**Görevi**
Bilgisayarın işlemleri gerçekleştirmesini sağlayan temel parçalardan biridir.

**Nerede bulunur?**
Anakart üzerinde bulunur.

**Ne işe yarar?**
Programlardan gelen komutların işlenmesinde görev alır.

**Kısaca**
Bilgisayarın işlemleri gerçekleştiren önemli bileşenidir.

---

Bilgi panelinde:

- Donanım adı
- Donanım kategorisi
- Görevi
- Nerede bulunur?
- Ne işe yarar?
- Önemli bilgiler
- Öğrencinin bilmesi gereken 1 cümlelik özet

gösterilebilmeli.

Bilgiler çok uzun metinler halinde verilmemeli.

5. sınıf öğrencisinin okuyabileceği seviyede olmalı.

---

# 5. DONANIM KATEGORİLERİ

Uygulama aşağıdaki kategorileri desteklemeli:

### İşlem Birimleri
- İşlemci (CPU)
- GPU / Ekran kartı

### Bellek ve Depolama
- RAM
- HDD
- SSD

### Anakart ve Güç
- Anakart
- Güç kaynağı (PSU)
- Soğutucu

### Giriş Birimleri
- Klavye
- Fare
- Mikrofon
- Tarayıcı

### Çıkış Birimleri
- Monitör
- Yazıcı
- Hoparlör
- Kulaklık

### Diğer
- Kasa
- Web kamera
- Ağ kartı
- USB bellek

Liste öğretmen tarafından değiştirilebilir olmalı.

---

# 6. DONANIM KARTLARI

Ana ekranda donanımlar küçük kartlar halinde listelenmeli.

Örneğin:

[ CPU ]
[ RAM ]
[ SSD ]
[ HDD ]
[ GPU ]
[ ANAKART ]
[ PSU ]

Bir karta dokunulduğunda:

1. 3D model değişsin.
2. Bilgi paneli değişsin.
3. Donanımın adı ekranda büyük şekilde gösterilsin.

Geçişler animasyonlu ancak hızlı olmalı.

---

# 7. 3D DENEYİM

Buradaki en önemli özellik gerçek bir 3D inceleme hissidir.

Eğer Antigravity ortamında Three.js kullanılabiliyorsa:

- Three.js kullan.
- WebGL tabanlı 3D görüntüleyici oluştur.
- GLB / GLTF modellerini destekle.
- OrbitControls kullan.
- Touch kontrollerini destekle.
- Kamera kontrolünü akıllı tahta kullanımına uygun hale getir.

Öğrenci parçayı:

- parmağıyla çevirebilmeli
- yakınlaştırabilmeli
- uzaklaştırabilmeli
- farklı açıdan görebilmeli.

Model ekranın büyük bölümünü kaplamalı.

---

# 8. “ELİNDE İNCELİYOR GİBİ” HİSSİ

Bu özellik özellikle önemli.

3D modelin altında veya çevresinde hafif bir gölge bulunmalı.

Model arka plandan ayrılmalı.

Parça mümkün olduğunca fiziksel bir nesne gibi görünmeli.

Örneğin RAM seçildiğinde:

- RAM havada duran bir nesne gibi görünmeli.
- Öğrenci modeli döndürerek ön ve arka yüzünü inceleyebilmeli.
- Modelin yanında bilgi kartı bulunmalı.

Arayüz gereksiz süslerle doldurulmamalı.

---

# 9. PARÇA ÜZERİNDE ETİKETLER

İleri seviye özellik olarak 3D model üzerinde açıklama noktaları oluştur.

Örneğin RAM üzerinde:

● Bellek yongaları
● Bağlantı noktaları
● PCB

Öğrenci bir noktaya dokunduğunda küçük bilgi balonu açılsın.

Örnek:

### BAĞLANTI NOKTALARI
RAM'in anakarta bağlanmasını sağlayan bölümdür.

Bu sistem öğretmen tarafından veri girilerek oluşturulabilmeli.

---

# 10. DONANIMI İNCELE MODU

Bir “İNCELE” modu oluştur.

Öğrenci:

1. Parçayı döndürür.
2. Yakınlaştırır.
3. Üzerindeki işaretlere dokunur.
4. Bilgi panelinden açıklamayı okur.

Bu bölüm bir oyun gibi değil, dijital laboratuvar gibi tasarlanmalı.

---

# 11. KARŞILAŞTIRMA MODU

Öğretmen isterse iki donanımı yan yana gösterebilmeli.

Örneğin:

RAM vs SSD

veya:

HDD vs SSD

Ekranda iki 3D model yan yana bulunmalı.

Altında:

| Özellik | RAM | SSD |
|---|---|---|
| Görevi | ... | ... |
| Veri saklama | ... | ... |
| Kullanım | ... | ... |

şeklinde basit karşılaştırma yapılabilmeli.

---

# 12. KISA BİLGİ TESTİ

Her donanımın sonunda:

### HAZIR MISIN?

3 soruluk mini test göster.

Örnek:

**1. RAM hangi amaçla kullanılır?**

A) Ses çıkarmak  
B) Geçici verileri tutmak  
C) Görüntü yazdırmak  
D) İnternete bağlanmak

Öğrenci cevaba dokunabilmeli.

Doğru cevap sonrası:

“Doğru! RAM geçici verileri tutar.”

Yanlış cevap sonrası:

“Tekrar düşün. RAM bilgisayar çalışırken kullanılan geçici bellektir.”

gibi açıklama göster.

Test not vermemeli.

Amaç öğrenmeyi pekiştirmek.

---

# 13. KEŞİF GÖREVLERİ

Uygulamaya küçük görevler ekle.

Örneğin:

### GÖREV 1
RAM'in bağlantı noktalarını bul.

### GÖREV 2
CPU'nun anakart üzerindeki yerini bul.

### GÖREV 3
SSD ile HDD arasındaki farkı bul.

### GÖREV 4
Giriş birimlerinden 3 tane bul.

Görev tamamlandığında öğrenciye:

“Görev tamamlandı.”

mesajı göster.

---

# 14. ÖĞRETMEN PANELİ

Uygulamanın `/admin` bölümünde basit bir öğretmen paneli oluştur.

Öğretmen:

- yeni donanım ekleyebilmeli
- donanım adını değiştirebilmeli
- açıklama ekleyebilmeli
- kategori seçebilmeli
- görsel yükleyebilmeli
- GLB/GLTF model ekleyebilmeli
- model üzerindeki açıklama noktalarını tanımlayabilmeli
- test sorusu ekleyebilmeli
- görev ekleyebilmeli.

Veri yapısı buna uygun tasarlanmalı.

---

# 15. DONANIM VERİ MODELİ

Her donanım aşağıdaki yapıyı desteklemeli:

```text
id
name
category
shortDescription
function
location
importantInfo
summary
image
model3d
hotspots[]
questions[]
missions[]
```

Hotspot:

```text
id
title
description
positionX
positionY
positionZ
```

Question:

```text
question
options[]
correctAnswer
explanation
```

Mission:

```text
title
description
target
```

---

# 16. ÖRNEK VERİ

İlk demo için en az şu parçaları ekle:

### CPU
Ad: İşlemci (CPU)

Görevi:
Bilgisayardaki işlemlerin gerçekleştirilmesinde görev alan temel bileşenlerden biridir.

Kısaca:
Bilgisayarın işlemleri gerçekleştirmesine yardımcı olur.

### RAM

Görevi:
Bilgisayar çalışırken kullanılan geçici bellektir.

Kısaca:
Bilgisayarın o anda yaptığı işlemlerde kullandığı geçici bellektir.

### SSD

Görevi:
Dosya, program ve işletim sistemi gibi verileri kalıcı olarak saklar.

Kısaca:
Verileri kalıcı olarak saklayan hızlı bir depolama birimidir.

### HDD

Görevi:
Verileri kalıcı olarak saklar.

Kısaca:
Manyetik diskler kullanarak veri depolayan bir depolama birimidir.

### Anakart

Görevi:
Bilgisayarın farklı donanım bileşenlerinin birbirleriyle iletişim kurmasını sağlar.

Kısaca:
Bilgisayar parçalarının birbirine bağlandığı ana karttır.

### Ekran Kartı

Görevi:
Görüntülerin oluşturulmasına yardımcı olur.

Kısaca:
Görüntülerin ekrana aktarılmasında görev alır.

### Güç Kaynağı

Görevi:
Bilgisayar parçalarına gerekli elektrik enerjisini sağlar.

Kısaca:
Bilgisayarın parçalarına elektrik sağlayan bileşendir.

---

# 17. TASARIM

Genel tasarım:

- koyu lacivert / koyu teknoloji teması
- açık metin
- mavi ve mor vurgu renkleri
- büyük okunabilir yazılar
- yüksek kontrast
- akıllı tahta için büyük dokunma alanları

Ama tasarım fazla “oyun” görünmemeli.

Bir bilim merkezi / dijital laboratuvar hissi vermeli.

Marka alanında:

**ÖĞRETMEN BOZOK**

ifadesini kullan.

Alt başlık:

**DİJİTAL DONANIM LABORATUVARI**

---

# 18. AKILLI TAHTA OPTİMİZASYONU

Bu proje öncelikle bilgisayar faresi için değil, dokunmatik akıllı tahta için tasarlanmalı.

Dokunma hedefleri minimum yaklaşık 48px olmalı.

Öğrenci yanlışlıkla başka bir butona basmamalı.

3D model büyük olmalı.

Metinler sınıfın arka tarafından okunabilecek kadar büyük olmalı.

Hover'a bağlı özellikler kritik olmamalı.

Her özellik dokunmatik olarak kullanılabilmeli.

---

# 19. RESPONSIVE TASARIM

Uygulama:

- akıllı tahta
- masaüstü
- laptop
- tablet

ekranlarında çalışmalı.

Mobil telefon birincil hedef değildir.

Akıllı tahta ve 16:9 masaüstü ekran önceliklidir.

---

# 20. SESLİ ANLATIM

İleri özellik olarak her donanım için:

🔊 “Dinle”

butonu ekle.

Öğrenci bastığında donanım açıklaması sesli okunabilsin.

Tarayıcının SpeechSynthesis API'sini kullanabilirsin.

Türkçe ses seçimini destekle.

---

# 21. DERS AKIŞI

Uygulama öğretmenin sınıfta şu şekilde kullanmasına izin vermeli:

### 1. MERAK
Öğretmen:

“Bu parçanın ne olduğunu tahmin edebilir misiniz?”

### 2. KEŞFET
Öğrenci 3D parçayı döndürür.

### 3. İNCELE
Parça üzerindeki noktaları keşfeder.

### 4. OKU
Sağdaki bilgileri inceler.

### 5. TAHMİN ET
Öğretmen parçanın görevini sorar.

### 6. TEST ET
Mini soruyu cevaplar.

Bu akış tek uygulama içinde gerçekleşmeli.

---

# 22. ANA SAYFA

Ana sayfada:

**DİJİTAL DONANIM LABORATUVARI**

“Bilgisayarın parçalarını keşfet.”

butonu bulunmalı.

Altında:

**DONANIMLARI KEŞFET**

kartları.

---

# 23. DONANIM DETAY SAYFASI

Örnek ekran:

```text
-----------------------------------------------------
|                                                     |
|       3D MODEL              |  İŞLEMCİ (CPU)      |
|                             |                      |
|       [ CPU MODELİ ]        |  Görevi              |
|                             |  ...                 |
|                             |                      |
|                             |  Nerede bulunur?     |
|                             |  ...                 |
|                             |                      |
|  ↻ Döndür   + Yaklaştır     |  💡 Kısaca           |
|                             |  ...                 |
-----------------------------------------------------
```

---

# 24. PERFORMANS

Uygulama hızlı açılmalı.

3D modeller lazy-load edilmeli.

Gereksiz büyük dosyalar kullanılmamalı.

Model yüklenirken:

“Donanım hazırlanıyor...”

yükleme ekranı gösterilmeli.

3D model yüklenemezse uygulama çökmemeli.

Bunun yerine görsel yedek gösterilmeli.

---

# 25. ERİŞİLEBİLİRLİK

- yüksek kontrast
- büyük yazılar
- klavye desteği
- dokunmatik kullanım
- anlaşılır ikonlar
- ikon + metin kullanımı
- renkleri tek başına anlam taşıyıcı olarak kullanmama

özelliklerine dikkat et.

---

# 26. TEKNİK TERCİHLER

Tercihen:

- React
- TypeScript
- Three.js
- React Three Fiber
- Tailwind CSS

kullan.

Ancak Antigravity ortamında daha stabil ve basit bir çözüm gerekiyorsa uygun alternatif seçebilirsin.

Öncelik:

1. Çalışan uygulama
2. Dokunmatik 3D deneyim
3. Kolay veri yönetimi
4. Öğretmen kullanım kolaylığı
5. Görsel kalite

---

# 27. VERİLERİ BENİM EKLEYEBİLMEM

Uygulamayı özellikle şu mantıkla tasarla:

Ben daha sonra sana şu şekilde veri verebilmeliyim:

```text
Donanım:
RAM

Kategori:
Bellek

Görevi:
Bilgisayar çalışırken kullanılan geçici bellektir.

Kısaca:
Bilgisayarın o anda yaptığı işlemlerde kullandığı geçici bellektir.

Görsel:
ram.png

3D Model:
ram.glb
```

Bu verileri sisteme eklediğimde uygulama otomatik olarak yeni donanımı göstermeli.

Kod içerisinde her parçayı tek tek hard-code etmekten kaçın.

---

# 28. ÖNEMLİ: 3D MODEL KONUSU

Gerçek 3D model dosyaları elimde olmayabilir.

Bu nedenle sistemi sadece hazır 3D dosyalara bağımlı yapma.

Model varsa:
→ Gerçek 3D modeli göster.

Model yoksa:
→ Yüksek kaliteli görsel + etkileşimli ürün inceleme alanı göster.

Ancak mimari ileride GLB/GLTF eklenmesine hazır olmalı.

---

# 29. DEMO İÇİN ÖNCELİK

İlk sürümde bütün özellikleri aynı anda yapmaya çalışma.

Önce çalışan bir MVP oluştur:

1. Ana ekran
2. Donanım kartları
3. 3D görüntüleme alanı
4. Döndürme
5. Yakınlaştırma
6. Bilgi paneli
7. 5–7 demo donanım
8. Dokunmatik kullanım
9. Akıllı tahta uyumu

Bunlar stabil çalıştıktan sonra:

- hotspot
- mini test
- görevler
- öğretmen paneli
- sesli anlatım
- karşılaştırma

özelliklerini ekle.

---

# 30. ANTIGRAVITY'DE ÇALIŞMA ŞEKLİ

Projeyi oluştururken:

### AŞAMA 1
Proje mimarisini oluştur.

### AŞAMA 2
Ana ekranı oluştur.

### AŞAMA 3
Donanım veri yapısını oluştur.

### AŞAMA 4
3D viewer oluştur.

### AŞAMA 5
Dokunmatik kontrolleri ekle.

### AŞAMA 6
Bilgi panelini bağla.

### AŞAMA 7
Demo donanımları ekle.

### AŞAMA 8
Akıllı tahta üzerinde test et.

### AŞAMA 9
Hotspot sistemini ekle.

### AŞAMA 10
Mini test sistemini ekle.

Her aşamadan sonra uygulamayı çalıştır ve hataları düzelt.

---

# 31. KALİTE KONTROL

Projeyi tamamlamadan önce aşağıdaki maddeleri test et:

- [ ] Akıllı tahtada dokunmatik döndürme çalışıyor.
- [ ] Yakınlaştırma çalışıyor.
- [ ] 3D model sıfırlanabiliyor.
- [ ] Donanım değiştirilebiliyor.
- [ ] Bilgi paneli doğru veriyi gösteriyor.
- [ ] Yazılar sınıfta okunabilir.
- [ ] Butonlar dokunmatik kullanım için yeterince büyük.
- [ ] 3D model yüklenmezse uygulama çökmüyor.
- [ ] Tablet/masaüstü görünümü bozulmuyor.
- [ ] Türkçe karakterler düzgün görüntüleniyor.
- [ ] Öğretmen yeni donanım ekleyebilecek şekilde veri yapısı hazırlanmış.
- [ ] Uygulama gereksiz karmaşık görünmüyor.

---

# 32. SON TASARIM HEDEFİ

Bu uygulama basit bir “donanım bilgi sitesi” gibi görünmemeli.

Hedef deneyim:

> Öğretmen akıllı tahtada bir bilgisayar parçasını açıyor.  
> Öğrenci parçayı parmağıyla döndürüyor.  
> Yaklaştırıyor.  
> Üzerindeki bölümlere dokunuyor.  
> Sağ taraftaki bilgileri okuyor.  
> Sonra kısa bir soruyu cevaplıyor.

Öğrencide şu hissi oluştur:

**“Bilgisayarın parçalarını gerçekten inceliyorum.”**

Uygulamanın temel eğitim amacı budur.

Önce MVP'yi çalışır hale getir. Daha sonra gelişmiş özellikleri ekle.
