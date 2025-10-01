// =================================================================
// TAOranslater: Yapay Zeka Dedektörü - TAOTrans 1.0 (Alpha)
// =================================================================

/** Global Değişkenler **/
const MAX_ALPHA_SCORE = 35; // TAOTrans 1.0 için maksimum puan
const MAX_ANALYSIS_TIME_MS = 3000; // Analiz süresi simülasyonu (3 saniye olarak ayarladım, 10 saniye çok uzun gelebilir.)

/**
 * UTILITY FONKSİYONLAR (Yardımcı Fonksiyonlar)
 */

/**
 * Metindeki basit yazım ve gramer hatalarını kontrol eder.
 * TAOTrans 1.0 Kuralı: Gramer Kusursuzluğu (+20 Puan)
 */
function gramerKusursuzluguKontrolu(metin) {
    const yanlisKelimeler = ['herkez', 'yanlız', 'kirpik', 'orjinal', 'supriz'];
    for (const kelime of yanlisKelimeler) {
        if (metin.toLowerCase().includes(kelime)) {
            return false;
        }
    }
    // Noktalama sonrası boşluk kontrolü (Basit kontrol)
    if (metin.includes(",.") || metin.includes("..") || metin.includes(",,")) {
        return false;
    }
    return true;
}

/**
 * Cümlelerin yapısal olarak ne kadar homojen olduğunu kontrol eder.
 * TAOTrans 1.0 Kuralı: Cümle Homojenliği Analizi (+15 Puan)
 */
function cumleHomojenligiAnalizi(metin) {
    const cumleler = metin.match(/[^.!?]+[.!?]/g) || [];
    if (cumleler.length < 3) return false;

    let totalLength = 0;
    const uzunluklar = cumleler.map(c => {
        const length = c.trim().split(/\s+/).length;
        totalLength += length;
        return length;
    });

    const ortalama = totalLength / uzunluklar.length;
    let standartSapmaKaresi = 0;

    for (const uzunluk of uzunluklar) {
        standartSapmaKaresi += Math.pow(uzunluk - ortalama, 2);
    }
    const standartSapma = Math.sqrt(standartSapmaKaresi / uzunluklar.length);

    // Eğer Standart Sapma, ortalamanın %20'sinden azsa, cümleler aşırı homojendir.
    return standartSapma < (ortalama * 0.20);
}


/**
 * PUANLAYICI MOTORLARI
 */

/**
 * TAOTrans 1.0 Mantığı: Temel Alpha Analizi
 * @param {string} metin 
 * @returns {{yuzde: number, sebep: string, isAnalizable: boolean}}
 */
function taoTrans_1_0_Puanlayici(metin) {
    let yzPuani = 0;
    let sebep = [];
    
    // Metin çok kısaysa analiz yapılamaz
    if (metin.trim().split(/\s+/).length < 20) {
        return {yuzde: 0, sebep: "Analiz için çok kısa metin.", isAnalizable: false};
    }

    // KURAL 1: Gramer Mükemmelliği
    if (gramerKusursuzluguKontrolu(metin)) {
        yzPuani += 20;
        sebep.push("Metin kusursuz bir dilbilgisi ve yazım kullanıyor. Bu, YZ çıktısının güçlü bir işaretidir.");
    } else {
        sebep.push("Metinde basit yazım veya dilbilgisi hataları tespit edildi. Bu insan müdahalesini veya yazımını gösterir.");
    }
    
    // KURAL 2: Cümle Homojenliği
    if (cumleHomojenligiAnalizi(metin)) {
        yzPuani += 15;
        sebep.push("Cümle uzunlukları ve yapıları arasında aşırı benzerlik var. Bu, YZ'nin standartlaşmış ritmini taklit eder.");
    } else {
        sebep.push("Cümle uzunlukları ve yapıları doğal bir çeşitlilik gösteriyor.");
    }

    // Puanı Yüzdeye Çevirme (Normalizasyon)
    const yzYuzdesi = (yzPuani / MAX_ALPHA_SCORE) * 100;

    return {
        yuzde: Math.min(100, Math.round(yzYuzdesi)),
        sebep: sebep.join(" "),
        isAnalizable: true
    };
}

/**
 * TAOTrans 1.1 Mantığı (Geliştirme Aşamasında - Sadece Alpha sonucunu döndürecek)
 */
function taoTrans_1_1_Puanlayici(metin) {
    // 1.1 sürümü için daha sofistike kurallar buraya eklenecek. 
    // Şimdilik sadece 1.0 sonucunu döndürüyoruz
    const sonuc = taoTrans_1_0_Puanlayici(metin);
    if (sonuc.isAnalizable) {
        sonuc.sebep = "TAOTrans 1.1, daha kapsamlı analiz yapmıştır. Sonuç, temel kusursuzluk ve homojenlik işaretleri baz alınarak optimize edilmiştir. " + sonuc.sebep;
    }
    return sonuc;
}

/**
 * TAOTrans 1.5 Mantığı (Kullanıma Kapalı)
 */
function taoTrans_1_5_Puanlayici(metin) {
    return {yuzde: 0, sebep: "Bu sürüm henüz kullanıma kapalıdır.", isAnalizable: false};
}


/**
 * ANA KONTROL FONKSİYONU
 */

function analizBaslat() {
    const metinGirisEl = document.getElementById('metinGiris');
    const modelSelectorEl = document.getElementById('modelSelector');
    const dedekteEtButtonEl = document.getElementById('dedekteEtButton');
    const progressBarContainerEl = document.getElementById('progressBarContainer');
    const metin = metinGirisEl.value;

    if (!metin.trim()) {
        alert("Lütfen analiz etmek istediğiniz bir metin girin.");
        return;
    }

    // Arayüzü Hazırla
    dedekteEtButtonEl.disabled = true;
    document.getElementById('sonucAlani').classList.add('hidden');
    progressBarContainerEl.classList.remove('hidden');
    
    // İlerleme Çubuğunu Başlat
    const startTime = Date.now();
    const interval = 100; // Her 100ms'de güncelle
    
    const progressInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        let progress = Math.min(100, (elapsedTime / MAX_ANALYSIS_TIME_MS) * 100);
        
        document.getElementById('progressBar').style.width = `${progress}%`;
        document.getElementById('progressText').textContent = `Analiz ediliyor... (%${Math.round(progress)})`;
        
        if (elapsedTime >= MAX_ANALYSIS_TIME_MS) {
            clearInterval(progressInterval);
            // Analiz tamamlandıktan sonra sonucu göster
            sonucGoster(metin, modelSelectorEl.value);
        }
    }, interval);

}


/**
 * Sonucu hesaplayan ve arayüzde gösteren fonksiyon
 * @param {string} metin 
 * @param {string} seciliModel 
 */
function sonucGoster(metin, seciliModel) {
    const dedekteEtButtonEl = document.getElementById('dedekteEtButton');
    const progressBarContainerEl = document.getElementById('progressBarContainer');
    const sonucYuzdeEl = document.getElementById('sonucYuzde');
    const sonucAciklamaEl = document.getElementById('sonucAciklama');
    const aiPercentEl = document.getElementById('aiPercent');
    const humanPercentEl = document.getElementById('humanPercent');
    const sabitSebepEl = document.getElementById('sabitSebep');
    const sonucAlaniEl = document.getElementById('sonucAlani');

    // Seçilen modele göre puanlayıcıyı belirle
    let sonuc;
    switch (seciliModel) {
        case 'TAOTrans_1_0':
            sonuc = taoTrans_1_0_Puanlayici(metin);
            break;
        case 'TAOTrans_1_1':
            sonuc = taoTrans_1_1_Puanlayici(metin);
            break;
        case 'TAOTrans_1_5':
            sonuc = taoTrans_1_5_Puanlayici(metin);
            break;
        default:
            sonuc = {yuzde: 0, sebep: "Geçersiz model seçimi.", isAnalizable: false};
    }
    
    // Arayüzü Temizle
    sonucYuzdeEl.classList.remove('low-ai', 'medium-ai', 'high-ai');
    progressBarContainerEl.classList.add('hidden');
    sonucAlaniEl.classList.remove('hidden');
    dedekteEtButtonEl.disabled = false;
    
    // Sonuçları Ekrana Yazdır
    if (!sonuc.isAnalizable) {
        sonucYuzdeEl.textContent = "N/A";
        sonucAciklamaEl.textContent = sonuc.sebep;
        aiPercentEl.textContent = "--%";
        humanPercentEl.textContent = "--%";
        sabitSebepEl.textContent = "Analiz için gerekli koşullar sağlanamadı.";
        sonucYuzdeEl.classList.add('medium-ai');
        return;
    }

    const yzYuzdesi = sonuc.yuzde;
    const insanYuzdesi = 100 - yzYuzdesi;
    
    sonucYuzdeEl.textContent = `${yzYuzdesi}%`;
    aiPercentEl.textContent = `${yzYuzdesi}%`;
    humanPercentEl.textContent = `${insanYuzdesi}%`;

    let aciklama = "";
    if (yzYuzdesi < 30) {
        aciklama = "Çok Yüksek İnsan Olasılığı.";
        sonucYuzdeEl.classList.add('low-ai');
    } else if (yzYuzdesi >= 30 && yzYuzdesi < 65) {
        aciklama = "Orta Olasılık. Karışık işaretler mevcut.";
        sonucYuzdeEl.classList.add('medium-ai');
    } else {
        aciklama = "Yüksek Yapay Zeka Olasılığı.";
        sonucYuzdeEl.classList.add('high-ai');
    }

    sonucAciklamaEl.textContent = aciklama;
    sabitSebepEl.textContent = sonuc.sebep;
}
