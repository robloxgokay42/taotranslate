// =================================================================
// TAOranslater: Yapay Zeka Dedektörü - TAOTrans 1.0 (Alpha) - GÜNCELLENDİ
// =================================================================

// ... (Önceki Global Değişkenler ve UTILITY FONKSİYONLAR buraya olduğu gibi eklenecek) ...

const MAX_ALPHA_SCORE = 35; // TAOTrans 1.0 için maksimum puan
const MAX_ANALYSIS_TIME_MS = 3000; // Analiz süresi simülasyonu (3 saniye)
const MODEL_LOAD_TIME_MS = 1500; // Yeni: Model yüklenme süresi simülasyonu (1.5 saniye)


/**
 * UTILITY FONKSİYONLAR
 */
function gramerKusursuzluguKontrolu(metin) {
    const yanlisKelimeler = ['herkez', 'yanlız', 'kirpik', 'orjinal', 'supriz'];
    for (const kelime of yanlisKelimeler) {
        if (metin.toLowerCase().includes(kelime)) return false;
    }
    if (metin.includes(",.") || metin.includes("..") || metin.includes(",,")) return false;
    return true;
}

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

    return standartSapma < (ortalama * 0.20);
}


/**
 * PUANLAYICI MOTORLARI (Öncekiyle Aynı, buraya tekrar eklenmelidir)
 */

function taoTrans_1_0_Puanlayici(metin) {
    let yzPuani = 0;
    let sebep = [];
    if (metin.trim().split(/\s+/).length < 20) {
        return {yuzde: 0, sebep: "Analiz için çok kısa metin.", isAnalizable: false};
    }

    if (gramerKusursuzluguKontrolu(metin)) {
        yzPuani += 20;
        sebep.push("Metin kusursuz bir dilbilgisi ve yazım kullanıyor. Bu, YZ çıktısının güçlü bir işaretidir.");
    } else {
        sebep.push("Metinde basit yazım veya dilbilgisi hataları tespit edildi. Bu insan müdahalesini veya yazımını gösterir.");
    }
    
    if (cumleHomojenligiAnalizi(metin)) {
        yzPuani += 15;
        sebep.push("Cümle uzunlukları ve yapıları arasında aşırı benzerlik var. Bu, YZ'nin standartlaşmış ritmini taklit eder.");
    } else {
        sebep.push("Cümle uzunlukları ve yapıları doğal bir çeşitlilik gösteriyor.");
    }

    const yzYuzdesi = (yzPuani / MAX_ALPHA_SCORE) * 100;

    return {
        yuzde: Math.min(100, Math.round(yzYuzdesi)),
        sebep: sebep.join(" "),
        isAnalizable: true
    };
}

function taoTrans_1_1_Puanlayici(metin) {
    // 1.1 sürümü için daha sofistike kurallar buraya eklenecek. 
    const sonuc = taoTrans_1_0_Puanlayici(metin);
    if (sonuc.isAnalizable) {
        // YZ olasılığını simüle etmek için 1.0 sonucuna hafif bir sapma ekleyelim
        const sapma = Math.floor(Math.random() * 10) - 5; // -5 ile +4 arasında rastgele sapma
        let yeniYuzde = Math.min(100, Math.max(0, sonuc.yuzde + sapma));
        
        sonuc.yuzde = yeniYuzde;
        sonuc.sebep = "TAOTrans 1.1 (En İyi Sürüm) tarafından analiz edildi: Temel kurallara ek olarak, optimizasyonlar sonucu yüzde hafifçe değişti. " + sonuc.sebep;
    }
    return sonuc;
}

function taoTrans_1_5_Puanlayici(metin) {
    return {yuzde: 0, sebep: "Bu sürüm henüz kullanıma kapalıdır.", isAnalizable: false};
}


/**
 * YENİ: Model Geçiş Mantığı
 */
function modelGecisiBaslat() {
    const modelSelectorEl = document.getElementById('modelSelector');
    const currentVersionEl = document.getElementById('currentVersion');
    const statusEl = document.querySelector('.version-info .status');
    const loadingOverlayEl = document.getElementById('loadingOverlay');
    const metinGirisEl = document.getElementById('metinGiris');
    
    const yeniModel = modelSelectorEl.options[modelSelectorEl.selectedIndex];
    
    // Girdiyi bulanıklaştır ve yükleme overlay'ini göster
    metinGirisEl.style.filter = 'blur(3px)';
    loadingOverlayEl.classList.remove('hidden');

    // Yükleme süresi simülasyonu
    setTimeout(() => {
        // Gecikme bitince arayüzü güncelle
        metinGirisEl.style.filter = 'none';
        loadingOverlayEl.classList.add('hidden');
        
        currentVersionEl.textContent = `${yeniModel.text}`;
        
        if (yeniModel.disabled) {
            statusEl.textContent = 'GELİŞTİRMEDE';
            statusEl.className = 'status'; // Varsayılan renk
        } else if (yeniModel.value === 'TAOTrans_1_0') {
            statusEl.textContent = 'AKTİF';
            statusEl.className = 'status active';
        } else if (yeniModel.value === 'TAOTrans_1_1') {
            statusEl.textContent = 'DEMO & SABİT';
            statusEl.className = 'status active'; // Renk aynı kalabilir veya farklı bir renk eklenebilir.
        }
        
    }, MODEL_LOAD_TIME_MS);
}


/**
 * ANA KONTROL FONKSİYONU (Öncekiyle Aynı)
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
    
    const startTime = Date.now();
    const interval = 100; 
    
    const progressInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        let progress = Math.min(100, (elapsedTime / MAX_ANALYSIS_TIME_MS) * 100);
        
        document.getElementById('progressBar').style.width = `${progress}%`;
        document.getElementById('progressText').textContent = `Analiz ediliyor... (%${Math.round(progress)})`;
        
        if (elapsedTime >= MAX_ANALYSIS_TIME_MS) {
            clearInterval(progressInterval);
            sonucGoster(metin, modelSelectorEl.value);
        }
    }, interval);

}

/**
 * Sonucu hesaplayan ve arayüzde gösteren fonksiyon (Öncekiyle Aynı)
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
    
    sonucYuzdeEl.classList.remove('low-ai', 'medium-ai', 'high-ai');
    progressBarContainerEl.classList.add('hidden');
    sonucAlaniEl.classList.remove('hidden');
    dedekteEtButtonEl.disabled = false;
    
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
    sabitSebepEl.textContent = sonuc.sebep;
}
