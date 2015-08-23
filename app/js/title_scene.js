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
