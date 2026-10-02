import type { HardwareDataset } from '../types/hardware';
import defaultRawData from './defaultData.json';

export const defaultCategories: string[] = [
  'Giriş Birimi',
  'Çıkış Birimi',
  'Hem Giriş Hem Çıkış Birimi',
  'İşlem',
  'Bellek',
  'Görüntü',
  'Ana Donanım',
  'Depolama',
  'Güç',
  'Soğutma',
  'Ağ'
];

export const defaultCategoryDescriptions: Record<string, string> = {
  'Giriş Birimi': 'Bilgisayara dışarıdan komut veya bilgi girişi yapılmasını sağlayan donanımlardır. Giriş birimleri bilgisayara ses, komut, resim vb. bilgiler gönderir. Örnek: Fare, Klavye, Tarayıcı, Webcam, Mikrofon',
  'Çıkış Birimi': 'Bilgisayardan dış ortama komut veya bilgi çıkışı yapılmasını sağlayan donanımlardır. Çıkış birimleri bilgisayardan ses, yazı, görüntü vb. bilgileri dışarı aktarmamızı sağlar Örnek: Hoparlör, Ekran, Yazıcı, Kulaklık',
  'Hem Giriş Hem Çıkış Birimi': 'Bazı donanım birimleri hem bilgi aktarımında hem de bilgi alımında kullanıldığı için hem giriş hem çıkış birimi olarak değerlendirilir. Örnek: CD, USB, Harddisk',
  'İşlem': 'Bilgisayarın mantıksal ve matematiksel komutlarını işleyen merkezi işlem birimidir.',
  'Bellek': 'Çalışan programların ve verilerin geçici olarak tutulduğu hızlı hafıza birimidir.',
  'Görüntü': 'Bilgisayardaki verileri monitöre aktararak görselleştiren grafik işlem birimidir.',
  'Ana Donanım': 'Tüm donanım parçalarını birbirine bağlayan ve koruyan temel gövde bileşenleridir.',
  'Depolama': 'Verileri, programları ve dosyaları kalıcı olarak saklayan hafıza birimleridir.',
  'Güç': 'Şebeke elektriğini bilgisayar bileşenlerinin ihtiyacı olan akım ve voltaja çeviren güç birimidir.',
  'Soğutma': 'Donanımların aşırı ısınmasını önleyerek kararlı ve güvenli çalışmasını sağlayan birimdir.',
  'Ağ': 'Bilgisayarların birbirleriyle ve internetle iletişim kurmasını sağlayan bağlantı birimleridir.'
};

export const initialHardwareData: HardwareDataset = {
  ...(defaultRawData as unknown as HardwareDataset),
  categories: (defaultRawData as any).categories || defaultCategories
};
