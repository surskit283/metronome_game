let keyValues = [];

var song = {
  duration: 60,
  sheet: [s, d, f, space, j, k, l]
};

var isHolding = {
  s: false,
  d: false,
  f: false,
  ' ': false,
  j: false,
  k: false,
  l: false
};

var hits = { perfect: 0, good: 0, bad: 0, miss: 0 };
var multiplier = {
  perfect: 1,
  good: 0.8,
  bad: 0.5,
  miss: 0,
  combo40: 1.05,
  combo80: 1.10
};

var bpm;
var bit;
var interval=400;
var isPlaying = false;
var speed = 0;
var combo = 0;
var maxCombo = 0;
var score = 0;
var animation = 'moveDown';
var startTime;
var trackContainer;
var tracks;
var keypress;
var comboText;

var initializeNotes = function () {
  var noteElement;
  var trackElement;

  while (trackContainer.hasChildNodes()) {
    trackContainer.removeChild(trackContainer.lastChild);
  }

  song.sheet.forEach(function (key, index) {
    trackElement = document.createElement('div');
    trackElement.classList.add('track');

    key.notes.forEach(function (note) {
      noteElement = document.createElement('div');
      noteElement.classList.add('note');
      noteElement.classList.add('note--' + index);
      noteElement.style.backgroundColor = key.color;
      noteElement.style.animationName = animation;
      noteElement.style.animationTimingFunction = 'linear';
      noteElement.style.animationDuration = note.duration - speed + 's';
      noteElement.style.animationDelay = note.delay + speed + 's';
      noteElement.style.animationPlayState = 'paused';
      trackElement.appendChild(noteElement);
    });
    trackContainer.appendChild(trackElement);
    tracks = document.querySelectorAll('.track');
  });
};

var setupSpeed = function () {
  var buttons = document.querySelectorAll('.btn--small');

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      if (this.innerHTML === '1x') {
        buttons[0].className = 'btn btn--small btn--selected';
        buttons[1].className = 'btn btn--small';
        buttons[2].className = 'btn btn--small';
        speed = parseInt(this.innerHTML) - 1;
      } else if (this.innerHTML === '2x') {
        buttons[0].className = 'btn btn--small';
        buttons[1].className = 'btn btn--small btn--selected';
        buttons[2].className = 'btn btn--small';
        speed = parseInt(this.innerHTML) - 1;
      } else if (this.innerHTML === '3x') {
        buttons[0].className = 'btn btn--small';
        buttons[1].className = 'btn btn--small';
        buttons[2].className = 'btn btn--small btn--selected';
        speed = parseInt(this.innerHTML) - 1;
      }

      initializeNotes();
    });
  });
};
var setupStartButton = function () {
  var startButton = document.querySelector('.btn--start');
  startButton.addEventListener('click', function () {
    isPlaying = true;
    startTime = Date.now();

    // BPM과 비트 수를 가져옵니다.
    const bpm = parseFloat(document.getElementById('bpm').value);
    const bitCount = parseInt(document.getElementById('bit').value);

    // BPM을 바탕으로 interval을 계산 (단위: ms)
    const interval = (240 / (bpm * bitCount)) * 1000;

    // 1분 동안 메트로놈 음성 반복 설정 (1분 = 60초)
    const totalDuration = 58000; // 1분 = 60000ms

    startTimer(song.duration);
    // 타이머 시작
    intervalId = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      // 1분이 경과하면 정지
      if (elapsedTime >= totalDuration) {
        clearInterval(intervalId);
        statusDiv.textContent = "1분이 경과했습니다.";
        document.getElementById('start').disabled = false;
        document.getElementById('stop').disabled = true;
        return;
      }
      // 메트로놈 소리 출력
      const sound = new Audio(document.getElementById('metronome').src);  // 새로운 Audio 객체를 생성
      sound.play();
    }, interval);

    document.querySelector('.menu').style.opacity = 0;
    document.querySelectorAll('.note').forEach(function (note) {
      note.style.animationPlayState = 'running';
    });
  });
};

var setupStartButton = function () {
  var startButton = document.querySelector('.btn--start');
  startButton.addEventListener('click', function () {
    isPlaying = true;
    startTime = Date.now();

    startTimer(song.duration);
    document.querySelector('.menu').style.opacity = 0;
    document.querySelectorAll('.note').forEach(function (note) {
      note.style.animationPlayState = 'running';
    });
  });
};

var startTimer = function (duration) {
  var display = document.querySelector('.summary__timer');
  var timer = duration;
  var minutes;
  var seconds;

  display.style.display = 'block';
  display.style.opacity = 1;

  var songDurationInterval = setInterval(function () {
    minutes = Math.floor(timer / 60);
    seconds = timer % 60;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    display.innerHTML = minutes + ':' + seconds;

    if (--timer < 0) {
      clearInterval(songDurationInterval);
      showResult();
      comboText.style.transition = 'all 1s';
      comboText.style.opacity = 0;
    }
  }, 1000);
};

var showResult = function () {
  document.querySelector('.perfect__count').innerHTML = hits.perfect;
  document.querySelector('.good__count').innerHTML = hits.good;
  document.querySelector('.bad__count').innerHTML = hits.bad;
  document.querySelector('.miss__count').innerHTML = hits.miss;
  document.querySelector('.combo__count').innerHTML = maxCombo;
  document.querySelector('.score__count').innerHTML = score;
  document.querySelector('.summary__timer').style.opacity = 0;
  document.querySelector('.summary__result').style.opacity = 1;
};

var setupNoteMiss = function () {
  trackContainer.addEventListener('animationend', function (event) {
    var index = event.target.classList.item(1)[6];

    displayAccuracy('miss');
    updateHits('miss');
    updateCombo('miss');
    updateMaxCombo();
    removeNoteFromTrack(event.target.parentNode, event.target);
    updateNext(index);
  });
};

/**
 * Allows keys to be only pressed one time. Prevents keydown event
 * from being handled multiple times while held down.
 */

var setupKeys = function () {
  document.addEventListener('keydown', function (event) {
    // 입력된 키를 keyValues에 추가 (중복 방지)
    if (!keyValues.includes(event.key)) {
      keyValues.push(event.key);
    }

    // keyIndex를 가져옵니다.
    var keyIndex = getKeyIndex(event.key);

    // keyIndex가 유효하지 않을 경우 로그 출력 후 종료
    if (keyIndex === -1) {
      console.warn(`Invalid key pressed: ${event.key}`);
      return; // 유효하지 않은 키를 누른 경우 종료
    }

    // keypress[keyIndex]가 존재하는지 확인하고 처리
    if (keypress[keyIndex]) {
      if (!isHolding[event.key]) {
        isHolding[event.key] = true;
        keypress[keyIndex].style.display = 'block';

        if (isPlaying && tracks[keyIndex]?.firstChild) {
          judge(keyIndex);
        }
      }
    }
  });

  document.addEventListener('keyup', function (event) {
    var keyIndex = getKeyIndex(event.key);

    if (keyIndex === -1) {
      console.warn(`Invalid key released: ${event.key}`);
      return; // 유효하지 않은 키를 떼었을 경우 종료
    }

    // keypress[keyIndex]가 존재하는지 확인하고 처리
    if (keypress[keyIndex]) {
      if (isHolding[event.key]) {
        isHolding[event.key] = false;
        keypress[keyIndex].style.display = 'none';
      }
    }
  });
};


function getKeyIndex(key) {
  // 입력된 키가 keyValues 배열에 있는 경우 인덱스 반환
  if (key === ' ') {
    return keyValues.indexOf('Space');
  }
  return keyValues.findIndex(item => item.toLowerCase() === key.toLowerCase());
}


var judge = function (index) {
  var timeInSecond = (Date.now() - startTime) / 1000;
  var nextNoteIndex = song.sheet[index].next;
  var nextNote = song.sheet[index].notes[nextNoteIndex];
  var perfectTime = nextNote.duration + nextNote.delay;
  var accuracy = Math.abs(timeInSecond - perfectTime);
  var hitJudgement;

  /**
   * As long as the note has travelled less than 3/4 of the height of
   * the track, any key press on this track will be ignored.
   */
  if (accuracy > (nextNote.duration - speed) / 4) {
    return;
  }

  hitJudgement = getHitJudgement(accuracy);
  displayAccuracy(hitJudgement);
  showHitEffect(index);
  updateHits(hitJudgement);
  updateCombo(hitJudgement);
  updateMaxCombo();
  calculateScore(hitJudgement);
  removeNoteFromTrack(tracks[index], tracks[index].firstChild);
  updateNext(index);
};

var getHitJudgement = function (accuracy) {
  if (accuracy < 0.1) {
    return 'perfect';
  } else if (accuracy < 0.2) {
    return 'good';
  } else if (accuracy < 0.3) {
    return 'bad';
  } else {
    return 'miss';
  }
};

var displayAccuracy = function (accuracy) {
  var accuracyText = document.createElement('div');
  document.querySelector('.hit__accuracy').remove();
  accuracyText.classList.add('hit__accuracy');
  accuracyText.classList.add('hit__accuracy--' + accuracy);
  accuracyText.innerHTML = accuracy;
  document.querySelector('.hit').appendChild(accuracyText);
};

var showHitEffect = function (index) {
  var key = document.querySelectorAll('.key')[index];
  var hitEffect = document.createElement('div');
  hitEffect.classList.add('key__hit');
  key.appendChild(hitEffect);
};

var updateHits = function (judgement) {
  hits[judgement]++;
};

var updateCombo = function (judgement) {
  if (judgement === 'bad' || judgement === 'miss') {
    combo = 0;
    comboText.innerHTML = '';
  } else {
    comboText.innerHTML = ++combo;
  }
};

var updateMaxCombo = function () {
  maxCombo = maxCombo > combo ? maxCombo : combo;
};

var calculateScore = function (judgement) {
  if (combo >= 80) {
    score += 1000 * multiplier[judgement] * multiplier.combo80;
  } else if (combo >= 40) {
    score += 1000 * multiplier[judgement] * multiplier.combo40;
  } else {
    score += 1000 * multiplier[judgement];
  }
};

var removeNoteFromTrack = function (parent, child) {
  parent.removeChild(child);
};

var updateNext = function (index) {
  song.sheet[index].next++;
};

window.onload = function () {
  trackContainer = document.querySelector('.track-container');
  keypress = document.querySelectorAll('.keypress');
  
  console.log(keypress); 
  // NodeList(2) [div.keypress--white.keypress, div.keypress--blue.keypress]
  console.log(keypress[0]); 
  // <div class="keypress--white keypress"></div>
  console.log(keypress[1]); 
  // <div class="keypress--blue keypress"></div>
  comboText = document.querySelector('.hit__combo');

  initializeNotes();
  settingKeys()
  setupSpeed();
  setupStartButton();
  setupKeys();
  setupNoteMiss();
  
}

function settingKeys() {
  // 사용자 입력 값 가져오기
  const numKeys = parseInt(document.getElementById("numKeys").value, 10);
  keyValues = document.getElementById("keyValues").value.split(",").map(item => item.trim());

  // 유효성 검사: 키 개수와 키 값 배열 길이가 맞는지 확인
  if (isNaN(numKeys) || numKeys <= 0) {
    alert("키 개수는 양의 정수여야 합니다.");
    return;
  }
  
  if (keyValues.length !== numKeys) {
    alert("키 값의 개수와 키 수가 일치하지 않습니다.");
    return;
  }

  if (keyValues.some(val => val === "")) {
    alert("키 값에 빈 항목이 포함되어 있습니다.");
    return;
  }

  // keyContainer 초기화
  const keyContainer = document.getElementById("key-container");
  keyContainer.innerHTML = ""; // 기존 키를 삭제

  // song.sheet 초기화 (기존에 설정된 값 삭제)
  song.sheet = [];

  // 동적으로 키 생성 및 song.sheet 설정
  for (let i = 0; i < numKeys; i++) {
    const keyClass1 = (i % 2 === 0) ? 'key--w' : 'key--b';  // 첫 번째 클래스
    const keyClass2 = (i % 2 === 0) ? 'key--white' : 'key--blue';  // 두 번째 클래스
    const keyValue = keyValues[i];

    const keyElement = document.createElement("div");
    keyElement.classList.add("key", keyClass1, keyClass2); // 각 클래스를 독립적으로 추가

    const keyPressElement = document.createElement("div");
    keyPressElement.classList.add("keypress");
    keyPressElement.classList.add(i % 2 === 0 ? "keypress--white" : "keypress--blue");

    const spanElement = document.createElement("span");
    spanElement.textContent = keyValue;

    keyElement.appendChild(keyPressElement);
    keyElement.appendChild(spanElement);

    keyContainer.appendChild(keyElement);

    // song.sheet에 동적으로 키 값을 추가
    song.sheet.push({ key: keyValue, notes: [] });
  }
  trackContainer = document.querySelector('.track-container');
  keypress = document.querySelectorAll('.keypress');
  
  console.log(keyValues); // 키 배열이 올바르게 설정되었는지 확인

  comboText = document.querySelector('.hit__combo');
  initializeNotes();
  console.log(song.sheet); // song.sheet 내용 확인
}

// setKeys 버튼에 이벤트 리스너를 설정
document.getElementById("setKeys").addEventListener("click", settingKeys);

document.addEventListener("keydown", function (event) {
  console.log("Key pressed:", event.key); // 눌린 키를 확인
});
document.addEventListener("keydown", function (event) {
  const keyIndex = getKeyIndex(event.key);
  console.log("Key Index:", keyIndex); // 반환된 인덱스를 확인
});




// 노트가 어느 키에 떨어질지 설정하는 함수
function generateNotesForKeys(interval) {
  const keys = keyValues;  // 동적으로 설정된 keyValues 배열 사용

  // song.sheet에 있는 각 키에 대해 반복
  song.sheet.forEach((keyData, index) => {
      // 해당 keyData.key에 맞는 노트를 생성
      keyData.color = index % 2 === 0 ? 'rgba(28, 121, 228, 1)' : 'rgba(255, 255, 255, 1)';
      keyData.next = 0;

      // keyData.notes를 초기화 (빈 배열이 아닌 경우 초기화)
      if (!Array.isArray(keyData.notes)) {
          keyData.notes = [];
      }

      for (let i = 0; i < 58000 / interval / keys.length; i++) {
          // delayTime 계산
          const delayTime = ((index * interval) + (i * interval * keys.length))/1000;

          // 노트 생성
          const note = {
              delay: delayTime,  // 노트 생성 딜레이 시간
              duration: 3        // 노트 지속 시간
          };

          // keyData.notes에 노트 추가 (배열로 저장)
          keyData.notes.push(note);  // keyData.notes에 노트를 직접 추가
      }

      console.log('Generated color:', keyData.color);
      console.log('Generated next:', keyData.next);
      console.log('Generated notes:', keyData.notes);
  });
  initializeNotes();
}



// interval 값에 맞춰 노트들을 생성
document.getElementById('setRhythm').addEventListener('click', function () {
  bpm = parseInt(document.getElementById('bpm').value);
  bit = parseInt(document.getElementById('bit').value);

  interval = (240 / (bpm * bit)) * 1000;  // 각 비트 간격 계산
  console.log("interval:", interval);

  generateNotesForKeys(interval);  // 키에 맞는 노트 생성
});
