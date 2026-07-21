# Audio Files

MP3 files placed here override TTS for the matching sentence. No code
change is needed — the player tries the MP3 first and falls back to the
Web Speech API when the file is missing.

## Naming convention

Base keys:

- Practice sentences: `<Pronoun>-<time>`
  - Pronoun: `I`, `You`, `He`, `She`, `It`, `We`, `They` (capitalized)
  - time: `now` or `then`
- Quiz sentences (full sentence with the answer filled in):
  `quiz-01` … `quiz-10`, numbered in `quizDatabase` order.

Voice gender is encoded as a filename suffix, not an ID3 tag (the player
picks a file by URL without downloading it first). For each sentence the
player tries, in order:

1. `<key>.m.mp3` or `<key>.f.mp3` — matching the selected voice
   (👨 male / 👩 female toggle on the page)
2. `<key>.mp3` — gender-neutral fallback
3. TTS via the Web Speech API, best-effort matched to the selected gender

Examples: `I-now.m.mp3`, `I-now.f.mp3`, `They-then.mp3`, `quiz-03.f.mp3`.

## Current files

All 24 male files (`*.m.mp3`) were synthesized with edge-tts
(`en-US-ChristopherNeural`, rate -10%) because Android's built-in TTS
has no male English voice. To regenerate one:

    uv tool run edge-tts --voice en-US-ChristopherNeural --rate=-10% \
        --text "<sentence>" --write-media <key>.m.mp3

Female playback still uses device TTS (no `*.f.mp3` files yet).

The sentence texts are listed in `../docs/sentences.md`.
