// =================================================================
// TAOranslater: Yapay Zeka Dedektörü - TAOTrans 1.1 (EN İYİ SÜRÜM) - SON GÜNCELLEME
// =================================================================

/** Global Değişkenler **/
const MAX_ALPHA_SCORE = 35; 
const MAX_BETA_SCORE = 85; 
const MAX_ANALYSIS_TIME_MS = 3000; 
const MODEL_LOAD_TIME_MS = 1500; 

// ----------------------------------------------------------------
// UTILITY FONKSİYONLAR VE KURAL TANIMLARI
// ----------------------------------------------------------------

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

function kelimeZenginligiAnalizi(metin) { 
    const kelimeler = metin.toLowerCase().match(/\b\w+\b/g) || [];
    if (kelimeler.length === 0) return false;
    const benzersizKelimeler = new Set(kelimeler);
    const ttr = benzersizKelimeler.size / kelimeler.length;
    
    return (ttr > 0.75 || ttr < 0.45);
}

function duygusallikKontrolu(metin) { 
    const kisilikKelimeleri = ['bana göre', 'şahsen', 'inanıyorum ki', 'duygusal olarak', 'benim düşüncem'];
    let kisilikSayisi = 0;
    for (const kelime of kisilikKelimeleri) {
        if (metin.toLowerCase().includes(kelime)) {
            kisilikSayisi++;
        }
    }
    
    const kelimeSayisi = metin.split(/\s+/).length;
    
    return kisilikSayisi > 3 || (kelimeSayisi > 50 && kisilikSayisi === 0);
}

function kliseKontrolu(metin) { 
    const kliseler = ['sonuç olarak', 'bununla birlikte', 'derinlemesine bir bakış', 'günümüz dünyasında', 'göz ardı etmemek gerekir', 'ek olarak'];
    let kliseSayisi = 0;
    for (const klise of kliseler) {
        if (metin.toLowerCase().includes(klise)) {
            kliseSayisi++;
        }
    }
    return kliseSayisi > 2;
}

// ----------------------------------------------------------------
// PUANLAYICI MOTORLARI
// ----------------------------------------------------------------

/** TAOTrans 1.0 Mantığı: Temel Alpha Analizi **/
function taoTrans_1_0_Puanlayici(metin) {
    let yzPuani = 0;
    let sebep = [];
    if (metin.trim().split(/\s+/).length < 20) {
        return {yuzde: 0, sebep: "Analiz için çok kısa metin (min 20 kelime).", isAnalizable: false};
    }

    if (gramerKusursuzluguKontrolu(metin)) {
        yzPuani += 20;
        sebep.push("✅ <b>Kusursuz Gramer/Yazım</b>: YZ ihtimali yüksek."); // <b> Eklendi
    } else {
        sebep.push("❌ Gramer/Yazım Hataları: İnsan ihtimali yüksek.");
    }
    
    if (cumleHomojenligiAnalizi(metin)) {
        yzPuani += 15;
        sebep.push("✅ <b>Homojen Cümle Yapısı</b>: YZ ritmi tespit edildi."); // <b> Eklendi
    } else {
        sebep.push("❌ Çeşitli Cümle Yapıları: Doğal akış tespit edildi.");
    }

    const yzYuzdesi = (yzPuani / MAX_ALPHA_SCORE) * 100;

    return {
        yuzde: Math.min(100, Math.round(yzYuzdesi)),
        sebep: "TAOTrans 1.0 (Alpha) Analiz Özeti: " + sebep.join(" | "),
        isAnalizable: true
    };
}

/** TAOTrans 1.1 Mantığı: Gelişmiş Beta Analizi - STABİLİZE EDİLDİ **/
function taoTrans_1_1_Puanlayici(metin) {
    let yzPuani = 0;
    let sebep = [];
    
    const kelimeSayisi = metin.trim().split(/\s+/).length;
    if (kelimeSayisi < 30) { 
        return {yuzde: 0, sebep: "Analiz için çok kısa metin (min 30 kelime).", isAnalizable: false};
    }

    // KURAL 1.1.1 (15 Puan)
    if (gramerKusursuzluguKontrolu(metin)) { yzPuani += 15; sebep.push("✅ <b>Kusursuz Gramer/Yazım</b>"); } else { sebep.push("❌ Gramer/Yazım Hataları"); }
    // KURAL 1.1.2 (15 Puan)
    if (cumleHomojenligiAnalizi(metin)) { yzPuani += 15; sebep.push("✅ <b>Homojen Cümle Yapısı</b>"); } else { sebep.push("❌ Çeşitli Cümle Yapıları"); }

    // KURAL 1.1.3: Kelime Zenginliği (25 Puan)
    if (kelimeZenginligiAnalizi(metin)) { 
        yzPuani += 25; 
        sebep.push("✅ <b>Anormal Kelime Zenginliği</b>: TTR doğal olmayan bir aralıkta."); 
    } else {
         yzPuani -= 10; 
         sebep.push("❌ Doğal Kelime Çeşitliliği"); 
    }

    // KURAL 1.1.4: Duygusallık/Ton (15 Puan)
    if (duygusallikKontrolu(metin)) { 
        yzPuani += 15; 
        sebep.push("✅ <b>Zorlama Ton</b>: Aşırı resmiyet veya zorlama kişisel zamir/ifadeler."); 
    } else {
        sebep.push("❌ Doğal Ton Akışı");
    }

    // KURAL 1.1.5: Klişe Kontrolü (15 Puan)
    if (kliseKontrolu(metin)) { 
        yzPuani += 15; 
        sebep.push("✅ <b>Klişe Aşırı Kullanımı</b>: YZ'nin geçiş kelimeleri tespit edildi."); 
    } else {
        sebep.push("❌ Düşük Klişe Kullanımı");
    }
    
    // Puanı [0, 85] aralığında tut
    yzPuani = Math.min(MAX_BETA_SCORE, Math.max(0, yzPuani)); 
    
    const yzYuzdesi = (yzPuani / MAX_BETA_SCORE) * 100; 

    // Yüksek insan olasılığı durumunda yüzdeyi 30'un altına çekmek için ek kontrol
    if (yzPuani < 30) {
        const sabitYuzde = Math.min(30, Math.round(yzYuzdesi / 2));
        return {
            yuzde: sabitYuzde,
            sebep: "TAOTrans 1.1 (En İyi Sürüm) Analiz Özeti: Yüksek İnsan İhtimali nedeniyle skor dengelendi. " + sebep.join(" | "),
            isAnalizable: true
        };
    }
    
    return {
        yuzde: Math.min(100, Math.round(yzYuzdesi)),
        sebep: "TAOTrans 1.1 (En İyi Sürüm) Analiz Özeti: " + sebep.join(" | "),
        isAnalizable: true
    };
}

function taoTrans_1_5_Puanlayici(metin) {
    return {yuzde: 0, sebep: "Bu sürüm henüz kullanıma kapalıdır (Geliştirme Aşamasında).", isAnalizable: false};
}


// ----------------------------------------------------------------
// ARABİRİM VE KONTROL FONKSİYONLARI 
// ----------------------------------------------------------------

/** Tema Değiştirme Fonksiyonu **/
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle.querySelector('i');
    
    if (body.getAttribute('data-theme') === 'light') {
        body.setAttribute('data-theme', 'dark');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun'); 
    } else {
        body.setAttribute('data-theme', 'light');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon'); 
    }
}

/** Model Seçimi Yapıldığında Yüklemeyi Başlatır **/
function modelGecisiBaslat() {
    const modelSelectorEl = document.getElementById('modelSelector');
    const currentVersionEl = document.getElementById('currentVersion');
    const statusEl = document.querySelector('.version-info .status');
    const loadingOverlayEl = document.getElementById('loadingOverlay');
    const metinGirisEl = document.getElementById('metinGiris');
    
    const yeniModel = modelSelectorEl.options[modelSelectorEl.selectedIndex];
    
    metinGirisEl.disabled = true; 
    loadingOverlayEl.classList.remove('hidden');

    setTimeout(() => {
        metinGirisEl.disabled = false; 
        loadingOverlayEl.classList.add('hidden');
        
        currentVersionEl.textContent = `${yeniModel.text}`;
        
        if (yeniModel.disabled) {
            statusEl.textContent = 'GELİŞTİRMEDE';
            statusEl.className = 'status'; 
        } else if (yeniModel.value === 'TAOTrans_1_0') {
            statusEl.textContent = 'ALPHA';
            statusEl.className = 'status active';
        } else if (yeniModel.value === 'TAOTrans_1_1') {
            statusEl.textContent = 'DEMO & SABİT';
            statusEl.className = 'status active'; 
        }
        
    }, MODEL_LOAD_TIME_MS);
}

/** Analiz İşlemini Başlatır ve İlerleme Çubuğunu Yönetir **/
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

/** Puanlayıcıdan gelen sonucu ekrana yazdırır **/
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
        sabitSebepEl.innerHTML = "Analiz için gerekli koşullar sağlanamadı."; // innerHTML kullanılır
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
        aciklama = "Çok Yüksek İnsan Olasılığı. Metin, YZ'nin ince izlerini taşımıyor.";
        sonucYuzdeEl.classList.add('low-ai');
    } else if (yzYuzdesi >= 30 && yzYuzdesi < 65) {
        aciklama = "Orta Olasılık. İnsan ve YZ girdilerinin karışımı olabilir.";
        sonucYuzdeEl.classList.add('medium-ai');
    } else {
        aciklama = "Yüksek Yapay Zeka Olasılığı. Metin, YZ'nin belirgin ve gizlenmiş tüm işaretlerini taşıyor.";
        sonucYuzdeEl.classList.add('high-ai');
    }

    sonucAciklamaEl.textContent = aciklama;
    sabitSebepEl.innerHTML = sonuc.sebep; // **innerHTML** ile HTML etiketlerinin (<b>) çalışması sağlandı.
}
