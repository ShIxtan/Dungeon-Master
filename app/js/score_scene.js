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
