'use strict';

let isPaused = false;
let pausedAnimeInstances = [];
function isExperiencePaused() {
    return isPaused;
}

// ===== SCENE FLOW + MUSIC =====
// File = thứ tự chạy: 1–4 mở đầu → 5 hoa đào → 6 hoa lá → 7 sân khấu → 8 kỷ niệm → 9 trái tim
const SCENE_FLOW = [1, 2, 3, 4, 5, 6, 7, 8, 9];
/** Chờ chuẩn bị trước khi nhạc + nội dung scene chạy (1–2s) */
const SCENE_PREPARE_MS = 1500;
const OPENING_SONG = 'src/music/fallback.mp3';
const QUA_THICH_SONG = 'src/music/qua-thich-cau-roi.mp3';
const SCENE_MUSIC_SRC = [
    OPENING_SONG, // 1
    OPENING_SONG, // 2
    OPENING_SONG, // 3
    OPENING_SONG, // 4 sinh nhật
    'src/music/hoa-dao.mp3', // 5
    QUA_THICH_SONG, // 6 hoa lá
    null, // 7 video
    'src/music/chi-yeu-minh-em.mp3', // 8
    'src/music/lam-nguoi-yeu-anh-nhe.mp3' // 9 tỏ tình
];
const SCENE_MUSIC_ALT = {
    4: ['src/music/hoa-dao.mp3', 'src/music/fallback.mp3'],
    5: [QUA_THICH_SONG, 'src/music/fallback.mp3'],
    7: ['src/music/chi-yeu-minh-em.mp3', 'src/music/fallback.mp3'],
    8: ['src/music/lam-nguoi-yeu-anh-nhe.mp3', 'src/music/fallback.mp3']
};
function sceneNum(flowIdx) { return SCENE_FLOW[flowIdx]; }
function sceneDomId(flowIdx) { return 'scene-' + SCENE_FLOW[flowIdx]; }
function isBirthdayFlow(flowIdx) { return flowIdx >= 0 && flowIdx <= 3; }
// Hoa Đào · Hoàng Rob — 125 BPM, ~2:53
// Timestamps từ faster-whisper (medium, word_timestamps, no VAD) trên hoa-dao.wav
const HOA_DAO = {
    bpm: 125,
    duration: 172.85,
    file: 'hoa-dao.mp3',
    // Vocal ~0:15 — curated từ hoa-dao-lyrics.json (không gắn rap / đoạn ước lượng)
    vocalAt: 15.16,
    // librosa onset-calibrated
    beatOffset: 0.066,
    // Hiện lyric sớm hơn ASR một chút để khỏi “bắt không kịp”
    lyricLead: 0.28,
    cues: {
        verse1: 15.16,
        trunk: 11.5,
        branches: 28.8,
        preBloom: 45.0,
        fullBloom: 62.5,
        petalFly: 62.5,
        chorus: 63.1,
        chorus2: 78.54,
        // Instrumental sau điệp — không nhồi lyric kiểu rap
        outroGlow: 95.0,
        violin: 140
    },
    lyrics: [
        { t: 15.16, text: 'Sơn khê sương trắng bay…' },
        { t: 18.12, text: 'Thấp thoáng bóng hình nàng thơ…' },
        { t: 19.62, text: 'Cho ta thoáng say…' },
        { t: 21.34, text: 'Bóng dáng như đào hoa…' },
        { t: 23.16, text: 'Kiêu sa trong tuyết pha…' },
        { t: 25.86, text: 'Cười ngạo gió đông ngoài xa…' },
        { t: 30.42, text: 'Vươn lên trong giá sương…' },
        { t: 33.52, text: 'Nụ đào mỉm cười kiêu sa…' },
        { t: 35.02, text: 'Khi đông vừa qua…' },
        { t: 37.10, text: 'Người thấy trong lòng bao xốn xang…' },
        { t: 40.32, text: 'Như ta mãi hai mươi…' },
        { t: 45.76, text: 'Nụ hoa nào căng mọng…' },
        { t: 50.08, text: 'Vừa tiếu ngạo đông phong…' },
        { t: 53.48, text: 'Một nét cười đã mở trời xuân xanh…' },
        { t: 63.10, text: 'Hoa bay giữa trời…' },
        { t: 65.50, text: 'Bay, bay như môi cười…' },
        { t: 67.14, text: 'Ta bay giữa đời…' },
        { t: 69.26, text: 'Qua chông gai mấy thời…' },
        { t: 70.70, text: 'Giống như môi hoa đào…' },
        { t: 74.28, text: 'Cười ngạo gió đông…' },
        { t: 78.54, text: 'Hoa bay dạt dào…' },
        { t: 80.34, text: 'Cho ta luôn tin vào…' },
        { t: 82.44, text: 'Sức sống tuôn trào…' },
        { t: 84.44, text: 'Nâng gót chân anh hào…' },
        { t: 85.76, text: 'Vượt ngàn chông gai…' }
    ]
};
// Quá Thích Cậu Rồi · Mr.B / Nguyên Jenda / Great — ~92 BPM, ~3:49
// Timestamps: faster-whisper medium (intro + overlapping windows)
const QUA_THICH = {
    // bpm từ librosa; beatOffset onset-calibrated
    bpm: 92.285,
    duration: 228.93,
    file: 'qua-thich-cau-roi.mp3',
    vocalAt: 14.4,
    beatOffset: 0.1625,
    lyricLead: 0.28,
    beats: null, // mốc beat librosa
    beatStrength: null, // 0–1 độ mạnh bass/onset mỗi beat
    cues: {
        vocalAt: 14.4,
        preChorus: 29.14,
        chorus: 42.1,
        rap: 84.0,
        chorus2: 124.42,
        bridge: 152.1,
        chorus3: 166.7,
        outro: 195.02
    },
    lyrics: [
        { t: 14.4, text: 'Nơi đâu anh sẽ có thể tìm được tình yêu đắm say…' },
        { t: 18.58, text: 'Mang đến cho ta ngọt ngào hay là bao đắng cay…' },
        { t: 21.82, text: 'Anh không biết nhưng anh vẫn mơ…' },
        { t: 23.86, text: 'Cố viết nên muôn vần thơ…' },
        { t: 25.48, text: 'Muốn nói ra anh đang nhờ ơ nhơ sắc nhớ…' },
        { t: 29.14, text: 'Ngồi ở kế bên em mà như rất xa…' },
        { t: 32.54, text: 'Lòng thương nhưng mà anh sợ không nói ra…' },
        { t: 35.56, text: 'Sợ mất đi người tâm tình, mất đi người bên mình…' },
        { t: 39.44, text: 'Cho đến nay anh vẫn còn giấu kín…' },
        { t: 42.1, text: 'Khi mà mình quá thích cậu rồi…' },
        { t: 44.02, text: 'Phải làm sao phải làm sao…' },
        { t: 45.88, text: 'Cậu thấy thế được không…' },
        { t: 47.68, text: 'Sao nào sao nào sao nào…' },
        { t: 49.74, text: 'Đừng nên quá thương ai đừng vẽ tương lai…' },
        { t: 53.3, text: 'Vì sẽ chẳng có điều chi là mai mãi…' },
        { t: 56.08, text: 'Nhưng mà mình quá thích cậu rồi…' },
        { t: 58.2, text: 'Phải làm sao phải làm sao này…' },
        { t: 60.0, text: 'Cậu thấy thế được không…' },
        { t: 61.5, text: 'Sao nào sao nào sao nào…' },
        { t: 63.38, text: 'Dù có những đam mê mình biết sẽ không thể…' },
        { t: 67.38, text: 'Mà sao vẫn yêu nhiều như thế…' },
        { t: 69.98, text: 'Thích cậu rồi…' },
        { t: 71.84, text: 'Sao nào sao nào…' },
        { t: 76.62, text: 'Quá thích cậu rồi…' },
        { t: 84.0, text: 'Anh chỉ muốn giữ trọn mối tình…' },
        { t: 86.08, text: 'Họ bảo chân thành là chưa đủ…' },
        { t: 87.64, text: 'Anh đâu muốn thanh xuân của mình…' },
        { t: 89.48, text: 'Chỉ để tạo ra người yêu cũ…' },
        // Rap mid — ASR miss; timed from web lyrics (hopamnhac / nhachay)
        { t: 91.2, text: 'Vẫn còn đây là những lời nhắn nhủ…' },
        { t: 93.2, text: 'Không phải là lần đầu yêu nhưng…' },
        { t: 95.2, text: 'Anh vẫn đợi dù cho mấy thằng đó…' },
        { t: 97.3, text: 'Có bảo rằng thôi tụi mình đừng yêu nhau…' },
        { t: 99.5, text: 'Thôi ta đâu cần phải dài lâu, phải đậm sâu…' },
        { t: 101.3, text: 'Bởi vì đôi mi em đâu cần ướt…' },
        { t: 102.8, text: 'Anh chỉ muốn làm mờ vết son môi…' },
        { t: 104.0, text: 'Đâu phải mascara như người ta lần trước…' },
        { t: 104.66, text: 'Đôi chân anh bước trên đường vắng…' },
        { t: 106.9, text: 'Nhìn người ta đang có đôi…' },
        { t: 109.0, text: 'Gọi em là ly cà phê đắng…' },
        { t: 109.82, text: 'Mỗi lần anh gặp chỉ muốn được nhấp môi…' },
        { t: 111.7, text: 'Ngồi ở kế bên em mà như rất xa…' },
        { t: 114.68, text: 'Lòng thương nhưng mà anh sợ không nói ra…' },
        { t: 117.82, text: 'Sợ mất đi người tâm tình, mất đi người bên mình…' },
        { t: 121.72, text: 'Cho đến nay anh vẫn còn giấu kín…' },
        { t: 124.42, text: 'Khi mà mình quá thích cậu rồi…' },
        { t: 126.5, text: 'Phải làm sao phải làm sao…' },
        { t: 128.12, text: 'Cậu thấy thế được không…' },
        { t: 129.5, text: 'Sao nào sao nào sao nào…' },
        { t: 132.04, text: 'Đừng nên quá thương ai đừng vẽ tương lai…' },
        { t: 135.6, text: 'Vì sẽ chẳng có điều chi là mai mãi…' },
        { t: 138.16, text: 'Nhưng mà mình quá thích cậu rồi…' },
        { t: 139.9, text: 'Phải làm sao phải làm sao này…' },
        { t: 141.84, text: 'Cậu thấy thế được không…' },
        { t: 143.6, text: 'Sao nào sao nào sao nào…' },
        { t: 145.66, text: 'Dù có những đam mê mình biết sẽ không thể…' },
        { t: 149.64, text: 'Mà sao vẫn yêu nhiều như thế…' },
        { t: 152.1, text: 'Khi yêu chân thành ta như gã khờ…' },
        { t: 155.76, text: 'Buốt tim buồn nhưng luôn giả vờ…' },
        { t: 159.14, text: "Ok I'm fine, I'm fine…" },
        { t: 161.6, text: "I'm fine, I'm fine…" },
        { t: 166.7, text: 'Khi mà mình quá thích cậu rồi…' },
        { t: 169.16, text: 'Phải làm sao phải làm sao này…' },
        { t: 171.02, text: 'Cậu thấy thế được không…' },
        { t: 172.28, text: 'Sao nào sao nào sao nào…' },
        { t: 174.9, text: 'Đừng nên quá thương ai đừng vẽ tương lai…' },
        { t: 177.8, text: 'Vì sẽ chẳng có điều chi là mai mãi…' },
        { t: 180.96, text: 'Nhưng mà mình quá thích cậu rồi…' },
        { t: 182.84, text: 'Phải làm sao phải làm sao này…' },
        { t: 184.76, text: 'Cậu thấy thế được không…' },
        { t: 186.4, text: 'Sao nào sao nào sao nào…' },
        { t: 188.3, text: 'Dù có những đam mê mình biết sẽ không thể…' },
        { t: 192.52, text: 'Mà sao vẫn yêu nhiều như thế…' },
        { t: 195.02, text: 'Mình thích cậu rồi…' },
        { t: 201.58, text: 'Quá thích cậu rồi…' },
        { t: 207.9, text: 'Vì mình quá thích cậu rồi…' }
    ]
};

// Châu Khải Phong — Chỉ Yêu Mình Em · librosa beat_track (~95.7 BPM)
// Lyrics curated + snap beat (ASR bị watermark spam trong file)
const CHI_YEU = {
    bpm: 95.703,
    duration: 287.05,
    file: 'chi-yeu-minh-em.mp3',
    // Timestamp từ faster-whisper ASR (chunked) — khớp miệng hát
    vocalAt: 40.12,
    beatOffset: 0.4376,
    lyricLead: 0.18,
    beats: null,
    beatStrength: null,
    cues: {
        vocalAt: 40.12,
        verse1: 40.12,
        chorus1: 80.5,
        verse2: 141.15,
        chorus2: 161.35,
        finale: 245.0
    },
    lyrics: [
        { t: 40.12, mood: 'meet', line: 'Vừa ngày nào ánh mắt ta trao nhau lần đầu', sub: 'Kỷ niệm bắt đầu từ một ánh nhìn…', focus: 0, fx: 'spark' },
        { t: 47.04, mood: 'smile', line: 'Nụ cười em đã khắc sâu trái tim của anh', sub: 'Nụ cười Bé Bơ — khắc vào tim', focus: 1, fx: 'warm' },
        { t: 50.78, mood: 'miss', line: 'Phải làm sao cho quên đi bao nhớ thương về em', sub: 'Những đêm nhớ…', focus: 2, fx: 'dim' },
        { t: 55.91, mood: 'miss', line: 'Phải làm sao cho phút giây đó ngừng trôi mãi', sub: 'Muốn giữ khoảnh khắc ấy mãi', focus: 2, fx: 'slow' },
        { t: 60.98, mood: 'return', line: 'Và một ngày tiếng yêu thương đó chợt trở về', sub: 'Yêu thương trở lại…', focus: 0, fx: 'burst' },
        { t: 65.36, mood: 'return', line: 'Gặp lại em lòng hạnh phúc mang bao nhung nhớ', sub: 'Hạnh phúc khi gặp lại Bé Bơ', focus: 1, fx: 'burst' },
        { t: 70.43, mood: 'only', line: 'Và anh biết mãi mãi trong cuộc đời này', sub: 'Đã thuộc về một người', focus: 3, fx: 'heart' },
        { t: 76.09, mood: 'only', line: 'Thì tình yêu anh đã thuộc về người', sub: 'Thuộc về Bé Bơ', focus: 3, fx: 'heart' },
        { t: 80.5, mood: 'only', line: 'Tình yêu đó anh chỉ trao cho riêng người thôi', sub: 'Chỉ yêu mình Bé Bơ', focus: -1, fx: 'heart' },
        { t: 84.96, mood: 'only', line: 'Dù đời thay đổi nhưng trái tim anh nguyện chung tình', sub: 'Nguyện không đổi thay', focus: -1, fx: 'glow' },
        { t: 91.25, mood: 'miss', line: 'Người có biết khi xa em trong lòng nhớ thương đêm từng đêm', sub: 'Nhớ từng đêm…', focus: 2, fx: 'dim' },
        { t: 96.32, mood: 'return', line: 'Cầu mong sao cho chúng ta không rời xa nữa', sub: 'Đừng rời xa nữa', focus: 1, fx: 'warm' },
        { t: 100.75, mood: 'forever', line: 'Dù ngàn năm sau khi trái đất kia có đổi thay', sub: 'Vẫn yêu người muôn đời', focus: 3, fx: 'glow' },
        { t: 105.81, mood: 'forever', line: 'Thì lòng anh vẫn sẽ chẳng đổi thay yêu người muôn đời', sub: 'Chẳng đổi thay…', focus: 3, fx: 'glow' },
        { t: 111.48, mood: 'forever', line: 'Mùa đông giá rét sẽ ấm nồng có em kề bên', sub: 'Ấm vì có Bé Bơ', focus: -1, fx: 'warm' },
        { t: 115.89, mood: 'forever', line: 'Tình anh và em mãi không phai mờ qua ngàn sóng gió', sub: 'Mãi không phai mờ', focus: -1, fx: 'finale' },
        { t: 141.15, mood: 'return', line: 'Và một ngày tiếng yêu thương đó chợt trở về', sub: 'Yêu thương trở lại lần nữa…', focus: 0, fx: 'burst' },
        { t: 146.84, mood: 'return', line: 'Gặp lại em lòng hạnh phúc mang bao nhung nhớ', sub: 'Hạnh phúc khi gặp lại', focus: 1, fx: 'warm' },
        { t: 151.6, mood: 'only', line: 'Và anh biết mãi mãi trong cuộc đời này', sub: 'Mãi mãi…', focus: 3, fx: 'heart' },
        { t: 156.29, mood: 'only', line: 'Thì tình yêu anh đã thuộc về người', sub: 'Thuộc về Bé Bơ', focus: 3, fx: 'heart' },
        { t: 161.35, mood: 'only', line: 'Tình yêu đó anh chỉ trao cho riêng người thôi', sub: 'Chỉ trao cho riêng Bé Bơ', focus: -1, fx: 'heart' },
        { t: 165.79, mood: 'only', line: 'Dù đời thay đổi nhưng trái tim anh nguyện chung tình', sub: 'Nguyện chung tình', focus: -1, fx: 'glow' },
        { t: 171.48, mood: 'miss', line: 'Người có biết khi xa em trong lòng nhớ thương đêm từng đêm', sub: 'Nhớ thương đêm từng đêm', focus: 2, fx: 'dim' },
        { t: 175.89, mood: 'return', line: 'Cầu mong sao cho chúng ta không rời xa nữa', sub: 'Không rời xa nữa', focus: 1, fx: 'warm' },
        { t: 181.58, mood: 'forever', line: 'Dù ngàn năm sau khi trái đất kia có đổi thay', sub: 'Dù ngàn năm sau…', focus: 3, fx: 'glow' },
        { t: 186.64, mood: 'forever', line: 'Thì lòng anh vẫn sẽ chẳng đổi thay yêu người muôn đời', sub: 'Yêu người muôn đời', focus: 3, fx: 'glow' },
        { t: 192.31, mood: 'forever', line: 'Mùa đông giá rét sẽ ấm nồng có em kề bên', sub: 'Có Bé Bơ kề bên', focus: -1, fx: 'warm' },
        { t: 196.74, mood: 'forever', line: 'Tình anh và em mãi không phai mờ qua ngàn sóng gió', sub: 'Mãi không phai mờ', focus: -1, fx: 'finale' },
        { t: 202.41, mood: 'only', line: 'Tình yêu đó anh chỉ trao cho riêng người thôi', sub: 'Chỉ yêu mình Bé Bơ', focus: -1, fx: 'heart' },
        { t: 206.84, mood: 'only', line: 'Dù đời thay đổi nhưng trái tim anh nguyện chung tình', sub: 'Nguyện chung tình', focus: -1, fx: 'glow' },
        { t: 211.88, mood: 'miss', line: 'Người có biết khi xa em trong lòng nhớ thương đêm từng đêm', sub: 'Nhớ từng đêm…', focus: 2, fx: 'dim' },
        { t: 217.62, mood: 'return', line: 'Cầu mong sao cho chúng ta không rời xa nữa', sub: 'Đừng rời xa nữa', focus: 1, fx: 'warm' },
        { t: 222.01, mood: 'forever', line: 'Dù ngàn năm sau khi trái đất kia có đổi thay', sub: 'Vẫn yêu người muôn đời', focus: 3, fx: 'glow' },
        { t: 227.07, mood: 'forever', line: 'Thì lòng anh vẫn sẽ chẳng đổi thay yêu người muôn đời', sub: 'Chẳng đổi thay…', focus: 3, fx: 'glow' },
        { t: 232.73, mood: 'forever', line: 'Mùa đông giá rét sẽ ấm nồng có em kề bên', sub: 'Ấm nồng…', focus: -1, fx: 'warm' },
        // Outro — ASR bị watermark; lời từ yeucahat / hopamchuan
        { t: 245.0, mood: 'forever', line: 'Tình anh và em mãi không phai mờ qua ngàn sóng gió', sub: 'Mãi không phai mờ', focus: -1, fx: 'finale' },
        { t: 251.0, mood: 'forever', line: 'Nguyện cho tình ta mãi không phai mờ qua ngàn sóng gió', sub: 'Chỉ yêu mình Bé Bơ', focus: -1, fx: 'finale' }
    ]
};

// Làm Người Yêu Anh Nhé · Nguyên Jenda — scene 9 tỏ tình
// Timestamps: faster-whisper medium (no VAD) + curated canon
const LAM_NGUOI_YEU = {
    bpm: 99.384,
    duration: 191.61,
    file: 'lam-nguoi-yeu-anh-nhe.mp3',
    vocalAt: 13.0,
    // librosa onset-calibrated (không dùng first-beat thô — lệch phase với kick)
    beatOffset: 0.302,
    lyricLead: 0.28,
    cues: {
        intro: 1.5,
        verse1: 13.0,
        chorus1: 39.22,
        hook1: 64.52,
        rap: 75.24,
        chorus2: 103.28,
        hook2: 170.06,
        ask: 181.7
    },
    lyrics: [
        { t: 13.0, mood: 'shy', line: 'Em lặng im còn anh thì ngồi ngẩn ngơ nhìn khuôn mặt ngây thơ đó', sub: 'Anh nhìn Bé Bơ… lòng rối hết cả lên' },
        { t: 17.5, mood: 'shy', line: 'Em hững hờ quá nên anh lo sợ bơ vơ', sub: 'Anh sợ bé chẳng để ý tới anh' },
        { t: 19.8, mood: 'shy', line: 'Đợi chờ đôi mắt ngoan em ngại ngùng ngó sang', sub: 'Chỉ cần một ánh nhìn cũng đủ' },
        { t: 22.4, mood: 'shy', line: 'Anh thẫn thờ bơ phờ đôi mắt mơ', sub: 'Anh như mất hồn vì bé' },
        { t: 24.6, mood: 'brave', line: 'Anh đã cố đổi thay để mạnh mẽ hơn vì anh sợ cô đơn', sub: 'Anh muốn đủ tốt cho Bé Bơ' },
        { t: 28.0, mood: 'brave', line: 'Nói yêu má hồng mắt cong bờ môi mọng rất khó', sub: 'Vì anh ngại… nhưng vẫn muốn nói' },
        { t: 33.56, mood: 'brave', line: 'Vì lo trong trái tim em đã có ai', sub: 'Anh vẫn mang theo một chút ngại' },
        { t: 36.4, mood: 'brave', line: 'Nhưng nếu yêu em là sai thì anh đây không cần đúng', sub: 'Thương bé là điều anh chọn' },
        { t: 39.22, mood: 'ask', line: 'Người yêu ơi yêu mình anh được không', sub: 'Bé Bơ ơi, anh hỏi thật lòng' },
        { t: 43.24, mood: 'ask', line: 'Từ giờ và sau này xua lạnh hơi đêm mùa đông', sub: 'Anh muốn ở bên bé' },
        { t: 46.5, mood: 'tender', line: 'Là ngày ta sum vầy khỏa lấp con tim hao gầy', sub: 'Lấp đầy những khoảng trống trong anh' },
        { t: 49.5, mood: 'tender', line: 'Hãy để anh chứng minh cho em thấy', sub: 'Bằng tất cả sự chân thành' },
        { t: 52.02, mood: 'ask', line: 'Người yêu ơi yêu thì có gì sai', sub: 'Đâu có sai đâu' },
        { t: 56.0, mood: 'ask', line: 'Không là anh thì ai để anh đưa em về', sub: 'Về một nơi chỉ có hai đứa mình' },
        { t: 59.9, mood: 'tender', line: 'Là tình yêu mãi mê mặc kệ người ta cười chê', sub: 'Bởi vì tình yêu là thế' },
        { t: 64.52, mood: 'confess', line: 'Làm người yêu anh nhé, Bé Bơ', sub: 'Làm người yêu anh nhé, Bé Bơ' },
        { t: 67.4, mood: 'confess', line: 'Rồi làm vợ anh nhé, Bé Bơ', sub: 'Một lời hứa anh giữ thật lâu' },
        { t: 70.8, mood: 'confess', line: 'Làm người yêu anh nhé, Bé Bơ', sub: 'Với anh, bé là Bé Bơ' },
        { t: 72.5, mood: 'confess', line: 'Rồi làm vợ anh nhé, Bé Bơ', sub: 'Anh đang nghiêm túc đó' },
        { t: 75.24, mood: 'play', line: 'Không hiểu không hiểu không hiểu', sub: 'Tim anh rối hết cả lên' },
        { t: 77.4, mood: 'play', line: 'Gặp em tự nhiên trái tim nằm bên trái nhảy sang bên phải', sub: 'Chỉ vì Bé Bơ thôi' },
        { t: 81.6, mood: 'play', line: 'Anh cộng em thì bằng ba là sai', sub: 'Nhưng tương lai sẽ đúng nếu ta yêu nhau mãi' },
        // Rap mid — web lyrics (tkaraoke / Nguyên Jenda); ASR garbled
        { t: 84.6, mood: 'play', line: 'Bàn phím máy tính chơi nhiều cũng chai', sub: 'Hoa đẹp đến mấy cũng có ngày tàn phai' },
        { t: 86.4, mood: 'play', line: 'Yêu xong chia tay ai cũng sợ hãi', sub: 'Riêng tình yêu anh trao bé…' },
        { t: 88.0, mood: 'tender', line: 'Tình yêu anh trao em nó rất dai và rất dài', sub: 'Không phải thứ dễ phai' },
        { t: 91.02, mood: 'brave', line: 'Anh đã cố đổi thay để mạnh mẽ hơn vì anh sợ cô đơn', sub: 'Và sợ mất bé' },
        { t: 93.48, mood: 'brave', line: 'Nói yêu má hồng mắt cong bờ môi mọng rất khó', sub: 'Vì anh ngại… nhưng vẫn muốn nói' },
        { t: 97.28, mood: 'brave', line: 'Vì lo trong trái tim em đã có ai', sub: 'Dù vậy anh vẫn muốn nói' },
        { t: 100.2, mood: 'brave', line: 'Nhưng nếu yêu em là sai thì anh đây không cần đúng', sub: 'Anh chọn bé' },
        { t: 103.28, mood: 'ask', line: 'Người yêu ơi yêu mình anh được không', sub: 'Lần nữa — anh hỏi bé' },
        { t: 106.5, mood: 'tender', line: 'Từ giờ và sau này xua lạnh hơi đêm mùa đông', sub: 'Anh muốn sưởi ấm những ngày của bé' },
        { t: 109.5, mood: 'tender', line: 'Là ngày ta sum vầy khỏa lấp con tim hao gầy', sub: 'Lấp trống tình yêu đong đầy' },
        { t: 113.5, mood: 'tender', line: 'Hãy để anh chứng minh cho em thấy', sub: 'Không chỉ bằng lời' },
        { t: 115.78, mood: 'ask', line: 'Người yêu ơi yêu thì có gì sai', sub: 'Không là anh thì ai?' },
        { t: 120.2, mood: 'ask', line: 'Không là anh thì ai để anh đưa em về', sub: 'Về bên anh' },
        { t: 124.0, mood: 'tender', line: 'Là tình yêu mãi mê', sub: 'Mặc kệ người ta cười chê' },
        { t: 126.92, mood: 'confess', line: 'Bởi vì tình yêu là thế', sub: 'Anh muốn đi cùng bé' },
        { t: 128.5, mood: 'brave', line: 'Anh đã cố đổi thay để mạnh mẽ hơn vì anh sợ cô đơn', sub: 'Vẫn vì Bé Bơ' },
        { t: 132.68, mood: 'longing', line: 'Là khi những nỗi nhớ như sóng xô nơi đây từng cơn', sub: 'Anh nhớ bé nhiều lắm' },
        { t: 135.9, mood: 'longing', line: 'Là khi em cười đùa bên ai đau đớn nên anh giận hờn', sub: 'Vì anh đã thích bé thật rồi' },
        { t: 138.88, mood: 'brave', line: 'Nhưng yêu em là sai thì anh đây không cần đúng', sub: 'Anh vẫn muốn hỏi…' },
        { t: 144.92, mood: 'ask', line: 'Người yêu ơi yêu mình anh được không', sub: 'Bé Bơ ơi' },
        { t: 147.6, mood: 'tender', line: 'Từ giờ và sau này xua lạnh hơi đêm mùa đông', sub: 'Anh muốn ở bên bé' },
        { t: 151.1, mood: 'tender', line: 'Là ngày ta sum vầy khỏa lấp con tim hao gầy', sub: 'Lấp trống tình yêu đong đầy' },
        { t: 155.0, mood: 'tender', line: 'Hãy để anh chứng minh cho em thấy', sub: 'Bằng cả những ngày phía trước' },
        { t: 157.74, mood: 'ask', line: 'Người yêu ơi yêu thì có gì sai', sub: 'Đâu có sai đâu' },
        { t: 161.5, mood: 'ask', line: 'Không là anh thì ai', sub: 'Để anh đưa bé về' },
        { t: 165.5, mood: 'tender', line: 'Là tình yêu mãi mê mặc kệ người ta cười chê', sub: 'Bởi vì tình yêu là thế' },
        { t: 170.06, mood: 'confess', line: 'Làm người yêu anh nhé, Bé Bơ', sub: 'Anh đang hỏi thật đó' },
        { t: 173.3, mood: 'confess', line: 'Rồi làm vợ anh nhé, Bé Bơ', sub: 'Nếu bé cũng sẵn lòng' },
        { t: 176.52, mood: 'confess', line: 'Làm người yêu anh nhé, Bé Bơ', sub: 'Anh chỉ gọi Bé Bơ' },
        { t: 178.5, mood: 'confess', line: 'Rồi làm vợ anh nhé, Bé Bơ', sub: 'Anh chờ câu trả lời của bé' },
        { t: 181.7, mood: 'ask', line: 'Ý em sao… ý em sao?', sub: 'Bé Bơ ơi — làm người yêu anh nhé?' },
    ]
};

const SCENE_MUSIC_FALLBACK = 'src/music/fallback.mp3';
const sceneMusicEl = () => document.getElementById('scene-music') || document.getElementById('music');
let sceneMusicIdx = -1;
/** Currently playing track filename (set only after new src actually starts) */
let sceneMusicTrack = '';

function getTrustedMusicTime(fileName) {
    const a = sceneMusicEl();
    if (!a || !Number.isFinite(a.currentTime)) return null;
    const src = decodeURIComponent(a.currentSrc || a.src || '');
    if (!src.includes(fileName)) return null;
    if (sceneMusicTrack && sceneMusicTrack !== fileName) return null;
    return a.currentTime;
}

/** Nhạc opening (scene 1–4) — onset-calibrated */
const OPENING_BEAT = {
    file: 'fallback.mp3',
    bpm: 117.454,
    beatOffset: 0.0905
};

/**
 * Envelope đập: peak đúng nhịp (phase=0), decay nhanh.
 * Dùng chung scene 5/6/8/9 + tim sinh nhật.
 * conf: { bpm, beatOffset, beats?, beatStrength? }
 */
function musicBeatEnvelopeFrom(mt, conf) {
    if (mt == null || !Number.isFinite(mt) || !conf) return 0;
    // Tránh đập ngay frame seek=0 trước khi tiếng vào
    if (mt < 0.08) return 0;
    const bpm = conf.bpm || 100;
    const period = 60 / bpm;
    const beats = conf.beats;
    const strengths = conf.beatStrength;
    if (beats && beats.length) {
        let lo = 0;
        let hi = beats.length - 1;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (beats[mid] <= mt) lo = mid;
            else hi = mid - 1;
        }
        const t0 = beats[lo];
        const t1 = lo + 1 < beats.length ? beats[lo + 1] : t0 + period;
        const gap = Math.max(0.2, t1 - t0);
        const dt = mt - t0;
        if (dt < -0.03 || dt >= gap * 0.55) return 0;
        const env = dt < 0
            ? Math.pow(1 + dt / 0.03, 2)
            : Math.exp(-dt / (gap * 0.12));
        const str = strengths && strengths[lo] != null ? strengths[lo] : 0.65;
        return Math.min(1, env * (0.12 + str * 0.88));
    }
    const off = conf.beatOffset || 0;
    let phase = ((mt - off) % period) / period;
    if (phase < 0) phase += 1;
    return Math.exp(-phase * 12);
}

/** true chỉ khi đúng bài đang phát VÀ đã nghe được (hết mute/fade-in) */
function isSceneMusicLive(fileName) {
    const a = sceneMusicEl();
    if (!a || !fileName) return false;
    if (a.paused || a.ended || !Number.isFinite(a.currentTime)) return false;
    // play() + fadeIn bắt đầu volume=0 — lúc đó chưa coi là “có nhạc”
    if ((a.volume || 0) < 0.08) return false;
    if (sceneMusicTrack !== fileName) return false;
    const src = decodeURIComponent(a.currentSrc || a.src || '');
    if (!src.includes(fileName)) return false;
    return true;
}

function playSceneMusic(idx) {
    const audio = sceneMusicEl();
    if (!audio) return;
    const legacy = document.getElementById('music');
    if (legacy && legacy !== audio) {
        legacy.pause();
        legacy.volume = 0;
    }
    // Scene 7 (sân khấu) — chỉ audio video
    if (sceneNum(idx) === 7) {
        sceneMusicIdx = idx;
        sceneMusicTrack = '';
        if (!audio.paused) {
            const startVol = audio.volume || 0.7;
            const t0 = performance.now();
            (function fadeOut(now) {
                const p = Math.min((now - t0) / 400, 1);
                audio.volume = startVol * (1 - p);
                if (p < 1) requestAnimationFrame(fadeOut);
                else audio.pause();
            })(t0);
        }
        return;
    }
    const candidates = SCENE_MUSIC_ALT[idx] || [SCENE_MUSIC_SRC[idx] || SCENE_MUSIC_FALLBACK];
    const nextSrc = candidates[0];
    const nextFile = nextSrc.split('/').pop();
    const alreadySame = sceneMusicTrack === nextFile && !audio.paused &&
        decodeURIComponent(audio.currentSrc || audio.src || '').includes(nextFile);
    // Birthday 1–4: giữ bài + loop nếu nhạc ngắn hơn nội dung
    if (alreadySame && isBirthdayFlow(idx)) {
        sceneMusicIdx = idx;
        audio.loop = true;
        return;
    }
    if (sceneMusicIdx === idx && alreadySame) return;
    sceneMusicIdx = idx;
    sceneMusicTrack = '';
    const isTree = sceneNum(idx) === 5;
    const isFlowers = sceneNum(idx) === 6;
    const isMem = sceneNum(idx) === 8;
    const isConfess = sceneNum(idx) === 9;
    const fadeOutMs = isTree || isFlowers || isMem || isConfess ? 280 : 500;
    const fadeInMs = isTree || isFlowers || isMem || isConfess ? 450 : 700;
    const fadeOut = () => new Promise(resolve => {
        if (audio.paused) return resolve();
        const startVol = audio.volume || 0.7;
        const t0 = performance.now();
        function step(now) {
            const p = Math.min((now - t0) / fadeOutMs, 1);
            audio.volume = startVol * (1 - p);
            if (p < 1) requestAnimationFrame(step);
            else { audio.pause(); resolve(); }
        }
        requestAnimationFrame(step);
    });
    fadeOut().then(() => {
        // Loop trong cụm birthday; scene 5+ tắt loop (theo hết bài)
        audio.loop = isBirthdayFlow(idx);
        let tryIdx = 0;
        const tryPlay = () => {
            const src = candidates[tryIdx] || SCENE_MUSIC_FALLBACK;
            const fileName = src.split('/').pop();
            audio.src = src;
            audio.volume = 0;
            // Đặt sớm để lyric sync (scene 5/6/9) không bị null trong lúc play() pending
            sceneMusicTrack = fileName;
            const playPromise = audio.play();
            const onOk = () => {
                try { audio.currentTime = 0; } catch (_) { /* ignore */ }
                sceneMusicTrack = fileName;
                const target = isConfess ? 0.84 : (isMem ? 0.78 : (isTree ? 0.72 : (isFlowers ? 0.8 : 0.62)));
                const t1 = performance.now();
                function fadeIn(now) {
                    if (isPaused) return;
                    const p = Math.min((now - t1) / fadeInMs, 1);
                    audio.volume = target * p;
                    if (p < 1) requestAnimationFrame(fadeIn);
                }
                requestAnimationFrame(fadeIn);
            };
            if (playPromise && playPromise.then) {
                playPromise.then(onOk).catch(() => {
                    tryIdx += 1;
                    if (tryIdx < candidates.length) tryPlay();
                    else {
                        audio.src = SCENE_MUSIC_FALLBACK;
                        audio.play().then(onOk).catch(() => { });
                    }
                });
            } else onOk();
        };
        tryPlay();
    });
}

function stopVoice() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
}

// ===== SHARED NIGHT SKY + FIREFLIES CANVAS =====
(function () {
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');
    function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    // Stars (some as sparkle crosses)
    const stars = Array.from({ length: 200 }, () => ({
        x: Math.random() * innerWidth, y: Math.random() * innerHeight,
        r: Math.random() * 1.4 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.9 + 0.3,
        blue: Math.random() > 0.6,
        sparkle: Math.random() > 0.82
    }));

    // Fireflies
    const flies = Array.from({ length: 28 }, () => ({
        x: Math.random() * innerWidth, y: Math.random() * innerHeight,
        r: Math.random() * 3.5 + 1.2,
        vx: (Math.random() - 0.5) * 0.55, vy: (Math.random() - 0.5) * 0.55,
        alpha: Math.random(), fade: Math.random() * 0.012 + 0.006,
        hue: Math.random() > 0.45 ? 55 : 185
    }));

    // Shooting stars
    const shoots = [];
    setInterval(() => {
        shoots.push({
            x: Math.random() * innerWidth * 0.75, y: Math.random() * innerHeight * 0.4,
            len: Math.random() * 115 + 55, speed: Math.random() * 8 + 5,
            angle: Math.PI / 5 + (Math.random() - 0.5) * 0.38, opacity: 1
        });
    }, 3800);

    let t = 0;
    function draw() {
        if (isExperiencePaused()) {
            requestAnimationFrame(draw);
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        t += 0.016;

        // Stars
        stars.forEach(s => {
            const tw = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
            ctx.globalAlpha = 0.35 + 0.65 * tw;
            const col = s.blue ? '#a8d4ff' : '#ffffff';

            if (s.sparkle && tw > 0.7) {
                // Cross sparkle
                const sz = s.r * 3 * tw;
                ctx.strokeStyle = col; ctx.lineWidth = s.r * 0.7;
                ctx.beginPath(); ctx.moveTo(s.x - sz, s.y); ctx.lineTo(s.x + sz, s.y); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(s.x, s.y - sz); ctx.lineTo(s.x, s.y + sz); ctx.stroke();
                // Diagonal arms (smaller)
                const sd = sz * 0.5;
                ctx.globalAlpha = (0.35 + 0.65 * tw) * 0.5;
                ctx.beginPath(); ctx.moveTo(s.x - sd, s.y - sd); ctx.lineTo(s.x + sd, s.y + sd); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(s.x + sd, s.y - sd); ctx.lineTo(s.x - sd, s.y + sd); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (0.75 + 0.35 * tw), 0, Math.PI * 2);
                ctx.fillStyle = col; ctx.fill();
                if (s.r > 0.9) {
                    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
                    g.addColorStop(0, s.blue ? 'rgba(150,210,255,0.18)' : 'rgba(255,255,255,0.18)');
                    g.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = g;
                    ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2); ctx.fill();
                }
            }
        });

        // Fireflies
        flies.forEach(f => {
            f.x += f.vx; f.y += f.vy;
            f.alpha += f.fade;
            if (f.alpha <= 0 || f.alpha >= 1) f.fade = -f.fade;
            if (f.x < 0 || f.x > canvas.width) f.vx *= -1;
            if (f.y < 0 || f.y > canvas.height) f.vy *= -1;

            const a = Math.min(Math.max(f.alpha, 0), 1);
            const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 3.5);
            g.addColorStop(0, `hsla(${f.hue},95%,75%,${a * 0.85})`);
            g.addColorStop(1, `hsla(${f.hue},95%,75%,0)`);
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = a;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 0.45, 0, Math.PI * 2); ctx.fill();
        });

        // Shooting stars
        for (let i = shoots.length - 1; i >= 0; i--) {
            const s = shoots[i];
            const g = ctx.createLinearGradient(s.x, s.y, s.x - Math.cos(s.angle) * s.len, s.y - Math.sin(s.angle) * s.len);
            g.addColorStop(0, `rgba(255,255,255,${s.opacity})`);
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - Math.cos(s.angle) * s.len, s.y - Math.sin(s.angle) * s.len); ctx.stroke();
            s.x += Math.cos(s.angle) * s.speed; s.y += Math.sin(s.angle) * s.speed;
            s.opacity -= 0.022;
            if (s.opacity <= 0 || s.x > innerWidth || s.y > innerHeight) shoots.splice(i, 1);
        }

        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
    }
    draw();
})();

// ===== CHERRY BLOSSOM PETALS =====
const PETAL_SYSTEM = (function () {
    const canvas = document.getElementById('petalCanvas');
    const ctx = canvas.getContext('2d');
    function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    const COLORS = [
        ['#ff9aad', '#ffccd5', '#fff5f8'],
        ['#ff8fab', '#ffb7c5', '#ffe4e8'],
        ['#ff7a9a', '#ffc0cb', '#fff0f3'],
        ['#ffa0b4', '#ffd6e0', '#ffffff'],
        ['#ffb7c5', '#ffe4e8', '#fff8fa']
    ];
    let t = 0;
    let wind = 0, windTarget = 0;

    setInterval(() => {
        windTarget = (Math.random() - 0.35) * 0.42;
        setTimeout(() => { windTarget = (Math.random() - 0.5) * 0.16; }, 2200 + Math.random() * 1800);
    }, 5200 + Math.random() * 3600);

    function newPetal(fromTop) {
        const cx = innerWidth * 0.5;
        const depth = Math.random(); // 0 far → 1 near
        const size = 5.5 + depth * 10 + Math.random() * 3;
        return {
            x: fromTop
                ? cx + (Math.random() - 0.5) * innerWidth * 0.7
                : Math.random() * innerWidth,
            y: fromTop ? -30 - Math.random() * 140 : Math.random() * innerHeight,
            vx: (Math.random() - 0.5) * 0.22,
            vy: (0.28 + Math.random() * 0.55) * (0.55 + depth * 0.55),
            rot: Math.random() * Math.PI * 2,
            rspd: (Math.random() - 0.5) * 0.04,
            w: size * (0.55 + Math.random() * 0.2),
            h: size * (0.85 + Math.random() * 0.25),
            baseAlpha: 0.28 + depth * 0.45 + Math.random() * 0.12,
            alpha: 0,
            swayPh: Math.random() * Math.PI * 2,
            swaySpd: 0.9 + Math.random() * 1.4,
            swayAmp: 0.55 + Math.random() * 1.1,
            tumble: Math.random() * Math.PI * 2,
            tumbleSpd: 1.2 + Math.random() * 2.2,
            flutter: 0.25 + Math.random() * 0.45,
            colors: COLORS[Math.floor(Math.random() * COLORS.length)],
            depth,
            burst: false,
            life: 1
        };
    }

    const petals = Array.from({ length: 72 }, () => {
        const p = newPetal(false);
        p.alpha = p.baseAlpha;
        return p;
    });

    function drawPetal(p) {
        const flip = 0.22 + Math.abs(Math.cos(p.tumble)) * 0.78;
        const a = Math.max(0, p.alpha * p.life);
        if (a < 0.02) return;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(flip, 1);
        const w = p.w, h = p.h;
        const [c0, c1, c2] = p.colors;
        const g = ctx.createLinearGradient(0, -h * 0.5, 0, h * 0.5);
        g.addColorStop(0, c0);
        g.addColorStop(0.45, c1);
        g.addColorStop(1, c2);
        ctx.globalAlpha = a;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.5);
        ctx.bezierCurveTo( w * 0.58,  h * 0.2,  w * 0.65, -h * 0.15, 0, -h * 0.52);
        ctx.bezierCurveTo(-w * 0.65, -h * 0.15, -w * 0.58,  h * 0.2, 0,  h * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = a * 0.22;
        ctx.strokeStyle = 'rgba(255,110,140,0.85)';
        ctx.lineWidth = 0.55;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.42);
        ctx.quadraticCurveTo(w * 0.04, 0, 0, -h * 0.42);
        ctx.stroke();
        ctx.globalAlpha = a * 0.38;
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.ellipse(-w * 0.12, -h * 0.08, w * 0.16, h * 0.22, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function animate() {
        if (isExperiencePaused()) {
            requestAnimationFrame(animate);
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        t += 0.016;
        wind += (windTarget - wind) * 0.03;
        const windUse = Math.max(-0.32, Math.min(0.32, wind));

        for (let i = petals.length - 1; i >= 0; i--) {
            const p = petals[i];
            p.tumble += p.tumbleSpd * 0.016;
            const sway = Math.sin(t * p.swaySpd + p.swayPh) * p.swayAmp;
            const lift = Math.sin(p.tumble * 0.7) * p.flutter * 0.35;
            p.vx += (windUse - p.vx) * 0.012;
            p.x += p.vx + sway * 0.55 + Math.cos(p.tumble) * 0.18;
            p.y += p.vy + lift;
            p.rot += p.rspd + Math.cos(p.tumble) * 0.012;

            if (p.burst) {
                p.vy += 0.028;
                p.vx *= 0.988;
                // Rơi hết xuống đáy khung rồi mới mờ
                if (p.y > innerHeight * 0.9) p.life -= 0.01;
                p.alpha = p.baseAlpha * Math.max(0, p.life);
                if (p.y > innerHeight + 40 || p.life <= 0) { petals.splice(i, 1); continue; }
            } else {
                // soft fade near bottom of frame
                const bottom = innerHeight + 28;
                if (p.y > innerHeight * 0.92) {
                    p.alpha = p.baseAlpha * Math.max(0, 1 - (p.y - innerHeight * 0.92) / (bottom - innerHeight * 0.92));
                } else if (p.alpha < p.baseAlpha) {
                    p.alpha = Math.min(p.baseAlpha, p.alpha + 0.02);
                }
                if (p.y > bottom || p.x < -50 || p.x > innerWidth + 50) {
                Object.assign(p, newPetal(true));
                    p.alpha = 0;
                }
            }
            drawPetal(p);
        }
        requestAnimationFrame(animate);
    }
    animate();

    return {
        burst(cx, cy, count = 22, spreadV = 5) {
            for (let i = 0; i < count; i++) {
                const p = newPetal(false);
                p.x = cx + (Math.random() - 0.5) * 18;
                p.y = cy + (Math.random() - 0.5) * 14;
                const angle = (i / count) * Math.PI * 2 + Math.random() * 0.55;
                const sp = Math.random() * spreadV * 0.8 + 1;
                p.vx = Math.cos(angle) * sp;
                p.vy = Math.sin(angle) * sp * 0.7 - 1.1;
                p.baseAlpha = 0.75 + Math.random() * 0.25;
                p.alpha = p.baseAlpha;
                p.life = 1;
                p.burst = true;
                p.depth = 0.7 + Math.random() * 0.3;
                petals.push(p);
            }
        },
        show() { canvas.classList.add('active'); },
        setWind(v) { windTarget = Math.max(-0.55, Math.min(0.55, v)); }
    };
})();

// ===== SCENE HTML PARTIALS =====
const NUM_SCENES = SCENE_FLOW.length;
const SCENE_HTML_PATHS = SCENE_FLOW.map((n) => `src/scenes/scene-${n}.html`);
let scenesReady = false;
let scenesLoadPromise = null;

async function loadScenes() {
    if (scenesReady) return;
    if (scenesLoadPromise) return scenesLoadPromise;
    scenesLoadPromise = (async () => {
        const host = document.getElementById('scenes-host');
        if (!host) throw new Error('Missing #scenes-host');
        const parts = await Promise.all(SCENE_HTML_PATHS.map(async (url) => {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Cannot load ${url} (${res.status})`);
            return res.text();
        }));
        host.innerHTML = parts.join('\n');
        scenesReady = true;
    })();
    try {
        await scenesLoadPromise;
    } catch (err) {
        scenesLoadPromise = null;
        throw err;
    }
}

// Preload scene HTML while waiting on the play button
loadScenes().catch((err) => console.error('[scenes]', err));

/** Về màn rabbit / nút Play — không tự chạy lại scene 1 */
function returnToLoader() {
    stopAutoAdvance(false);
    clearSceneMusicEndAdvance();
    sceneTransitToken += 1;

    const prev = current;
    if (prev >= 0) {
        clearSceneTimers(prev);
        if (cleanups[prev]) {
            cleanups[prev]();
            delete cleanups[prev];
        }
        const prevEl = document.getElementById(sceneDomId(prev));
        if (prevEl) {
            anime.remove(`#${sceneDomId(prev)}`);
            prevEl.classList.remove('is-active', 'is-leaving');
            prevEl.style.opacity = '0';
            prevEl.style.zIndex = '';
        }
    }
    current = -1;
    updateDots();

    const audio = sceneMusicEl();
    if (audio) {
        try {
            audio.pause();
            audio.loop = false;
            audio.currentTime = 0;
        } catch (_) { /* ignore */ }
    }
    const legacy = document.getElementById('music');
    if (legacy) {
        try { legacy.pause(); } catch (_) { /* ignore */ }
    }
    sceneMusicTrack = '';
    sceneMusicIdx = -1;

    if (isPaused) {
        isPaused = false;
        document.body.classList.remove('experience-paused');
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.textContent = 'II';
            pauseBtn.setAttribute('aria-label', 'Pause experience');
        }
        pausedAnimeInstances = [];
    }

    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = '0%';

    document.getElementById('experience').classList.add('hidden');
    const petal = document.getElementById('petalCanvas');
    if (petal) petal.classList.remove('active');

    const loader = document.getElementById('loader');
    const playBtn = document.getElementById('play');
    if (loader) {
        loader.style.display = '';
        loader.style.opacity = '0';
        requestAnimationFrame(() => {
            loader.style.transition = 'opacity 1s ease';
            loader.style.opacity = '1';
        });
    }
    if (playBtn) playBtn.disabled = false;
}

// ===== LOADER =====
document.getElementById('play').addEventListener('click', async function () {
    const playBtn = this;
    playBtn.disabled = true;
    try {
        await loadScenes();
    } catch (err) {
        console.error(err);
        playBtn.disabled = false;
        alert('Không tải được các màn hình. Hãy mở bằng local server (không mở file:// trực tiếp).');
        return;
    }
    const loader = document.getElementById('loader');
    loader.style.transition = 'opacity 1.5s ease';
    loader.style.opacity = '0';
    PETAL_SYSTEM.show();
    setTimeout(() => {
        loader.style.display = 'none';
        document.getElementById('experience').classList.remove('hidden');
        goToScene(0);
    }, 1500);
});

// ===== SCENE MANAGER =====
let current = -1;
let autoTimerId = null;
let progressRaf = null;
let autoStartAt = 0;
let autoDuration = 0;
let autoRemaining = 0;
let autoNextScene = -1;
// Scene 3: mỗi câu 1 lần — main → ngập ngừng → sub → nghỉ đọc
const SCENE3_MSG_HOLD = 6800;
const SCENE3_HESITATE = 1400;
const SCENE3_MSG_COUNT = 8;
const AUTO_DUR = [
    14000, // 1 mở đầu — nhiều dòng
    12000, // 2 tên
    SCENE3_MSG_COUNT * SCENE3_MSG_HOLD + 3000, // 3 lời nhắn
    0, // 4 sinh nhật — advance khi hết lời chúc (enter7), không cắt giữa chừng
    0, 0, 0, 0, 0 // 5–9 theo nhạc/video / letter / finale
];
/** Scene 4: nghỉ sau lời chúc cuối trước khi sang scene 5 */
const SCENE4_AFTER_WISH_MS = 4500;
/** Scene 4 safety nếu typing lỗi — không kẹt mãi */
const SCENE4_SAFETY_MS = 120000;
const cleanups = {};
const sceneTimers = {};

const dotsEl = document.getElementById('nav-dots');
for (let i = 0; i < NUM_SCENES; i++) {
    const d = document.createElement('span');
    d.className = 'dot';
    d.addEventListener('click', () => goToScene(i));
    dotsEl.appendChild(d);
}

document.getElementById('prev-btn').addEventListener('click', () => { if (current > 0) goToScene(current - 1); });
document.getElementById('next-btn').addEventListener('click', () => { if (current < NUM_SCENES - 1) goToScene(current + 1); });
document.getElementById('pause-btn').addEventListener('click', togglePause);
document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (current < 0) {
            document.getElementById('play')?.click();
        } else {
            togglePause();
        }
        return;
    }
    if (e.key.toLowerCase() === 'p') {
        togglePause();
        return;
    }
    if (isPaused) return;
    if (e.key === 'ArrowRight') document.getElementById('next-btn').click();
    if (e.key === 'ArrowLeft') document.getElementById('prev-btn').click();
});

let sceneTransitToken = 0;

function goToScene(idx) {
    if (idx < 0 || idx >= NUM_SCENES || isPaused) return;
    if (idx === current && current >= 0) return;
    stopAutoAdvance(false);
    clearSceneMusicEndAdvance();
    document.getElementById('progress-fill').style.width = '0%';

    const prev = current;
    current = idx;
    updateDots();

    const token = ++sceneTransitToken;
    const prevEl = prev >= 0 ? document.getElementById(sceneDomId(prev)) : null;
    const nextEl = document.getElementById(sceneDomId(idx));
    if (!nextEl) return;

    const sameBirthday = prev >= 0 && isBirthdayFlow(prev) && isBirthdayFlow(idx);
    const fadeMs = sameBirthday ? 1050 : 1250;
    const startInMs = prev >= 0 ? Math.round(fadeMs * 0.1) : 0;
    // Fade vào trước → nghỉ SCENE_PREPARE_MS → mới chạy nhạc + enter
    const enterAtMs = startInMs + Math.round(fadeMs * 0.55) + SCENE_PREPARE_MS;

    if (prev >= 0) {
        clearSceneTimers(prev);
        anime.remove(`#${sceneDomId(prev)}`);
        if (prevEl) {
            prevEl.style.zIndex = '2';
            prevEl.classList.add('is-leaving');
        }
        // Giữ scene cũ đến khi fade xong — tránh cắt cụt / khựng
        anime({
            targets: `#${sceneDomId(prev)}`,
            opacity: 0,
            duration: fadeMs,
            easing: 'easeInOutSine',
            complete: () => {
                if (token !== sceneTransitToken) return;
        if (cleanups[prev]) { cleanups[prev](); delete cleanups[prev]; }
                if (prevEl) {
                    prevEl.classList.remove('is-active', 'is-leaving');
                    prevEl.style.zIndex = '';
                    prevEl.style.opacity = '0';
                }
            }
        });
        // Burst nhẹ chỉ khi đổi “chương” (không phải 1→4 liên tục)
        if (!sameBirthday) {
            PETAL_SYSTEM.burst(innerWidth * 0.5, innerHeight * 0.42, 5, 1.5);
        }
    }

        resetScene(idx);
    document.querySelectorAll('.scene').forEach(s => {
        if (s !== prevEl) s.classList.remove('is-active', 'is-leaving');
    });
    nextEl.classList.add('is-active');
    nextEl.style.zIndex = '4';
    nextEl.style.opacity = '0';
    anime.remove(`#${sceneDomId(idx)}`);

    // Crossfade chồng lên scene cũ
    setSceneTimeout(idx, () => {
        if (token !== sceneTransitToken || current !== idx) return;
        anime({
            targets: `#${sceneDomId(idx)}`,
            opacity: [0, 1],
            duration: fadeMs,
            easing: 'easeInOutSine',
            complete: () => {
                if (current === idx && nextEl) nextEl.style.zIndex = '';
            }
        });
    }, startInMs);

    // Nội dung bắt đầu giữa lúc fade — liền mạch hơn chờ fade xong mới chạy
    setSceneTimeout(idx, () => {
        if (token !== sceneTransitToken || current !== idx) return;
        playSceneMusic(idx);
                enterScene(idx);
        {
            const n = sceneNum(idx);
            let dur = AUTO_DUR[idx];
            if (n === 3) {
                const count = document.querySelectorAll('#scene-3-messages [data-main][data-sub]').length || SCENE3_MSG_COUNT;
                dur = count * SCENE3_MSG_HOLD + 3000;
            }
            if (idx < NUM_SCENES - 1 && dur) {
                startAutoAdvance(idx, dur);
            } else if (n === 4) {
                // Sinh nhật: bar theo ước lượng lời chúc; safety 120s tránh kẹt
                clearSceneMusicEndAdvance();
                const est = estimateScene4DurationMs();
                startProgress(est);
                autoNextScene = idx + 1;
                autoTimerId = setTimeout(() => {
                    if (current === idx && !isPaused) goToScene(idx + 1);
                }, SCENE4_SAFETY_MS);
            } else if (n === 7) {
                // Video tự bind progress trong enter5
                clearSceneMusicEndAdvance();
            } else if (n === 8) {
                // Letter tự advance; chỉ chạy progress theo bài Chỉ Yêu Mình Em
                clearSceneMusicEndAdvance();
                bindSceneMusicProgressOnly(idx);
            } else if (n === 9) {
                // Finale: progress theo bài tỏ tình (hết bài → enter9 tự về đầu)
                clearSceneMusicEndAdvance();
                bindSceneMusicProgressOnly(idx);
            } else if (idx < NUM_SCENES - 1) {
                // 5, 6: hết đúng bài của scene mới sang
                bindSceneMusicEndAdvance(idx);
            }
        }
    }, enterAtMs);
}

function updateDots() {
    document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === current));
    document.getElementById('prev-btn').style.opacity = current > 0 ? '1' : '0.18';
    document.getElementById('next-btn').style.opacity = current < NUM_SCENES - 1 ? '1' : '0.18';
}

function startProgress(duration) {
    autoDuration = duration;
    autoStartAt = Date.now();
    const fill = document.getElementById('progress-fill');
    function tick() {
        if (isPaused) return;
        const pct = Math.min((Date.now() - autoStartAt) / autoDuration * 100, 100);
        fill.style.width = pct + '%';
        if (pct < 100) progressRaf = requestAnimationFrame(tick);
    }
    tick();
}

function startAutoAdvance(idx, duration) {
    autoNextScene = idx + 1;
    autoRemaining = duration;
    startProgress(duration);
    autoTimerId = setTimeout(() => goToScene(autoNextScene), duration);
}

/** Ước lượng thời lượng scene 4 (gõ lời chúc) để progress bar khớp nội dung */
function estimateScene4DurationMs() {
    const wishList = Array.from(document.querySelectorAll('#bday-wish-source p'))
        .map(p => (p.textContent || '').trim())
        .filter(Boolean);
    if (!wishList.length) return 45000;
    const INTRO_MS = 5200;
    const TYPE_MS = 36;
    const HOLD_MS = 2400;
    const CLEAR_MS = 420;
    let total = INTRO_MS;
    wishList.forEach((text, i) => {
        total += text.length * TYPE_MS + HOLD_MS;
        if (i < wishList.length - 1) total += CLEAR_MS;
        else total += SCENE4_AFTER_WISH_MS;
    });
    return total;
}

let sceneMusicEndHandler = null;
let sceneMusicProgressHandler = null;
let sceneMusicEarlyAdvanceId = null;
let sceneMusicProgressRaf = null;
function expectedSceneMusicFile(idx) {
    const src = (SCENE_MUSIC_ALT[idx] && SCENE_MUSIC_ALT[idx][0]) || SCENE_MUSIC_SRC[idx] || '';
    return src ? src.split('/').pop() : '';
}
function audioMatchesSceneTrack(audio, fileName) {
    if (!audio || !fileName) return false;
    if (sceneMusicTrack === fileName) return true;
    const src = decodeURIComponent(audio.currentSrc || audio.src || '');
    return src.includes(fileName);
}
function clearSceneMusicEndAdvance() {
    const audio = sceneMusicEl();
    if (audio && sceneMusicEndHandler) {
        audio.removeEventListener('ended', sceneMusicEndHandler);
        sceneMusicEndHandler = null;
    }
    if (audio && sceneMusicProgressHandler) {
        audio.removeEventListener('loadedmetadata', sceneMusicProgressHandler);
        audio.removeEventListener('playing', sceneMusicProgressHandler);
        sceneMusicProgressHandler = null;
    }
    if (sceneMusicEarlyAdvanceId != null) {
        clearTimeout(sceneMusicEarlyAdvanceId);
        sceneMusicEarlyAdvanceId = null;
    }
    if (sceneMusicProgressRaf != null) {
        cancelAnimationFrame(sceneMusicProgressRaf);
        sceneMusicProgressRaf = null;
    }
}

/** Chỉ cập nhật progress bar theo nhạc — không auto-advance (dùng cho scene 8/9) */
function bindSceneMusicProgressOnly(idx) {
    clearSceneMusicEndAdvance();
    const audio = sceneMusicEl();
    if (!audio) return;
    const expectedFile = expectedSceneMusicFile(idx);
    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = '0%';

    sceneMusicProgressHandler = () => {
        if (current !== idx) return;
        if (Number.isFinite(audio.duration) && audio.duration > 0 && audioMatchesSceneTrack(audio, expectedFile)) {
            // Đồng bộ autoDuration để pause/resume không làm bar nhảy sai
            autoDuration = audio.duration * 1000;
            autoStartAt = Date.now() - (audio.currentTime * 1000);
        }
    };
    audio.addEventListener('loadedmetadata', sceneMusicProgressHandler);
    audio.addEventListener('playing', sceneMusicProgressHandler);
    if (audio.readyState >= 1) sceneMusicProgressHandler();

    function trackSongProgress() {
        sceneMusicProgressRaf = null;
        if (current !== idx || !fill) return;
        if (audio.duration > 0 && audioMatchesSceneTrack(audio, expectedFile)) {
            const t = Math.min(Math.max(audio.currentTime, 0), audio.duration);
            fill.style.width = Math.min((t / audio.duration) * 100, 100) + '%';
        }
        if (current === idx) sceneMusicProgressRaf = requestAnimationFrame(trackSongProgress);
    }
    sceneMusicProgressRaf = requestAnimationFrame(trackSongProgress);
}

function bindSceneMusicEndAdvance(idx) {
    clearSceneMusicEndAdvance();
    const audio = sceneMusicEl();
    if (!audio) return;
    autoNextScene = idx + 1;
    const expectedFile = expectedSceneMusicFile(idx);

    sceneMusicProgressHandler = () => {
        if (current !== idx) return;
        if (Number.isFinite(audio.duration) && audio.duration > 0 && audioMatchesSceneTrack(audio, expectedFile)) {
            startProgress(audio.duration * 1000);
        }
    };
    audio.addEventListener('loadedmetadata', sceneMusicProgressHandler);
    audio.addEventListener('playing', sceneMusicProgressHandler);
    if (audio.readyState >= 1) sceneMusicProgressHandler();

    sceneMusicEndHandler = () => {
        // Chỉ nhảy khi đúng bài của scene này đã hết — tránh dính audio.ended từ scene trước
        if (!audioMatchesSceneTrack(audio, expectedFile)) return;
        clearSceneMusicEndAdvance();
        if (current === idx && !isPaused && autoNextScene >= 0 && autoNextScene < NUM_SCENES) {
            goToScene(autoNextScene);
        }
    };
    audio.loop = false;
    audio.addEventListener('ended', sceneMusicEndHandler);

    // Chỉ early-advance nếu ĐÚNG bài của scene này đã hết (không phải bài scene trước)
    const tryEarlyAdvance = () => {
        sceneMusicEarlyAdvanceId = null;
        if (current !== idx || !sceneMusicEndHandler) return;
        if (!audioMatchesSceneTrack(audio, expectedFile)) return;
        if (audio.paused && !audio.ended) return;
        if (audio.ended || (audio.duration > 0 && audio.currentTime >= audio.duration - 0.15)) {
            sceneMusicEndHandler();
        }
    };
    // Chờ playSceneMusic kịp đổi src / bắt đầu bài mới rồi mới xét
    sceneMusicEarlyAdvanceId = setTimeout(tryEarlyAdvance, 1500);

    const fill = document.getElementById('progress-fill');
    function trackSongProgress() {
        sceneMusicProgressRaf = null;
        if (current !== idx || !fill) return;
        if (!audio.paused && audio.duration > 0 && audioMatchesSceneTrack(audio, expectedFile)) {
            fill.style.width = Math.min((audio.currentTime / audio.duration) * 100, 100) + '%';
        }
        if (current === idx) sceneMusicProgressRaf = requestAnimationFrame(trackSongProgress);
    }
    sceneMusicProgressRaf = requestAnimationFrame(trackSongProgress);
}

function stopAutoAdvance(keepRemaining) {
    if (autoTimerId) {
        clearTimeout(autoTimerId);
        autoTimerId = null;
    }
    if (progressRaf) {
        cancelAnimationFrame(progressRaf);
        progressRaf = null;
    }
    if (keepRemaining && autoDuration > 0 && autoStartAt > 0) {
        const elapsed = Date.now() - autoStartAt;
        autoRemaining = Math.max(autoDuration - elapsed, 0);
    } else if (!keepRemaining) {
        autoRemaining = 0;
        autoDuration = 0;
        autoStartAt = 0;
        autoNextScene = -1;
    }
}

function resumeAutoAdvance() {
    if (autoRemaining <= 0 || autoNextScene < 0) return;
    startProgress(autoRemaining);
    autoTimerId = setTimeout(() => goToScene(autoNextScene), autoRemaining);
}

function ensureSceneTimerBag(sceneIdx) {
    if (!sceneTimers[sceneIdx]) {
        sceneTimers[sceneIdx] = { timeouts: new Set(), intervals: new Set() };
    }
    return sceneTimers[sceneIdx];
}

function setSceneTimeout(sceneIdx, fn, delay) {
    const bag = ensureSceneTimerBag(sceneIdx);
    const id = setTimeout(() => {
        bag.timeouts.delete(id);
        if (sceneIdx !== current) return;
        fn();
    }, delay);
    bag.timeouts.add(id);
    return id;
}

function setSceneInterval(sceneIdx, fn, delay) {
    const bag = ensureSceneTimerBag(sceneIdx);
    const id = setInterval(() => {
        if (sceneIdx !== current || isPaused) return;
        fn();
    }, delay);
    bag.intervals.add(id);
    return id;
}

function clearSceneTimers(sceneIdx) {
    const bag = sceneTimers[sceneIdx];
    if (!bag) return;
    bag.timeouts.forEach(clearTimeout);
    bag.intervals.forEach(clearInterval);
    bag.timeouts.clear();
    bag.intervals.clear();
}

function togglePause() {
    if (current < 0) return;
    const pauseBtn = document.getElementById('pause-btn');
    const music = sceneMusicEl();
    const stageVideo = document.getElementById('stage-video');
    isPaused = !isPaused;
    document.body.classList.toggle('experience-paused', isPaused);
    pauseBtn.classList.toggle('is-paused', isPaused);
    pauseBtn.textContent = isPaused ? '▶' : 'II';
    pauseBtn.setAttribute('aria-label', isPaused ? 'Resume experience' : 'Pause experience');
    if (isPaused) {
        stopAutoAdvance(true);
        stopVoice();
        if (music && !music.paused) music.pause();
        if (stageVideo && !stageVideo.paused) stageVideo.pause();
        pausedAnimeInstances = anime.running.slice();
        pausedAnimeInstances.forEach(instance => instance.pause());
        return;
    }
    // Scene 7 uses video audio — don't restart scene music over it
    if (sceneNum(current) === 7 && stageVideo) {
        stageVideo.play().catch(() => { });
    } else if (music) {
        music.play().catch(() => { });
    }
    pausedAnimeInstances.forEach(instance => {
        if (instance && typeof instance.play === 'function') instance.play();
    });
    pausedAnimeInstances = [];
    resumeAutoAdvance();
}

function resetScene(idx) {
    const scene = document.getElementById(sceneDomId(idx));
    if (!scene) return;
    stopVoice();
    scene.querySelectorAll(
        '.opening-lines p, .s2-banner, .s2-name, .s2-sub, .s2-date, ' +
        '#msg-main, #msg-sub, .seed-line, .seed-sub, ' +
        '.stage-title, .stage-sub, .fl-poem, .fl-poem-sub, .show-label, ' +
        '.s4-title, .cyme-title, .photo-card, .s4-hint, ' +
        '.s5-cake, .s5-hb, .s5-wishes p, .bday-wish-line, .bday-label, .bday-neon-line, .bday-frame, .s6-date, .s6-msg, #egg, ' +
        '.finale-label, .finale-title, .finale-hook, .finale-sub, .finale-lyric-main, .finale-lyric-sub, .finale-heart-wrap, .finale-ask, .finale-karaoke'
    ).forEach(el => { el.style.opacity = '0'; el.style.transform = ''; });
    const wishLineReset = document.getElementById('bday-wish-line');
    if (wishLineReset) {
        wishLineReset.textContent = '';
        wishLineReset.classList.remove('is-typing');
    }
    const egg = document.getElementById('egg');
    if (egg) egg.classList.remove('show');
    if (sceneNum(idx) === 5) {
        scene.classList.remove('tree-growing', 'tree-bloomed');
    }
    if (sceneNum(idx) === 6) {
        scene.classList.remove('fl-active');
    }
    if (sceneNum(idx) === 9) {
        scene.classList.remove('is-bloom');
        scene.style.removeProperty('--finale-beat');
        scene.classList.remove(
            'mood-shy', 'mood-brave', 'mood-ask', 'mood-tender',
            'mood-confess', 'mood-play', 'mood-longing', 'is-asking'
        );
        const lyricMain = scene.querySelector('#finale-lyric-main');
        const lyricSub = scene.querySelector('#finale-lyric-sub');
        if (lyricMain) lyricMain.textContent = '';
        if (lyricSub) lyricSub.textContent = '';
    }
    if (sceneNum(idx) === 8) {
        scene.classList.remove('is-final', 'cyme-active', 'has-lyric', 'letter-open', 'letter-fanning', 'is-collapsing');
        const mem = scene.querySelector('#memory-phase');
        const fin = scene.querySelector('#final-phase');
        const kar = scene.querySelector('.karaoke-box--corner');
        if (mem) { mem.hidden = false; mem.style.opacity = ''; mem.style.transform = ''; }
        if (kar) { kar.style.opacity = ''; kar.style.pointerEvents = ''; }
        ['.cyme-head', '#cyme-intro', '.s4-hint'].forEach(sel => {
            const el = scene.querySelector(sel);
            if (el) { el.style.visibility = ''; el.style.opacity = ''; }
        });
        if (fin) {
            fin.hidden = true;
            fin.style.display = '';
            fin.style.opacity = '';
            const desk = fin.querySelector('#letter-desk');
            if (desk) {
                desk.classList.remove('is-open', 'is-fanning');
                desk.removeAttribute('data-page-count');
                desk.removeAttribute('data-fan-count');
                desk.innerHTML = '';
                desk.style.opacity = '';
                desk.style.transform = '';
                desk.style.filter = '';
            }
        }
    }
}

function enterScene(idx) {
    const n = sceneNum(idx);
    // 4=sinh nhật(enter7), 5=cây(enter4), 6=hoa(enterFlowers), 7=sân khấu(enter5), 8=kỷ niệm(enter6), 9=trái tim(enter9)
    ({ 1: enter1, 2: enter2, 3: enter3, 4: enter7, 5: enter4, 6: enterFlowers, 7: enter5, 8: enter6, 9: enter9 })[n]();
}

// ===== SCENE 1: Má»ž Äáº¦U =====
function enter1() {
    // Gentle wind for scene 1
    PETAL_SYSTEM.setWind(0.22);
    setSceneTimeout(current, () => PETAL_SYSTEM.setWind(0), 2800);

    const lines = document.querySelectorAll('#scene-1 .opening-lines p');
    lines.forEach(el => {
        if (el.dataset.rawText) el.textContent = el.dataset.rawText;
    });
    anime({
        targets: '#scene-1 .show-label',
        opacity: [0, 1],
        translateY: [-12, 0],
        duration: 700,
        easing: 'easeOutExpo'
    });
    anime({
        targets: lines,
        opacity: [0, 1],
        translateY: [28, 0],
        filter: ['blur(6px)', 'blur(0px)'],
        delay: el => parseInt(el.dataset.delay, 10) || 0,
        duration: 1000,
        easing: 'easeOutExpo'
    });
}

// ===== SCENE 2: TÃŠN =====
function enter2() {
    // Aurora canvas
    const aCanvas = document.getElementById('aurora-canvas');
    const ctx = aCanvas.getContext('2d');
    aCanvas.width = innerWidth; aCanvas.height = innerHeight;
    let running = true, at = 0;

    const bands = [
        { xf: t => 0.28 + Math.sin(t * 1.1) * 0.14,  c: [150, 0,   255, 0.14] },
        { xf: t => 0.50 + Math.sin(t * 0.75) * 0.20, c: [0,   180, 255, 0.11] },
        { xf: t => 0.72 + Math.sin(t * 1.3) * 0.11,  c: [255, 40,  200, 0.11] },
        { xf: t => 0.50 + Math.cos(t * 0.65) * 0.22, c: [100, 255, 180, 0.09] },
        { xf: t => 0.38 + Math.sin(t * 0.9) * 0.16,  c: [255, 180, 80,  0.07] }
    ];

    function drawAurora() {
        if (!running) return;
        if (isExperiencePaused()) {
            requestAnimationFrame(drawAurora);
            return;
        }
        ctx.clearRect(0, 0, aCanvas.width, aCanvas.height);
        at += 0.005;
        bands.forEach(b => {
            const gx = b.xf(at) * aCanvas.width;
            const [r, g, bl, a] = b.c;
            const grad = ctx.createRadialGradient(gx, aCanvas.height * 0.42, 0, gx, aCanvas.height * 0.42, aCanvas.width * 0.54);
            grad.addColorStop(0, `rgba(${r},${g},${bl},${a * 1.5})`);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, aCanvas.width, aCanvas.height);
        });
        requestAnimationFrame(drawAurora);
    }
    drawAurora();
    const si2 = current;
    cleanups[si2] = () => { running = false; ctx.clearRect(0, 0, aCanvas.width, aCanvas.height); };

    // Petal burst when name appears (1 sec delay)
    setSceneTimeout(si2, () => {
        PETAL_SYSTEM.burst(innerWidth / 2, innerHeight * 0.52, 22, 4);
        setSceneTimeout(si2, () => PETAL_SYSTEM.burst(innerWidth * 0.35, innerHeight * 0.5, 8, 3), 400);
        setSceneTimeout(si2, () => PETAL_SYSTEM.burst(innerWidth * 0.65, innerHeight * 0.5, 8, 3), 700);
    }, 900);

    anime.timeline({ easing: 'easeOutExpo' })
        .add({ targets: '#scene-2 .show-label', opacity: [0, 1], translateY: [-10, 0], duration: 650 })
        .add({ targets: '.s2-banner', opacity: [0, 1], translateY: [-38, 0], filter: ['blur(8px)', 'blur(0px)'], duration: 1000 }, '-=200')
        .add({ targets: '.s2-name',   opacity: [0, 1], scale: [0.4, 1], easing: 'easeOutBack', duration: 1200 }, '-=200')
        .add({ targets: '.s2-sub',    opacity: [0, 1], translateY: [20, 0], duration: 700 }, '-=500')
        .add({ targets: '.s2-date',   opacity: [0, 1], letterSpacing: ['2px', '10px'], duration: 900 }, '-=300');

    // Floating sparkle divs around name
    const scene = document.getElementById('scene-2');
    function spawnSparkle() {
        if (!running) return;
        const el = document.createElement('div');
        const size = Math.random() * 5 + 3;
        el.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;
            background:hsl(${Math.random() * 60 + 300},100%,80%);
            left:${Math.random() * 80 + 10}%;top:${Math.random() * 60 + 20}%;
            pointer-events:none;z-index:1;box-shadow:0 0 ${size * 2}px hsl(${Math.random() * 60 + 300},100%,80%);`;
        scene.appendChild(el);
        anime({
            targets: el,
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            duration: 1500 + Math.random() * 1000,
            easing: 'easeInOutSine',
            complete: () => el.remove()
        });
        setSceneTimeout(si2, spawnSparkle, 300 + Math.random() * 400);
    }
    setSceneTimeout(si2, spawnSparkle, 1200);
}

// ===== SCENE 3: gentle messages =====
// Phải đọc DOM trong enter3 — scenes load async, IIFE lúc parse script sẽ rỗng → fallback sai
function escapeMsgHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function emoSpan3(emoji) {
    if (!emoji) return '';
    return `<span class="emo" aria-hidden="true">${emoji}</span>`;
}
function wrapMsgWithEmo(text, left, right) {
    const body = escapeMsgHtml(text || '');
    return `${emoSpan3(left)}${body ? ` ${body} ` : ''}${emoSpan3(right)}`.trim();
}
function loadMessages3() {
    const nodes = document.querySelectorAll('#scene-3-messages [data-main][data-sub]');
    const fromHtml = Array.from(nodes).map(node => ({
        main: node.getAttribute('data-main') || '',
        sub: node.getAttribute('data-sub') || '',
        emoMainL: node.getAttribute('data-emo-main-l') || '',
        emoMainR: node.getAttribute('data-emo-main-r') || '',
        emoSubL: node.getAttribute('data-emo-sub-l') || '',
        emoSubR: node.getAttribute('data-emo-sub-r') || ''
    })).filter(item => item.main || item.sub);
    if (fromHtml.length) return fromHtml;
    return [
        { main: '"Bé Bơ này..."', sub: 'Có một điều anh muốn nói với em từ lâu rồi.', emoMainL: '🥑', emoMainR: '💭', emoSubL: '🙈', emoSubR: '💗' }
    ];
}

function enter3() {
    const messages3 = loadMessages3();
    // Bokeh canvas â€” add cherry pink tones
    const bCanvas = document.getElementById('bokeh-canvas');
    const ctx = bCanvas.getContext('2d');
    bCanvas.width = innerWidth; bCanvas.height = innerHeight;

    const palettes = [
        [200, 245], [275, 320], [330, 360], [170, 210]
    ];
    const orbs = Array.from({ length: 32 }, () => {
        const [lo, hi] = palettes[Math.floor(Math.random() * palettes.length)];
        return {
            x: Math.random() * bCanvas.width, y: Math.random() * bCanvas.height,
            r: Math.random() * 80 + 20,
            vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
            hue: lo + Math.random() * (hi - lo),
            a: Math.random() * 0.065 + 0.025
        };
    });

    // Rising sparkle particles (light wisps)
    const wisps = Array.from({ length: 18 }, () => ({
        x: Math.random() * bCanvas.width,
        y: bCanvas.height + Math.random() * 100,
        vy: Math.random() * 0.9 + 0.4,
        r: Math.random() * 2.5 + 0.8,
        alpha: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.5 ? 330 : 55
    }));

    let running = true;
    let bt = 0;
    function drawBokeh() {
        if (!running) return;
        if (isExperiencePaused()) {
            requestAnimationFrame(drawBokeh);
            return;
        }
        ctx.clearRect(0, 0, bCanvas.width, bCanvas.height);
        bt += 0.016;

        orbs.forEach(o => {
            o.x += o.vx; o.y += o.vy;
            if (o.x < -o.r) o.x = bCanvas.width + o.r;
            if (o.x > bCanvas.width + o.r) o.x = -o.r;
            if (o.y < -o.r) o.y = bCanvas.height + o.r;
            if (o.y > bCanvas.height + o.r) o.y = -o.r;
            const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
            g.addColorStop(0, `hsla(${o.hue},78%,70%,${o.a})`);
            g.addColorStop(1, `hsla(${o.hue},78%,70%,0)`);
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
        });

        wisps.forEach(w => {
            w.y -= w.vy;
            w.x += Math.sin(bt * 0.7 + w.phase) * 0.6;
            const a = w.alpha * (1 - (bCanvas.height - w.y) / bCanvas.height);
            if (w.y < -10) { w.y = bCanvas.height + 10; w.x = Math.random() * bCanvas.width; }
            ctx.globalAlpha = Math.max(0, a);
            ctx.fillStyle = `hsl(${w.hue},90%,80%)`;
            ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2); ctx.fill();
            // glow
            const g2 = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.r * 4);
            g2.addColorStop(0, `hsla(${w.hue},90%,80%,${a * 0.5})`);
            g2.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g2;
            ctx.beginPath(); ctx.arc(w.x, w.y, w.r * 4, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;
        requestAnimationFrame(drawBokeh);
    }
    drawBokeh();

    // Mỗi câu chỉ 1 lần: nói (main) → ngập ngừng → giải thích (sub)
    const mainEl = document.getElementById('msg-main');
    const subEl  = document.getElementById('msg-sub');
    const si3 = current;
    const totalMsgs = messages3.length;

    function showMsg(i) {
        if (current !== si3 || i >= totalMsgs || !mainEl || !subEl) return;
        const m = messages3[i];
        anime.remove([mainEl, subEl]);

        const reveal = () => {
            if (current !== si3) return;
            mainEl.innerHTML = wrapMsgWithEmo(m.main, m.emoMainL, m.emoMainR);
            subEl.innerHTML = '';
            subEl.style.opacity = '0';
            anime({
                targets: mainEl,
                opacity: [0, 1],
                translateY: [16, 0],
                duration: 780,
                easing: 'easeOutExpo'
            });
            // Ngập ngừng rồi mới “giải thích”
            setSceneTimeout(si3, () => {
                if (current !== si3) return;
                subEl.innerHTML = wrapMsgWithEmo(m.sub, m.emoSubL, m.emoSubR);
                anime({
                    targets: subEl,
                    opacity: [0, 1],
                    translateY: [12, 0],
                    duration: 900,
                    easing: 'easeOutExpo'
                });
            }, SCENE3_HESITATE);

            if (i + 1 < totalMsgs) {
                setSceneTimeout(si3, () => showMsg(i + 1), SCENE3_MSG_HOLD);
            }
        };

        if (i === 0) {
            reveal();
            return;
        }
        anime({
            targets: [mainEl, subEl],
            opacity: 0,
            translateY: -8,
            duration: 420,
            easing: 'easeInSine',
            complete: reveal
        });
    }

    anime({ targets: '#scene-3 .show-label', opacity: [0, 1], duration: 700, easing: 'easeOutExpo' });
    showMsg(0);
    cleanups[si3] = () => {
        running = false;
        ctx.clearRect(0, 0, bCanvas.width, bCanvas.height);
    };
}

// ===== SCENE 5: Háº T GIá»NG =====
function enter4() {
    const canvas = document.getElementById('seed-canvas');
    let ctx = canvas.getContext('2d', { alpha: true });
    canvas.width = innerWidth; canvas.height = innerHeight;
    const mainCtx = ctx;
    let running = true;
    // Offscreen bake: when tree finished growing, redraw once and blit each frame
    const treeCache = document.createElement('canvas');
    treeCache.width = canvas.width;
    treeCache.height = canvas.height;
    const treeCacheCtx = treeCache.getContext('2d', { alpha: true });
    let treeFrozen = false;
    let treeCacheValid = false;
    let bakeCooldown = 0;
    const scene4El = document.getElementById('scene-5');
    // Keep original canvas cherry tree (L-system), hide CSS stage
    const useCssTree = false;
    scene4El.classList.remove('tree-growing', 'tree-bloomed');
    const W = canvas.width, H = canvas.height;
    const GROUND = H * 0.82;
    const CX = W * 0.5;
    let elapsed = 0, lastTs = performance.now();

    function ease(t) { return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; }
    function lerp(a,b,t) { return a+(b-a)*Math.max(0,Math.min(1,t)); }
    function qbez(x0,y0,cx,cy,x1,y1,t){ const u=1-t; return {x:u*u*x0+2*u*t*cx+t*t*x1, y:u*u*y0+2*u*t*cy+t*t*y1}; }
    function smoothstep(e0, e1, x) {
        if (x <= e0) return 0;
        if (x >= e1) return 1;
        const t = (x - e0) / (e1 - e0);
        return t * t * (3 - 2 * t);
    }

    // Camera cinematic: nhiều góc (wide / low / high / close / dutch) — không chỉ lia ngang
    // x,y: offset px | z: zoom | rot: radian
    const CAM_SHOTS = [
        { t: 0,    x: 0,   y: 18,  z: 1.02, rot: 0 },          // wide mở đầu
        { t: 14,   x: 0,   y: 55,  z: 1.14, rot: 0.01 },       // đẩy xuống hạt
        { t: 22,   x: -48, y: 10,  z: 1.18, rot: -0.035 },     // góc nghiêng thân trái
        { t: 32,   x: 42,  y: -55, z: 1.22, rot: 0.04 },       // nhìn lên tán phải
        { t: 45,   x: -28, y: -70, z: 1.32, rot: -0.02 },      // cận nụ
        { t: 52,   x: 55,  y: -48, z: 1.26, rot: 0.045 },      // lia vòng sang phải
        { t: 62.5, x: 0,   y: -85, z: 1.38, rot: 0 },          // cận hoa nở full
        { t: 72,   x: -60, y: -35, z: 1.2,  rot: -0.05 },      // góc rộng cánh bay
        { t: 90,   x: 38,  y: -20, z: 1.16, rot: 0.025 },      // chậm quanh tán
        { t: 110,  x: -25, y: -40, z: 1.24, rot: -0.015 },     // cận lại
        { t: 140,  x: 20,  y: -15, z: 1.12, rot: 0.02 },       // kéo ra nhẹ
        { t: 165,  x: 0,   y: 0,   z: 1.04, rot: 0 }           // kết wide
    ];
    function sampleCam(mt) {
        const shots = CAM_SHOTS;
        let i = 0;
        while (i < shots.length - 1 && mt >= shots[i + 1].t) i++;
        const a = shots[i];
        const b = shots[Math.min(i + 1, shots.length - 1)];
        const u = a.t === b.t ? 1 : smoothstep(a.t, b.t, mt);
        // drift nhẹ (ellipse) — tránh lia ngang đơn điệu
        const driftX = Math.sin(mt * 0.17) * 10 + Math.sin(mt * 0.07) * 6;
        const driftY = Math.cos(mt * 0.13) * 7;
        const driftR = Math.sin(mt * 0.09) * 0.006;
        return {
            x: lerp(a.x, b.x, u) + driftX,
            y: lerp(a.y, b.y, u) + driftY,
            z: lerp(a.z, b.z, u),
            rot: lerp(a.rot, b.rot, u) + driftR
        };
    }
    function beginCam(c) {
        ctx.save();
        ctx.translate(W * 0.5, H * 0.5);
        ctx.rotate(c.rot);
        ctx.scale(c.z, c.z);
        ctx.translate(-W * 0.5 + c.x, -H * 0.5 + c.y);
    }
    function endCam() { ctx.restore(); }

    let ambAlpha=0;
    const clouds = [];
    for(let i=0;i<5;i++){
        const far = i < 2;
        clouds.push({
            x: Math.random() * W * 1.6 - W * 0.3,
            y: H * (far ? 0.04 : 0.1) + Math.random() * H * (far ? 0.12 : 0.18),
            w: (far ? 100 : 70) + Math.random() * (far ? 140 : 90),
            h: (far ? 22 : 18) + Math.random() * 28,
            speed: (far ? 0.06 : 0.12) + Math.random() * 0.12,
            alpha: (far ? 0.06 : 0.1) + Math.random() * 0.06,
            layer: far ? 0 : 1
        });
    }
    const skyStars = Array.from({ length: 22 }, () => ({
        x: Math.random() * W,
        y: Math.random() * GROUND * 0.75,
        r: Math.random() * 1.15 + 0.25,
        ph: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.9 + 0.35,
        blue: Math.random() > 0.62
    }));
    let starTw = 0;
    function drawNightStars(){
        const a = ambAlpha;
        skyStars.forEach(s => {
            const tw = 0.35 + 0.65 * Math.sin(starTw * s.sp + s.ph);
            ctx.globalAlpha = a * tw * 0.9;
            ctx.fillStyle = s.blue ? '#a8d4ff' : '#ffffff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * (0.75 + 0.35 * tw), 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
    
    function drawMountains(){
        const a = ambAlpha;
        ctx.globalAlpha = a * 0.5;
        const g0 = ctx.createLinearGradient(0, GROUND - H * 0.42, 0, GROUND);
        g0.addColorStop(0, 'rgba(35,32,58,0.9)');
        g0.addColorStop(1, 'rgba(22,18,38,0.95)');
        ctx.fillStyle = g0;
        ctx.beginPath();
        ctx.moveTo(0, GROUND);
        ctx.lineTo(0, GROUND - H * 0.22);
        ctx.bezierCurveTo(W * 0.12, GROUND - H * 0.32, W * 0.22, GROUND - H * 0.26, W * 0.32, GROUND - H * 0.36);
        ctx.bezierCurveTo(W * 0.42, GROUND - H * 0.3, W * 0.52, GROUND - H * 0.4, W * 0.62, GROUND - H * 0.33);
        ctx.bezierCurveTo(W * 0.72, GROUND - H * 0.38, W * 0.82, GROUND - H * 0.28, W, GROUND - H * 0.24);
        ctx.lineTo(W, GROUND);
        ctx.closePath();
        ctx.fill();
        
        ctx.globalAlpha = a * 0.82;
        const g1 = ctx.createLinearGradient(0, GROUND - H * 0.35, 0, GROUND);
        g1.addColorStop(0, '#252038');
        g1.addColorStop(0.6, '#1a1628');
        g1.addColorStop(1, '#14101c');
        ctx.fillStyle = g1;
        ctx.beginPath();
        ctx.moveTo(0, GROUND);
        ctx.lineTo(0, GROUND - H * 0.18);
        ctx.bezierCurveTo(W * 0.08, GROUND - H * 0.26, W * 0.18, GROUND - H * 0.2, W * 0.28, GROUND - H * 0.3);
        ctx.bezierCurveTo(W * 0.38, GROUND - H * 0.22, W * 0.48, GROUND - H * 0.32, W * 0.58, GROUND - H * 0.24);
        ctx.bezierCurveTo(W * 0.68, GROUND - H * 0.3, W * 0.78, GROUND - H * 0.2, W * 0.88, GROUND - H * 0.26);
        ctx.bezierCurveTo(W * 0.94, GROUND - H * 0.2, W, GROUND - H * 0.16, W, GROUND - H * 0.14);
        ctx.lineTo(W, GROUND);
        ctx.closePath();
        ctx.fill();
        
        ctx.globalAlpha = a * 0.95;
        ctx.fillStyle = '#0e0c14';
        ctx.beginPath();
        ctx.moveTo(0, GROUND);
        ctx.lineTo(0, GROUND - H * 0.1);
        ctx.quadraticCurveTo(W * 0.2, GROUND - H * 0.16, W * 0.4, GROUND - H * 0.11);
        ctx.quadraticCurveTo(W * 0.6, GROUND - H * 0.15, W * 0.8, GROUND - H * 0.09);
        ctx.quadraticCurveTo(W * 0.92, GROUND - H * 0.12, W, GROUND - H * 0.08);
        ctx.lineTo(W, GROUND);
        ctx.closePath();
        ctx.fill();
        
        ctx.globalAlpha = a * 0.25;
        const mist = ctx.createLinearGradient(0, GROUND - H * 0.12, 0, GROUND);
        mist.addColorStop(0, 'rgba(26,10,46,0)');
        mist.addColorStop(0.5, 'rgba(40,25,70,0.25)');
        mist.addColorStop(1, 'rgba(10,8,20,0.2)');
        ctx.fillStyle = mist;
        ctx.fillRect(0, GROUND - H * 0.14, W, H * 0.14);
        ctx.globalAlpha = 1;
    }
    
    function drawCloudPuff(cx, cy, rw, rh, rot, r, g, b, op){
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.scale(1, 0.68);
        const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rw);
        gr.addColorStop(0, `rgba(${r},${g},${b},${op})`);
        gr.addColorStop(0.65, `rgba(${r},${g},${b},${op * 0.75})`);
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    function drawClouds(dtMove){
        const sorted = [...clouds].sort((a, b) => a.layer - b.layer);
        sorted.forEach(c => {
            if (dtMove > 0) {
                c.x += c.speed * 60 * dtMove;
                if(c.x > W + c.w * 1.2) c.x = -c.w * 1.5;
            }
            ctx.globalAlpha = ambAlpha * c.alpha;
            if(c.layer === 0){
                drawCloudPuff(c.x, c.y, c.w * 0.48, c.h * 0.52, 0, 55, 52, 82, 0.22);
                drawCloudPuff(c.x - c.w * 0.28, c.y + c.h * 0.06, c.w * 0.34, c.h * 0.42, -0.07, 48, 50, 78, 0.18);
                drawCloudPuff(c.x + c.w * 0.3, c.y + c.h * 0.03, c.w * 0.38, c.h * 0.48, 0.05, 52, 48, 85, 0.2);
            } else {
                drawCloudPuff(c.x, c.y, c.w * 0.42, c.h * 0.48, 0, 72, 68, 108, 0.28);
                drawCloudPuff(c.x - c.w * 0.26, c.y + c.h * 0.1, c.w * 0.3, c.h * 0.4, -0.06, 65, 62, 100, 0.24);
                drawCloudPuff(c.x + c.w * 0.28, c.y + c.h * 0.05, c.w * 0.34, c.h * 0.45, 0.06, 70, 65, 105, 0.26);
                drawCloudPuff(c.x + c.w * 0.04, c.y - c.h * 0.1, c.w * 0.24, c.h * 0.32, 0, 58, 55, 90, 0.2);
            }
        });
        ctx.globalAlpha = 1;
    }
    
    // Bokeh / wisps: same palettes & motion as enter3 (scene 3), scaled by 60*dt for frame-rate independence
    const bokehPalettes = [[200, 245], [275, 320], [330, 360], [170, 210]];
    const FBOKEH = 60;
    const seedBokehOrbs = Array.from({ length: 5 }, () => {
        const [lo, hi] = bokehPalettes[Math.floor(Math.random() * bokehPalettes.length)];
        return {
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 60 + 18,
            vx: (Math.random() - 0.5) * 0.22,
            vy: (Math.random() - 0.5) * 0.22,
            hue: lo + Math.random() * (hi - lo),
            a: Math.random() * 0.05 + 0.02
        };
    });
    const seedBokehWisps = Array.from({ length: 3 }, () => ({
        x: Math.random() * W,
        y: H + Math.random() * 100,
        vy: Math.random() * 0.7 + 0.35,
        r: Math.random() * 2 + 0.7,
        alpha: Math.random() * 0.4 + 0.15,
        phase: Math.random() * Math.PI * 2,
        hue: 55
    }));
    let bokehPhase = 0;
    function updateSeedBokeh(dtMove) {
        if (dtMove <= 0) return;
        bokehPhase += dtMove;
        const k = FBOKEH * dtMove;
        seedBokehOrbs.forEach(o => {
            o.x += o.vx * k;
            o.y += o.vy * k;
            if (o.x < -o.r) o.x = W + o.r;
            if (o.x > W + o.r) o.x = -o.r;
            if (o.y < -o.r) o.y = H + o.r;
            if (o.y > H + o.r) o.y = -o.r;
        });
        seedBokehWisps.forEach(w => {
            w.y -= w.vy * k;
            w.x += Math.sin(bokehPhase * 0.7 + w.phase) * 0.6 * k;
            if (w.y < -10) { w.y = H + 10; w.x = Math.random() * W; }
        });
    }
    function drawSeedBokeh() {
        const fa = ambAlpha * 0.94;
        seedBokehOrbs.forEach(o => {
            ctx.globalAlpha = fa;
            const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
            g.addColorStop(0, `hsla(${o.hue},78%,70%,${o.a})`);
            g.addColorStop(1, `hsla(${o.hue},78%,70%,0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
            ctx.fill();
        });
        seedBokehWisps.forEach(w => {
            if (w.y > H + 5) return;
            const a = fa * w.alpha * Math.max(0, 1 - (H - w.y) / H);
            ctx.globalAlpha = Math.max(0, a);
            ctx.fillStyle = `hsl(${w.hue},90%,80%)`;
            ctx.beginPath();
            ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
            ctx.fill();
            const g2 = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.r * 4);
            g2.addColorStop(0, `hsla(${w.hue},90%,80%,${a * 0.45})`);
            g2.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g2;
            ctx.beginPath();
            ctx.arc(w.x, w.y, w.r * 4, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    function drawAtmo(dtFx, dtAmb){
        ambAlpha = Math.min(ambAlpha + 0.24 * dtAmb, 1);
        const a = ambAlpha;
        // Bầu trời đêm cùng tông body / scene 2 aurora (#06061a → #1a0a2e)
        const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
        sky.addColorStop(0, `rgba(6,6,26,${a})`);
        sky.addColorStop(0.38, `rgba(12,10,35,${a})`);
        sky.addColorStop(0.68, `rgba(22,14,45,${a})`);
        sky.addColorStop(0.88, `rgba(30,18,52,${a * 0.98})`);
        sky.addColorStop(1, `rgba(26,10,46,${a * 0.96})`);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, GROUND);
        // Vầng sáng nhẹ giống aurora (scene 2) — tím / cyan / hồng rất mờ
        const bands = [
            { x: 0.32, c: [120, 0, 200, 0.1 * a] },
            { x: 0.52, c: [0, 140, 220, 0.08 * a] },
            { x: 0.68, c: [200, 60, 180, 0.07 * a] }
        ];
        bands.forEach(b => {
            const gx = b.x * W;
            const [r, g, bl, al] = b.c;
            const rg = ctx.createRadialGradient(gx, H * 0.38, 0, gx, H * 0.38, W * 0.5);
            rg.addColorStop(0, `rgba(${r},${g},${bl},${al})`);
            rg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = rg;
            ctx.fillRect(0, 0, W, GROUND);
        });
        drawNightStars();
        drawClouds(dtFx);
        drawSeedBokeh();
        drawMountains();
        const grass = ctx.createLinearGradient(0, GROUND - 4, 0, H);
        grass.addColorStop(0, `rgba(18,22,28,${a})`);
        grass.addColorStop(0.2, `rgba(10,12,18,${a})`);
        grass.addColorStop(1, `rgba(4,4,8,${a})`);
        ctx.fillStyle = grass;
        ctx.fillRect(0, GROUND - 4, W, H - GROUND + 4);
        ctx.strokeStyle = `rgba(60,70,95,${a * 0.25})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, GROUND - 0.5);
        ctx.quadraticCurveTo(W * 0.5, GROUND - 2, W, GROUND - 0.5);
        ctx.stroke();
    }

    const flLights=[];
    let nightBloomMode = false;
    const nightFlies = [];
    // Đom đóm vàng thưa — có từ đầu scene, nhẹ máy
    function ensureNightFireflies() {
        if (nightFlies.length) return;
        for (let i = 0; i < 22; i++) {
            nightFlies.push({
                x: Math.random() * W,
                y: Math.random() * (GROUND - 30),
                r: Math.random() * 1.6 + 0.6,
                ph: Math.random() * Math.PI * 2,
                sp: 0.45 + Math.random() * 0.9,
                vx: (Math.random() - 0.5) * 0.28,
                vy: (Math.random() - 0.5) * 0.18
            });
        }
    }
    function updateNightFireflies(dt) {
        for (let i = 0; i < nightFlies.length; i++) {
            const f = nightFlies[i];
            f.ph += f.sp * dt;
            f.x += f.vx + Math.sin(f.ph * 1.2) * 0.28;
            f.y += f.vy + Math.cos(f.ph * 0.85) * 0.16;
            if (f.x < -8) f.x = W + 8;
            if (f.x > W + 8) f.x = -8;
            if (f.y < 12) f.y = GROUND - 40;
            if (f.y > GROUND - 10) f.y = 24 + Math.random() * 36;
        }
    }
    function drawNightFireflies() {
        for (let i = 0; i < nightFlies.length; i++) {
            const f = nightFlies[i];
            const tw = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(f.ph));
            ctx.globalAlpha = 0.22 * tw;
            ctx.fillStyle = '#ffe28a';
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r * 2.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 0.75 * tw;
            ctx.fillStyle = '#fff3b0';
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r * 0.55, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    ensureNightFireflies();
    function spawnLight(x,y){
        if (flLights.length >= 4) return;
        flLights.push({x,y,vy:-(Math.random()*.55+.25),vx:(Math.random()-.5)*.3,r:Math.random()*1.8+.8,life:1,decay:.01+Math.random()*.01,col:'#fffb00',ph:Math.random()*Math.PI*2});
    }
    function updateLights(dt){for(let i=flLights.length-1;i>=0;i--){const l=flLights[i];l.y+=l.vy;l.x+=l.vx+Math.sin(elapsed*2+l.ph)*.28;l.life-=l.decay;if(l.life<=0)flLights.splice(i,1);}}
    function drawLights(){flLights.forEach(l=>{ctx.globalAlpha=Math.max(l.life,0)*.7;ctx.fillStyle=l.col;ctx.beginPath();ctx.arc(l.x,l.y,l.r,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;}
    // ============ THE SEED ============
    const SR=24;
    const seed={x:CX+(Math.random()-.5)*16,y:-85,vx:(Math.random()-.5)*0.55,vy:0,rot:.2,rspd:.038,sx:1,sy:1,alpha:0,state:'fall',bounces:0};
    let impacts=[];

    function drawOneSeed(){const s=seed;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.rot);ctx.scale(s.sx,s.sy);ctx.globalAlpha=s.alpha;const halo=ctx.createRadialGradient(0,0,SR*.4,0,0,SR*5);halo.addColorStop(0,'rgba(255,150,40,0.55)');halo.addColorStop(.5,'rgba(210,95,18,0.18)');halo.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,SR*5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3b1804';ctx.beginPath();ctx.moveTo(0,SR*.88);ctx.bezierCurveTo(SR*.63,SR*.42,SR*.7,-SR*.44,0,-SR*1.38);ctx.bezierCurveTo(-SR*.7,-SR*.44,-SR*.63,SR*.42,0,SR*.88);ctx.fill();const ig=ctx.createLinearGradient(-SR*.28,-SR,SR*.28,SR);ig.addColorStop(0,'#b24e14');ig.addColorStop(.45,'#7a3010');ig.addColorStop(1,'#280c02');ctx.fillStyle=ig;ctx.beginPath();ctx.moveTo(0,SR*.65);ctx.bezierCurveTo(SR*.44,SR*.26,SR*.52,-SR*.28,0,-SR*1.1);ctx.bezierCurveTo(-SR*.52,-SR*.28,-SR*.44,SR*.26,0,SR*.65);ctx.fill();ctx.fillStyle='rgba(255,185,95,0.32)';ctx.beginPath();ctx.ellipse(-SR*.17,-SR*.22,SR*.12,SR*.48,-.25,0,Math.PI*2);ctx.fill();ctx.restore();}

    function addImpact(x,y){impacts.push({type:'ring',x,y,r:0,maxR:SR*3.8,life:1,decay:.034});for(let i=0;i<12;i++){const a=Math.random()*Math.PI*2,spd=Math.random()*3.5+1;impacts.push({type:'p',x,y,vx:Math.cos(a)*spd,vy:-(Math.random()*3.5+.5),r:Math.random()*3+1.5,color:`hsl(${15+Math.random()*20},58%,${22+Math.random()*20}%)`,life:1,decay:.044+Math.random()*.03});}}
    function drawImpacts(dt){for(let i=impacts.length-1;i>=0;i--){const p=impacts[i];p.life-=p.decay;if(p.life<=0){impacts.splice(i,1);continue;}if(p.type==='ring'){p.r=Math.min(p.r+p.maxR*.09,p.maxR);ctx.globalAlpha=p.life*.25;ctx.strokeStyle='rgba(125,62,16,0.5)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.stroke();}else{p.x+=p.vx;p.y+=p.vy;p.vy+=20*dt;ctx.globalAlpha=p.life*.85;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r*p.life,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}}

    // ============ L-SYSTEM TREE (Lindenmayer) ============
    let growAge=0, growPhase='wait';
    // Fit in frame: use vertical space, keep canopy from clipping edges
    const maxTrunkH=Math.min(H*.64, 420);
    const lSegs=[];
    let lSegsDrawOrder = null;
    let treeMaxDepth = 0;
    const trunkSpine = []; // continuous trunk path: {x,y,w}
    let trunkProg = 0;     // 0→1 smooth growth along full trunk
    let trunkReady = false;
    const sPetals=[];
    const fallingLeaves=[];
    let forestList=[], forestGoing=false, bloomGlow=0, textShown=false, lightTick=0, sPetalTick=0;
    let sinceSeedSettled = 0;
    let sinceTextShown = 0;
    let forestAge = 0;
    let sinceAllBranchesComplete = 0;
    let sinceBloomUnlocked = 0;
    let lastLyricIdx = -1;
    let lastBurstBeat = -1;
    let musicPulse = 0;
    let musicSection = 'intro';
    const lyricEl = scene4El.querySelector('.lyric-line');

    function getMusicT() {
        // null = hoa-dao.mp3 chưa kịp play (đang fade/load bài trước)
        return getTrustedMusicTime(HOA_DAO.file);
    }
    function syncHoaDaoMusic(mt) {
        const bpm = HOA_DAO.bpm;
        const beat = Math.max(0, mt - HOA_DAO.beatOffset) * (bpm / 60);
        const beatFrac = beat - Math.floor(beat);
        const barBeat = Math.floor(beat) % 4;
        const attack = musicBeatEnvelopeFrom(mt, HOA_DAO);
        const strong = barBeat === 0 ? 1.35 : (barBeat === 2 ? 1 : 0.45);
        const C = HOA_DAO.cues;
        if (mt >= C.violin) musicSection = 'violin';
        else if (mt >= (C.outroGlow || 95)) musicSection = 'outroGlow';
        else if (mt >= C.chorus2) musicSection = 'chorus2';
        else if (mt >= C.chorus) musicSection = 'chorus';
        else if (mt >= C.petalFly) musicSection = 'petalFly';
        else if (mt >= C.fullBloom) musicSection = 'fullBloom';
        else if (mt >= C.preBloom) musicSection = 'preBloom';
        else if (mt >= C.branches) musicSection = 'branches';
        else if (mt >= C.trunk) musicSection = 'trunk';
        else if (mt >= C.verse1) musicSection = 'verse';
        else musicSection = 'intro';

        const sectionMul = ({
            intro: 0.15, verse: 0.28, trunk: 0.35, branches: 0.45,
            preBloom: 0.55, fullBloom: 0.85, petalFly: 1.05,
            chorus: 1.25, chorus2: 1.35, outroGlow: 1.2, violin: 1.45
        })[musicSection] || 0.3;

        musicPulse = attack * strong * sectionMul;

        // Lyric follow vocal — hiện sớm hơn ASR (lyricLead) cho khớp miệng hát
        if (lyricEl) {
            const lead = HOA_DAO.lyricLead || 0;
            if (mt + lead < HOA_DAO.vocalAt) {
                if (lastLyricIdx !== -2) {
                    lastLyricIdx = -2;
                    lyricEl.textContent = '';
                    lyricEl.style.opacity = '0';
                }
            } else {
                let idx = -1;
                for (let i = 0; i < HOA_DAO.lyrics.length; i++) {
                    if (mt + lead >= HOA_DAO.lyrics[i].t) idx = i;
                }
                if (idx !== lastLyricIdx && idx >= 0) {
                    lastLyricIdx = idx;
                    lyricEl.textContent = HOA_DAO.lyrics[idx].text;
                    lyricEl.style.opacity = '0';
                    lyricEl.style.transform = 'translateY(6px)';
                    anime.remove(lyricEl);
                    anime({
                        targets: lyricEl,
                        opacity: [0, 1],
                        translateY: [6, 0],
                        duration: 320,
                        easing: 'easeOutQuad'
                    });
                }
            }
        }

        // Petal wind / burst chỉ sau khi hoa nở xong
        if (nightBloomMode) {
            const windBase = ({
                petalFly: 0.12, chorus: 0.14, chorus2: 0.16, outroGlow: 0.17, violin: 0.2
            })[musicSection] || 0.12;
            PETAL_SYSTEM.setWind(windBase + musicPulse * 0.06);
            // ít burst hơn — tránh lag
            const beatIdx = Math.floor(beat);
            if (musicPulse > 0.92 && barBeat === 0 && beatIdx !== lastBurstBeat && beatIdx % 2 === 0) {
                lastBurstBeat = beatIdx;
                const blooms = collectBloomOrigins();
                let bx = CX + (Math.random() - 0.5) * W * 0.18;
                let by = GROUND - maxTrunkH * (0.35 + Math.random() * 0.2);
                if (blooms.length) {
                    const src = blooms[Math.floor(Math.random() * blooms.length)];
                    bx = src.x;
                    by = src.y;
                }
                PETAL_SYSTEM.burst(bx, by, 4, 2.1);
            }
        } else {
            PETAL_SYSTEM.setWind(0.03);
        }

        return { beat, beatFrac, barBeat, sectionMul, musicPulse };
    }

    function sampleTrunk(t) {
        if (trunkSpine.length < 2) return { x: CX, y: GROUND, w: 20 };
        const u = Math.max(0, Math.min(1, t)) * (trunkSpine.length - 1);
        const i = Math.floor(u);
        const f = u - i;
        const a = trunkSpine[i];
        const b = trunkSpine[Math.min(i + 1, trunkSpine.length - 1)];
        return {
            x: lerp(a.x, b.x, f),
            y: lerp(a.y, b.y, f),
            w: lerp(a.w, b.w, f)
        };
    }

    function drawContinuousTrunk(prog) {
        if (trunkSpine.length < 2 || prog <= 0.001) return;
        const maturity = Math.min(growAge / 10, 1);
        const r = Math.round(lerp(62, 92, maturity));
        const g = Math.round(lerp(118, 58, maturity));
        const b = Math.round(lerp(72, 34, maturity));
        const steps = Math.max(8, Math.floor(trunkSpine.length * 4 * prog));
        const left = [], right = [];
        for (let i = 0; i <= steps; i++) {
            const t = (i / steps) * prog;
            const p = sampleTrunk(t);
            const p2 = sampleTrunk(Math.min(1, t + 0.01));
            const ang = Math.atan2(p2.y - p.y, p2.x - p.x);
            const half = p.w * 0.5;
            const ox = Math.sin(ang) * half;
            const oy = -Math.cos(ang) * half;
            left.push({ x: p.x - ox, y: p.y - oy });
            right.push({ x: p.x + ox, y: p.y + oy });
        }
        ctx.beginPath();
        ctx.moveTo(left[0].x, left[0].y);
        for (let i = 1; i < left.length; i++) ctx.lineTo(left[i].x, left[i].y);
        for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
        ctx.closePath();
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fill();
        // soft highlight along left bark
        ctx.beginPath();
        ctx.moveTo(left[0].x, left[0].y);
        for (let i = 1; i < left.length; i++) ctx.lineTo(left[i].x, left[i].y);
        ctx.strokeStyle = `rgba(255,220,180,${0.1 + maturity * 0.12})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
    }

    // Continuous trunk growth + recursive branches
    function buildTree(ox, oy) {
        lSegs.length = 0;
        lSegsDrawOrder = null;
        trunkSpine.length = 0;
        trunkProg = 0;
        trunkReady = true;
        // Natural S-curve trunk — fills frame without clipping
        const tH = maxTrunkH * (0.44 + Math.random() * 0.05);
        const lean = (Math.random() - 0.5) * 22;
        const trunkTop = { x: ox + lean, y: oy - tH };

        // One continuous spine (not separately animated chunks)
        const nTrunk = 18;
        const sway1 = (Math.random() - 0.5) * 18;
        const sway2 = -sway1 * (0.55 + Math.random() * 0.35) + lean * 0.35;
        for (let i = 0; i <= nTrunk; i++) {
            const t = i / nTrunk;
            const easeT = t * t * (3 - 2 * t);
            const sideSway = sway1 * Math.sin(t * Math.PI) + sway2 * Math.sin(t * Math.PI * 1.35);
            trunkSpine.push({
                x: lerp(ox, trunkTop.x, easeT) + sideSway * (1 - t * 0.25),
                y: lerp(oy, trunkTop.y, t),
                w: lerp(32, 9, Math.pow(t, 0.82))
            });
        }

        // Main branches from trunk top — organic spread
        const mainCount = 5 + Math.floor(Math.random() * 2);
        const mainAngles = [];
        const span = mainCount > 1 ? 100 / (mainCount - 1) : 0;
        for (let i = 0; i < mainCount; i++) {
            mainAngles.push(-50 + span * i + (Math.random() - 0.5) * 11);
        }

        function addBranch(sx, sy, angleDeg, len, w, depth, maxDepth) {
            if (depth > maxDepth || len < 5 || w < 0.5) return;

            const a = angleDeg * Math.PI / 180;
            // Slight upward droop for natural limbs
            const droop = depth >= 2 ? (8 + Math.random() * 10) * Math.PI / 180 : 0;
            const aUse = a + (a >= 0 ? droop : -droop) * 0.35;
            const nx = sx + Math.sin(aUse) * len;
            const ny = sy - Math.cos(aUse) * len;
            const clamped = ny;
            const curv = (Math.random() - 0.5) * len * (0.18 + Math.random() * 0.2) - Math.sin(aUse) * len * 0.08;
            const pa = aUse + Math.PI / 2;
            const cx = (sx + nx) / 2 + Math.cos(pa) * curv;
            const cy = (sy + clamped) / 2 + Math.sin(pa) * curv;

            const isTerminal = depth >= maxDepth - 1;
            const seg = {
                x1: sx, y1: sy, x2: nx, y2: clamped, cx, cy,
                w: Math.max(0.7, w),
                wTip: Math.max(0.45, w * (0.42 + Math.random() * 0.18)),
                depth, order: lSegs.length,
                prog: 0, bprog: 0,
                isLeaf: isTerminal, leaves: [], cluster: null,
                isTrunk: false
            };

            if (!isTerminal && depth >= 1) {
                const nLeaves = 2 + Math.floor(Math.random() * 3); // 2–4
                for (let j = 0; j < nLeaves; j++) {
                    const side = j % 2 === 0 ? 1 : -1;
                    seg.leaves.push({
                        t: 0.12 + j * 0.18 + Math.random() * 0.1,
                        side: side,
                        angleOffset: (Math.random() * 0.22 + 0.08) * side,
                        w: 3.8 + Math.random() * 2.4, h: 7.2 + Math.random() * 3.5,
                        prog: 0, life: 1, fallen: false,
                        fadeWhenChildGrows: true
                    });
                }
            }
            if (isTerminal) {
                const nLeaves = 4 + Math.floor(Math.random() * 4); // 4–7
                for (let j = 0; j < nLeaves; j++) {
                    const side = j % 2 === 0 ? 1 : -1;
                    seg.leaves.push({
                        t: 0.1 + j * 0.12 + Math.random() * 0.08,
                        side: side,
                        angleOffset: (Math.random() * 0.2 + 0.08) * side,
                        w: 3.2 + Math.random() * 2.2, h: 6.2 + Math.random() * 3.2,
                        prog: 0, life: 1, fallen: false,
                        fadeWhenChildGrows: false
                    });
                }
            }

            const blossomCols = ['#ffb7c5', '#ff9aad', '#ffe4e8', '#ffd6e0', '#ffccd5', '#ff8fab'];
            function scatterBlossoms(n, tMin, tMax, spread, sizeMin, sizeMax) {
                const span = (tMax - tMin) / Math.max(n, 1);
                return Array.from({ length: n }, (_, i) => {
                    const along = Math.min(tMax, tMin + span * i + Math.random() * span * 0.72);
                    const fi = i / Math.max(n - 1, 1);
                    return {
                        along,
                        dx: (Math.random() - 0.5) * (spread + fi * 5),
                        dy: (Math.random() - 0.5) * (spread + fi * 5) - fi * 1.2,
                        sz: sizeMin + Math.random() * (sizeMax - sizeMin),
                        rot: Math.random() * Math.PI * 2,
                        col: blossomCols[Math.floor(Math.random() * blossomCols.length)]
                    };
                });
            }
            if (isTerminal) {
                const n = 6 + Math.floor(Math.random() * 5); // 6–10
                seg.cluster = scatterBlossoms(n, 0.22, 0.99, 10 + Math.random() * 6, 3.2, 7.8);
            } else if (depth >= 1 && len >= 8) {
                const n = 3 + Math.floor(Math.random() * 4); // 3–6 on mid limbs
                seg.cluster = scatterBlossoms(n, 0.18, 0.95, 7 + Math.random() * 5, 2.4, 5.6);
            }

            const segIndex = lSegs.length;
            lSegs.push(seg);

            if (!isTerminal) {
                seg.childIndices = [];
                const outer = depth >= 2;
                // More tips => fuller leaves/flowers canopy
                let nChildren = outer ? (2 + Math.floor(Math.random() * 2)) : (2 + Math.floor(Math.random() * 3));
                const cap = 5;
                const maxByLen = Math.max(
                    1,
                    Math.min(cap, Math.floor((len - (outer ? 2 : 3)) / (outer ? 5.4 : 6.2)))
                );
                nChildren = Math.min(nChildren, maxByLen);
                const spreadBase = 22 + depth * 4 + Math.random() * 10;
                const spread = Math.max(12, spreadBase * (1.05 - nChildren * 0.06));
                for (let k = 0; k < nChildren; k++) {
                    let childAngle = angleDeg + (k - (nChildren - 1) / 2) * spread + (Math.random() - 0.5) * 12;
                    if (nChildren === 1) childAngle += (Math.random() - 0.5) * 16;
                    const lenScale = outer
                        ? 0.34 + Math.pow(Math.random(), 0.9) * 0.48
                        : 0.38 + Math.pow(Math.random(), 0.85) * 0.46;
                    let childLen = len * lenScale;
                    childLen = Math.max(7, childLen);
                    const childW = Math.max(0.55, w * (0.38 + lenScale * 0.24));
                    const childIdx = lSegs.length;
                    seg.childIndices.push(childIdx);
                    addBranch(nx, clamped, childAngle, childLen, childW, depth + 1, maxDepth);
                    if (lSegs[childIdx]) lSegs[childIdx].parentIndex = segIndex;
                }
            }
        }

        // Side limbs unlock when continuous trunk reaches attach height
        const sideCount = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < sideCount; i++) {
            const attachT = 0.35 + i * 0.16 + Math.random() * 0.06;
            const host = sampleTrunk(attachT);
            const side = i % 2 === 0 ? -1 : 1;
            const ang = side * (36 + Math.random() * 24) + (Math.random() - 0.5) * 9;
            const armLen = maxTrunkH * (0.13 + Math.random() * 0.08);
            const before = lSegs.length;
            addBranch(host.x, host.y, ang, armLen, Math.max(5.2, host.w * 0.42), 1, 4);
            for (let k = before; k < lSegs.length; k++) {
                if (lSegs[k].depth === 1) lSegs[k].attachT = attachT;
            }
        }

        mainAngles.forEach(ang => {
            const armLen = maxTrunkH * (0.20 + Math.pow(Math.random(), 0.8) * 0.12);
            const tip = sampleTrunk(0.98);
            const before = lSegs.length;
            addBranch(tip.x, tip.y, ang, armLen, 9.5 + Math.random() * 3, 1, 6);
            for (let k = before; k < lSegs.length; k++) {
                if (lSegs[k].depth === 1) lSegs[k].attachT = 0.92 + Math.random() * 0.06;
            }
        });

        const maxD = lSegs.length ? Math.max(...lSegs.map(s => s.depth)) : 0;
        treeMaxDepth = maxD;
        lSegs.forEach(seg => {
            // Branches wait for trunk to reach their attach point, then grow outward
            const unlock = seg.attachT != null ? seg.attachT : (0.55 + seg.depth * 0.08);
            seg.delay = 0;
            seg.unlockT = unlock;
            seg.speed = 0.55 + Math.random() * 0.25;
            seg.prog = 0;
        });
        lSegsDrawOrder = [...lSegs].sort((a, b) => b.w - a.w);
    }

    function startLTree() {
        buildTree(seed.x, GROUND);
        growPhase = 'branch';
    }

    function drawLeaf(x,y,w,h,angle,prog,alpha,life=1){
        if(prog<=0||alpha<=0)return;
        ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(prog,prog);
        ctx.globalAlpha=alpha*prog;
        
        const stemLen = h * 0.4;
        const leafH = h * 0.75;
        const leafW = w;
        
        // Colors based on life
        let stemCol, leafLight, leafMid, leafDark, veinCol;
        if(life > 0.7){
            stemCol = '#5a7a45';
            leafDark = '#2e7d32'; leafMid = '#4caf50'; leafLight = '#81c784';
            veinCol = 'rgba(30,70,30,.5)';
        } else if(life > 0.4){
            const t = (0.7 - life) / 0.3;
            stemCol = lerpColor('#5a7a45', '#8b7355', t);
            leafDark = lerpColor('#2e7d32', '#c9a227', t);
            leafMid = lerpColor('#4caf50', '#dbc247', t);
            leafLight = lerpColor('#81c784', '#f0dc82', t);
            veinCol = `rgba(${Math.round(lerp(30,140,t))},${Math.round(lerp(70,110,t))},${Math.round(lerp(30,30,t))},.5)`;
        } else {
            const t = (0.4 - life) / 0.4;
            stemCol = lerpColor('#8b7355', '#6b4423', t);
            leafDark = lerpColor('#c9a227', '#c0392b', t);
            leafMid = lerpColor('#dbc247', '#e74c3c', t);
            leafLight = lerpColor('#f0dc82', '#f1948a', t);
            veinCol = `rgba(${Math.round(lerp(140,100,t))},${Math.round(lerp(110,50,t))},30,.5)`;
        }
        
        // Stem (cuống lá)
        ctx.strokeStyle = stemCol;
        ctx.lineWidth = Math.max(1, w * 0.12);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, stemLen);
        ctx.quadraticCurveTo(w * 0.05, stemLen * 0.4, 0, -leafH * 0.1);
        ctx.stroke();
        
        // Leaf blade (phiến lá)
        const g = ctx.createRadialGradient(0, -leafH * 0.3, 0, 0, -leafH * 0.3, leafH * 0.8);
        g.addColorStop(0, leafLight);
        g.addColorStop(0.5, leafMid);
        g.addColorStop(1, leafDark);
        ctx.fillStyle = g;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        // Right side
        ctx.bezierCurveTo(leafW * 0.5, -leafH * 0.1, leafW * 0.55, -leafH * 0.4, leafW * 0.35, -leafH * 0.65);
        ctx.bezierCurveTo(leafW * 0.2, -leafH * 0.85, leafW * 0.05, -leafH * 0.95, 0, -leafH);
        // Left side
        ctx.bezierCurveTo(-leafW * 0.05, -leafH * 0.95, -leafW * 0.2, -leafH * 0.85, -leafW * 0.35, -leafH * 0.65);
        ctx.bezierCurveTo(-leafW * 0.55, -leafH * 0.4, -leafW * 0.5, -leafH * 0.1, 0, 0);
        ctx.closePath();
        ctx.fill();
        
        // Main vein (gân chính)
        ctx.strokeStyle = veinCol;
        ctx.lineWidth = Math.max(0.6, w * 0.08);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(0, -leafH * 0.5, 0, -leafH * 0.92);
        ctx.stroke();
        
        // Side veins (gân phụ)
        ctx.lineWidth = Math.max(0.4, w * 0.04);
        ctx.globalAlpha = alpha * prog * 0.6;
        for(let i = 0; i < 2; i++){
            const vy = -leafH * (0.2 + i * 0.28);
            const vw = leafW * (0.35 - i * 0.06);
            ctx.beginPath();
            ctx.moveTo(0, vy);
            ctx.quadraticCurveTo(vw * 0.6, vy - leafH * 0.08, vw, vy - leafH * 0.03);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, vy);
            ctx.quadraticCurveTo(-vw * 0.6, vy - leafH * 0.08, -vw, vy - leafH * 0.03);
            ctx.stroke();
        }
        
        // Highlight
        ctx.globalAlpha = alpha * prog * 0.25;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-leafW * 0.15, -leafH * 0.45, leafW * 0.12, leafH * 0.15, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    function lerpColor(c1,c2,t){
        const h2d=s=>parseInt(s,16);
        const r1=h2d(c1.slice(1,3)),g1=h2d(c1.slice(3,5)),b1=h2d(c1.slice(5,7));
        const r2=h2d(c2.slice(1,3)),g2=h2d(c2.slice(3,5)),b2=h2d(c2.slice(5,7));
        const r=Math.round(lerp(r1,r2,t)),g=Math.round(lerp(g1,g2,t)),b=Math.round(lerp(b1,b2,t));
        return `rgb(${r},${g},${b})`;
    }
    
    // Falling leaves system - realistic tumbling motion
    const MAX_FALLING_LEAVES = 32;
    function spawnFallingLeaf(x, y, w, h, life) {
        if (fallingLeaves.length >= MAX_FALLING_LEAVES) return;
        if (Math.random() > 0.48) return;
        fallingLeaves.push({
            x, y, w: w * (0.9 + Math.random() * 0.3), h: h * (0.9 + Math.random() * 0.3),
            life: life + Math.random() * 0.2,
            vx: (Math.random() - 0.3) * 0.5,
            vy: Math.random() * 0.3 + 0.2,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.04,
            tumblePhase: Math.random() * Math.PI * 2,
            tumbleSpeed: Math.random() * 2 + 1.5,
            swayAmp: Math.random() * 1.5 + 1,
            swayFreq: Math.random() * 0.8 + 0.6,
            scaleX: 1,
            flutter: Math.random() * 0.5 + 0.3
        });
    }
    function updateFallingLeaves(dt) {
        if (dt <= 0) return;
        for (let i = fallingLeaves.length - 1; i >= 0; i--) {
            const l = fallingLeaves[i];
            l.tumblePhase += l.tumbleSpeed * dt;
            const sway = Math.sin(elapsed * l.swayFreq + l.tumblePhase) * l.swayAmp;
            l.vx *= 0.98;
            l.x += l.vx + sway * dt * 2;
            l.vy = Math.min(l.vy + dt * 7.5, 1.85);
            l.y += l.vy + Math.abs(Math.sin(l.tumblePhase)) * l.flutter;
            l.rot += l.rotSpeed + Math.cos(l.tumblePhase) * 0.03;
            // Scale X for 3D tumbling effect
            l.scaleX = 0.3 + Math.abs(Math.cos(l.tumblePhase * 0.7)) * 0.7;
            // Chỉ mờ gần đáy khung
            if (l.y > H * 0.9) l.life -= dt * 0.4;
            if (l.y > H + 48 || l.life <= 0 || l.x < -50 || l.x > W + 50) fallingLeaves.splice(i, 1);
        }
    }
    function drawFallingLeaves() {
        fallingLeaves.forEach(l => {
            ctx.save();
            ctx.translate(l.x, l.y);
            ctx.rotate(l.rot);
            ctx.scale(l.scaleX, 1);
            ctx.translate(-l.x, -l.y);
            const alpha = Math.max(0, l.life) * 0.85;
            drawLeaf(l.x, l.y, l.w, l.h, 0, 1, alpha, Math.min(l.life + 0.1, 0.35));
            ctx.restore();
        });
    }

    function blossom(x,y,sz,prog,col,rot){
        if(prog<=0)return;
        ctx.save();ctx.translate(x,y);ctx.rotate(rot);
        
        const inner=col==='#ff9aad'?'#ff6b8f':'#ffaec0';
        const outer=col==='#ff9aad'?'#ffd6e0':'#fff5f8';

        // Nụ lâu — cánh chỉ mở khi prog cao (khớp nở chậm 45→62.5)
        const wDot = (1 - smoothstep(0.12, 0.32, prog)) * Math.min(1, prog / 0.08);
        const wBud = smoothstep(0.08, 0.28, prog) * (1 - smoothstep(0.62, 0.82, prog));
        const wBloom = smoothstep(0.68, 0.88, prog);

        if (wDot > 0.008) {
            ctx.globalAlpha = wDot * 0.9;
            ctx.fillStyle = '#4a7c30';
            ctx.beginPath();
            ctx.arc(0, 0, sz * 0.15 * Math.min(1, prog / 0.12 + 0.02), 0, Math.PI * 2);
            ctx.fill();
        }

        if (wBud > 0.008) {
            const budProg = Math.max(0, Math.min(1, (prog - 0.08) / 0.5));
            ctx.globalAlpha = wBud * 0.9;
            ctx.fillStyle = `rgb(${Math.round(74 + (200-74)*budProg)},${Math.round(124 + (140-124)*budProg)},${Math.round(48 + (180-48)*budProg)})`;
            const budH = sz * (0.3 + budProg * 0.4);
            const budW = sz * (0.15 + budProg * 0.2);
            ctx.beginPath();
            ctx.moveTo(0, budH * 0.3);
            ctx.bezierCurveTo(budW, budH * 0.2, budW * 1.1, -budH * 0.3, 0, -budH * 0.7);
            ctx.bezierCurveTo(-budW * 1.1, -budH * 0.3, -budW, budH * 0.2, 0, budH * 0.3);
            ctx.fill();
            if (budProg > 0.45) {
                ctx.globalAlpha = wBud * (budProg - 0.45) * 1.35;
                ctx.fillStyle = col;
                ctx.beginPath();
                ctx.arc(0, -budH * 0.4, budW * 0.55 * Math.min(1, (budProg - 0.45) * 2.2), 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (wBloom > 0.008) {
            const bloomProg = Math.max(0, Math.min(1, (prog - 0.68) / 0.32));
            const petalOpen = Math.min(bloomProg * 1.05, 1);
            const nPetals = sz < 4.2 ? 4 : 5;
            const petalStep = (Math.PI * 2) / nPetals;
            for(let i=0;i<nPetals;i++){
                ctx.save();
                ctx.rotate(i * petalStep);
                const petalScale = 0.28 + petalOpen * 0.72;
                ctx.scale(petalScale, petalScale);
                ctx.globalAlpha = wBloom * (0.5 + petalOpen * 0.5) * 0.9;
                const pg=ctx.createLinearGradient(0,0,0,sz*1.05);
                pg.addColorStop(0,inner);pg.addColorStop(.45,col);pg.addColorStop(1,outer);
                ctx.fillStyle=pg;
                ctx.beginPath();ctx.moveTo(0,0);
                ctx.bezierCurveTo(sz*.52,sz*.1,sz*.62,sz*.62,sz*.32,sz*.86);
                ctx.bezierCurveTo(sz*.18,sz*.96,sz*.06,sz*1.04,0,sz*.96);
                ctx.bezierCurveTo(-sz*.06,sz*1.04,-sz*.18,sz*.96,-sz*.32,sz*.86);
                ctx.bezierCurveTo(-sz*.62,sz*.62,-sz*.52,sz*.1,0,0);
                ctx.closePath();ctx.fill();
                ctx.restore();
            }
            if (bloomProg > 0.22) {
                ctx.globalAlpha = wBloom * Math.min(1, (bloomProg - 0.22) / 0.78);
                ctx.fillStyle='rgba(255,235,80,.9)';
                ctx.beginPath();
                ctx.arc(0, 0, sz * 0.2 * Math.min(1, bloomProg), 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.shadowBlur=0;
        ctx.restore();
    }

    function bakeTreeCache() {
        treeCacheCtx.clearRect(0, 0, treeCache.width, treeCache.height);
        ctx = treeCacheCtx;
        // Không bake rừng phụ — vẽ live để lá/hoa còn animate
        drawBloomGlow();
        if (trunkReady) drawContinuousTrunk(1);
        drawLTree();
        ctx = mainCtx;
        treeCacheValid = true;
        treeFrozen = true;
    }

    function drawTaperedLimb(x1, y1, cx, cy, x2, y2, tGrow, wBase, wTip, fillStyle, highlight) {
        const steps = 6;
        const left = [], right = [];
        for (let i = 0; i <= steps; i++) {
            const u = (i / steps) * tGrow;
            const p = qbez(x1, y1, cx, cy, x2, y2, u);
            const u2 = Math.min(1, u + 0.02);
            const p2 = qbez(x1, y1, cx, cy, x2, y2, u2);
            const ang = Math.atan2(p2.y - p.y, p2.x - p.x);
            const half = lerp(wBase, wTip, u) * 0.5;
            const px = Math.sin(ang) * half;
            const py = -Math.cos(ang) * half;
            left.push({ x: p.x - px, y: p.y - py });
            right.push({ x: p.x + px, y: p.y + py });
        }
        ctx.beginPath();
        ctx.moveTo(left[0].x, left[0].y);
        for (let i = 1; i < left.length; i++) ctx.lineTo(left[i].x, left[i].y);
        for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
        ctx.closePath();
        ctx.fillStyle = fillStyle;
        ctx.fill();
        if (highlight && wBase > 8) {
            ctx.beginPath();
            ctx.moveTo(left[0].x, left[0].y);
            for (let i = 1; i < left.length; i++) ctx.lineTo(left[i].x, left[i].y);
            ctx.strokeStyle = highlight;
            ctx.lineWidth = 1.2;
            ctx.stroke();
        }
    }

    // Draw L-system segments (all in one function — trunk + branches unified)
    function drawLTree() {
        if (lSegs.length === 0 || !lSegsDrawOrder) return;
        const sorted = lSegsDrawOrder;
        const maxD = treeMaxDepth;

        sorted.forEach(seg => {
            if (seg.prog <= 0) return;
            const t = seg.prog;

            // Không lay theo gió — đường cong cố định
            const q0x = seg.x1 + (seg.cx - seg.x1) * t;
            const q0y = seg.y1 + (seg.cy - seg.y1) * t;
            const q1x = seg.cx + (seg.x2 - seg.cx) * t;
            const q1y = seg.cy + (seg.y2 - seg.cy) * t;
            const ex = q0x + (q1x - q0x) * t;
            const ey = q0y + (q1y - q0y) * t;

            // Maturity: young green sapling → mature brown tree
            const maturity = Math.min(growAge / 10, 1);
            const depthRatio = seg.depth / Math.max(maxD, 1);
            // Trunk (depth 0) matures faster, branches stay greener longer
            const segMaturity = Math.min(1, maturity * (1.5 - depthRatio * 0.8));
            
            // Young: soft olive | Mature: warm bark brown (more natural wood)
            const youngR = 62, youngG = 118, youngB = 72;
            const matureR = 92, matureG = 58, matureB = 34;
            const r = Math.round(lerp(youngR, matureR, segMaturity));
            const g = Math.round(lerp(youngG, matureG, segMaturity));
            const b = Math.round(lerp(youngB, matureB, segMaturity));
            const tipW = seg.wTip != null ? seg.wTip : Math.max(0.6, seg.w * 0.55);
            const fill = `rgb(${r},${g},${b})`;
            const hi = seg.depth <= 1 ? `rgba(255,220,180,${0.12 + segMaturity * 0.1})` : null;

            if (seg.depth <= 2 || seg.isTrunk) {
                drawTaperedLimb(seg.x1, seg.y1, seg.cx, seg.cy, seg.x2, seg.y2, t, seg.w, tipW, fill, hi);
            } else {
                ctx.lineWidth = seg.w + (tipW - seg.w) * t;
                ctx.strokeStyle = fill;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.quadraticCurveTo(q0x, q0y, ex, ey);
            ctx.stroke();
            }

            if (seg.isTrunk && seg.w > 12 && segMaturity > 0.45) {
                const barkAlpha = (segMaturity - 0.45) * 0.4;
                ctx.strokeStyle = `rgba(40,24,14,${barkAlpha})`;
                ctx.lineWidth = 1;
                const ang = Math.atan2(ey - seg.y1, ex - seg.x1);
                const perpX = Math.sin(ang) * seg.w * 0.18;
                const perpY = -Math.cos(ang) * seg.w * 0.18;
                    ctx.beginPath();
                    ctx.moveTo(seg.x1 + perpX, seg.y1 + perpY);
                ctx.quadraticCurveTo(q0x + perpX * 0.7, q0y + perpY * 0.7, ex + perpX * 0.35, ey + perpY * 0.35);
                    ctx.stroke();
            }

            if (seg.cluster && seg.bprog > 0) {
                seg.cluster.forEach(bl => {
                    const u = bl.along != null ? bl.along : 1;
                    if (seg.prog < u) return;
                    const bp = qbez(seg.x1, seg.y1, seg.cx, seg.cy, seg.x2, seg.y2, u);
                    blossom(bp.x + bl.dx, bp.y + bl.dy, bl.sz, seg.bprog, bl.col, bl.rot);
                });
            }

            seg.leaves.forEach(l => {
                if (l.fallen) return;
                if (seg.prog < 0.88) return;
                if (l.prog < 1) l.prog = Math.min(l.prog + 0.06, 1);
                // Cache world pose once leaf & branch are stable (avoid qbez every frame)
                if (l.prog >= 1 && seg.prog >= 1 && l._wx == null) {
                    const lp = qbez(seg.x1, seg.y1, seg.cx, seg.cy, seg.x2, seg.y2, l.t);
                    const lp1 = qbez(seg.x1, seg.y1, seg.cx, seg.cy, seg.x2, seg.y2, Math.max(0, l.t - 0.01));
                    const lp2 = qbez(seg.x1, seg.y1, seg.cx, seg.cy, seg.x2, seg.y2, Math.min(1, l.t + 0.01));
                    const branchAngle = Math.atan2(lp2.y - lp1.y, lp2.x - lp1.x);
                    l._wx = lp.x; l._wy = lp.y;
                    l._ang = branchAngle + (Math.PI / 2) * l.side + l.angleOffset;
                }
                let childGrowing = false;
                if (l.fadeWhenChildGrows && seg.childIndices) {
                    for (const ci of seg.childIndices) {
                        if (lSegs[ci] && lSegs[ci].prog > 0.72) {
                            childGrowing = true;
                            break;
                        }
                    }
                }
                if (childGrowing && l.prog > 0.35) {
                    l.life -= 0.009;
                    l._wx = null;
                    if (l.life <= 0) {
                        l.fallen = true;
                        const lp0 = qbez(seg.x1, seg.y1, seg.cx, seg.cy, seg.x2, seg.y2, l.t);
                        spawnFallingLeaf(lp0.x, lp0.y, l.w, l.h, l.life + 0.3);
                        return;
                    }
                }
                let lx, ly, leafAngle;
                if (l._wx != null) {
                    lx = l._wx; ly = l._wy; leafAngle = l._ang;
                } else {
                const lp = qbez(seg.x1, seg.y1, seg.cx, seg.cy, seg.x2, seg.y2, l.t);
                    const lp1 = qbez(seg.x1, seg.y1, seg.cx, seg.cy, seg.x2, seg.y2, Math.max(0, l.t - 0.01));
                    const lp2 = qbez(seg.x1, seg.y1, seg.cx, seg.cy, seg.x2, seg.y2, Math.min(1, l.t + 0.01));
                    lx = lp.x; ly = lp.y;
                    leafAngle = Math.atan2(lp2.y - lp1.y, lp2.x - lp1.x) + (Math.PI / 2) * l.side + l.angleOffset;
                }
                drawLeaf(lx, ly, l.w * 1.05, l.h * 1.05, leafAngle, l.prog, l.life * 0.92, l.life);
            });
        });

        let bloomAcc = 0, bloomN = 0;
        for (let i = 0, n = lSegs.length; i < n; i++) {
            const s = lSegs[i];
            if (s.cluster) { bloomAcc += s.bprog; bloomN++; }
        }
        bloomGlow = bloomN ? bloomAcc / bloomN : 0;
    }

    function drawBloomGlow(){if(bloomGlow<=0)return;const gy=GROUND-maxTrunkH*.5;
        const g1=ctx.createRadialGradient(CX,gy,0,CX,gy,maxTrunkH);
        g1.addColorStop(0,`rgba(255,155,185,${bloomGlow*.14})`);g1.addColorStop(.5,`rgba(255,95,145,${bloomGlow*.06})`);g1.addColorStop(1,'rgba(255,95,145,0)');
        ctx.fillStyle=g1;ctx.fillRect(0,0,W,H);}

    // Cây đào phụ: thiết lập cũ (tỉ lệ/màu), chỉ cành + hoa — không lá; spawn sau cây chính nở xong
    function startForest(){
        const spots = [
            { x: CX - W * 0.42, sc: 0.30, fade: 0.36 },
            { x: CX - W * 0.32, sc: 0.38, fade: 0.42 },
            { x: CX - W * 0.22, sc: 0.28, fade: 0.34 },
            { x: CX + W * 0.23, sc: 0.30, fade: 0.36 },
            { x: CX + W * 0.30, sc: 0.40, fade: 0.45 },
            { x: CX + W * 0.40, sc: 0.32, fade: 0.38 },
            { x: CX - W * 0.50, sc: 0.24, fade: 0.28 },
            { x: CX + W * 0.50, sc: 0.25, fade: 0.30 },
            { x: CX - W * 0.14, sc: 0.22, fade: 0.26 },
            { x: CX + W * 0.15, sc: 0.22, fade: 0.26 }
        ];
        spots.forEach((sp, si) => {
            if (Math.abs(sp.x - CX) < W * 0.10 && sp.sc > 0.26) return;
            const ft = { del: si * 0.22, branches: [], maxAlpha: sp.fade, alpha: 0, scale: sp.sc };
            const h2 = H * 0.5 * sp.sc;
            (function af(x1, y1, ang, len, w, dep) {
                if (dep < 0 || len < 4) return;
                const x2 = x1 + Math.sin(ang) * len, y2 = y1 - Math.cos(ang) * len;
                const cr2 = (len * 0.1) * (Math.random() > 0.5 ? 1 : -1), pa2 = ang + Math.PI * 0.5;
                ft.branches.push({
                    x1, y1, x2, y2,
                    cx: (x1 + x2) * 0.5 + Math.cos(pa2) * cr2,
                    cy: (y1 + y2) * 0.5 + Math.sin(pa2) * cr2,
                    w, dep, prog: 0, speed: 1.5, bprog: 0, isLeaf: dep === 0,
                    cluster: dep === 0 ? Array.from({ length: 1 + Math.floor(Math.pow(Math.random(), 1.2) * 2) }, () => ({
                        dx: (Math.random() - 0.5) * 8 * sp.sc,
                        dy: (Math.random() - 0.5) * 8 * sp.sc,
                        sz: (2.5 + Math.random() * 2.5) * sp.sc,
                        rot: Math.random() * Math.PI * 2,
                        col: Math.random() > 0.35 ? '#ffb7c5' : '#ffe4e8'
                    })) : null
                });
                if (dep > 0) {
                    const s2 = 0.5 + Math.random() * 0.2, cl2 = len * (0.6 + Math.random() * 0.1);
                    af(x2, y2, ang - s2, cl2, w * 0.6, dep - 1);
                    af(x2, y2, ang + s2, cl2, w * 0.6, dep - 1);
                }
            })(sp.x, GROUND, 0, h2 * 0.35, 6 * sp.sc, 2);
            forestList.push(ft);
        });
        forestList.sort((a, b) => a.scale - b.scale);
        forestGoing = true;
        forestAge = 0;
    }
    function drawForest(){
        forestList.forEach(ft=>{
            if(ft.alpha<=0)return;
            ctx.save();
            ctx.globalAlpha=ft.alpha;
            ft.branches.forEach(b=>{if(b.prog<=0)return;const t=b.prog;
                const q0=b.x1+(b.cx-b.x1)*t,q1=b.y1+(b.cy-b.y1)*t,q2=b.cx+(b.x2-b.cx)*t,q3=b.cy+(b.y2-b.cy)*t;
                const ex=q0+(q2-q0)*t,ey=q1+(q3-q1)*t;
                const sat = 22 + ft.scale * 14;
                const light = 46 + (3-b.dep)*9 + (1-ft.scale)*14;
                ctx.strokeStyle=`hsl(285,${sat}%,${Math.min(light,62)}%)`;
                ctx.lineWidth=Math.max(0.8,b.w);ctx.lineCap='round';
                ctx.beginPath();ctx.moveTo(b.x1,b.y1);ctx.quadraticCurveTo(q0,q1,ex,ey);ctx.stroke();
                if(b.isLeaf&&b.bprog>0&&b.cluster){
                    b.cluster.forEach(bl=>{
                        ctx.save();
                        ctx.globalAlpha=ft.alpha*b.bprog*(0.75+ft.scale*0.35);
                        blossom(ex+bl.dx,ey+bl.dy,bl.sz,b.bprog,bl.col,bl.rot);
                        ctx.restore();
                    });
                }
            });
            ctx.restore();
        });
    }

    // Falling petals from the cherry canopy
    const FP_COLORS = [
        ['#ff9aad', '#ffccd5', '#fff5f8'],
        ['#ff8fab', '#ffb7c5', '#ffe4e8'],
        ['#ffa0b4', '#ffd6e0', '#ffffff']
    ];
    // Lấy đúng toạ độ bông trên cây chính + cây phụ
    function collectBloomOrigins() {
        const pts = [];
        for (let i = 0; i < lSegs.length; i++) {
            const seg = lSegs[i];
            if (!seg.cluster || seg.bprog < 0.45 || seg.prog < 0.35) continue;
            for (let j = 0; j < seg.cluster.length; j++) {
                const bl = seg.cluster[j];
                const u = bl.along != null ? bl.along : 1;
                if (seg.prog < u * 0.92) continue;
                const bp = qbez(seg.x1, seg.y1, seg.cx, seg.cy, seg.x2, seg.y2, u);
                pts.push({ x: bp.x + bl.dx, y: bp.y + bl.dy, sz: bl.sz || 4 });
            }
        }
        for (let fi = 0; fi < forestList.length; fi++) {
            const ft = forestList[fi];
            if (!ft || ft.alpha <= 0.05) continue;
            for (let bi = 0; bi < ft.branches.length; bi++) {
                const b = ft.branches[bi];
                if (!b.isLeaf || !b.cluster || b.bprog < 0.45 || b.prog < 0.5) continue;
                const t = b.prog;
                const q0x = b.x1 + (b.cx - b.x1) * t, q0y = b.y1 + (b.cy - b.y1) * t;
                const q2x = b.cx + (b.x2 - b.cx) * t, q2y = b.cy + (b.y2 - b.cy) * t;
                const ex = q0x + (q2x - q0x) * t, ey = q0y + (q2y - q0y) * t;
                for (let j = 0; j < b.cluster.length; j++) {
                    const bl = b.cluster[j];
                    pts.push({ x: ex + bl.dx, y: ey + bl.dy, sz: bl.sz || 3 });
                }
            }
        }
        return pts;
    }
    function updateFP(dt, beatInfo){
        // Hoa bay chỉ sau khi toàn bộ hoa đã nở xong
        if (!nightBloomMode) {
            sPetals.length = 0;
            return;
        }
        const pulse = beatInfo ? beatInfo.musicPulse : 0;
        const sectionMul = beatInfo ? beatInfo.sectionMul : 0.4;
        {
            sPetalTick += dt;
            const spawnEvery = Math.max(0.05, 0.12 - sectionMul * 0.04 - pulse * 0.025);
            if (sPetalTick > spawnEvery) {
                let nAdd = Math.round(1 + sectionMul * 0.9 + pulse * 0.8);
                if (musicSection === 'outroGlow' || musicSection === 'violin') nAdd += 1;
                const blooms = collectBloomOrigins();
                for (let i = 0; i < nAdd; i++) {
                    let ox, oy, baseSz;
                    if (blooms.length) {
                        const src = blooms[Math.floor(Math.random() * blooms.length)];
                        ox = src.x + (Math.random() - 0.5) * 6;
                        oy = src.y + (Math.random() - 0.5) * 5;
                        baseSz = Math.max(3.2, src.sz * (0.85 + Math.random() * 0.45));
                    } else {
                        // fallback nếu chưa có cluster
                        ox = CX + (Math.random() - 0.5) * W * 0.2;
                        oy = GROUND - maxTrunkH * (0.35 + Math.random() * 0.2);
                        baseSz = 4 + Math.random() * 4;
                    }
                    const sz = baseSz * (0.9 + pulse * 0.2);
                    const kick = pulse > 0.7 ? (0.35 + pulse * 0.55) : 0;
                    sPetals.push({
                        x: ox,
                        y: oy,
                        vx: (Math.random() - 0.5) * 0.45 + (Math.random() - 0.5) * kick,
                        vy: Math.random() * 0.28 + 0.12 + kick * 0.12,
                        rot: Math.random() * Math.PI * 2,
                        rs: (Math.random() - 0.5) * 0.045,
                        w: sz * (0.5 + Math.random() * 0.2),
                        h: sz * (0.85 + Math.random() * 0.25),
                        alpha: 0.5 + Math.random() * 0.4,
                        life: 1,
                        swayPh: Math.random() * Math.PI * 2,
                        swaySpd: 0.8 + Math.random() * 1.6,
                        swayAmp: 0.55 + Math.random() * 1.0 + pulse * 0.45,
                        tumble: Math.random() * Math.PI * 2,
                        tumbleSpd: 1.4 + Math.random() * 2.4 + pulse,
                        flutter: 0.3 + Math.random() * 0.5,
                        colors: FP_COLORS[Math.floor(Math.random() * FP_COLORS.length)]
                    });
                }
                sPetalTick = 0;
            }
        }
        for (let i = sPetals.length - 1; i >= 0; i--) {
            const p = sPetals[i];
            p.tumble += p.tumbleSpd * dt;
            const sway = Math.sin(elapsed * p.swaySpd + p.swayPh) * p.swayAmp;
            const lift = Math.sin(p.tumble * 0.65) * p.flutter * 0.4;
            p.vx *= 0.992;
            p.x += (p.vx + sway * 0.5 + Math.cos(p.tumble) * 0.22) * (dt * 60);
            // Rơi chậm hơn một chút để đường bay dài tới đáy khung
            p.vy = Math.min(p.vy + dt * 0.16, 1.15);
            p.y += (p.vy + lift) * (dt * 60);
            p.rot += p.rs + Math.cos(p.tumble) * 0.015;
            // Chỉ mờ khi gần cuối khung hình — không tắt sớm ở GROUND
            if (p.y > H * 0.9) p.life -= dt * 0.35;
            if (p.y > H + 48 || p.life <= 0 || p.x < -60 || p.x > W + 60) sPetals.splice(i, 1);
        }
        const maxP = musicSection === 'violin' || musicSection === 'outroGlow' ? 70 : 55;
        if (sPetals.length > maxP) sPetals.splice(0, sPetals.length - maxP);
    }
    function drawFP(){
        for (let i = 0; i < sPetals.length; i++) {
            const p = sPetals[i];
            const flip = 0.2 + Math.abs(Math.cos(p.tumble)) * 0.8;
            const a = Math.max(0, p.alpha * p.life);
            if (a < 0.02) continue;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.scale(flip, 1);
            const [c0, c1, c2] = p.colors;
            const g = ctx.createLinearGradient(0, -p.h * 0.5, 0, p.h * 0.5);
            g.addColorStop(0, c0);
            g.addColorStop(0.5, c1);
            g.addColorStop(1, c2);
            ctx.globalAlpha = a;
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(0, p.h * 0.5);
            ctx.bezierCurveTo( p.w * 0.58,  p.h * 0.2,  p.w * 0.65, -p.h * 0.15, 0, -p.h * 0.52);
            ctx.bezierCurveTo(-p.w * 0.65, -p.h * 0.15, -p.w * 0.58,  p.h * 0.2, 0,  p.h * 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = a * 0.35;
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.beginPath();
            ctx.ellipse(-p.w * 0.12, -p.h * 0.06, p.w * 0.15, p.h * 0.2, -0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.globalAlpha = 1;
    }

    // ============ MAIN LOOP ============
    function loop(ts){
        if(!running)return;
        if (isExperiencePaused()) {
            lastTs = ts;
            requestAnimationFrame(loop);
            return;
        }
        const dtRaw = Math.min((ts - lastTs) / 1000, 0.05);
        lastTs = ts;
        const mt = getMusicT();
        const C = HOA_DAO.cues;

        // Chờ nhạc nền hoa-dao thật sự bắt đầu — không chạy hạt/cây/lời trước
        if (mt == null) {
            ctx.clearRect(0, 0, W, H);
            drawAtmo(0, dtRaw);
            if (lyricEl) lyricEl.style.opacity = '0';
            requestAnimationFrame(loop);
            return;
        }

        const dt = dtRaw;
        elapsed += dtRaw;
        const beatInfo = syncHoaDaoMusic(mt);
        // Pause / hết nhạc → không giữ pulse “đập” giả
        if (!isSceneMusicLive(HOA_DAO.file)) musicPulse = 0;

        const allBranchesComplete = trunkProg >= 0.98 && lSegs.length > 0 && lSegs.every(s => s.prog >= 1);
        if (allBranchesComplete) sinceAllBranchesComplete += dtRaw;
        else sinceAllBranchesComplete = 0;
        // Bloom unlocks with song (pre-chorus) or when canopy finished settling
        const bloomUnlocked = mt >= C.preBloom || (allBranchesComplete && sinceAllBranchesComplete >= 0.6);
        if (bloomUnlocked) sinceBloomUnlocked += dtRaw;
        else sinceBloomUnlocked = 0;

        starTw += dt * 0.92;
        updateSeedBokeh(dt);
        ctx.clearRect(0, 0, W, H);
        const cam = sampleCam(mt);
        beginCam(cam);
        drawAtmo(dt, dtRaw);

        // Seed physics (lands into verse) — only after music started
        if(seed.state==='fall'||seed.state==='bounce'){
            seed.alpha=Math.min(seed.alpha+dt*2.6,1);seed.vy+=960*dt;seed.y+=seed.vy*dt;seed.x+=seed.vx;seed.rot+=seed.rspd;
            if(seed.y>=GROUND){seed.y=GROUND;addImpact(seed.x,GROUND);seed.vy*=-.43;seed.bounces++;
                seed.rspd*=.52;seed.sy=.52+.1*seed.bounces;seed.sx=1.65-.15*seed.bounces;seed.state='bounce';
                if(Math.abs(seed.vy)<22||seed.bounces>=5){
                    seed.state='settled';seed.vy=0;seed.vx=0;seed.rspd=0;growPhase='grow';
                    sinceSeedSettled = 0;
                }
            }
        }else if(seed.state==='settled'){
            sinceSeedSettled += dtRaw;
            seed.sy+=(1-seed.sy)*.11;seed.sx+=(1-seed.sx)*.11;
        }
        if(seed.state==='bounce'&&seed.y<GROUND){seed.sy+=(1-seed.sy)*.22;seed.sx+=(1-seed.sx)*.22;}

        // Growth locked to Hoa Đào timeline
        if (growPhase === 'grow') {
            growAge += dt;
            seed.alpha = Math.max(seed.alpha - dt * 0.12, 0);
            if (!useCssTree && (growAge > 0.9 || mt >= C.trunk - 2)) startLTree();
        }
        if (growPhase === 'branch' && !useCssTree) {
            growAge += dt;
            seed.alpha = Math.max(seed.alpha - dt * 0.06, 0);
            // Trunk: continuous rise through verse → ready before branches peak
            if (trunkReady) {
                const wantTrunk = smoothstep(C.trunk, C.branches + 4, mt);
                trunkProg = Math.min(1, Math.max(trunkProg, wantTrunk));
            }
            // Cành sẵn trước 45 để nụ hiện được trên tán
            const branchBoost = 1.25 + smoothstep(C.trunk, Math.min(C.preBloom - 3, 42), mt) * 2.4;
            lSegs.forEach(seg => {
                if (seg.depth <= 1) {
                    const need = seg.unlockT != null ? seg.unlockT : 0.9;
                    if (trunkProg < need) return;
                } else if (seg.parentIndex != null) {
                    const parent = lSegs[seg.parentIndex];
                    if (!parent || parent.prog < 0.48) return;
                } else if (trunkProg < 0.95) {
                    return;
                }
                if (seg.prog < 1) {
                    seg.prog = Math.min(seg.prog + seg.speed * dt * branchBoost, 1);
                    if (seg.prog > 0.998) seg.prog = 1;
                }
            });
        }
        // 45→62.5: nụ rõ từ đầu, nở rất chậm (ease-in), full đúng 62.5
        if (!useCssTree && bloomUnlocked) {
            const span = Math.max(0.01, C.fullBloom - C.preBloom);
            lSegs.forEach(seg => {
                if (!seg.cluster) return;
                const lag = ((seg.order % 13) / 13) * 1.2; // lệch nhẹ vài giây, vẫn chậm
                const t = Math.max(0, Math.min(1, (mt - C.preBloom - lag) / span));
                // ^2.6: phần lớn thời gian vẫn là nụ, cánh mở gần cuối
                seg.bprog = 0.24 + 0.76 * Math.pow(t, 2.6);
            });
        }

        // Đom đóm chạy từ đầu; 53.48 chỉ bật hoa bay + đêm nhẹ
        updateNightFireflies(dt);
        if (!nightBloomMode && mt >= C.petalFly) {
            nightBloomMode = true;
            const blooms = collectBloomOrigins();
            if (blooms.length) {
                for (let k = 0; k < Math.min(4, blooms.length); k++) {
                    const src = blooms[Math.floor(Math.random() * blooms.length)];
                    PETAL_SYSTEM.burst(src.x, src.y, 3, 2.2);
                }
            } else {
                PETAL_SYSTEM.burst(CX, GROUND - maxTrunkH * 0.4, 8, 2.4);
            }
            scene4El.classList.add('tree-bloomed');
        }
        // Poem "Hoa đào…": hiện trước lyric đầu ~1s
        {
            const firstLyricT = (HOA_DAO.lyrics[0] && HOA_DAO.lyrics[0].t) || HOA_DAO.vocalAt;
            const lyricLead = HOA_DAO.lyricLead || 0;
            // Lyric lên màn khi mt + lead >= firstLyricT → poem sớm hơn 1s
            const poemAt = firstLyricT - lyricLead - 1;
            if (!textShown && mt >= poemAt) {
                textShown = true;
                document.querySelectorAll('#scene-5 .seed-line, #scene-5 .seed-sub').forEach(el => {
                    el.style.opacity = '';
                    el.style.transform = '';
                    el.style.filter = '';
                });
                anime.timeline({ easing: 'easeOutExpo' })
                    .add({
                        targets: '#scene-5 .seed-line',
                        opacity: [0, 1],
                        translateY: [20, 0],
                        filter: ['blur(10px)', 'blur(0px)'],
                        duration: 1300
                    })
                    .add({
                        targets: '#scene-5 .seed-sub',
                        opacity: [0, 1],
                        translateY: [14, 0],
                        duration: 900
                    }, '-=400');
            }
        }

        // Cây phụ (không lá) — hiện sau khi cây chính nở full (~45.76)
        if (!useCssTree && !forestGoing && mt >= C.fullBloom && bloomGlow >= 0.85) {
            startForest();
        }

        const forestDt = dt;
        if (!useCssTree && forestGoing) {
            forestAge += forestDt;
            const fBloom = smoothstep(0.8, 3.2, forestAge);
            forestList.forEach(ft => {
                if (ft.del > 0) { ft.del -= forestDt; return; }
                ft.alpha = Math.min(ft.alpha + forestDt * 0.4, ft.maxAlpha || 0.6);
                ft.branches.forEach(b => {
                    b.prog = Math.min(b.prog + b.speed * forestDt * (0.9 + beatInfo.sectionMul * 0.35), 1);
                    if (b.isLeaf && b.prog >= 1) {
                        const step = 0.05 * forestDt;
                        if (b.bprog < fBloom) b.bprog = Math.min(fBloom, b.bprog + step);
                    }
                });
            });
        }

        updateLights(dt);
        if (!useCssTree) {
            updateFP(dt, beatInfo);
        updateFallingLeaves(dt);
        }

        if(seed.alpha>0)drawOneSeed();
        drawImpacts(dt);
        if (!useCssTree) {
            // Bake chỉ khi nở gần full thật (tránh “load” ảnh hoa full đột ngột)
            const canopyReady = trunkProg >= 0.995 && allBranchesComplete && bloomGlow >= 0.98;
            if (canopyReady && !treeFrozen) {
                bakeCooldown += dt;
                if (bakeCooldown > 0.6) bakeTreeCache();
            }
            // Rừng phụ vẽ live phía sau cây chính (không bake, không lá)
            if (forestGoing) drawForest();
            if (treeFrozen && treeCacheValid) {
                mainCtx.drawImage(treeCache, 0, 0);
            } else {
                drawBloomGlow();
                if (trunkReady) drawContinuousTrunk(trunkProg);
                drawLTree();
            }
            drawNightFireflies();
            drawFallingLeaves();
            drawFP();
        }
        drawLights();
        endCam();

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    PETAL_SYSTEM.setWind(0.05);
    const si4 = current;
    cleanups[si4] = () => {
        running = false;
        ctx = mainCtx;
        mainCtx.clearRect(0, 0, W, H);
        PETAL_SYSTEM.setWind(0.1);
        scene4El.classList.remove('tree-growing', 'tree-bloomed');
        treeFrozen = false;
        treeCacheValid = false;
        lastLyricIdx = -1;
        nightBloomMode = false;
        nightFlies.length = 0;
        PETAL_SYSTEM.setWind(0.1);
    };
}


// ===== SCENE 6: HOA LÁ (flowers) + Quá Thích Cậu Rồi lyrics/sway/moments =====
function enterFlowers() {
    const scene = document.getElementById('scene-6');
    const ACTS = ['fl-act-verse', 'fl-act-pre', 'fl-act-chorus', 'fl-act-rap', 'fl-act-bridge', 'fl-act-finale', 'fl-act-outro'];
    scene.classList.remove('fl-active', 'fl-music', 'fl-heart-on', ...ACTS, 'fl-mood-shy', 'fl-mood-longing', 'fl-mood-afraid', 'fl-mood-confess', 'fl-mood-tender');
    scene.style.removeProperty('--sway');
    scene.style.removeProperty('--leaf-sway');
    scene.style.removeProperty('--grass-sway');
    scene.style.removeProperty('--pulse');
    scene.style.removeProperty('--beat-rate');
    // Nạp beat + strength bass (librosa) — reload nếu thiếu strength
    if (!QUA_THICH.beats || !QUA_THICH.beatStrength) {
        fetch('src/music/qua-thich-beats.json')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data || !data.beats) return;
                QUA_THICH.beats = data.beats;
                QUA_THICH.beatStrength = data.strength || null;
                if (data.bpm) QUA_THICH.bpm = data.bpm;
                if (typeof data.beatOffset === 'number') QUA_THICH.beatOffset = data.beatOffset;
            })
            .catch(() => { /* fallback lưới BPM */ });
    }
    const flowers = scene.querySelector('.fl-scene .flowers');
    if (flowers) flowers.replaceWith(flowers.cloneNode(true));

    const lyricEl = scene.querySelector('.lyric-line[data-lyric]');
    const whisperEl = scene.querySelector('[data-whisper]');
    const feelEl = scene.querySelector('[data-feel]');
    const poemEl = scene.querySelector('.fl-poem');
    const poemSubEl = scene.querySelector('.fl-poem-sub');
    const MOODS = ['fl-mood-shy', 'fl-mood-longing', 'fl-mood-afraid', 'fl-mood-confess', 'fl-mood-tender'];
    if (lyricEl) {
        lyricEl.textContent = '';
        lyricEl.style.opacity = '0';
    }
    if (whisperEl) {
        whisperEl.textContent = '';
        whisperEl.style.opacity = '0';
    }
    if (feelEl) {
        feelEl.textContent = '';
        feelEl.style.opacity = '0';
    }
    scene.classList.remove(...MOODS);

    anime.timeline({ easing: 'easeOutExpo' })
        .add({ targets: '#scene-6 .show-label', opacity: [0, 1], duration: 700, delay: 400 })
        .add({ targets: '#scene-6 .fl-poem', opacity: [0, 1], translateY: [-25, 0], filter: ['blur(8px)', 'blur(0px)'], duration: 1100 }, '-=200')
        .add({ targets: '#scene-6 .fl-poem-sub', opacity: [0, 1], translateY: [15, 0], duration: 800 }, '-=400');

    const siFl = current;
    setSceneTimeout(siFl, () => {
        scene.classList.add('fl-active', 'fl-music');
        // Ensure qua-thich is actually audible (no WebAudio hijack)
        const audio = sceneMusicEl();
        if (audio) {
            const want = QUA_THICH.file;
            const src = decodeURIComponent(audio.currentSrc || audio.src || '');
            if (!src.includes(want) || audio.paused) {
                audio.src = QUA_THICH_SONG;
                audio.loop = false;
                audio.volume = 0.8;
                audio.play().then(() => {
                    try { audio.currentTime = 0; } catch (_) { /* ignore */ }
                    sceneMusicTrack = want;
                }).catch(() => { });
            } else if (audio.volume < 0.15) {
                audio.volume = 0.8;
            }
        }
    }, 1000);

    const canvas = document.getElementById('fl-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    const flakes = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: Math.random() * 0.9 + 0.4,
        vy: Math.random() * 0.45 + 0.2,
        vx: Math.random() * 0.35 - 0.18
    }));
    const flFlies = Array.from({ length: 28 }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: Math.random() * 3.5 + 1.5,
        vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
        alpha: Math.random(), fade: Math.random() * 0.014 + 0.007,
        hue: Math.random() > 0.5 ? 55 : 175
    }));
    const orbs = Array.from({ length: 10 }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height * (0.25 + Math.random() * 0.45),
        r: 18 + Math.random() * 36,
        vx: (Math.random() - 0.5) * 0.12,
        phase: Math.random() * Math.PI * 2,
        hue: 160 + Math.random() * 40
    }));
    const stars = Array.from({ length: 40 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.55,
        r: Math.random() * 1.4 + 0.4,
        tw: Math.random() * Math.PI * 2,
        spd: 0.8 + Math.random() * 1.4
    }));
    const bees = [];
    const meteors = [];
    const funIcons = [];
    const textBits = [];
    const hearts = [];
    let showBees = false;
    let showMeteors = false;
    let showIcons = false;
    let showTextHeart = false;
    let showFlyText = false; // chữ bay mãi, không ghép tim
    let textFormT = 0;
    let heartRunPhase = 0;
    let heartCx = 0;
    let heartCy = 0;
    let heartScale = 1;
    let fxMode = 'calm'; // calm | flies | bees | icons | flyText | heart | sky

    let running = true;
    let lastLyricIdx = -1;
    let smoothEnergy = 0;
    let swaySm = 0;
    let leafSm = 0;
    let grassSm = 0;
    let currentAct = '';
    let flyTarget = 18;
    let lastAccentBeat = -1;
    const fired = Object.create(null);

    // Mỗi đoạn một “cảnh” khác nhau — chỉ chorus2 mới ghép trái tim
    const MOMENTS = [
        { t: 8.0, id: 'await', feel: 'Anh muốn nói… nhưng cứ ngập ngừng', whisper: 'Nghe nhịp này cùng anh nhé', mood: 'fl-mood-shy', mode: 'calm', flies: 10, burst: 0 },
        { t: 14.4, id: 'vocal', feel: 'Tìm mãi một tình yêu đắm say', whisper: 'Và anh đã thấy Bé Bơ', mood: 'fl-mood-longing', mode: 'bees', act: 'fl-act-verse', bees: 5, flies: 16, burst: 4, poem: 'Bé Bơ ơi…', poemSub: 'anh viết những vần thơ này vì em' },
        { t: 29.14, id: 'pre', feel: 'Ngồi cạnh mà vẫn thấy xa', whisper: 'Thương nhiều… lại sợ nói ra', mood: 'fl-mood-afraid', mode: 'flies', act: 'fl-act-pre', flies: 90, clearBees: true, burst: 0 },
        { t: 42.1, id: 'chorus1', feel: 'Lời chưa thành hình…', whisper: 'Chữ bay trong đầu anh', mood: 'fl-mood-confess', mode: 'flyText', act: 'fl-act-chorus', flyText: true, flies: 24, clearBees: true, burst: 8 },
        { t: 56.0, id: 'chorus1b', feel: 'Cứ hiện lên những biểu cảm', whisper: 'Cứ nghĩ đến Bé Bơ là cười', mood: 'fl-mood-confess', mode: 'icons', clearFlyText: true, icons: 18, flies: 20, burst: 5 },
        { t: 69.98, id: 'hook', feel: 'Chỉ còn cây hoa… và anh', whisper: 'Thích cậu rồi', mood: 'fl-mood-tender', mode: 'calm', flies: 12, clearIcons: true, clearBees: true, burst: 4 },
        { t: 84.0, id: 'rap', feel: 'Những đêm trắng nhớ một người', whisper: 'Ngoài em ra… anh chẳng thương ai', mood: 'fl-mood-longing', mode: 'sky', act: 'fl-act-rap', flies: 30, meteors: true, burst: 3 },
        { t: 111.7, id: 'return', feel: 'Đàn ong mang lời thương', whisper: 'Xin đừng để anh phải giấu nữa', mood: 'fl-mood-afraid', mode: 'bees', act: 'fl-act-pre', bees: 14, flies: 22, clearIcons: true, burst: 6 },
        { t: 124.42, id: 'chorus2', feel: 'Lòng này đã thuộc về em', whisper: 'Quá thích cậu rồi… Bé Bơ', mood: 'fl-mood-confess', mode: 'heart', act: 'fl-act-chorus', textHeart: true, clearBees: true, flies: 36, burst: 12 },
        { t: 152.1, id: 'bridge', feel: 'Yêu chân thành… cũng có lúc khờ', whisper: 'Anh giả vờ ổn — chỉ vì nhớ em', mood: 'fl-mood-longing', mode: 'flies', act: 'fl-act-bridge', clearHeart: true, flies: 55, meteors: true, burst: 2 },
        { t: 166.7, id: 'finale', feel: 'Cả bầu trời đom đóm vì em', whisper: 'Anh vẫn yêu nhiều như thế', mood: 'fl-mood-confess', mode: 'flies', act: 'fl-act-finale', clearHeart: true, flies: 110, icons: 8, bees: 4, burst: 10 },
        { t: 195.02, id: 'outro', feel: 'Vì mình quá thích cậu rồi', whisper: 'Anh chỉ muốn nói với riêng Bé Bơ', mood: 'fl-mood-tender', mode: 'calm', act: 'fl-act-outro', clearHeart: true, flies: 18, clearBees: true, clearIcons: true, burst: 5, poem: 'Anh thương Bé Bơ', poemSub: 'không cần hoàn hảo — chỉ cần thật lòng' },
        { t: 215.0, id: 'softEnd', feel: 'Mãi là vậy…', whisper: 'Chỉ dành cho Bé Bơ', mood: 'fl-mood-tender', mode: 'calm', clearHeart: true, flies: 10, burst: 3 }
    ];

    function setAct(act) {
        if (!act || act === currentAct) return;
        ACTS.forEach(c => scene.classList.remove(c));
        scene.classList.add(act);
        currentAct = act;
    }

    function setMood(mood) {
        MOODS.forEach(c => scene.classList.remove(c));
        if (mood) scene.classList.add(mood);
    }

    function showLine(el, text, holdMs) {
        if (!el) return;
        anime.remove(el);
        if (!text) {
            anime({ targets: el, opacity: 0, duration: 500, easing: 'easeOutSine' });
            return;
        }
        el.textContent = text;
        anime({
            targets: el,
            opacity: [0, 1],
            translateY: [12, 0],
            duration: 900,
            easing: 'easeOutExpo',
            complete: () => {
                setSceneTimeout(siFl, () => {
                    if (!running) return;
                    anime({ targets: el, opacity: 0, duration: 1100, easing: 'easeInSine', delay: holdMs || 2200 });
                }, 40);
            }
        });
    }

    function showWhisper(text) {
        showLine(whisperEl, text, 2400);
    }

    function showFeel(text) {
        showLine(feelEl, text, 2800);
    }

    function spawnHearts(n) {
        for (let i = 0; i < n; i++) {
            const side = Math.random() < 0.5;
            hearts.push({
                x: canvas.width * (side ? 0.06 + Math.random() * 0.2 : 0.74 + Math.random() * 0.2),
                y: canvas.height * (0.22 + Math.random() * 0.28),
                vy: -(0.35 + Math.random() * 0.55),
                vx: (Math.random() - 0.5) * 0.35,
                life: 1,
                fade: 0.004 + Math.random() * 0.003,
                s: 6 + Math.random() * 8,
                rot: Math.random() * Math.PI
            });
        }
    }

    // Vị trí gần đầu 3 đoá hoa (CSS flowers ở đáy màn)
    function flowerOrigins() {
        const w = canvas.width;
        const h = canvas.height;
        const heartOn = scene.classList.contains('fl-heart-on');
        // Cây to → đầu hoa cao hơn; khi có tim thì thu xuống
        return heartOn
            ? [
                { x: w * 0.50, y: h * 0.58 },
                { x: w * 0.70, y: h * 0.62 },
                { x: w * 0.30, y: h * 0.63 }
            ]
            : [
                { x: w * 0.50, y: h * 0.32 },
                { x: w * 0.72, y: h * 0.40 },
                { x: w * 0.28, y: h * 0.42 }
            ];
    }

    function heartPointFl(t, scale) {
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        return { x: x * scale, y: y * scale };
    }

    function spawnBees(n) {
        showBees = true;
        const cargos = ['hearts', 'petals', 'stars'];
        for (let i = 0; i < n; i++) {
            const cargo = cargos[i % cargos.length];
            bees.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height * 0.88,
                ang: Math.random() * Math.PI * 2,
                spd: 0.55 + Math.random() * 0.85,
                orbit: 70 + Math.random() * 160,
                cx: Math.random() * canvas.width,
                cy: Math.random() * canvas.height * 0.85,
                drift: 0.35 + Math.random() * 0.55,
                wing: Math.random() * Math.PI * 2,
                s: 0.72 + Math.random() * 0.18,
                cargo,
                stock: 3,
                bob: Math.random() * Math.PI * 2,
                dropT: 0,
                refillT: 0,
                face: 1
            });
        }
    }

    // Biểu cảm / icon rải từ đoá hoa
    function spawnIcons(n) {
        showIcons = true;
        const kinds = ['smile', 'blush', 'wink', 'love', 'spark'];
        const origins = flowerOrigins();
        for (let i = 0; i < n; i++) {
            const o = origins[i % origins.length];
            const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.7;
            const spd = 1.1 + Math.random() * 2.2;
            funIcons.push({
                kind: kinds[Math.floor(Math.random() * kinds.length)],
                x: o.x + (Math.random() - 0.5) * 28,
                y: o.y + (Math.random() - 0.5) * 18,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                grav: 0.018 + Math.random() * 0.012,
                life: 1,
                fade: 0.003 + Math.random() * 0.0025,
                rot: Math.random() * Math.PI,
                rspd: (Math.random() - 0.5) * 0.06,
                s: 12 + Math.random() * 16
            });
        }
    }

    function buildLoveUnits() {
        const phrases = ['Yêu bé', 'thương bé', 'I love you', 'yêu em', 'thương em', 'mãi bên em'];
        const units = [];
        phrases.forEach((p, pi) => {
            for (const ch of p) units.push({ ch, w: 1, sep: false });
            units.push({ ch: null, w: 0.7 });
            units.push({ ch: '✦', w: 1.4, sep: true });
            units.push({ ch: null, w: 0.7 });
            if (pi === phrases.length - 1) {
                units.push({ ch: '♥', w: 1.5, sep: true });
                units.push({ ch: null, w: 0.8 });
            }
        });
        return units;
    }

    function restoreBigFlowers() {
        // Không ghép tim → cây phóng to lại
        scene.classList.remove('fl-heart-on');
    }

    function clearTextFx() {
        showTextHeart = false;
        showFlyText = false;
        textBits.length = 0;
        textFormT = 0;
        restoreBigFlowers();
    }

    function endTextHeartOnly() {
        showTextHeart = false;
        textFormT = 0;
        if (!showFlyText) textBits.length = 0;
        restoreBigFlowers();
    }

    function spawnFlyText() {
        clearTextFx();
        showFlyText = true;
        fxMode = 'flyText';
        const units = buildLoveUnits();
        const loop = units.concat(units);
        for (let i = 0; i < loop.length; i++) {
            const u = loop[i];
            if (!u.ch) continue;
            const angFly = Math.random() * Math.PI * 2;
            const spd = 0.7 + Math.random() * 1.8;
            textBits.push({
                ch: u.ch,
                sep: !!u.sep,
                u: i / loop.length,
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: Math.cos(angFly) * spd,
                vy: Math.sin(angFly) * spd,
                life: 1
            });
        }
    }

    function spawnTextHeart() {
        clearTextFx();
        scene.classList.add('fl-heart-on');
        showTextHeart = true;
        fxMode = 'heart';
        textFormT = 0;
        heartRunPhase = 0;
        const units = buildLoveUnits();
        const loop = units.concat(units.slice(0, Math.ceil(units.length * 0.35)));
        const totalW = loop.reduce((s, u) => s + u.w, 0);
        heartScale = Math.min(canvas.width, canvas.height) * 0.0105;
        heartCx = canvas.width * 0.5;
        heartCy = canvas.height * 0.30;
        let acc = 0;
        for (let i = 0; i < loop.length; i++) {
            const u = loop[i];
            const mid = (acc + u.w * 0.5) / totalW;
            acc += u.w;
            if (!u.ch) continue;
            const angFly = Math.random() * Math.PI * 2;
            const spd = 1.2 + Math.random() * 2.4;
            textBits.push({
                ch: u.ch,
                sep: !!u.sep,
                u: mid,
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: Math.cos(angFly) * spd,
                vy: Math.sin(angFly) * spd,
                life: 1
            });
        }
    }

    function spawnMeteor() {
        showMeteors = true;
        meteors.push({
            x: canvas.width * (0.1 + Math.random() * 0.7),
            y: -20 - Math.random() * 80,
            vx: 3.5 + Math.random() * 3.2,
            vy: 5.5 + Math.random() * 3.5,
            life: 1,
            len: 40 + Math.random() * 55
        });
    }

    function ensureFlies(count) {
        flyTarget = count;
        while (flFlies.length < count) {
            flFlies.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 3.5 + 1.5,
                vx: (Math.random() - 0.5) * 1.35,
                vy: (Math.random() - 0.5) * 1.35,
                alpha: Math.random(),
                fade: Math.random() * 0.014 + 0.007,
                hue: Math.random() > 0.5 ? 55 : 175,
                tw: Math.random() * Math.PI * 2
            });
        }
        // đã có sẵn — vẫn tăng tốc bay khắp màn
        flFlies.forEach(f => {
            if (Math.abs(f.vx) < 0.4) f.vx = (Math.random() - 0.5) * 1.35;
            if (Math.abs(f.vy) < 0.4) f.vy = (Math.random() - 0.5) * 1.35;
        });
    }

    function fireMoment(m) {
        if (m.act) setAct(m.act);
        if (m.mood) setMood(m.mood);
        if (m.mode) fxMode = m.mode;
        if (m.feel) showFeel(m.feel);
        if (m.whisper != null) showWhisper(m.whisper);
        if (m.poem && poemEl) {
            anime({
                targets: poemEl,
                opacity: [0.9, 0],
                duration: 400,
                easing: 'easeInSine',
                complete: () => {
                    poemEl.textContent = m.poem;
                    anime({ targets: poemEl, opacity: [0, 0.85], duration: 800, easing: 'easeOutExpo' });
                }
            });
        }
        if (m.poemSub && poemSubEl) {
            poemSubEl.textContent = m.poemSub;
            anime({ targets: poemSubEl, opacity: [0, 0.7], duration: 900, easing: 'easeOutSine' });
        }

        if (m.clearFlyText) clearTextFx();
        else if (m.clearHeart) endTextHeartOnly();
        if (m.clearBees) { showBees = false; bees.length = 0; }
        if (m.clearIcons) { showIcons = false; funIcons.length = 0; }

        if (m.flies != null) ensureFlies(m.flies);
        if (m.burst) PETAL_SYSTEM.burst(innerWidth * 0.5, innerHeight * 0.58, m.burst, 2.1 + m.burst * 0.04);
        if (m.hearts) spawnHearts(m.hearts);
        if (m.bees) spawnBees(m.bees);
        if (m.icons) spawnIcons(m.icons);
        if (m.flyText) spawnFlyText();
        if (m.textHeart) spawnTextHeart();
        if (m.meteors) {
            showMeteors = true;
            for (let i = 0; i < 2; i++) setSceneTimeout(siFl, spawnMeteor, i * 900);
        }
        // Cảnh calm: hạ đom đóm, tắt icon/ong nếu không spawn mới
        if (m.mode === 'calm') {
            if (!m.bees) { showBees = false; bees.length = 0; }
            if (!m.icons) { showIcons = false; funIcons.length = 0; }
            showMeteors = false;
            if (!m.flyText && !m.textHeart) clearTextFx();
        }
        // Chỉ lúc ghép tim mới thu cây — mọi cảnh khác phóng lại
        if (!m.textHeart) restoreBigFlowers();
    }

    function beatHitPulse(mt) {
        return musicBeatEnvelopeFrom(mt, QUA_THICH);
    }

    function syncQuaThich(mt) {
        const bpm = QUA_THICH.bpm;
        const beat = Math.max(0, mt - QUA_THICH.beatOffset) * (bpm / 60);
        const phase = (beat % 1) * Math.PI * 2;
        const C = QUA_THICH.cues;
        let sectionBoost = 0.75;
        if (mt >= C.chorus && mt < C.rap) sectionBoost = 1;
        else if (mt >= C.rap && mt < C.chorus2) sectionBoost = 0.9;
        else if (mt >= C.chorus2 && mt < C.bridge) sectionBoost = 1.05;
        else if (mt >= C.bridge && mt < C.chorus3) sectionBoost = 0.8;
        else if (mt >= C.chorus3) sectionBoost = 1.08;

        for (let i = 0; i < MOMENTS.length; i++) {
            const m = MOMENTS[i];
            if (!fired[m.id] && mt >= m.t) {
                fired[m.id] = true;
                fireMoment(m);
            }
        }

        // Peak đúng beat (librosa) — chỉ cho tim đỏ; không gắn vào đung đưa cây
        const beatPulse = beatHitPulse(mt);
        const barPulse = Math.max(0, Math.sin(phase * 0.5));
        const melodyE = (0.22 + barPulse * 0.2 + Math.min(beatPulse, 0.35) * 0.15) * sectionBoost;
        smoothEnergy += (melodyE - smoothEnergy) * 0.06;

        // Đung đưa mượt theo thời gian nhạc (lớp sin + lerp) — không theo spike beat
        const t = mt;
        const wind = 0.9 + smoothEnergy * 0.35;
        const swayT = (Math.sin(t * 0.55) * 1.15 + Math.sin(t * 0.92 + 1.1) * 0.55) * wind;
        const leafT = (Math.sin(t * 0.72 + 0.4) * 1.7 + Math.sin(t * 1.18 + 0.9) * 0.65) * wind;
        const grassT = (Math.sin(t * 0.48 + 1.3) * 2.1 + Math.sin(t * 0.88 + 0.2) * 0.85) * wind;
        swaySm += (swayT - swaySm) * 0.085;
        leafSm += (leafT - leafSm) * 0.1;
        grassSm += (grassT - grassSm) * 0.095;
        scene.style.setProperty('--sway', swaySm.toFixed(3) + 'deg');
        scene.style.setProperty('--leaf-sway', leafSm.toFixed(3) + 'deg');
        scene.style.setProperty('--grass-sway', grassSm.toFixed(3) + 'deg');
        scene.style.setProperty('--pulse', '1');
        scene.style.setProperty('--beat-rate', '1');
        PETAL_SYSTEM.setWind(0.05 + smoothEnergy * 0.05);

        // Accent theo từng mode — không trộn lung tung
        const accent = Math.floor(beat / 2);
        if (accent !== lastAccentBeat && beatPulse > 0.85 && mt >= QUA_THICH.vocalAt) {
            lastAccentBeat = accent;
            if (fxMode === 'icons' && accent % 2 === 0) spawnIcons(3);
            else if (fxMode === 'heart' && accent % 4 === 0) spawnHearts(2);
            else if (fxMode === 'bees' && accent % 4 === 0 && bees.length < 18) spawnBees(2);
            else if (fxMode === 'sky' && accent % 2 === 0) spawnMeteor();
            else if (fxMode === 'flies' && accent % 4 === 0) ensureFlies(Math.min(flyTarget + 4, 120));
        }

        if (lyricEl) {
            const lead = QUA_THICH.lyricLead || 0;
            if (mt < QUA_THICH.vocalAt) {
                if (lastLyricIdx !== -2) {
                    lastLyricIdx = -2;
                    lyricEl.textContent = '';
                    lyricEl.style.opacity = '0';
                }
            } else {
                let idx = -1;
                for (let i = 0; i < QUA_THICH.lyrics.length; i++) {
                    if (mt + lead >= QUA_THICH.lyrics[i].t) idx = i;
                }
                if (idx !== lastLyricIdx && idx >= 0) {
                    lastLyricIdx = idx;
                    lyricEl.textContent = QUA_THICH.lyrics[idx].text;
                    lyricEl.style.opacity = '0';
                    lyricEl.style.transform = 'translateY(8px)';
                    anime.remove(lyricEl);
                    anime({
                        targets: lyricEl,
                        opacity: [0, 1],
                        translateY: [8, 0],
                        duration: 420,
                        easing: 'easeOutExpo'
                    });
                }
            }
        }
        return { beat, energy: smoothEnergy, phase, beatPulse };
    }

    function drawInnerBeatHeart(cx, cy, scale, pulse, alpha) {
        // Khít trong chữ; đập mạnh khi bass/strength cao
        const s = scale * (0.80 + pulse * 0.14);
        const steps = 80;
        function pathAt(sc) {
            ctx.beginPath();
            for (let i = 0; i <= steps; i++) {
                const t = (i / steps) * Math.PI * 2;
                const p = heartPointFl(t, sc);
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.closePath();
        }
        ctx.save();
        ctx.translate(cx, cy);
        ctx.globalAlpha = alpha;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Neon halo ngoài
        pathAt(s);
        ctx.strokeStyle = `rgba(255, 40, 110, ${0.22 + pulse * 0.28})`;
        ctx.lineWidth = 14 + pulse * 10;
        ctx.shadowColor = 'rgba(255, 30, 90, 0.95)';
        ctx.shadowBlur = 28 + pulse * 36;
        ctx.stroke();

        // Glow layer 2
        pathAt(s);
        ctx.strokeStyle = `rgba(255, 80, 140, ${0.45 + pulse * 0.3})`;
        ctx.lineWidth = 6 + pulse * 4;
        ctx.shadowBlur = 16 + pulse * 18;
        ctx.stroke();

        // Fill neon đỏ hồng
        pathAt(s * 0.98);
        const fill = ctx.createRadialGradient(0, -s * 2, 0, 0, s * 2, s * 14);
        fill.addColorStop(0, `rgba(255, 160, 190, ${0.55 + pulse * 0.25})`);
        fill.addColorStop(0.45, `rgba(255, 45, 100, ${0.72 + pulse * 0.2})`);
        fill.addColorStop(1, `rgba(160, 10, 50, ${0.55 + pulse * 0.15})`);
        ctx.fillStyle = fill;
        ctx.shadowColor = `rgba(255, 50, 120, ${0.65 + pulse * 0.3})`;
        ctx.shadowBlur = 18 + pulse * 22;
        ctx.fill();

        // Viền sáng trắng-hồng (neon tube)
        pathAt(s);
        ctx.strokeStyle = `rgba(255, 230, 240, ${0.75 + pulse * 0.2})`;
        ctx.lineWidth = 1.6 + pulse * 0.8;
        ctx.shadowColor = 'rgba(255, 180, 210, 0.9)';
        ctx.shadowBlur = 8 + pulse * 10;
        ctx.stroke();

        ctx.restore();
    }

    function drawHeart(x, y, s, a, rot) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.globalAlpha = a;
        ctx.fillStyle = 'rgba(255, 170, 190, 0.9)';
        ctx.beginPath();
        const k = s / 12;
        ctx.moveTo(0, 3 * k);
        ctx.bezierCurveTo(-8 * k, -4 * k, -12 * k, 6 * k, 0, 14 * k);
        ctx.bezierCurveTo(12 * k, 6 * k, 8 * k, -4 * k, 0, 3 * k);
        ctx.fill();
        ctx.restore();
    }

    function drawMiniHeart(x, y, s, color, a) {
        ctx.save();
        ctx.translate(x, y);
        ctx.globalAlpha = a;
        ctx.fillStyle = color;
        ctx.beginPath();
        const k = s / 10;
        ctx.moveTo(0, 2 * k);
        ctx.bezierCurveTo(-7 * k, -4 * k, -10 * k, 5 * k, 0, 11 * k);
        ctx.bezierCurveTo(10 * k, 5 * k, 7 * k, -4 * k, 0, 2 * k);
        ctx.fill();
        ctx.restore();
    }

    function drawBee(b) {
        b.ang += 0.014 * b.spd;
        b.wing += 0.48;
        b.bob += 0.06;
        b.dropT += 1;
        b.refillT += 1;
        // tâm quỹ đạo trôi khắp màn hình
        const drift = b.drift || 0.4;
        b.cx += Math.cos(b.ang * 0.31) * drift;
        b.cy += Math.sin(b.ang * 0.27 + 0.4) * drift * 0.75;
        if (b.cx < -60) b.cx = canvas.width + 60;
        if (b.cx > canvas.width + 60) b.cx = -60;
        if (b.cy < canvas.height * 0.08) b.cy = canvas.height * 0.82;
        if (b.cy > canvas.height * 0.9) b.cy = canvas.height * 0.12;
        const nx = b.cx + Math.cos(b.ang) * b.orbit;
        const ny = b.cy + Math.sin(b.ang * 1.15) * (b.orbit * 0.55) + Math.sin(b.bob) * 2.5;
        const dx = nx - b.x;
        if (dx < -0.2) b.face = -1;
        else if (dx > 0.2) b.face = 1;
        b.x = nx;
        b.y = ny;
        const s = 4.2 * b.s; // nhỏ nhắn
        const tilt = Math.cos(b.ang) * 0.12 * b.face;

        if (b.stock > 0 && b.dropT > 100 && Math.random() < 0.035) {
            b.dropT = 0;
            b.stock -= 1;
            if (b.cargo === 'hearts') {
                hearts.push({
                    x: b.x, y: b.y + s * 2.4,
                    vy: -(0.12 + Math.random() * 0.18),
                    vx: (Math.random() - 0.5) * 0.22,
                    life: 1, fade: 0.007, s: 4 + Math.random() * 3,
                    rot: Math.random() * Math.PI
                });
            } else {
                funIcons.push({
                    kind: b.cargo === 'stars' ? 'star' : 'bloom',
                    x: b.x, y: b.y + s * 2.3,
                    vy: -(0.1 + Math.random() * 0.15),
                    vx: (Math.random() - 0.5) * 0.25,
                    life: 1, fade: 0.009, rot: 0, rspd: 0.04, s: 6 + Math.random() * 4
                });
                showIcons = true;
            }
            if (b.stock <= 0) b.cargo = 'empty';
        }
        if (b.cargo === 'empty' && b.refillT > 240) {
            b.refillT = 0;
            b.cargo = ['hearts', 'petals', 'stars'][Math.floor(Math.random() * 3)];
            b.stock = 3;
        }

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.scale(b.face || 1, 1); // mặt theo hướng bay
        ctx.rotate(tilt);

        // tiny glow
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#ffe9a8';
        ctx.beginPath();
        ctx.arc(0, s * 0.1, s * 2.1, 0, Math.PI * 2);
        ctx.fill();

        // wings — small & fluttery
        const flap = Math.sin(b.wing) * 0.6;
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = 'rgba(230, 248, 255, 0.95)';
        ctx.beginPath();
        ctx.ellipse(-s * 0.55, -s * 0.7, s * 0.7, s * 0.38, -0.8 + flap, 0, Math.PI * 2);
        ctx.ellipse(s * 0.15, -s * 0.75, s * 0.65, s * 0.34, 0.75 - flap, 0, Math.PI * 2);
        ctx.fill();

        // body — round chibi blob
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffd76a';
        ctx.beginPath();
        ctx.ellipse(-s * 0.15, s * 0.15, s * 0.95, s * 0.78, 0, 0, Math.PI * 2);
        ctx.fill();
        // 2 soft stripes only
        ctx.strokeStyle = 'rgba(90, 60, 20, 0.28)';
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-s * 0.35, -s * 0.35); ctx.lineTo(-s * 0.35, s * 0.55);
        ctx.moveTo(s * 0.05, -s * 0.4); ctx.lineTo(s * 0.05, s * 0.55);
        ctx.stroke();

        // big round head
        ctx.fillStyle = '#ffe7a0';
        ctx.beginPath();
        ctx.arc(s * 0.75, 0, s * 0.72, 0, Math.PI * 2);
        ctx.fill();

        // tiny antennae balls
        ctx.strokeStyle = 'rgba(70, 45, 25, 0.65)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(s * 0.85, -s * 0.55);
        ctx.lineTo(s * 1.05, -s * 1.05);
        ctx.moveTo(s * 0.7, -s * 0.55);
        ctx.lineTo(s * 0.55, -s * 1.1);
        ctx.stroke();
        ctx.fillStyle = '#ff9eb8';
        ctx.beginPath();
        ctx.arc(s * 1.05, -s * 1.05, s * 0.13, 0, Math.PI * 2);
        ctx.arc(s * 0.55, -s * 1.1, s * 0.13, 0, Math.PI * 2);
        ctx.fill();

        // kawaii eyes (big)
        ctx.fillStyle = '#3d2a1a';
        ctx.beginPath();
        ctx.arc(s * 0.62, -s * 0.05, s * 0.16, 0, Math.PI * 2);
        ctx.arc(s * 0.98, -s * 0.02, s * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(s * 0.66, -s * 0.1, s * 0.06, 0, Math.PI * 2);
        ctx.arc(s * 1.02, -s * 0.07, s * 0.06, 0, Math.PI * 2);
        ctx.fill();

        // blush + tiny smile
        ctx.fillStyle = 'rgba(255, 140, 165, 0.4)';
        ctx.beginPath();
        ctx.ellipse(s * 0.45, s * 0.22, s * 0.16, s * 0.09, 0, 0, Math.PI * 2);
        ctx.ellipse(s * 1.15, s * 0.24, s * 0.16, s * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(100, 55, 45, 0.55)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(s * 0.8, s * 0.12, s * 0.16, 0.25, Math.PI - 0.25);
        ctx.stroke();

        // mini basket under belly
        const bx = 0;
        const by = s * 1.45;
        ctx.strokeStyle = 'rgba(160, 110, 60, 0.8)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-s * 0.25, s * 0.7);
        ctx.quadraticCurveTo(0, s * 1.15, s * 0.25, s * 0.7);
        ctx.stroke();
        ctx.fillStyle = '#e0b06a';
        ctx.beginPath();
        ctx.moveTo(-s * 0.55, by);
        ctx.lineTo(s * 0.55, by);
        ctx.lineTo(s * 0.42, by + s * 0.7);
        ctx.quadraticCurveTo(0, by + s * 0.9, -s * 0.42, by + s * 0.7);
        ctx.closePath();
        ctx.fill();

        const n = Math.max(0, b.stock | 0);
        if (b.cargo === 'empty' || n === 0) {
            ctx.fillStyle = 'rgba(70, 40, 15, 0.2)';
            ctx.beginPath();
            ctx.ellipse(bx, by + s * 0.2, s * 0.28, s * 0.12, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (b.cargo === 'hearts') {
            for (let i = 0; i < n; i++) {
                drawMiniHeart(bx + (i - 1) * s * 0.28, by + s * 0.05, s * 0.42, ['#ff8fb3', '#ff6b9d', '#ffc1d4'][i], 0.95);
            }
        } else if (b.cargo === 'petals') {
            const cols = ['#7fe0d0', '#a7ffee', '#ffd6e7'];
            for (let i = 0; i < n; i++) {
                ctx.fillStyle = cols[i % 3];
                ctx.beginPath();
                ctx.ellipse(bx + (i - 1) * s * 0.26, by + s * 0.08, s * 0.18, s * 0.1, i, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            ctx.fillStyle = '#ffe27a';
            for (let i = 0; i < n; i++) {
                const px = bx + (i - 1) * s * 0.26;
                const py = by + s * 0.05;
                ctx.beginPath();
                for (let k = 0; k < 5; k++) {
                    const a = -Math.PI / 2 + k * Math.PI * 2 / 5;
                    const a2 = a + Math.PI / 5;
                    ctx.lineTo(px + Math.cos(a) * s * 0.16, py + Math.sin(a) * s * 0.16);
                    ctx.lineTo(px + Math.cos(a2) * s * 0.07, py + Math.sin(a2) * s * 0.07);
                }
                ctx.closePath();
                ctx.fill();
            }
        }

        ctx.restore();
    }

    function drawIcon(ic) {
        ctx.save();
        ctx.translate(ic.x, ic.y);
        ctx.rotate(ic.rot);
        ctx.globalAlpha = ic.life * 0.9;
        const s = ic.s;
        if (ic.kind === 'star') {
            ctx.fillStyle = 'rgba(255, 230, 140, 0.95)';
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
                const a2 = a + Math.PI / 5;
                ctx.lineTo(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55);
                ctx.lineTo(Math.cos(a2) * s * 0.22, Math.sin(a2) * s * 0.22);
            }
            ctx.closePath();
            ctx.fill();
        } else if (ic.kind === 'note') {
            ctx.fillStyle = 'rgba(180, 230, 255, 0.95)';
            ctx.beginPath();
            ctx.arc(0, s * 0.25, s * 0.22, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(s * 0.12, -s * 0.55, s * 0.1, s * 0.75);
            ctx.beginPath();
            ctx.moveTo(s * 0.22, -s * 0.55);
            ctx.quadraticCurveTo(s * 0.7, -s * 0.35, s * 0.55, -s * 0.05);
            ctx.quadraticCurveTo(s * 0.3, -s * 0.25, s * 0.22, -s * 0.2);
            ctx.fill();
        } else if (ic.kind === 'spark') {
            ctx.strokeStyle = 'rgba(255, 255, 220, 0.9)';
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 4; i++) {
                const a = i * Math.PI / 4;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * s * 0.1, Math.sin(a) * s * 0.1);
                ctx.lineTo(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5);
                ctx.stroke();
            }
        } else if (ic.kind === 'smile' || ic.kind === 'blush' || ic.kind === 'wink' || ic.kind === 'love') {
            const face = ic.kind === 'love' ? 'rgba(255, 180, 200, 0.96)' : 'rgba(255, 220, 120, 0.95)';
            ctx.fillStyle = face;
            ctx.beginPath();
            ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
            ctx.fill();
            if (ic.kind === 'blush' || ic.kind === 'love') {
                ctx.fillStyle = 'rgba(255, 130, 160, 0.45)';
                ctx.beginPath();
                ctx.ellipse(-s * 0.22, s * 0.1, s * 0.12, s * 0.07, 0, 0, Math.PI * 2);
                ctx.ellipse(s * 0.22, s * 0.1, s * 0.12, s * 0.07, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#4a3a20';
            if (ic.kind === 'wink') {
                ctx.beginPath();
                ctx.arc(-s * 0.14, -s * 0.08, s * 0.06, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#4a3a20';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(s * 0.06, -s * 0.1);
                ctx.lineTo(s * 0.22, -s * 0.06);
                ctx.stroke();
            } else if (ic.kind === 'love') {
                drawMiniHeart(-s * 0.14, -s * 0.1, s * 0.28, '#ff6b9d', 1);
                drawMiniHeart(s * 0.14, -s * 0.1, s * 0.28, '#ff6b9d', 1);
            } else {
                ctx.beginPath();
                ctx.arc(-s * 0.14, -s * 0.08, s * 0.06, 0, Math.PI * 2);
                ctx.arc(s * 0.14, -s * 0.08, s * 0.06, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.strokeStyle = '#4a3a20';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(0, s * 0.05, s * 0.18, 0.15, Math.PI - 0.15);
            ctx.stroke();
        } else {
            // bloom fallback
            ctx.fillStyle = 'rgba(120, 230, 210, 0.9)';
            for (let i = 0; i < 5; i++) {
                const a = i * Math.PI * 2 / 5;
                ctx.beginPath();
                ctx.ellipse(Math.cos(a) * s * 0.22, Math.sin(a) * s * 0.22, s * 0.2, s * 0.12, a, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = 'rgba(255, 240, 160, 0.95)';
            ctx.beginPath();
            ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function drawFl() {
        if (!running) return;
        if (isExperiencePaused()) {
            requestAnimationFrame(drawFl);
            return;
        }
        const mt = getTrustedMusicTime(QUA_THICH.file);
        let phase = 0;
        let beatPulse = 0;
        if (mt != null && isSceneMusicLive(QUA_THICH.file)) {
            const info = syncQuaThich(mt);
            phase = info.phase || 0;
            beatPulse = info.beatPulse || 0;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const energy = smoothEnergy;
        const inRap = currentAct === 'fl-act-rap';
        const inChorus = currentAct === 'fl-act-chorus' || currentAct === 'fl-act-finale';

        if (inRap || currentAct === 'fl-act-bridge' || showMeteors) {
            stars.forEach(s => {
                s.tw += 0.02 * s.spd;
                const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(s.tw));
                ctx.globalAlpha = a * (inRap ? 0.9 : 0.5);
                ctx.fillStyle = '#e8f4ff';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        if (showMeteors) {
            if (Math.random() < 0.012) spawnMeteor();
            for (let i = meteors.length - 1; i >= 0; i--) {
                const m = meteors[i];
                m.x += m.vx;
                m.y += m.vy;
                m.life -= 0.012;
                if (m.life <= 0 || m.y > canvas.height + 40) {
                    meteors.splice(i, 1);
                    continue;
                }
                const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 4, m.y - m.vy * 4);
                g.addColorStop(0, `rgba(255,255,255,${m.life})`);
                g.addColorStop(1, 'rgba(120,220,255,0)');
                ctx.strokeStyle = g;
                ctx.lineWidth = 2;
                ctx.globalAlpha = m.life;
                ctx.beginPath();
                ctx.moveTo(m.x, m.y);
                ctx.lineTo(m.x - m.vx * (m.len / 8), m.y - m.vy * (m.len / 8));
                ctx.stroke();
            }
        }

        if (inChorus || currentAct === 'fl-act-pre' || currentAct === 'fl-act-outro') {
            orbs.forEach(o => {
                o.phase += 0.008;
                o.x += o.vx;
                if (o.x < -40) o.x = canvas.width + 40;
                if (o.x > canvas.width + 40) o.x = -40;
                const a = (0.06 + energy * 0.08) * (inChorus ? 1.2 : 0.7);
                const g = ctx.createRadialGradient(o.x, o.y + Math.sin(o.phase) * 8, 0, o.x, o.y, o.r);
                g.addColorStop(0, `hsla(${o.hue},70%,75%,${a})`);
                g.addColorStop(1, `hsla(${o.hue},70%,75%,0)`);
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(o.x, o.y + Math.sin(o.phase) * 8, o.r, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        const flakeCount = currentAct === 'fl-act-bridge' ? 70 : flakes.length;
        for (let i = 0; i < flakeCount; i++) {
            const f = flakes[i];
            f.y += f.vy * (1 + energy * 0.25);
            f.x += f.vx + Math.sin(f.y * 0.01) * energy * 0.2;
            if (f.y > canvas.height) { f.y = 0; f.x = Math.random() * canvas.width; }
            ctx.globalAlpha = 0.4 + energy * 0.2;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
        }

        const flyCount = Math.min(flFlies.length, flyTarget);
        for (let i = 0; i < flyCount; i++) {
            const f = flFlies[i];
            f.tw = (f.tw || 0) + 0.04;
            // bay lang thang khắp màn — đổi hướng nhẹ
            if (Math.random() < 0.012) {
                f.vx += (Math.random() - 0.5) * 0.8;
                f.vy += (Math.random() - 0.5) * 0.8;
                const sp = Math.hypot(f.vx, f.vy) || 1;
                const maxSp = 1.6 + energy;
                f.vx = (f.vx / sp) * Math.min(sp, maxSp);
                f.vy = (f.vy / sp) * Math.min(sp, maxSp);
            }
            f.x += f.vx * (1 + energy * 0.55) + Math.sin(f.tw) * 0.35;
            f.y += f.vy * (1 + energy * 0.55) + Math.cos(f.tw * 0.8) * 0.25;
            f.alpha += f.fade;
            if (f.alpha <= 0 || f.alpha >= 1) f.fade = -f.fade;
            if (f.x < 0) { f.x = 0; f.vx = Math.abs(f.vx); }
            if (f.x > canvas.width) { f.x = canvas.width; f.vx = -Math.abs(f.vx); }
            if (f.y < 0) { f.y = 0; f.vy = Math.abs(f.vy); }
            if (f.y > canvas.height) { f.y = canvas.height; f.vy = -Math.abs(f.vy); }
            const a = Math.min(Math.max(f.alpha, 0), 1) * (0.55 + energy * 0.4);
            const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 3);
            g.addColorStop(0, `hsla(${f.hue},95%,75%,${a * 0.8})`);
            g.addColorStop(1, `hsla(${f.hue},95%,75%,0)`);
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 3, 0, Math.PI * 2); ctx.fill();
        }

        if (showBees) bees.forEach(drawBee);

        if (showIcons) {
            for (let i = funIcons.length - 1; i >= 0; i--) {
                const ic = funIcons[i];
                ic.vy += ic.grav || 0;
                ic.y += ic.vy;
                ic.x += ic.vx;
                ic.vx *= 0.995;
                ic.rot += ic.rspd;
                ic.life -= ic.fade;
                if (ic.life <= 0 || ic.y < -50 || ic.y > canvas.height + 60) funIcons.splice(i, 1);
                else drawIcon(ic);
            }
        }

        // Chữ bay mãi (không ghép tim)
        if (showFlyText && textBits.length) {
            const fontPx = Math.max(14, canvas.width * 0.014);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            textBits.forEach(b => {
                b.x += b.vx;
                b.y += b.vy;
                if (b.x < 8 || b.x > canvas.width - 8) b.vx *= -1;
                if (b.y < 8 || b.y > canvas.height - 8) b.vy *= -1;
                b.x = Math.max(4, Math.min(canvas.width - 4, b.x));
                b.y = Math.max(4, Math.min(canvas.height - 4, b.y));
                ctx.font = `${b.sep ? 500 : 600} ${fontPx}px "Cormorant Garamond", Georgia, serif`;
                ctx.save();
                ctx.translate(b.x, b.y);
                ctx.globalAlpha = 0.72;
                ctx.fillStyle = b.sep ? 'rgba(255, 190, 160, 0.95)' : 'rgba(255, 244, 236, 0.95)';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
                ctx.shadowBlur = 5;
                ctx.fillText(b.ch, 0, 0);
                ctx.restore();
            });
            ctx.shadowBlur = 0;
        }

        if (showTextHeart && textBits.length) {
            // Bay → hút vào đường cong đang chạy
            textFormT = Math.min(1, textFormT + 0.0042);
            const form = textFormT < 0.18 ? 0 : Math.min(1, (textFormT - 0.18) / 0.55);
            const ease = form * form * (3 - 2 * form);
            const phaseSpd = 0.00055 + ease * 0.00135;
            heartRunPhase = (heartRunPhase + phaseSpd) % 1;

            if (ease > 0.28) {
                drawInnerBeatHeart(
                    heartCx,
                    heartCy,
                    heartScale,
                    beatPulse,
                    Math.min(1, (ease - 0.28) / 0.45)
                );
            }

            const fontPx = Math.max(14, canvas.width * 0.0135);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            textBits.forEach(b => {
                const t = ((b.u + heartRunPhase) % 1) * Math.PI * 2;
                const p0 = heartPointFl(t, heartScale);
                const p1 = heartPointFl(t + 0.028, heartScale);
                const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
                const tx = heartCx + p0.x;
                const ty = heartCy + p0.y;

                if (ease < 0.02) {
                    b.x += b.vx;
                    b.y += b.vy;
                    if (b.x < 8 || b.x > canvas.width - 8) b.vx *= -1;
                    if (b.y < 8 || b.y > canvas.height - 8) b.vy *= -1;
                    b.x = Math.max(4, Math.min(canvas.width - 4, b.x));
                    b.y = Math.max(4, Math.min(canvas.height - 4, b.y));
                } else {
                    b.vx *= 0.88;
                    b.vy *= 0.88;
                    const pull = 0.04 + ease * 0.14;
                    b.x += (tx - b.x) * pull + b.vx * (1 - ease) * 0.12;
                    b.y += (ty - b.y) * pull + b.vy * (1 - ease) * 0.12;
                    if (ease > 0.72) {
                        b.x = tx;
                        b.y = ty;
                    }
                }

                const onPath = ease > 0.55;
                const isSep = !!b.sep;
                ctx.font = `${isSep ? 500 : 600} ${isSep ? fontPx * 0.92 : fontPx}px "Cormorant Garamond", Georgia, serif`;
                ctx.save();
                ctx.translate(b.x, b.y);
                if (onPath) ctx.rotate(ang * Math.min(1, (ease - 0.55) / 0.35));
                ctx.globalAlpha = 0.55 + ease * 0.42;
                ctx.fillStyle = isSep
                    ? 'rgba(255, 190, 160, 0.95)'
                    : 'rgba(255, 244, 236, 0.98)';
                ctx.shadowColor = isSep ? 'rgba(255, 160, 120, 0.55)' : 'rgba(255, 140, 180, 0.4)';
                ctx.shadowBlur = onPath ? 7 : 5;
                ctx.fillText(b.ch, 0, 0);
                ctx.restore();
            });
            ctx.shadowBlur = 0;
        }

        for (let i = hearts.length - 1; i >= 0; i--) {
            const h = hearts[i];
            h.y += h.vy;
            h.x += h.vx + Math.sin(phase + h.rot) * 0.15;
            h.life -= h.fade;
            h.rot += 0.01;
            if (h.life <= 0) hearts.splice(i, 1);
            else drawHeart(h.x, h.y, h.s, h.life * 0.85, h.rot);
        }

        ctx.globalAlpha = 1;
        requestAnimationFrame(drawFl);
    }
    drawFl();

    PETAL_SYSTEM.setWind(0.14);
    setSceneTimeout(siFl, () => PETAL_SYSTEM.setWind(0.08), 2800);

    cleanups[siFl] = () => {
        running = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        scene.classList.remove('fl-active', 'fl-music', 'fl-heart-on', ...ACTS, ...MOODS);
        scene.style.removeProperty('--sway');
        scene.style.removeProperty('--leaf-sway');
        scene.style.removeProperty('--grass-sway');
        scene.style.removeProperty('--pulse');
        scene.style.removeProperty('--beat-rate');
        if (lyricEl) {
            lyricEl.textContent = '';
            lyricEl.style.opacity = '0';
        }
        if (whisperEl) {
            whisperEl.textContent = '';
            whisperEl.style.opacity = '0';
        }
        if (feelEl) {
            feelEl.textContent = '';
            feelEl.style.opacity = '0';
        }
        PETAL_SYSTEM.setWind(0.1);
    };
}

// ===== SCENE 7: SÂN KHẤU (Meo Meo) =====
function enter5() {
    const scene = document.getElementById('scene-7');
    const video = document.getElementById('stage-video');
    const petalCanvas = document.getElementById('petalCanvas');
    scene.classList.remove('stage-ready', 'stage-open', 'stage-playing');

    // Hạ cánh hoa + FX nặng để video không giật
    if (petalCanvas) petalCanvas.classList.remove('active');
    PETAL_SYSTEM.setWind(0);

    const music = sceneMusicEl();
    if (music) {
        const startVol = music.volume || 0;
        const t0 = performance.now();
        (function fadeMusic(now) {
            const p = Math.min((now - t0) / 600, 1);
            music.volume = startVol * (1 - p);
            if (p < 1) requestAnimationFrame(fadeMusic);
            else music.pause();
        })(t0);
    }

    clearSceneMusicEndAdvance();

    anime.timeline({ easing: 'easeOutExpo' })
        .add({ targets: '#scene-7 .show-label', opacity: [0, 1], duration: 650, delay: 200 })
        .add({ targets: '#scene-7 .stage-title', opacity: [0, 1], translateY: [-18, 0], duration: 900 }, '-=200')
        .add({ targets: '#scene-7 .stage-sub', opacity: [0, 1], translateY: [12, 0], duration: 700 }, '-=500');

    const canvas = document.getElementById('stage-fx-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    const sparks = Array.from({ length: 36 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.8 + 0.4,
        vy: -(Math.random() * 0.45 + 0.1),
        vx: (Math.random() - 0.5) * 0.35,
        alpha: Math.random() * 0.55 + 0.2,
        pulse: Math.random() * Math.PI * 2,
        hue: Math.random() * 360
    }));
    const rayColors = [
        [255, 210, 140],
        [255, 90, 170],
        [110, 170, 255],
        [180, 110, 255],
        [120, 255, 210],
        [255, 255, 220]
    ];
    let discoAngle = 0;

    let running = true;
    let advanced = false;
    let onEnded = null;
    let onTime = null;
    let onCanPlay = null;
    let fxTick = 0;

    function drawDiscoRays(playing) {
        const cx = canvas.width * 0.5;
        const cy = Math.max(28, canvas.height * 0.06);
        const n = playing ? 14 : 8;
        discoAngle += playing ? 0.028 : 0.012;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < n; i++) {
            const ang = discoAngle + (i / n) * Math.PI * 2;
            const len = canvas.height * (0.55 + 0.2 * Math.sin(discoAngle * 2 + i));
            const [r, g, b] = rayColors[i % rayColors.length];
            const a = playing ? 0.14 : 0.07;
            const tipX = cx + Math.cos(ang) * len;
            const tipY = cy + Math.sin(ang) * len * 0.85;
            const spread = 0.07 + (i % 3) * 0.02;
            const g2 = ctx.createLinearGradient(cx, cy, tipX, tipY);
            g2.addColorStop(0, `rgba(${r},${g},${b},${a * 1.6})`);
            g2.addColorStop(0.45, `rgba(${r},${g},${b},${a * 0.55})`);
            g2.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(
                cx + Math.cos(ang - spread) * len * 0.15,
                cy + Math.sin(ang - spread) * len * 0.12
            );
            ctx.lineTo(tipX, tipY);
            ctx.lineTo(
                cx + Math.cos(ang + spread) * len * 0.15,
                cy + Math.sin(ang + spread) * len * 0.12
            );
            ctx.closePath();
            ctx.fillStyle = g2;
            ctx.fill();
        }
        // Quả cầu sáng trung tâm
        const ball = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28);
        ball.addColorStop(0, 'rgba(255,255,255,0.85)');
        ball.addColorStop(0.4, 'rgba(220,235,255,0.35)');
        ball.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = ball;
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawSweepSpots(playing, t) {
        if (!playing) return;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const spots = [
            { x: 0.18 + Math.sin(t * 1.1) * 0.06, y: 0.25, c: [90, 150, 255], s: 0.22 },
            { x: 0.82 + Math.cos(t * 0.9) * 0.05, y: 0.28, c: [255, 70, 150], s: 0.2 },
            { x: 0.5 + Math.sin(t * 0.7) * 0.1, y: 0.72, c: [255, 200, 80], s: 0.28 }
        ];
        for (let i = 0; i < spots.length; i++) {
            const s = spots[i];
            const px = s.x * canvas.width;
            const py = s.y * canvas.height;
            const rad = Math.min(canvas.width, canvas.height) * s.s;
            const g = ctx.createRadialGradient(px, py, 0, px, py, rad);
            const [r, gc, b] = s.c;
            const pulse = 0.12 + 0.1 * Math.sin(t * 3 + i);
            g.addColorStop(0, `rgba(${r},${gc},${b},${pulse})`);
            g.addColorStop(1, `rgba(${r},${gc},${b},0)`);
            ctx.fillStyle = g;
            ctx.fillRect(px - rad, py - rad, rad * 2, rad * 2);
        }
        ctx.restore();
    }

    function drawStageFx() {
        if (!running) return;
        if (isExperiencePaused()) {
            requestAnimationFrame(drawStageFx);
            return;
        }
        fxTick++;
        const playing = scene.classList.contains('stage-playing');
        // Khi video chạy: vẽ cách frame nhẹ để vẫn nhường GPU
        if (playing && fxTick % 2 === 1) {
            requestAnimationFrame(drawStageFx);
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const t = fxTick * 0.04;
        drawDiscoRays(playing);
        drawSweepSpots(playing, t);

        // Flash ngắn theo nhịp
        if (playing && (fxTick % 38 === 0 || fxTick % 53 === 0)) {
            ctx.fillStyle = 'rgba(255,250,245,0.12)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        for (let i = 0; i < sparks.length; i++) {
            const s = sparks[i];
            s.pulse += 0.05;
            s.x += s.vx + Math.sin(s.pulse) * 0.2;
            s.y += s.vy;
            if (s.y < -10) { s.y = canvas.height + 10; s.x = Math.random() * canvas.width; }
            const a = s.alpha * (0.5 + 0.5 * Math.sin(s.pulse));
            ctx.beginPath();
            ctx.fillStyle = `hsla(${s.hue}, 85%, 72%, ${a})`;
            ctx.arc(s.x, s.y, s.r * (playing ? 2.6 : 2), 0, Math.PI * 2);
            ctx.fill();
        }
        requestAnimationFrame(drawStageFx);
    }
    drawStageFx();

    const si5 = current;
    function advanceAfterVideo() {
        if (advanced || current !== si5) return;
        advanced = true;
        if (petalCanvas) petalCanvas.classList.add('active');
        PETAL_SYSTEM.burst(innerWidth * 0.5, innerHeight * 0.45, 10, 2.6);
        setSceneTimeout(si5, () => {
            if (current === si5 && !isPaused) goToScene(si5 + 1);
        }, 900);
    }

    function bindVideoProgress() {
        const fill = document.getElementById('progress-fill');
        onTime = () => {
            if (!fill || !video.duration) return;
            fill.style.width = Math.min((video.currentTime / video.duration) * 100, 100) + '%';
        };
        video.addEventListener('timeupdate', onTime);
        onEnded = () => advanceAfterVideo();
        video.addEventListener('ended', onEnded);
        startProgress((video.duration || 42) * 1000);
    }

    function playStageVideo() {
        video.muted = false;
        video.volume = 0.9;
        const playP = video.play();
        if (playP && playP.catch) {
            playP.catch(() => {
                video.muted = true;
                video.play().catch(() => { });
            });
        }
    }

    function startVideoShow() {
        if (!video) return;
        scene.classList.add('stage-ready');
        setSceneTimeout(si5, () => {
            scene.classList.add('stage-open');
        }, 450);
        setSceneTimeout(si5, () => {
            scene.classList.add('stage-playing');
            let started = false;
            const kick = () => {
                if (started || current !== si5) return;
                started = true;
                if (onCanPlay) {
                    video.removeEventListener('canplay', onCanPlay);
                    onCanPlay = null;
                }
                playStageVideo();
                bindVideoProgress();
            };
            if (video.readyState >= 3) {
                kick();
            } else {
                onCanPlay = kick;
                video.addEventListener('canplay', onCanPlay);
                try { video.load(); } catch (_) { /* ignore */ }
                setSceneTimeout(si5, kick, 2500);
            }
        }, 1200);
    }

    if (video) {
        try { video.preload = 'auto'; } catch (_) { /* ignore */ }
        try { video.load(); } catch (_) { /* ignore */ }
    }

    setSceneTimeout(si5, startVideoShow, 900);

    cleanups[si5] = () => {
        running = false;
        advanced = true;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (video) {
            if (onEnded) video.removeEventListener('ended', onEnded);
            if (onTime) video.removeEventListener('timeupdate', onTime);
            if (onCanPlay) video.removeEventListener('canplay', onCanPlay);
            video.pause();
            try { video.currentTime = 0; } catch (_) { /* ignore */ }
        }
        scene.classList.remove('stage-ready', 'stage-open', 'stage-playing');
        if (petalCanvas) petalCanvas.classList.add('active');
        PETAL_SYSTEM.setWind(0.1);
    };
}

// ===== SCENE 8: MEMORY — lyric arc "Chỉ Yêu Mình Em" + closing letter =====
function enter6() {
    const si6 = current;
    const scene = document.getElementById('scene-8');
    const mainEl = document.getElementById('karaoke-main');
    const subEl = document.getElementById('karaoke-sub');
    const cards = document.querySelectorAll('#scene-8 .photo-card');
    const memoryPhase = document.getElementById('memory-phase');
    const finalPhase = document.getElementById('final-phase');
    const karaokeBox = scene.querySelector('.karaoke-box--corner');
    const finalCanvas = document.getElementById('final-canvas');
    const introLineEl = document.getElementById('cyme-intro-line');
    const moodClasses = ['mood-meet', 'mood-smile', 'mood-miss', 'mood-return', 'mood-only', 'mood-forever'];
    scene.classList.add('cyme-active');
    scene.classList.remove('is-final', 'has-lyric');
    if (memoryPhase) { memoryPhase.hidden = false; memoryPhase.style.opacity = '1'; memoryPhase.style.transform = ''; }
    if (karaokeBox) { karaokeBox.style.opacity = ''; karaokeBox.style.pointerEvents = ''; }
    ['.cyme-head', '#cyme-intro', '.s4-hint'].forEach(sel => {
        const el = scene.querySelector(sel);
        if (el) { el.style.visibility = ''; el.style.opacity = ''; }
    });
    if (finalPhase) {
        finalPhase.hidden = true;
        finalPhase.style.display = '';
        finalPhase.style.opacity = '';
    }
    if (introLineEl) { introLineEl.textContent = ''; introLineEl.style.opacity = '0'; }

    // Lời dẫn trong đoạn nhạc dạo (trước vocal)
    const INTRO_LINES = [
        { t: 0.6, text: 'Nhạc còn đang dạo… anh muốn ngồi lại với bé một chút.' },
        { t: 8.5, text: 'Những khung ảnh này là vài khoảnh khắc anh giữ thật kỹ.' },
        { t: 16.5, text: 'Có ngày vui, có ngày nhớ… nhưng đều có Bé Bơ ở đó.' },
        { t: 24.5, text: 'Anh không nói nhiều lúc ấy — nên hôm nay nói bằng cả trái tim.' },
        { t: 32.5, text: 'Sắp tới rồi… vài lời anh muốn gửi riêng cho bé.' }
    ];
    let lastIntroIdx = -1;

    function setLyricLayout(on) {
        scene.classList.toggle('has-lyric', !!on);
    }

    function showIntroLine(text) {
        if (!introLineEl) return;
        anime.remove(introLineEl);
        introLineEl.textContent = text || '';
        introLineEl.style.opacity = '0';
        introLineEl.style.transform = 'translateY(8px)';
        anime({
            targets: introLineEl,
            opacity: [0, 1],
            translateY: [8, 0],
            duration: 520,
            easing: 'easeOutExpo'
        });
    }

    // Nạp beat bass (librosa); lyrics đã inline sẵn như scene-5/6
    if (!CHI_YEU.beats || !CHI_YEU.beatStrength) {
        fetch('src/music/chi-yeu-minh-em-beats.json')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data || !data.beats) return;
                CHI_YEU.beats = data.beats;
                CHI_YEU.beatStrength = data.strength || null;
                if (data.bpm) CHI_YEU.bpm = data.bpm;
                if (typeof data.beatOffset === 'number') CHI_YEU.beatOffset = data.beatOffset;
            })
            .catch(() => { });
    }

    PETAL_SYSTEM.setWind(0.18);

    // Khung trái tim bằng chữ (neon) bên phải + chữ xoay quanh
    const orbitEl = document.getElementById('cyme-heart-orbit');
    const frameEl = document.getElementById('cyme-heart-frame');
    const heartStage = document.getElementById('cyme-heart-stage');
    const orbitChars = [];
    const frameChips = [];
    let orbitPhase = 0;
    let orbitRaf = null;
    let orbitRunning = true;
    function cymeHeartPoint(t, scale) {
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        return { x: x * scale, y: y * scale };
    }
    const chipChars = ['♥', '♡', '✦', '❀', '♥', '✧', '♡', '♥', '✦', '❀', '♡', '♥'];
    const chipColors = ['#ff6eb4', '#ff9ecd', '#ffd28a', '#ff8fab', '#ffe0f0', '#ff4fd8'];
    if (frameEl) {
        frameEl.innerHTML = '';
        const N = 40;
        for (let i = 0; i < N; i++) {
            const s = document.createElement('span');
            s.className = 'cyme-heart-chip';
            s.textContent = chipChars[i % chipChars.length];
            s.style.color = chipColors[i % chipColors.length];
            frameEl.appendChild(s);
            frameChips.push(s);
        }
    }
    if (orbitEl) {
        orbitEl.innerHTML = '';
        const orbitStr = '✦ Chỉ yêu mình Bé Bơ ✦ Yêu em mãi ✦ Happy Birthday ✦ ';
        [...orbitStr].forEach(ch => {
            const s = document.createElement('span');
            s.className = 'orbit-char';
            s.textContent = ch;
            orbitEl.appendChild(s);
            orbitChars.push(s);
        });
    }
    function tickCymeOrbit() {
        if (!orbitRunning) return;
        orbitRaf = requestAnimationFrame(tickCymeOrbit);
        if (isPaused || !heartStage) return;
        const beat = parseFloat(scene.style.getPropertyValue('--cyme-beat')) || 0;
        orbitPhase = (orbitPhase + 0.0015 + beat * 0.0011) % 1;
        const stageW = heartStage.clientWidth || 280;
        const frameScale = stageW * 0.026;
        const orbitScale = stageW * 0.033;
        const nFrame = frameChips.length;
        for (let i = 0; i < nFrame; i++) {
            const t = (i / nFrame) * Math.PI * 2;
            const p = cymeHeartPoint(t, frameScale);
            const kick = 1 + beat * 0.06;
            frameChips[i].style.transform =
                `translate(${p.x * kick}px, ${p.y * kick}px) scale(${0.9 + beat * 0.25})`;
        }
        const nOrbit = orbitChars.length;
        for (let i = 0; i < nOrbit; i++) {
            const t = ((i / nOrbit) + orbitPhase) * Math.PI * 2;
            const p0 = cymeHeartPoint(t, orbitScale);
            const p1 = cymeHeartPoint(t + 0.035, orbitScale);
            const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
            orbitChars[i].style.transform =
                `translate(${p0.x}px, ${p0.y}px) rotate(${ang}rad)`;
        }
    }
    orbitRaf = requestAnimationFrame(tickCymeOrbit);

    anime({ targets: '#memory-phase .show-label', opacity: [0, 1], translateY: [-10, 0], duration: 700, easing: 'easeOutExpo' });
    anime({ targets: '#scene-8 .cyme-title', opacity: [0, 1], translateY: [-18, 0], filter: ['blur(6px)', 'blur(0px)'], duration: 900, delay: 80, easing: 'easeOutExpo' });
    anime({ targets: '#scene-8 .song-credit', opacity: [0, 1], duration: 700, delay: 280, easing: 'easeOutSine' });
    const cardTilts = [-2.2, 1.8, 1.5, -1.8];
    anime({
        targets: '#scene-8 .photo-card',
        opacity: [0, 1],
        scale: [0.78, 1],
        translateY: [22, 0],
        rotate: (el, i) => {
            const t = cardTilts[i] ?? 0;
            return [t * 0.2, t];
        },
        delay: anime.stagger(110, { start: 220 }),
        duration: 920,
        easing: 'easeOutBack',
        complete: () => {
            // Xóa transform inline để CSS float/glow chạy được
            cards.forEach(c => {
                c.style.transform = '';
                c.style.opacity = '1';
            });
        }
    });
    anime({ targets: '#scene-8 .s4-hint', opacity: [0, 0.55], duration: 650, delay: 1400, easing: 'easeOutSine' });
    // Hiện dòng intro đầu nếu nhạc chưa kịp sync
    setSceneTimeout(current, () => {
        if (!photosRunning || finalStarted || lastIntroIdx >= 0) return;
        lastIntroIdx = 0;
        showIntroLine(INTRO_LINES[0].text);
    }, 900);

    function advanceFlip(flip) {
        const imgs = [...flip.querySelectorAll('img')];
        if (imgs.length < 2) return;
        let i = imgs.findIndex(img => img.classList.contains('is-active'));
        if (i < 0) i = 0;
        const next = (i + 1) % imgs.length;
        const upcoming = imgs[next];
        const apply = () => imgs.forEach((img, j) => img.classList.toggle('is-active', j === next));
        if (upcoming && typeof upcoming.decode === 'function') upcoming.decode().then(apply).catch(apply);
        else apply();
    }

    function setMood(mood) {
        moodClasses.forEach(c => scene.classList.remove(c));
        if (mood) scene.classList.add(`mood-${mood}`);
    }

    // Hiện lyric ngay (như scene-5/6) — không chờ fade-out rồi mới đổi chữ
    function showKaraoke(line, sub) {
        if (!mainEl) return;
        setLyricLayout(!!line);
        anime.remove(mainEl);
        if (subEl) anime.remove(subEl);
        mainEl.textContent = line || '';
        mainEl.style.opacity = '0';
        mainEl.style.transform = 'translateY(8px)';
        anime({
            targets: mainEl,
            opacity: [0, 1],
            translateY: [8, 0],
            duration: 420,
            easing: 'easeOutExpo'
        });
        if (subEl) {
            subEl.textContent = sub || '';
            if (sub) {
                subEl.style.opacity = '0';
                anime({
                    targets: subEl,
                    opacity: [0, 0.85],
                    translateY: [6, 0],
                    duration: 420,
                    delay: 60,
                    easing: 'easeOutExpo'
                });
        } else {
                subEl.style.opacity = '0';
            }
        }
    }

    const clickFns = [];
    let photosRunning = true;
    let lastLyricIdx = -1;
    let lyricRaf = null;
    let lastBeatIdx = -1;
    let lastFlipAt = 0;
    let chorusFlipIdx = 0;

    function cymeBeatPulse(mt) {
        const pulse = musicBeatEnvelopeFrom(mt, CHI_YEU);
        const beat = Math.max(0, mt - (CHI_YEU.beatOffset || 0)) * ((CHI_YEU.bpm || 96) / 60);
        return { pulse, beatIdx: Math.floor(beat) };
    }

    function applyFx(fx) {
        if (fx === 'spark' || fx === 'burst') {
            PETAL_SYSTEM.burst(innerWidth * 0.5, innerHeight * 0.42, fx === 'burst' ? 16 : 8, fx === 'burst' ? 3.2 : 2.2);
        }
        if (fx === 'heart' || fx === 'finale') {
            PETAL_SYSTEM.burst(innerWidth * 0.35, innerHeight * 0.48, 10, 2.6);
            PETAL_SYSTEM.burst(innerWidth * 0.65, innerHeight * 0.48, 10, 2.6);
        }
        if (fx === 'warm' || fx === 'glow') PETAL_SYSTEM.setWind(0.2);
        if (fx === 'dim' || fx === 'slow') PETAL_SYSTEM.setWind(0.05);
        if (fx === 'finale') PETAL_SYSTEM.setWind(0.28);
    }

    function focusCard(index) {
        cards.forEach((c, i) => c.classList.toggle('is-lyric-focus', i === index));
    }

    function softFlip(card, force) {
        if (!card) return;
        const now = performance.now();
        if (!force && now - lastFlipAt < 1400) return;
        lastFlipAt = now;
        advanceFlip(card.querySelector('.photo-flip'));
    }

    function applyCue(cue) {
        setMood(cue.mood);
        showKaraoke(cue.line, cue.sub);
        applyFx(cue.fx);

        // Chỉ highlight 1 khung — tránh scale cả lưới đè chữ
        if (typeof cue.focus === 'number' && cue.focus >= 0 && cards[cue.focus]) {
            focusCard(cue.focus);
            softFlip(cards[cue.focus], true);
        } else if (cue.focus === -1) {
            // Chorus: lần lượt 1 khung, không flip cả 4 cùng lúc
            const i = chorusFlipIdx % cards.length;
            chorusFlipIdx += 1;
            focusCard(i);
            softFlip(cards[i], true);
        } else {
            // Fallback theo mood → card tương ứng
            const moodMap = { meet: 0, smile: 1, miss: 2, return: 0, only: 3, forever: 3 };
            const i = moodMap[cue.mood] ?? 0;
            focusCard(i);
            softFlip(cards[i], false);
        }
    }

    // --- Closing letter after song / last lyric ---
    let finalStarted = false;
    let finalFxRunning = false;
    let finalFxRaf = null;
    let musicEndFn = null;
    const lastLyricT = CHI_YEU.lyrics.length
        ? CHI_YEU.lyrics[CHI_YEU.lyrics.length - 1].t
        : (CHI_YEU.cues?.finale || 240);

    function syncLyricClock() {
            if (!photosRunning) return;
        lyricRaf = requestAnimationFrame(syncLyricClock);
        if (isPaused) {
            scene.style.setProperty('--cyme-beat', '0');
            return;
        }
        // Giống scene-5/6: chỉ tin currentTime khi đúng file đang phát
        const mt = getTrustedMusicTime(CHI_YEU.file);
        if (mt == null || !isSceneMusicLive(CHI_YEU.file)) {
            scene.style.setProperty('--cyme-beat', '0');
            return;
        }

        // Ca sĩ bắt đầu hát → hiện luôn nội dung kết (lá thư)
        if (!finalStarted && mt >= CHI_YEU.vocalAt) {
            startClosingLetter();
            return;
        }

        const lead = CHI_YEU.lyricLead || 0;

        // Nhạc dạo: hiện lời dẫn chuyện + lật ảnh nhẹ theo nhịp
        if (mt + lead < CHI_YEU.vocalAt) {
            setLyricLayout(false);
            let introIdx = -1;
            for (let i = 0; i < INTRO_LINES.length; i++) {
                if (mt >= INTRO_LINES[i].t) introIdx = i;
            }
            if (introIdx !== lastIntroIdx && introIdx >= 0) {
                lastIntroIdx = introIdx;
                showIntroLine(INTRO_LINES[introIdx].text);
                // Highlight lần lượt 1 khung polaroid
                const cardIdx = introIdx % cards.length;
                focusCard(cardIdx);
                softFlip(cards[cardIdx], true);
                setMood(['meet', 'smile', 'miss', 'forever', 'return'][introIdx] || 'meet');
            }
        }

        // Beat pulse — neon heart + thump khung focus
        const { pulse, beatIdx } = cymeBeatPulse(mt);
        // Làm đậm nhịp xuống: giữ peak lâu hơn một nhịp ngắn
        const beatGlow = Math.min(1, pulse * 1.15);
        scene.style.setProperty('--cyme-beat', beatGlow.toFixed(3));
        if (beatIdx !== lastBeatIdx && pulse > 0.45) {
            lastBeatIdx = beatIdx;
            const focused = scene.querySelector('.photo-card.is-lyric-focus');
            if (focused) {
                focused.classList.remove('cyme-thump');
                void focused.offsetWidth;
                focused.classList.add('cyme-thump');
            }
            scene.classList.remove('cyme-neon-kick');
            void scene.offsetWidth;
            scene.classList.add('cyme-neon-kick');
        }
    }

    cards.forEach(card => {
        const flip = card.querySelector('.photo-flip');
        const fn = () => advanceFlip(flip);
        card.addEventListener('click', fn);
        clickFns.push([card, fn]);
    });

    function startFinalFx() {
        if (!finalCanvas || finalFxRunning) return;
        finalFxRunning = true;
        const ctx = finalCanvas.getContext('2d');
        const resize = () => {
            finalCanvas.width = innerWidth;
            finalCanvas.height = innerHeight;
        };
        resize();
        const hearts = Array.from({ length: 28 }, () => ({
            x: Math.random() * innerWidth,
            y: innerHeight + Math.random() * innerHeight * 0.4,
            r: 5 + Math.random() * 10,
            vy: -(0.35 + Math.random() * 0.55),
            vx: (Math.random() - 0.5) * 0.35,
            a: 0.25 + Math.random() * 0.45,
            rot: Math.random() * Math.PI,
            spin: (Math.random() - 0.5) * 0.02
        }));
        function drawHeart(x, y, s, rot, alpha) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);
            ctx.scale(s / 10, s / 10);
            ctx.beginPath();
            ctx.moveTo(0, 3);
            ctx.bezierCurveTo(-8, -4, -12, 6, 0, 14);
            ctx.bezierCurveTo(12, 6, 8, -4, 0, 3);
            ctx.fillStyle = `rgba(255, 150, 190, ${alpha})`;
            ctx.fill();
            ctx.restore();
        }
        function tick() {
            if (!finalFxRunning) return;
            if (isExperiencePaused()) {
                finalFxRaf = requestAnimationFrame(tick);
                return;
            }
            ctx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
            hearts.forEach(h => {
                h.x += h.vx;
                h.y += h.vy;
                h.rot += h.spin;
                if (h.y < -20) {
                    h.y = finalCanvas.height + 20;
                    h.x = Math.random() * finalCanvas.width;
                }
                drawHeart(h.x, h.y, h.r, h.rot, h.a);
            });
            finalFxRaf = requestAnimationFrame(tick);
        }
        window.addEventListener('resize', resize);
        startFinalFx._resize = resize;
        finalFxRaf = requestAnimationFrame(tick);
    }

    function syncBeatOnly() {
        if (finalStarted === false || !orbitRunning) return;
        lyricRaf = requestAnimationFrame(syncBeatOnly);
        if (isPaused) {
            scene.style.setProperty('--cyme-beat', '0');
            return;
        }
        const mt = getTrustedMusicTime(CHI_YEU.file);
        if (mt == null || !isSceneMusicLive(CHI_YEU.file)) {
            scene.style.setProperty('--cyme-beat', '0');
            return;
        }
        const { pulse, beatIdx } = cymeBeatPulse(mt);
        scene.style.setProperty('--cyme-beat', Math.min(1, pulse * 1.15).toFixed(3));
        if (beatIdx !== lastBeatIdx && pulse > 0.45) {
            lastBeatIdx = beatIdx;
            scene.classList.remove('cyme-neon-kick');
            void scene.offsetWidth;
            scene.classList.add('cyme-neon-kick');
            // Album giữa vẫn lật nhẹ theo nhịp
            if (cards.length && beatIdx % 4 === 0) {
                const i = (Math.floor(beatIdx / 4)) % cards.length;
                focusCard(i);
                softFlip(cards[i], true);
            }
        }
    }

    function startClosingLetter() {
        if (finalStarted) return;
        finalStarted = true;
        photosRunning = true;
        if (lyricRaf) cancelAnimationFrame(lyricRaf);
        lyricRaf = null;

        // Chỉ ẩn chữ intro/karaoke — giữ album polaroid ở giữa
        const chrome = [
            scene.querySelector('.cyme-head'),
            scene.querySelector('#cyme-intro'),
            scene.querySelector('.s4-hint'),
            karaokeBox
        ].filter(Boolean);
        anime({
            targets: chrome,
            opacity: 0,
            duration: 700,
            easing: 'easeInOutSine',
            complete: () => {
                chrome.forEach(el => {
                    if (el === karaokeBox) {
                        karaokeBox.style.pointerEvents = 'none';
                    } else {
                        el.style.visibility = 'hidden';
                    }
                });
            }
        });
        if (memoryPhase) {
            memoryPhase.hidden = false;
            memoryPhase.style.opacity = '1';
        }

        scene.classList.add('is-final');
        scene.classList.remove('has-lyric');
        if (introLineEl) {
            anime.remove(introLineEl);
            introLineEl.style.opacity = '0';
            introLineEl.textContent = '';
        }
        // Giữ tim chữ neon đập theo nhạc trong lúc hiện lá thư
        if (finalPhase) {
            finalPhase.hidden = false;
            finalPhase.style.display = 'flex';
            finalPhase.style.opacity = '1';
        }
        PETAL_SYSTEM.setWind(0.12);
        PETAL_SYSTEM.burst(innerWidth * 0.5, innerHeight * 0.55, 18, 2.8);
        startFinalFx();
        lyricRaf = requestAnimationFrame(syncBeatOnly);

        scene.classList.remove('letter-open', 'letter-fanning');
        const desk = finalPhase ? finalPhase.querySelector('#letter-desk') : null;
        if (desk) {
            desk.classList.remove('is-open', 'is-fanning');
            desk.style.opacity = '0';
            anime({
                targets: desk,
                opacity: [0, 1],
                translateY: [22, 0],
                duration: 900,
                easing: 'easeOutExpo'
            });
        }
        startLetterTyping();
    }

    let letterTypingToken = 0;

    function sleepMs(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function animeFinished(opts) {
        return new Promise(resolve => {
            anime({
                ...opts,
                complete: () => resolve()
            });
        });
    }

    function readLetterSource() {
        const source = finalPhase && finalPhase.querySelector('#letter-source');
        if (!source) return { labelHtml: '', blocks: [] };
        const labelEl = source.querySelector('[data-letter-label]');
        const blocks = [...source.querySelectorAll('[data-letter-block]')].map(el => ({
            tag: el.tagName.toLowerCase(),
            className: el.className || '',
            html: el.innerHTML.trim()
        }));
        return {
            labelHtml: labelEl ? labelEl.innerHTML.trim() : '',
            blocks
        };
    }

    function pageFits(pageEl) {
        if (!pageEl) return true;
        // +2px chống lệch subpixel khi khung hẹp/cao
        return pageEl.scrollHeight <= pageEl.clientHeight + 2;
    }

    function createLetterPage(num, withLabel) {
        const page = document.createElement('article');
        page.className = 'final-letter letter-page';
        page.dataset.page = String(num);
        page.innerHTML =
            `<div class="final-letter-seal" aria-hidden="true"></div>` +
            `<span class="letter-page-num">Tờ ${num}</span>` +
            (withLabel ? `<p class="final-label"></p>` : '') +
            `<div class="final-message"></div>`;
        return page;
    }

    function makeBlockEl(block, html) {
        const el = document.createElement(block.tag);
        if (block.className) el.className = block.className;
        el.innerHTML = html;
        el.dataset.fullHtml = html;
        el.style.opacity = '1';
        return el;
    }

    /** Tách phần đầu của 1 đoạn cho vừa tờ hiện tại; phần còn lại trả về restWords */
    function splitBlockToFit(page, msg, block) {
        const raw = block.html
            .replace(/<br\s*\/?>/gi, ' [[BR]] ')
            .replace(/<[^>]+>/g, ' ');
        const words = raw.split(/\s+/).filter(Boolean);
        if (!words.length) {
            return { chunkHtml: block.html, restWords: [] };
        }

        const probe = makeBlockEl(block, '');
        msg.appendChild(probe);
        let lo = 1;
        let hi = words.length;
        let best = 1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            probe.innerHTML = words.slice(0, mid).join(' ').replace(/\[\[BR\]\]/g, '<br>');
            if (pageFits(page)) {
                best = mid;
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        if (best < 1) best = 1;
        const chunkHtml = words.slice(0, best).join(' ').replace(/\[\[BR\]\]/g, '<br>');
        msg.removeChild(probe);
        return { chunkHtml, restWords: words.slice(best) };
    }

    function appendRestWordsAsBlocks(queue, block, restWords) {
        if (!restWords.length) return;
        const html = restWords.join(' ').replace(/\[\[BR\]\]/g, '<br>');
        queue.unshift({
            tag: block.tag,
            className: block.className,
            html
        });
    }

    /**
     * Đo kích thước lá thư thật → tách nội dung thành N tờ (không cố định 2).
     * Khung hẹp/cao → nhiều tờ hơn; khung rộng → ít tờ hơn.
     */
    function buildLetterPages(desk) {
        const { labelHtml, blocks } = readLetterSource();
        desk.innerHTML = '';
        desk.classList.remove('is-open', 'is-fanning');
        desk.removeAttribute('data-page-count');

        if (!blocks.length && !labelHtml) return [];

        const queue = blocks.map(b => ({ ...b }));
        const pages = [];
        let pageNum = 1;
        let page = createLetterPage(1, !!labelHtml);
        desk.appendChild(page);
        page.classList.add('is-active');
        page.style.visibility = 'visible';
        page.style.opacity = '1';
        pages.push(page);

        // Ép layout để clientHeight đúng trước khi đo
        void desk.offsetHeight;

        let msg = page.querySelector('.final-message');
        if (labelHtml) {
            const label = page.querySelector('.final-label');
            if (label) {
                label.innerHTML = labelHtml;
                label.dataset.fullHtml = labelHtml;
                label.style.opacity = '1';
            }
        }

        const startNewPage = () => {
            page.classList.remove('is-active');
            page.style.opacity = '0';
            page.style.visibility = 'hidden';
            pageNum += 1;
            page = createLetterPage(pageNum, false);
            desk.appendChild(page);
            page.classList.add('is-active');
            page.style.visibility = 'visible';
            page.style.opacity = '1';
            pages.push(page);
            msg = page.querySelector('.final-message');
            void desk.offsetHeight;
        };

        while (queue.length) {
            const block = queue.shift();
            const el = makeBlockEl(block, block.html);
            msg.appendChild(el);

            if (pageFits(page)) continue;

            // Không vừa → gỡ ra, sang tờ mới (hoặc tách đoạn nếu tờ đang trống)
            msg.removeChild(el);
            const msgEmpty = msg.children.length === 0;

            if (!msgEmpty) {
                startNewPage();
                queue.unshift(block);
                continue;
            }

            // Tờ gần như trống mà 1 đoạn vẫn tràn → tách theo từ
            const split = splitBlockToFit(page, msg, block);
            const piece = makeBlockEl(block, split.chunkHtml || block.html);
            msg.appendChild(piece);
            appendRestWordsAsBlocks(queue, block, split.restWords || []);
            // Phần còn lại vào queue — vòng sau tự quyết có cần tờ mới không
        }

        desk.dataset.pageCount = String(pages.length);
        pages.forEach((p, i) => {
            const on = i === 0;
            p.classList.toggle('is-active', on);
            p.style.opacity = on ? '1' : '0';
            p.style.visibility = on ? 'visible' : 'hidden';
            p.style.transform = '';
            p.style.filter = '';
            // Ẩn chữ trước khi gõ
            p.querySelectorAll('.final-label, .final-message > p, .final-message > h2').forEach(el => {
                if (!el.dataset.fullHtml) el.dataset.fullHtml = el.innerHTML.trim();
                el.innerHTML = '';
                el.style.opacity = '0';
                el.classList.remove('is-typing');
            });
        });
        return pages;
    }

    async function typeInto(el, html, token) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        el.innerHTML = '';
        el.style.opacity = '1';
        el.classList.add('is-typing');

        const appendChar = async (target, ch) => {
            if (token !== letterTypingToken) return false;
            if (!target.lastChild || target.lastChild.nodeType !== Node.TEXT_NODE) {
                target.appendChild(document.createTextNode(''));
            }
            target.lastChild.textContent += ch;
            // Nhịp viết tay: chậm, hơi lệch ngẫu nhiên, nghỉ dài hơn ở dấu câu
            const jitter = () => Math.floor(Math.random() * 28);
            let pause;
            if (ch === '\n') pause = 140 + jitter();
            else if (ch === ' ') pause = 42 + jitter();
            else if (/[.,!?;…]/.test(ch)) pause = 180 + jitter() * 2;
            else if (/[—–-]/.test(ch)) pause = 120 + jitter();
            else pause = 62 + jitter();
            await sleepMs(pause);
            return token === letterTypingToken;
        };

        const walk = async (src, target) => {
            for (const child of [...src.childNodes]) {
                if (token !== letterTypingToken) return;
                if (child.nodeType === Node.TEXT_NODE) {
                    const chars = Array.from(child.textContent || '');
                    for (const ch of chars) {
                        if (!(await appendChar(target, ch))) return;
                    }
                } else if (child.nodeName === 'BR') {
                    target.appendChild(document.createElement('br'));
                    await sleepMs(160 + Math.floor(Math.random() * 80));
                } else {
                    const next = document.createElement(child.nodeName.toLowerCase());
                    if (child.className) next.className = child.className;
                    target.appendChild(next);
                    await walk(child, next);
                }
            }
        };

        await walk(tmp, el);
        if (token === letterTypingToken) el.classList.remove('is-typing');
    }

    async function typePage(pageEl, token) {
        const blocks = [
            ...pageEl.querySelectorAll('.final-label'),
            ...pageEl.querySelectorAll('.final-message > p, .final-message > h2')
        ];
        for (const el of blocks) {
            if (!el.dataset.fullHtml) el.dataset.fullHtml = el.innerHTML.trim();
            el.innerHTML = '';
            el.style.opacity = '0';
        }
        for (const el of blocks) {
            if (token !== letterTypingToken) return;
            await sleepMs(520 + Math.floor(Math.random() * 180));
            if (token !== letterTypingToken) return;
            await typeInto(el, el.dataset.fullHtml, token);
        }
    }

    async function flipLetterPage(fromPage, toPage, token) {
        if (token !== letterTypingToken) return;
        toPage.style.visibility = 'visible';
        toPage.style.opacity = '0';
        toPage.classList.add('is-active');
        await animeFinished({
            targets: fromPage,
            opacity: [1, 0],
            translateX: [0, -48],
            rotateY: [0, 28],
            filter: ['blur(0px)', 'blur(3px)'],
            duration: 780,
            easing: 'easeInCubic'
        });
        if (token !== letterTypingToken) return;
        fromPage.classList.remove('is-active');
        fromPage.style.visibility = 'hidden';
        PETAL_SYSTEM.burst(innerWidth * 0.28, innerHeight * 0.45, 10, 2.2);
        await animeFinished({
            targets: toPage,
            opacity: [0, 1],
            translateX: [56, 0],
            rotateY: [-22, 0],
            filter: ['blur(4px)', 'blur(0px)'],
            duration: 860,
            easing: 'easeOutCubic'
        });
        toPage.style.transform = '';
        toPage.style.filter = '';
        fromPage.style.transform = '';
        fromPage.style.filter = '';
        fromPage.style.opacity = '';
    }

    async function openAllLetters(token, pages) {
        if (token !== letterTypingToken || !finalPhase) return;
        const desk = finalPhase.querySelector('#letter-desk');
        if (!desk || !pages.length) return;

        await sleepMs(500);
        if (token !== letterTypingToken) return;

        // Chồng tờ — lộ nhẹ các tờ dưới (không bung ngang)
        scene.classList.add('letter-open');
        desk.classList.add('is-open');
        desk.classList.remove('is-fanning');
        desk.dataset.pageCount = String(pages.length);
        pages.forEach((p, i) => {
            p.classList.add('is-active');
            p.style.visibility = 'visible';
            p.style.filter = '';
            p.style.opacity = i === pages.length - 1 ? '1' : String(0.78 + i * 0.04);
        });

        PETAL_SYSTEM.burst(innerWidth * 0.4, innerHeight * 0.48, 12, 2.2);
        const top = pages[pages.length - 1];
        await animeFinished({
            targets: top,
            translateY: [10, 0],
            duration: 700,
            easing: 'easeOutCubic'
        });
        top.style.transform = '';

        await sleepMs(pages.length > 2 ? 2200 : 2600);
        if (token !== letterTypingToken) return;

        // Bung ngang tối đa 3 tờ cuối (tránh vỡ layout khi nhiều tờ)
        const fanPages = pages.length <= 3 ? pages : pages.slice(-3);
        desk.classList.add('is-fanning');
        scene.classList.add('letter-open', 'letter-fanning');
        desk.dataset.fanCount = String(fanPages.length);

        // Ẩn tờ không fan
        pages.forEach(p => {
            if (!fanPages.includes(p)) {
                p.style.opacity = '0';
                p.style.visibility = 'hidden';
            } else {
                p.style.visibility = 'visible';
                p.style.opacity = '0';
                p.style.transform = '';
            }
        });

        PETAL_SYSTEM.burst(innerWidth * 0.38, innerHeight * 0.5, 18, 2.8);
        const fanAnims = fanPages.map((p, i) => {
            const fromX = (i - (fanPages.length - 1) / 2) * 36;
            const rot = (i - (fanPages.length - 1) / 2) * 2.2;
            return animeFinished({
                targets: p,
                opacity: [0, 1],
                translateX: [fromX, 0],
                rotate: [rot, rot * 0.35],
                duration: 780,
                delay: i * 70,
                easing: 'easeOutExpo'
            });
        });
        await Promise.all(fanAnims);
        fanPages.forEach(p => {
            p.style.opacity = '';
            p.style.transform = '';
        });

        // Giữ lá thư đến khi hết bài — mới thu về tim / sang scene 9
        await sleepMs(800);
        if (token !== letterTypingToken) return;
        await waitForChiYeuMusicEnd(token);
        if (token !== letterTypingToken) return;

        await collapseScene8ToHeart(token);
        if (token !== letterTypingToken) return;
        if (current === si6 && !isPaused) goToScene(si6 + 1);
    }

    /** Chờ hết đúng bài Chỉ Yêu Mình Em trước khi rời scene 8 */
    function waitForChiYeuMusicEnd(token) {
        const audio = sceneMusicEl();
        if (!audio) return Promise.resolve();

        const isChiYeuTrack = () => {
            if (sceneMusicTrack === CHI_YEU.file) return true;
            const src = decodeURIComponent(audio.currentSrc || audio.src || '');
            return src.includes(CHI_YEU.file);
        };

        const nearlyDone = () =>
            audio.ended ||
            (Number.isFinite(audio.duration) &&
                audio.duration > 0 &&
                audio.currentTime >= audio.duration - 0.2);

        // Đã hết (hoặc không còn đúng bài) → đi tiếp luôn
        if (!isChiYeuTrack() || nearlyDone()) return Promise.resolve();

        return new Promise(resolve => {
            let settled = false;
            const finish = () => {
                if (settled) return;
                settled = true;
                audio.removeEventListener('ended', onEnded);
                clearInterval(pollId);
                resolve();
            };
            const onEnded = () => {
                if (isChiYeuTrack() || audio.ended) finish();
            };
            audio.addEventListener('ended', onEnded);
            const pollId = setInterval(() => {
                if (token !== letterTypingToken || current !== si6) {
                    finish();
                    return;
                }
                if (!isChiYeuTrack() || nearlyDone()) finish();
            }, 350);
        });
    }

    async function collapseScene8ToHeart(token) {
        if (token !== letterTypingToken) return;
        scene.classList.add('is-collapsing');
        const desk = finalPhase ? finalPhase.querySelector('#letter-desk') : null;
        const grid = scene.querySelector('#memory-grid');
        const heart = heartStage;
        const cx = innerWidth * 0.5;
        const cy = innerHeight * 0.46;

        PETAL_SYSTEM.burst(cx, cy, 28, 3.4);
        PETAL_SYSTEM.setWind(0.08);

        const flyToCenter = (el, extra = {}) => {
            if (!el) return Promise.resolve();
            const r = el.getBoundingClientRect();
            const dx = cx - (r.left + r.width / 2);
            const dy = cy - (r.top + r.height / 2);
            return animeFinished({
                targets: el,
                translateX: dx,
                translateY: dy,
                scale: extra.scale ?? 0.08,
                opacity: [1, 0],
                rotate: extra.rotate ?? 0,
                filter: ['blur(0px)', 'blur(10px)'],
                duration: extra.duration ?? 1400,
                delay: extra.delay ?? 0,
                easing: 'easeInCubic'
            });
        };

        await Promise.all([
            flyToCenter(desk, { scale: 0.06, rotate: -12, duration: 1500 }),
            flyToCenter(grid, { scale: 0.05, rotate: 8, duration: 1450, delay: 80 }),
            flyToCenter(heart, { scale: 1.35, rotate: 0, duration: 1600, delay: 120 }).then(() => {
                if (!heart || token !== letterTypingToken) return;
                return animeFinished({
                    targets: heart,
                    scale: [1.35, 0.2],
                    opacity: [1, 0],
                    duration: 700,
                    easing: 'easeInQuad'
                });
            })
        ]);
    }

    async function startLetterTyping() {
        if (!finalPhase) return;
        const token = ++letterTypingToken;
        const desk = finalPhase.querySelector('#letter-desk');
        if (!desk) return;

        desk.classList.remove('is-open', 'is-fanning');
        scene.classList.remove('letter-open', 'letter-fanning');

        // Đợi layout final-phase ổn định rồi đo khung → tách N tờ
        await sleepMs(80);
        if (token !== letterTypingToken) return;
        const pages = buildLetterPages(desk);
        if (!pages.length) return;

        for (let i = 0; i < pages.length; i++) {
            if (token !== letterTypingToken) return;
            if (i > 0) {
                await sleepMs(700);
                if (token !== letterTypingToken) return;
                await flipLetterPage(pages[i - 1], pages[i], token);
                if (token !== letterTypingToken) return;
            }
            await typePage(pages[i], token);
            if (token !== letterTypingToken) return;
        }
        await openAllLetters(token, pages);
    }

    // Hết nhạc → hiện đoạn kết ngay (không loop)
    const audio = sceneMusicEl();
    if (audio) {
        audio.loop = false;
        musicEndFn = () => startClosingLetter();
        audio.addEventListener('ended', musicEndFn);
    }

    lyricRaf = requestAnimationFrame(syncLyricClock);

    cleanups[si6] = () => {
        photosRunning = false;
        finalStarted = true;
        finalFxRunning = false;
        orbitRunning = false;
        if (lyricRaf) cancelAnimationFrame(lyricRaf);
        lyricRaf = null;
        if (finalFxRaf) cancelAnimationFrame(finalFxRaf);
        finalFxRaf = null;
        if (orbitRaf) cancelAnimationFrame(orbitRaf);
        orbitRaf = null;
        if (audio && musicEndFn) audio.removeEventListener('ended', musicEndFn);
        if (startFinalFx._resize) window.removeEventListener('resize', startFinalFx._resize);
        stopVoice();
        scene.classList.remove('cyme-active', 'is-final', 'has-lyric', 'cyme-neon-kick', 'letter-open', 'letter-fanning', 'is-collapsing');
        scene.style.removeProperty('--cyme-beat');
        moodClasses.forEach(c => scene.classList.remove(c));
        cards.forEach(c => c.classList.remove('is-lyric-focus', 'cyme-thump'));
        clickFns.forEach(([c, fn]) => c.removeEventListener('click', fn));
        ['.cyme-head', '#cyme-intro', '.s4-hint'].forEach(sel => {
            const el = scene.querySelector(sel);
            if (el) {
                el.style.visibility = '';
                el.style.opacity = '';
            }
        });
        if (memoryPhase) {
            memoryPhase.hidden = false;
            memoryPhase.style.opacity = '';
        }
        if (mainEl) mainEl.textContent = '';
        if (subEl) subEl.textContent = '';
        if (orbitEl) orbitEl.innerHTML = '';
        if (frameEl) frameEl.innerHTML = '';
        if (heartStage) {
            anime.remove(heartStage);
            heartStage.style.opacity = '';
            heartStage.style.transform = '';
            heartStage.style.filter = '';
        }
        if (finalCanvas) {
            const ctx = finalCanvas.getContext('2d');
            ctx && ctx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
        }
        document.querySelectorAll('#scene-8 .photo-flip').forEach(flip => {
            flip.querySelectorAll('img').forEach((img, j) => img.classList.toggle('is-active', j === 0));
        });
        if (memoryPhase) { memoryPhase.hidden = false; memoryPhase.style.opacity = ''; memoryPhase.style.transform = ''; }
        const memGrid = scene.querySelector('#memory-grid');
        if (memGrid) {
            anime.remove(memGrid);
            memGrid.style.opacity = '';
            memGrid.style.transform = '';
            memGrid.style.filter = '';
        }
        if (karaokeBox) { karaokeBox.style.opacity = ''; karaokeBox.style.pointerEvents = ''; }
        letterTypingToken += 1;
        if (finalPhase) {
            finalPhase.hidden = true;
            finalPhase.style.display = '';
            finalPhase.style.opacity = '';
            finalPhase.style.width = '';
            finalPhase.style.maxWidth = '';
            const desk = finalPhase.querySelector('#letter-desk');
            if (desk) {
                anime.remove(desk);
                desk.classList.remove('is-open', 'is-fanning');
                desk.removeAttribute('data-page-count');
                desk.removeAttribute('data-fan-count');
                desk.innerHTML = '';
                desk.style.opacity = '';
                desk.style.transform = '';
                desk.style.filter = '';
            }
        }
    };
}

// ===== SCENE 9: FINALE — trái tim đập theo nhạc =====
function enter9() {
    const si9 = current;
    const scene = document.getElementById('scene-9');
    if (!scene) return;

    const wrap = document.getElementById('finale-heart-wrap');
    const stage = document.getElementById('finale-heart-stage');
    const canvas = document.getElementById('finale-canvas');
    const askBox = document.getElementById('finale-ask');
    const label = document.getElementById('finale-label');
    const title = document.getElementById('finale-title');
    const hook = document.getElementById('finale-hook');
    const sub = document.getElementById('finale-sub');
    const lyricMain = document.getElementById('finale-lyric-main');
    const lyricSub = document.getElementById('finale-lyric-sub');
    const karaoke = document.getElementById('finale-karaoke');

    const MOODS = ['mood-shy', 'mood-brave', 'mood-ask', 'mood-tender', 'mood-confess', 'mood-play', 'mood-longing'];
    let fxRaf = null;
    let running = true;
    let t0 = performance.now();
    let lastLyricIdx = -1;
    let lyricsFrozen = false;

    function setMood(mood) {
        scene.classList.remove(...MOODS);
        if (mood) scene.classList.add('mood-' + mood);
        scene.classList.toggle('is-asking', mood === 'ask' || mood === 'confess');
    }

    function showLyric(cue) {
        if (!cue) return;
        setMood(cue.mood);
        if (karaoke) karaoke.style.opacity = '1';
        if (lyricMain) {
            anime.remove(lyricMain);
            lyricMain.textContent = cue.line;
            lyricMain.style.opacity = '1';
            anime({
                targets: lyricMain,
                opacity: [0, 1],
                translateY: [12, 0],
                duration: 420,
                easing: 'easeOutCubic'
            });
        }
        if (lyricSub) {
            anime.remove(lyricSub);
            lyricSub.textContent = cue.sub || '';
            lyricSub.style.opacity = '0.95';
            anime({
                targets: lyricSub,
                opacity: [0, 0.95],
                translateY: [8, 0],
                duration: 480,
                delay: 60,
                easing: 'easeOutCubic'
            });
        }
        if (cue.mood === 'confess' && hook) {
            hook.textContent = 'Làm người yêu anh nhé?';
            scene.classList.add('is-asking');
        } else if (cue.mood === 'ask' && title) {
            title.textContent = 'Bé Bơ ơi';
        }
        if (cue.t >= (LAM_NGUOI_YEU.cues.ask || 181) && hook) {
            hook.textContent = 'Làm người yêu anh nhé?';
            if (label) label.textContent = 'Anh đang chờ câu trả lời của bé…';
            if (title) title.textContent = 'Ý em sao?';
        }
    }

    function getConfessMusicTime() {
        const a = sceneMusicEl();
        if (!a || !Number.isFinite(a.currentTime)) return null;
        const src = decodeURIComponent(a.currentSrc || a.src || '');
        const file = LAM_NGUOI_YEU.file;
        if (src.includes(file) || sceneMusicTrack === file) return a.currentTime;
        if (current === si9 && sceneMusicIdx === si9 && !a.paused) return a.currentTime;
        return null;
    }

    function syncConfessionLyrics() {
        if (!running || isPaused || lyricsFrozen) return;
        let mt = getConfessMusicTime();
        if (mt == null) {
            const a = sceneMusicEl();
            if (a && current === si9 && !a.paused && Number.isFinite(a.currentTime)) mt = a.currentTime;
            else return;
        }
        const lead = LAM_NGUOI_YEU.lyricLead || 0;
        let idx = -1;
        for (let i = 0; i < LAM_NGUOI_YEU.lyrics.length; i++) {
            if (mt + lead >= LAM_NGUOI_YEU.lyrics[i].t) idx = i;
        }
        if (idx >= 0 && idx !== lastLyricIdx) {
            lastLyricIdx = idx;
            const cue = LAM_NGUOI_YEU.lyrics[idx];
            showLyric(cue);
            if (idx === LAM_NGUOI_YEU.lyrics.length - 1) {
                PETAL_SYSTEM.burst(innerWidth * 0.5, innerHeight * 0.42, 8, 2.2);
            } else if (cue.mood === 'confess' && (idx === 0 || LAM_NGUOI_YEU.lyrics[idx - 1]?.mood !== 'confess')) {
                PETAL_SYSTEM.burst(innerWidth * 0.5, innerHeight * 0.48, 5, 1.6);
            }
        }
    }

    const sparks = Array.from({ length: 14 }, () => ({
        x: 0.35 + Math.random() * 0.3,
        y: 0.28 + Math.random() * 0.36,
        r: 0.5 + Math.random() * 1.2,
        a: 0.12 + Math.random() * 0.28,
        sp: 0.12 + Math.random() * 0.35,
        ph: Math.random() * Math.PI * 2
    }));

    let stageCenter = { cx: 0, cy: 0, w: 280 };
    let canvasDpr = 1;

    function cacheStageCenter() {
        if (!stage) return;
        const r = stage.getBoundingClientRect();
        stageCenter = {
            cx: r.left + r.width / 2,
            cy: r.top + r.height * 0.55,
            w: r.width || 280
        };
    }

    function resizeFinaleCanvas() {
        if (!canvas) return;
        canvasDpr = Math.min(devicePixelRatio || 1, 1.25);
        canvas.width = Math.floor(innerWidth * canvasDpr);
        canvas.height = Math.floor(innerHeight * canvasDpr);
        canvas.style.width = innerWidth + 'px';
        canvas.style.height = innerHeight + 'px';
        cacheStageCenter();
    }

    const finaleCtx = canvas ? canvas.getContext('2d', { alpha: true }) : null;

    function tickFinale() {
        if (!running) return;
        fxRaf = requestAnimationFrame(tickFinale);
        if (isPaused) {
            scene.style.setProperty('--finale-beat', '0');
            return;
        }

        const now = performance.now();
        const audio = sceneMusicEl();
        const musicLive = isSceneMusicLive(LAM_NGUOI_YEU.file);
        // Nhạc tắt / pause / hết bài → tim đứng, không fallback đồng hồ
        const beat = musicLive ? musicBeatEnvelopeFrom(audio.currentTime, LAM_NGUOI_YEU) : 0;

        scene.style.setProperty('--finale-beat', beat.toFixed(3));

        if (!canvas || !finaleCtx) return;
        const ctx = finaleCtx;
        const dpr = canvasDpr;
        const w = canvas.width;
        const h = canvas.height;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, w, h);

        const cx = stageCenter.cx * dpr;
        const cy = stageCenter.cy * dpr;
        const glowR = stageCenter.w * 0.42 * dpr * (1 + beat * 0.35);
        const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
        bloom.addColorStop(0, `rgba(255, 160, 205, ${0.1 + beat * 0.22})`);
        bloom.addColorStop(0.55, `rgba(255, 70, 140, ${0.04 + beat * 0.08})`);
        bloom.addColorStop(1, 'rgba(255, 40, 120, 0)');
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
        ctx.fill();

        for (const s of sparks) {
            const tw = 0.4 + 0.6 * Math.abs(Math.sin(now * 0.0018 * s.sp + s.ph));
            const ox = (Math.sin(now * 0.0007 + s.ph) * 0.02) * w;
            const oy = (Math.cos(now * 0.00055 + s.ph) * 0.015) * h;
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 200, 230, ${s.a * tw * (0.55 + beat * 0.55)})`;
            ctx.arc(s.x * w + ox, s.y * h + oy, s.r * dpr * (1 + beat * 0.35), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    resizeFinaleCanvas();
    window.addEventListener('resize', resizeFinaleCanvas);
    fxRaf = requestAnimationFrame(tickFinale);
    const lyricTimer = setInterval(syncConfessionLyrics, 80);
    const audioEl = sceneMusicEl();
    const onTimeLyric = () => syncConfessionLyrics();
    if (audioEl) audioEl.addEventListener('timeupdate', onTimeLyric);

    PETAL_SYSTEM.setWind(0.05);
    PETAL_SYSTEM.burst(innerWidth * 0.5, innerHeight * 0.45, 8, 2.2);

    if (wrap) {
        wrap.style.opacity = '0';
        wrap.style.transform = 'scale(0.78)';
    }
    [label, title, hook, sub, lyricMain, lyricSub, askBox, karaoke].forEach(el => {
        if (el) el.style.opacity = '0';
    });
    if (lyricMain) lyricMain.textContent = '';
    if (lyricSub) lyricSub.textContent = '';
    if (label) label.textContent = 'Anh có một điều muốn hỏi bé…';
    if (title) title.textContent = 'Bé Bơ ơi';
    if (hook) hook.textContent = 'Làm người yêu anh nhé?';
    setMood('shy');
    scene.style.setProperty('--finale-beat', '0');

    anime({
        targets: wrap,
        opacity: [0, 1],
        scale: [0.78, 1],
        duration: 1200,
        easing: 'easeOutExpo',
        complete: () => {
            scene.classList.add('is-bloom');
            if (wrap) {
                // Giữ opacity:1 — đừng clear về '' kẻo CSS/reset làm tim biến mất
                wrap.style.opacity = '1';
                wrap.style.transform = 'none';
            }
            cacheStageCenter();
            PETAL_SYSTEM.burst(innerWidth * 0.5, innerHeight * 0.48, 6, 1.8);
        }
    });

    anime({
        targets: askBox,
        opacity: [0, 1],
        translateY: [18, 0],
        duration: 1000,
        delay: 700,
        easing: 'easeOutCubic'
    });
    anime({
        targets: [label, title, hook],
        opacity: [0, 1],
        translateY: [16, 0],
        delay: anime.stagger(160, { start: 900 }),
        duration: 900,
        easing: 'easeOutCubic'
    });
    anime({
        targets: karaoke,
        opacity: [0, 1],
        duration: 560,
        delay: 500,
        easing: 'easeOutSine',
        complete: () => {
            if (karaoke) karaoke.style.opacity = '1';
            syncConfessionLyrics();
        }
    });
    anime({
        targets: sub,
        opacity: [0, 1],
        translateY: [14, 0],
        duration: 900,
        delay: 1400,
        easing: 'easeOutCubic'
    });

    const audio = sceneMusicEl();
    let onMusicEnd = null;
    if (audio) {
        audio.loop = false;
        if (sceneMusicTrack === LAM_NGUOI_YEU.file ||
            decodeURIComponent(audio.currentSrc || audio.src || '').includes(LAM_NGUOI_YEU.file)) {
            /* keep currentTime */
        } else {
            try { audio.currentTime = 0; } catch (_) { /* ignore */ }
        }
        onMusicEnd = () => {
            lyricsFrozen = true;
            const last = LAM_NGUOI_YEU.lyrics[LAM_NGUOI_YEU.lyrics.length - 1];
            showLyric(last || {
                mood: 'ask',
                line: 'Ý em sao… ý em sao?',
                sub: 'Bé Bơ ơi — làm người yêu anh nhé?'
            });
            if (label) label.textContent = 'Anh đang chờ câu trả lời của bé…';
            if (title) title.textContent = 'Ý em sao?';
            if (hook) hook.textContent = 'Làm người yêu anh nhé?';
            scene.classList.add('is-asking');
            PETAL_SYSTEM.burst(innerWidth * 0.5, innerHeight * 0.45, 10, 2.2);
            // Hết bài = kết thúc: tắt nhạc, tim dừng — về màn rabbit (nút Play)
            try {
                audio.loop = false;
                audio.pause();
            } catch (_) { /* ignore */ }
            scene.style.setProperty('--finale-beat', '0');
            setSceneTimeout(si9, () => {
                if (current === si9) returnToLoader();
            }, 2200);
        };
        audio.addEventListener('ended', onMusicEnd);
    }

    cleanups[si9] = () => {
        running = false;
        lyricsFrozen = true;
        clearInterval(lyricTimer);
        if (audioEl) audioEl.removeEventListener('timeupdate', onTimeLyric);
        if (fxRaf) cancelAnimationFrame(fxRaf);
        window.removeEventListener('resize', resizeFinaleCanvas);
        scene.classList.remove('is-bloom', 'is-asking', ...MOODS);
        scene.style.removeProperty('--finale-beat');
        if (stage) stage.style.transform = '';
        if (wrap) {
            anime.remove(wrap);
            wrap.style.opacity = '0';
            wrap.style.transform = '';
        }
        [label, title, hook, sub, lyricMain, lyricSub, askBox, karaoke].forEach(el => {
            if (!el) return;
            anime.remove(el);
            el.style.opacity = '';
            el.style.transform = '';
        });
        if (lyricMain) lyricMain.textContent = '';
        if (lyricSub) lyricSub.textContent = '';
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        if (audio) {
            if (onMusicEnd) audio.removeEventListener('ended', onMusicEnd);
            audio.loop = false;
            // Không giữ phát khi rời scene 9 (kể cả lúc về đầu)
            if (sceneMusicTrack === LAM_NGUOI_YEU.file ||
                decodeURIComponent(audio.currentSrc || audio.src || '').includes(LAM_NGUOI_YEU.file)) {
                try { audio.pause(); } catch (_) { /* ignore */ }
            }
        }
    };
}

// ===== SCENE 4: SINH NHẬT — heart letters + neon + photo frames =====
function enter7() {
    const si7 = current;
    const scene = document.getElementById('scene-4');
    const cCanvas = document.getElementById('confetti-canvas');
    const ctx = cCanvas.getContext('2d');
    cCanvas.width = innerWidth;
    cCanvas.height = innerHeight;
    scene.classList.remove('bday-orbit-on');

    const palette = ['#ff6eb4', '#ff9ecd', '#ffd28a', '#7ef0d8', '#ff7a9a', '#ffe0f0', '#ffb347'];
    const pieces = Array.from({ length: 100 }, () => ({
        x: Math.random() * cCanvas.width,
        y: -20 - Math.random() * 260,
        w: Math.random() * 8 + 3,
        h: Math.random() * 12 + 5,
        vy: Math.random() * 2.6 + 1.1,
        vx: (Math.random() - 0.5) * 1.4,
        rot: Math.random() * 360,
        rspd: (Math.random() - 0.5) * 7,
        color: palette[Math.floor(Math.random() * palette.length)],
        kind: Math.random() > 0.72 ? 'heart' : 'rect'
    }));
    const cpetals = Array.from({ length: 28 }, () => ({
        x: Math.random() * cCanvas.width,
        y: -10 - Math.random() * 140,
        vy: Math.random() * 1.5 + 0.7,
        vx: (Math.random() - 0.5) * 1.1,
        rot: Math.random() * Math.PI * 2,
        rspd: (Math.random() - 0.5) * 0.04,
        w: Math.random() * 12 + 7,
        h: Math.random() * 16 + 10,
        color: ['#ffb7c5', '#ff9aad', '#ffccd5', '#ffe0eb'][Math.floor(Math.random() * 4)],
        alpha: 0.75
    }));

    let running = true;
    function drawC() {
        if (!running) return;
        if (isExperiencePaused()) {
            requestAnimationFrame(drawC);
            return;
        }
        ctx.clearRect(0, 0, cCanvas.width, cCanvas.height);
        pieces.forEach(p => {
            p.y += p.vy;
            p.x += p.vx;
            p.rot += p.rspd;
            if (p.y > cCanvas.height + 12) {
                p.y = -16;
                p.x = Math.random() * cCanvas.width;
            }
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rot * Math.PI) / 180);
            ctx.fillStyle = p.color;
            if (p.kind === 'heart') {
                const s = Math.max(p.w, 5);
                ctx.beginPath();
                ctx.moveTo(0, s * 0.3);
                ctx.bezierCurveTo(s * 0.5, -s * 0.3, s * 0.9, s * 0.2, 0, s * 0.95);
                ctx.bezierCurveTo(-s * 0.9, s * 0.2, -s * 0.5, -s * 0.3, 0, s * 0.3);
                ctx.fill();
            } else {
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            }
            ctx.restore();
        });
        cpetals.forEach(p => {
            p.y += p.vy;
            p.x += p.vx;
            p.rot += p.rspd;
            if (p.y > cCanvas.height + 20) {
                p.y = -20;
                p.x = Math.random() * cCanvas.width;
            }
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.moveTo(0, p.h * 0.5);
            ctx.bezierCurveTo(p.w * 0.55, p.h * 0.22, p.w * 0.62, -p.h * 0.12, 0, -p.h * 0.5);
            ctx.bezierCurveTo(-p.w * 0.62, -p.h * 0.12, -p.w * 0.55, p.h * 0.22, 0, p.h * 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
        ctx.globalAlpha = 1;
        requestAnimationFrame(drawC);
    }
    drawC();

    // --- Heart parametric points ---
    function heartPoint(t, scale) {
        // classic heart curve
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        return { x: x * scale, y: y * scale };
    }

    const heartEl = document.getElementById('bday-heart');
    const chips = [];
    const chipChars = ['♥', '♡', '✦', '❀', '🥑', '♥', '✧', '♡', '♥', '✦', '❀', '♡'];
    const chipColors = ['#ff6eb4', '#ff9ecd', '#ffd28a', '#9bc85a', '#ff8fab', '#ffe0f0'];
    const heartScale = 6.1;
    const heartYShift = -32; // kéo tim lên, đuôi không chèn chữ
    if (heartEl) {
        heartEl.innerHTML = '';
        const N = 36;
        for (let i = 0; i < N; i++) {
            const t = (i / N) * Math.PI * 2;
            const pt = heartPoint(t, heartScale);
            const span = document.createElement('span');
            span.className = 'heart-chip';
            span.textContent = chipChars[i % chipChars.length];
            span.style.color = chipColors[i % chipColors.length];
            span.style.fontSize = `${0.95 + (i % 3) * 0.15}rem`;
            heartEl.appendChild(span);
            chips.push({ el: span, tx: pt.x, ty: pt.y + heartYShift });
        }
    }

    chips.forEach((c, i) => {
        const sx = (Math.random() - 0.5) * 220;
        const sy = (Math.random() - 0.5) * 180;
        c.el.style.opacity = '0';
        anime({
            targets: c.el,
            opacity: [0, 1],
            translateX: [sx, c.tx],
            translateY: [sy, c.ty],
            scale: [0.35, 1],
            rotate: [anime.random(-40, 40), anime.random(-12, 12)],
            delay: 280 + i * 26,
            duration: 1100,
            easing: 'easeOutElastic(1, .72)'
        });
    });

    // Chữ chạy dọc đường cong trái tim
    const orbitEl = document.getElementById('bday-orbit');
    const orbitChars = [];
    let orbitPhase = 0;
    let orbitRaf = 0;
    if (orbitEl) {
        orbitEl.innerHTML = '';
        const orbitStr = '✦ Anh thương Bé Bơ ✦ Happy Birthday ✦ Yêu bé nhiều ✦ ';
        [...orbitStr].forEach(ch => {
            const s = document.createElement('span');
            s.className = 'orbit-char';
            s.textContent = ch;
            orbitEl.appendChild(s);
            orbitChars.push(s);
        });
    }
    function tickOrbit() {
        if (!running) return;
        if (!isExperiencePaused()) {
            // Tim sinh nhật đập theo nhạc opening; nhạc tắt → đứng
            const mt = getTrustedMusicTime(OPENING_BEAT.file);
            const pulse = (mt != null && isSceneMusicLive(OPENING_BEAT.file))
                ? musicBeatEnvelopeFrom(mt, OPENING_BEAT)
                : 0;
            scene.style.setProperty('--bday-beat', pulse.toFixed(3));
            if (orbitChars.length) {
                orbitPhase = (orbitPhase + 0.0018 + pulse * 0.001) % 1;
                const n = orbitChars.length;
                const scale = (heartScale + 2.15) * (1 + pulse * 0.04);
                for (let i = 0; i < n; i++) {
                    const t = ((i / n) + orbitPhase) * Math.PI * 2;
                    const p0 = heartPoint(t, scale);
                    const p1 = heartPoint(t + 0.04, scale);
                    const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
                    orbitChars[i].style.transform =
                        `translate(${p0.x}px, ${p0.y + heartYShift}px) rotate(${ang}rad)`;
                }
            }
            if (heartEl) {
                heartEl.style.transform = `scale(${1 + pulse * 0.12})`;
            }
        } else {
            scene.style.setProperty('--bday-beat', '0');
        }
        orbitRaf = requestAnimationFrame(tickOrbit);
    }

    setSceneTimeout(si7, () => {
        scene.classList.add('bday-orbit-on');
        tickOrbit();
        PETAL_SYSTEM.burst(innerWidth * 0.5, innerHeight * 0.28, 10, 2.6);
    }, 1800);

    document.querySelectorAll('#hb-title .hb-word').forEach(wordEl => {
        const word = wordEl.getAttribute('data-word') || '';
        wordEl.innerHTML = '';
        [...word].forEach(ch => {
            const s = document.createElement('span');
            s.className = 'hb-letter' + (ch === ' ' ? ' is-space' : '');
            s.textContent = ch === ' ' ? '\u00a0' : ch;
            wordEl.appendChild(s);
        });
    });
    const hbLetters = document.querySelectorAll('#hb-title .hb-letter');
    document.getElementById('hb-title').style.opacity = '1';

    setSceneTimeout(si7, () => {
        // Chỉ “nảy” intro khi nhạc opening đã nghe được — tránh tim đập lúc chưa có tiếng
        if (!isSceneMusicLive(OPENING_BEAT.file)) return;
        anime({
            targets: '#bday-heart .heart-chip',
            translateY: (el, i) => chips[i].ty + anime.random(-8, 8),
            scale: [
                { value: 1.2, duration: 280 },
                { value: 1, duration: 320 }
            ],
            delay: anime.stagger(16),
            easing: 'easeInOutSine'
        });
        PETAL_SYSTEM.setWind(-0.2);
        PETAL_SYSTEM.burst(innerWidth / 2, innerHeight * 0.32, 14, 3);
        setSceneTimeout(si7, () => PETAL_SYSTEM.setWind(0.1), 1600);
    }, 3200);

    setSceneTimeout(si7, () => {
        anime({
            targets: hbLetters,
            opacity: [0, 1],
            translateY: [36, 0],
            rotate: [anime.stagger([-14, 14]), 0],
            scale: [
                { value: 0.4, duration: 0 },
                { value: 1.18, duration: 400, easing: 'easeOutBack' },
                { value: 1, duration: 260 }
            ],
            delay: anime.stagger(38, { start: 80 }),
            easing: 'easeOutExpo'
        });
    }, 4000);

    anime.timeline({ easing: 'easeOutExpo' })
        .add({ targets: '#scene-4 .bday-label', opacity: [0, 1], duration: 600, delay: 80 })
        .add({
            targets: '#scene-4 .bday-cake-in-heart',
            opacity: [0, 1],
            scale: [0.2, 1],
            rotate: ['-10deg', '0deg'],
            easing: 'easeOutElastic(1, .65)',
            duration: 1200
        }, '-=100')
        .add({ targets: '#bday-neon-line', opacity: [0, 1], translateY: [12, 0], duration: 700, delay: 2800 })
        .add({
            targets: '.bday-photos .bday-frame',
            opacity: [0, 1],
            translateY: [28, 0],
            scale: [0.9, 1],
            delay: anime.stagger(100),
            duration: 720,
            easing: 'easeOutBack',
            complete: () => {
                document.querySelectorAll('.bday-photos .bday-frame').forEach(f => f.classList.add('is-in'));
            }
        }, '-=100');

    // Xoay ảnh: dùng cả pool photo1–20, mỗi lần đổi 1 khung
    const BDAY_PHOTO_POOL = Array.from({ length: 20 }, (_, i) => `src/img/photo${i + 1}.jpg`);
    const BDAY_CAPTIONS = [
        'bé cười', 'khoảnh khắc', 'thương em', 'nhẹ nhàng', 'của anh', 'mãi nhớ',
        'dễ thương', 'rạng rỡ', 'bé bơ', 'yêu thương', 'ấm áp', 'hạnh phúc'
    ];
    const frames = Array.from(document.querySelectorAll('#scene-4 .bday-photos .bday-frame'));
    let photoCursor = 0;

    function visiblePhotoSrcs() {
        return new Set(
            frames.map(f => f.querySelector('img')?.getAttribute('src')).filter(Boolean)
        );
    }
    function nextPhotoSrc() {
        const visible = visiblePhotoSrcs();
        for (let n = 0; n < BDAY_PHOTO_POOL.length; n++) {
            const src = BDAY_PHOTO_POOL[photoCursor % BDAY_PHOTO_POOL.length];
            photoCursor++;
            if (!visible.has(src)) return src;
        }
        return BDAY_PHOTO_POOL[photoCursor++ % BDAY_PHOTO_POOL.length];
    }

    // Seed 6 ảnh khác nhau lúc vào scene
    frames.forEach((frame, i) => {
        const img = frame.querySelector('img');
        const cap = frame.querySelector('figcaption');
        if (!img) return;
        img.src = BDAY_PHOTO_POOL[i % BDAY_PHOTO_POOL.length];
        photoCursor = i + 1;
        if (cap) cap.textContent = BDAY_CAPTIONS[i % BDAY_CAPTIONS.length];
    });

    // Đung đưa liên tục; chỉ đổi ảnh đúng giữa nhịp nghiêng (is-swap)
    const SWAP_MS = 950;
    const SWAP_MID_MS = Math.round(SWAP_MS * 0.48);
    let swapIdx = 0;
    setSceneTimeout(si7, () => {
        setSceneInterval(si7, () => {
            if (!frames.length) return;
            const frame = frames[swapIdx % frames.length];
            swapIdx++;
            if (frame.classList.contains('is-swap')) return;
            const img = frame.querySelector('img');
            const cap = frame.querySelector('figcaption');
            if (!img) return;
            const nextSrc = nextPhotoSrc();
            const nextCap = BDAY_CAPTIONS[Math.floor(Math.random() * BDAY_CAPTIONS.length)];

            frame.classList.remove('is-in');
            frame.classList.add('is-swap');

            setSceneTimeout(si7, () => {
                if (current !== si7) return;
                img.style.opacity = '0';
                img.src = nextSrc;
                if (cap) cap.textContent = nextCap;
                requestAnimationFrame(() => {
                    img.style.opacity = '1';
                });
            }, SWAP_MID_MS);

            setSceneTimeout(si7, () => {
                if (current !== si7) return;
                frame.classList.remove('is-swap');
                frame.classList.add('is-in');
            }, SWAP_MS);
        }, 3200);
    }, 4200);

    // Lời chúc: gõ từng đoạn → giữ → xóa → đoạn tiếp (mỗi đoạn 1 lần)
    const wishLine = document.getElementById('bday-wish-line');
    const wishList = Array.from(document.querySelectorAll('#bday-wish-source p'))
        .map(p => (p.textContent || '').trim())
        .filter(Boolean);
    const TYPE_MS = 36;
    const HOLD_MS = 2400;
    const CLEAR_MS = 420;

    function typeWish(idx) {
        if (current !== si7 || !wishLine || idx >= wishList.length) return;
        const text = wishList[idx];
        const isLast = idx + 1 >= wishList.length;
        wishLine.textContent = '';
        wishLine.classList.add('is-typing');
        wishLine.style.opacity = '1';
        let ci = 0;

        function tick() {
            if (current !== si7) return;
            if (ci < text.length) {
                wishLine.textContent += text[ci++];
                setSceneTimeout(si7, tick, TYPE_MS);
                return;
            }
            wishLine.classList.remove('is-typing');
            setSceneTimeout(si7, () => {
                if (current !== si7) return;
                if (isLast) {
                    // Giữ lời chúc cuối → nghỉ nhịp → mới sang scene 5 (không cắt giữa bài/nội dung)
                    setSceneTimeout(si7, () => {
                        if (current === si7 && !isPaused) goToScene(si7 + 1);
                    }, SCENE4_AFTER_WISH_MS);
                    return;
                }
                anime({
                    targets: wishLine,
                    opacity: 0,
                    duration: CLEAR_MS,
                    easing: 'easeInSine',
                    complete: () => {
                        if (current !== si7) return;
                        wishLine.textContent = '';
                        typeWish(idx + 1);
                    }
                });
            }, HOLD_MS);
        }
        tick();
    }

    setSceneTimeout(si7, () => typeWish(0), 5200);

    PETAL_SYSTEM.setWind(0.12);
    setSceneTimeout(si7, () => PETAL_SYSTEM.burst(innerWidth * 0.25, innerHeight * 0.12, 8, 2.4), 900);
    setSceneTimeout(si7, () => PETAL_SYSTEM.burst(innerWidth * 0.75, innerHeight * 0.14, 8, 2.4), 1800);
    setSceneTimeout(si7, () => PETAL_SYSTEM.burst(innerWidth * 0.5, innerHeight * 0.55, 12, 3), 5600);

    cleanups[si7] = () => {
        running = false;
        if (orbitRaf) cancelAnimationFrame(orbitRaf);
        ctx.clearRect(0, 0, cCanvas.width, cCanvas.height);
        scene.classList.remove('bday-orbit-on');
        scene.style.removeProperty('--bday-beat');
        document.querySelectorAll('.bday-photos .bday-frame').forEach(f => {
            f.classList.remove('is-in', 'is-swap');
        });
        const orbit = document.getElementById('bday-orbit');
        if (orbit) orbit.innerHTML = '';
        const heart = document.getElementById('bday-heart');
        if (heart) {
            heart.innerHTML = '';
            heart.style.transform = '';
        }
    };
}
