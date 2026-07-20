# Audio Files

MP3 files placed here override TTS for the matching sentence. No code
change is needed — the player tries the MP3 first and falls back to the
Web Speech API when the file is missing.

## Naming convention

- Practice sentences: `<Pronoun>-<time>.mp3`
  - Pronoun: `I`, `You`, `He`, `She`, `It`, `We`, `They` (capitalized)
  - time: `now` or `then`
  - Examples: `I-now.mp3`, `They-then.mp3`
- Quiz sentences (full sentence with the answer filled in):
  `quiz-01.mp3` … `quiz-10.mp3`, numbered in `quizDatabase` order.

The sentence texts are listed in `../docs/sentences.md`.
