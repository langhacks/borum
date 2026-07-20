// 음성 재생 엔진: audio/<key>.<성별>.mp3 → audio/<key>.mp3 → Web Speech API(TTS) 순서로 재생 시도
const VoiceEngine = (() => {
    let gen = 0;            // 재생 세대 번호 — stop() 이후 늦게 도착한 콜백 무시용
    let currentAudio = null;
    let voiceGender = 'female';
    try { voiceGender = localStorage.getItem('voiceGender') || 'female'; } catch (e) {}

    // Web Speech API에는 성별 정보가 없어 잘 알려진 목소리 이름으로 추정
    // 주의: "female"에 "male"이 포함되므로 여성 판정을 먼저 한다
    const FEMALE_NAMES = /female|samantha|victoria|zira|susan|karen|hazel|jenny|aria|kate|serena|moira|tessa|allison|ava/i;
    const MALE_NAMES = /male|david|daniel|alex|fred|george|james|guy|mark|tom|aaron|arthur|oliver|ryan/i;

    // 목소리 목록은 비동기 로딩되므로 미리 한 번 요청해 둔다
    if ('speechSynthesis' in window) speechSynthesis.getVoices();

    function pickVoice() {
        const voices = speechSynthesis.getVoices().filter(v => v.lang && v.lang.startsWith('en'));
        if (!voices.length) return null;
        const isFemale = v => FEMALE_NAMES.test(v.name);
        const isMale = v => !isFemale(v) && MALE_NAMES.test(v.name);
        return voices.find(voiceGender === 'male' ? isMale : isFemale) || voices[0];
    }

    function stop() {
        gen++;
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        if (window.speechSynthesis) speechSynthesis.cancel();
    }

    function speak(text, onEnd, myGen) {
        if (myGen === undefined) { stop(); myGen = gen; }
        if (!('speechSynthesis' in window)) {
            if (onEnd) onEnd();
            return;
        }
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.rate = 0.9;
        const voice = pickVoice();
        if (voice) u.voice = voice;
        u.onend = u.onerror = () => {
            if (gen === myGen && onEnd) onEnd();
        };
        speechSynthesis.speak(u);
    }

    function tryFiles(urls, text, onEnd, myGen) {
        if (gen !== myGen) return;
        if (!urls.length) {
            speak(text, onEnd, myGen);
            return;
        }
        const audio = new Audio(urls[0]);
        let failed = false;
        const fail = () => {
            if (failed || gen !== myGen) return;
            failed = true;
            currentAudio = null;
            tryFiles(urls.slice(1), text, onEnd, myGen);
        };
        audio.onended = () => {
            if (gen === myGen && onEnd) onEnd();
        };
        audio.onerror = fail;
        currentAudio = audio;
        audio.play().catch(fail);
    }

    // key가 null이면 바로 TTS. onEnd는 성공/실패와 무관하게 정확히 한 번 호출됨(중단 시 제외).
    function play(key, text, onEnd) {
        stop();
        const myGen = gen;
        if (!key) {
            speak(text, onEnd, myGen);
            return;
        }
        const suffix = voiceGender === 'male' ? 'm' : 'f';
        tryFiles(['audio/' + key + '.' + suffix + '.mp3', 'audio/' + key + '.mp3'], text, onEnd, myGen);
    }

    function setGender(g) {
        voiceGender = g === 'male' ? 'male' : 'female';
        try { localStorage.setItem('voiceGender', voiceGender); } catch (e) {}
    }

    function getGender() { return voiceGender; }

    return { play, speak, stop, setGender, getGender };
})();
