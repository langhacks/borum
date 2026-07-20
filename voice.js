// 음성 재생 엔진: audio/<key>.<성별>.mp3 → audio/<key>.mp3 → Web Speech API(TTS) 순서로 재생 시도
const VoiceEngine = (() => {
    let gen = 0;            // 재생 세대 번호 — stop() 이후 늦게 도착한 콜백 무시용
    let currentAudio = null;
    let voiceGender = 'female';
    try { voiceGender = localStorage.getItem('voiceGender') || 'female'; } catch (e) {}

    // Web Speech API에는 성별 정보가 없어 목소리 이름으로 추정한다.
    // - Windows/macOS: 사람 이름 (David, Samantha, ...)
    // - Android(Google TTS): 변종 코드 (en-us-x-iol 등) — 커뮤니티에 알려진 성별 매핑 사용
    // 주의: "female"에 "male"이 포함되므로 여성 판정을 먼저 한다
    const FEMALE_HINT = /female|samantha|victoria|zira|susan|karen|hazel|jenny|aria|kate|serena|moira|tessa|allison|ava|x-sfg|x-iob|x-iog|x-tpc|x-tpf/i;
    const MALE_HINT = /male|david|daniel|alex|fred|george|james|guy|mark|tom|aaron|arthur|oliver|ryan|x-iol|x-iom|x-tpd/i;

    // 목소리 목록은 비동기 로딩되므로 미리 한 번 요청해 둔다 (voiceschanged 이후 완전해짐)
    if ('speechSynthesis' in window) {
        speechSynthesis.getVoices();
        speechSynthesis.addEventListener('voiceschanged', () => speechSynthesis.getVoices());
    }

    function pickVoice() {
        // Android는 lang을 en_US처럼 밑줄로 주기도 한다
        const voices = speechSynthesis.getVoices()
            .filter(v => v.lang && v.lang.replace('_', '-').toLowerCase().startsWith('en'));
        if (!voices.length) return null;
        // Android에서는 name이 비어 있거나 중복되고 voiceURI에만 변종 코드가 있는 경우가 있다
        const id = v => (v.name || '') + ' ' + (v.voiceURI || '');
        const isFemale = v => FEMALE_HINT.test(id(v));
        const isMale = v => !isFemale(v) && MALE_HINT.test(id(v));
        const want = voiceGender === 'male' ? isMale : isFemale;
        const usVoices = voices.filter(v => /en[-_]us/i.test(v.lang));
        return usVoices.find(want) || voices.find(want) || usVoices[0] || voices[0];
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
        // Android Chrome은 utterance.lang이 voice.lang과 다르면 지정한 voice를 무시하기도 한다
        if (voice) { u.voice = voice; u.lang = voice.lang; }
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
