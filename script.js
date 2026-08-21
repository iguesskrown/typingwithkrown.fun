// Basic typing test logic for Typingwithkrown.fun
(() => {
  const durations = document.querySelectorAll('.duration-btn');
  const startBtn = document.getElementById('startBtn');
  const resetBtn = document.getElementById('resetBtn');
  const cardStartButtons = document.querySelectorAll('.card-start');
  const input = document.getElementById('input');
  const textDisplay = document.getElementById('textDisplay');
  const timeEl = document.getElementById('time');
  const wpmEl = document.getElementById('wpm');
  const accEl = document.getElementById('accuracy');
  const resultsSection = document.getElementById('results');
  const finalWpm = document.getElementById('finalWpm');
  const finalAcc = document.getElementById('finalAcc');
  const finalChars = document.getElementById('finalChars');
  const tryAgain = document.getElementById('tryAgain');

  // A modest pool of words/sentences to generate typing text.
  const WORD_POOL = (`
    time person year way day thing man world life hand part child eye place work week case point government company number group problem fact
    quick brown fox jumps over the lazy dog keyboard typing speed accuracy practice challenge rhythm flow sentence practice repeat fast steady
    coding typing tests improve muscle memory accuracy and concentration enjoy the moment focus on precision not only speed keep calm and type
  `).trim().split(/\s+/);

  let targetText = '';
  let timer = null;
  let durationSec = 60; // default 1 minute
  let timeLeft = durationSec;
  let startedAt = null;
  let isRunning = false;
  let totalTyped = 0;
  let correctChars = 0;

  function formatTime(s){
    const mm = Math.floor(s/60).toString().padStart(2,'0');
    const ss = (s%60).toString().padStart(2,'0');
    return `${mm}:${ss}`;
  }

  function pickWords(count){
    const arr=[];
    for(let i=0;i<count;i++){
      arr.push(WORD_POOL[Math.floor(Math.random()*WORD_POOL.length)]);
    }
    return arr.join(' ');
  }

  function generateText(){
    // Rough estimate: words needed for chosen duration -- generate generously.
    const wordsNeeded = Math.ceil((durationSec/60) * 120); // 120 WPM buffer to ensure enough text
    targetText = pickWords(wordsNeeded);
    renderText();
  }

  function renderText(){
    textDisplay.innerHTML = '';
    for(let i=0;i<targetText.length;i++){
      const span = document.createElement('span');
      span.className = 'char';
      span.dataset.index = i;
      span.textContent = targetText[i];
      textDisplay.appendChild(span);
    }
    // set first char active
    const first = textDisplay.querySelector('.char');
    if(first) first.classList.add('active');
  }

  function updateVisuals(inputValue){
    const chars = textDisplay.querySelectorAll('.char');
    correctChars = 0;
    for(let i=0;i<chars.length;i++){
      const ch = chars[i];
      ch.classList.remove('correct','incorrect','active');
      if(i < inputValue.length){
        if(inputValue[i] === ch.textContent){
          ch.classList.add('correct');
          correctChars++;
        } else {
          ch.classList.add('incorrect');
        }
      }
      if(i === inputValue.length){
        ch.classList.add('active');
      }
    }
  }

  function computeWPM(){
    const elapsedSec = Math.max(1, (startedAt ? Math.floor((Date.now() - startedAt)/1000) : 1));
    const minutes = elapsedSec / 60;
    const wpm = Math.round((correctChars / 5) / minutes) || 0;
    return wpm;
  }

  function computeAccuracy(){
    if(totalTyped === 0) return 100;
    return Math.max(0, Math.round((correctChars / totalTyped) * 100));
  }

  function startTest(){
    if(isRunning) return;
    generateText();
    input.value = '';
    input.disabled = false;
    input.focus();
    timeLeft = durationSec;
    timeEl.textContent = formatTime(timeLeft);
    totalTyped = 0;
    correctChars = 0;
    startedAt = Date.now();
    isRunning = true;
    resultsSection.hidden = true;
    // clear any previous interval
    if(timer) clearInterval(timer);
    timer = setInterval(()=>{
      timeLeft -= 1;
      timeEl.textContent = formatTime(timeLeft);
      wpmEl.textContent = computeWPM();
      accEl.textContent = computeAccuracy() + '%';
      if(timeLeft <= 0){
        endTest();
      }
    }, 1000);
  }

  function endTest(){
    if(timer) clearInterval(timer);
    isRunning = false;
    input.disabled = true;
    // final stats
    finalWpm.textContent = computeWPM();
    finalAcc.textContent = computeAccuracy() + '%';
    finalChars.textContent = totalTyped;
    resultsSection.hidden = false;
    wpmEl.textContent = computeWPM();
    accEl.textContent = computeAccuracy() + '%';
  }

  // Events
  durations.forEach(btn => btn.addEventListener('click', e => {
    durations.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const m = Number(btn.dataset.min) || 1;
    durationSec = m * 60;
    timeLeft = durationSec;
    timeEl.textContent = formatTime(timeLeft);
  }));

  if (startBtn) startBtn.addEventListener('click', ()=> startTest());
  if (resetBtn) resetBtn.addEventListener('click', resetTest);

  // Start buttons on the cards
  if(cardStartButtons && cardStartButtons.length){
    cardStartButtons.forEach(b => b.addEventListener('click', (e)=>{
      const m = Number(b.dataset.min) || 1;
      durationSec = m * 60;
      // visually mark selected state on cards
      document.querySelectorAll('.card').forEach(c=> c.classList.remove('selected'));
      const card = b.closest('.card'); if(card) card.classList.add('selected');
      startTest();
    }));
  }

  function resetTest(){
    if(timer) clearInterval(timer);
    isRunning = false;
    input.value = '';
    input.disabled = true;
    totalTyped = 0;
    correctChars = 0;
    timeLeft = durationSec;
    timeEl.textContent = formatTime(timeLeft);
    wpmEl.textContent = '0';
    accEl.textContent = '100%';
    textDisplay.innerHTML = '<p style="opacity:.7;margin:0">Click Start (or use a card) to load text</p>';
    resultsSection.hidden = true;
    document.querySelectorAll('.card').forEach(c=> c.classList.remove('selected'));
  }

  tryAgain.addEventListener('click', ()=>{
    startTest();
  });

  // Typing input handling
  input.addEventListener('input', (e)=>{
    const v = e.target.value;
    if(!isRunning){
      // if user starts typing without pressing Start, start timer automatically
      startTest();
    }
    totalTyped = v.length;
    updateVisuals(v);
    wpmEl.textContent = computeWPM();
    accEl.textContent = computeAccuracy() + '%';
  });

  // Initialize UI state
  (function init(){
    input.disabled = true;
    timeEl.textContent = formatTime(durationSec);
    textDisplay.innerHTML = '<p style="opacity:.7;margin:0">Click a card (1 / 3 / 5 min) to start the test</p>';
    wpmEl.textContent = '0';
    accEl.textContent = '100%';
  })();
})();
