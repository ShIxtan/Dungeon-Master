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
