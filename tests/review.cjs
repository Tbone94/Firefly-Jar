// Optional regression checks: node --test tests/review.cjs (no packages or build).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function game({ resizeDuringLoad = false } = {}) {
  const listeners = {};
  const stack = [];
  const context = {
    globalAlpha: 1, globalCompositeOperation: 'source-over',
    save() { stack.push([this.globalAlpha, this.globalCompositeOperation]); },
    restore() { [this.globalAlpha, this.globalCompositeOperation] = stack.pop(); },
    createRadialGradient() { return { addColorStop() {} }; },
  };
  for (const method of ['setTransform', 'fillRect', 'drawImage', 'beginPath', 'arc',
    'ellipse', 'fill', 'stroke', 'moveTo', 'lineTo', 'closePath', 'quadraticCurveTo',
    'translate', 'rotate', 'scale']) context[method] = () => {};
  const canvas = { style: {}, getContext: () => context,
    addEventListener: (name, fn) => { listeners[name] = fn; } };
  const sandbox = vm.createContext({
    window: { innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
      addEventListener(name, fn) { if (name === "resize") listeners.resize = fn; } },
    document: { getElementById: () => canvas, createElement: () => canvas },
    Image: class { complete = true; naturalWidth = 1024; },
    performance: { now: () => 0 }, requestAnimationFrame() {},
  });
  const run = code => vm.runInContext(code, sandbox);
  const html = fs.readFileSync(path.join(__dirname, '../site/index.html'), 'utf8');
  for (const [, file] of html.matchAll(/<script src="([^"]+)"/g)) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../site', file), 'utf8'),
      sandbox, { filename: file });
    if (resizeDuringLoad && listeners.resize) listeners.resize();
  }
  run('frame(16);');
  return { run, pointer: (x, y) => listeners.pointerdown({ clientX: x, clientY: y }),
    context, stack };
}

test('tenth arrival starts one celebration; extra arrivals cannot overfill or restart it', () => {
  const { run } = game();
  run("for (let i=0;i<10;i++) arriveAtJar({variant:'yellow'}); updateCelebration(1);");
  const particles = run('sparkles.length');
  run("arriveAtJar({variant:'pink',sleepy:1});");
  assert.equal(run('caughtCount'), 10);
  assert.equal(run('jarFlies.length'), 10);
  assert.equal(run('jar.targetGlow'), 1);
  assert.equal(run('celebrating'), 4);
  assert.equal(run('sparkles.length'), particles);
});

test('an arrival is counted at most once, including after reset', () => {
  const { run } = game();
  run("const arrival = {variant:'yellow'}; arriveAtJar(arrival); arriveAtJar(arrival);");
  assert.equal(run('caughtCount'), 1);
  run("for (let i=1;i<10;i++) arriveAtJar({variant:'yellow'}); updateCelebration(5); arriveAtJar(arrival);");
  assert.equal(run('caughtCount'), 0);
});

test('sleep travel can span a reset and settle once into the newly empty jar', () => {
  const { run } = game();
  run("const sleeper = fireflies[0]; sleeper.x = -1000; sleeper.sleepy=1; startSleepTravel(sleeper); for(let i=0;i<10;i++) arriveAtJar({variant:'yellow'}); updateCelebration(5); updateFireflies(20);");
  assert.equal(run('caughtCount'), 1);
  assert.equal(run('jarFlies.length'), 1);
  assert.equal(run('fireflies.includes(sleeper)'), false);
});

test('taps before and after the sleep transition never duplicate a catch', () => {
  const { run, pointer } = game();
  run('fireflies = [fireflies[0]]; const fly=fireflies[0]; fly.x=250; fly.y=200; beginSleep(fly); fly.sleepT=1.79;');
  pointer(250, 200);
  assert.equal(run('fly.state'), 'travel');
  assert.equal(run('fly.sleepy'), 0);
  assert.equal(run('fly.surprise'), 1.1);
  pointer(250, 200);
  assert.equal(run('sparkles.length'), 3);
  run('updateFireflies(10);');
  assert.equal(run('caughtCount'), 1);
  run('spawnFirefly(); const other=fireflies[0]; other.x=250; other.y=200; beginSleep(other); other.sleepT=1.8; updateFireflies(0.01);');
  assert.equal(run('other.state'), 'travel');
  pointer(250, 200);
  assert.equal(run('other.surprise'), 0);
});

test('two pointer events catch distinct flies once each', () => {
  const { run, pointer } = game();
  run('fireflies=fireflies.slice(0,2); fireflies[0].x=200; fireflies[0].y=200; fireflies[1].x=700; fireflies[1].y=200;');
  pointer(200, 200); pointer(700, 200);
  assert.equal(run("fireflies.filter(f=>f.state==='travel').length"), 2);
  run('updateFireflies(10);');
  assert.equal(run('caughtCount'), 2);
});

test('travel lands at the resized jar mouth', () => {
  const { run } = game();
  run('const traveler=fireflies[0]; tapFirefly(traveler); updateFireflies(0.2); window.innerWidth=600; window.innerHeight=900; resize(); updateFireflies(10);');
  assert.ok(run('Math.hypot(traveler.x-jar.mouthX,traveler.y-jar.mouthY)<1e-9'));
});

test('coincident flies, jar center, and zero-distance travel remain finite', () => {
  const { run } = game();
  run('fireflies.forEach(f=>{f.x=jar.x;f.y=jar.y;}); updateFireflies(0.05);');
  assert.ok(run('fireflies.every(f=>Number.isFinite(f.x)&&Number.isFinite(f.y))'));
  run('const zero=fireflies[0]; zero.x=jar.mouthX; zero.y=jar.mouthY; tapFirefly(zero); updateFireflies(0.05);');
  assert.ok(run('Number.isFinite(zero.x)&&Number.isFinite(zero.y)'));
});

test('a long background gap advances simulation by only the existing clamp', () => {
  const { run } = game();
  const before = run('time');
  run('frame(600016);');
  assert.ok(Math.abs(run('time') - before - 0.05) < 1e-9);
});

test('idle mode completes a round and resets; draw passes restore alpha/composite', () => {
  const { run, context, stack } = game();
  run('Math.random=()=>0.01;');
  let sawCelebration = false, sawReset = false;
  for (let i = 2; i < 4000; i++) {
    run(`frame(${i * 50});`);
    assert.equal(context.globalAlpha, 1);
    assert.equal(context.globalCompositeOperation, 'source-over');
    assert.equal(stack.length, 0);
    assert.ok(run('fireflies.every(f=>Number.isFinite(f.x)&&Number.isFinite(f.y))'));
    if (run('celebrating > 0')) sawCelebration = true;
    if (sawCelebration && run('celebrating===0 && caughtCount===0')) { sawReset = true; break; }
  }
  assert.ok(sawCelebration && sawReset);
});

const audioMock = `
  class AudioMock {
    state='running'; currentTime=0; destination={}; gains=[]; oscillators=[];
    createGain() {
      const node={gain:{value:1,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},
        connect(target){this.target=target;return target;}};
      this.gains.push(node); return node;
    }
    createOscillator() {
      const node={frequency:{},connect(target){this.target=target;return target;},start(){},stop(){}};
      this.oscillators.push(node); return node;
    }
    resume(){ this.resumes=(this.resumes||0)+1; return Promise.resolve(); }
  }
  window.AudioContext=AudioMock;
`;

test('unavailable audio never blocks pointer feedback', () => {
  const { run, pointer } = game();
  run('window.AudioContext=class { constructor(){throw new Error("unavailable");} }; fireflies=[];');
  pointer(10, 10);
  assert.equal(run('sparkles.length'), 3);
});

test('mute silences notes already scheduled through the output gain; rapid toggles remain consistent', () => {
  const { run, pointer } = game();
  run(audioMock); run('ensureAudio(); celebrateSound();');
  assert.equal(run('audioCtx.oscillators.length'), 6);
  assert.ok(run('audioCtx.oscillators.every(o=>o.target.target===audioOutput)'));
  pointer(1216,64);
  assert.equal(run('audioOutput.gain.value'), 0);
  pointer(1216,64); pointer(1216,64); pointer(1216,64);
  assert.equal(run('soundOn'), true);
  assert.equal(run('audioOutput.gain.value'), 1);
});

test('resume rejection is handled and interrupted contexts are retried on a gesture', async () => {
  const { run } = game();
  run(audioMock);
  run('ensureAudio(); audioCtx.state="interrupted"; audioCtx.resume=()=>{ audioCtx.resumes=(audioCtx.resumes||0)+1; return Promise.reject(new Error("blocked")); }; ensureAudio();');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(run('audioCtx.resumes'), 1);
});

test('synchronous resume or note failure cannot abort input or a game frame', () => {
  const { run, pointer } = game();
  run(audioMock);
  run('ensureAudio(); audioCtx.state="suspended"; audioCtx.resume=()=>{throw new Error("unavailable");}; fireflies=[];');
  pointer(10,10);
  assert.equal(run('sparkles.length'), 3);
  run('audioCtx.state="running"; audioCtx.createOscillator=()=>{throw new Error("unavailable");};');
  assert.doesNotThrow(()=>run('chime(PENTA[0]); frame(50);'));
});

test('closed context is replaced on the next gesture', () => {
  const { run } = game();
  run(audioMock);
  run('ensureAudio(); const closed=audioCtx; closed.state="closed"; ensureAudio();');
  assert.ok(run('audioCtx!==closed && audioCtx.state==="running"'));
});

test('resize events between script loads cannot call modules before initialization', () => {
  assert.doesNotThrow(() => game({ resizeDuringLoad: true }));
});
