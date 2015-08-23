(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var BuildScene = {
  init: function (map){
    this.map = map ? map : this.buildMap();
  },

  create: function () {
    this.cursors = this.game.input.keyboard.createCursorKeys();
    this.enter = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    this.help = this.game.input.keyboard.addKey(Phaser.Keyboard.H);
    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    var pWidth = this.pWidth = this.game.world.width / 100;

    var bmd = this.bmd = this.game.add.bitmapData(pWidth,pWidth);
    bmd.ctx.beginPath();
    bmd.ctx.rect(0, 0,pWidth,pWidth);
    bmd.ctx.fillStyle = '#ffffff';
    bmd.ctx.fill();

    this.createPlatforms();

    this.alerts = this.game.add.text(this.game.world.width/2, 20, "Build Your dungeon. Enter to continue. left/right to select, up/down to change.Press H for help", {fontSize: 16, fill: "DarkCyan"});
    this.alerts.anchor.set(0.5)

    this.cursors.left.onDown.add(function(){
      this.select(this.selectedIndex - 1)
    }, this)
    this.cursors.right.onDown.add(function(){
      this.select(this.selectedIndex + 1)
    }, this)
    this.cursors.up.onDown.add(function(){
      this.changeHeight(1)
    }, this)
    this.cursors.down.onDown.add(function(){
      this.changeHeight(-1)
    }, this)
    this.enter.onDown.add(function(){
      this.game.state.start('play', true, false, this.map)
    }, this)
    this.help.onDown.add(function(){
      this.game.state.start('title', true, false, this.map)
    }, this)
    this.select(1);
  },

  buildMap: function(){
    var currentHeight = (Math.random() * (this.game.world.height - 200)) + 100
    var map = [];
    var level = 0
    var hole = false;
    for (var i = -20; i < 160; i++){
      if (i < 0 || i > 100){
        map[i] = currentHeight;
      } else {
        if (Math.floor(i / 5.0) !== level){
          hole = hole ? false : Math.random() > 0.9
          if (!hole){
            currentHeight += Math.random() > 0.5 ? 30 : - 30;
            while (currentHeight < 100 || currentHeight > this.game.world.height - 100){
                currentHeight += Math.random() > 0.5 ? 30 : - 30;
            }
          }
          level = Math.floor(i / 5.0);
        }
        if (hole){
          map[i] = 0;
        } else {
          map[i] = currentHeight;
        }
      }
    }
    return map;
  },

  changeHeight: function(dir){
    var newHeight = this.map[this.selectedIndex * 5] + (dir * 30)
    if (newHeight > (this.neighborHeights()[0] + 30) || newHeight > (this.neighborHeights()[1] + 30)){
      newHeight = Math.min((this.neighborHeights()[0] + 30), (this.neighborHeights()[1] + 30));
    } else if (newHeight < (this.neighborHeights()[0] - 30) || newHeight < (this.neighborHeights()[1] - 30) ){
      if (this.map[this.selectedIndex * 5] === 0){
        newHeight = Math.max((this.neighborHeights()[0] - 30), (this.neighborHeights()[1] - 30));
      } else if (this.canBeHole()){
        newHeight = 0;
      } else {
        newHeight = Math.max((this.neighborHeights()[0] - 30), (this.neighborHeights()[1] - 30));
      }
    }
    this.selected.forEach(function(p, i){
      p.y = this.game.world.height - newHeight;
      this.map[this.selectedIndex * 5 + i] = newHeight
      p.scale.y = newHeight / this.pWidth;
      p.tint = 0x0000ff
      if (newHeight === 0){
        p.y = this.game.world.height - 30;
        p.scale.y = 30/this.pWidth;
        p.tint = 0x6666ff
      }
    }.bind(this))

  },

  select: function(i){
    if(i >= 0 || i <= 19){
      if (this.selected){
        this.selected.forEach(function(p){
          p.tint = 0xffffff
        }.bind(this))
        this.setHeights()
      }
      this.selectedIndex = i;
      this.selected = this.platforms.children.slice(i*5, (i+1)*5)
      this.selected.forEach(function(p){
        if (this.map[i*5] === 0){
          p.y = this.game.world.height - 30;
          p.scale.y = 30/this.pWidth;
          p.tint = 0x6666ff
        } else {
          p.tint = 0x0000ff
        }
      }.bind(this))
    }
  },

  neighborHeights: function(){
    var left = this.map[this.selectedIndex * 5 - 1] === 0 ? this.map[this.selectedIndex * 5 - 6] : this.map[this.selectedIndex * 5 - 1];
    var right = this.map[((this.selectedIndex + 1) * 5) + 1] === 0 ? this.map[((this.selectedIndex + 1) * 5) + 6] : this.map[((this.selectedIndex + 1) * 5) + 1];
    return [left, right]
  },

  createPlatforms: function(){
    var platforms = this.platforms = this.game.add.group();
    platforms.enableBody = true;
    for (var x = 0; x < this.map.length; x++){
      var y = this.map[x];
      var platform = platforms.create((x * this.pWidth), this.game.world.height - y, this.bmd);
      platform.scale.y = y / this.pWidth;
      platform.body.immovable = true;
    }
  },

  setHeights: function(){
    for (var x = 0; x < this.map.length; x++){
      var y = this.map[x];
      var platform = this.platforms.children[x];
      platform.scale.y = y / this.pWidth;
    }
  },

  canBeHole: function(){
    if (this.map[this.selectedIndex * 5 - 1] === 0 || this.map[((this.selectedIndex + 1) * 5) + 1] === 0){
      return false;
    } else if ((this.selectedIndex * 5 - 1) < 0){
      return false;
    }
    return true;
  }
};

module.exports = BuildScene;

},{}],2:[function(require,module,exports){
'use strict';

var PlayScene = require('./play_scene.js');
var BuildScene = require('./build_scene.js');
var TitleScene = require('./title_scene.js');
var ScoreScene = require('./score_scene.js');
var synaptic = require('synaptic');
var chance = require('chance');

var BootScene = {
  preload: function () {
    // load here assets required for the loading screen
    this.game.load.image('preloader_bar', 'images/preloader_bar.png');
  },

  create: function () {
    this.game.state.start('preloader');
    this.game.AI = new synaptic.Architect.Perceptron(8,20,20,10,10,2);
    this.game.Trainer = this.game.AI.trainer;
    this.game.trainingSet = [];
  }
};


var PreloaderScene = {
  preload: function () {
    this.loadingBar = this.game.add.sprite(0, 240, 'preloader_bar');
    this.loadingBar.anchor.setTo(0, 0.5);
    this.load.setPreloadSprite(this.loadingBar);

    // TODO: load here the assets for the game
    this.game.load.image('title', 'images/title.png');

    this.game.load.audio('music', ['audio/music.ogg']);
  },

  create: function () {
    var music = this.game.add.audio('music');
    music.loop = true;
    music.volume = 0.3;
    music.play();
    this.game.state.start('title');
  }
};


window.onload = function () {
  var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game');

  game.state.add('boot', BootScene);
  game.state.add('preloader', PreloaderScene);
  game.state.add('play', PlayScene);
  game.state.add('build', BuildScene);
  game.state.add('title', TitleScene);
  game.state.add('score', ScoreScene);

  game.state.start('boot');
};

},{"./build_scene.js":1,"./play_scene.js":3,"./score_scene.js":4,"./title_scene.js":5,"chance":10,"synaptic":15}],3:[function(require,module,exports){
'use strict';

var PlayScene = {
  init: function(map) {
    this.map = map;
  },

  create: function () {
    this.cursors = this.game.input.keyboard.createCursorKeys();
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.heroCount = 10;
    this.heroTimer = 0;
    this.goldCount = 5000;
    this.deaths = 0;
    this.maxDeaths = 200;
    var pWidth = this.pWidth = this.game.world.width / 100;
    // create a new bitmap data object
    var bmd = this.bmd = this.game.add.bitmapData(pWidth,pWidth);

    // draw to the canvas context like normal
    bmd.ctx.beginPath();
    bmd.ctx.rect(0, 0,pWidth,pWidth);
    bmd.ctx.fillStyle = '#ffffff';
    bmd.ctx.fill();

    var map = this.map;
    var heroes = this.heroes = this.game.add.group();
    var platforms = this.platforms = this.game.add.group();
    this.souls = this.game.add.group();
    platforms.enableBody = true;
    for (var x = 0; x < map.length; x++){
      var y = map[x];
      var platform = platforms.create((x * pWidth), this.game.world.height - y, bmd);
      platform.scale.y = y / pWidth;
      platform.body.immovable = true;
    }
    this.maxFear = this.game.add.sprite(0, this.game.world.height - 40, bmd)
    this.fear = this.game.add.sprite(0, this.game.world.height - 40, bmd)
    this.fear.tint = 0xff0000;
    this.maxFear.tint = 0x00ff00;
    this.score = this.game.add.text(0, this.game.world.height - 20, "Souls Collected: " + this.deaths + " / " + this.maxDeaths, {backgroundColor: "white", fontSize: 16, fill: "DarkCyan"});
    this.game.physics.arcade.enable(this.score);
    this.gold = this.game.add.text(10, this.game.world.height - 20, "Remaining gold: " + this.goldCount, {backgroundColor: "white", fontSize: 16, fill: "DarkGoldenRod"})
    this.gold.x = this.game.world.width - this.gold.width - 20;
    this.alerts = this.game.add.text(this.game.world.width/2, 20, "The doors open...", {fontSize: 16, fill: "DarkCyan"});
    this.alerts.anchor.set(0.5)
  },

  update: function() {
      this.game.physics.arcade.collide(this.heroes, this.platforms);
      this.game.physics.arcade.overlap(this.score, this.souls, function(score, soul){
        soul.destroy()
      });
      if (this.heroCount > 0 && this.heroTimer % 40 === 0){
        var hero = this.heroes.create(0, this.game.world.height - this.map[0] - this.pWidth, this.bmd);
        this.game.physics.arcade.enable(hero);
        hero.body.bounce.y = 0.2;
        hero.body.gravity.y = 700;
        hero.body.collideWorldBounds = true;
        hero.body.checkCollision.down = true;
        hero.body.checkCollision.up = false;
        hero.body.checkCollision.left = false;
        hero.body.checkCollision.right = true;
        hero.timer = 0;
        hero.history = [];
        hero.newPlatform = true;
        this.heroCount--;
      }
      this.heroTimer++;
      this.heroes.forEach(this.moveHero.bind(this))
      this.score.text = "Souls Collected: " + this.deaths;
      this.gold.text = "Remaining gold: " + this.goldCount;
      this.gold.x = this.game.world.width - this.gold.width - 20;
      this.fear.scale.x = this.deaths/(this.pWidth * 7);
      this.maxFear.scale.x = this.maxDeaths/(this.pWidth * 7);
  },

  punish: function(hero, strength, propagate, distance){
    this.game.AI.propagate(strength, this.toBad(hero.move));
    if (propagate){
      var set = this.getTrainingSet(false, hero, distance);
      this.game.Trainer.train(set, {rate: strength, iterations: 20});
      this.game.trainingSet = this.game.trainingSet.concat(set);
    }
  },

  reward: function(hero, strength, propagate, distance){
    this.game.AI.propagate(strength, this.toGood(hero.move));
    if (propagate){
      var set = this.getTrainingSet(true, hero, distance);
      this.game.Trainer.train(set, {rate: strength, iterations: 20});
      this.game.trainingSet = this.game.trainingSet.concat(set);
    }
  },

  restart: function(hero){
    hero.body.x = 0;
    hero.body.y = this.game.world.height - this.map[0] - this.pWidth;
  },

  toGood: function(move){
    return move;//[move[0] > 0.5 ? 1 : 0, move[1] > 0.5 ? 1 : 0];
  },

  toBad: function(move){
      return [Math.random(), Math.random()];
  },

  getSurroundings: function(hero){
    var height = (this.map[hero.pos] === 0) ? -1 : Math.floor((hero.body.y - this.map[hero.pos])/10)
    var falling = (hero.body.velocity.y > 0) ? 1 : 0
    var results = [hero.pos % 5, height, falling];
    for(var i = 5; i <= 30; i += 5){
      results.push(Math.floor((this.map[i] - this.map[hero.pos])/30));
    }
    return results;
  },

  moveHero: function(hero){
    var pos = hero.pos = Math.floor(hero.body.x / this.pWidth);

    var state = this.getSurroundings(hero)
    hero.move = this.game.AI.activate(state);
    var go = hero.move[0] > 0.5;
    var jump = hero.move[1] > 0.5;
    hero.timer++;

    if (!go || (go && !hero.body.velocity.x) || (jump && hero.body.touching.down) || (hero.timer % 30 === 0) ){
      hero.history.push([state, this.toGood(hero.move), this.toBad(hero.move)]);
      hero.timer = 0;
    }

    if (hero.body.velocity.x < 5 && (hero.timer === 0)){
      this.punish(hero, .1);
    }
    if (hero.body.touching.right || (hero.body.y > this.game.world.height - 50)){
      this.die(hero)
    } else if (!hero.newPlatform && (this.map[pos] !== this.map[pos - 1]) && this.map[pos] !== 0){
      this.reward(hero, pos/100.0, true, 10);
      hero.newPlatform = true;
    } else if (hero.newPlatform && (this.map[pos] === this.map[pos - 1])){
      hero.newPlatform = false;
    }
    hero.body.velocity.x = 0;
    if (go){
        hero.body.velocity.x = 130;
    }
    if (jump && hero.body.touching.down){
        hero.body.velocity.y = -300;
    }

    if (pos > 98){
      this.looted(hero);
    }
  },

  getTrainingSet: function(good, hero, distance){
    var trainingSet = []
    var len = hero.history.length;
    if (len){
      for (var i = Math.min(len, (distance ? distance : len)); i > 0; i--){
        var tp = hero.history[len - i];
        trainingSet.push({input: tp[0], output: tp[good ? 1 : 2]});
      }
    }
    return trainingSet;
  },

  reset: function(){
    this.game.AI.trainer.train(this.game.trainingSet, {rate: .5, iterations: 10, log: 10, randomize: true});
    this.game.state.start('score',true,false, this.deaths, this.gold, this.maxDeaths, this.map);
    var json = {};
    json.trainingSet = this.game.trainingSet;
    json.network = this.game.AI.toJSON()
    console.log(json);
  },

  looted: function(hero){
    this.reward(hero, .9, true)
    this.game.trainingSet = this.game.trainingSet.concat(this.getTrainingSet(true, hero))
    hero.destroy();
    this.maxDeaths += 50;
    this.goldCount -= 1000;
    this.heroCount += 3;
    this.alert(chance.capitalize(chance.word()) + " has looted you! Damn heroes stealing your shit.");
    if (this.goldCount < 0){
      this.reset();
    }
  },

  die: function(hero){
    this.punish(hero, 0.5, true, 5);
    var soul = this.souls.create(hero.body.x, hero.body.y, this.bmd)
    soul.tint = 0xccccff;
    this.game.physics.arcade.enable(soul);
    soul.body.bounce.y = 0.6;
    soul.body.gravity.y = 200;
    soul.body.collideWorldBounds = true;
    soul.body.velocity.x = -50;
    this.restart(hero);
    this.deaths++;
    this.goldCount += Math.floor(Math.random() * 10);
    if (this.deaths % 50 === 0){
      this.alert("You just ate the great Hero " + chance.capitalize(chance.word()) + ", their soul hit the spot.")
    }
    if (this.deaths === 10){
      this.alert("Ten Yummy hero souls...")
    }
    if (this.deaths === 100){
      this.alert("Your dungeon has killed 100 Heroes. Tasty")
    }
    if (this.deaths === 300){
      this.alert("You've collected 300 Souls. All too easy!")
    }
    if (this.deaths === 500){
      this.alert("Om Nom Nom 500 souls")
    }
    if (this.deaths === 1000){
      this.alert("Your dungeon has killed 1000 Heroes! Man these guys are dumb...")
    }
    if (this.deaths === 2000){
      this.alert("2000 Heroes have perished in your walls, you should feel proud.")
    }
    if (this.deaths >= this.maxDeaths){
      this.reset();
    }
  },

  alert: function(text){
    this.alerts.text = text;
  }
};

module.exports = PlayScene;

},{}],4:[function(require,module,exports){
'use strict';

var ScoreScene = {
  init: function(souls, gold, maxSouls, map){
    this.souls = souls;
    this.gold = gold;
    this.maxSouls = maxSouls;
    this.map = map;
  },
  create: function () {
    this.new = this.game.input.keyboard.addKey(Phaser.Keyboard.N);
    this.enter = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    this.edit = this.game.input.keyboard.addKey(Phaser.Keyboard.E);

    this.alerts = this.game.add.text(this.game.world.width/2, 50, "You Collected " + this.souls + " souls!", {fontSize: 32, fill: "DarkCyan"});
    this.alerts.anchor.set(0.5)

    this.reason = this.game.add.text(this.game.world.width/2, 150, "", {fontSize: 16, fill: "DarkCyan"});
    this.reason.anchor.set(0.5)

    this.reason.text = this.souls < this.maxSouls ? "You ran out of gold, so the heroes stopped coming" : "Your dungeon was too dangerous, and scared most heroes away";

    this.dirs = this.game.add.text(this.game.world.width/2, 400, "To Edit your dungeon, press 'E'\nTo Start with a new dungeon, press 'N' or 'enter'", {fontSize: 16, fill: "DarkCyan"});
    this.dirs.anchor.set(0.5);

    this.new.onDown.add(function(){
      this.game.state.start('build', true, false)
    }, this)
    this.enter.onDown.add(function(){
      this.game.state.start('build', true, false)
    }, this)
    this.edit.onDown.add(function(){
      this.game.state.start('build', true, false, this.map)
    }, this)
  }
};



module.exports = ScoreScene;

},{}],5:[function(require,module,exports){
'use strict';

var TitleScene = {
  init: function(map){
    this.map = map;
  },
  create: function () {
    this.enter = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);

    this.game.add.sprite(0,0,'title')
    this.alerts = this.game.add.text(this.game.world.width/2, 20, "Enter to continue. ", {fontSize: 16, fill: "DarkCyan"});
    this.alerts.anchor.set(0.5)

    this.enter.onDown.add(function(){
      this.game.state.start('build', true, false, this.map)
    }, this)
  }
};



module.exports = TitleScene;

},{}],6:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
 *     on objects.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = (function () {
  function Bar () {}
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    arr.constructor = Bar
    return arr.foo() === 42 && // typed array instances can be augmented
        arr.constructor === Bar && // constructor can be set
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  this.length = 0
  this.parent = undefined

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    array.byteLength
    that = Buffer._augment(new Uint8Array(array))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` is deprecated
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` is deprecated
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var firstByte
  var secondByte
  var thirdByte
  var fourthByte
  var bytesPerSequence
  var tempCodePoint
  var codePoint
  var res = []
  var i = start

  for (; i < end; i += bytesPerSequence) {
    firstByte = buf[i]
    codePoint = 0xFFFD

    if (firstByte > 0xEF) {
      bytesPerSequence = 4
    } else if (firstByte > 0xDF) {
      bytesPerSequence = 3
    } else if (firstByte > 0xBF) {
      bytesPerSequence = 2
    } else {
      bytesPerSequence = 1
    }

    if (i + bytesPerSequence <= end) {
      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === 0xFFFD) {
      // we generated an invalid codePoint so make sure to only advance by 1 byte
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
  }

  return String.fromCharCode.apply(String, res)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue

        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000

    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

},{"base64-js":7,"ieee754":8,"is-array":9}],7:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],8:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],9:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],10:[function(require,module,exports){
(function (Buffer){
//  Chance.js 0.7.6
//  http://chancejs.com
//  (c) 2013 Victor Quinn
//  Chance may be freely distributed or modified under the MIT license.

(function () {

    // Constants
    var MAX_INT = 9007199254740992;
    var MIN_INT = -MAX_INT;
    var NUMBERS = '0123456789';
    var CHARS_LOWER = 'abcdefghijklmnopqrstuvwxyz';
    var CHARS_UPPER = CHARS_LOWER.toUpperCase();
    var HEX_POOL  = NUMBERS + "abcdef";

    // Cached array helpers
    var slice = Array.prototype.slice;

    // Constructor
    function Chance (seed) {
        if (!(this instanceof Chance)) {
            return seed == null ? new Chance() : new Chance(seed);
        }

        // if user has provided a function, use that as the generator
        if (typeof seed === 'function') {
            this.random = seed;
            return this;
        }

        var seedling;

        if (arguments.length) {
            // set a starting value of zero so we can add to it
            this.seed = 0;
        }
        // otherwise, leave this.seed blank so that MT will recieve a blank

        for (var i = 0; i < arguments.length; i++) {
            seedling = 0;
            if (typeof arguments[i] === 'string') {
                for (var j = 0; j < arguments[i].length; j++) {
                    seedling += (arguments[i].length - j) * arguments[i].charCodeAt(j);
                }
            } else {
                seedling = arguments[i];
            }
            this.seed += (arguments.length - i) * seedling;
        }

        // If no generator function was provided, use our MT
        this.mt = this.mersenne_twister(this.seed);
        this.bimd5 = this.blueimp_md5();
        this.random = function () {
            return this.mt.random(this.seed);
        };

        return this;
    }

    Chance.prototype.VERSION = "0.7.6";

    // Random helper functions
    function initOptions(options, defaults) {
        options || (options = {});

        if (defaults) {
            for (var i in defaults) {
                if (typeof options[i] === 'undefined') {
                    options[i] = defaults[i];
                }
            }
        }

        return options;
    }

    function testRange(test, errorMessage) {
        if (test) {
            throw new RangeError(errorMessage);
        }
    }

    /**
     * Encode the input string with Base64.
     */
    var base64 = function() {
        throw new Error('No Base64 encoder available.');
    };

    // Select proper Base64 encoder.
    (function determineBase64Encoder() {
        if (typeof btoa === 'function') {
            base64 = btoa;
        } else if (typeof Buffer === 'function') {
            base64 = function(input) {
                return new Buffer(input).toString('base64');
            };
        }
    })();

    // -- Basics --

    /**
     *  Return a random bool, either true or false
     *
     *  @param {Object} [options={ likelihood: 50 }] alter the likelihood of
     *    receiving a true or false value back.
     *  @throws {RangeError} if the likelihood is out of bounds
     *  @returns {Bool} either true or false
     */
    Chance.prototype.bool = function (options) {
        // likelihood of success (true)
        options = initOptions(options, {likelihood : 50});

        // Note, we could get some minor perf optimizations by checking range
        // prior to initializing defaults, but that makes code a bit messier
        // and the check more complicated as we have to check existence of
        // the object then existence of the key before checking constraints.
        // Since the options initialization should be minor computationally,
        // decision made for code cleanliness intentionally. This is mentioned
        // here as it's the first occurrence, will not be mentioned again.
        testRange(
            options.likelihood < 0 || options.likelihood > 100,
            "Chance: Likelihood accepts values from 0 to 100."
        );

        return this.random() * 100 < options.likelihood;
    };

    /**
     *  Return a random character.
     *
     *  @param {Object} [options={}] can specify a character pool, only alpha,
     *    only symbols, and casing (lower or upper)
     *  @returns {String} a single random character
     *  @throws {RangeError} Can only specify alpha or symbols, not both
     */
    Chance.prototype.character = function (options) {
        options = initOptions(options);
        testRange(
            options.alpha && options.symbols,
            "Chance: Cannot specify both alpha and symbols."
        );

        var symbols = "!@#$%^&*()[]",
            letters, pool;

        if (options.casing === 'lower') {
            letters = CHARS_LOWER;
        } else if (options.casing === 'upper') {
            letters = CHARS_UPPER;
        } else {
            letters = CHARS_LOWER + CHARS_UPPER;
        }

        if (options.pool) {
            pool = options.pool;
        } else if (options.alpha) {
            pool = letters;
        } else if (options.symbols) {
            pool = symbols;
        } else {
            pool = letters + NUMBERS + symbols;
        }

        return pool.charAt(this.natural({max: (pool.length - 1)}));
    };

    // Note, wanted to use "float" or "double" but those are both JS reserved words.

    // Note, fixed means N OR LESS digits after the decimal. This because
    // It could be 14.9000 but in JavaScript, when this is cast as a number,
    // the trailing zeroes are dropped. Left to the consumer if trailing zeroes are
    // needed
    /**
     *  Return a random floating point number
     *
     *  @param {Object} [options={}] can specify a fixed precision, min, max
     *  @returns {Number} a single floating point number
     *  @throws {RangeError} Can only specify fixed or precision, not both. Also
     *    min cannot be greater than max
     */
    Chance.prototype.floating = function (options) {
        options = initOptions(options, {fixed : 4});
        testRange(
            options.fixed && options.precision,
            "Chance: Cannot specify both fixed and precision."
        );

        var num;
        var fixed = Math.pow(10, options.fixed);

        var max = MAX_INT / fixed;
        var min = -max;

        testRange(
            options.min && options.fixed && options.min < min,
            "Chance: Min specified is out of range with fixed. Min should be, at least, " + min
        );
        testRange(
            options.max && options.fixed && options.max > max,
            "Chance: Max specified is out of range with fixed. Max should be, at most, " + max
        );

        options = initOptions(options, { min : min, max : max });

        // Todo - Make this work!
        // options.precision = (typeof options.precision !== "undefined") ? options.precision : false;

        num = this.integer({min: options.min * fixed, max: options.max * fixed});
        var num_fixed = (num / fixed).toFixed(options.fixed);

        return parseFloat(num_fixed);
    };

    /**
     *  Return a random integer
     *
     *  NOTE the max and min are INCLUDED in the range. So:
     *  chance.integer({min: 1, max: 3});
     *  would return either 1, 2, or 3.
     *
     *  @param {Object} [options={}] can specify a min and/or max
     *  @returns {Number} a single random integer number
     *  @throws {RangeError} min cannot be greater than max
     */
    Chance.prototype.integer = function (options) {
        // 9007199254740992 (2^53) is the max integer number in JavaScript
        // See: http://vq.io/132sa2j
        options = initOptions(options, {min: MIN_INT, max: MAX_INT});
        testRange(options.min > options.max, "Chance: Min cannot be greater than Max.");

        return Math.floor(this.random() * (options.max - options.min + 1) + options.min);
    };

    /**
     *  Return a random natural
     *
     *  NOTE the max and min are INCLUDED in the range. So:
     *  chance.natural({min: 1, max: 3});
     *  would return either 1, 2, or 3.
     *
     *  @param {Object} [options={}] can specify a min and/or max
     *  @returns {Number} a single random integer number
     *  @throws {RangeError} min cannot be greater than max
     */
    Chance.prototype.natural = function (options) {
        options = initOptions(options, {min: 0, max: MAX_INT});
        testRange(options.min < 0, "Chance: Min cannot be less than zero.");
        return this.integer(options);
    };

    /**
     *  Return a random string
     *
     *  @param {Object} [options={}] can specify a length
     *  @returns {String} a string of random length
     *  @throws {RangeError} length cannot be less than zero
     */
    Chance.prototype.string = function (options) {
        options = initOptions(options, { length: this.natural({min: 5, max: 20}) });
        testRange(options.length < 0, "Chance: Length cannot be less than zero.");
        var length = options.length,
            text = this.n(this.character, length, options);

        return text.join("");
    };

    // -- End Basics --

    // -- Helpers --

    Chance.prototype.capitalize = function (word) {
        return word.charAt(0).toUpperCase() + word.substr(1);
    };

    Chance.prototype.mixin = function (obj) {
        for (var func_name in obj) {
            Chance.prototype[func_name] = obj[func_name];
        }
        return this;
    };

    /**
     *  Given a function that generates something random and a number of items to generate,
     *    return an array of items where none repeat.
     *
     *  @param {Function} fn the function that generates something random
     *  @param {Number} num number of terms to generate
     *  @param {Object} options any options to pass on to the generator function
     *  @returns {Array} an array of length `num` with every item generated by `fn` and unique
     *
     *  There can be more parameters after these. All additional parameters are provided to the given function
     */
    Chance.prototype.unique = function(fn, num, options) {
        testRange(
            typeof fn !== "function",
            "Chance: The first argument must be a function."
        );

        options = initOptions(options, {
            // Default comparator to check that val is not already in arr.
            // Should return `false` if item not in array, `true` otherwise
            comparator: function(arr, val) {
                return arr.indexOf(val) !== -1;
            }
        });

        var arr = [], count = 0, result, MAX_DUPLICATES = num * 50, params = slice.call(arguments, 2);

        while (arr.length < num) {
            result = fn.apply(this, params);
            if (!options.comparator(arr, result)) {
                arr.push(result);
                // reset count when unique found
                count = 0;
            }

            if (++count > MAX_DUPLICATES) {
                throw new RangeError("Chance: num is likely too large for sample set");
            }
        }
        return arr;
    };

    /**
     *  Gives an array of n random terms
     *
     *  @param {Function} fn the function that generates something random
     *  @param {Number} n number of terms to generate
     *  @returns {Array} an array of length `n` with items generated by `fn`
     *
     *  There can be more parameters after these. All additional parameters are provided to the given function
     */
    Chance.prototype.n = function(fn, n) {
        testRange(
            typeof fn !== "function",
            "Chance: The first argument must be a function."
        );

        if (typeof n === 'undefined') {
            n = 1;
        }
        var i = n, arr = [], params = slice.call(arguments, 2);

        // Providing a negative count should result in a noop.
        i = Math.max( 0, i );

        for (null; i--; null) {
            arr.push(fn.apply(this, params));
        }

        return arr;
    };

    // H/T to SO for this one: http://vq.io/OtUrZ5
    Chance.prototype.pad = function (number, width, pad) {
        // Default pad to 0 if none provided
        pad = pad || '0';
        // Convert number to a string
        number = number + '';
        return number.length >= width ? number : new Array(width - number.length + 1).join(pad) + number;
    };

    Chance.prototype.pick = function (arr, count) {
        if (arr.length === 0) {
            throw new RangeError("Chance: Cannot pick() from an empty array");
        }
        if (!count || count === 1) {
            return arr[this.natural({max: arr.length - 1})];
        } else {
            return this.shuffle(arr).slice(0, count);
        }
    };

    Chance.prototype.shuffle = function (arr) {
        var old_array = arr.slice(0),
            new_array = [],
            j = 0,
            length = Number(old_array.length);

        for (var i = 0; i < length; i++) {
            // Pick a random index from the array
            j = this.natural({max: old_array.length - 1});
            // Add it to the new array
            new_array[i] = old_array[j];
            // Remove that element from the original array
            old_array.splice(j, 1);
        }

        return new_array;
    };

    // Returns a single item from an array with relative weighting of odds
    Chance.prototype.weighted = function(arr, weights) {
        if (arr.length !== weights.length) {
            throw new RangeError("Chance: length of array and weights must match");
        }

        // Handle weights that are less or equal to zero.
        for (var weightIndex = weights.length - 1; weightIndex >= 0; --weightIndex) {
            // If the weight is less or equal to zero, remove it and the value.
            if (weights[weightIndex] <= 0) {
                arr.splice(weightIndex,1);
                weights.splice(weightIndex,1);
            }
        }

        // If any of the weights are less than 1, we want to scale them up to whole
        //   numbers for the rest of this logic to work
        if (weights.some(function(weight) { return weight < 1; })) {
            var min = weights.reduce(function(min, weight) {
                return (weight < min) ? weight : min;
            }, weights[0]);

            var scaling_factor = 1 / min;

            weights = weights.map(function(weight) {
                return weight * scaling_factor;
            });
        }

        var sum = weights.reduce(function(total, weight) {
            return total + weight;
        }, 0);

        // get an index
        var selected = this.natural({ min: 1, max: sum });

        var total = 0;
        var chosen;
        // Using some() here so we can bail as soon as we get our match
        weights.some(function(weight, index) {
            if (selected <= total + weight) {
                chosen = arr[index];
                return true;
            }
            total += weight;
            return false;
        });

        return chosen;
    };

    // -- End Helpers --

    // -- Text --

    Chance.prototype.paragraph = function (options) {
        options = initOptions(options);

        var sentences = options.sentences || this.natural({min: 3, max: 7}),
            sentence_array = this.n(this.sentence, sentences);

        return sentence_array.join(' ');
    };

    // Could get smarter about this than generating random words and
    // chaining them together. Such as: http://vq.io/1a5ceOh
    Chance.prototype.sentence = function (options) {
        options = initOptions(options);

        var words = options.words || this.natural({min: 12, max: 18}),
            text, word_array = this.n(this.word, words);

        text = word_array.join(' ');

        // Capitalize first letter of sentence, add period at end
        text = this.capitalize(text) + '.';

        return text;
    };

    Chance.prototype.syllable = function (options) {
        options = initOptions(options);

        var length = options.length || this.natural({min: 2, max: 3}),
            consonants = 'bcdfghjklmnprstvwz', // consonants except hard to speak ones
            vowels = 'aeiou', // vowels
            all = consonants + vowels, // all
            text = '',
            chr;

        // I'm sure there's a more elegant way to do this, but this works
        // decently well.
        for (var i = 0; i < length; i++) {
            if (i === 0) {
                // First character can be anything
                chr = this.character({pool: all});
            } else if (consonants.indexOf(chr) === -1) {
                // Last character was a vowel, now we want a consonant
                chr = this.character({pool: consonants});
            } else {
                // Last character was a consonant, now we want a vowel
                chr = this.character({pool: vowels});
            }

            text += chr;
        }

        return text;
    };

    Chance.prototype.word = function (options) {
        options = initOptions(options);

        testRange(
            options.syllables && options.length,
            "Chance: Cannot specify both syllables AND length."
        );

        var syllables = options.syllables || this.natural({min: 1, max: 3}),
            text = '';

        if (options.length) {
            // Either bound word by length
            do {
                text += this.syllable();
            } while (text.length < options.length);
            text = text.substring(0, options.length);
        } else {
            // Or by number of syllables
            for (var i = 0; i < syllables; i++) {
                text += this.syllable();
            }
        }
        return text;
    };

    // -- End Text --

    // -- Person --

    Chance.prototype.age = function (options) {
        options = initOptions(options);
        var ageRange;

        switch (options.type) {
            case 'child':
                ageRange = {min: 1, max: 12};
                break;
            case 'teen':
                ageRange = {min: 13, max: 19};
                break;
            case 'adult':
                ageRange = {min: 18, max: 65};
                break;
            case 'senior':
                ageRange = {min: 65, max: 100};
                break;
            case 'all':
                ageRange = {min: 1, max: 100};
                break;
            default:
                ageRange = {min: 18, max: 65};
                break;
        }

        return this.natural(ageRange);
    };

    Chance.prototype.birthday = function (options) {
        options = initOptions(options, {
            year: (new Date().getFullYear() - this.age(options))
        });

        return this.date(options);
    };

    // CPF; ID to identify taxpayers in Brazil
    Chance.prototype.cpf = function () {
        var n = this.n(this.natural, 9, { max: 9 });
        var d1 = n[8]*2+n[7]*3+n[6]*4+n[5]*5+n[4]*6+n[3]*7+n[2]*8+n[1]*9+n[0]*10;
        d1 = 11 - (d1 % 11);
        if (d1>=10) {
            d1 = 0;
        }
        var d2 = d1*2+n[8]*3+n[7]*4+n[6]*5+n[5]*6+n[4]*7+n[3]*8+n[2]*9+n[1]*10+n[0]*11;
        d2 = 11 - (d2 % 11);
        if (d2>=10) {
            d2 = 0;
        }
        return ''+n[0]+n[1]+n[2]+'.'+n[3]+n[4]+n[5]+'.'+n[6]+n[7]+n[8]+'-'+d1+d2;
    };

    Chance.prototype.first = function (options) {
        options = initOptions(options, {gender: this.gender()});
        return this.pick(this.get("firstNames")[options.gender.toLowerCase()]);
    };

    Chance.prototype.gender = function () {
        return this.pick(['Male', 'Female']);
    };

    Chance.prototype.last = function () {
        return this.pick(this.get("lastNames"));
    };

    Chance.prototype.mrz = function (options) {
        var checkDigit = function (input) {
            var alpha = "<ABCDEFGHIJKLMNOPQRSTUVWXYXZ".split(''),
                multipliers = [ 7, 3, 1 ],
                runningTotal = 0;

            if (typeof input !== 'string') {
                input = input.toString();
            }

            input.split('').forEach(function(character, idx) {
                var pos = alpha.indexOf(character);

                if(pos !== -1) {
                    character = pos === 0 ? 0 : pos + 9;
                } else {
                    character = parseInt(character, 10);
                }
                character *= multipliers[idx % multipliers.length];
                runningTotal += character;
            });
            return runningTotal % 10;
        };
        var generate = function (opts) {
            var pad = function (length) {
                return new Array(length + 1).join('<');
            };
            var number = [ 'P<',
                           opts.issuer,
                           opts.last.toUpperCase(),
                           '<<',
                           opts.first.toUpperCase(),
                           pad(39 - (opts.last.length + opts.first.length + 2)),
                           opts.passportNumber,
                           checkDigit(opts.passportNumber),
                           opts.nationality,
                           opts.dob,
                           checkDigit(opts.dob),
                           opts.gender,
                           opts.expiry,
                           checkDigit(opts.expiry),
                           pad(14),
                           checkDigit(pad(14)) ].join('');

            return number +
                (checkDigit(number.substr(44, 10) +
                            number.substr(57, 7) +
                            number.substr(65, 7)));
        };

        var that = this;

        options = initOptions(options, {
            first: this.first(),
            last: this.last(),
            passportNumber: this.integer({min: 100000000, max: 999999999}),
            dob: (function () {
                var date = that.birthday({type: 'adult'});
                return [date.getFullYear().toString().substr(2),
                        that.pad(date.getMonth() + 1, 2),
                        that.pad(date.getDate(), 2)].join('');
            }()),
            expiry: (function () {
                var date = new Date();
                return [(date.getFullYear() + 5).toString().substr(2),
                        that.pad(date.getMonth() + 1, 2),
                        that.pad(date.getDate(), 2)].join('');
            }()),
            gender: this.gender() === 'Female' ? 'F': 'M',
            issuer: 'GBR',
            nationality: 'GBR'
        });
        return generate (options);
    };

    Chance.prototype.name = function (options) {
        options = initOptions(options);

        var first = this.first(options),
            last = this.last(),
            name;

        if (options.middle) {
            name = first + ' ' + this.first(options) + ' ' + last;
        } else if (options.middle_initial) {
            name = first + ' ' + this.character({alpha: true, casing: 'upper'}) + '. ' + last;
        } else {
            name = first + ' ' + last;
        }

        if (options.prefix) {
            name = this.prefix(options) + ' ' + name;
        }

        if (options.suffix) {
            name = name + ' ' + this.suffix(options);
        }

        return name;
    };

    // Return the list of available name prefixes based on supplied gender.
    Chance.prototype.name_prefixes = function (gender) {
        gender = gender || "all";
        gender = gender.toLowerCase();

        var prefixes = [
            { name: 'Doctor', abbreviation: 'Dr.' }
        ];

        if (gender === "male" || gender === "all") {
            prefixes.push({ name: 'Mister', abbreviation: 'Mr.' });
        }

        if (gender === "female" || gender === "all") {
            prefixes.push({ name: 'Miss', abbreviation: 'Miss' });
            prefixes.push({ name: 'Misses', abbreviation: 'Mrs.' });
        }

        return prefixes;
    };

    // Alias for name_prefix
    Chance.prototype.prefix = function (options) {
        return this.name_prefix(options);
    };

    Chance.prototype.name_prefix = function (options) {
        options = initOptions(options, { gender: "all" });
        return options.full ?
            this.pick(this.name_prefixes(options.gender)).name :
            this.pick(this.name_prefixes(options.gender)).abbreviation;
    };

    Chance.prototype.ssn = function (options) {
        options = initOptions(options, {ssnFour: false, dashes: true});
        var ssn_pool = "1234567890",
            ssn,
            dash = options.dashes ? '-' : '';

        if(!options.ssnFour) {
            ssn = this.string({pool: ssn_pool, length: 3}) + dash +
            this.string({pool: ssn_pool, length: 2}) + dash +
            this.string({pool: ssn_pool, length: 4});
        } else {
            ssn = this.string({pool: ssn_pool, length: 4});
        }
        return ssn;
    };

    // Return the list of available name suffixes
    Chance.prototype.name_suffixes = function () {
        var suffixes = [
            { name: 'Doctor of Osteopathic Medicine', abbreviation: 'D.O.' },
            { name: 'Doctor of Philosophy', abbreviation: 'Ph.D.' },
            { name: 'Esquire', abbreviation: 'Esq.' },
            { name: 'Junior', abbreviation: 'Jr.' },
            { name: 'Juris Doctor', abbreviation: 'J.D.' },
            { name: 'Master of Arts', abbreviation: 'M.A.' },
            { name: 'Master of Business Administration', abbreviation: 'M.B.A.' },
            { name: 'Master of Science', abbreviation: 'M.S.' },
            { name: 'Medical Doctor', abbreviation: 'M.D.' },
            { name: 'Senior', abbreviation: 'Sr.' },
            { name: 'The Third', abbreviation: 'III' },
            { name: 'The Fourth', abbreviation: 'IV' },
            { name: 'Bachelor of Engineering', abbreviation: 'B.E' },
            { name: 'Bachelor of Technology', abbreviation: 'B.TECH' }
        ];
        return suffixes;
    };

    // Alias for name_suffix
    Chance.prototype.suffix = function (options) {
        return this.name_suffix(options);
    };

    Chance.prototype.name_suffix = function (options) {
        options = initOptions(options);
        return options.full ?
            this.pick(this.name_suffixes()).name :
            this.pick(this.name_suffixes()).abbreviation;
    };

    // -- End Person --

    // -- Mobile --
    // Android GCM Registration ID
    Chance.prototype.android_id = function () {
        return "APA91" + this.string({ pool: "0123456789abcefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_", length: 178 });
    };

    // Apple Push Token
    Chance.prototype.apple_token = function () {
        return this.string({ pool: "abcdef1234567890", length: 64 });
    };

    // Windows Phone 8 ANID2
    Chance.prototype.wp8_anid2 = function () {
        return base64( this.hash( { length : 32 } ) );
    };

    // Windows Phone 7 ANID
    Chance.prototype.wp7_anid = function () {
        return 'A=' + this.guid().replace(/-/g, '').toUpperCase() + '&E=' + this.hash({ length:3 }) + '&W=' + this.integer({ min:0, max:9 });
    };

    // BlackBerry Device PIN
    Chance.prototype.bb_pin = function () {
        return this.hash({ length: 8 });
    };

    // -- End Mobile --

    // -- Web --
    Chance.prototype.avatar = function (options) {
        var url = null;
        var URL_BASE = '//www.gravatar.com/avatar/';
        var PROTOCOLS = {
            http: 'http',
            https: 'https'
        };
        var FILE_TYPES = {
            bmp: 'bmp',
            gif: 'gif',
            jpg: 'jpg',
            png: 'png'
        };
        var FALLBACKS = {
            '404': '404', // Return 404 if not found
            mm: 'mm', // Mystery man
            identicon: 'identicon', // Geometric pattern based on hash
            monsterid: 'monsterid', // A generated monster icon
            wavatar: 'wavatar', // A generated face
            retro: 'retro', // 8-bit icon
            blank: 'blank' // A transparent png
        };
        var RATINGS = {
            g: 'g',
            pg: 'pg',
            r: 'r',
            x: 'x'
        };
        var opts = {
            protocol: null,
            email: null,
            fileExtension: null,
            size: null,
            fallback: null,
            rating: null
        };

        if (!options) {
            // Set to a random email
            opts.email = this.email();
            options = {};
        }
        else if (typeof options === 'string') {
            opts.email = options;
            options = {};
        }
        else if (typeof options !== 'object') {
            return null;
        }
        else if (options.constructor === 'Array') {
            return null;
        }

        opts = initOptions(options, opts);

        if (!opts.email) {
            // Set to a random email
            opts.email = this.email();
        }

        // Safe checking for params
        opts.protocol = PROTOCOLS[opts.protocol] ? opts.protocol + ':' : '';
        opts.size = parseInt(opts.size, 0) ? opts.size : '';
        opts.rating = RATINGS[opts.rating] ? opts.rating : '';
        opts.fallback = FALLBACKS[opts.fallback] ? opts.fallback : '';
        opts.fileExtension = FILE_TYPES[opts.fileExtension] ? opts.fileExtension : '';

        url =
            opts.protocol +
            URL_BASE +
            this.bimd5.md5(opts.email) +
            (opts.fileExtension ? '.' + opts.fileExtension : '') +
            (opts.size || opts.rating || opts.fallback ? '?' : '') +
            (opts.size ? '&s=' + opts.size.toString() : '') +
            (opts.rating ? '&r=' + opts.rating : '') +
            (opts.fallback ? '&d=' + opts.fallback : '')
            ;

        return url;
    };

    Chance.prototype.color = function (options) {
        function gray(value, delimiter) {
            return [value, value, value].join(delimiter || '');
        }

        options = initOptions(options, {
            format: this.pick(['hex', 'shorthex', 'rgb', 'rgba', '0x']),
            grayscale: false,
            casing: 'lower'
        });

        var isGrayscale = options.grayscale;
        var colorValue;

        if (options.format === 'hex') {
            colorValue = '#' + (isGrayscale ? gray(this.hash({length: 2})) : this.hash({length: 6}));

        } else if (options.format === 'shorthex') {
            colorValue = '#' + (isGrayscale ? gray(this.hash({length: 1})) : this.hash({length: 3}));

        } else if (options.format === 'rgb') {
            if (isGrayscale) {
                colorValue = 'rgb(' + gray(this.natural({max: 255}), ',') + ')';
            } else {
                colorValue = 'rgb(' + this.natural({max: 255}) + ',' + this.natural({max: 255}) + ',' + this.natural({max: 255}) + ')';
            }
        } else if (options.format === 'rgba') {
            if (isGrayscale) {
                colorValue = 'rgba(' + gray(this.natural({max: 255}), ',') + ',' + this.floating({min:0, max:1}) + ')';
            } else {
                colorValue = 'rgba(' + this.natural({max: 255}) + ',' + this.natural({max: 255}) + ',' + this.natural({max: 255}) + ',' + this.floating({min:0, max:1}) + ')';
            }
        } else if (options.format === '0x') {
            colorValue = '0x' + (isGrayscale ? gray(this.hash({length: 2})) : this.hash({length: 6}));
        } else {
            throw new RangeError('Invalid format provided. Please provide one of "hex", "shorthex", "rgb", "rgba", or "0x".');
        }

        if (options.casing === 'upper' ) {
            colorValue = colorValue.toUpperCase();
        }

        return colorValue;
    };

    Chance.prototype.domain = function (options) {
        options = initOptions(options);
        return this.word() + '.' + (options.tld || this.tld());
    };

    Chance.prototype.email = function (options) {
        options = initOptions(options);
        return this.word({length: options.length}) + '@' + (options.domain || this.domain());
    };

    Chance.prototype.fbid = function () {
        return parseInt('10000' + this.natural({max: 100000000000}), 10);
    };

    Chance.prototype.google_analytics = function () {
        var account = this.pad(this.natural({max: 999999}), 6);
        var property = this.pad(this.natural({max: 99}), 2);

        return 'UA-' + account + '-' + property;
    };

    Chance.prototype.hashtag = function () {
        return '#' + this.word();
    };

    Chance.prototype.ip = function () {
        // Todo: This could return some reserved IPs. See http://vq.io/137dgYy
        // this should probably be updated to account for that rare as it may be
        return this.natural({max: 255}) + '.' +
               this.natural({max: 255}) + '.' +
               this.natural({max: 255}) + '.' +
               this.natural({max: 255});
    };

    Chance.prototype.ipv6 = function () {
        var ip_addr = this.n(this.hash, 8, {length: 4});

        return ip_addr.join(":");
    };

    Chance.prototype.klout = function () {
        return this.natural({min: 1, max: 99});
    };

    Chance.prototype.tlds = function () {
        return ['com', 'org', 'edu', 'gov', 'co.uk', 'net', 'io'];
    };

    Chance.prototype.tld = function () {
        return this.pick(this.tlds());
    };

    Chance.prototype.twitter = function () {
        return '@' + this.word();
    };

    Chance.prototype.url = function (options) {
        options = initOptions(options, { protocol: "http", domain: this.domain(options), domain_prefix: "", path: this.word(), extensions: []});

        var extension = options.extensions.length > 0 ? "." + this.pick(options.extensions) : "";
        var domain = options.domain_prefix ? options.domain_prefix + "." + options.domain : options.domain;

        return options.protocol + "://" + domain + "/" + options.path + extension;
    };

    // -- End Web --

    // -- Location --

    Chance.prototype.address = function (options) {
        options = initOptions(options);
        return this.natural({min: 5, max: 2000}) + ' ' + this.street(options);
    };

    Chance.prototype.altitude = function (options) {
        options = initOptions(options, {fixed: 5, min: 0, max: 8848});
        return this.floating({
            min: options.min,
            max: options.max,
            fixed: options.fixed
        });
    };

    Chance.prototype.areacode = function (options) {
        options = initOptions(options, {parens : true});
        // Don't want area codes to start with 1, or have a 9 as the second digit
        var areacode = this.natural({min: 2, max: 9}).toString() +
                this.natural({min: 0, max: 8}).toString() +
                this.natural({min: 0, max: 9}).toString();

        return options.parens ? '(' + areacode + ')' : areacode;
    };

    Chance.prototype.city = function () {
        return this.capitalize(this.word({syllables: 3}));
    };

    Chance.prototype.coordinates = function (options) {
        return this.latitude(options) + ', ' + this.longitude(options);
    };

    Chance.prototype.countries = function () {
        return this.get("countries");
    };

    Chance.prototype.country = function (options) {
        options = initOptions(options);
        var country = this.pick(this.countries());
        return options.full ? country.name : country.abbreviation;
    };

    Chance.prototype.depth = function (options) {
        options = initOptions(options, {fixed: 5, min: -2550, max: 0});
        return this.floating({
            min: options.min,
            max: options.max,
            fixed: options.fixed
        });
    };

    Chance.prototype.geohash = function (options) {
        options = initOptions(options, { length: 7 });
        return this.string({ length: options.length, pool: '0123456789bcdefghjkmnpqrstuvwxyz' });
    };

    Chance.prototype.geojson = function (options) {
        return this.latitude(options) + ', ' + this.longitude(options) + ', ' + this.altitude(options);
    };

    Chance.prototype.latitude = function (options) {
        options = initOptions(options, {fixed: 5, min: -90, max: 90});
        return this.floating({min: options.min, max: options.max, fixed: options.fixed});
    };

    Chance.prototype.longitude = function (options) {
        options = initOptions(options, {fixed: 5, min: -180, max: 180});
        return this.floating({min: options.min, max: options.max, fixed: options.fixed});
    };

    Chance.prototype.phone = function (options) {
        var self = this,
            numPick,
            ukNum = function (parts) {
                var section = [];
                //fills the section part of the phone number with random numbers.
                parts.sections.forEach(function(n) {
                    section.push(self.string({ pool: '0123456789', length: n}));
                });
                return parts.area + section.join(' ');
            };
        options = initOptions(options, {
            formatted: true,
            country: 'us',
            mobile: false
        });
        if (!options.formatted) {
            options.parens = false;
        }
        var phone;
        switch (options.country) {
            case 'fr':
                if (!options.mobile) {
                    numPick = this.pick([
                        // Valid zone and département codes.
                        '01' + this.pick(['30', '34', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '53', '55', '56', '58', '60', '64', '69', '70', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83']) + self.string({ pool: '0123456789', length: 6}),
                        '02' + this.pick(['14', '18', '22', '23', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '40', '41', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '56', '57', '61', '62', '69', '72', '76', '77', '78', '85', '90', '96', '97', '98', '99']) + self.string({ pool: '0123456789', length: 6}),
                        '03' + this.pick(['10', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '39', '44', '45', '51', '52', '54', '55', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90']) + self.string({ pool: '0123456789', length: 6}),
                        '04' + this.pick(['11', '13', '15', '20', '22', '26', '27', '30', '32', '34', '37', '42', '43', '44', '50', '56', '57', '63', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '88', '89', '90', '91', '92', '93', '94', '95', '97', '98']) + self.string({ pool: '0123456789', length: 6}),
                        '05' + this.pick(['08', '16', '17', '19', '24', '31', '32', '33', '34', '35', '40', '45', '46', '47', '49', '53', '55', '56', '57', '58', '59', '61', '62', '63', '64', '65', '67', '79', '81', '82', '86', '87', '90', '94']) + self.string({ pool: '0123456789', length: 6}),
                        '09' + self.string({ pool: '0123456789', length: 8}),
                    ]);
                    phone = options.formatted ? numPick.match(/../g).join(' ') : numPick;
                } else {
                    numPick = this.pick(['06', '07']) + self.string({ pool: '0123456789', length: 8});
                    phone = options.formatted ? numPick.match(/../g).join(' ') : numPick;
                }
                break;
            case 'uk':
                if (!options.mobile) {
                    numPick = this.pick([
                        //valid area codes of major cities/counties followed by random numbers in required format.
                        { area: '01' + this.character({ pool: '234569' }) + '1 ', sections: [3,4] },
                        { area: '020 ' + this.character({ pool: '378' }), sections: [3,4] },
                        { area: '023 ' + this.character({ pool: '89' }), sections: [3,4] },
                        { area: '024 7', sections: [3,4] },
                        { area: '028 ' + this.pick(['25','28','37','71','82','90','92','95']), sections: [2,4] },
                        { area: '012' + this.pick(['04','08','54','76','97','98']) + ' ', sections: [5] },
                        { area: '013' + this.pick(['63','64','84','86']) + ' ', sections: [5] },
                        { area: '014' + this.pick(['04','20','60','61','80','88']) + ' ', sections: [5] },
                        { area: '015' + this.pick(['24','27','62','66']) + ' ', sections: [5] },
                        { area: '016' + this.pick(['06','29','35','47','59','95']) + ' ', sections: [5] },
                        { area: '017' + this.pick(['26','44','50','68']) + ' ', sections: [5] },
                        { area: '018' + this.pick(['27','37','84','97']) + ' ', sections: [5] },
                        { area: '019' + this.pick(['00','05','35','46','49','63','95']) + ' ', sections: [5] }
                    ]);
                    phone = options.formatted ? ukNum(numPick) : ukNum(numPick).replace(' ', '', 'g');
                } else {
                    numPick = this.pick([
                        { area: '07' + this.pick(['4','5','7','8','9']), sections: [2,6] },
                        { area: '07624 ', sections: [6] }
                    ]);
                    phone = options.formatted ? ukNum(numPick) : ukNum(numPick).replace(' ', '');
                }
                break;
            case 'us':
                var areacode = this.areacode(options).toString();
                var exchange = this.natural({ min: 2, max: 9 }).toString() +
                    this.natural({ min: 0, max: 9 }).toString() +
                    this.natural({ min: 0, max: 9 }).toString();
                var subscriber = this.natural({ min: 1000, max: 9999 }).toString(); // this could be random [0-9]{4}
                phone = options.formatted ? areacode + ' ' + exchange + '-' + subscriber : areacode + exchange + subscriber;
        }
        return phone;
    };

    Chance.prototype.postal = function () {
        // Postal District
        var pd = this.character({pool: "XVTSRPNKLMHJGECBA"});
        // Forward Sortation Area (FSA)
        var fsa = pd + this.natural({max: 9}) + this.character({alpha: true, casing: "upper"});
        // Local Delivery Unut (LDU)
        var ldu = this.natural({max: 9}) + this.character({alpha: true, casing: "upper"}) + this.natural({max: 9});

        return fsa + " " + ldu;
    };

    Chance.prototype.provinces = function () {
        return this.get("provinces");
    };

    Chance.prototype.province = function (options) {
        return (options && options.full) ?
            this.pick(this.provinces()).name :
            this.pick(this.provinces()).abbreviation;
    };

    Chance.prototype.state = function (options) {
        return (options && options.full) ?
            this.pick(this.states(options)).name :
            this.pick(this.states(options)).abbreviation;
    };

    Chance.prototype.states = function (options) {
        options = initOptions(options);

        var states,
            us_states_and_dc = this.get("us_states_and_dc"),
            territories = this.get("territories"),
            armed_forces = this.get("armed_forces");

        states = us_states_and_dc;

        if (options.territories) {
            states = states.concat(territories);
        }
        if (options.armed_forces) {
            states = states.concat(armed_forces);
        }

        return states;
    };

    Chance.prototype.street = function (options) {
        options = initOptions(options);

        var street = this.word({syllables: 2});
        street = this.capitalize(street);
        street += ' ';
        street += options.short_suffix ?
            this.street_suffix().abbreviation :
            this.street_suffix().name;
        return street;
    };

    Chance.prototype.street_suffix = function () {
        return this.pick(this.street_suffixes());
    };

    Chance.prototype.street_suffixes = function () {
        // These are the most common suffixes.
        return this.get("street_suffixes");
    };

    // Note: only returning US zip codes, internationalization will be a whole
    // other beast to tackle at some point.
    Chance.prototype.zip = function (options) {
        var zip = this.n(this.natural, 5, {max: 9});

        if (options && options.plusfour === true) {
            zip.push('-');
            zip = zip.concat(this.n(this.natural, 4, {max: 9}));
        }

        return zip.join("");
    };

    // -- End Location --

    // -- Time

    Chance.prototype.ampm = function () {
        return this.bool() ? 'am' : 'pm';
    };

    Chance.prototype.date = function (options) {
        var date_string, date;

        // If interval is specified we ignore preset
        if(options && (options.min || options.max)) {
            options = initOptions(options, {
                american: true,
                string: false
            });
            var min = typeof options.min !== "undefined" ? options.min.getTime() : 1;
            // 100,000,000 days measured relative to midnight at the beginning of 01 January, 1970 UTC. http://es5.github.io/#x15.9.1.1
            var max = typeof options.max !== "undefined" ? options.max.getTime() : 8640000000000000;

            date = new Date(this.natural({min: min, max: max}));
        } else {
            var m = this.month({raw: true});
            var daysInMonth = m.days;

            if(options && options.month) {
                // Mod 12 to allow months outside range of 0-11 (not encouraged, but also not prevented).
                daysInMonth = this.get('months')[((options.month % 12) + 12) % 12].days;
            }

            options = initOptions(options, {
                year: parseInt(this.year(), 10),
                // Necessary to subtract 1 because Date() 0-indexes month but not day or year
                // for some reason.
                month: m.numeric - 1,
                day: this.natural({min: 1, max: daysInMonth}),
                hour: this.hour(),
                minute: this.minute(),
                second: this.second(),
                millisecond: this.millisecond(),
                american: true,
                string: false
            });

            date = new Date(options.year, options.month, options.day, options.hour, options.minute, options.second, options.millisecond);
        }

        if (options.american) {
            // Adding 1 to the month is necessary because Date() 0-indexes
            // months but not day for some odd reason.
            date_string = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
        } else {
            date_string = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
        }

        return options.string ? date_string : date;
    };

    Chance.prototype.hammertime = function (options) {
        return this.date(options).getTime();
    };

    Chance.prototype.hour = function (options) {
        options = initOptions(options, {min: 1, max: options && options.twentyfour ? 24 : 12});

        testRange(options.min < 1, "Chance: Min cannot be less than 1.");
        testRange(options.twentyfour && options.max > 24, "Chance: Max cannot be greater than 24 for twentyfour option.");
        testRange(!options.twentyfour && options.max > 12, "Chance: Max cannot be greater than 12.");
        testRange(options.min > options.max, "Chance: Min cannot be greater than Max.");

        return this.natural({min: options.min, max: options.max});
    };

    Chance.prototype.millisecond = function () {
        return this.natural({max: 999});
    };

    Chance.prototype.minute = Chance.prototype.second = function (options) {
        options = initOptions(options, {min: 0, max: 59});

        testRange(options.min < 0, "Chance: Min cannot be less than 0.");
        testRange(options.max > 59, "Chance: Max cannot be greater than 59.");
        testRange(options.min > options.max, "Chance: Min cannot be greater than Max.");

        return this.natural({min: options.min, max: options.max});
    };

    Chance.prototype.month = function (options) {
        options = initOptions(options, {min: 1, max: 12});

        testRange(options.min < 1, "Chance: Min cannot be less than 1.");
        testRange(options.max > 12, "Chance: Max cannot be greater than 12.");
        testRange(options.min > options.max, "Chance: Min cannot be greater than Max.");

        var month = this.pick(this.months().slice(options.min - 1, options.max));
        return options.raw ? month : month.name;
    };

    Chance.prototype.months = function () {
        return this.get("months");
    };

    Chance.prototype.second = function () {
        return this.natural({max: 59});
    };

    Chance.prototype.timestamp = function () {
        return this.natural({min: 1, max: parseInt(new Date().getTime() / 1000, 10)});
    };

    Chance.prototype.year = function (options) {
        // Default to current year as min if none specified
        options = initOptions(options, {min: new Date().getFullYear()});

        // Default to one century after current year as max if none specified
        options.max = (typeof options.max !== "undefined") ? options.max : options.min + 100;

        return this.natural(options).toString();
    };

    // -- End Time

    // -- Finance --

    Chance.prototype.cc = function (options) {
        options = initOptions(options);

        var type, number, to_generate;

        type = (options.type) ?
                    this.cc_type({ name: options.type, raw: true }) :
                    this.cc_type({ raw: true });

        number = type.prefix.split("");
        to_generate = type.length - type.prefix.length - 1;

        // Generates n - 1 digits
        number = number.concat(this.n(this.integer, to_generate, {min: 0, max: 9}));

        // Generates the last digit according to Luhn algorithm
        number.push(this.luhn_calculate(number.join("")));

        return number.join("");
    };

    Chance.prototype.cc_types = function () {
        // http://en.wikipedia.org/wiki/Bank_card_number#Issuer_identification_number_.28IIN.29
        return this.get("cc_types");
    };

    Chance.prototype.cc_type = function (options) {
        options = initOptions(options);
        var types = this.cc_types(),
            type = null;

        if (options.name) {
            for (var i = 0; i < types.length; i++) {
                // Accept either name or short_name to specify card type
                if (types[i].name === options.name || types[i].short_name === options.name) {
                    type = types[i];
                    break;
                }
            }
            if (type === null) {
                throw new RangeError("Credit card type '" + options.name + "'' is not supported");
            }
        } else {
            type = this.pick(types);
        }

        return options.raw ? type : type.name;
    };

    //return all world currency by ISO 4217
    Chance.prototype.currency_types = function () {
        return this.get("currency_types");
    };

    //return random world currency by ISO 4217
    Chance.prototype.currency = function () {
        return this.pick(this.currency_types());
    };

    //Return random correct currency exchange pair (e.g. EUR/USD) or array of currency code
    Chance.prototype.currency_pair = function (returnAsString) {
        var currencies = this.unique(this.currency, 2, {
            comparator: function(arr, val) {

                return arr.reduce(function(acc, item) {
                    // If a match has been found, short circuit check and just return
                    return acc || (item.code === val.code);
                }, false);
            }
        });

        if (returnAsString) {
            return currencies[0].code + '/' + currencies[1].code;
        } else {
            return currencies;
        }
    };

    Chance.prototype.dollar = function (options) {
        // By default, a somewhat more sane max for dollar than all available numbers
        options = initOptions(options, {max : 10000, min : 0});

        var dollar = this.floating({min: options.min, max: options.max, fixed: 2}).toString(),
            cents = dollar.split('.')[1];

        if (cents === undefined) {
            dollar += '.00';
        } else if (cents.length < 2) {
            dollar = dollar + '0';
        }

        if (dollar < 0) {
            return '-$' + dollar.replace('-', '');
        } else {
            return '$' + dollar;
        }
    };

    Chance.prototype.exp = function (options) {
        options = initOptions(options);
        var exp = {};

        exp.year = this.exp_year();

        // If the year is this year, need to ensure month is greater than the
        // current month or this expiration will not be valid
        if (exp.year === (new Date().getFullYear()).toString()) {
            exp.month = this.exp_month({future: true});
        } else {
            exp.month = this.exp_month();
        }

        return options.raw ? exp : exp.month + '/' + exp.year;
    };

    Chance.prototype.exp_month = function (options) {
        options = initOptions(options);
        var month, month_int,
            // Date object months are 0 indexed
            curMonth = new Date().getMonth() + 1;

        if (options.future) {
            do {
                month = this.month({raw: true}).numeric;
                month_int = parseInt(month, 10);
            } while (month_int <= curMonth);
        } else {
            month = this.month({raw: true}).numeric;
        }

        return month;
    };

    Chance.prototype.exp_year = function () {
        return this.year({max: new Date().getFullYear() + 10});
    };

    // -- End Finance

    // -- Miscellaneous --

    // Dice - For all the board game geeks out there, myself included ;)
    function diceFn (range) {
        return function () {
            return this.natural(range);
        };
    }
    Chance.prototype.d4 = diceFn({min: 1, max: 4});
    Chance.prototype.d6 = diceFn({min: 1, max: 6});
    Chance.prototype.d8 = diceFn({min: 1, max: 8});
    Chance.prototype.d10 = diceFn({min: 1, max: 10});
    Chance.prototype.d12 = diceFn({min: 1, max: 12});
    Chance.prototype.d20 = diceFn({min: 1, max: 20});
    Chance.prototype.d30 = diceFn({min: 1, max: 30});
    Chance.prototype.d100 = diceFn({min: 1, max: 100});

    Chance.prototype.rpg = function (thrown, options) {
        options = initOptions(options);
        if (!thrown) {
            throw new RangeError("A type of die roll must be included");
        } else {
            var bits = thrown.toLowerCase().split("d"),
                rolls = [];

            if (bits.length !== 2 || !parseInt(bits[0], 10) || !parseInt(bits[1], 10)) {
                throw new Error("Invalid format provided. Please provide #d# where the first # is the number of dice to roll, the second # is the max of each die");
            }
            for (var i = bits[0]; i > 0; i--) {
                rolls[i - 1] = this.natural({min: 1, max: bits[1]});
            }
            return (typeof options.sum !== 'undefined' && options.sum) ? rolls.reduce(function (p, c) { return p + c; }) : rolls;
        }
    };

    // Guid
    Chance.prototype.guid = function (options) {
        options = initOptions(options, { version: 5 });

        var guid_pool = "abcdef1234567890",
            variant_pool = "ab89",
            guid = this.string({ pool: guid_pool, length: 8 }) + '-' +
                   this.string({ pool: guid_pool, length: 4 }) + '-' +
                   // The Version
                   options.version +
                   this.string({ pool: guid_pool, length: 3 }) + '-' +
                   // The Variant
                   this.string({ pool: variant_pool, length: 1 }) +
                   this.string({ pool: guid_pool, length: 3 }) + '-' +
                   this.string({ pool: guid_pool, length: 12 });
        return guid;
    };

    // Hash
    Chance.prototype.hash = function (options) {
        options = initOptions(options, {length : 40, casing: 'lower'});
        var pool = options.casing === 'upper' ? HEX_POOL.toUpperCase() : HEX_POOL;
        return this.string({pool: pool, length: options.length});
    };

    Chance.prototype.luhn_check = function (num) {
        var str = num.toString();
        var checkDigit = +str.substring(str.length - 1);
        return checkDigit === this.luhn_calculate(+str.substring(0, str.length - 1));
    };

    Chance.prototype.luhn_calculate = function (num) {
        var digits = num.toString().split("").reverse();
        var sum = 0;
        var digit;

        for (var i = 0, l = digits.length; l > i; ++i) {
            digit = +digits[i];
            if (i % 2 === 0) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            sum += digit;
        }
        return (sum * 9) % 10;
    };

    // MD5 Hash
    Chance.prototype.md5 = function(options) {
        var opts = { str: '', key: null, raw: false };

        if (!options) {
            opts.str = this.string();
            options = {};
        }
        else if (typeof options === 'string') {
            opts.str = options;
            options = {};
        }
        else if (typeof options !== 'object') {
            return null;
        }
        else if(options.constructor === 'Array') {
            return null;
        }

        opts = initOptions(options, opts);

        if(!opts.str){
            throw new Error('A parameter is required to return an md5 hash.');
        }

        return this.bimd5.md5(opts.str, opts.key, opts.raw);
    };

    var data = {

        firstNames: {
            "male": ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Charles", "Thomas", "Christopher", "Daniel", "Matthew", "George", "Donald", "Anthony", "Paul", "Mark", "Edward", "Steven", "Kenneth", "Andrew", "Brian", "Joshua", "Kevin", "Ronald", "Timothy", "Jason", "Jeffrey", "Frank", "Gary", "Ryan", "Nicholas", "Eric", "Stephen", "Jacob", "Larry", "Jonathan", "Scott", "Raymond", "Justin", "Brandon", "Gregory", "Samuel", "Benjamin", "Patrick", "Jack", "Henry", "Walter", "Dennis", "Jerry", "Alexander", "Peter", "Tyler", "Douglas", "Harold", "Aaron", "Jose", "Adam", "Arthur", "Zachary", "Carl", "Nathan", "Albert", "Kyle", "Lawrence", "Joe", "Willie", "Gerald", "Roger", "Keith", "Jeremy", "Terry", "Harry", "Ralph", "Sean", "Jesse", "Roy", "Louis", "Billy", "Austin", "Bruce", "Eugene", "Christian", "Bryan", "Wayne", "Russell", "Howard", "Fred", "Ethan", "Jordan", "Philip", "Alan", "Juan", "Randy", "Vincent", "Bobby", "Dylan", "Johnny", "Phillip", "Victor", "Clarence", "Ernest", "Martin", "Craig", "Stanley", "Shawn", "Travis", "Bradley", "Leonard", "Earl", "Gabriel", "Jimmy", "Francis", "Todd", "Noah", "Danny", "Dale", "Cody", "Carlos", "Allen", "Frederick", "Logan", "Curtis", "Alex", "Joel", "Luis", "Norman", "Marvin", "Glenn", "Tony", "Nathaniel", "Rodney", "Melvin", "Alfred", "Steve", "Cameron", "Chad", "Edwin", "Caleb", "Evan", "Antonio", "Lee", "Herbert", "Jeffery", "Isaac", "Derek", "Ricky", "Marcus", "Theodore", "Elijah", "Luke", "Jesus", "Eddie", "Troy", "Mike", "Dustin", "Ray", "Adrian", "Bernard", "Leroy", "Angel", "Randall", "Wesley", "Ian", "Jared", "Mason", "Hunter", "Calvin", "Oscar", "Clifford", "Jay", "Shane", "Ronnie", "Barry", "Lucas", "Corey", "Manuel", "Leo", "Tommy", "Warren", "Jackson", "Isaiah", "Connor", "Don", "Dean", "Jon", "Julian", "Miguel", "Bill", "Lloyd", "Charlie", "Mitchell", "Leon", "Jerome", "Darrell", "Jeremiah", "Alvin", "Brett", "Seth", "Floyd", "Jim", "Blake", "Micheal", "Gordon", "Trevor", "Lewis", "Erik", "Edgar", "Vernon", "Devin", "Gavin", "Jayden", "Chris", "Clyde", "Tom", "Derrick", "Mario", "Brent", "Marc", "Herman", "Chase", "Dominic", "Ricardo", "Franklin", "Maurice", "Max", "Aiden", "Owen", "Lester", "Gilbert", "Elmer", "Gene", "Francisco", "Glen", "Cory", "Garrett", "Clayton", "Sam", "Jorge", "Chester", "Alejandro", "Jeff", "Harvey", "Milton", "Cole", "Ivan", "Andre", "Duane", "Landon"],
            "female": ["Mary", "Emma", "Elizabeth", "Minnie", "Margaret", "Ida", "Alice", "Bertha", "Sarah", "Annie", "Clara", "Ella", "Florence", "Cora", "Martha", "Laura", "Nellie", "Grace", "Carrie", "Maude", "Mabel", "Bessie", "Jennie", "Gertrude", "Julia", "Hattie", "Edith", "Mattie", "Rose", "Catherine", "Lillian", "Ada", "Lillie", "Helen", "Jessie", "Louise", "Ethel", "Lula", "Myrtle", "Eva", "Frances", "Lena", "Lucy", "Edna", "Maggie", "Pearl", "Daisy", "Fannie", "Josephine", "Dora", "Rosa", "Katherine", "Agnes", "Marie", "Nora", "May", "Mamie", "Blanche", "Stella", "Ellen", "Nancy", "Effie", "Sallie", "Nettie", "Della", "Lizzie", "Flora", "Susie", "Maud", "Mae", "Etta", "Harriet", "Sadie", "Caroline", "Katie", "Lydia", "Elsie", "Kate", "Susan", "Mollie", "Alma", "Addie", "Georgia", "Eliza", "Lulu", "Nannie", "Lottie", "Amanda", "Belle", "Charlotte", "Rebecca", "Ruth", "Viola", "Olive", "Amelia", "Hannah", "Jane", "Virginia", "Emily", "Matilda", "Irene", "Kathryn", "Esther", "Willie", "Henrietta", "Ollie", "Amy", "Rachel", "Sara", "Estella", "Theresa", "Augusta", "Ora", "Pauline", "Josie", "Lola", "Sophia", "Leona", "Anne", "Mildred", "Ann", "Beulah", "Callie", "Lou", "Delia", "Eleanor", "Barbara", "Iva", "Louisa", "Maria", "Mayme", "Evelyn", "Estelle", "Nina", "Betty", "Marion", "Bettie", "Dorothy", "Luella", "Inez", "Lela", "Rosie", "Allie", "Millie", "Janie", "Cornelia", "Victoria", "Ruby", "Winifred", "Alta", "Celia", "Christine", "Beatrice", "Birdie", "Harriett", "Mable", "Myra", "Sophie", "Tillie", "Isabel", "Sylvia", "Carolyn", "Isabelle", "Leila", "Sally", "Ina", "Essie", "Bertie", "Nell", "Alberta", "Katharine", "Lora", "Rena", "Mina", "Rhoda", "Mathilda", "Abbie", "Eula", "Dollie", "Hettie", "Eunice", "Fanny", "Ola", "Lenora", "Adelaide", "Christina", "Lelia", "Nelle", "Sue", "Johanna", "Lilly", "Lucinda", "Minerva", "Lettie", "Roxie", "Cynthia", "Helena", "Hilda", "Hulda", "Bernice", "Genevieve", "Jean", "Cordelia", "Marian", "Francis", "Jeanette", "Adeline", "Gussie", "Leah", "Lois", "Lura", "Mittie", "Hallie", "Isabella", "Olga", "Phoebe", "Teresa", "Hester", "Lida", "Lina", "Winnie", "Claudia", "Marguerite", "Vera", "Cecelia", "Bess", "Emilie", "John", "Rosetta", "Verna", "Myrtie", "Cecilia", "Elva", "Olivia", "Ophelia", "Georgie", "Elnora", "Violet", "Adele", "Lily", "Linnie", "Loretta", "Madge", "Polly", "Virgie", "Eugenia", "Lucile", "Lucille", "Mabelle", "Rosalie"]
        },

        lastNames: ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris', 'Rogers', 'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera', 'Cooper', 'Richardson', 'Cox', 'Howard', 'Ward', 'Torres', 'Peterson', 'Gray', 'Ramirez', 'James', 'Watson', 'Brooks', 'Kelly', 'Sanders', 'Price', 'Bennett', 'Wood', 'Barnes', 'Ross', 'Henderson', 'Coleman', 'Jenkins', 'Perry', 'Powell', 'Long', 'Patterson', 'Hughes', 'Flores', 'Washington', 'Butler', 'Simmons', 'Foster', 'Gonzales', 'Bryant', 'Alexander', 'Russell', 'Griffin', 'Diaz', 'Hayes', 'Myers', 'Ford', 'Hamilton', 'Graham', 'Sullivan', 'Wallace', 'Woods', 'Cole', 'West', 'Jordan', 'Owens', 'Reynolds', 'Fisher', 'Ellis', 'Harrison', 'Gibson', 'McDonald', 'Cruz', 'Marshall', 'Ortiz', 'Gomez', 'Murray', 'Freeman', 'Wells', 'Webb', 'Simpson', 'Stevens', 'Tucker', 'Porter', 'Hunter', 'Hicks', 'Crawford', 'Henry', 'Boyd', 'Mason', 'Morales', 'Kennedy', 'Warren', 'Dixon', 'Ramos', 'Reyes', 'Burns', 'Gordon', 'Shaw', 'Holmes', 'Rice', 'Robertson', 'Hunt', 'Black', 'Daniels', 'Palmer', 'Mills', 'Nichols', 'Grant', 'Knight', 'Ferguson', 'Rose', 'Stone', 'Hawkins', 'Dunn', 'Perkins', 'Hudson', 'Spencer', 'Gardner', 'Stephens', 'Payne', 'Pierce', 'Berry', 'Matthews', 'Arnold', 'Wagner', 'Willis', 'Ray', 'Watkins', 'Olson', 'Carroll', 'Duncan', 'Snyder', 'Hart', 'Cunningham', 'Bradley', 'Lane', 'Andrews', 'Ruiz', 'Harper', 'Fox', 'Riley', 'Armstrong', 'Carpenter', 'Weaver', 'Greene', 'Lawrence', 'Elliott', 'Chavez', 'Sims', 'Austin', 'Peters', 'Kelley', 'Franklin', 'Lawson', 'Fields', 'Gutierrez', 'Ryan', 'Schmidt', 'Carr', 'Vasquez', 'Castillo', 'Wheeler', 'Chapman', 'Oliver', 'Montgomery', 'Richards', 'Williamson', 'Johnston', 'Banks', 'Meyer', 'Bishop', 'McCoy', 'Howell', 'Alvarez', 'Morrison', 'Hansen', 'Fernandez', 'Garza', 'Harvey', 'Little', 'Burton', 'Stanley', 'Nguyen', 'George', 'Jacobs', 'Reid', 'Kim', 'Fuller', 'Lynch', 'Dean', 'Gilbert', 'Garrett', 'Romero', 'Welch', 'Larson', 'Frazier', 'Burke', 'Hanson', 'Day', 'Mendoza', 'Moreno', 'Bowman', 'Medina', 'Fowler', 'Brewer', 'Hoffman', 'Carlson', 'Silva', 'Pearson', 'Holland', 'Douglas', 'Fleming', 'Jensen', 'Vargas', 'Byrd', 'Davidson', 'Hopkins', 'May', 'Terry', 'Herrera', 'Wade', 'Soto', 'Walters', 'Curtis', 'Neal', 'Caldwell', 'Lowe', 'Jennings', 'Barnett', 'Graves', 'Jimenez', 'Horton', 'Shelton', 'Barrett', 'Obrien', 'Castro', 'Sutton', 'Gregory', 'McKinney', 'Lucas', 'Miles', 'Craig', 'Rodriquez', 'Chambers', 'Holt', 'Lambert', 'Fletcher', 'Watts', 'Bates', 'Hale', 'Rhodes', 'Pena', 'Beck', 'Newman', 'Haynes', 'McDaniel', 'Mendez', 'Bush', 'Vaughn', 'Parks', 'Dawson', 'Santiago', 'Norris', 'Hardy', 'Love', 'Steele', 'Curry', 'Powers', 'Schultz', 'Barker', 'Guzman', 'Page', 'Munoz', 'Ball', 'Keller', 'Chandler', 'Weber', 'Leonard', 'Walsh', 'Lyons', 'Ramsey', 'Wolfe', 'Schneider', 'Mullins', 'Benson', 'Sharp', 'Bowen', 'Daniel', 'Barber', 'Cummings', 'Hines', 'Baldwin', 'Griffith', 'Valdez', 'Hubbard', 'Salazar', 'Reeves', 'Warner', 'Stevenson', 'Burgess', 'Santos', 'Tate', 'Cross', 'Garner', 'Mann', 'Mack', 'Moss', 'Thornton', 'Dennis', 'McGee', 'Farmer', 'Delgado', 'Aguilar', 'Vega', 'Glover', 'Manning', 'Cohen', 'Harmon', 'Rodgers', 'Robbins', 'Newton', 'Todd', 'Blair', 'Higgins', 'Ingram', 'Reese', 'Cannon', 'Strickland', 'Townsend', 'Potter', 'Goodwin', 'Walton', 'Rowe', 'Hampton', 'Ortega', 'Patton', 'Swanson', 'Joseph', 'Francis', 'Goodman', 'Maldonado', 'Yates', 'Becker', 'Erickson', 'Hodges', 'Rios', 'Conner', 'Adkins', 'Webster', 'Norman', 'Malone', 'Hammond', 'Flowers', 'Cobb', 'Moody', 'Quinn', 'Blake', 'Maxwell', 'Pope', 'Floyd', 'Osborne', 'Paul', 'McCarthy', 'Guerrero', 'Lindsey', 'Estrada', 'Sandoval', 'Gibbs', 'Tyler', 'Gross', 'Fitzgerald', 'Stokes', 'Doyle', 'Sherman', 'Saunders', 'Wise', 'Colon', 'Gill', 'Alvarado', 'Greer', 'Padilla', 'Simon', 'Waters', 'Nunez', 'Ballard', 'Schwartz', 'McBride', 'Houston', 'Christensen', 'Klein', 'Pratt', 'Briggs', 'Parsons', 'McLaughlin', 'Zimmerman', 'French', 'Buchanan', 'Moran', 'Copeland', 'Roy', 'Pittman', 'Brady', 'McCormick', 'Holloway', 'Brock', 'Poole', 'Frank', 'Logan', 'Owen', 'Bass', 'Marsh', 'Drake', 'Wong', 'Jefferson', 'Park', 'Morton', 'Abbott', 'Sparks', 'Patrick', 'Norton', 'Huff', 'Clayton', 'Massey', 'Lloyd', 'Figueroa', 'Carson', 'Bowers', 'Roberson', 'Barton', 'Tran', 'Lamb', 'Harrington', 'Casey', 'Boone', 'Cortez', 'Clarke', 'Mathis', 'Singleton', 'Wilkins', 'Cain', 'Bryan', 'Underwood', 'Hogan', 'McKenzie', 'Collier', 'Luna', 'Phelps', 'McGuire', 'Allison', 'Bridges', 'Wilkerson', 'Nash', 'Summers', 'Atkins'],

        // Data taken from https://github.com/umpirsky/country-list/blob/master/country/cldr/en_US/country.json
        countries: [{"name":"Afghanistan","abbreviation":"AF"},{"name":"Albania","abbreviation":"AL"},{"name":"Algeria","abbreviation":"DZ"},{"name":"American Samoa","abbreviation":"AS"},{"name":"Andorra","abbreviation":"AD"},{"name":"Angola","abbreviation":"AO"},{"name":"Anguilla","abbreviation":"AI"},{"name":"Antarctica","abbreviation":"AQ"},{"name":"Antigua and Barbuda","abbreviation":"AG"},{"name":"Argentina","abbreviation":"AR"},{"name":"Armenia","abbreviation":"AM"},{"name":"Aruba","abbreviation":"AW"},{"name":"Australia","abbreviation":"AU"},{"name":"Austria","abbreviation":"AT"},{"name":"Azerbaijan","abbreviation":"AZ"},{"name":"Bahamas","abbreviation":"BS"},{"name":"Bahrain","abbreviation":"BH"},{"name":"Bangladesh","abbreviation":"BD"},{"name":"Barbados","abbreviation":"BB"},{"name":"Belarus","abbreviation":"BY"},{"name":"Belgium","abbreviation":"BE"},{"name":"Belize","abbreviation":"BZ"},{"name":"Benin","abbreviation":"BJ"},{"name":"Bermuda","abbreviation":"BM"},{"name":"Bhutan","abbreviation":"BT"},{"name":"Bolivia","abbreviation":"BO"},{"name":"Bosnia and Herzegovina","abbreviation":"BA"},{"name":"Botswana","abbreviation":"BW"},{"name":"Bouvet Island","abbreviation":"BV"},{"name":"Brazil","abbreviation":"BR"},{"name":"British Antarctic Territory","abbreviation":"BQ"},{"name":"British Indian Ocean Territory","abbreviation":"IO"},{"name":"British Virgin Islands","abbreviation":"VG"},{"name":"Brunei","abbreviation":"BN"},{"name":"Bulgaria","abbreviation":"BG"},{"name":"Burkina Faso","abbreviation":"BF"},{"name":"Burundi","abbreviation":"BI"},{"name":"Cambodia","abbreviation":"KH"},{"name":"Cameroon","abbreviation":"CM"},{"name":"Canada","abbreviation":"CA"},{"name":"Canton and Enderbury Islands","abbreviation":"CT"},{"name":"Cape Verde","abbreviation":"CV"},{"name":"Cayman Islands","abbreviation":"KY"},{"name":"Central African Republic","abbreviation":"CF"},{"name":"Chad","abbreviation":"TD"},{"name":"Chile","abbreviation":"CL"},{"name":"China","abbreviation":"CN"},{"name":"Christmas Island","abbreviation":"CX"},{"name":"Cocos [Keeling] Islands","abbreviation":"CC"},{"name":"Colombia","abbreviation":"CO"},{"name":"Comoros","abbreviation":"KM"},{"name":"Congo - Brazzaville","abbreviation":"CG"},{"name":"Congo - Kinshasa","abbreviation":"CD"},{"name":"Cook Islands","abbreviation":"CK"},{"name":"Costa Rica","abbreviation":"CR"},{"name":"Croatia","abbreviation":"HR"},{"name":"Cuba","abbreviation":"CU"},{"name":"Cyprus","abbreviation":"CY"},{"name":"Czech Republic","abbreviation":"CZ"},{"name":"Côte d’Ivoire","abbreviation":"CI"},{"name":"Denmark","abbreviation":"DK"},{"name":"Djibouti","abbreviation":"DJ"},{"name":"Dominica","abbreviation":"DM"},{"name":"Dominican Republic","abbreviation":"DO"},{"name":"Dronning Maud Land","abbreviation":"NQ"},{"name":"East Germany","abbreviation":"DD"},{"name":"Ecuador","abbreviation":"EC"},{"name":"Egypt","abbreviation":"EG"},{"name":"El Salvador","abbreviation":"SV"},{"name":"Equatorial Guinea","abbreviation":"GQ"},{"name":"Eritrea","abbreviation":"ER"},{"name":"Estonia","abbreviation":"EE"},{"name":"Ethiopia","abbreviation":"ET"},{"name":"Falkland Islands","abbreviation":"FK"},{"name":"Faroe Islands","abbreviation":"FO"},{"name":"Fiji","abbreviation":"FJ"},{"name":"Finland","abbreviation":"FI"},{"name":"France","abbreviation":"FR"},{"name":"French Guiana","abbreviation":"GF"},{"name":"French Polynesia","abbreviation":"PF"},{"name":"French Southern Territories","abbreviation":"TF"},{"name":"French Southern and Antarctic Territories","abbreviation":"FQ"},{"name":"Gabon","abbreviation":"GA"},{"name":"Gambia","abbreviation":"GM"},{"name":"Georgia","abbreviation":"GE"},{"name":"Germany","abbreviation":"DE"},{"name":"Ghana","abbreviation":"GH"},{"name":"Gibraltar","abbreviation":"GI"},{"name":"Greece","abbreviation":"GR"},{"name":"Greenland","abbreviation":"GL"},{"name":"Grenada","abbreviation":"GD"},{"name":"Guadeloupe","abbreviation":"GP"},{"name":"Guam","abbreviation":"GU"},{"name":"Guatemala","abbreviation":"GT"},{"name":"Guernsey","abbreviation":"GG"},{"name":"Guinea","abbreviation":"GN"},{"name":"Guinea-Bissau","abbreviation":"GW"},{"name":"Guyana","abbreviation":"GY"},{"name":"Haiti","abbreviation":"HT"},{"name":"Heard Island and McDonald Islands","abbreviation":"HM"},{"name":"Honduras","abbreviation":"HN"},{"name":"Hong Kong SAR China","abbreviation":"HK"},{"name":"Hungary","abbreviation":"HU"},{"name":"Iceland","abbreviation":"IS"},{"name":"India","abbreviation":"IN"},{"name":"Indonesia","abbreviation":"ID"},{"name":"Iran","abbreviation":"IR"},{"name":"Iraq","abbreviation":"IQ"},{"name":"Ireland","abbreviation":"IE"},{"name":"Isle of Man","abbreviation":"IM"},{"name":"Israel","abbreviation":"IL"},{"name":"Italy","abbreviation":"IT"},{"name":"Jamaica","abbreviation":"JM"},{"name":"Japan","abbreviation":"JP"},{"name":"Jersey","abbreviation":"JE"},{"name":"Johnston Island","abbreviation":"JT"},{"name":"Jordan","abbreviation":"JO"},{"name":"Kazakhstan","abbreviation":"KZ"},{"name":"Kenya","abbreviation":"KE"},{"name":"Kiribati","abbreviation":"KI"},{"name":"Kuwait","abbreviation":"KW"},{"name":"Kyrgyzstan","abbreviation":"KG"},{"name":"Laos","abbreviation":"LA"},{"name":"Latvia","abbreviation":"LV"},{"name":"Lebanon","abbreviation":"LB"},{"name":"Lesotho","abbreviation":"LS"},{"name":"Liberia","abbreviation":"LR"},{"name":"Libya","abbreviation":"LY"},{"name":"Liechtenstein","abbreviation":"LI"},{"name":"Lithuania","abbreviation":"LT"},{"name":"Luxembourg","abbreviation":"LU"},{"name":"Macau SAR China","abbreviation":"MO"},{"name":"Macedonia","abbreviation":"MK"},{"name":"Madagascar","abbreviation":"MG"},{"name":"Malawi","abbreviation":"MW"},{"name":"Malaysia","abbreviation":"MY"},{"name":"Maldives","abbreviation":"MV"},{"name":"Mali","abbreviation":"ML"},{"name":"Malta","abbreviation":"MT"},{"name":"Marshall Islands","abbreviation":"MH"},{"name":"Martinique","abbreviation":"MQ"},{"name":"Mauritania","abbreviation":"MR"},{"name":"Mauritius","abbreviation":"MU"},{"name":"Mayotte","abbreviation":"YT"},{"name":"Metropolitan France","abbreviation":"FX"},{"name":"Mexico","abbreviation":"MX"},{"name":"Micronesia","abbreviation":"FM"},{"name":"Midway Islands","abbreviation":"MI"},{"name":"Moldova","abbreviation":"MD"},{"name":"Monaco","abbreviation":"MC"},{"name":"Mongolia","abbreviation":"MN"},{"name":"Montenegro","abbreviation":"ME"},{"name":"Montserrat","abbreviation":"MS"},{"name":"Morocco","abbreviation":"MA"},{"name":"Mozambique","abbreviation":"MZ"},{"name":"Myanmar [Burma]","abbreviation":"MM"},{"name":"Namibia","abbreviation":"NA"},{"name":"Nauru","abbreviation":"NR"},{"name":"Nepal","abbreviation":"NP"},{"name":"Netherlands","abbreviation":"NL"},{"name":"Netherlands Antilles","abbreviation":"AN"},{"name":"Neutral Zone","abbreviation":"NT"},{"name":"New Caledonia","abbreviation":"NC"},{"name":"New Zealand","abbreviation":"NZ"},{"name":"Nicaragua","abbreviation":"NI"},{"name":"Niger","abbreviation":"NE"},{"name":"Nigeria","abbreviation":"NG"},{"name":"Niue","abbreviation":"NU"},{"name":"Norfolk Island","abbreviation":"NF"},{"name":"North Korea","abbreviation":"KP"},{"name":"North Vietnam","abbreviation":"VD"},{"name":"Northern Mariana Islands","abbreviation":"MP"},{"name":"Norway","abbreviation":"NO"},{"name":"Oman","abbreviation":"OM"},{"name":"Pacific Islands Trust Territory","abbreviation":"PC"},{"name":"Pakistan","abbreviation":"PK"},{"name":"Palau","abbreviation":"PW"},{"name":"Palestinian Territories","abbreviation":"PS"},{"name":"Panama","abbreviation":"PA"},{"name":"Panama Canal Zone","abbreviation":"PZ"},{"name":"Papua New Guinea","abbreviation":"PG"},{"name":"Paraguay","abbreviation":"PY"},{"name":"People's Democratic Republic of Yemen","abbreviation":"YD"},{"name":"Peru","abbreviation":"PE"},{"name":"Philippines","abbreviation":"PH"},{"name":"Pitcairn Islands","abbreviation":"PN"},{"name":"Poland","abbreviation":"PL"},{"name":"Portugal","abbreviation":"PT"},{"name":"Puerto Rico","abbreviation":"PR"},{"name":"Qatar","abbreviation":"QA"},{"name":"Romania","abbreviation":"RO"},{"name":"Russia","abbreviation":"RU"},{"name":"Rwanda","abbreviation":"RW"},{"name":"Réunion","abbreviation":"RE"},{"name":"Saint Barthélemy","abbreviation":"BL"},{"name":"Saint Helena","abbreviation":"SH"},{"name":"Saint Kitts and Nevis","abbreviation":"KN"},{"name":"Saint Lucia","abbreviation":"LC"},{"name":"Saint Martin","abbreviation":"MF"},{"name":"Saint Pierre and Miquelon","abbreviation":"PM"},{"name":"Saint Vincent and the Grenadines","abbreviation":"VC"},{"name":"Samoa","abbreviation":"WS"},{"name":"San Marino","abbreviation":"SM"},{"name":"Saudi Arabia","abbreviation":"SA"},{"name":"Senegal","abbreviation":"SN"},{"name":"Serbia","abbreviation":"RS"},{"name":"Serbia and Montenegro","abbreviation":"CS"},{"name":"Seychelles","abbreviation":"SC"},{"name":"Sierra Leone","abbreviation":"SL"},{"name":"Singapore","abbreviation":"SG"},{"name":"Slovakia","abbreviation":"SK"},{"name":"Slovenia","abbreviation":"SI"},{"name":"Solomon Islands","abbreviation":"SB"},{"name":"Somalia","abbreviation":"SO"},{"name":"South Africa","abbreviation":"ZA"},{"name":"South Georgia and the South Sandwich Islands","abbreviation":"GS"},{"name":"South Korea","abbreviation":"KR"},{"name":"Spain","abbreviation":"ES"},{"name":"Sri Lanka","abbreviation":"LK"},{"name":"Sudan","abbreviation":"SD"},{"name":"Suriname","abbreviation":"SR"},{"name":"Svalbard and Jan Mayen","abbreviation":"SJ"},{"name":"Swaziland","abbreviation":"SZ"},{"name":"Sweden","abbreviation":"SE"},{"name":"Switzerland","abbreviation":"CH"},{"name":"Syria","abbreviation":"SY"},{"name":"São Tomé and Príncipe","abbreviation":"ST"},{"name":"Taiwan","abbreviation":"TW"},{"name":"Tajikistan","abbreviation":"TJ"},{"name":"Tanzania","abbreviation":"TZ"},{"name":"Thailand","abbreviation":"TH"},{"name":"Timor-Leste","abbreviation":"TL"},{"name":"Togo","abbreviation":"TG"},{"name":"Tokelau","abbreviation":"TK"},{"name":"Tonga","abbreviation":"TO"},{"name":"Trinidad and Tobago","abbreviation":"TT"},{"name":"Tunisia","abbreviation":"TN"},{"name":"Turkey","abbreviation":"TR"},{"name":"Turkmenistan","abbreviation":"TM"},{"name":"Turks and Caicos Islands","abbreviation":"TC"},{"name":"Tuvalu","abbreviation":"TV"},{"name":"U.S. Minor Outlying Islands","abbreviation":"UM"},{"name":"U.S. Miscellaneous Pacific Islands","abbreviation":"PU"},{"name":"U.S. Virgin Islands","abbreviation":"VI"},{"name":"Uganda","abbreviation":"UG"},{"name":"Ukraine","abbreviation":"UA"},{"name":"Union of Soviet Socialist Republics","abbreviation":"SU"},{"name":"United Arab Emirates","abbreviation":"AE"},{"name":"United Kingdom","abbreviation":"GB"},{"name":"United States","abbreviation":"US"},{"name":"Unknown or Invalid Region","abbreviation":"ZZ"},{"name":"Uruguay","abbreviation":"UY"},{"name":"Uzbekistan","abbreviation":"UZ"},{"name":"Vanuatu","abbreviation":"VU"},{"name":"Vatican City","abbreviation":"VA"},{"name":"Venezuela","abbreviation":"VE"},{"name":"Vietnam","abbreviation":"VN"},{"name":"Wake Island","abbreviation":"WK"},{"name":"Wallis and Futuna","abbreviation":"WF"},{"name":"Western Sahara","abbreviation":"EH"},{"name":"Yemen","abbreviation":"YE"},{"name":"Zambia","abbreviation":"ZM"},{"name":"Zimbabwe","abbreviation":"ZW"},{"name":"Åland Islands","abbreviation":"AX"}],

        provinces: [
            {name: 'Alberta', abbreviation: 'AB'},
            {name: 'British Columbia', abbreviation: 'BC'},
            {name: 'Manitoba', abbreviation: 'MB'},
            {name: 'New Brunswick', abbreviation: 'NB'},
            {name: 'Newfoundland and Labrador', abbreviation: 'NL'},
            {name: 'Nova Scotia', abbreviation: 'NS'},
            {name: 'Ontario', abbreviation: 'ON'},
            {name: 'Prince Edward Island', abbreviation: 'PE'},
            {name: 'Quebec', abbreviation: 'QC'},
            {name: 'Saskatchewan', abbreviation: 'SK'},

            // The case could be made that the following are not actually provinces
            // since they are technically considered "territories" however they all
            // look the same on an envelope!
            {name: 'Northwest Territories', abbreviation: 'NT'},
            {name: 'Nunavut', abbreviation: 'NU'},
            {name: 'Yukon', abbreviation: 'YT'}
        ],

        us_states_and_dc: [
            {name: 'Alabama', abbreviation: 'AL'},
            {name: 'Alaska', abbreviation: 'AK'},
            {name: 'Arizona', abbreviation: 'AZ'},
            {name: 'Arkansas', abbreviation: 'AR'},
            {name: 'California', abbreviation: 'CA'},
            {name: 'Colorado', abbreviation: 'CO'},
            {name: 'Connecticut', abbreviation: 'CT'},
            {name: 'Delaware', abbreviation: 'DE'},
            {name: 'District of Columbia', abbreviation: 'DC'},
            {name: 'Florida', abbreviation: 'FL'},
            {name: 'Georgia', abbreviation: 'GA'},
            {name: 'Hawaii', abbreviation: 'HI'},
            {name: 'Idaho', abbreviation: 'ID'},
            {name: 'Illinois', abbreviation: 'IL'},
            {name: 'Indiana', abbreviation: 'IN'},
            {name: 'Iowa', abbreviation: 'IA'},
            {name: 'Kansas', abbreviation: 'KS'},
            {name: 'Kentucky', abbreviation: 'KY'},
            {name: 'Louisiana', abbreviation: 'LA'},
            {name: 'Maine', abbreviation: 'ME'},
            {name: 'Maryland', abbreviation: 'MD'},
            {name: 'Massachusetts', abbreviation: 'MA'},
            {name: 'Michigan', abbreviation: 'MI'},
            {name: 'Minnesota', abbreviation: 'MN'},
            {name: 'Mississippi', abbreviation: 'MS'},
            {name: 'Missouri', abbreviation: 'MO'},
            {name: 'Montana', abbreviation: 'MT'},
            {name: 'Nebraska', abbreviation: 'NE'},
            {name: 'Nevada', abbreviation: 'NV'},
            {name: 'New Hampshire', abbreviation: 'NH'},
            {name: 'New Jersey', abbreviation: 'NJ'},
            {name: 'New Mexico', abbreviation: 'NM'},
            {name: 'New York', abbreviation: 'NY'},
            {name: 'North Carolina', abbreviation: 'NC'},
            {name: 'North Dakota', abbreviation: 'ND'},
            {name: 'Ohio', abbreviation: 'OH'},
            {name: 'Oklahoma', abbreviation: 'OK'},
            {name: 'Oregon', abbreviation: 'OR'},
            {name: 'Pennsylvania', abbreviation: 'PA'},
            {name: 'Rhode Island', abbreviation: 'RI'},
            {name: 'South Carolina', abbreviation: 'SC'},
            {name: 'South Dakota', abbreviation: 'SD'},
            {name: 'Tennessee', abbreviation: 'TN'},
            {name: 'Texas', abbreviation: 'TX'},
            {name: 'Utah', abbreviation: 'UT'},
            {name: 'Vermont', abbreviation: 'VT'},
            {name: 'Virginia', abbreviation: 'VA'},
            {name: 'Washington', abbreviation: 'WA'},
            {name: 'West Virginia', abbreviation: 'WV'},
            {name: 'Wisconsin', abbreviation: 'WI'},
            {name: 'Wyoming', abbreviation: 'WY'}
        ],

        territories: [
            {name: 'American Samoa', abbreviation: 'AS'},
            {name: 'Federated States of Micronesia', abbreviation: 'FM'},
            {name: 'Guam', abbreviation: 'GU'},
            {name: 'Marshall Islands', abbreviation: 'MH'},
            {name: 'Northern Mariana Islands', abbreviation: 'MP'},
            {name: 'Puerto Rico', abbreviation: 'PR'},
            {name: 'Virgin Islands, U.S.', abbreviation: 'VI'}
        ],

        armed_forces: [
            {name: 'Armed Forces Europe', abbreviation: 'AE'},
            {name: 'Armed Forces Pacific', abbreviation: 'AP'},
            {name: 'Armed Forces the Americas', abbreviation: 'AA'}
        ],

        street_suffixes: [
            {name: 'Avenue', abbreviation: 'Ave'},
            {name: 'Boulevard', abbreviation: 'Blvd'},
            {name: 'Center', abbreviation: 'Ctr'},
            {name: 'Circle', abbreviation: 'Cir'},
            {name: 'Court', abbreviation: 'Ct'},
            {name: 'Drive', abbreviation: 'Dr'},
            {name: 'Extension', abbreviation: 'Ext'},
            {name: 'Glen', abbreviation: 'Gln'},
            {name: 'Grove', abbreviation: 'Grv'},
            {name: 'Heights', abbreviation: 'Hts'},
            {name: 'Highway', abbreviation: 'Hwy'},
            {name: 'Junction', abbreviation: 'Jct'},
            {name: 'Key', abbreviation: 'Key'},
            {name: 'Lane', abbreviation: 'Ln'},
            {name: 'Loop', abbreviation: 'Loop'},
            {name: 'Manor', abbreviation: 'Mnr'},
            {name: 'Mill', abbreviation: 'Mill'},
            {name: 'Park', abbreviation: 'Park'},
            {name: 'Parkway', abbreviation: 'Pkwy'},
            {name: 'Pass', abbreviation: 'Pass'},
            {name: 'Path', abbreviation: 'Path'},
            {name: 'Pike', abbreviation: 'Pike'},
            {name: 'Place', abbreviation: 'Pl'},
            {name: 'Plaza', abbreviation: 'Plz'},
            {name: 'Point', abbreviation: 'Pt'},
            {name: 'Ridge', abbreviation: 'Rdg'},
            {name: 'River', abbreviation: 'Riv'},
            {name: 'Road', abbreviation: 'Rd'},
            {name: 'Square', abbreviation: 'Sq'},
            {name: 'Street', abbreviation: 'St'},
            {name: 'Terrace', abbreviation: 'Ter'},
            {name: 'Trail', abbreviation: 'Trl'},
            {name: 'Turnpike', abbreviation: 'Tpke'},
            {name: 'View', abbreviation: 'Vw'},
            {name: 'Way', abbreviation: 'Way'}
        ],

        months: [
            {name: 'January', short_name: 'Jan', numeric: '01', days: 31},
            // Not messing with leap years...
            {name: 'February', short_name: 'Feb', numeric: '02', days: 28},
            {name: 'March', short_name: 'Mar', numeric: '03', days: 31},
            {name: 'April', short_name: 'Apr', numeric: '04', days: 30},
            {name: 'May', short_name: 'May', numeric: '05', days: 31},
            {name: 'June', short_name: 'Jun', numeric: '06', days: 30},
            {name: 'July', short_name: 'Jul', numeric: '07', days: 31},
            {name: 'August', short_name: 'Aug', numeric: '08', days: 31},
            {name: 'September', short_name: 'Sep', numeric: '09', days: 30},
            {name: 'October', short_name: 'Oct', numeric: '10', days: 31},
            {name: 'November', short_name: 'Nov', numeric: '11', days: 30},
            {name: 'December', short_name: 'Dec', numeric: '12', days: 31}
        ],

        // http://en.wikipedia.org/wiki/Bank_card_number#Issuer_identification_number_.28IIN.29
        cc_types: [
            {name: "American Express", short_name: 'amex', prefix: '34', length: 15},
            {name: "Bankcard", short_name: 'bankcard', prefix: '5610', length: 16},
            {name: "China UnionPay", short_name: 'chinaunion', prefix: '62', length: 16},
            {name: "Diners Club Carte Blanche", short_name: 'dccarte', prefix: '300', length: 14},
            {name: "Diners Club enRoute", short_name: 'dcenroute', prefix: '2014', length: 15},
            {name: "Diners Club International", short_name: 'dcintl', prefix: '36', length: 14},
            {name: "Diners Club United States & Canada", short_name: 'dcusc', prefix: '54', length: 16},
            {name: "Discover Card", short_name: 'discover', prefix: '6011', length: 16},
            {name: "InstaPayment", short_name: 'instapay', prefix: '637', length: 16},
            {name: "JCB", short_name: 'jcb', prefix: '3528', length: 16},
            {name: "Laser", short_name: 'laser', prefix: '6304', length: 16},
            {name: "Maestro", short_name: 'maestro', prefix: '5018', length: 16},
            {name: "Mastercard", short_name: 'mc', prefix: '51', length: 16},
            {name: "Solo", short_name: 'solo', prefix: '6334', length: 16},
            {name: "Switch", short_name: 'switch', prefix: '4903', length: 16},
            {name: "Visa", short_name: 'visa', prefix: '4', length: 16},
            {name: "Visa Electron", short_name: 'electron', prefix: '4026', length: 16}
        ],

        //return all world currency by ISO 4217
        currency_types: [
            {'code' : 'AED', 'name' : 'United Arab Emirates Dirham'},
            {'code' : 'AFN', 'name' : 'Afghanistan Afghani'},
            {'code' : 'ALL', 'name' : 'Albania Lek'},
            {'code' : 'AMD', 'name' : 'Armenia Dram'},
            {'code' : 'ANG', 'name' : 'Netherlands Antilles Guilder'},
            {'code' : 'AOA', 'name' : 'Angola Kwanza'},
            {'code' : 'ARS', 'name' : 'Argentina Peso'},
            {'code' : 'AUD', 'name' : 'Australia Dollar'},
            {'code' : 'AWG', 'name' : 'Aruba Guilder'},
            {'code' : 'AZN', 'name' : 'Azerbaijan New Manat'},
            {'code' : 'BAM', 'name' : 'Bosnia and Herzegovina Convertible Marka'},
            {'code' : 'BBD', 'name' : 'Barbados Dollar'},
            {'code' : 'BDT', 'name' : 'Bangladesh Taka'},
            {'code' : 'BGN', 'name' : 'Bulgaria Lev'},
            {'code' : 'BHD', 'name' : 'Bahrain Dinar'},
            {'code' : 'BIF', 'name' : 'Burundi Franc'},
            {'code' : 'BMD', 'name' : 'Bermuda Dollar'},
            {'code' : 'BND', 'name' : 'Brunei Darussalam Dollar'},
            {'code' : 'BOB', 'name' : 'Bolivia Boliviano'},
            {'code' : 'BRL', 'name' : 'Brazil Real'},
            {'code' : 'BSD', 'name' : 'Bahamas Dollar'},
            {'code' : 'BTN', 'name' : 'Bhutan Ngultrum'},
            {'code' : 'BWP', 'name' : 'Botswana Pula'},
            {'code' : 'BYR', 'name' : 'Belarus Ruble'},
            {'code' : 'BZD', 'name' : 'Belize Dollar'},
            {'code' : 'CAD', 'name' : 'Canada Dollar'},
            {'code' : 'CDF', 'name' : 'Congo/Kinshasa Franc'},
            {'code' : 'CHF', 'name' : 'Switzerland Franc'},
            {'code' : 'CLP', 'name' : 'Chile Peso'},
            {'code' : 'CNY', 'name' : 'China Yuan Renminbi'},
            {'code' : 'COP', 'name' : 'Colombia Peso'},
            {'code' : 'CRC', 'name' : 'Costa Rica Colon'},
            {'code' : 'CUC', 'name' : 'Cuba Convertible Peso'},
            {'code' : 'CUP', 'name' : 'Cuba Peso'},
            {'code' : 'CVE', 'name' : 'Cape Verde Escudo'},
            {'code' : 'CZK', 'name' : 'Czech Republic Koruna'},
            {'code' : 'DJF', 'name' : 'Djibouti Franc'},
            {'code' : 'DKK', 'name' : 'Denmark Krone'},
            {'code' : 'DOP', 'name' : 'Dominican Republic Peso'},
            {'code' : 'DZD', 'name' : 'Algeria Dinar'},
            {'code' : 'EGP', 'name' : 'Egypt Pound'},
            {'code' : 'ERN', 'name' : 'Eritrea Nakfa'},
            {'code' : 'ETB', 'name' : 'Ethiopia Birr'},
            {'code' : 'EUR', 'name' : 'Euro Member Countries'},
            {'code' : 'FJD', 'name' : 'Fiji Dollar'},
            {'code' : 'FKP', 'name' : 'Falkland Islands (Malvinas) Pound'},
            {'code' : 'GBP', 'name' : 'United Kingdom Pound'},
            {'code' : 'GEL', 'name' : 'Georgia Lari'},
            {'code' : 'GGP', 'name' : 'Guernsey Pound'},
            {'code' : 'GHS', 'name' : 'Ghana Cedi'},
            {'code' : 'GIP', 'name' : 'Gibraltar Pound'},
            {'code' : 'GMD', 'name' : 'Gambia Dalasi'},
            {'code' : 'GNF', 'name' : 'Guinea Franc'},
            {'code' : 'GTQ', 'name' : 'Guatemala Quetzal'},
            {'code' : 'GYD', 'name' : 'Guyana Dollar'},
            {'code' : 'HKD', 'name' : 'Hong Kong Dollar'},
            {'code' : 'HNL', 'name' : 'Honduras Lempira'},
            {'code' : 'HRK', 'name' : 'Croatia Kuna'},
            {'code' : 'HTG', 'name' : 'Haiti Gourde'},
            {'code' : 'HUF', 'name' : 'Hungary Forint'},
            {'code' : 'IDR', 'name' : 'Indonesia Rupiah'},
            {'code' : 'ILS', 'name' : 'Israel Shekel'},
            {'code' : 'IMP', 'name' : 'Isle of Man Pound'},
            {'code' : 'INR', 'name' : 'India Rupee'},
            {'code' : 'IQD', 'name' : 'Iraq Dinar'},
            {'code' : 'IRR', 'name' : 'Iran Rial'},
            {'code' : 'ISK', 'name' : 'Iceland Krona'},
            {'code' : 'JEP', 'name' : 'Jersey Pound'},
            {'code' : 'JMD', 'name' : 'Jamaica Dollar'},
            {'code' : 'JOD', 'name' : 'Jordan Dinar'},
            {'code' : 'JPY', 'name' : 'Japan Yen'},
            {'code' : 'KES', 'name' : 'Kenya Shilling'},
            {'code' : 'KGS', 'name' : 'Kyrgyzstan Som'},
            {'code' : 'KHR', 'name' : 'Cambodia Riel'},
            {'code' : 'KMF', 'name' : 'Comoros Franc'},
            {'code' : 'KPW', 'name' : 'Korea (North) Won'},
            {'code' : 'KRW', 'name' : 'Korea (South) Won'},
            {'code' : 'KWD', 'name' : 'Kuwait Dinar'},
            {'code' : 'KYD', 'name' : 'Cayman Islands Dollar'},
            {'code' : 'KZT', 'name' : 'Kazakhstan Tenge'},
            {'code' : 'LAK', 'name' : 'Laos Kip'},
            {'code' : 'LBP', 'name' : 'Lebanon Pound'},
            {'code' : 'LKR', 'name' : 'Sri Lanka Rupee'},
            {'code' : 'LRD', 'name' : 'Liberia Dollar'},
            {'code' : 'LSL', 'name' : 'Lesotho Loti'},
            {'code' : 'LTL', 'name' : 'Lithuania Litas'},
            {'code' : 'LYD', 'name' : 'Libya Dinar'},
            {'code' : 'MAD', 'name' : 'Morocco Dirham'},
            {'code' : 'MDL', 'name' : 'Moldova Leu'},
            {'code' : 'MGA', 'name' : 'Madagascar Ariary'},
            {'code' : 'MKD', 'name' : 'Macedonia Denar'},
            {'code' : 'MMK', 'name' : 'Myanmar (Burma) Kyat'},
            {'code' : 'MNT', 'name' : 'Mongolia Tughrik'},
            {'code' : 'MOP', 'name' : 'Macau Pataca'},
            {'code' : 'MRO', 'name' : 'Mauritania Ouguiya'},
            {'code' : 'MUR', 'name' : 'Mauritius Rupee'},
            {'code' : 'MVR', 'name' : 'Maldives (Maldive Islands) Rufiyaa'},
            {'code' : 'MWK', 'name' : 'Malawi Kwacha'},
            {'code' : 'MXN', 'name' : 'Mexico Peso'},
            {'code' : 'MYR', 'name' : 'Malaysia Ringgit'},
            {'code' : 'MZN', 'name' : 'Mozambique Metical'},
            {'code' : 'NAD', 'name' : 'Namibia Dollar'},
            {'code' : 'NGN', 'name' : 'Nigeria Naira'},
            {'code' : 'NIO', 'name' : 'Nicaragua Cordoba'},
            {'code' : 'NOK', 'name' : 'Norway Krone'},
            {'code' : 'NPR', 'name' : 'Nepal Rupee'},
            {'code' : 'NZD', 'name' : 'New Zealand Dollar'},
            {'code' : 'OMR', 'name' : 'Oman Rial'},
            {'code' : 'PAB', 'name' : 'Panama Balboa'},
            {'code' : 'PEN', 'name' : 'Peru Nuevo Sol'},
            {'code' : 'PGK', 'name' : 'Papua New Guinea Kina'},
            {'code' : 'PHP', 'name' : 'Philippines Peso'},
            {'code' : 'PKR', 'name' : 'Pakistan Rupee'},
            {'code' : 'PLN', 'name' : 'Poland Zloty'},
            {'code' : 'PYG', 'name' : 'Paraguay Guarani'},
            {'code' : 'QAR', 'name' : 'Qatar Riyal'},
            {'code' : 'RON', 'name' : 'Romania New Leu'},
            {'code' : 'RSD', 'name' : 'Serbia Dinar'},
            {'code' : 'RUB', 'name' : 'Russia Ruble'},
            {'code' : 'RWF', 'name' : 'Rwanda Franc'},
            {'code' : 'SAR', 'name' : 'Saudi Arabia Riyal'},
            {'code' : 'SBD', 'name' : 'Solomon Islands Dollar'},
            {'code' : 'SCR', 'name' : 'Seychelles Rupee'},
            {'code' : 'SDG', 'name' : 'Sudan Pound'},
            {'code' : 'SEK', 'name' : 'Sweden Krona'},
            {'code' : 'SGD', 'name' : 'Singapore Dollar'},
            {'code' : 'SHP', 'name' : 'Saint Helena Pound'},
            {'code' : 'SLL', 'name' : 'Sierra Leone Leone'},
            {'code' : 'SOS', 'name' : 'Somalia Shilling'},
            {'code' : 'SPL', 'name' : 'Seborga Luigino'},
            {'code' : 'SRD', 'name' : 'Suriname Dollar'},
            {'code' : 'STD', 'name' : 'São Tomé and Príncipe Dobra'},
            {'code' : 'SVC', 'name' : 'El Salvador Colon'},
            {'code' : 'SYP', 'name' : 'Syria Pound'},
            {'code' : 'SZL', 'name' : 'Swaziland Lilangeni'},
            {'code' : 'THB', 'name' : 'Thailand Baht'},
            {'code' : 'TJS', 'name' : 'Tajikistan Somoni'},
            {'code' : 'TMT', 'name' : 'Turkmenistan Manat'},
            {'code' : 'TND', 'name' : 'Tunisia Dinar'},
            {'code' : 'TOP', 'name' : 'Tonga Pa\'anga'},
            {'code' : 'TRY', 'name' : 'Turkey Lira'},
            {'code' : 'TTD', 'name' : 'Trinidad and Tobago Dollar'},
            {'code' : 'TVD', 'name' : 'Tuvalu Dollar'},
            {'code' : 'TWD', 'name' : 'Taiwan New Dollar'},
            {'code' : 'TZS', 'name' : 'Tanzania Shilling'},
            {'code' : 'UAH', 'name' : 'Ukraine Hryvnia'},
            {'code' : 'UGX', 'name' : 'Uganda Shilling'},
            {'code' : 'USD', 'name' : 'United States Dollar'},
            {'code' : 'UYU', 'name' : 'Uruguay Peso'},
            {'code' : 'UZS', 'name' : 'Uzbekistan Som'},
            {'code' : 'VEF', 'name' : 'Venezuela Bolivar'},
            {'code' : 'VND', 'name' : 'Viet Nam Dong'},
            {'code' : 'VUV', 'name' : 'Vanuatu Vatu'},
            {'code' : 'WST', 'name' : 'Samoa Tala'},
            {'code' : 'XAF', 'name' : 'Communauté Financière Africaine (BEAC) CFA Franc BEAC'},
            {'code' : 'XCD', 'name' : 'East Caribbean Dollar'},
            {'code' : 'XDR', 'name' : 'International Monetary Fund (IMF) Special Drawing Rights'},
            {'code' : 'XOF', 'name' : 'Communauté Financière Africaine (BCEAO) Franc'},
            {'code' : 'XPF', 'name' : 'Comptoirs Français du Pacifique (CFP) Franc'},
            {'code' : 'YER', 'name' : 'Yemen Rial'},
            {'code' : 'ZAR', 'name' : 'South Africa Rand'},
            {'code' : 'ZMW', 'name' : 'Zambia Kwacha'},
            {'code' : 'ZWD', 'name' : 'Zimbabwe Dollar'}
        ]
    };

    var o_hasOwnProperty = Object.prototype.hasOwnProperty;
    var o_keys = (Object.keys || function(obj) {
      var result = [];
      for (var key in obj) {
        if (o_hasOwnProperty.call(obj, key)) {
          result.push(key);
        }
      }

      return result;
    });

    function _copyObject(source, target) {
      var keys = o_keys(source);
      var key;

      for (var i = 0, l = keys.length; i < l; i++) {
        key = keys[i];
        target[key] = source[key] || target[key];
      }
    }

    function _copyArray(source, target) {
      for (var i = 0, l = source.length; i < l; i++) {
        target[i] = source[i];
      }
    }

    function copyObject(source, _target) {
        var isArray = Array.isArray(source);
        var target = _target || (isArray ? new Array(source.length) : {});

        if (isArray) {
          _copyArray(source, target);
        } else {
          _copyObject(source, target);
        }

        return target;
    }

    /** Get the data based on key**/
    Chance.prototype.get = function (name) {
        return copyObject(data[name]);
    };

    // Mac Address
    Chance.prototype.mac_address = function(options){
        // typically mac addresses are separated by ":"
        // however they can also be separated by "-"
        // the network variant uses a dot every fourth byte

        options = initOptions(options);
        if(!options.separator) {
            options.separator =  options.networkVersion ? "." : ":";
        }

        var mac_pool="ABCDEF1234567890",
            mac = "";
        if(!options.networkVersion) {
            mac = this.n(this.string, 6, { pool: mac_pool, length:2 }).join(options.separator);
        } else {
            mac = this.n(this.string, 3, { pool: mac_pool, length:4 }).join(options.separator);
        }

        return mac;
    };

    Chance.prototype.normal = function (options) {
        options = initOptions(options, {mean : 0, dev : 1});

        // The Marsaglia Polar method
        var s, u, v, norm,
            mean = options.mean,
            dev = options.dev;

        do {
            // U and V are from the uniform distribution on (-1, 1)
            u = this.random() * 2 - 1;
            v = this.random() * 2 - 1;

            s = u * u + v * v;
        } while (s >= 1);

        // Compute the standard normal variate
        norm = u * Math.sqrt(-2 * Math.log(s) / s);

        // Shape and scale
        return dev * norm + mean;
    };

    Chance.prototype.radio = function (options) {
        // Initial Letter (Typically Designated by Side of Mississippi River)
        options = initOptions(options, {side : "?"});
        var fl = "";
        switch (options.side.toLowerCase()) {
        case "east":
        case "e":
            fl = "W";
            break;
        case "west":
        case "w":
            fl = "K";
            break;
        default:
            fl = this.character({pool: "KW"});
            break;
        }

        return fl + this.character({alpha: true, casing: "upper"}) +
                this.character({alpha: true, casing: "upper"}) +
                this.character({alpha: true, casing: "upper"});
    };

    // Set the data as key and data or the data map
    Chance.prototype.set = function (name, values) {
        if (typeof name === "string") {
            data[name] = values;
        } else {
            data = copyObject(name, data);
        }
    };

    Chance.prototype.tv = function (options) {
        return this.radio(options);
    };

    // ID number for Brazil companies
    Chance.prototype.cnpj = function () {
        var n = this.n(this.natural, 8, { max: 9 });
        var d1 = 2+n[7]*6+n[6]*7+n[5]*8+n[4]*9+n[3]*2+n[2]*3+n[1]*4+n[0]*5;
        d1 = 11 - (d1 % 11);
        if (d1>=10){
            d1 = 0;
        }
        var d2 = d1*2+3+n[7]*7+n[6]*8+n[5]*9+n[4]*2+n[3]*3+n[2]*4+n[1]*5+n[0]*6;
        d2 = 11 - (d2 % 11);
        if (d2>=10){
            d2 = 0;
        }
        return ''+n[0]+n[1]+'.'+n[2]+n[3]+n[4]+'.'+n[5]+n[6]+n[7]+'/0001-'+d1+d2;
    };

    // -- End Miscellaneous --

    Chance.prototype.mersenne_twister = function (seed) {
        return new MersenneTwister(seed);
    };

    Chance.prototype.blueimp_md5 = function () {
        return new BlueImpMD5();
    };

    // Mersenne Twister from https://gist.github.com/banksean/300494
    var MersenneTwister = function (seed) {
        if (seed === undefined) {
            // kept random number same size as time used previously to ensure no unexpected results downstream
            seed = Math.floor(Math.random()*Math.pow(10,13));
        }
        /* Period parameters */
        this.N = 624;
        this.M = 397;
        this.MATRIX_A = 0x9908b0df;   /* constant vector a */
        this.UPPER_MASK = 0x80000000; /* most significant w-r bits */
        this.LOWER_MASK = 0x7fffffff; /* least significant r bits */

        this.mt = new Array(this.N); /* the array for the state vector */
        this.mti = this.N + 1; /* mti==N + 1 means mt[N] is not initialized */

        this.init_genrand(seed);
    };

    /* initializes mt[N] with a seed */
    MersenneTwister.prototype.init_genrand = function (s) {
        this.mt[0] = s >>> 0;
        for (this.mti = 1; this.mti < this.N; this.mti++) {
            s = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
            this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253) + this.mti;
            /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
            /* In the previous versions, MSBs of the seed affect   */
            /* only MSBs of the array mt[].                        */
            /* 2002/01/09 modified by Makoto Matsumoto             */
            this.mt[this.mti] >>>= 0;
            /* for >32 bit machines */
        }
    };

    /* initialize by an array with array-length */
    /* init_key is the array for initializing keys */
    /* key_length is its length */
    /* slight change for C++, 2004/2/26 */
    MersenneTwister.prototype.init_by_array = function (init_key, key_length) {
        var i = 1, j = 0, k, s;
        this.init_genrand(19650218);
        k = (this.N > key_length ? this.N : key_length);
        for (; k; k--) {
            s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
            this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1664525) << 16) + ((s & 0x0000ffff) * 1664525))) + init_key[j] + j; /* non linear */
            this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
            i++;
            j++;
            if (i >= this.N) { this.mt[0] = this.mt[this.N - 1]; i = 1; }
            if (j >= key_length) { j = 0; }
        }
        for (k = this.N - 1; k; k--) {
            s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
            this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1566083941) << 16) + (s & 0x0000ffff) * 1566083941)) - i; /* non linear */
            this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
            i++;
            if (i >= this.N) { this.mt[0] = this.mt[this.N - 1]; i = 1; }
        }

        this.mt[0] = 0x80000000; /* MSB is 1; assuring non-zero initial array */
    };

    /* generates a random number on [0,0xffffffff]-interval */
    MersenneTwister.prototype.genrand_int32 = function () {
        var y;
        var mag01 = new Array(0x0, this.MATRIX_A);
        /* mag01[x] = x * MATRIX_A  for x=0,1 */

        if (this.mti >= this.N) { /* generate N words at one time */
            var kk;

            if (this.mti === this.N + 1) {   /* if init_genrand() has not been called, */
                this.init_genrand(5489); /* a default initial seed is used */
            }
            for (kk = 0; kk < this.N - this.M; kk++) {
                y = (this.mt[kk]&this.UPPER_MASK)|(this.mt[kk + 1]&this.LOWER_MASK);
                this.mt[kk] = this.mt[kk + this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
            }
            for (;kk < this.N - 1; kk++) {
                y = (this.mt[kk]&this.UPPER_MASK)|(this.mt[kk + 1]&this.LOWER_MASK);
                this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
            }
            y = (this.mt[this.N - 1]&this.UPPER_MASK)|(this.mt[0]&this.LOWER_MASK);
            this.mt[this.N - 1] = this.mt[this.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];

            this.mti = 0;
        }

        y = this.mt[this.mti++];

        /* Tempering */
        y ^= (y >>> 11);
        y ^= (y << 7) & 0x9d2c5680;
        y ^= (y << 15) & 0xefc60000;
        y ^= (y >>> 18);

        return y >>> 0;
    };

    /* generates a random number on [0,0x7fffffff]-interval */
    MersenneTwister.prototype.genrand_int31 = function () {
        return (this.genrand_int32() >>> 1);
    };

    /* generates a random number on [0,1]-real-interval */
    MersenneTwister.prototype.genrand_real1 = function () {
        return this.genrand_int32() * (1.0 / 4294967295.0);
        /* divided by 2^32-1 */
    };

    /* generates a random number on [0,1)-real-interval */
    MersenneTwister.prototype.random = function () {
        return this.genrand_int32() * (1.0 / 4294967296.0);
        /* divided by 2^32 */
    };

    /* generates a random number on (0,1)-real-interval */
    MersenneTwister.prototype.genrand_real3 = function () {
        return (this.genrand_int32() + 0.5) * (1.0 / 4294967296.0);
        /* divided by 2^32 */
    };

    /* generates a random number on [0,1) with 53-bit resolution*/
    MersenneTwister.prototype.genrand_res53 = function () {
        var a = this.genrand_int32()>>>5, b = this.genrand_int32()>>>6;
        return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
    };

    // BlueImp MD5 hashing algorithm from https://github.com/blueimp/JavaScript-MD5
    var BlueImpMD5 = function () {};

    BlueImpMD5.prototype.VERSION = '1.0.1';

    /*
    * Add integers, wrapping at 2^32. This uses 16-bit operations internally
    * to work around bugs in some JS interpreters.
    */
    BlueImpMD5.prototype.safe_add = function safe_add(x, y) {
        var lsw = (x & 0xFFFF) + (y & 0xFFFF),
            msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    };

    /*
    * Bitwise rotate a 32-bit number to the left.
    */
    BlueImpMD5.prototype.bit_roll = function (num, cnt) {
        return (num << cnt) | (num >>> (32 - cnt));
    };

    /*
    * These functions implement the five basic operations the algorithm uses.
    */
    BlueImpMD5.prototype.md5_cmn = function (q, a, b, x, s, t) {
        return this.safe_add(this.bit_roll(this.safe_add(this.safe_add(a, q), this.safe_add(x, t)), s), b);
    };
    BlueImpMD5.prototype.md5_ff = function (a, b, c, d, x, s, t) {
        return this.md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
    };
    BlueImpMD5.prototype.md5_gg = function (a, b, c, d, x, s, t) {
        return this.md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
    };
    BlueImpMD5.prototype.md5_hh = function (a, b, c, d, x, s, t) {
        return this.md5_cmn(b ^ c ^ d, a, b, x, s, t);
    };
    BlueImpMD5.prototype.md5_ii = function (a, b, c, d, x, s, t) {
        return this.md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
    };

    /*
    * Calculate the MD5 of an array of little-endian words, and a bit length.
    */
    BlueImpMD5.prototype.binl_md5 = function (x, len) {
        /* append padding */
        x[len >> 5] |= 0x80 << (len % 32);
        x[(((len + 64) >>> 9) << 4) + 14] = len;

        var i, olda, oldb, oldc, oldd,
            a =  1732584193,
            b = -271733879,
            c = -1732584194,
            d =  271733878;

        for (i = 0; i < x.length; i += 16) {
            olda = a;
            oldb = b;
            oldc = c;
            oldd = d;

            a = this.md5_ff(a, b, c, d, x[i],       7, -680876936);
            d = this.md5_ff(d, a, b, c, x[i +  1], 12, -389564586);
            c = this.md5_ff(c, d, a, b, x[i +  2], 17,  606105819);
            b = this.md5_ff(b, c, d, a, x[i +  3], 22, -1044525330);
            a = this.md5_ff(a, b, c, d, x[i +  4],  7, -176418897);
            d = this.md5_ff(d, a, b, c, x[i +  5], 12,  1200080426);
            c = this.md5_ff(c, d, a, b, x[i +  6], 17, -1473231341);
            b = this.md5_ff(b, c, d, a, x[i +  7], 22, -45705983);
            a = this.md5_ff(a, b, c, d, x[i +  8],  7,  1770035416);
            d = this.md5_ff(d, a, b, c, x[i +  9], 12, -1958414417);
            c = this.md5_ff(c, d, a, b, x[i + 10], 17, -42063);
            b = this.md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = this.md5_ff(a, b, c, d, x[i + 12],  7,  1804603682);
            d = this.md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
            c = this.md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
            b = this.md5_ff(b, c, d, a, x[i + 15], 22,  1236535329);

            a = this.md5_gg(a, b, c, d, x[i +  1],  5, -165796510);
            d = this.md5_gg(d, a, b, c, x[i +  6],  9, -1069501632);
            c = this.md5_gg(c, d, a, b, x[i + 11], 14,  643717713);
            b = this.md5_gg(b, c, d, a, x[i],      20, -373897302);
            a = this.md5_gg(a, b, c, d, x[i +  5],  5, -701558691);
            d = this.md5_gg(d, a, b, c, x[i + 10],  9,  38016083);
            c = this.md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
            b = this.md5_gg(b, c, d, a, x[i +  4], 20, -405537848);
            a = this.md5_gg(a, b, c, d, x[i +  9],  5,  568446438);
            d = this.md5_gg(d, a, b, c, x[i + 14],  9, -1019803690);
            c = this.md5_gg(c, d, a, b, x[i +  3], 14, -187363961);
            b = this.md5_gg(b, c, d, a, x[i +  8], 20,  1163531501);
            a = this.md5_gg(a, b, c, d, x[i + 13],  5, -1444681467);
            d = this.md5_gg(d, a, b, c, x[i +  2],  9, -51403784);
            c = this.md5_gg(c, d, a, b, x[i +  7], 14,  1735328473);
            b = this.md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

            a = this.md5_hh(a, b, c, d, x[i +  5],  4, -378558);
            d = this.md5_hh(d, a, b, c, x[i +  8], 11, -2022574463);
            c = this.md5_hh(c, d, a, b, x[i + 11], 16,  1839030562);
            b = this.md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = this.md5_hh(a, b, c, d, x[i +  1],  4, -1530992060);
            d = this.md5_hh(d, a, b, c, x[i +  4], 11,  1272893353);
            c = this.md5_hh(c, d, a, b, x[i +  7], 16, -155497632);
            b = this.md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = this.md5_hh(a, b, c, d, x[i + 13],  4,  681279174);
            d = this.md5_hh(d, a, b, c, x[i],      11, -358537222);
            c = this.md5_hh(c, d, a, b, x[i +  3], 16, -722521979);
            b = this.md5_hh(b, c, d, a, x[i +  6], 23,  76029189);
            a = this.md5_hh(a, b, c, d, x[i +  9],  4, -640364487);
            d = this.md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
            c = this.md5_hh(c, d, a, b, x[i + 15], 16,  530742520);
            b = this.md5_hh(b, c, d, a, x[i +  2], 23, -995338651);

            a = this.md5_ii(a, b, c, d, x[i],       6, -198630844);
            d = this.md5_ii(d, a, b, c, x[i +  7], 10,  1126891415);
            c = this.md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
            b = this.md5_ii(b, c, d, a, x[i +  5], 21, -57434055);
            a = this.md5_ii(a, b, c, d, x[i + 12],  6,  1700485571);
            d = this.md5_ii(d, a, b, c, x[i +  3], 10, -1894986606);
            c = this.md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
            b = this.md5_ii(b, c, d, a, x[i +  1], 21, -2054922799);
            a = this.md5_ii(a, b, c, d, x[i +  8],  6,  1873313359);
            d = this.md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
            c = this.md5_ii(c, d, a, b, x[i +  6], 15, -1560198380);
            b = this.md5_ii(b, c, d, a, x[i + 13], 21,  1309151649);
            a = this.md5_ii(a, b, c, d, x[i +  4],  6, -145523070);
            d = this.md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
            c = this.md5_ii(c, d, a, b, x[i +  2], 15,  718787259);
            b = this.md5_ii(b, c, d, a, x[i +  9], 21, -343485551);

            a = this.safe_add(a, olda);
            b = this.safe_add(b, oldb);
            c = this.safe_add(c, oldc);
            d = this.safe_add(d, oldd);
        }
        return [a, b, c, d];
    };

    /*
    * Convert an array of little-endian words to a string
    */
    BlueImpMD5.prototype.binl2rstr = function (input) {
        var i,
            output = '';
        for (i = 0; i < input.length * 32; i += 8) {
            output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF);
        }
        return output;
    };

    /*
    * Convert a raw string to an array of little-endian words
    * Characters >255 have their high-byte silently ignored.
    */
    BlueImpMD5.prototype.rstr2binl = function (input) {
        var i,
            output = [];
        output[(input.length >> 2) - 1] = undefined;
        for (i = 0; i < output.length; i += 1) {
            output[i] = 0;
        }
        for (i = 0; i < input.length * 8; i += 8) {
            output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (i % 32);
        }
        return output;
    };

    /*
    * Calculate the MD5 of a raw string
    */
    BlueImpMD5.prototype.rstr_md5 = function (s) {
        return this.binl2rstr(this.binl_md5(this.rstr2binl(s), s.length * 8));
    };

    /*
    * Calculate the HMAC-MD5, of a key and some data (raw strings)
    */
    BlueImpMD5.prototype.rstr_hmac_md5 = function (key, data) {
        var i,
            bkey = this.rstr2binl(key),
            ipad = [],
            opad = [],
            hash;
        ipad[15] = opad[15] = undefined;
        if (bkey.length > 16) {
            bkey = this.binl_md5(bkey, key.length * 8);
        }
        for (i = 0; i < 16; i += 1) {
            ipad[i] = bkey[i] ^ 0x36363636;
            opad[i] = bkey[i] ^ 0x5C5C5C5C;
        }
        hash = this.binl_md5(ipad.concat(this.rstr2binl(data)), 512 + data.length * 8);
        return this.binl2rstr(this.binl_md5(opad.concat(hash), 512 + 128));
    };

    /*
    * Convert a raw string to a hex string
    */
    BlueImpMD5.prototype.rstr2hex = function (input) {
        var hex_tab = '0123456789abcdef',
            output = '',
            x,
            i;
        for (i = 0; i < input.length; i += 1) {
            x = input.charCodeAt(i);
            output += hex_tab.charAt((x >>> 4) & 0x0F) +
                hex_tab.charAt(x & 0x0F);
        }
        return output;
    };

    /*
    * Encode a string as utf-8
    */
    BlueImpMD5.prototype.str2rstr_utf8 = function (input) {
        return unescape(encodeURIComponent(input));
    };

    /*
    * Take string arguments and return either raw or hex encoded strings
    */
    BlueImpMD5.prototype.raw_md5 = function (s) {
        return this.rstr_md5(this.str2rstr_utf8(s));
    };
    BlueImpMD5.prototype.hex_md5 = function (s) {
        return this.rstr2hex(this.raw_md5(s));
    };
    BlueImpMD5.prototype.raw_hmac_md5 = function (k, d) {
        return this.rstr_hmac_md5(this.str2rstr_utf8(k), this.str2rstr_utf8(d));
    };
    BlueImpMD5.prototype.hex_hmac_md5 = function (k, d) {
        return this.rstr2hex(this.raw_hmac_md5(k, d));
    };

    BlueImpMD5.prototype.md5 = function (string, key, raw) {
        if (!key) {
            if (!raw) {
                return this.hex_md5(string);
            }

            return this.raw_md5(string);
        }

        if (!raw) {
            return this.hex_hmac_md5(key, string);
        }

        return this.raw_hmac_md5(key, string);
    };

    // CommonJS module
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = Chance;
        }
        exports.Chance = Chance;
    }

    // Register as an anonymous AMD module
    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return Chance;
        });
    }

    // if there is a importsScrips object define chance for worker
    if (typeof importScripts !== 'undefined') {
        chance = new Chance();
    }

    // If there is a window object, that at least has a document property,
    // instantiate and define chance on the window
    if (typeof window === "object" && typeof window.document === "object") {
        window.Chance = Chance;
        window.chance = new Chance();
    }
})();

}).call(this,require("buffer").Buffer)
},{"buffer":6}],11:[function(require,module,exports){
// import
var Layer   = require('./layer')
,   Network = require('./network')
,   Trainer = require('./trainer')

/*******************************************************************************************
                                        ARCHITECT
*******************************************************************************************/

// Colection of useful built-in architectures
var Architect = {

  // Multilayer Perceptron
  Perceptron: function Perceptron() {

    var args = Array.prototype.slice.call(arguments); // convert arguments to Array
    if (args.length < 3)
      throw new Error("not enough layers (minimum 3) !!");

    var inputs = args.shift(); // first argument
    var outputs = args.pop(); // last argument
    var layers = args; // all the arguments in the middle

    var input = new Layer(inputs);
    var hidden = [];
    var output = new Layer(outputs);

    var previous = input;

    // generate hidden layers
    for (level in layers) {
      var size = layers[level];
      var layer = new Layer(size);
      hidden.push(layer);
      previous.project(layer);
      previous = layer;
    }
    previous.project(output);

    // set layers of the neural network
    this.set({
      input: input,
      hidden: hidden,
      output: output
    });

    // trainer for the network
    this.trainer = new Trainer(this);
  },

  // Multilayer Long Short-Term Memory
  LSTM: function LSTM() {

    var args = Array.prototype.slice.call(arguments); // convert arguments to array
    if (args.length < 3)
      throw new Error("not enough layers (minimum 3) !!");

    var last = args.pop();
    var option = {
      peepholes: Layer.connectionType.ALL_TO_ALL,
      hiddenToHidden: false,
      outputToHidden: false,
      outputToGates: false,
      inputToOutput: true,
    };
    if (typeof last != 'number') {
      var outputs = args.pop();
      if (last.hasOwnProperty('peepholes'))
        option.peepholes = last.peepholes;
      if (last.hasOwnProperty('hiddenToHidden'))
        option.hiddenToHidden = last.hiddenToHidden;
      if (last.hasOwnProperty('outputToHidden'))
        option.outputToHidden = last.outputToHidden;
      if (last.hasOwnProperty('outputToGates'))
        option.outputToGates = last.outputToGates;
      if (last.hasOwnProperty('inputToOutput'))
        option.inputToOutput = last.inputToOutput;
    } else
      var outputs = last;

    var inputs = args.shift();
    var layers = args;

    var inputLayer = new Layer(inputs);
    var hiddenLayers = [];
    var outputLayer = new Layer(outputs);

    var previous = null;

    // generate layers
    for (var layer in layers) {
      // generate memory blocks (memory cell and respective gates)
      var size = layers[layer];

      var inputGate = new Layer(size).set({
        bias: 1
      });
      var forgetGate = new Layer(size).set({
        bias: 1
      });
      var memoryCell = new Layer(size);
      var outputGate = new Layer(size).set({
        bias: 1
      });

      hiddenLayers.push(inputGate);
      hiddenLayers.push(forgetGate);
      hiddenLayers.push(memoryCell);
      hiddenLayers.push(outputGate);

      // connections from input layer
      var input = inputLayer.project(memoryCell);
      inputLayer.project(inputGate);
      inputLayer.project(forgetGate);
      inputLayer.project(outputGate);

      // connections from previous memory-block layer to this one
      if (previous != null) {
        var cell = previous.project(memoryCell);
        previous.project(inputGate);
        previous.project(forgetGate);
        previous.project(outputGate);
      }

      // connections from memory cell
      var output = memoryCell.project(outputLayer);

      // self-connection
      var self = memoryCell.project(memoryCell);

      // hidden to hidden recurrent connection
      if (option.hiddenToHidden)
        memoryCell.project(memoryCell, Layer.connectionType.ALL_TO_ELSE);

      // out to hidden recurrent connection
      if (option.outputToHidden)
        outputLayer.project(memoryCell);

      // out to gates recurrent connection
      if (option.outputToGates) {
        outputLayer.project(inputGate);
        outputLayer.project(outputGate);
        outputLayer.project(forgetGate);
      }

      // peepholes
      memoryCell.project(inputGate, option.peepholes);
      memoryCell.project(forgetGate, option.peepholes);
      memoryCell.project(outputGate, option.peepholes);

      // gates
      inputGate.gate(input, Layer.gateType.INPUT);
      forgetGate.gate(self, Layer.gateType.ONE_TO_ONE);
      outputGate.gate(output, Layer.gateType.OUTPUT);
      if (previous != null)
        inputGate.gate(cell, Layer.gateType.INPUT);

      previous = memoryCell;
    }

    // input to output direct connection
    if (option.inputToOutput)
      inputLayer.project(outputLayer);

    // set the layers of the neural network
    this.set({
      input: inputLayer,
      hidden: hiddenLayers,
      output: outputLayer
    });

    // trainer
    this.trainer = new Trainer(this);
  },

  // Liquid State Machine
  Liquid: function Liquid(inputs, hidden, outputs, connections, gates) {

    // create layers
    var inputLayer = new Layer(inputs);
    var hiddenLayer = new Layer(hidden);
    var outputLayer = new Layer(outputs);

    // make connections and gates randomly among the neurons
    var neurons = hiddenLayer.neurons();
    var connectionList = [];

    for (var i = 0; i < connections; i++) {
      // connect two random neurons
      var from = Math.random() * neurons.length | 0;
      var to = Math.random() * neurons.length | 0;
      var connection = neurons[from].project(neurons[to]);
      connectionList.push(connection);
    }

    for (var j = 0; j < gates; j++) {
      // pick a random gater neuron
      var gater = Math.random() * neurons.length | 0;
      // pick a random connection to gate
      var connection = Math.random() * connectionList.length | 0;
      // let the gater gate the connection
      neurons[gater].gate(connectionList[connection]);
    }

    // connect the layers
    inputLayer.project(hiddenLayer);
    hiddenLayer.project(outputLayer);

    // set the layers of the network
    this.set({
      input: inputLayer,
      hidden: [hiddenLayer],
      output: outputLayer
    });

    // trainer
    this.trainer = new Trainer(this);
  },

  Hopfield: function Hopfield(size)
  {
    var inputLayer = new Layer(size);
    var outputLayer = new Layer(size);

    inputLayer.project(outputLayer, Layer.connectionType.ALL_TO_ALL);

    this.set({
      input: inputLayer,
      hidden: [],
      output: outputLayer
    });

    var trainer = new Trainer(this);

    var proto = Architect.Hopfield.prototype;

    proto.learn = proto.learn || function(patterns)
    {
      var set = [];
      for (var p in patterns)
        set.push({
          input: patterns[p],
          output: patterns[p]
        });

      return trainer.train(set, {
        iterations: 500000,
        error: .00005,
        rate: 1
      });
    }

    proto.feed = proto.feed || function(pattern)
    {
      var output = this.activate(pattern);

      var pattern = [];
      for (var i in output)
        pattern[i] = output[i] > .5 ? 1 : 0;

      return pattern;
    }
  }
}

// Extend prototype chain (so every architectures is an instance of Network)
for (var architecture in Architect) {
  Architect[architecture].prototype = new Network();
  Architect[architecture].prototype.constructor = Architect[architecture];
}

// export
if (module) module.exports = Architect;
},{"./layer":12,"./network":13,"./trainer":16}],12:[function(require,module,exports){
// export
if (module) module.exports = Layer;

// import
var Neuron  = require('./neuron')
,   Network = require('./network')

/*******************************************************************************************
                                            LAYER
*******************************************************************************************/

function Layer(size, label) {
  this.size = size | 0;
  this.list = [];
  this.label = label || null;
  this.connectedTo = [];

  while (size--) {
    var neuron = new Neuron();
    this.list.push(neuron);
  }
}

Layer.prototype = {

  // activates all the neurons in the layer
  activate: function(input) {

    var activations = [];

    if (typeof input != 'undefined') {
      if (input.length != this.size)
        throw new Error("INPUT size and LAYER size must be the same to activate!");

      for (var id in this.list) {
        var neuron = this.list[id];
        var activation = neuron.activate(input[id]);
        activations.push(activation);
      }
    } else {
      for (var id in this.list) {
        var neuron = this.list[id];
        var activation = neuron.activate();
        activations.push(activation);
      }
    }
    return activations;
  },

  // propagates the error on all the neurons of the layer
  propagate: function(rate, target) {

    if (typeof target != 'undefined') {
      if (target.length != this.size)
        throw new Error("TARGET size and LAYER size must be the same to propagate!");

      for (var id = this.list.length - 1; id >= 0; id--) {
        var neuron = this.list[id];
        neuron.propagate(rate, target[id]);
      }
    } else {
      for (var id = this.list.length - 1; id >= 0; id--) {
        var neuron = this.list[id];
        neuron.propagate(rate);
      }
    }
  },

  // projects a connection from this layer to another one
  project: function(layer, type, weights) {

    if (layer instanceof Network)
      layer = layer.layers.input;

    if (layer instanceof Layer) {
      if (!this.connected(layer))
        return new Layer.connection(this, layer, type, weights);
    } else
      throw new Error("Invalid argument, you can only project connections to LAYERS and NETWORKS!");


  },

  // gates a connection betwenn two layers
  gate: function(connection, type) {

    if (type == Layer.gateType.INPUT) {
      if (connection.to.size != this.size)
        throw new Error("GATER layer and CONNECTION.TO layer must be the same size in order to gate!");

      for (var id in connection.to.list) {
        var neuron = connection.to.list[id];
        var gater = this.list[id];
        for (var input in neuron.connections.inputs) {
          var gated = neuron.connections.inputs[input];
          if (gated.ID in connection.connections)
            gater.gate(gated);
        }
      }
    } else if (type == Layer.gateType.OUTPUT) {
      if (connection.from.size != this.size)
        throw new Error("GATER layer and CONNECTION.FROM layer must be the same size in order to gate!");

      for (var id in connection.from.list) {
        var neuron = connection.from.list[id];
        var gater = this.list[id];
        for (var projected in neuron.connections.projected) {
          var gated = neuron.connections.projected[projected];
          if (gated.ID in connection.connections)
            gater.gate(gated);
        }
      }
    } else if (type == Layer.gateType.ONE_TO_ONE) {
      if (connection.size != this.size)
        throw new Error("The number of GATER UNITS must be the same as the number of CONNECTIONS to gate!");

      for (var id in connection.list) {
        var gater = this.list[id];
        var gated = connection.list[id];
        gater.gate(gated);
      }
    }
    connection.gatedfrom.push({layer: this, type: type});
  },

  // true or false whether the whole layer is self-connected or not
  selfconnected: function() {

    for (var id in this.list) {
      var neuron = this.list[id];
      if (!neuron.selfconnected())
        return false;
    }
    return true;
  },

  // true of false whether the layer is connected to another layer (parameter) or not
  connected: function(layer) {
    // Check if ALL to ALL connection
    var connections = 0;
    for (var here in this.list) {
      for (var there in layer.list) {
        var from = this.list[here];
        var to = layer.list[there];
        var connected = from.connected(to);
        if (connected.type == 'projected')
          connections++;
      }
    }
    if (connections == this.size * layer.size)
      return Layer.connectionType.ALL_TO_ALL;

    // Check if ONE to ONE connection
    connections = 0;
    for (var neuron in this.list) {
      var from = this.list[neuron];
      var to = layer.list[neuron];
      var connected = from.connected(to);
      if (connected.type == 'projected')
        connections++;
    }
    if (connections == this.size)
      return Layer.connectionType.ONE_TO_ONE;
  },

  // clears all the neuorns in the layer
  clear: function() {
    for (var id in this.list) {
      var neuron = this.list[id];
      neuron.clear();
    }
  },

  // resets all the neurons in the layer
  reset: function() {
    for (var id in this.list) {
      var neuron = this.list[id];
      neuron.reset();
    }
  },

  // returns all the neurons in the layer (array)
  neurons: function() {
    return this.list;
  },

  // adds a neuron to the layer
  add: function(neuron) {
    this.neurons[neuron.ID] = neuron || new Neuron();
    this.list.push(neuron);
    this.size++;
  },

  set: function(options) {
    options = options || {};

    for (var i in this.list) {
      var neuron = this.list[i];
      if (options.label)
        neuron.label = options.label + '_' + neuron.ID;
      if (options.squash)
        neuron.squash = options.squash;
      if (options.bias)
        neuron.bias = options.bias;
    }
    return this;
  }
}

// represents a connection from one layer to another, and keeps track of its weight and gain
Layer.connection = function LayerConnection(fromLayer, toLayer, type, weights) {
  this.ID = Layer.connection.uid();
  this.from = fromLayer;
  this.to = toLayer;
  this.selfconnection = toLayer == fromLayer;
  this.type = type;
  this.connections = {};
  this.list = [];
  this.size = 0;
  this.gatedfrom = [];

  if (typeof this.type == 'undefined')
  {
    if (fromLayer == toLayer)
      this.type = Layer.connectionType.ONE_TO_ONE;
    else
      this.type = Layer.connectionType.ALL_TO_ALL;
  }

  if (this.type == Layer.connectionType.ALL_TO_ALL ||
      this.type == Layer.connectionType.ALL_TO_ELSE) {
    for (var here in this.from.list) {
      for (var there in this.to.list) {
        var from = this.from.list[here];
        var to = this.to.list[there];
        if(this.type == Layer.connectionType.ALL_TO_ELSE && from == to)
          continue;
        var connection = from.project(to, weights);

        this.connections[connection.ID] = connection;
        this.size = this.list.push(connection);
      }
    }
  } else if (this.type == Layer.connectionType.ONE_TO_ONE) {

    for (var neuron in this.from.list) {
      var from = this.from.list[neuron];
      var to = this.to.list[neuron];
      var connection = from.project(to, weights);

      this.connections[connection.ID] = connection;
      this.size = this.list.push(connection);
    }
  }

  fromLayer.connectedTo.push(this);
}

// types of connections
Layer.connectionType = {};
Layer.connectionType.ALL_TO_ALL = "ALL TO ALL";
Layer.connectionType.ONE_TO_ONE = "ONE TO ONE";
Layer.connectionType.ALL_TO_ELSE = "ALL TO ELSE";

// types of gates
Layer.gateType = {};
Layer.gateType.INPUT = "INPUT";
Layer.gateType.OUTPUT = "OUTPUT";
Layer.gateType.ONE_TO_ONE = "ONE TO ONE";

(function() {
  var connections = 0;
  Layer.connection.uid = function() {
    return connections++;
  }
})();

},{"./network":13,"./neuron":14}],13:[function(require,module,exports){
// export
if (module) module.exports = Network;

// import
var Neuron  = require('./neuron')
,   Layer   = require('./layer')

/*******************************************************************************************
                                         NETWORK
*******************************************************************************************/

function Network(layers) {
  if (typeof layers != 'undefined') {
    this.layers = layers || {
      input: null,
      hidden: {},
      output: null
    };
    this.optimized = null;
  }
}
Network.prototype = {

  // feed-forward activation of all the layers to produce an ouput
  activate: function(input) {

    if (this.optimized === false)
    {
      this.layers.input.activate(input);
      for (var layer in this.layers.hidden)
        this.layers.hidden[layer].activate();
      return this.layers.output.activate();
    }
    else
    {
      if (this.optimized == null)
        this.optimize();
      return this.optimized.activate(input);
    }
  },

  // back-propagate the error thru the network
  propagate: function(rate, target) {

    if (this.optimized === false)
    {
      this.layers.output.propagate(rate, target);
      var reverse = [];
      for (var layer in this.layers.hidden)
        reverse.push(this.layers.hidden[layer]);
      reverse.reverse();
      for (var layer in reverse)
        reverse[layer].propagate(rate);
    }
    else
    {
      if (this.optimized == null)
        this.optimize();
      this.optimized.propagate(rate, target);
    }
  },

  // project a connection to another unit (either a network or a layer)
  project: function(unit, type, weights) {

    if (this.optimized)
      this.optimized.reset();

    if (unit instanceof Network)
      return this.layers.output.project(unit.layers.input, type, weights);

    if (unit instanceof Layer)
      return this.layers.output.project(unit, type, weights);

    throw new Error("Invalid argument, you can only project connections to LAYERS and NETWORKS!");
  },

  // let this network gate a connection
  gate: function(connection, type) {
    if (this.optimized)
      this.optimized.reset();
    this.layers.output.gate(connection, type);
  },

  // clear all elegibility traces and extended elegibility traces (the network forgets its context, but not what was trained)
  clear: function() {

    this.restore();

    var inputLayer = this.layers.input,
      outputLayer = this.layers.output;

    inputLayer.clear();
    for (var layer in this.layers.hidden) {
      var hiddenLayer = this.layers.hidden[layer];
      hiddenLayer.clear();
    }
    outputLayer.clear();

    if (this.optimized)
      this.optimized.reset();
  },

  // reset all weights and clear all traces (ends up like a new network)
  reset: function() {

    this.restore();

    var inputLayer = this.layers.input,
      outputLayer = this.layers.output;

    inputLayer.reset();
    for (var layer in this.layers.hidden) {
      var hiddenLayer = this.layers.hidden[layer];
      hiddenLayer.reset();
    }
    outputLayer.reset();

    if (this.optimized)
      this.optimized.reset();
  },

  // hardcodes the behaviour of the whole network into a single optimized function
  optimize: function() {

    var that = this;
    var optimized = {};
    var neurons = this.neurons();

    for (var i in neurons) {
      var neuron = neurons[i].neuron;
      var layer = neurons[i].layer;
      while (neuron.neuron)
        neuron = neuron.neuron;
      optimized = neuron.optimize(optimized, layer);
    }
    for (var i in optimized.propagation_sentences)
      optimized.propagation_sentences[i].reverse();
    optimized.propagation_sentences.reverse();

    var hardcode = "";
    hardcode += "var F = Float64Array ? new Float64Array(" + optimized.memory +
      ") : []; ";
    for (var i in optimized.variables)
      hardcode += "F[" + optimized.variables[i].id + "] = " + (optimized.variables[
        i].value || 0) + "; ";
    hardcode += "var activate = function(input){\n";
    for (var i in optimized.inputs)
      hardcode += "F[" + optimized.inputs[i] + "] = input[" + i + "]; ";
    for (var currentLayer in optimized.activation_sentences) {
      if (optimized.activation_sentences[currentLayer].length > 0) {
        for (var currentNeuron in optimized.activation_sentences[currentLayer]) {
          hardcode += optimized.activation_sentences[currentLayer][currentNeuron].join(" ");
          hardcode += optimized.trace_sentences[currentLayer][currentNeuron].join(" ");
        }
      }
    }
    hardcode += " var output = []; "
    for (var i in optimized.outputs)
      hardcode += "output[" + i + "] = F[" + optimized.outputs[i] + "]; ";
    hardcode += "return output; }; "
    hardcode += "var propagate = function(rate, target){\n";
    hardcode += "F[" + optimized.variables.rate.id + "] = rate; ";
    for (var i in optimized.targets)
      hardcode += "F[" + optimized.targets[i] + "] = target[" + i + "]; ";
    for (var currentLayer in optimized.propagation_sentences)
      for (var currentNeuron in optimized.propagation_sentences[currentLayer])
        hardcode += optimized.propagation_sentences[currentLayer][currentNeuron].join(" ") + " ";
    hardcode += " };\n";
    hardcode +=
      "var ownership = function(memoryBuffer){\nF = memoryBuffer;\nthis.memory = F;\n};\n";
    hardcode +=
      "return {\nmemory: F,\nactivate: activate,\npropagate: propagate,\nownership: ownership\n};";
    hardcode = hardcode.split(";").join(";\n");

    var constructor = new Function(hardcode);

    var network = constructor();
    network.data = {
      variables: optimized.variables,
      activate: optimized.activation_sentences,
      propagate: optimized.propagation_sentences,
      trace: optimized.trace_sentences,
      inputs: optimized.inputs,
      outputs: optimized.outputs,
      check_activation: this.activate,
      check_propagation: this.propagate
    }

    network.reset = function() {
      if (that.optimized) {
        that.optimized = null;
        that.activate = network.data.check_activation;
        that.propagate = network.data.check_propagation;
      }
    }

    this.optimized = network;
    this.activate = network.activate;
    this.propagate = network.propagate;
  },

  // restores all the values from the optimized network the their respective objects in order to manipulate the network
  restore: function() {
    if (!this.optimized)
      return;

    var optimized = this.optimized;

    var getValue = function() {
      var args = Array.prototype.slice.call(arguments);

      var unit = args.shift();
      var prop = args.pop();

      var id = prop + '_';
      for (var property in args)
        id += args[property] + '_';
      id += unit.ID;

      var memory = optimized.memory;
      var variables = optimized.data.variables;

      if (id in variables)
        return memory[variables[id].id];
      return 0;
    }

    var list = this.neurons();

    // link id's to positions in the array
    var ids = {};
    for (var i in list) {
      var neuron = list[i].neuron;
      while (neuron.neuron)
        neuron = neuron.neuron;

      neuron.state = getValue(neuron, 'state');
      neuron.old = getValue(neuron, 'old');
      neuron.activation = getValue(neuron, 'activation');
      neuron.bias = getValue(neuron, 'bias');

      for (var input in neuron.trace.elegibility)
        neuron.trace.elegibility[input] = getValue(neuron, 'trace',
          'elegibility', input);

      for (var gated in neuron.trace.extended)
        for (var input in neuron.trace.extended[gated])
          neuron.trace.extended[gated][input] = getValue(neuron, 'trace',
            'extended', gated, input);
    }

    // get connections
    for (var i in list) {
      var neuron = list[i].neuron;
      while (neuron.neuron)
        neuron = neuron.neuron;

      for (var j in neuron.connections.projected) {
        var connection = neuron.connections.projected[j];
        connection.weight = getValue(connection, 'weight');
        connection.gain = getValue(connection, 'gain');
      }
    }
  },

  // returns all the neurons in the network
  neurons: function() {

    var neurons = [];

    var inputLayer = this.layers.input.neurons(),
      outputLayer = this.layers.output.neurons();

    for (var neuron in inputLayer)
      neurons.push({
        neuron: inputLayer[neuron],
        layer: 'input'
      });

    for (var layer in this.layers.hidden) {
      var hiddenLayer = this.layers.hidden[layer].neurons();
      for (var neuron in hiddenLayer)
        neurons.push({
          neuron: hiddenLayer[neuron],
          layer: layer
        });
    }
    for (var neuron in outputLayer)
      neurons.push({
        neuron: outputLayer[neuron],
        layer: 'output'
      });

    return neurons;
  },

  // returns number of inputs of the network
  inputs: function() {
    return this.layers.input.size;
  },

  // returns number of outputs of hte network
  outputs: function() {
    return this.layers.output.size;
  },

  // sets the layers of the network
  set: function(layers) {

    this.layers = layers;
    if (this.optimized)
      this.optimized.reset();
  },

  setOptimize: function(bool){
    this.restore();
    if (this.optimized)
      this.optimized.reset();
    this.optimized = bool? null : false;
  },

  // returns a json that represents all the neurons and connections of the network
  toJSON: function(ignoreTraces) {

    this.restore();

    var list = this.neurons();
    var neurons = [];
    var connections = [];

    // link id's to positions in the array
    var ids = {};
    for (var i in list) {
      var neuron = list[i].neuron;
      while (neuron.neuron)
        neuron = neuron.neuron;
      ids[neuron.ID] = i;

      var copy = {
        trace: {
          elegibility: {},
          extended: {}
        },
        state: neuron.state,
        old: neuron.old,
        activation: neuron.activation,
        bias: neuron.bias,
        layer: list[i].layer
      };

      copy.squash = neuron.squash == Neuron.squash.LOGISTIC ? "LOGISTIC" :
        neuron.squash == Neuron.squash.TANH ? "TANH" :
        neuron.squash == Neuron.squash.IDENTITY ? "IDENTITY" :
        neuron.squash == Neuron.squash.HLIM ? "HLIM" :
        null;

      neurons.push(copy);
    }

    // get connections
    for (var i in list) {
      var neuron = list[i].neuron;
      while (neuron.neuron)
        neuron = neuron.neuron;

      for (var j in neuron.connections.projected) {
        var connection = neuron.connections.projected[j];
        connections.push({
          from: ids[connection.from.ID],
          to: ids[connection.to.ID],
          weight: connection.weight,
          gater: connection.gater ? ids[connection.gater.ID] : null,
        });
      }
      if (neuron.selfconnected())
        connections.push({
          from: ids[neuron.ID],
          to: ids[neuron.ID],
          weight: neuron.selfconnection.weight,
          gater: neuron.selfconnection.gater ? ids[neuron.selfconnection.gater.ID] : null,
        });
    }

    return {
      neurons: neurons,
      connections: connections
    }
  },

  // export the topology into dot language which can be visualized as graphs using dot
  /* example: ... console.log(net.toDotLang());
              $ node example.js > example.dot
              $ dot example.dot -Tpng > out.png
  */
  toDot: function(edgeConnection) {
    if (! typeof edgeConnection)
      edgeConnection = false;
    var code = "digraph nn {\n    rankdir = BT\n";
    var layers = [this.layers.input].concat(this.layers.hidden, this.layers.output);
    for (var layer in layers) {
      for (var to in layers[layer].connectedTo) { // projections
        var connection = layers[layer].connectedTo[to];
        var layerTo = connection.to;
        var size = connection.size;
        var layerID = layers.indexOf(layers[layer]);
        var layerToID = layers.indexOf(layerTo);
        /* http://stackoverflow.com/questions/26845540/connect-edges-with-graph-dot
         * DOT does not support edge-to-edge connections
         * This workaround produces somewhat weird graphs ...
        */
        if ( edgeConnection) {
          if (connection.gatedfrom.length) {
            var fakeNode = "fake" + layerID + "_" + layerToID;
            code += "    " + fakeNode +
              " [label = \"\", shape = point, width = 0.01, height = 0.01]\n";
            code += "    " + layerID + " -> " + fakeNode + " [label = " + size + ", arrowhead = none]\n";
            code += "    " + fakeNode + " -> " + layerToID + "\n";
          } else
            code += "    " + layerID + " -> " + layerToID + " [label = " + size + "]\n";
          for (var from in connection.gatedfrom) { // gatings
            var layerfrom = connection.gatedfrom[from].layer;
            var type = connection.gatedfrom[from].type;
            var layerfromID = layers.indexOf(layerfrom);
            code += "    " + layerfromID + " -> " + fakeNode + " [color = blue]\n";
          }
        } else {
          code += "    " + layerID + " -> " + layerToID + " [label = " + size + "]\n";
          for (var from in connection.gatedfrom) { // gatings
            var layerfrom = connection.gatedfrom[from].layer;
            var type = connection.gatedfrom[from].type;
            var layerfromID = layers.indexOf(layerfrom);
            code += "    " + layerfromID + " -> " + layerToID + " [color = blue]\n";
          }
        }
      }
    }
    code += "}\n";
    return {
      code: code,
      link: "https://chart.googleapis.com/chart?chl=" + escape(code.replace("/ /g", "+")) + "&cht=gv"
    }
  },

  // returns a function that works as the activation of the network and can be used without depending on the library
  standalone: function() {
    if (!this.optimized)
      this.optimize();

    var data = this.optimized.data;

    // build activation function
    var activation = "function (input) {\n";

    // build inputs
    for (var i in data.inputs)
      activation += "F[" + data.inputs[i] + "] = input[" + i + "];\n";

    // build network activation
    for (var neuron in data.activate) { // shouldn't this be layer?
      for (var sentence in data.activate[neuron])
        activation += data.activate[neuron][sentence] + "\n";
    }

    // build outputs
    activation += "var output = [];\n";
    for (var i in data.outputs)
      activation += "output[" + i + "] = F[" + data.outputs[i] + "];\n";
    activation += "return output;\n}";

    // reference all the positions in memory
    var memory = activation.match(/F\[(\d+)\]/g);
    var dimension = 0;
    var ids = {};
    for (var address in memory) {
      var tmp = memory[address].match(/\d+/)[0];
      if (!(tmp in ids)) {
        ids[tmp] = dimension++;
      }
    }
    var hardcode = "F = {\n";
    for (var i in ids)
      hardcode += ids[i] + ": " + this.optimized.memory[i] + ",\n";
    hardcode = hardcode.substring(0, hardcode.length - 2) + "\n};\n";
    hardcode = "var run = " + activation.replace(/F\[(\d+)]/g, function(
      index) {
      return 'F[' + ids[index.match(/\d+/)[0]] + ']'
    }).replace("{\n", "{\n" + hardcode + "") + ";\n";
    hardcode += "return run";

    // return standalone function
    return new Function(hardcode)();
  },

  worker: function() {
    if (!this.optimized)
      this.optimize();

    var hardcode = "var inputs = " + this.optimized.data.inputs.length +
      ";\n";
    hardcode += "var outputs = " + this.optimized.data.outputs.length +
      ";\n";
    hardcode += "var F = null;\n";
    hardcode += "var activate = " + this.optimized.activate.toString() +
      ";\n";
    hardcode += "var propagate = " + this.optimized.propagate.toString() +
      ";\n";
    hardcode += "onmessage = function(e){\n";
    hardcode += "F = e.data.memoryBuffer;\n";
    hardcode += "if (e.data.action == 'activate'){\n";
    hardcode += "if (e.data.input.length == inputs){\n";
    hardcode +=
      "postMessage( { action: 'activate', output: activate(e.data.input), memoryBuffer: F }, [F.buffer]);\n";
    hardcode += "}\n}\nelse if (e.data.action == 'propagate'){\n";
    hardcode += "propagate(e.data.rate, e.data.target);\n";
    hardcode +=
      "postMessage({ action: 'propagate', memoryBuffer: F }, [F.buffer]);\n";
    hardcode += "}\n}\n";

    var blob = new Blob([hardcode]);
    var blobURL = window.URL.createObjectURL(blob);

    return new Worker(blobURL);
  },

  // returns a copy of the network
  clone: function() {
    return Network.fromJSON(this.toJSON());
  }
}

// rebuild a network that has been stored in a json using the method toJSON()
Network.fromJSON = function(json) {

  var neurons = [];

  var layers = {
    input: new Layer(),
    hidden: [],
    output: new Layer()
  }

  for (var i in json.neurons) {
    var config = json.neurons[i];

    var neuron = new Neuron();
    neuron.trace.elegibility = {};
    neuron.trace.extended = {};
    neuron.state = config.state;
    neuron.old = config.old;
    neuron.activation = config.activation;
    neuron.bias = config.bias;
    neuron.squash = config.squash in Neuron.squash ? Neuron.squash[config.squash] : Neuron.squash.LOGISTIC;
    neurons.push(neuron);

    if (config.layer == 'input')
      layers.input.add(neuron);
    else if (config.layer == 'output')
      layers.output.add(neuron);
    else {
      if (typeof layers.hidden[config.layer] == 'undefined')
        layers.hidden[config.layer] = new Layer();
      layers.hidden[config.layer].add(neuron);
    }
  }

  for (var i in json.connections) {
    var config = json.connections[i];
    var from = neurons[config.from];
    var to = neurons[config.to];
    var weight = config.weight
    var gater = neurons[config.gater];

    var connection = from.project(to, weight);
    if (gater)
      gater.gate(connection);
  }

  return new Network(layers);
}

},{"./layer":12,"./neuron":14}],14:[function(require,module,exports){
// export
if (module) module.exports = Neuron;

/******************************************************************************************
                                         NEURON
*******************************************************************************************/

function Neuron() {
  this.ID = Neuron.uid();
  this.label = null;
  this.connections = {
    inputs: {},
    projected: {},
    gated: {}
  };
  this.error = {
    responsibility: 0,
    projected: 0,
    gated: 0
  };
  this.trace = {
    elegibility: {},
    extended: {},
    influences: {}
  };
  this.state = 0;
  this.old = 0;
  this.activation = 0;
  this.selfconnection = new Neuron.connection(this, this, 0); // weight = 0 -> not connected
  this.squash = Neuron.squash.LOGISTIC;
  this.neighboors = {};
  this.bias = Math.random() * .2 - .1;
}

Neuron.prototype = {

  // activate the neuron
  activate: function(input) {
    // activation from enviroment (for input neurons)
    if (typeof input != 'undefined') {
      this.activation = input;
      this.derivative = 0;
      this.bias = 0;
      return this.activation;
    }

    // old state
    this.old = this.state;

    // eq. 15
    this.state = this.selfconnection.gain * this.selfconnection.weight *
      this.state + this.bias;

    for (var i in this.connections.inputs) {
      var input = this.connections.inputs[i];
      this.state += input.from.activation * input.weight * input.gain;
    }

    // eq. 16
    this.activation = this.squash(this.state);

    // f'(s)
    this.derivative = this.squash(this.state, true);

    // update traces
    var influences = [];
    for (var id in this.trace.extended) {
      // extended elegibility trace
      var xtrace = this.trace.extended[id];
      var neuron = this.neighboors[id];

      // if gated neuron's selfconnection is gated by this unit, the influence keeps track of the neuron's old state
      var influence = neuron.selfconnection.gater == this ? neuron.old : 0;

      // index runs over all the incoming connections to the gated neuron that are gated by this unit
      for (var incoming in this.trace.influences[neuron.ID]) { // captures the effect that has an input connection to this unit, on a neuron that is gated by this unit
        influence += this.trace.influences[neuron.ID][incoming].weight *
          this.trace.influences[neuron.ID][incoming].from.activation;
      }
      influences[neuron.ID] = influence;
    }

    for (var i in this.connections.inputs) {
      var input = this.connections.inputs[i];

      // elegibility trace - Eq. 17
      this.trace.elegibility[input.ID] = this.selfconnection.gain * this.selfconnection
        .weight * this.trace.elegibility[input.ID] + input.gain * input.from
        .activation;

      for (var id in this.trace.extended) {
        // extended elegibility trace
        var xtrace = this.trace.extended[id];
        var neuron = this.neighboors[id];
        var influence = influences[neuron.ID];

        // eq. 18
        xtrace[input.ID] = neuron.selfconnection.gain * neuron.selfconnection
          .weight * xtrace[input.ID] + this.derivative * this.trace.elegibility[
            input.ID] * influence;
      }
    }

    //  update gated connection's gains
    for (var connection in this.connections.gated) {
      this.connections.gated[connection].gain = this.activation;
    }

    return this.activation;
  },

  // back-propagate the error
  propagate: function(rate, target) {
    // error accumulator
    var error = 0;

    // whether or not this neuron is in the output layer
    var isOutput = typeof target != 'undefined';

    // output neurons get their error from the enviroment
    if (isOutput)
      this.error.responsibility = this.error.projected = target - this.activation; // Eq. 10

    else // the rest of the neuron compute their error responsibilities by backpropagation
    {
      // error responsibilities from all the connections projected from this neuron
      for (var id in this.connections.projected) {
        var connection = this.connections.projected[id];
        var neuron = connection.to;
        // Eq. 21
        error += neuron.error.responsibility * connection.gain * connection.weight;
      }

      // projected error responsibility
      this.error.projected = this.derivative * error;

      error = 0;
      // error responsibilities from all the connections gated by this neuron
      for (var id in this.trace.extended) {
        var neuron = this.neighboors[id]; // gated neuron
        var influence = neuron.selfconnection.gater == this ? neuron.old : 0; // if gated neuron's selfconnection is gated by this neuron

        // index runs over all the connections to the gated neuron that are gated by this neuron
        for (var input in this.trace.influences[id]) { // captures the effect that the input connection of this neuron have, on a neuron which its input/s is/are gated by this neuron
          influence += this.trace.influences[id][input].weight * this.trace.influences[
            neuron.ID][input].from.activation;
        }
        // eq. 22
        error += neuron.error.responsibility * influence;
      }

      // gated error responsibility
      this.error.gated = this.derivative * error;

      // error responsibility - Eq. 23
      this.error.responsibility = this.error.projected + this.error.gated;
    }

    // learning rate
    rate = rate || .1;

    // adjust all the neuron's incoming connections
    for (var id in this.connections.inputs) {
      var input = this.connections.inputs[id];

      // Eq. 24
      var gradient = this.error.projected * this.trace.elegibility[input.ID];
      for (var id in this.trace.extended) {
        var neuron = this.neighboors[id];
        gradient += neuron.error.responsibility * this.trace.extended[
          neuron.ID][input.ID];
      }
      input.weight += rate * gradient; // adjust weights - aka learn
    }

    // adjust bias
    this.bias += rate * this.error.responsibility;
  },

  project: function(neuron, weight) {
    // self-connection
    if (neuron == this) {
      this.selfconnection.weight = 1;
      return this.selfconnection;
    }

    // check if connection already exists
    var connected = this.connected(neuron);
    if (connected && connected.type == "projected") {
      // update connection
      if (typeof weight != 'undefined')
        connected.connection.weight = weight;
      // return existing connection
      return connected.connection;
    } else {
      // create a new connection
      var connection = new Neuron.connection(this, neuron, weight);
    }

    // reference all the connections and traces
    this.connections.projected[connection.ID] = connection;
    this.neighboors[neuron.ID] = neuron;
    neuron.connections.inputs[connection.ID] = connection;
    neuron.trace.elegibility[connection.ID] = 0;

    for (var id in neuron.trace.extended) {
      var trace = neuron.trace.extended[id];
      trace[connection.ID] = 0;
    }

    return connection;
  },

  gate: function(connection) {
    // add connection to gated list
    this.connections.gated[connection.ID] = connection;

    var neuron = connection.to;
    if (!(neuron.ID in this.trace.extended)) {
      // extended trace
      this.neighboors[neuron.ID] = neuron;
      var xtrace = this.trace.extended[neuron.ID] = {};
      for (var id in this.connections.inputs) {
        var input = this.connections.inputs[id];
        xtrace[input.ID] = 0;
      }
    }

    // keep track
    if (neuron.ID in this.trace.influences)
      this.trace.influences[neuron.ID].push(connection);
    else
      this.trace.influences[neuron.ID] = [connection];

    // set gater
    connection.gater = this;
  },

  // returns true or false whether the neuron is self-connected or not
  selfconnected: function() {
    return this.selfconnection.weight !== 0;
  },

  // returns true or false whether the neuron is connected to another neuron (parameter)
  connected: function(neuron) {
    var result = {
      type: null,
      connection: false
    };

    if (this == neuron) {
      if (this.selfconnected()) {
        result.type = 'selfconnection';
        result.connection = this.selfconnection;
        return result;
      } else
        return false;
    }

    for (var type in this.connections) {
      for (var connection in this.connections[type]) {
        var connection = this.connections[type][connection];
        if (connection.to == neuron) {
          result.type = type;
          result.connection = connection;
          return result;
        } else if (connection.from == neuron) {
          result.type = type;
          result.connection = connection;
          return result;
        }
      }
    }

    return false;
  },

  // clears all the traces (the neuron forgets it's context, but the connections remain intact)
  clear: function() {

    for (var trace in this.trace.elegibility)
      this.trace.elegibility[trace] = 0;

    for (var trace in this.trace.extended)
      for (var extended in this.trace.extended[trace])
        this.trace.extended[trace][extended] = 0;

    this.error.responsibility = this.error.projected = this.error.gated = 0;
  },

  // all the connections are randomized and the traces are cleared
  reset: function() {
    this.clear();

    for (var type in this.connections)
      for (var connection in this.connections[type])
        this.connections[type][connection].weight = Math.random() * .2 - .1;
    this.bias = Math.random() * .2 - .1;

    this.old = this.state = this.activation = 0;
  },

  // hardcodes the behaviour of the neuron into an optimized function
  optimize: function(optimized, layer) {

    optimized = optimized || {};
    var that = this;
    var store_activation = [];
    var store_trace = [];
    var store_propagation = [];
    var varID = optimized.memory || 0;
    var neurons = optimized.neurons || 1;
    var inputs = optimized.inputs || [];
    var targets = optimized.targets || [];
    var outputs = optimized.outputs || [];
    var variables = optimized.variables || {};
    var activation_sentences = optimized.activation_sentences || [];
    var trace_sentences = optimized.trace_sentences || [];
    var propagation_sentences = optimized.propagation_sentences || [];
    var layers = optimized.layers || { __count: 0, __neuron: 0 };

    // allocate sentences
    var allocate = function(store){
      var allocated = layer in layers && store[layers.__count];
      if (!allocated)
      {
        layers.__count = store.push([]) - 1;
        layers[layer] = layers.__count;
      }
    }
    allocate(activation_sentences);
    allocate(trace_sentences);
    allocate(propagation_sentences);
    var currentLayer = layers.__count;

    // get/reserve space in memory by creating a unique ID for a variablel
    var getVar = function() {
      var args = Array.prototype.slice.call(arguments);

      if (args.length == 1) {
        if (args[0] == 'target') {
          var id = 'target_' + targets.length;
          targets.push(varID);
        } else
          var id = args[0];
        if (id in variables)
          return variables[id];
        return variables[id] = {
          value: 0,
          id: varID++
        };
      } else {
        var extended = args.length > 2;
        if (extended)
          var value = args.pop();

        var unit = args.shift();
        var prop = args.pop();

        if (!extended)
          var value = unit[prop];

        var id = prop + '_';
        for (var property in args)
          id += args[property] + '_';
        id += unit.ID;
        if (id in variables)
          return variables[id];

        return variables[id] = {
          value: value,
          id: varID++
        };
      }
    };

    // build sentence
    var buildSentence = function() {
      var args = Array.prototype.slice.call(arguments);
      var store = args.pop();
      var sentence = "";
      for (var i in args)
        if (typeof args[i] == 'string')
          sentence += args[i];
        else
          sentence += 'F[' + args[i].id + ']';

      store.push(sentence + ';');
    }

    // helper to check if an object is empty
    var isEmpty = function(obj) {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop))
          return false;
      }
      return true;
    };

    // characteristics of the neuron
    var noProjections = isEmpty(this.connections.projected);
    var noGates = isEmpty(this.connections.gated);
    var isInput = layer == 'input' ? true : isEmpty(this.connections.inputs);
    var isOutput = layer == 'output' ? true : noProjections && noGates;

    // optimize neuron's behaviour
    var rate = getVar('rate');
    var activation = getVar(this, 'activation');
    if (isInput)
      inputs.push(activation.id);
    else {
      activation_sentences[currentLayer].push(store_activation);
      trace_sentences[currentLayer].push(store_trace);
      propagation_sentences[currentLayer].push(store_propagation);
      var old = getVar(this, 'old');
      var state = getVar(this, 'state');
      var bias = getVar(this, 'bias');
      if (this.selfconnection.gater)
        var self_gain = getVar(this.selfconnection, 'gain');
      if (this.selfconnected())
        var self_weight = getVar(this.selfconnection, 'weight');
      buildSentence(old, ' = ', state, store_activation);
      if (this.selfconnected())
        if (this.selfconnection.gater)
          buildSentence(state, ' = ', self_gain, ' * ', self_weight, ' * ',
            state, ' + ', bias, store_activation);
        else
          buildSentence(state, ' = ', self_weight, ' * ', state, ' + ',
            bias, store_activation);
      else
        buildSentence(state, ' = ', bias, store_activation);
      for (var i in this.connections.inputs) {
        var input = this.connections.inputs[i];
        var input_activation = getVar(input.from, 'activation');
        var input_weight = getVar(input, 'weight');
        if (input.gater)
          var input_gain = getVar(input, 'gain');
        if (this.connections.inputs[i].gater)
          buildSentence(state, ' += ', input_activation, ' * ',
            input_weight, ' * ', input_gain, store_activation);
        else
          buildSentence(state, ' += ', input_activation, ' * ',
            input_weight, store_activation);
      }
      var derivative = getVar(this, 'derivative');
      switch (this.squash) {
        case Neuron.squash.LOGISTIC:
          buildSentence(activation, ' = (1 / (1 + Math.exp(-', state, ')))',
            store_activation);
          buildSentence(derivative, ' = ', activation, ' * (1 - ',
            activation, ')', store_activation);
          break;
        case Neuron.squash.TANH:
          var eP = getVar('aux');
          var eN = getVar('aux_2');
          buildSentence(eP, ' = Math.exp(', state, ')', store_activation);
          buildSentence(eN, ' = 1 / ', eP, store_activation);
          buildSentence(activation, ' = (', eP, ' - ', eN, ') / (', eP, ' + ', eN, ')', store_activation);
          buildSentence(derivative, ' = 1 - (', activation, ' * ', activation, ')', store_activation);
          break;
        case Neuron.squash.IDENTITY:
          buildSentence(activation, ' = ', state, store_activation);
          buildSentence(derivative, ' = 1', store_activation);
          break;
        case Neuron.squash.HLIM:
          buildSentence(activation, ' = +(', state, ' > 0)', store_activation);
          buildSentence(derivative, ' = 1', store_activation);
        case Neuron.squash.RELU:
          buildSentence(activation, ' = ', state, ' > 0 ? ', state, ' : 0', store_activation);
          buildSentence(derivative, ' = ', state, ' > 0 ? 1 : 0', store_activation);
          break;
      }

      for (var id in this.trace.extended) {
        // calculate extended elegibility traces in advance

        var xtrace = this.trace.extended[id];
        var neuron = this.neighboors[id];
        var influence = getVar('influences[' + neuron.ID + ']');
        var neuron_old = getVar(neuron, 'old');
        var initialized = false;
        if (neuron.selfconnection.gater == this)
        {
          buildSentence(influence, ' = ', neuron_old, store_trace);
          initialized = true;
        }
        for (var incoming in this.trace.influences[neuron.ID]) {
          var incoming_weight = getVar(this.trace.influences[neuron.ID]
            [incoming], 'weight');
          var incoming_activation = getVar(this.trace.influences[neuron.ID]
            [incoming].from, 'activation');

          if (initialized)
            buildSentence(influence, ' += ', incoming_weight, ' * ', incoming_activation, store_trace);
          else {
            buildSentence(influence, ' = ', incoming_weight, ' * ', incoming_activation, store_trace);
            initialized = true;
          }
        }
      }

      for (var i in this.connections.inputs) {
        var input = this.connections.inputs[i];
        if (input.gater)
          var input_gain = getVar(input, 'gain');
        var input_activation = getVar(input.from, 'activation');
        var trace = getVar(this, 'trace', 'elegibility', input.ID, this.trace
          .elegibility[input.ID]);
        if (this.selfconnected()) {
          if (this.selfconnection.gater) {
            if (input.gater)
              buildSentence(trace, ' = ', self_gain, ' * ', self_weight,
                ' * ', trace, ' + ', input_gain, ' * ', input_activation,
                store_trace);
            else
              buildSentence(trace, ' = ', self_gain, ' * ', self_weight,
                ' * ', trace, ' + ', input_activation, store_trace);
          } else {
            if (input.gater)
              buildSentence(trace, ' = ', self_weight, ' * ', trace, ' + ',
                input_gain, ' * ', input_activation, store_trace);
            else
              buildSentence(trace, ' = ', self_weight, ' * ', trace, ' + ',
                input_activation, store_trace);
          }
        } else {
          if (input.gater)
            buildSentence(trace, ' = ', input_gain, ' * ', input_activation,
              store_trace);
          else
            buildSentence(trace, ' = ', input_activation, store_trace);
        }
        for (var id in this.trace.extended) {
          // extended elegibility trace
          var xtrace = this.trace.extended[id];
          var neuron = this.neighboors[id];
          var influence = getVar('influences[' + neuron.ID + ']');
          var neuron_old = getVar(neuron, 'old');

          var trace = getVar(this, 'trace', 'elegibility', input.ID, this.trace
            .elegibility[input.ID]);
          var xtrace = getVar(this, 'trace', 'extended', neuron.ID, input.ID,
            this.trace.extended[neuron.ID][input.ID]);
          if (neuron.selfconnected())
            var neuron_self_weight = getVar(neuron.selfconnection, 'weight');
          if (neuron.selfconnection.gater)
            var neuron_self_gain = getVar(neuron.selfconnection, 'gain');
          if (neuron.selfconnected())
            if (neuron.selfconnection.gater)
              buildSentence(xtrace, ' = ', neuron_self_gain, ' * ',
                neuron_self_weight, ' * ', xtrace, ' + ', derivative, ' * ',
                trace, ' * ', influence, store_trace);
            else
              buildSentence(xtrace, ' = ', neuron_self_weight, ' * ',
                xtrace, ' + ', derivative, ' * ', trace, ' * ',
                influence, store_trace);
          else
            buildSentence(xtrace, ' = ', derivative, ' * ', trace, ' * ',
              influence, store_trace);
        }
      }
      for (var connection in this.connections.gated) {
        var gated_gain = getVar(this.connections.gated[connection], 'gain');
        buildSentence(gated_gain, ' = ', activation, store_activation);
      }
    }
    if (!isInput) {
      var responsibility = getVar(this, 'error', 'responsibility', this.error
        .responsibility);
      if (isOutput) {
        var target = getVar('target');
        buildSentence(responsibility, ' = ', target, ' - ', activation,
          store_propagation);
        for (var id in this.connections.inputs) {
          var input = this.connections.inputs[id];
          var trace = getVar(this, 'trace', 'elegibility', input.ID, this.trace
            .elegibility[input.ID]);
          var input_weight = getVar(input, 'weight');
          buildSentence(input_weight, ' += ', rate, ' * (', responsibility,
            ' * ', trace, ')', store_propagation);
        }
        outputs.push(activation.id);
      } else {
        if (!noProjections && !noGates) {
          var error = getVar('aux');
          for (var id in this.connections.projected) {
            var connection = this.connections.projected[id];
            var neuron = connection.to;
            var connection_weight = getVar(connection, 'weight');
            var neuron_responsibility = getVar(neuron, 'error',
              'responsibility', neuron.error.responsibility);
            if (connection.gater) {
              var connection_gain = getVar(connection, 'gain');
              buildSentence(error, ' += ', neuron_responsibility, ' * ',
                connection_gain, ' * ', connection_weight,
                store_propagation);
            } else
              buildSentence(error, ' += ', neuron_responsibility, ' * ',
                connection_weight, store_propagation);
          }
          var projected = getVar(this, 'error', 'projected', this.error.projected);
          buildSentence(projected, ' = ', derivative, ' * ', error,
            store_propagation);
          buildSentence(error, ' = 0', store_propagation);
          for (var id in this.trace.extended) {
            var neuron = this.neighboors[id];
            var influence = getVar('aux_2');
            var neuron_old = getVar(neuron, 'old');
            if (neuron.selfconnection.gater == this)
              buildSentence(influence, ' = ', neuron_old, store_propagation);
            else
              buildSentence(influence, ' = 0', store_propagation);
            for (var input in this.trace.influences[neuron.ID]) {
              var connection = this.trace.influences[neuron.ID][input];
              var connection_weight = getVar(connection, 'weight');
              var neuron_activation = getVar(connection.from, 'activation');
              buildSentence(influence, ' += ', connection_weight, ' * ',
                neuron_activation, store_propagation);
            }
            var neuron_responsibility = getVar(neuron, 'error',
              'responsibility', neuron.error.responsibility);
            buildSentence(error, ' += ', neuron_responsibility, ' * ',
              influence, store_propagation);
          }
          var gated = getVar(this, 'error', 'gated', this.error.gated);
          buildSentence(gated, ' = ', derivative, ' * ', error,
            store_propagation);
          buildSentence(responsibility, ' = ', projected, ' + ', gated,
            store_propagation);
          for (var id in this.connections.inputs) {
            var input = this.connections.inputs[id];
            var gradient = getVar('aux');
            var trace = getVar(this, 'trace', 'elegibility', input.ID, this
              .trace.elegibility[input.ID]);
            buildSentence(gradient, ' = ', projected, ' * ', trace,
              store_propagation);
            for (var id in this.trace.extended) {
              var neuron = this.neighboors[id];
              var neuron_responsibility = getVar(neuron, 'error',
                'responsibility', neuron.error.responsibility);
              var xtrace = getVar(this, 'trace', 'extended', neuron.ID,
                input.ID, this.trace.extended[neuron.ID][input.ID]);
              buildSentence(gradient, ' += ', neuron_responsibility, ' * ',
                xtrace, store_propagation);
            }
            var input_weight = getVar(input, 'weight');
            buildSentence(input_weight, ' += ', rate, ' * ', gradient,
              store_propagation);
          }

        } else if (noGates) {
          buildSentence(responsibility, ' = 0', store_propagation);
          for (var id in this.connections.projected) {
            var connection = this.connections.projected[id];
            var neuron = connection.to;
            var connection_weight = getVar(connection, 'weight');
            var neuron_responsibility = getVar(neuron, 'error',
              'responsibility', neuron.error.responsibility);
            if (connection.gater) {
              var connection_gain = getVar(connection, 'gain');
              buildSentence(responsibility, ' += ', neuron_responsibility,
                ' * ', connection_gain, ' * ', connection_weight,
                store_propagation);
            } else
              buildSentence(responsibility, ' += ', neuron_responsibility,
                ' * ', connection_weight, store_propagation);
          }
          buildSentence(responsibility, ' *= ', derivative,
            store_propagation);
          for (var id in this.connections.inputs) {
            var input = this.connections.inputs[id];
            var trace = getVar(this, 'trace', 'elegibility', input.ID, this
              .trace.elegibility[input.ID]);
            var input_weight = getVar(input, 'weight');
            buildSentence(input_weight, ' += ', rate, ' * (',
              responsibility, ' * ', trace, ')', store_propagation);
          }
        } else if (noProjections) {
          buildSentence(responsibility, ' = 0', store_propagation);
          for (var id in this.trace.extended) {
            var neuron = this.neighboors[id];
            var influence = getVar('aux');
            var neuron_old = getVar(neuron, 'old');
            if (neuron.selfconnection.gater == this)
              buildSentence(influence, ' = ', neuron_old, store_propagation);
            else
              buildSentence(influence, ' = 0', store_propagation);
            for (var input in this.trace.influences[neuron.ID]) {
              var connection = this.trace.influences[neuron.ID][input];
              var connection_weight = getVar(connection, 'weight');
              var neuron_activation = getVar(connection.from, 'activation');
              buildSentence(influence, ' += ', connection_weight, ' * ',
                neuron_activation, store_propagation);
            }
            var neuron_responsibility = getVar(neuron, 'error',
              'responsibility', neuron.error.responsibility);
            buildSentence(responsibility, ' += ', neuron_responsibility,
              ' * ', influence, store_propagation);
          }
          buildSentence(responsibility, ' *= ', derivative,
            store_propagation);
          for (var id in this.connections.inputs) {
            var input = this.connections.inputs[id];
            var gradient = getVar('aux');
            buildSentence(gradient, ' = 0', store_propagation);
            for (var id in this.trace.extended) {
              var neuron = this.neighboors[id];
              var neuron_responsibility = getVar(neuron, 'error',
                'responsibility', neuron.error.responsibility);
              var xtrace = getVar(this, 'trace', 'extended', neuron.ID,
                input.ID, this.trace.extended[neuron.ID][input.ID]);
              buildSentence(gradient, ' += ', neuron_responsibility, ' * ',
                xtrace, store_propagation);
            }
            var input_weight = getVar(input, 'weight');
            buildSentence(input_weight, ' += ', rate, ' * ', gradient,
              store_propagation);
          }
        }
      }
      buildSentence(bias, ' += ', rate, ' * ', responsibility,
        store_propagation);
    }
    return {
      memory: varID,
      neurons: neurons + 1,
      inputs: inputs,
      outputs: outputs,
      targets: targets,
      variables: variables,
      activation_sentences: activation_sentences,
      trace_sentences: trace_sentences,
      propagation_sentences: propagation_sentences,
      layers: layers
    }
  }
}


// represents a connection between two neurons
Neuron.connection = function Connection(from, to, weight) {

  if (!from || !to)
    throw new Error("Connection Error: Invalid neurons");

  this.ID = Neuron.connection.uid();
  this.from = from;
  this.to = to;
  this.weight = typeof weight == 'undefined' ? Math.random() * .2 - .1 :
    weight;
  this.gain = 1;
  this.gater = null;
}


// squashing functions
Neuron.squash = {};

// eq. 5 & 5'
Neuron.squash.LOGISTIC = function(x, derivate) {
  if (!derivate)
    return 1 / (1 + Math.exp(-x));
  var fx = Neuron.squash.LOGISTIC(x);
  return fx * (1 - fx);
};
Neuron.squash.TANH = function(x, derivate) {
  if (derivate)
    return 1 - Math.pow(Neuron.squash.TANH(x), 2);
  var eP = Math.exp(x);
  var eN = 1 / eP;
  return (eP - eN) / (eP + eN);
};
Neuron.squash.IDENTITY = function(x, derivate) {
  return derivate ? 1 : x;
};
Neuron.squash.HLIM = function(x, derivate) {
  return derivate ? 1 : x > 0 ? 1 : 0;
};
Neuron.squash.RELU = function(x, derivate) {
  if (derivate)
    return x > 0 ? 1 : 0;
  return x > 0 ? x : 0;
};

// unique ID's
(function() {
  var neurons = 0;
  var connections = 0;
  Neuron.uid = function() {
    return neurons++;
  }
  Neuron.connection.uid = function() {
    return connections++;
  }
  Neuron.quantity = function() {
    return {
      neurons: neurons,
      connections: connections
    }
  }
})();

},{}],15:[function(require,module,exports){
/*

The MIT License (MIT)

Copyright (c) 2014 Juan Cazala - juancazala.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE



********************************************************************************************
                                         SYNAPTIC
********************************************************************************************

Synaptic is a javascript neural network library for node.js and the browser, its generalized
algorithm is architecture-free, so you can build and train basically any type of first order
or even second order neural network architectures.

http://en.wikipedia.org/wiki/Recurrent_neural_network#Second_Order_Recurrent_Neural_Network

The library includes a few built-in architectures like multilayer perceptrons, multilayer
long-short term memory networks (LSTM) or liquid state machines, and a trainer capable of
training any given network, and includes built-in training tasks/tests like solving an XOR,
passing a Distracted Sequence Recall test or an Embeded Reber Grammar test.

The algorithm implemented by this library has been taken from Derek D. Monner's paper:

A generalized LSTM-like training algorithm for second-order recurrent neural networks
http://www.overcomplete.net/papers/nn2012.pdf

There are references to the equations in that paper commented through the source code.


********************************************************************************************/

var Synaptic = {
    Neuron: require('./neuron'),
    Layer: require('./layer'),
    Network: require('./network'),
    Trainer: require('./trainer'),
    Architect: require('./architect')
};

// CommonJS & AMD
if (typeof define !== 'undefined' && define.amd)
{
  define([], function(){ return Synaptic });
}

// Node.js
if (typeof module !== 'undefined' && module.exports)
{
  module.exports = Synaptic;
}

// Browser
if (typeof window == 'object')
{
  (function(){ 
    var oldSynaptic = window['synaptic'];
    Synaptic.ninja = function(){ 
      window['synaptic'] = oldSynaptic; 
      return Synaptic;
    };	
  })();

  window['synaptic'] = Synaptic;
}

},{"./architect":11,"./layer":12,"./network":13,"./neuron":14,"./trainer":16}],16:[function(require,module,exports){
// export
if (module) module.exports = Trainer;

/*******************************************************************************************
                                        TRAINER
*******************************************************************************************/

function Trainer(network, options) {
  options = options || {};
  this.network = network;
  this.rate = options.rate || .2;
  this.iterations = options.iterations || 100000;
  this.error = options.error || .005
  this.cost = options.cost || null;
}

Trainer.prototype = {

  // trains any given set to a network
  train: function(set, options) {

    var error = 1;
    var iterations = bucketSize = 0;
    var abort = false;
    var input, output, target, currentRate;
    var cost = options && options.cost || this.cost || Trainer.cost.MSE;

    var start = Date.now();

    if (options) {
      if (options.shuffle) {
        //+ Jonas Raoni Soares Silva
        //@ http://jsfromhell.com/array/shuffle [v1.0]
        function shuffle(o) { //v1.0
          for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
          return o;
        };
      }
      if (options.iterations)
        this.iterations = options.iterations;
      if (options.error)
        this.error = options.error;
      if (options.rate)
        this.rate = options.rate;
      if (options.cost)
        this.cost = options.cost;
      if (options.schedule)
        this.schedule = options.schedule;
      if (options.customLog){
        // for backward compatibility with code that used customLog
        console.log('Deprecated: use schedule instead of customLog')
        this.schedule = options.customLog;
      }
    }

    currentRate = this.rate;
    if(Array.isArray(this.rate)) {
      bucketSize = Math.floor(this.iterations / this.rate.length);
    }


    while (!abort && iterations < this.iterations && error > this.error) {
      error = 0;

      if(bucketSize > 0) {
        var currentBucket = Math.floor(iterations / bucketSize);
        currentRate = this.rate[currentBucket] || currentRate;
      }

      for (var train in set) {
        input = set[train].input;
        target = set[train].output;

        output = this.network.activate(input);
        this.network.propagate(currentRate, target);

        error += cost(target, output);
      }

      // check error
      iterations++;
      error /= set.length;

      if (options) {
        if (this.schedule && this.schedule.every && iterations %
          this.schedule.every == 0)
          abort = this.schedule.do({
            error: error,
            iterations: iterations,
            rate: currentRate
          });
        else if (options.log && iterations % options.log == 0) {
          console.log('iterations', iterations, 'error', error, 'rate', currentRate);
        };
        if (options.shuffle)
          shuffle(set);
      }
    }

    var results = {
      error: error,
      iterations: iterations,
      time: Date.now() - start
    }

    return results;
  },

  // tests a set and returns the error and elapsed time
  test: function(set, options){

    var error = 0;
    var abort = false;
    var input, output, target;
    var cost = options && options.cost || this.cost || Trainer.cost.MSE;

    var start = Date.now();

    for (var test in set) {
      input = set[test].input;
      target = set[test].output;
      output = this.network.activate(input);
      error += cost(target, output);
    }

    error /= set.length;

    var results = {
      error: error,
      time: Date.now() - start
    }

    return results;
  },

  // trains any given set to a network using a WebWorker
  workerTrain: function(set, callback, options) {

    var that = this;
    var error = 1;
    var iterations = bucketSize = 0;
    var input, output, target, currentRate;
    var length = set.length;
    var abort = false;
    var cost = options && options.cost || that.cost || Trainer.cost.MSE;

    var start = Date.now();

    if (options) {
      if (options.shuffle) {
        //+ Jonas Raoni Soares Silva
        //@ http://jsfromhell.com/array/shuffle [v1.0]
        function shuffle(o) { //v1.0
          for (var j, x, i = o.length; i; j = Math.floor(Math.random() *
              i), x = o[--i], o[i] = o[j], o[j] = x);
          return o;
        };
      }
      if (options.iterations)
        that.iterations = options.iterations;
      if (options.error)
        that.error = options.error;
      if (options.rate)
        that.rate = options.rate;
      if (options.cost)
        that.cost = options.cost;
      if (options.schedule)
        that.schedule = options.schedule;
      if (options.customLog)
      {
        // for backward compatibility with code that used customLog
        console.log('Deprecated: use schedule instead of customLog')
        that.schedule = options.customLog;
      }
    }

    // dynamic learning rate
    currentRate = that.rate;
    if(Array.isArray(that.rate)) {
      bucketSize = Math.floor(that.iterations / that.rate.length);
    }

    // create a worker
    var worker = that.network.worker();

    // activate the network
    function activateWorker(input)
    {
        worker.postMessage({
            action: "activate",
            input: input,
            memoryBuffer: that.network.optimized.memory
        }, [that.network.optimized.memory.buffer]);
    }

    // backpropagate the network
    function propagateWorker(target){
        if(bucketSize > 0) {
          var currentBucket = Math.floor(iterations / bucketSize);
          currentRate = that.rate[currentBucket] || currentRate;
        }
        worker.postMessage({
            action: "propagate",
            target: target,
            rate: currentRate,
            memoryBuffer: that.network.optimized.memory
        }, [that.network.optimized.memory.buffer]);
    }

    // train the worker
    worker.onmessage = function(e){
        // give control of the memory back to the network
        that.network.optimized.ownership(e.data.memoryBuffer);

        if (e.data.action == "propagate")
        {
            if (index >= length)
            {
                index = 0;
                iterations++;
                error /= set.length;

                // log
                if (options) {
                  if (that.schedule && that.schedule.every && iterations % that.schedule.every == 0)
                    abort = that.schedule.do({
                      error: error,
                      iterations: iterations,
                      rate: currentRate
                    });
                  else if (options.log && iterations % options.log == 0) {
                    console.log('iterations', iterations, 'error', error);
                  };
                  if (options.shuffle)
                    shuffle(set);
                }

                if (!abort && iterations < that.iterations && error > that.error)
                {
                    activateWorker(set[index].input);
                } else {
                    // callback
                    callback({
                      error: error,
                      iterations: iterations,
                      time: Date.now() - start
                    })
                }
                error = 0;
            } else {
                activateWorker(set[index].input);
            }
        }

        if (e.data.action == "activate")
        {
            error += cost(set[index].output, e.data.output);
            propagateWorker(set[index].output);
            index++;
        }
    }

    // kick it
    var index = 0;
    var iterations = 0;
    activateWorker(set[index].input);
  },

  // trains an XOR to the network
  XOR: function(options) {

    if (this.network.inputs() != 2 || this.network.outputs() != 1)
      throw new Error("Incompatible network (2 inputs, 1 output)");

    var defaults = {
      iterations: 100000,
      log: false,
      shuffle: true,
      cost: Trainer.cost.MSE
    }

    if (options)
      for (var i in options)
        defaults[i] = options[i];

    return this.train([{
      input: [0, 0],
      output: [0]
    }, {
      input: [1, 0],
      output: [1]
    }, {
      input: [0, 1],
      output: [1]
    }, {
      input: [1, 1],
      output: [0]
    }], defaults);
  },

  // trains the network to pass a Distracted Sequence Recall test
  DSR: function(options) {
    options = options || {};

    var targets = options.targets || [2, 4, 7, 8];
    var distractors = options.distractors || [3, 5, 6, 9];
    var prompts = options.prompts || [0, 1];
    var length = options.length || 24;
    var criterion = options.success || 0.95;
    var iterations = options.iterations || 100000;
    var rate = options.rate || .1;
    var log = options.log || 0;
    var schedule = options.schedule || {};
    var cost = options.cost || this.cost || Trainer.cost.CROSS_ENTROPY;

    var trial = correct = i = j = success = 0,
      error = 1,
      symbols = targets.length + distractors.length + prompts.length;

    var noRepeat = function(range, avoid) {
      var number = Math.random() * range | 0;
      var used = false;
      for (var i in avoid)
        if (number == avoid[i])
          used = true;
      return used ? noRepeat(range, avoid) : number;
    }

    var equal = function(prediction, output) {
      for (var i in prediction)
        if (Math.round(prediction[i]) != output[i])
          return false;
      return true;
    }

    var start = Date.now();

    while (trial < iterations && (success < criterion || trial % 1000 != 0)) {
      // generate sequence
      var sequence = [],
        sequenceLength = length - prompts.length;
      for (i = 0; i < sequenceLength; i++) {
        var any = Math.random() * distractors.length | 0;
        sequence.push(distractors[any]);
      }
      var indexes = [],
        positions = [];
      for (i = 0; i < prompts.length; i++) {
        indexes.push(Math.random() * targets.length | 0);
        positions.push(noRepeat(sequenceLength, positions));
      }
      positions = positions.sort();
      for (i = 0; i < prompts.length; i++) {
        sequence[positions[i]] = targets[indexes[i]];
        sequence.push(prompts[i]);
      }

      //train sequence
      var targetsCorrect = distractorsCorrect = 0;
      error = 0;
      for (i = 0; i < length; i++) {
        // generate input from sequence
        var input = [];
        for (j = 0; j < symbols; j++)
          input[j] = 0;
        input[sequence[i]] = 1;

        // generate target output
        var output = [];
        for (j = 0; j < targets.length; j++)
          output[j] = 0;

        if (i >= sequenceLength) {
          var index = i - sequenceLength;
          output[indexes[index]] = 1;
        }

        // check result
        var prediction = this.network.activate(input);

        if (equal(prediction, output))
          if (i < sequenceLength)
            distractorsCorrect++;
          else
            targetsCorrect++;
        else {
          this.network.propagate(rate, output);
        }

        error += cost(output, prediction);

        if (distractorsCorrect + targetsCorrect == length)
          correct++;
      }

      // calculate error
      if (trial % 1000 == 0)
        correct = 0;
      trial++;
      var divideError = trial % 1000;
      divideError = divideError == 0 ? 1000 : divideError;
      success = correct / divideError;
      error /= length;

      // log
      if (log && trial % log == 0)
        console.log("iterations:", trial, " success:", success, " correct:",
          correct, " time:", Date.now() - start, " error:", error);
      if (schedule.do && schedule.every && trial % schedule.every == 0)
        schedule.do({
          iterations: trial,
          success: success,
          error: error,
          time: Date.now() - start,
          correct: correct
        });
    }

    return {
      iterations: trial,
      success: success,
      error: error,
      time: Date.now() - start
    }
  },

  // train the network to learn an Embeded Reber Grammar
  ERG: function(options) {

    options = options || {};
    var iterations = options.iterations || 150000;
    var criterion = options.error || .05;
    var rate = options.rate || .1;
    var log = options.log || 500;
    var cost = options.cost || this.cost || Trainer.cost.CROSS_ENTROPY;

    // gramar node
    var Node = function() {
      this.paths = [];
    }
    Node.prototype = {
      connect: function(node, value) {
        this.paths.push({
          node: node,
          value: value
        });
        return this;
      },
      any: function() {
        if (this.paths.length == 0)
          return false;
        var index = Math.random() * this.paths.length | 0;
        return this.paths[index];
      },
      test: function(value) {
        for (var i in this.paths)
          if (this.paths[i].value == value)
            return this.paths[i];
        return false;
      }
    }

    var reberGrammar = function() {

      // build a reber grammar
      var output = new Node();
      var n1 = (new Node()).connect(output, "E");
      var n2 = (new Node()).connect(n1, "S");
      var n3 = (new Node()).connect(n1, "V").connect(n2, "P");
      var n4 = (new Node()).connect(n2, "X")
      n4.connect(n4, "S");
      var n5 = (new Node()).connect(n3, "V")
      n5.connect(n5, "T");
      n2.connect(n5, "X")
      var n6 = (new Node()).connect(n4, "T").connect(n5, "P");
      var input = (new Node()).connect(n6, "B")

      return {
        input: input,
        output: output
      }
    }

    // build an embeded reber grammar
    var embededReberGrammar = function() {
      var reber1 = reberGrammar();
      var reber2 = reberGrammar();

      var output = new Node();
      var n1 = (new Node).connect(output, "E");
      reber1.output.connect(n1, "T");
      reber2.output.connect(n1, "P");
      var n2 = (new Node).connect(reber1.input, "P").connect(reber2.input,
        "T");
      var input = (new Node).connect(n2, "B");

      return {
        input: input,
        output: output
      }

    }

    // generate an ERG sequence
    var generate = function() {
      var node = embededReberGrammar().input;
      var next = node.any();
      var str = "";
      while (next) {
        str += next.value;
        next = next.node.any();
      }
      return str;
    }

    // test if a string matches an embeded reber grammar
    var test = function(str) {
      var node = embededReberGrammar().input;
      var i = 0;
      var ch = str.charAt(i);
      while (i < str.length) {
        var next = node.test(ch);
        if (!next)
          return false;
        node = next.node;
        ch = str.charAt(++i);
      }
      return true;
    }

    // helper to check if the output and the target vectors match
    var different = function(array1, array2) {
      var max1 = 0;
      var i1 = -1;
      var max2 = 0;
      var i2 = -1;
      for (var i in array1) {
        if (array1[i] > max1) {
          max1 = array1[i];
          i1 = i;
        }
        if (array2[i] > max2) {
          max2 = array2[i];
          i2 = i;
        }
      }

      return i1 != i2;
    }

    var iteration = 0;
    var error = 1;
    var table = {
      "B": 0,
      "P": 1,
      "T": 2,
      "X": 3,
      "S": 4,
      "E": 5
    }

    var start = Date.now();
    while (iteration < iterations && error > criterion) {
      var i = 0;
      error = 0;

      // ERG sequence to learn
      var sequence = generate();

      // input
      var read = sequence.charAt(i);
      // target
      var predict = sequence.charAt(i + 1);

      // train
      while (i < sequence.length - 1) {
        var input = [];
        var target = [];
        for (var j = 0; j < 6; j++) {
          input[j] = 0;
          target[j] = 0;
        }
        input[table[read]] = 1;
        target[table[predict]] = 1;

        var output = this.network.activate(input);

        if (different(output, target))
          this.network.propagate(rate, target);

        read = sequence.charAt(++i);
        predict = sequence.charAt(i + 1);

        error += cost(target, output);
      }
      error /= sequence.length;
      iteration++;
      if (iteration % log == 0) {
        console.log("iterations:", iteration, " time:", Date.now() - start,
          " error:", error);
      }
    }

    return {
      iterations: iteration,
      error: error,
      time: Date.now() - start,
      test: test,
      generate: generate
    }
  },

  timingTask: function(options){

    if (this.network.inputs() != 2 || this.network.outputs() != 1)
      throw new Error("Invalid Network: must have 2 inputs and one output");

    if (typeof options == 'undefined')
      var options = {};

    // helper
    function getSamples (trainingSize, testSize){

      // sample size
      var size = trainingSize + testSize;

      // generate samples
      var t = 0;
      var set  = [];
      for (var i = 0; i < size; i++) {
        set.push({ input: [0,0], output: [0] });
      }
      while(t < size - 20) {
          var n = Math.round(Math.random() * 20);
          set[t].input[0] = 1;
          for (var j = t; j <= t + n; j++){
              set[j].input[1] = n / 20;
              set[j].output[0] = 0.5;
          }
          t += n;
          n = Math.round(Math.random() * 20);
          for (var k = t+1; k <= t + n; k++)
              set[k].input[1] = set[t].input[1];
          t += n;
      }

      // separate samples between train and test sets
      var trainingSet = []; var testSet = [];
      for (var l = 0; l < size; l++)
          (l < trainingSize ? trainingSet : testSet).push(set[l]);

      // return samples
      return {
          train: trainingSet,
          test: testSet
      }
    }

    var iterations = options.iterations || 200;
    var error = options.error || .005;
    var rate = options.rate || [.03, .02];
    var log = options.log === false ? false : options.log || 10;
    var cost = options.cost || this.cost || Trainer.cost.MSE;
    var trainingSamples = options.trainSamples || 7000;
    var testSamples = options.trainSamples || 1000;

    // samples for training and testing
    var samples = getSamples(trainingSamples, testSamples);

    // train
    var result = this.train(samples.train, {
      rate: rate,
      log: log,
      iterations: iterations,
      error: error,
      cost: cost
    });

    return {
      train: result,
      test: this.test(samples.test)
    }
  }
};

// Built-in cost functions
Trainer.cost = {
  // Eq. 9
  CROSS_ENTROPY: function(target, output)
  {
    var crossentropy = 0;
    for (var i in output)
      crossentropy -= (target[i] * Math.log(output[i]+1e-15)) + ((1-target[i]) * Math.log((1+1e-15)-output[i])); // +1e-15 is a tiny push away to avoid Math.log(0)
    return crossentropy;
  },
  MSE: function(target, output)
  {
    var mse = 0;
    for (var i in output)
      mse += Math.pow(target[i] - output[i], 2);
    return mse / output.length;
  },
  BINARY: function(target, output){
    var misses = 0;
    for (var i in output)
      misses += Math.round(target[i] * 2) != Math.round(output[i] * 2);
    return misses;
  }
}

},{}]},{},[2]);
