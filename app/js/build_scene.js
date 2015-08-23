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
