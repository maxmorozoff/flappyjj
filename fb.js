var canvas, ctx;
var width, height, birdPos;
var sky, land, bird, pipe, pipeUp, pipeDown, scoreBoard, ready, splash;
var dist, birdY, birdF, birdN, birdV;
var animation, death, deathAnim;
var pipes = [], pipesDir = [], pipeSt, pipeNumber;
var score, maxScore;
var dropSpeed;
var flashlight_switch = false, hidden_switch = false;
var mode, delta;
var playend = false, playdata = [];
var rafId = undefined
var rafActive = false
var birdFrame = 24
var blockReplay = false

var clearCanvas = function(){
	ctx.fillStyle = '#4EC0CA';
	ctx.fillRect(0, 0, width, height);
}

var loadImages = function(){
	var imgNumber = 9, imgComplete = 0;
	var onImgLoad = function(){
		imgComplete++;
		if(imgComplete == imgNumber){
			death = 1;
			dist = 0;
			birdY = (height - 112) / 2;
			birdF = 0;
			birdN = 0;
			birdV = 0;
			birdPos = width * 0.35;
			birdFrame = bird.height / 4;
			score = 0;
			pipeSt = 0;
			pipeNumber = 10;
			pipes = [];
			pipesDir = [];
			for(var i = 0; i < 10; ++i){
				pipes.push(Math.floor(Math.random() * (height - 300 - delta) + 10));
				pipesDir.push((Math.random() > 0.5));
			}
			drawCanvas();
		}
	}

	sky = new Image();
	sky.src = 'images/sky.png';
	sky.onload = onImgLoad;
	
	land = new Image();
	land.src = 'images/land.png';
	land.onload = onImgLoad;
	
	bird = new Image();
	bird.src = 'images/bird.png';
	bird.onload = onImgLoad;
	
	pipe = new Image();
	pipe.src = 'images/pipe.png';
	pipe.onload = onImgLoad;
	
	pipeUp = new Image();
	pipeUp.src = 'images/pipe-up.png';
	pipeUp.onload = onImgLoad;
	
	pipeDown = new Image();
	pipeDown.src = 'images/pipe-down.png';
	pipeDown.onload = onImgLoad;
	
	scoreBoard = new Image();
	scoreBoard.src = 'images/scoreboard.png';
	scoreBoard.onload = onImgLoad;
	
	ready = new Image();
	ready.src = 'images/replay.png';
	ready.onload = onImgLoad;
	
	splash = new Image();
	splash.src = 'images/splash.png';
	splash.onload = onImgLoad;
}

function is_touch_device() {  
  try {  
    document.createEvent("TouchEvent");  
    return true;  
  } catch (e) {  
    return false;  
  }  
}

var initCanvas = function(){
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext('2d');
	canvas.width = width = window.innerWidth;
	canvas.height = height = window.innerHeight;
	if(is_touch_device()){
		canvas.addEventListener("touchend", function(e) { e.preventDefault(); }, false);
        canvas.addEventListener("touchstart", function(e) {
	        	jump(e);
            e.preventDefault();
        }, false);
	}
	else
		canvas.onmousedown = jump;
	window.onkeydown = jump;
	FastClick.attach(canvas);
	loadImages();
}

var deathAnimation = function(){
	blockReplay = true
	if(splash){
		ctx.drawImage(splash, width / 2 - 94, height / 2 - 54);
		splash = undefined;
	}
	else {
        ctx.drawImage(scoreBoard, width / 2 - 118, height / 2 - 54);
        playend = true;
        playdata = [mode, score];
    }
	window.setTimeout(_=>{
		ctx.drawImage(ready, width / 2 - 57, height / 2 + 10);
		maxScore = Math.max(maxScore, score);
		blockReplay = false
	},500)
}

var drawSky = function(){
	var totWidth = 0;
	while(totWidth < width){
		ctx.drawImage(sky, totWidth, height - 221);
		totWidth += sky.width;
	}
}

var drawLand = function(){
	var totWidth = -dist;
	while(totWidth < width){
		ctx.drawImage(land, totWidth, height - 112);
		totWidth += land.width;
	}
	dist = dist + 2;
	var tmp = Math.floor(dist - width * 0.65) % 220;
	if(dist >= width * 0.65 && Math.abs(tmp) <= 1){
		score++;
		if (score == 15 && mode == 2) document.querySelector('body').classList.add('animated')
	}
}

var drawPipe = function(x, y){
	// console.log({x,y,birdPos,birdY})
	ctx.drawImage(pipe, x, 0, pipe.width, y);
	ctx.drawImage(pipeDown, x, y);
	ctx.drawImage(pipe, x, y + 168 + delta, pipe.width, height - 112);
	ctx.drawImage(pipeUp, x, y + 144 + delta);
	if(x < birdPos + 85 -30 && x + 50 -30 > birdPos && (birdY < y + 24 -3 || birdY + 90 > y + 144 + delta)){
		// if(x < birdPos + 85 && x + 50 > birdPos && (birdY < y + 24 || birdY + 90 > y + 144 + delta)){
		// console.log({x,y,birdPos,birdY})
		stopAnimation();
		death = 1;
	}
	else if(x + pipe.width < 0){
		pipeSt++;
		pipeNumber++;
		pipes.push(Math.floor(Math.random() * (height - 300 - delta) + 10));
		pipesDir.push((Math.random() > 0.5));
	}
	
}

var drawBird = function(){
//	ctx.translate(width * 0.35 + 17, birdY + 12);
//	var deg = -Math.atan(birdV / 2) / 3.14159;
//	ctx.rotate(deg);
	ctx.drawImage(bird, 
		// source image
		0, birdN * birdFrame, 
		bird.width, birdFrame, 
		// destination image
		birdPos, birdY, 
		bird.width/2, birdFrame/2
	);
//	ctx.rotate(-deg);
//	ctx.translate(-width * 0.35 - 17, -birdY - 12);
	birdF = (birdF + 1) % 6;
	if(birdF % 6 == 0)
		birdN = (birdN + 1) % 4;
	birdY -= birdV;
	birdV -= dropSpeed;
	if(birdY + 112 + birdFrame/2 -8  > height){
		stopAnimation();
		death = 1;
	}
	if(death)
		deathAnimation();
}

var drawScore = function(){
	ctx.font = '20px "Press Start 2P"';
	ctx.lineWidth = 5;
    ctx.strokeStyle = '#fff';
	ctx.fillStyle = '#000';
	var txt = "" + score;
	ctx.strokeText(txt, (width - ctx.measureText(txt).width) / 2, height * 0.15);
	ctx.fillText(txt, (width - ctx.measureText(txt).width) / 2, height * 0.15);
}

var drawShadow = function() {
	var left_shadow = "linear, " + ((width * 0.35 - 170) / width * 100.) + "% 0, " + ((width * 0.35 + 60) / width * 100.) + "% 0, from(black), to(rgba(0,0,0,0))";
	var right_shadow = "linear, " + ((width * 0.35 + 190) / width * 100.) + "% 0, " + ((width * 0.35 - 30) / width * 100.) + "% 0, from(black), to(rgba(0,0,0,0))";
	var grd = ctx.createLinearGradient(width * 0.35 - 170, 0, width * 0.35 + 60, 0);
	grd.addColorStop(0, "black");
	grd.addColorStop(1, "rgba(0, 0, 0, 0)");
	ctx.fillStyle = grd;
	ctx.fillRect((width * 0.35 - 170), 0, 230, height);
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, (width * 0.35 - 170), height);
	grd = ctx.createLinearGradient(width * 0.35 - 30, 0, width * 0.35 + 190, 0);
	grd.addColorStop(0, "rgba(0, 0, 0, 0)");
	grd.addColorStop(1, "black");
	ctx.fillStyle = grd;
	ctx.fillRect((width * 0.35 - 30), 0, 220, height);
	ctx.fillStyle = "black";
	ctx.fillRect(width * 0.35 + 190, 0, width * 0.65 - 190, height);
}

var drawHidden = function() {
	ctx.fillStyle = "black";
	ctx.fillRect(width * 0.35, 30, 300, height - 180);
}

var drawCanvas = function(){
	clearCanvas();
	drawSky();
	for(var i = pipeSt; i < pipeNumber; ++i){
		drawPipe(width - dist + i * 220, pipes[i]);
		if(mode == 2){
			if(pipesDir[i]){
				if(pipes[i] + 1 > height - 300){
					pipesDir[i] = !pipesDir[i];
					pipes[i] -= 1;
				}
				else
					pipes[i] += 1;
			}
			else{
				if(pipes[i] - 1 < 10){
					pipesDir[i] = !pipesDir[i];
					pipes[i] += 1;
				}
				else
					pipes[i] -= 1;
			}
		}
	}
	drawLand();
	if(flashlight_switch)
		drawShadow();
	else if(hidden_switch)
		drawHidden();
	drawBird();
	drawScore();

	if (!rafActive) return;
	rafId = requestAnimationFrame(drawCanvas);
}

function startAnimation () {
	if (rafActive) return;
	rafActive = true;
	rafId = requestAnimationFrame(drawCanvas);
}

function stopAnimation() {
	rafActive = false
	cancelAnimationFrame(rafId)
}

var jump = function(e){
	if(death ){
		if (blockReplay) return// blockReplay = false;
		// console.log(e)
		// ready, width / 2 - 57, height / 2 + 10
		// if () return
		dist = 0;
		birdY = (height - 112) / 2;
		birdF = 0;
		birdN = 0;
		birdV = 0;
		death = 0;
		score = 0;
		birdPos = width * 0.35;
		pipeSt = 0;
		pipeNumber = 10;
		pipes = [];
		pipesDir = [];
		for(var i = 0; i < 10; ++i){
			pipes.push(Math.floor(Math.random() * (height - 300 - delta) + 10));
			pipesDir.push((Math.random() > 0.5));
		}
		startAnimation();
	}
	if(mode == 0)
		birdV = 6;
	else if(mode == 1)
		birdV = 6;
	else
		birdV = 6;
}

var easy, normal, hard;

function easyMode(){
	easy.style["box-shadow"] = "0 0 0 2px #165CF3";
	normal.style["box-shadow"] = "";
	hard.style["box-shadow"] = "";
	stopAnimation();
	dropSpeed = 0.3;
	mode = 0;
	delta = 150;
	initCanvas();
}

function normalMode(){
	easy.style["box-shadow"] = "";
	normal.style["box-shadow"] = "0 0 0 2px #165CF3";
	hard.style["box-shadow"] = "";
	stopAnimation();
	dropSpeed = 0.3;
	mode = 1;
	delta = 100;
	initCanvas();
}

function hardMode(){
	easy.style["box-shadow"] = "";
	normal.style["box-shadow"] = "";
	hard.style["box-shadow"] = "0 0 0 2px #165CF3";
	stopAnimation();
	dropSpeed = 0.3;
	mode = 2;
	delta = 90;
	initCanvas();
}

function flashlight(){
	document.getElementById("flashlight").style.background = ["red", "rgba(255, 255, 255, 0.6)"][+flashlight_switch];
	flashlight_switch ^= 1;
}

function hidden(){
	document.getElementById("hidden").style.background = ["red", "rgba(255, 255, 255, 0.6)"][+hidden_switch];
	hidden_switch ^= 1;
}

window.onload = function(){
    //document.addEventListener("touchend", function(e) { e.preventDefault(); }, false);
    mode = 0;
    score = 0;
    playdata = [0, 0];
    
	maxScore = 0;
	dropSpeed = 0.3;
	mode = 0;
	delta = 100;
	initCanvas();
	easy = document.getElementById("easy");
    easy.onclick = easyMode;
	normal = document.getElementById("normal");
    normal.onclick = normalMode;
	hard = document.getElementById("hard");
    hard.onclick = hardMode;
	document.getElementById("flashlight").onclick = flashlight;
	//document.getElementById("hidden").onclick = hidden;
	window.onresize = function() {
		canvas.width = width = window.innerWidth;
		canvas.height = height = window.innerHeight;
		drawCanvas();
	}
}
