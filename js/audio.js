'use strict';

/* ============================================================
   audio.js — soft pentatonic chimes, synthesized with WebAudio
   (no sound files). Pentatonic only, so any note sequence is
   consonant; lullaby dynamics (STYLE-GUIDE §7).
   Owns: audioCtx, soundOn (toggled by ui.js).
   ============================================================ */

let audioCtx = null;
let soundOn = true;

const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // C D E G A C

/* Create/resume the context — must be called from a user gesture
   (browsers block autoplay); ui.js calls this on every pointerdown. */
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { audioCtx = null; }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

/* One soft music-box note: triangle wave, quick attack, long gentle decay. */
function chime(freq, when = 0, vol = 0.16, dur = 1.6) {
  if (!audioCtx || !soundOn) return;
  const t = audioCtx.currentTime + when;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t); osc.stop(t + dur + 0.1);
}

function catchSound()  { chime(PENTA[2]); chime(PENTA[4], 0.09, 0.10); }

function celebrateSound() {
  [0, 1, 2, 3, 4, 5].forEach(i => chime(PENTA[i], i * 0.16, 0.14, 2.0));
}
