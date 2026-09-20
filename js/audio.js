'use strict';

/* ============================================================
   audio.js — soft pentatonic chimes, synthesized with WebAudio
   (no sound files). Pentatonic only, so any note sequence is
   consonant; lullaby dynamics (STYLE-GUIDE §7).
   Owns: audioCtx, audioOutput, soundOn (toggled by ui.js).
   ============================================================ */

let audioCtx = null;
let audioOutput = null;
let soundOn = true;

const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // C D E G A C

/* Create/resume the context — must be called from a user gesture
   (browsers block autoplay); ui.js calls this on every pointerdown. */
function ensureAudio() {
  if (!audioCtx || audioCtx.state === 'closed') {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioOutput = audioCtx.createGain();
      audioOutput.gain.value = soundOn ? 1 : 0;
      audioOutput.connect(audioCtx.destination);
    } catch (e) {
      audioCtx = null;
      audioOutput = null;
    }
  }
  if (audioCtx && (audioCtx.state === 'suspended' || audioCtx.state === 'interrupted')) {
    // Safari can interrupt sound after leaving the app. A failed resume
    // must not swallow the touch; a later gesture can try again.
    try { audioCtx.resume().catch(() => {}); } catch (e) {}
  }
}

function toggleSound() {
  soundOn = !soundOn;
  // Notes already scheduled (including the arpeggio) share this output,
  // so the icon and audible sound agree as soon as the child mutes.
  if (audioOutput) audioOutput.gain.value = soundOn ? 1 : 0;
}

/* One soft music-box note: triangle wave, quick attack, long gentle decay. */
function chime(freq, when = 0, vol = 0.16, dur = 1.6) {
  if (!audioCtx || !audioOutput || !soundOn || audioCtx.state === 'closed') return;
  try {
    const t = audioCtx.currentTime + when;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(audioOutput);
    osc.start(t); osc.stop(t + dur + 0.1);
  } catch (e) {
    // Sound is optional: an unavailable audio device cannot stop a catch
    // or prevent the animation loop from scheduling its next frame.
  }
}

function catchSound()  { chime(PENTA[2]); chime(PENTA[4], 0.09, 0.10); }

function celebrateSound() {
  [0, 1, 2, 3, 4, 5].forEach(i => chime(PENTA[i], i * 0.16, 0.14, 2.0));
}
