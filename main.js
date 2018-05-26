(function(){

var TEXT_LOADING = 'Loading...\n\n历史的行程: %s %';
var TEXT_SCORE = '+ %s s';
var TEXT_GAME_OVER = '我为长者续命%s秒\n志己的生命减少%s秒\n而且这个效率efficiency: %s%';
var TEXT_TRY_AGAIN = '重新续';
var TEXT_PLAY_BGM = '请州长夫人演唱';
var TEXT_TIME_ELAPSED = '- %s s';
var TEXT_TOTAL_TIME_ELAPSED = '累计被续 %s 秒';
var TEXT_TINY_TIPS = '[微小的提示]\n为了获得坠好的游戏体验，请：\n打开音量\n穿上红色的衣服';
var TEXT_FONT = '"Segoe UI", "Microsoft YaHei", 宋体, sans-serif'; // 插入宋体

var _gravity = 40,
  _speed = 390,
  _flap = 620,
  _spawnRate = 1 / 1.2,
  _opening = 260;

var _game;

var _baseUrl = '';

var _flapSound;

var _numScoreSounds = 10,
  _numHurtSounds = 9;

var _scoreSounds = [],
  _hurtSounds = [];

var _currentScoreSound;

var _bgColor = 0xDDEEFF,
  _background;

var _pipes,
  _pipeInvisibleLines,
  _pipesTimer;

var _frog;

var _ground;

var _clouds,
  _cloudsTimer;

var _gameOver = false,
  _gameStarted = false;

var _score = 0;

var _scoreText,
  _gameOverText,
  _tryAgainText,
  _tryAgainSprite,
  _playBgmText,
  _playBgmSprite;

var _bgm,
  _playBgm = false;

var _bgmKeyCode = [
  Phaser.Keyboard.ZERO,
  Phaser.Keyboard.NUMPAD_0
];

var _flapKeyCode = [
  Phaser.Keyboard.E,
  Phaser.Keyboard.SPACEBAR
];

var _feedbackKeyCode = [
  Phaser.Keyboard.FIVE,
  Phaser.Keyboard.NUMPAD_5
];

var _feedback,
  _feedbackFunc,
  _feedbackText,
  _feedbackSprite;

var _loadingText,
  _tinyTipsText;

var _timeElapsedText,
  _startTime,
  _timeElapsed;

var _totalTimeElapsedText,
  _totalTimeElapsed = 0;

var _debug = false;

function showLoadingText(percent) {
  _loadingText.setText(TEXT_LOADING.replace('%s', percent));
}

function initLoadingText() {
  _tinyTipsText = _game.add.text(
    _game.world.width / 2,
    _game.world.height / 4,
    TEXT_TINY_TIPS,
    {
      font: '16px ' + TEXT_FONT,
      fill: '#fff',
      align: 'center'
    }
  );
  _tinyTipsText.anchor.setTo(0.5, 0.5);

  _loadingText = _game.add.text(
    _game.world.width / 2,
    _game.world.height / 2,
    '',
    {
      font: '24px ' + TEXT_FONT,
      fill: '#f00',
      align: 'center'
    }
  );
  _loadingText.anchor.setTo(0.5, 0.5);
  showLoadingText(0);
}

function loadAudio(key, path) {
  _game.load.audio(key, [path + '.ogg', path + '.mp3']);
}

function preload() {
  _game.stage.scaleMode = Phaser.StageScaleMode.SHOW_ALL;
  _game.stage.scale.setScreenSize(true);


  initLoadingText();
  _game.load.onFileComplete.add(showLoadingText);

  _game.load.spritesheet('frog', _baseUrl + 'images/frog.png', 80, 64);
  _game.load.spritesheet('clouds', _baseUrl + 'images/clouds.png', 128, 64);

  _game.load.image('pipe', _baseUrl + 'images/pipe.png');
  _game.load.image('ground', _baseUrl + 'images/ground.png');

  loadAudio('bgm', _baseUrl + 'sounds/bgm');
  loadAudio('flap', _baseUrl + 'sounds/flap');

  var i;
  for (i = 1; i <= _numScoreSounds; i++) {
    loadAudio('score' + i, _baseUrl + 'sounds/score' + i);
  }
  for (i = 1; i <= _numHurtSounds; i++) {
    loadAudio('hurt' + i, _baseUrl + 'sounds/hurt' + i);
  }
}

function o() {
    return _opening + 60 * ((_score > 50 ? 50 : 50 - _score) / 50);
}

function spawnPipe(pipeY, flipped) {
  var pipe = _pipes.create(
    _game.width,
    pipeY + (flipped ? -o() : o()) / 2,
    'pipe'
  );
  pipe.body.allowGravity = false;

  // Flip pipe! *GASP*
  pipe.scale.setTo(2, flipped ? -2 : 2);
  pipe.body.offset.y = flipped ? -pipe.body.height * 2 : 0;

  // Move to the left
  pipe.body.velocity.x = -_speed;

  return pipe;
}

function spawnPipes() {
  _pipesTimer.stop();

  var pipeY = ((_game.height - 16 - o() / 2) / 2) + (Math.random() > 0.5 ? -1 : 1) * Math.random() * _game.height / 6;
  // Bottom pipe
  var pipe = spawnPipe(pipeY);
  // Top pipe (flipped)
  spawnPipe(pipeY, true);

  // Add invisible thingy
  var inv = _pipeInvisibleLines.create(pipe.x + pipe.width, 0);
  inv.width = 2;
  inv.height = _game.world.height;
  inv.body.allowGravity = false;
  inv.body.velocity.x = -_speed;

  _pipesTimer.add(1 / _spawnRate);
  _pipesTimer.start();
}


function initPipes() {
  _pipes = _game.add.group();
  _pipeInvisibleLines = _game.add.group();
}

function resetPipes() {
  _pipes.removeAll();
  _pipeInvisibleLines.removeAll();
}

function startPipes() {
  _pipesTimer = new Phaser.Timer(_game);
  _pipesTimer.onEvent.add(spawnPipes);
  _pipesTimer.add(2);
  _pipesTimer.start();
}

function stopPipes() {
  _pipesTimer.stop();

  _pipes.forEachAlive(function(pipe) {
    pipe.body.velocity.x = 0;
  });

  _pipeInvisibleLines.forEach(function(inv) {
    inv.body.velocity.x = 0;
  });
}

function initBackground() {
  _background = _game.add.graphics(0, 0);
  _background.beginFill(_bgColor, 1);
  _background.drawRect(0, 0, _game.world.width, _game.world.height);
  _background.endFill();
}

function initFrog() {
  _frog = _game.add.sprite(0, 0, 'frog');
  _frog.anchor.setTo(0.5, 0.5);
  _frog.body.collideWorldBounds = true;
  _frog.body.gravity.y = _gravity;
}

function resetFrog() {
  _frog.body.allowGravity = false;
  _frog.angle = 0;
  _frog.scale.setTo(1, 1);
  _frog.reset(_game.world.width / 4, _game.world.height / 2);
}

function initGround() {
  _ground = _game.add.tileSprite(0, _game.world.height - 32, _game.world.width, 32, 'ground');
  _ground.tileScale.setTo(2, 2);
}

function spawnCloud() {
  _cloudsTimer.stop();

  var cloudY = Math.random() * _game.height / 2;
  var cloud = _clouds.create(
    _game.width,
    cloudY,
    'clouds',
    Math.floor(4 * Math.random())
  );
  var cloudScale = 2 + 2 * Math.random();
  cloud.alpha = 2 / cloudScale;
  cloud.scale.setTo(cloudScale, cloudScale);
  cloud.body.allowGravity = false;
  cloud.body.velocity.x = -_speed / cloudScale;
  cloud.anchor.y = 0;

  _cloudsTimer.start();
  _cloudsTimer.add(4 * Math.random());
}

function initClouds() {
  _clouds = _game.add.group();
  _cloudsTimer = new Phaser.Timer(_game);
  _cloudsTimer.onEvent.add(spawnCloud);
  _cloudsTimer.add(Math.random());
  _cloudsTimer.start();
}


function doInitSounds(result, keyPrefix, l) {
  for (var i = 1; i <= l; i++) {
    result.push(_game.add.audio(keyPrefix + i));
  }
}


function initSounds() {
  doInitSounds(_scoreSounds, 'score', _numScoreSounds);
  doInitSounds(_hurtSounds, 'hurt', _numHurtSounds);

  _flapSound = _game.add.audio('flap', 0.5);

  _bgm = _game.add.audio('bgm', 0.5);
  _bgm.onStop.add(function() {
    if (_playBgm)
      _bgm.play();
  });
}

function randomPlaySound(list, count) {
  var sound;
  if (count == 1) {
    sound = list[0];
    sound.play();
  } else if (count > 1) {
    sound = list[Math.floor(Math.random() * count)];
    sound.play();
  }
  return sound;
}

function playScoreSound() {
  _currentScoreSound = randomPlaySound(_scoreSounds, _numScoreSounds);
}

function playHurtSound() {
  if (_currentScoreSound)
    _currentScoreSound.stop();
  randomPlaySound(_hurtSounds, _numHurtSounds);
}

function playFlapSound() {
  if (!_flapSound.isPlaying)
    _flapSound.play();
}

function playBgm() {
  if (_playBgm) {
    _playBgm = false;
    _bgm.stop()
  } else {
    _playBgm = true;
    _bgm.play();
  }
}

function removeOffscreenObjs(objs) {
  objs.forEachAlive(function(obj) {
    if (obj.x + obj.width < _game.world.bounds.left) {
      obj.kill();
    }
  });
}

function updateClouds() {
  removeOffscreenObjs(_clouds);
  _cloudsTimer.update();
}

function updatePipes() {
  removeOffscreenObjs(_pipes);
  _pipesTimer.update();
}

function updateGround() {
  _ground.tilePosition.x -= _game.time.physicsElapsed * _speed / 2;
}

function updateFrog() {
  // Make frog dive
  var dvy = _flap + _frog.body.velocity.y;
  _frog.angle = (90 * dvy / _flap) - 180;
  if (_frog.angle < 0) {
    _frog.angle = 0;
  }

  if (_gameOver) {
    _frog.scale.setTo(1, -1);
    _frog.angle = -20;
  }
}

function updateFrog2() {
  _frog.y = (_game.world.height / 2) + 8 * Math.cos(_game.time.now / 200);
}

function checkCollision() {
  if (_frog.body.bottom >= _game.world.bounds.bottom) {
    setGameOver();
    return;
  }
  if (_game.physics.overlap(_frog, _pipes)) {
    setGameOver();
    return;
  }
  // Add score
  _game.physics.overlap(_frog, _pipeInvisibleLines, addScore);
}

function addScore(_, inv) {
  _pipeInvisibleLines.remove(inv);
  _score += 1;
  showScore();
  playScoreSound();
}

function showScore() {
  _scoreText.setText(TEXT_SCORE.replace('%s', _score));
}

function setGameOver() {
  _gameOver = true;
  stopPipes();
  showGameOver();
  playHurtSound();
}

function showGameOver() {
  _totalTimeElapsed += _timeElapsed;
  _totalTimeElapsedText.setText(TEXT_TOTAL_TIME_ELAPSED.replace('%s', _totalTimeElapsed));
  _totalTimeElapsedText.renderable = true;

  var a = Math.floor(_score / _timeElapsed * 100);
  a = TEXT_GAME_OVER.replace('%s', _score).replace('%s', _timeElapsed).replace('%s', a);
  _gameOverText.setText(a);
  _gameOverText.renderable = true;
  _tryAgainText.renderable = true;
  _tryAgainSprite.events.onInputDown.addOnce(reset);
}

function hideGameOver() {
  _gameOverText.renderable = false;
  _tryAgainText.renderable = false;
}

function createTextSprite(t) {
  var s = _game.add.sprite(t.x, t.y);
  s.anchor.setTo(t.anchor.x, t.anchor.y);
  s.width = t.width;
  s.height = t.height;
  return s;
}

function initFeedback() {
  if (!_feedback)
    return;
  _feedbackText = _game.add.text(
    0,
    0,
    _feedback,
    {
      font: '14px ' + TEXT_FONT,
      fill: '#fff',
      stroke: '#430',
      strokeThickness: 4,
      align: 'center'
    }
  );
  if (!_feedbackFunc)
    return;
  _feedbackSprite = createTextSprite(_feedbackText);
  _feedbackSprite.inputEnabled = true;
  _feedbackSprite.events.onInputDown.add(_feedbackFunc);
}

function initTexts() {
  initFeedback();

  _playBgmText = _game.add.text(
    0,
    0,
    TEXT_PLAY_BGM,
    {
      font: '14px ' + TEXT_FONT,
      fill: '#fff',
      stroke: '#430',
      strokeThickness: 4,
      align: 'center'
    }
  );
  _playBgmText.x = _game.world.width - _playBgmText.width;
  _playBgmSprite = createTextSprite(_playBgmText);
  _playBgmSprite.inputEnabled = true;
  _playBgmSprite.events.onInputDown.add(playBgm);

  _scoreText = _game.add.text(
    _game.world.width / 2,
    _game.world.height / 4,
    '',
    {
      font: '14px ' + TEXT_FONT,
      fill: '#fff',
      stroke: '#430',
      strokeThickness: 4,
      align: 'center'
    }
  );
  _scoreText.anchor.setTo(0.5, 0.5);

  _timeElapsedText = _game.add.text(
    _game.world.width / 2,
    _scoreText.y + _scoreText.height,
    '',
    {
      font: '14px ' + TEXT_FONT,
      fill: '#f00',
      align: 'center'
    }
  );
  _timeElapsedText.anchor.setTo(0.5, 0.5);

  _totalTimeElapsedText = _game.add.text(
    _game.world.width / 2,
    0,
    '',
    {
      font: '14px ' + TEXT_FONT,
      fill: '#f00',
      align: 'center'
    }
  );
  _totalTimeElapsedText.anchor.setTo(0.5, 0);

  _tryAgainText = _game.add.text(
    _game.world.width / 2,
    _game.world.height - _game.world.height / 6,
    TEXT_TRY_AGAIN,
    {
      font: '22px ' + TEXT_FONT,
      fill: '#fff',
      stroke: '#430',
      strokeThickness: 4,
      align: 'center'
    }
  );
  _tryAgainText.anchor.setTo(0.5, 0.5);

  _tryAgainSprite = createTextSprite(_tryAgainText);
  _tryAgainSprite.inputEnabled = true;

  _gameOverText = _game.add.text(
    _game.world.width / 2,
    _game.world.height / 2,
    '',
    {
      font: '18px ' + TEXT_FONT,
      fill: '#fff',
      stroke: '#430',
      strokeThickness: 4,
      align: 'center'
    }
  );
  _gameOverText.anchor.setTo(0.5, 0.5);
}

function start() {
  _totalTimeElapsedText.renderable = false;

  _frog.body.allowGravity = true;
  startPipes();
  _gameStarted = true;

  _startTime = _game.time.now;
}

function flap() {
  if (!_gameStarted) {
    start();
  }
  if (!_gameOver) {
    _frog.body.velocity.y = -_flap;
    playFlapSound();
  }
}

function checkKeyCode(input, a) {
  if (!input || !a)
    return;
  return input == a[0] || input == a[1];
}

function onKeyDown(e) { }

function onKeyUp(e) {
  if (checkKeyCode(e.keyCode, _flapKeyCode)) {
    flap();
  } else if (checkKeyCode(e.keyCode, _bgmKeyCode)) {
    playBgm();
  } else if (_feedbackFunc && checkKeyCode(e.keyCode, _feedbackKeyCode)) {
    _feedbackFunc();
  }
}

function unlockAudio() {
  var context = _game.sound.context;
  if (context && context.state === 'suspended')
    context.resume();
}

function initControls() {
  _game.input.onUp.add(unlockAudio);

  _game.input.onDown.add(flap);
  _game.input.keyboard.addCallbacks(_game, onKeyDown, onKeyUp);
}


function reset() {
  _timeElapsedText.setText('');

  _score = 0;
  _gameOver = false;
  _gameStarted = false;

  hideGameOver();

  resetFrog();
  resetPipes();

  showScore();
}

function create() {
  initBackground();
  initPipes();
  initFrog();
  initGround();
  initTexts();
  initClouds();
  initSounds();
  initControls();

  reset();
}

function setTimeElapsed() {
  var a = Math.floor(_game.time.elapsedSecondsSince(_startTime)) + 1;
  if (_timeElapsed != a) {
    _timeElapsed = a;
    _timeElapsedText.setText(TEXT_TIME_ELAPSED.replace('%s', _timeElapsed));
  }
}

function update() {
  updateClouds();
  if (_gameStarted) {
    updateFrog();
    if (!_gameOver) {
      setTimeElapsed();
      checkCollision();
    }
    updatePipes();
  } else {
    updateFrog2();
  }

  if (!_gameOver) {
    updateGround();
  }
}

function render() {
  if (!_debug)
    return;

  _game.debug.renderSpriteBody(_tryAgainSprite);
  _game.debug.renderSpriteBody(_playBgmSprite);
  _game.debug.renderSpriteBody(_frog);

  _pipes.forEachAlive(function(pipe) {
    _game.debug.renderSpriteBody(pipe);
  });
  _pipeInvisibleLines.forEach(function(inv) {
    _game.debug.renderSpriteBody(inv);
  });

}

function init(options) {
  if (typeof options.debug !== 'undefined')
    _debug = options.debug;

  if (typeof options.gravity !== 'undefined')
    _gravity = options.gravity;

  if (typeof options.speed !== 'undefined')
    _speed = options.speed;

  if (typeof options.flap !== 'undefined')
    _flap = options.flap;

  if (typeof options.spawnRate !== 'undefined')
    _spawnRate = options.spawnRate;

  if (typeof options.opening !== 'undefined')
    _opening = options.opening;

  if (typeof options.flapKeyCode !== 'undefined')
    _flapKeyCode = options.flapKeyCode;

  if (typeof options.numScoreSounds !== 'undefined')
    _numScoreSounds = options.numScoreSounds;

  if (typeof options.numHurtSounds !== 'undefined')
    _numHurtSounds = options.numHurtSounds;

  if (typeof options.baseUrl !== 'undefined')
    _baseUrl = options.baseUrl;

  if (typeof options.feedback !== 'undefined')
    _feedback = options.feedback;

  if (typeof options.feedbackFunc !== 'undefined')
    _feedbackFunc = options.feedbackFunc;

  if (typeof options.bgmKeyCode !== 'undefined')
    _bgmKeyCode = options.bgmKeyCode;

  if (typeof options.feedbackKeyCode !== 'undefined')
    _feedbackKeyCode = options.feedbackKeyCode;

  _game = new Phaser.Game(
    480,
    700,
    Phaser.CANVAS,
    options.parent,
    {
      preload: preload,
      create: create,
      update: update,
      render: render
    },
    false,
    false
  );
}

initGame = init;
})();

var initGame;
