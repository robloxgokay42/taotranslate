// =================================================================
// TAOranslater: Yapay Zeka Dedektörü - TAOTrans 1.0 (Alpha)
// =================================================================

/**
 * Global değişkenler
 */
const MAX_ALPHA_SCORE = 35; // Alpha sürümünde maksimum puan (100'e normalize edilecek)

/**
 * Metindeki basit yazım ve gramer hatalarını kontrol eder.
 * Mükemmel yazılmış metinler YZ olma ihtimalini artırır.
 * @param {string} metin 
 * @returns {boolean} Metin kusursuzsa true, hata varsa false.
 */
function gramerKusursuzluguKontrolu(metin) {
    // Türkçe için çok basit bir örnek: Yaygın hataları kontrol et.
    // Gerçek bir uygulamada çok daha detaylı NLP kütüphaneleri (ör: Turkuaz JS) gerekir.
    
    // 1. Yazım hatası içeren kelime kontrolü (Çok basit bir kelime listesi)
    const yanlisKelimeler = ['herkez', 'yanlız', 'kirpik', 'orjinal', 'supriz'];
    for (const kelime of yanlisKelimeler) {
        if (metin.toLowerCase().includes(kelime)) {
            return false; // Hata bulundu
        }
    }
    
    // 2. Noktalama sonrası boşluk kontrolü (Basit kontrol)
    if (metin.includes(",.") || metin.includes("..") || metin.includes(",,")) {
        return false; // Hata bulundu
    }

    return true; // Hata bulunmadı (Kusursuz sayılır)
}


/**
 * Metindeki cümlelerin yapısal olarak ne kadar homojen olduğunu kontrol eder.
 * YZ metinleri genellikle aynı ritme ve yapıya sahiptir.
 * @param {string} metin
 * @returns {boolean} Cümleler homojen ve aynı yapıdaysa true.
 */
function cumleHomojenligiAnalizi(metin) {
    const cumleler = metin.match(/[^.!?]+[.!?]/g) || []; // Metni cümlelere ayır

    if (cumleler.length < 3) return false;

    let totalLength = 0;
    const uzunluklar = cumleler.map(c => {
        const length = c.trim().split(/\s+/).length; // Kelime sayısı
        totalLength += length;
        return length;
    });

    const ortalama = totalLength / uzunluklar.length;
    let standartSapmaKaresi = 0;

    // Standart sapma hesaplama
    for (const uzunluk of uzunluklar) {
        standartSapmaKaresi += Math.pow(uzunluk - ortalama, 2);
    }
    const standartSapma = Math.sqrt(standartSapmaKaresi / uzunluklar.length);

    // Eğer Standart Sapma, ortalamanın %20'sinden azsa, cümleler aşırı homojendir.
    return standartSapma < (ortalama * 0.20);
}


/**
 * Ana puanlama fonksiyonu (TAOTrans 1.0 Mantığı)
 * @param {string} metin 
 * @returns {number} 0 ile 100 arasında Yapay Zeka olasılık yüzdesi.
 */
function taoTrans_1_0_Puanlayici(metin) {
    let yzPuani = 0;
    
    // Metin çok kısaysa güvenilir analiz yapmayız
    if (metin.trim().split(/\s+/).length < 20) {
        return -1; // Analiz yapılamaz kodu
    }

    // --- KURAL 1: Gramer Mükemmelliği (+20 Puan) ---
    if (gramerKusursuzluguKontrolu(metin)) {
        yzPuani += 20;
    }
    
    // --- KURAL 2: Cümle Homojenliği (+15 Puan) ---
    if (cumleHomojenligiAnalizi(metin)) {
        yzPuani += 15;
    }

    // Puanı Yüzdeye Çevirme (Normalizasyon)
    const yzYuzdesi = (yzPuani / MAX_ALPHA_SCORE) * 100;

    return Math.min(100, Math.round(yzYuzdesi));
}

/**
 * HTML arayüzünden tetiklenen ana fonksiyon.
 */
function analizBaslat() {
    const metinGiris = document.getElementById('metinGiris');
    const metin = metinGiris.value;
    const sonucYuzdeEl = document.getElementById('sonucYuzde');
    const sonucAciklamaEl = document.getElementById('sonucAciklama');

    if (!metin.trim()) {
        alert("Lütfen analiz etmek istediğiniz bir metin girin.");
        return;
    }

    // Temizleme: Eski sonuç sınıflarını kaldır
    sonucYuzdeEl.classList.remove('low-ai', 'medium-ai', 'high-ai');

    const yzYuzdesi = taoTrans_1_0_Puanlayici(metin);

    if (yzYuzdesi === -1) {
        sonucYuzdeEl.textContent = "N/A";
        sonucAciklamaEl.textContent = "Analiz için yeterli uzunlukta metin girilmedi (min. 20 kelime).";
        sonucYuzdeEl.classList.add('medium-ai');
        return;
    }

    sonucYuzdeEl.textContent = `${yzYuzdesi}%`;

    let aciklama = "";
    if (yzYuzdesi < 30) {
        aciklama = "Çok Yüksek İnsan Olasılığı. Metin büyük ihtimalle bir insan tarafından yazılmıştır.";
        sonucYuzdeEl.classList.add('low-ai');
    } else if (yzYuzdesi >= 30 && yzYuzdesi < 65) {
        aciklama = "Orta Olasılık. Metinde YZ özelliklerine ait işaretler olsa da, insan müdahalesi de olabilir.";
        sonucYuzdeEl.classList.add('medium-ai');
    } else {
        aciklama = "Yüksek Yapay Zeka Olasılığı. Metin kusursuz gramer ve homojen yapı sergiliyor. YZ ürünü olabilir.";
        sonucYuzdeEl.classList.add('high-ai');
    }

    sonucAciklamaEl.textContent = aciklama;
}
