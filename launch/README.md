# Orbit launch materials

- `social-posts.md`: LinkedIn and X drafts. Not posted automatically.
- `narration.txt`: speech-only British-English script with user-confirmed electronics background.
- `delivery-notes.md`: performance direction and factual boundaries.
- `capture.py`: records the real local website using Chromium + Playwright.
- `render.py`: assembles source trims and scene labels into a silent H.264 review MP4.
- `narrate.py`: generates Pocket TTS narration from a private reference WAV using the official Python API. Syntax-checked only in this environment; model inference is blocked by network access.

The private voice reference, voice model, narration, raw footage and rendered MP4s are excluded from Git. Do not commit an HF token or voice embedding. Keep voice files in a separate private folder.

## Capture

Run `npm run dev` in the repository. Install Python Playwright and its Chromium/FFmpeg dependencies if missing. This environment uses `/usr/bin/chromium`; change the executable path for another OS. Set `ORBIT_MEDIA_DIR` to an output directory and run `python launch/capture.py`. The recording manifest stores source trims and scene titles. It is a silent visual review, not a voice-synchronised final video.

## Narration

In your existing authenticated Pocket TTS environment, run:

```sh
python launch/narrate.py --reference /path/to/private/raya.wav --output /path/to/private/orbit-narration
```

The reference should be a clean, single-speaker sample. The provided reference was extracted from the user-uploaded video at mono/24 kHz. The model must be downloaded and its access terms accepted where required. The cloud workspace cannot currently reach Hugging Face; model access on another computer does not transfer automatically.

Use the resulting audio at its original speed. Paragraph timings are real generated durations, not word-level caption alignment. Audition the voice, align and adjust footage to the actual speech, then create speech-aligned captions and the final mix. British wording alone does not guarantee British accent or intonation; check the generated performance.
