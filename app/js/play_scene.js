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
