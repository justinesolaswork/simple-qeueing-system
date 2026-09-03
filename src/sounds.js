import doorbellUrl from "./doorbell.mp3";

let ctx = null;
let buffer = null;
let bufferPromise = null;

function ensureCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

function ensureBuffer(c) {
  if (!bufferPromise) {
    bufferPromise = fetch(doorbellUrl)
      .then((r) => r.arrayBuffer())
      .then((data) => c.decodeAudioData(data))
      .then((buf) => (buffer = buf))
      .catch(() => (buffer = null));
  }
  return bufferPromise;
}

function playDoorbellOnce(c) {
  if (!buffer) return;
  const src = c.createBufferSource();
  src.buffer = buffer;
  src.connect(c.destination);
  src.start();
}

function playDoorbell() {
  const c = ensureCtx();
  if (!c) return;
  ensureBuffer(c).then(() => {
    playDoorbellOnce(c);
    setTimeout(() => playDoorbellOnce(c), 500);
  });
}

function clickSeek(c) {
  const t0 = c.currentTime;
  const o1 = c.createOscillator();
  const o2 = c.createOscillator();
  const g1 = c.createGain();
  const g2 = c.createGain();
  o1.type = "square";
  o1.frequency.value = 1400;
  g1.gain.value = 0.08;
  o2.type = "sine";
  o2.frequency.value = 1900;
  g2.gain.value = 0.05;
  o1.connect(g1);
  g1.connect(c.destination);
  o2.connect(g2);
  g2.connect(c.destination);
  o1.start(t0);
  o2.start(t0);
  o1.stop(t0 + 0.05);
  o2.stop(t0 + 0.05);
}

export function playCallSound() {
  playDoorbell();
}

export function playRecallSound() {
  playDoorbell();
}

export function playClickSound() {
  const c = ensureCtx();
  if (!c) return;
  clickSeek(c);
}
