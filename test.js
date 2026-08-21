// Test page logic: duration passed via ?d=N
(() => {
  const params = new URLSearchParams(location.search);
  const d = Number(params.get('d')) || 1;
  const durationSec = d * 60;

  const textDisplay = document.getElementById('textDisplay');
  const input = document.getElementById('input');
  const timeEl = document.getElementById('time');
  const resultCard = document.getElementById('resultCard');
  const finalWpm = document.getElementById('finalWpm');
  const finalAcc = document.getElementById('finalAcc');
  const finalChars = document.getElementById('finalChars');
  const resultReaction = document.getElementById('resultReaction');
  const resultStars = document.getElementById('resultStars');
  const retryBtn = document.getElementById('retryBtn');
  const restartBtn = document.getElementById('restartBtn');
  const themeButtons = document.querySelectorAll('.theme-btn');

  const WORD_POOL = (`
    time person year way day thing man world life hand part child eye place work week case point government company number group problem fact
    quick brown fox jumps over the lazy dog keyboard typing speed accuracy practice challenge rhythm flow sentence practice repeat fast steady
    coding typing tests improve muscle memory accuracy and concentration enjoy the moment focus on precision not only speed keep calm and type
  `).trim().split(/\s+/);

  let targetText = '';
  let timer = null;
  let timeLeft = durationSec;
  let startedAt = null;
  let isRunning = false;
  let totalTyped = 0;
  let correctChars = 0;
  let totalAttempts = 0;
  let correctAttempts = 0;

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
    const wordsNeeded = Math.ceil((durationSec/60) * 120);
    targetText = pickWords(wordsNeeded);
    renderText();
    // add regen animation class briefly
    textDisplay.classList.remove('regen');
    void textDisplay.offsetWidth;
    textDisplay.classList.add('regen');
    // remove class after animation
    setTimeout(()=> textDisplay.classList.remove('regen'), 600);
  }

  let targetWords = [];

  function renderText(){
    textDisplay.innerHTML = '';
    // split by spaces to create word spans with inner char spans
    targetWords = targetText.split(/\s+/).filter(w=>w.length>0);
    for(let i=0;i<targetWords.length;i++){
      const w = targetWords[i];
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word';
      wordSpan.dataset.index = i;
      // create char spans
      for(let j=0;j<w.length;j++){
        const ch = document.createElement('span');
        ch.className = 'char';
        ch.dataset.cindex = j;
        ch.textContent = w[j];
        wordSpan.appendChild(ch);
      }
      textDisplay.appendChild(wordSpan);
      // append a space separator
      const sp = document.createElement('span');
      sp.className = 'space';
      sp.textContent = ' ';
      textDisplay.appendChild(sp);
    }
    // mark first word active
    const first = textDisplay.querySelector('.word'); if(first) first.classList.add('active');
  }

  function getCurrentWordState(inputValue){
    const parts = inputValue.split(/\s+/);
    const endsWithSpace = /\s$/.test(inputValue);
    let completed = [];
    let current = '';
    if(inputValue.trim().length === 0){
      completed = [];
      current = '';
    } else if(endsWithSpace){
      completed = parts.filter(p=>p.length>0);
      current = '';
    } else {
      if(parts.length === 1){
        completed = [];
        current = parts[0];
      } else {
        completed = parts.slice(0, parts.length-1).filter(p=>p.length>0);
        current = parts[parts.length-1] || '';
      }
    }
    return { completed, current };
  }

  function syncActiveWordViewport(activeWord){
    if(!activeWord || !textDisplay) return;

    const wordTop = activeWord.offsetTop;
    const wordBottom = wordTop + activeWord.offsetHeight;
    const visibleTop = textDisplay.scrollTop + 24;
    const visibleBottom = textDisplay.scrollTop + textDisplay.clientHeight - 24;
    const maxScroll = Math.max(0, textDisplay.scrollHeight - textDisplay.clientHeight);

    if(wordBottom > visibleBottom){
      const nextScroll = Math.min(maxScroll, wordBottom - (textDisplay.clientHeight * 0.55));
      textDisplay.scrollTop = nextScroll;
      return;
    }

    if(wordTop < visibleTop){
      const nextScroll = Math.max(0, wordTop - 18);
      textDisplay.scrollTop = nextScroll;
    }
  }

  function updateCaret(activeWord, currentLength){
    const oldCaret = textDisplay.querySelector('.caret');
    if(oldCaret) oldCaret.remove();
    if(!activeWord) return;

    const chars = activeWord.querySelectorAll('.char');
    const displayRect = textDisplay.getBoundingClientRect();
    const activeWordRect = activeWord.getBoundingClientRect();
    let caretX = activeWordRect.left - displayRect.left + 2;
    let caretY = activeWordRect.top - displayRect.top + 2;
    let caretH = Math.max(activeWordRect.height - 6, 18);

    if(chars.length > 0){
      const targetIndex = Math.min(Math.max(currentLength, 0), chars.length);
      const targetChar = chars[targetIndex] || chars[chars.length - 1];
      const charRect = targetChar.getBoundingClientRect();
      caretX = charRect.right - displayRect.left + 2;
      caretY = charRect.top - displayRect.top + 2;
      caretH = Math.max(charRect.height - 2, 18);
    }

    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.style.left = `${caretX}px`;
    caret.style.top = `${caretY}px`;
    caret.style.height = `${caretH}px`;
    textDisplay.appendChild(caret);
  }

  function updateVisuals(inputValue){
    const { completed, current } = getCurrentWordState(inputValue);

    // Update word spans and per-char classes
    const wordSpans = textDisplay.querySelectorAll('.word');
    correctChars = 0;
    for(let i=0;i<wordSpans.length;i++){
      const wordSpan = wordSpans[i];
      const target = targetWords[i] || '';
      const charSpans = wordSpan.querySelectorAll('.char');
      // clear word-level classes
      wordSpan.classList.remove('correct','incorrect','active');
      // clear char classes first
      charSpans.forEach(ch => ch.classList.remove('correct','incorrect','active','caret'));

      if(i < completed.length){
        const userWord = completed[i] || '';
        let allMatch = true;
        for(let j=0;j<charSpans.length;j++){
          const ch = charSpans[j];
          if(j < userWord.length){
            if(userWord[j] === target[j]){
              ch.classList.add('correct');
              correctChars++;
            } else {
              ch.classList.add('incorrect');
              allMatch = false;
            }
          } else {
            // user didn't type this char
          }
        }
        if(allMatch && userWord.length === target.length){
          wordSpan.classList.add('correct');
        } else {
          wordSpan.classList.add('incorrect');
        }
      } else if(i === completed.length){
        // current active word: only mark typed characters until the first mismatch.
        // This prevents a single typo from cascading and making every following letter look wrong.
        wordSpan.classList.add('active');
        const userCurr = current || '';
        const compareLen = Math.min(userCurr.length, target.length);
        let hitMismatch = false;
        for(let j=0;j<compareLen;j++){
          const ch = charSpans[j];
          if(hitMismatch){
            break;
          }
          if(userCurr[j] === target[j]){
            ch.classList.add('correct');
            correctChars++;
          } else {
            ch.classList.add('incorrect');
            hitMismatch = true;
          }
        }
        for(let j=compareLen;j<Math.min(userCurr.length, charSpans.length);j++){
          const ch = charSpans[j];
          ch.classList.add('incorrect');
        }

      } else {
        // future words - no classes
      }
    }

    const activeIndex = Math.min(completed.length, wordSpans.length - 1);
    const activeWord = wordSpans[activeIndex] || wordSpans[0] || null;
    const currentLength = activeWord ? (current || '').length : 0;
    if(activeWord){
      updateCaret(activeWord, currentLength);
      syncActiveWordViewport(activeWord);
    }

    // update totalTyped as non-space characters typed
    totalTyped = inputValue.replace(/\s+/g,'').length;
  }

  function computeWPM(){
    const elapsedSec = Math.max(1, (startedAt ? Math.floor((Date.now() - startedAt)/1000) : 1));
    const minutes = elapsedSec / 60;
    const wpm = Math.round((correctChars / 5) / minutes) || 0;
    return wpm;
  }

  function computeAccuracy(){
    if(totalAttempts === 0) return 100;
    return Math.max(0, Math.round((correctAttempts / totalAttempts) * 100));
  }

  function trackTypingAccuracy(event){
    if (!event || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key;
    if (key === 'Backspace' || key === 'Delete' || key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Home' || key === 'End' || key === 'PageUp' || key === 'PageDown' || key === 'Tab' || key === 'Escape' || key === 'Enter') return;
    if (key.length !== 1 && key !== ' ') return;

    const cursorPos = input.selectionStart ?? input.value.length;
    const expectedChar = targetText[cursorPos] ?? '';
    totalAttempts += 1;
    if (key === expectedChar) {
      correctAttempts += 1;
    }
  }

  function startTest(){
    // If text wasn't generated yet, generate it. Typically generateText() runs on init.
    if (!targetText) generateText();
    // Do not clear input here — user-typed character(s) must be kept and compared.
    input.disabled = false;
    input.focus();
    timeLeft = durationSec;
    timeEl.textContent = formatTime(timeLeft);
    totalTyped = 0;
    correctChars = 0;
    totalAttempts = 0;
    correctAttempts = 0;
    startedAt = Date.now();
    isRunning = true;
    if(timer) clearInterval(timer);
    timer = setInterval(()=>{
      timeLeft -= 1;
      timeEl.textContent = formatTime(timeLeft);
      if(timeLeft <= 0){
        endTest();
      }
    },1000);
  }

  function updateResultReaction(wpm){
    if(!resultReaction) return;
    let emoji = '🎉';
    let text = 'Amazing work — you were on fire!';
    if(wpm < 10){
      emoji = '😭';
      text = 'A rough round — keep practicing and you’ll bounce back.';
    } else if(wpm < 20){
      emoji = '😅';
      text = 'Solid effort — a bit more rhythm and you’ll climb.';
    } else if(wpm < 30){
      emoji = '🙂';
      text = 'Nice pace — you’re getting stronger.';
    } else if(wpm < 40){
      emoji = '🎉';
      text = 'Great run — strong typing speed!';
    } else {
      emoji = '🎉✨';
      text = 'Elite pace — absolute beast mode!';
    }
    resultReaction.innerHTML = `<span class="reaction-emoji">${emoji}</span><span class="reaction-text">${text}</span>`;
  }

  function updateResultStars(wpm){
    if(!resultStars) return;
    const stars = [];
    if(wpm < 10){
      stars.push('☆', '☆', '☆');
    } else if(wpm < 20){
      stars.push('★', '☆', '☆');
    } else if(wpm < 30){
      stars.push('★', '★', '☆');
    } else if(wpm < 40){
      stars.push('★', '★', '★');
    } else {
      stars.push('★', '★', '★');
    }
    resultStars.innerHTML = stars.map(star => `<span class="star-item" style="color:${star === '★' ? '#d9a15d' : 'rgba(29,18,9,0.22)'}">${star}</span>`).join('');
  }

  function applyCustomBackground(){
    const bg = localStorage.getItem('typing-custom-bg');
    const existingVideo = document.getElementById('typing-custom-video');

    if (bg) {
      const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(bg);
      if (isVideo) {
        if (!existingVideo) {
          const video = document.createElement('video');
          video.id = 'typing-custom-video';
          video.autoplay = true;
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          video.className = 'typing-custom-video';
          document.body.prepend(video);
        }
        const video = document.getElementById('typing-custom-video');
        if (video) {
          video.src = bg;
          video.style.display = 'block';
        }
        document.body.style.backgroundImage = '';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundRepeat = '';
      } else {
        if (existingVideo) existingVideo.remove();
        document.body.style.backgroundImage = `url("${bg}")`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
      }
    } else {
      if (existingVideo) existingVideo.remove();
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
    }
  }

  function applyTheme(theme){
    document.body.setAttribute('data-page', 'test');
    document.body.setAttribute('data-theme', theme);
    const testPage = document.querySelector('.test-page');
    if (testPage) {
      testPage.setAttribute('data-theme', theme);
    }
    themeButtons.forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.theme === theme);
    });
    try { localStorage.setItem('typing-theme', theme); } catch (e) {}
    applyCustomBackground();
  }

  function endTest(){
    // guard: don't show results if the test never actually started
    if (!startedAt) return;
    if(timer) clearInterval(timer);
    isRunning = false;
    input.disabled = true;
    const wpm = computeWPM();
    finalWpm.textContent = wpm;
    finalAcc.textContent = computeAccuracy() + '%';
    finalChars.textContent = totalTyped;
    updateResultReaction(wpm);
    updateResultStars(wpm);
    resultCard.hidden = false;
  }

  // Keep input feedback immediate so typing feels responsive.
  let latestInput = '';
  function scheduleUpdate(){
    const v = latestInput;
    // only start the test when the user types at least one non-whitespace character
    if(!isRunning && v.trim().length > 0){
      startTest();
    }
    // run visuals update with the latest value
    updateVisuals(v);
  }

  input.addEventListener('input', (e)=>{
    latestInput = e.target.value || '';
    // update totalTyped here based on non-space characters (used for accuracy)
    totalTyped = latestInput.replace(/\s+/g,'').length;
    scheduleUpdate();
  });

  // show focused text display click focuses the textarea
  if(textDisplay){
    textDisplay.addEventListener('click', ()=> input.focus());
  }

  // build on-screen keyboard
  const keyboardRoot = document.getElementById('onScreenKeyboard');
  const keyRows = [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l'],
    ['z','x','c','v','b','n','m',',','.','/'],
    ['Space','Backspace']
  ];
  function buildKeyboard(){
    if(!keyboardRoot) return;
    keyboardRoot.innerHTML = '';
    keyRows.forEach(row =>{
      const rowEl = document.createElement('div'); rowEl.className='keyboard-row';
      row.forEach(k =>{
        const keyEl = document.createElement('div'); keyEl.className='key';
        keyEl.dataset.key = k.toLowerCase();
        keyEl.textContent = k === 'Space' ? 'Space' : k;
        if(k === 'Space') keyEl.classList.add('wide');
        rowEl.appendChild(keyEl);
      });
      keyboardRoot.appendChild(rowEl);
    });
  }

  function flashKey(rawKey){
    if(!keyboardRoot) return;
    let key = rawKey;
    if(key === ' ') key = 'space';
    key = (''+key).toLowerCase();
    // normalize some names
    if(key === 'backspace') key = 'backspace';
    if(key === 'enter') key = 'enter';
    const el = keyboardRoot.querySelector('[data-key="'+key+'"]');
    if(!el) return;
    el.classList.add('pressed');
    setTimeout(()=> el.classList.remove('pressed'), 140);
  }

  // keydown to flash keys
  input.addEventListener('keydown', (e)=>{
    trackTypingAccuracy(e);
    flashKey(e.key);
  });

  // Keyboard: Escape closes result dialog when visible
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){
      if(resultCard && !resultCard.hidden){
        resultCard.hidden = true;
      }
    }
  });

  if (retryBtn) {
    retryBtn.addEventListener('click', ()=>{
      resultCard.hidden = true;
      // restart
      generateText();
      input.value = '';
      timeLeft = durationSec;
      timeEl.textContent = formatTime(timeLeft);
      totalTyped = 0; correctChars = 0; totalAttempts = 0; correctAttempts = 0;
      startedAt = null; // wait for first input
      isRunning = false;
      if(timer) clearInterval(timer);
      input.disabled = false; input.focus();
    });
  }

  // Restart button (available during the test to reset without leaving page)
  if (restartBtn) {
    restartBtn.addEventListener('click', ()=>{
      // stop any running timer
      if(timer) clearInterval(timer);
      // hide results if visible
      if(resultCard) resultCard.hidden = true;
      // regenerate paragraph and reset state
      generateText();
      input.value = '';
      timeLeft = durationSec;
      timeEl.textContent = formatTime(timeLeft);
      totalTyped = 0; correctChars = 0; totalAttempts = 0; correctAttempts = 0;
      startedAt = null;
      isRunning = false;
      input.disabled = false;
      try { input.focus(); } catch(e){}
    });
  }

  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
  });

  // init
  (function init(){
    const savedTheme = localStorage.getItem('typing-theme') || 'cream';
    applyTheme(savedTheme);
    timeEl.textContent = formatTime(durationSec);
    // Pre-generate and render the paragraph so the user sees it before typing.
    generateText();
    input.disabled = false;
    // build keyboard
    buildKeyboard();
    // ensure result card is hidden on load (defensive)
    if(resultCard) resultCard.hidden = true;
    startedAt = null;
    // don't auto-start on focus; focus is optional for desktop users
    try { input.focus(); } catch(e) {}
  })();
})();