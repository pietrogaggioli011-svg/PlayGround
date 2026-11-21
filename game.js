const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
let W=1280,H=720,DPR=1,mode='solo',running=false,time=0,last=0,shake=0;
const keys={},WORLD=4200,G=0.72;
function resize(){DPR=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*DPR;canvas.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0)}addEventListener('resize',resize);resize();
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}function rnd(a,b){return a+Math.random*(b-a)}
const camera={x:0,y:0};
const players=[];const enemies=[];const particles=[];const sparks=[];
const platforms=[{x:-100,y:620,w:900,h:200,t:'ground'},{x:860,y:620,w:760,h:200,t:'ground'},{x:1680,y:620,w:850,h:200,t:'ground'},{x:2640,y:620,w:1560,h:200,t:'ground'},
{x:520,y:510,w:240,h:26,t:'platform'},{x:1180,y:465,w:260,h:26,t:'platform'},{x:1510,y:525,w:180,h:26,t:'platform'},
{x:1900,y:480,w:280,h:26,t:'platform'},{x:2260,y:390,w:260,h:26,t:'platform'},{x:2830,y:500,w:220,h:26,t:'platform'},
{x:3180,y:390,w:260,h:26,t:'platform'},{x:3550,y:300,w:260,h:26,t:'platform'}];
function makePlayer(x,y,p=0){return{x,y,vx:0,vy:0,w:34,h:68,facing:1,hp:100,energy:100,ground:false,att:0,combo:0,comboTimer:0,dash:0,rush:0,inv:0,grab:0,player:p,walk:0}}
function reset(){players.length=0;enemies.length=0;particles.length=0;sparks.length=0;players.push(makePlayer(120,520,0));if(mode==='coop')players.push(makePlayer(170,520,1));
const spots=[760,930,1380,1800,2140,2550,2900,3300,3660];spots.forEach((x,i)=>enemies.push({x,y:570,vx:0,vy:0,w:38,h:66,hp:i===8?180:70,maxhp:i===8?180:70,facing:-1,att:0,hit:0,stun:0,boss:i===8,walk:0,dead:false})) ;camera.x=0;running=true;document.getElementById('start').style.display='none';document.getElementById('gameover').style.display='none'}
function spawn(x,y,n=8,col='#62dfff'){for(let i=0;i<n;i++)particles.push({x,y,vx:rnd(-5,5),vy:rnd(-7,1),life:rnd(18,38),max:38,c:col,s:rnd(2,6)})}
function addScreen(){for(let i=0;i<20;i++)sparks.push({x:rnd(-100,W+100),y:rnd(-100,H+100),vx:rnd(-7,-2),vy:rnd(-2,2),life:rnd(10,30),c:'#67dfff'})}
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLower()))e.preventDefault()});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
document.querySelectorAll('[data-key]').forEach(el=>{const k=el.dataset.key;el.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true});el.addEventListener('pointerup',()=>keys[k]=false);el.addEventListener('pointercancel',()=>keys[k]=false)});
document.getElementById('solo').onclick=()=>{mode='solo';solo.classList.add('active');coop.classList.remove('active')};document.getElementById('coop').onclick=()=>{mode='coop';coop.classList.add('active');solo.classList.remove('active')};document.getElementById('startbtn').onclick=reset;document.getElementById('retry').onclick=reset;
function attack(p){if(p.att>0)return;p.att=18;p.comboTimer=50;p.combo=(p.combo||0)+1;spawn(p.x+p.facing*30,p.y-35,5,'#7cecff');const reach=p.rush?82:58;p.vx=p.facing*(p.rush?11:5);for(const e of enemies){if(e.dead)continue;let dx=(e.x-p.x)*p.facing;if(dx>0&&dx<reach&&Math.abs(e.y-p.y)<75){e.hp-=p.rush?22:12;e.hit=12;e.stun=18;e.vx=p.facing*(p.rush?13:7);spawn(e.x,e.y-35,10,p.rush?'#52dcff':'#ff4d75');p.energy=Math.min(100,p.energy+8);shake=5}}}
function kick(p){if(p.att>0)return;p.att=24;p.vx=p.facing*8;spawn(p.x+p.facing*38,p.y-20,7,'#9b72ff');for(const e of enemies){if(e.dead)continue;let dx=(e.x-p.x)*p.facing;if(dx>0&&dx<75&&Math.abs(e.y-p.y)<85){e.hp-=16;e.hit=14;e.stun=22;e.vx=p.facing*16;e.vy=-7;spawn(e.x,e.y-35,12,'#b68cff');p.energy=Math.min(100,p.energy+10);shake=7}}}
function thunder(p){if(p.energy<25||p.rush>0)return;p.energy-=25;p.rush=110;p.inv=30;shake=10;spawn(p.x,p.y-35,22,'#52cfff')}
function updatePlayer(p){const p2=p.player===0?{left:'a',right:'d',up:'w',down:'s',atk:'j',kick:'k',rush:'l',dash:'shift'}:{left:'arrowleft',right:'arrowright',up:'arrowup',down:'arrowdown',atk:'1',kick:'2',rush:'3',dash:'control'};let move=(keys[p2.right]?1:0)-(keys[p2.left]?1:0);if(p.rush>0){move=p.facing;if(keys[p2.down])p.rush--;}
if(move){p.vx+=(p.rush>0?.95:.5)*move;p.facing=move>0?1:-1;p.walk+=.25}else p.vx*=p.ground?.75:.94;
if(p.rush>0){p.vx*=1.04;p.vx=clamp(p.vx,-13,13)}else p.vx=clamp(p.vx,-7,7);
if(keys[p2.up]&&p.ground){p.vy=-13;p.ground=false;spawn(p.x,p.y,5,'#b9f1ff')}if(keys[p2.atk])attack(p);if(keys[p2.kick])kick(p);if(keys[p2.rush])thunder(p);if(keys[p2.dash]&&p.att===0&&!p.dash){p.dash=18;p.inv=18;p.vx=p.facing*15}
if(p.dash>0)p.dash--;if(p.att>0)p.att--;if(p.rush>0)p.rush--;if(p.inv>0)p.inv--;if(p.comboTimer>0)p.comboTimer--;else p.combo=0;
p.vy+=G;p.x+=p.vx;p.y+=p.vy;p.ground=false;for(const q of platforms){if(p.x+p.w/2>q.x&&p.x-p.w/2<q.x+q.w&&p.y+p.h/2>=q.y&&p.y+p.h/2-p.vy<=q.y+12&&p.vy>=0){p.y=q.y-p.h/2;p.vy=0;p.ground=true}}
p.x=clamp(p.x,20,WORLD-20);if(p.y>760){p.hp-=20;p.x=clamp(camera.x+200,20,WORLD-20);p.y=500;p.vx=p.vy=0}
p.energy=Math.min(100,p.energy+(p.rush?0:.05));}
function updateEnemy(e){if(e.dead)return;if(e.hit>0)e.hit--;if(e.stun>0){e.stun--;e.vx*=.92}else{let target=players[0];for(const p of players)if(Math.abs(p.x-e.x)<Math.abs(target.x-e.x))target=p;let dx=target.x-e.x;if(Math.abs(dx)>55)e.facing=dx>0?1:-1;if(Math.abs(dx)<270&&Math.abs(dx)>55)e.vx+=e.facing*(e.boss?.13:.09);else e.vx*=.9;if(Math.abs(dx)<58&&Math.abs(target.y-e.y)<75&&e.att===0)e.att=e.boss?40:28}if(e.att>0){e.att--;if(e.att===18)for(const p of players){if(Math.abs(p.x-e.x)<75&&Math.abs(p.y-e.y)<80&&p.inv<=0){p.hp-=e.boss?18:9;p.vx=e.facing*9;p.vy=-5;shake=6;spawn(p.x,p.y-35,8,'#ff4c65')}}}e.vx=clamp(e.vx,-(e.boss?5:4),e.boss?5:4);e.vy+=G;e.x+=e.vx;e.y+=e.vy;e.walk+=Math.abs(e.vx)*.08;e.y=clamp(e.y,100,570);if(e.y>=570)e.vy=0;if(e.hp<=0){e.dead=true;spawn(e.x,e.y-35,24,e.boss?'#52cfff':'#ff5472');if(e.boss)setTimeout(()=>end(true),700)}}
function end(win){running=false;document.getElementById('gameover').style.display='flex';document.getElementById('gameoverTitle').textContent=win?'AREA SECURED':'MISSION FAILED';document.getElementById('gameoverText').textContent=win?'La tempesta è stata neutralizzata.':'Il circuito è stato compromesso.'}
function update(){if(running){time++;for(const p of players){updatePlayer(p);if(p.hp<=0)end(false)}for(const e of enemies)updateEnemy(e);let avg=players.reduce((n,p)=>n+p.x,0)/players.length;let target=clamp(avg-W*.38,0,WORLD-W);camera.x+=(target-camera.x)*.07;if(shake>0)shake*=.75}for(let i=particles.length-1;i>=0;i--){let p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.18;p.life--;if(p.life<=0)particles.splice(i,1)}for(let i=sparks.length-1;i>=0;i--){let s=sparks[i];s.x+=s.vx;s.life--;if(s.life<=0)sparks.splice(i,1)}}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function poly(x,y,a,c){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x,y);a.forEach(v=>ctx.lineTo(v[0],v[1]));ctx.closePath();ctx.fill()}
function drawBackground(){let sx=camera.x*.18;let grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#07101b');grad.addColorStop(.55,'#102438');grad.addColorStop(1,'#07101a');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
// moon
ctx.fillStyle='#77bad0';ctx.globalAlpha=.16;ctx.beginPath();ctx.arc(W*.78-sx*.2,150,74,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
// far city
for(let i=-2;i<12;i++){let x=i*180-sx*.35%180;let h=110+(i*37%90);rect(x,H*.72-h,130,h,'#091522');for(let j=0;j<10;j++){if((i+j)%3)rect(x+18+(j%3)*35,H*.72-h+25+Math.floor(j/3)*28,8,15,'#1d5264')}}
// mountains / forest silhouette
ctx.fillStyle='#0a1822';ctx.beginPath();ctx.moveTo(0,570);for(let x=-100;x<W+200;x+=160){ctx.lineTo(x,360+Math.sin(x*.01)*35);ctx.lineTo(x+80,570)}ctx.lineTo(W,650);ctx.closePath();ctx.fill();
// rain and lightning streaks
ctx.globalAlpha=.16;ctx.strokeStyle='#67cbe8';ctx.lineWidth=1;for(let i=0;i<45;i++){let x=(i*91-time*1.4-camera.x*.1)% (W+80)-40;let y=(i*53+time*.7)%H;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-18,y+55);ctx.stroke()}ctx.globalAlpha=1;
// foreground moving neon sign
let sign=1080-camera.x*.72%WORLD;if(sign< W+500&&sign>-500){rect(sign,250,210,74,'#08141f');rect(sign+7,257,196,60,'#0e2631');ctx.fillStyle='#67dfff';ctx.font='900 24px Trebuchet MS';ctx.fillText('NEO  KYOTO',sign+32,294);rect(sign+16,311,170,4,'#df557a')}}
function drawWorld(){ctx.save();ctx.translate(-camera.x+(shake?rnd(-shake,shake):0),shake?rnd(-shake,shake):0); 
// ground platforms
for(const q of platforms){rect(q.x,q.y,q.w,q.h,q.t==='ground'?'#111926':'#172735');rect(q.x,q.y,q.w,5,q.t==='ground'?'#244b5c':'#65b4c7');if(q.t==='ground')for(let x=q.x;x<q.x+q.w;x+=42){rect(x+10,q.y+18,22,6,'#0d121b');rect(x+12,q.y+42,5,70,'#18212b')}}
// environment objects
for(let x=400;x<WORLD;x+=620){rect(x,570,90,50,'#1d2b38');rect(x+12,550,66,20,'#263a48');rect(x+28,560,34,10,'#55bad0')}
for(let x=250;x<WORLD;x+=480){ctx.fillStyle='#0b171a';ctx.fillRect(x,430,12,190);ctx.fillStyle='#153b35';ctx.beginPath();ctx.arc(x+6,420,55,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1a5146';ctx.beginPath();ctx.arc(x-10,410,30,0,Math.PI*2);ctx.fill()}
// circuit lane accents
ctx.fillStyle='#42aace';ctx.globalAlpha=.45;for(let x=1700;x<2600;x+=80)rect(x,614,44,3,'#56c9e9');ctx.globalAlpha=1;
for(const e of enemies){if(!e.dead)drawEnemy(e)}for(const p of players)drawPlayer(p);for(const p of particles){ctx.globalAlpha=clamp(p.life/p.max,0,1);rect(p.x-p.s/2,p.y-p.s/2,p.s,p.s,p.c)}ctx.globalAlpha=1;ctx.restore();
for(const s of sparks){ctx.globalAlpha=clamp(s.life/30,0,1);rect(s.x,s.y,22,1,s.c)}ctx.globalAlpha=1}
function drawPlayer(p){let x=Math.round(p.x),y=Math.round(p.y);ctx.save();ctx.translate(x,y);ctx.scale(p.facing,1);
if(p.rush>0){ctx.globalAlpha=.18;for(let i=1;i<7;i++){ctx.fillStyle='#58cbff';ctx.fillRect(-i*18-p.walk%8,-32,10,64)}ctx.globalAlpha=1}
// shadow
ctx.fillStyle='#02050a88';ctx.beginPath();ctx.ellipse(0,38,28,7,0,0,Math.PI*2);ctx.fill();
// scarf / coat
ctx.fillStyle='#101d2a';poly(0,-10,[[-24,-16],[-40,18],[-26,28],[-8,4]],'#172736');ctx.fillStyle='#df3d61';ctx.fillRect(-10,-24,18,58);ctx.fillStyle='#111827';ctx.fillRect(-20,-26,40,52);
// cyber legs
ctx.fillStyle='#182436';ctx.fillRect(-18,17,14,25);ctx.fillRect(4,17,14,25);ctx.fillStyle='#58caff';ctx.fillRect(-16,30,10,4);ctx.fillRect(6,30,10,4);ctx.fillStyle='#090e18';ctx.fillRect(-20,38,17,8);ctx.fillRect(3,38,17,8);
// torso armor
ctx.fillStyle='#263b4b';ctx.fillRect(-16,-28,32,34);ctx.fillStyle='#b8e5ef';ctx.fillRect(-8,-24,16,24);ctx.fillStyle='#57bcdf';ctx.fillRect(-3,-19,6,14);
// head
ctx.fillStyle='#111a27';ctx.fillRect(-13,-43,26,20);ctx.fillStyle='#c38c78';ctx.fillRect(-8,-35,18,12);ctx.fillStyle='#050811';ctx.fillRect(-14,-46,28,7);ctx.fillStyle='#67dcff';ctx.fillRect(4,-39,11,4);
// arms
ctx.fillStyle='#263a48';ctx.fillRect(-25,-25,10,34);ctx.fillRect(15,-25,10,34);ctx.fillStyle='#83ceeb';ctx.fillRect(-25,-25,10,5);ctx.fillRect(15,-25,10,5);
if(p.att>0){ctx.fillStyle='#72dfff';ctx.fillRect(24,-18,35,8);ctx.fillStyle='#dffaff';ctx.fillRect(54,-16,7,5)}ctx.restore()}
function drawEnemy(e){let x=Math.round(e.x),y=Math.round(e.y);ctx.save();ctx.translate(x,y);ctx.scale(e.facing,1);ctx.fillStyle='#03070c88';ctx.beginPath();ctx.ellipse(0,37,30,7,0,0,Math.PI*2);ctx.fill();let flash=e.hit>0?'#ff8ca1':(e.boss?'#5e2380':'#7a273d');ctx.fillStyle='#17202b';ctx.fillRect(-16,-25,32,55);ctx.fillStyle=flash;ctx.fillRect(-20,-30,40,28);ctx.fillStyle='#ced6d8';ctx.fillRect(-12,-38,24,14);ctx.fillStyle='#ff3366';ctx.fillRect(5,-33,10,3);ctx.fillStyle='#263744';ctx.fillRect(-25,-23,9,38);ctx.fillRect(16,-23,9,38);ctx.fillStyle='#10151d';ctx.fillRect(-18,27,13,10);ctx.fillRect(5,27,13,10);if(e.att>0&&e.att<22){ctx.fillStyle='#fa4b70';ctx.fillRect(20,-18,43,8)}if(e.boss){rect(-35,-62,70,5,'#1d2630');rect(-35,-62,70*(e.hp/e.maxhp),5,'#fd5577');ctx.fillStyle='#d052ff';ctx.font='900 10px Trebuchet MS';ctx.fillText('MECHA SHOGUN',-34,-70)}ctx.restore()}
function draw(){drawBackground();drawWorld();drawUI()}function drawUI(){let p=players[0];document.getElementById('hp').style.width=p.hp+'%';document.getElementById('energy').style.width=p.energy+'%';let comboEl=document.getElementById('combo');if(p.combo>1){comboEl.style.opacity=1;comboEl.querySelector('.comboNum').textContent=p.combo+'x'}else comboEl.style.opacity=0;
let sector='NEO KYOTO';if(camera.x>1450)sector='CYBER RAINFOREST';if(camera.x>2550)sector='THUNDER CIRCUITS';if(camera.x>3500)sector='SHOGUN CORE';document.getElementById('sector').textContent=sector;
// boss portrait area
for(let i=0;i<sparks.length;i++){}}
function loop(t){let dt=t-last;last=t;update();draw();requestAnimationAnimationFrame(loop)}
requestAnimationFrame(function loop(t){update();draw();requestAnimationFrame(loop)});
</script>
