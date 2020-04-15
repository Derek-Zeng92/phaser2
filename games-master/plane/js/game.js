const game = new Phaser.Game(240, 400, Phaser.CANVAS, 'game');

game.States={}

game.score=0;

// boot state,一般是对游戏进行一些设置
game.States.boot={
  preload(){
    if(typeof(GAME) !== "undefined") {
      this.load.baseURL = GAME + "/";
    }
    if(!game.device.desktop){
      // 移动端适配
      this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
      // this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
      this.scale.forcePortrait=true;
      this.scale.refresh();
    }
    game.load.image('loading','assets/preloader.gif')
  },
  create(){
    game.state.start('preload')
  }
}

// load state，一般加载资源
game.States.preload={
  preload(){
    // sprite精灵
    let preloadSprite=game.add.sprite(10,game.height/2,'loading');
    game.load.setPreloadSprite(preloadSprite);
    game.load.image('background', 'assets/bg.jpg');
    game.load.image('copyright', 'assets/copyright.png');
    game.load.spritesheet('myplane', 'assets/myplane.png', 40, 40, 4);
    game.load.spritesheet('startbutton', 'assets/startbutton.png', 100, 40, 2);
    game.load.spritesheet('replaybutton', 'assets/replaybutton.png', 80, 30, 2);
    game.load.spritesheet('sharebutton', 'assets/sharebutton.png', 80, 30, 2);
    game.load.image('mybullet', 'assets/mybullet.png');
    game.load.image('bullet', 'assets/bullet.png');
    game.load.image('enemy1', 'assets/enemy1.png');
    game.load.image('enemy2', 'assets/enemy2.png');
    game.load.image('enemy3', 'assets/enemy3.png');
    game.load.spritesheet('explode1', 'assets/explode1.png', 20, 20, 3);
    game.load.spritesheet('explode2', 'assets/explode2.png', 30, 30, 3);
    game.load.spritesheet('explode3', 'assets/explode3.png', 50, 50, 3);
    game.load.spritesheet('myexplode', 'assets/myexplode.png', 40, 40, 3);
    game.load.image('award', 'assets/award.png');
    game.load.audio('normalback', 'assets/normalback.mp3');
    game.load.audio('playback', 'assets/playback.mp3');
    game.load.audio('fashe', 'assets/fashe.mp3');
    game.load.audio('crash1', 'assets/crash1.mp3');
    game.load.audio('crash2', 'assets/crash2.mp3');
    game.load.audio('crash3', 'assets/crash3.mp3');
    game.load.audio('ao', 'assets/ao.mp3');
    game.load.audio('pi', 'assets/pi.mp3');
    game.load.audio('deng', 'assets/deng.mp3');
    // 文本
    let style = { font: "20px Arial", fill: "#fff", align: "center" };
    let loadtext = game.add.text(game.world.centerX, game.height/2-20, "0%", style);
    loadtext.anchor.set(0.5);
    // 资源加载状态
    game.load.onFileComplete.add(function(process){

      loadtext.setText(process+'%');
    })
  },
  create(){
    game.state.start('start');
  }
}

// start state，游戏开始界面
game.States.start={
  create(){
    // 背景tileSprite瓦片精灵
    game.add.image(0,0,'background');
    // 版权
    game.add.image(12,game.height-16,'copyright');
    // 我的飞机
    let myplane=game.add.sprite(100,100,'myplane');
    myplane.animations.add('fly');
    myplane.animations.play('fly', 15, true);
    // 开始按钮
    game.add.button(70,200,'startbutton',this.onStartClick,this,1,1,0);
    this.normalback=game.add.audio('normalback',0.2,true);
    try{
      this.normalback.play();
    }catch(e){}
  },
  onStartClick(){
    game.state.start('play');
    this.normalback.stop();
  }
}

// play state，游戏主界面
game.States.play={
  create(){
    // 开启ARCADE物理引擎
    game.physics.startSystem(Phaser.Physics.ARCADE);
    // 背景滚动 tileSprite瓦片精灵
    let bg=game.add.tileSprite(0,0,game.width,game.height,'background');
    bg.autoScroll(0,20)
    // 我的飞机
    this.myplane=game.add.sprite(100,100,'myplane');
    this.myplane.animations.add('fly');
    this.myplane.animations.play('fly', 15, true);
    game.physics.arcade.enable(this.myplane);
    this.myplane.body.collideWorldBounds=true;
    // 飞机飞到底部动画
    let tween = game.add.tween(this.myplane).to({y:game.height-40},1000,Phaser.Easing.Circular.Out,true);
    tween.onComplete.add(this.onStart,this);
    // 背景音乐
    this.playback = game.add.audio('playback', 0.2, true);
    try{
      this.playback.play();
    }catch(e){}
    // 开火音乐
    this.pi = game.add.audio('pi', 1, false);
    // 打中敌人音乐
    this.firesound = game.add.audio('fashe', 5, false);
    // 爆炸音乐
    this.crash1 = game.add.audio('crash1', 10, false);
    this.crash2 = game.add.audio('crash2', 10, false);
    this.crash3 = game.add.audio('crash3', 20, false);
    // 挂了音乐
    this.ao = game.add.audio('ao', 10, false);
    // 接到了奖音乐
    this.deng = game.add.audio('deng', 10, false);
  },
  update(){
    if(this.myplane.myStartFire){
      this.myPlaneFire();
      this.generateEnemy();
      this.enemyFire();
      // 我方子弹和敌机碰撞监测
      game.physics.arcade.overlap(this.myBullets, this.enemys, this.hitEnemy, null, this);
      // 敌方子弹和我方飞机碰撞监测
      game.physics.arcade.overlap(this.enemyBullets, this.myplane, this.hitPlane, null, this);
      // 我方飞机和奖牌进行碰撞监测
      game.physics.arcade.overlap(this.awards, this.myplane, this.getAward, null, this);
      // 我方飞机和敌方飞机的碰撞监测
      game.physics.arcade.overlap(this.enemys, this.myplane, this.crashEnemy, null, this);
    }
  },
  // 开始游戏
  onStart(){
    // 允许我方飞机拖拽
    this.myplane.inputEnabled=true;
    this.myplane.input.enableDrag();
    this.myplane.myStartFire=true;
    this.myplane.lastBulletTime=0;
    this.myplane.life=4;
    this.lastCount=0;
    // 创建我方飞机的子弹组
    this.myBullets=game.add.group();
    // 敌方飞机组
    this.enemys=game.add.group();
    this.enemys.lastEnemyTime=0;
    // 敌方子弹组
    this.enemyBullets=game.add.group();
    // 分数
    let style = { font: "16px Arial", fill: "#ff0000"};
    this.text = game.add.text(0, 0, "Score:0", style);
    // 奖牌组
    this.awards=game.add.group();
    // 奖牌每隔30秒生成一次
    game.time.events.loop(Phaser.Timer.SECOND*15, this.generateAward, this);
  },
  // 我方飞机和敌机碰撞
  crashEnemy(myplane,award){
    award.kill();
    let explode=game.add.sprite(myplane.x,myplane.y,'myexplode');
    let anim=explode.animations.add('myexplode');
    anim.play(30,false,false);
    anim.onComplete.addOnce(function(){
      explode.destroy();
      game.state.start('over')
      this.playback.stop();
    },this)
  },
  // 获得奖牌
  getAward(myplane,award){
    award.kill();
    try{
      this.deng.play();
    }catch(e){}
    if(myplane.life<7){
      myplane.life+=1;
    }
  },
  // 生成奖牌
  generateAward(){
    let awardSize=game.cache.getImage('award');
    let x=game.rnd.integerInRange(0,game.width-awardSize.width);
    let y=-awardSize.height;
    let award= this.awards.getFirstExists(false,true,x,y,'award');
    award.outOfBoundsKill = true;
    award.checkWorldBounds = true;
    game.physics.arcade.enable(award);
    award.body.velocity.y=180;
  },
  // 敌机子弹和我方飞机碰撞
  hitPlane(myplane,bullet){
    bullet.kill();
    myplane.life--;
    if(myplane.life<=0){
      myplane.kill();
      try{
        this.ao.play();
      }catch(e){}
      let explode=game.add.sprite(myplane.x,myplane.y,'myexplode');
      let anim=explode.animations.add('myexplode');
      anim.play(30,false,false);
      anim.onComplete.addOnce(function(){
        explode.destroy();
        game.state.start('over');
        this.playback.stop();
      },this)
    }
  },
  // 击中敌方飞机
  hitEnemy(bullet,enemy){
    enemy.life--;
    try{
      this.firesound.play();
    }catch(e){}
    if(enemy.life<=0){
      enemy.kill();
      try{
        this['crash'+enemy.index].play();
      }catch(e){}
      let explode=game.add.sprite(enemy.x,enemy.y,'explode'+enemy.index);
      explode.anchor.setTo(0.5,0.5);
      let anim=explode.animations.add('explode');
      anim.play(30,false,false);
      anim.onComplete.addOnce(function(){
        explode.destroy();
        game.score+=enemy.score;
        this.text.text='Score:'+game.score;
      },this)
    }
    bullet.kill();
  },
  // 我方飞机开火
  myPlaneFire(){
    let getMyPlaneBullet=function(){
      // 从group里面获取一个对象
      let myBullet = this.myBullets.getFirstExists(false,false,this.myplane.x+15,this.myplane.y-7);
      // 获取到了
      if(myBullet){
        // reset位置
        // myBullet.reset(this.myplane.x+15,this.myplane.y-7)
      }else{
        // 没有获取到，就创建一个
        myBullet=game.add.sprite(this.myplane.x+15,this.myplane.y-7,'mybullet');
        myBullet.outOfBoundsKill = true;
        myBullet.checkWorldBounds = true;
        // 把它加到组里面
        this.myBullets.addChild(myBullet);
        game.physics.enable(myBullet, Phaser.Physics.ARCADE);
      }
      return myBullet;
    }
    // 我方飞机开火
    let now=new Date().getTime();
    if(this.myplane.alive&&now-this.myplane.lastBulletTime>300){
      // 相当于new了一个bullet
      // let myBullet=game.add.sprite(this.myplane.x+15,this.myplane.y-7,'mybullet');
      
      let myBullet=getMyPlaneBullet.call(this);
      myBullet.body.velocity.y=-200;
      if(this.myplane.life>=2){
        myBullet=getMyPlaneBullet.call(this);
        myBullet.body.velocity.x=-20;
        myBullet.body.velocity.y=-200;
      }
      if(this.myplane.life>=3){
        myBullet=getMyPlaneBullet.call(this);
        myBullet.body.velocity.x=20;
        myBullet.body.velocity.y=-200;
      }
      if(this.myplane.life>=4){
        myBullet=getMyPlaneBullet.call(this);
        myBullet.body.velocity.x=-40;
        myBullet.body.velocity.y=-200;
      }
      if(this.myplane.life>=5){
        myBullet=getMyPlaneBullet.call(this);
        myBullet.body.velocity.x=40;
        myBullet.body.velocity.y=-200;
      }
      if(this.myplane.life>=6){
        myBullet=getMyPlaneBullet.call(this);
        myBullet.body.velocity.x=-60;
        myBullet.body.velocity.y=-200;
      }
      if(this.myplane.life>=7){
        myBullet=getMyPlaneBullet.call(this);
        myBullet.body.velocity.x=60;
        myBullet.body.velocity.y=-200;
      }
      this.myplane.lastBulletTime=now;
      try{
        this.pi.play();
      }catch(e){}
    }
  },
  // 生成敌机
  generateEnemy(){
    let now=new Date().getTime();
    if(now-this.enemys.lastEnemyTime>2000){
      // 取一个随机数
      let enemyIndex=game.rnd.integerInRange(1,3);
      let key='enemy'+enemyIndex;
      let size = game.cache.getImage(key).width;
      let x=game.rnd.integerInRange(size/2,game.width-size/2);
      let y=0;
      let enemy = this.enemys.getFirstExists(false,true,x,y,key);

      enemy.index=enemyIndex;
      enemy.anchor.setTo(0.5,0.5);
      enemy.outOfBoundsKill = true;
      enemy.checkWorldBounds = true;
      game.physics.arcade.enable(enemy);
      enemy.body.setSize(size,size);
      enemy.body.velocity.y=20;
      enemy.size=size;
      enemy.lastFireTime=0;
      enemy.bulletAddTime=0;
      this.count=0;

      if(Math.floor(game.score/10)>0&&(game.score-this.lastCount)>0){
        this.lastCount=game.score+10;
        enemy.bulletAddTime=100*Math.floor(game.score/10);
      }

      if(enemyIndex==1){
        enemy.bulletV=100+(enemy.bulletAddTime/2);
        enemy.bulletTime=2000-enemy.bulletAddTime<200?200:2000-enemy.bulletAddTime;
        enemy.life=2;
        enemy.score=2;
      }else if(enemyIndex==2){
        enemy.bulletV=150+(enemy.bulletAddTime/2);
        enemy.bulletTime=1500-enemy.bulletAddTime<200?200:1500-enemy.bulletAddTime;
        enemy.life=4;
        enemy.score=5;
      }else if(enemyIndex==3){
        enemy.bulletV=300+(enemy.bulletAddTime/2);
        enemy.bulletTime=1000-enemy.bulletAddTime<200?200:1000-enemy.bulletAddTime;
        enemy.life=7;
        enemy.score=10;
      }
      this.enemys.lastEnemyTime=now;
    }
  },
  // 敌方飞机开火
  enemyFire(){
    let now=game.time.now;
    this.enemys.forEachAlive(function(enemy){
      if(now-enemy.lastFireTime>enemy.bulletTime){
        // 敌人发射子弹
        let bullet = this.enemyBullets.getFirstExists(false,true,enemy.x,enemy.y+enemy.size/2,'bullet');
        bullet.anchor.setTo(0.5,0.5);
        bullet.outOfBoundsKill = true;
        bullet.checkWorldBounds = true;
        game.physics.arcade.enable(bullet);
        bullet.body.velocity.y=enemy.bulletV;

        enemy.lastFireTime=now;
      }
    },this)
  }
  // debug调试
  // render(){
  //   if(this.enemys){
  //     this.enemys.forEachAlive(function(enemy){
  //       game.debug.body(enemy)
  //     })
  //   }
  // }
}

// over state，游戏结束界面
game.States.over={
  create(){
    // 背景tileSprite瓦片精灵
    game.add.image(0,0,'background');
    // 版权
    game.add.image(12,game.height-16,'copyright');
    // 我的飞机
    let myplane=game.add.sprite(100,100,'myplane');
    myplane.animations.add('fly');
    myplane.animations.play('fly', 15, true);
    let style = { font: "bold 20px Arial", fill: "#ff0000", boundsAlignH: "center", boundsAlignV: "middle" };
    let text = game.add.text(0,0, "Score:"+game.score, style);
    text.setTextBounds(0,0,game.width,game.height);
    game.add.button(30,300,'replaybutton',this.onReplayClick,this,0,0,1);
    game.add.button(130,300,'sharebutton',this.onShareClick,this,0,0,1);
    this.normalback=game.add.audio('normalback',0.2,true);
    try{
      this.normalback.play();
    }catch(e){}
  },
  onReplayClick(){
    game.score=0;
    game.state.start('play');
    this.normalback.stop();
  },
  onShareClick(){
    document.getElementById('share').style.display='block';
    document.title=makeTitle(game.score);
  }
}


game.state.add('boot',game.States.boot);
game.state.add('preload',game.States.preload);
game.state.add('start',game.States.start);
game.state.add('play',game.States.play);
game.state.add('over',game.States.over);

game.state.start('boot');


let onCloseShare = function(){
  document.getElementById('share').style.display='none';
}

// 生成Title
let makeTitle = function(score) {
  if(score < 1000) {
    return "简版飞机大战，还挺难的，我才" + score + "分，你能得多少分呢？";
  } else {
    return "简版飞机大战，我是天才，得了" + score + "分，你能得多少分呢？";
  }
}