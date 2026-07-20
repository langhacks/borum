// 음성 재생 엔진: audio/<key>.mp3 가 있으면 먼저 재생하고, 없으면 Web Speech API(TTS)로 대체
const VoiceEngine = (() => {
    let gen = 0;            // 재생 세대 번호 — stop() 이후 늦게 도착한 콜백 무시용
    let currentAudio = null;

    function stop() {
        gen++;
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        if (window.speechSynthesis) speechSynthesis.cancel();
    }

    function speak(text, onEnd, myGen) {
        if (!('speechSynthesis' in window)) {
            if (onEnd) onEnd();
            return;
        }
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.rate = 0.9;
        u.onend = u.onerror = () => {
            if (gen === myGen && onEnd) onEnd();
        };
        speechSynthesis.speak(u);
    }

    // key가 null이면 바로 TTS. onEnd는 성공/실패와 무관하게 정확히 한 번 호출됨(중단 시 제외).
    function play(key, text, onEnd) {
        stop();
        const myGen = gen;
        if (!key) {
            speak(text, onEnd, myGen);
            return;
        }
        const audio = new Audio('audio/' + key + '.mp3');
        let fellBack = false;
        const fallback = () => {
            if (fellBack || gen !== myGen) return;
            fellBack = true;
            currentAudio = null;
            speak(text, onEnd, myGen);
        };
        audio.onended = () => {
            if (gen === myGen && onEnd) onEnd();
        };
        audio.onerror = fallback;
        currentAudio = audio;
        audio.play().catch(fallback);
    }

    return { play, speak, stop };
})();
