import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const canvas = document.getElementById("gameCanvas");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const healthFill = document.getElementById("healthFill");
const energyFill = document.getElementById("energyFill");
const healthText = document.getElementById("healthText");
const energyText = document.getElementById("energyText");
const enemyText = document.getElementById("enemyText");
const scoreText = document.getElementById("scoreText");
const objectiveText = document.getElementById("objectiveText");
const damageFlash = document.getElementById("damageFlash");
const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");
const fireButton = document.getElementById("fireButton");
const boostButton = document.getElementById("boostButton");

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x88b9d7, 35, 120);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 200);
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const keys = new Set();
const touchMove = new THREE.Vector2();
const aim = { yaw: 0, pitch: -0.18, touching: false };
const colliders = [];
const enemies = [];
const bullets = [];
const effects = [];
let state = "intro";
let score = 0;
let firing = false;
let lastFire = 0;
let cameraShake = 0;
let playerMixer = null;

const player = {
  root: null,
  velocity: new THREE.Vector3(),
  health: 100,
  energy: 100,
  boost: 0,
  cooldown: 0,
  radius: 1.1
};

scene.add(new THREE.HemisphereLight(0xc7ebff, 0x29415a, 2.2));
const sun = new THREE.DirectionalLight(0xfff2d4, 3.2);
sun.position.set(20, 34, 18);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -48;
sun.shadow.camera.right = 48;
sun.shadow.camera.top = 48;
sun.shadow.camera.bottom = -48;
scene.add(sun);

function toon(geometry, color, outline = 0x142331) {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshToonMaterial({ color }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 25),
    new THREE.LineBasicMaterial({ color: outline })
  );
  edges.scale.setScalar(1.003);
  group.add(mesh, edges);
  return group;
}

function box(width, height, depth, color) {
  return toon(new THREE.BoxGeometry(width, height, depth), color);
}

function createSky() {
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(150, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { top: { value: new THREE.Color(0x5fa7dc) }, bottom: { value: new THREE.Color(0xd8f1f6) } },
      vertexShader: "varying vec3 vPosition; void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader: "uniform vec3 top; uniform vec3 bottom; varying vec3 vPosition; void main(){float t=normalize(vPosition).y*0.5+0.5;gl_FragColor=vec4(mix(bottom,top,smoothstep(0.0,1.0,t)),1.0);}"
    })
  );
  scene.add(sky);
}

function createWorld() {
  createSky();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.MeshToonMaterial({ color: 0x344a5a }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const grid = new THREE.GridHelper(140, 56, 0x6b94a7, 0x4e7181);
  grid.position.y = 0.015;
  grid.material.transparent = true;
  grid.material.opacity = 0.38;
  scene.add(grid);

  const road = new THREE.Mesh(new THREE.PlaneGeometry(140, 20), new THREE.MeshToonMaterial({ color: 0x273946 }));
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.025;
  scene.add(road);
  const road2 = road.clone();
  road2.geometry = new THREE.PlaneGeometry(20, 140);
  scene.add(road2);

  const configs = [
    [-30, -28, 12, 18, 14, 0x527b90], [28, -27, 16, 24, 12, 0x3d6d88],
    [-30, 27, 14, 22, 15, 0x456f86], [31, 27, 16, 28, 12, 0x5a7792],
    [-7, -29, 9, 14, 11, 0x6e8195], [9, 30, 10, 16, 10, 0x496f85],
    [-32, 2, 8, 12, 8, 0x607e90], [33, 1, 8, 14, 8, 0x3e687e]
  ];
  configs.forEach((config, index) => createBuilding(...config, index));
  [[-12, 7], [12, -9], [-8, -12], [14, 10], [-20, -6], [21, 6]].forEach(([x, z]) => createCover(x, z));
}

function createBuilding(x, z, width, height, depth, color, index) {
  const root = new THREE.Group();
  const body = box(width, height, depth, color);
  body.position.y = height / 2;
  root.add(body);
  const roof = box(width + 0.7, 0.8, depth + 0.7, 0xd8ff36);
  roof.position.y = height + 0.35;
  root.add(roof);
  for (let y = 3; y < height - 1; y += 3.2) {
    for (let i = -width / 2 + 1.4; i < width / 2 - 0.7; i += 2.4) {
      const windowBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.12), new THREE.MeshBasicMaterial({ color: index % 2 ? 0x8fe2ff : 0xffd975 }));
      windowBox.position.set(i, y, depth / 2 + 0.08);
      root.add(windowBox);
    }
  }
  root.position.set(x, 0, z);
  scene.add(root);
  colliders.push({ x, z, hx: width / 2, hz: depth / 2 });
}

function createCover(x, z) {
  const root = box(3.8, 2.2, 1.1, 0x7198a5);
  root.position.set(x, 1.1, z);
  scene.add(root);
  colliders.push({ x, z, hx: 1.9, hz: 0.55 });
}

function createMech(mainColor, accent, scale = 1) {
  const root = new THREE.Group();
  root.scale.setScalar(scale);
  const torso = box(1.7, 1.5, 1.15, mainColor);
  torso.position.y = 2.25;
  const chest = box(1.08, 0.65, 0.18, accent);
  chest.position.set(0, 2.35, 0.65);
  const head = box(0.78, 0.68, 0.72, 0xeaf9ff);
  head.position.y = 3.42;
  const visor = box(0.64, 0.16, 0.08, accent);
  visor.position.set(0, 3.42, 0.42);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), new THREE.MeshBasicMaterial({ color: accent }));
  core.position.set(0, 2.35, 0.78);
  [torso, chest, head, visor, core].forEach((part) => root.add(part));
  const limbs = new THREE.Group();
  for (const side of [-1, 1]) {
    const shoulder = box(0.45, 0.48, 0.5, mainColor);
    shoulder.position.set(side * 1.12, 2.68, 0);
    const arm = box(0.42, 1.15, 0.42, mainColor);
    arm.position.set(side * 1.16, 1.95, 0.05);
    const leg = box(0.58, 1.18, 0.6, mainColor);
    leg.position.set(side * 0.53, 0.75, 0);
    const foot = box(0.65, 0.3, 1.05, accent);
    foot.position.set(side * 0.53, 0.18, 0.18);
    limbs.add(shoulder, arm, leg, foot);
  }
  const cannon = box(0.34, 0.34, 1.7, 0x243946);
  cannon.position.set(1.32, 2.05, 0.75);
  limbs.add(cannon);
  root.add(limbs);
  root.userData = { limbs, core };
  return root;
}

function createPlayer() {
  player.root = createMech(0xeaf9ff, 0xd8ff36, 1.18);
  player.root.position.set(0, 0, 25);
  player.root.rotation.y = Math.PI;
  scene.add(player.root);
  loadLocalPlayerModel();
}

function loadLocalPlayerModel() {
  if (!new URLSearchParams(location.search).has("localModel")) return;
  const loader = new GLTFLoader();
  loader.load(
    "local-assets/player.glb",
    (gltf) => {
      if (!player.root) return;
      player.root.children.forEach((child) => { child.visible = false; });
      const model = gltf.scene;
      model.rotation.y = Math.PI;
      model.updateMatrixWorld(true);
      const sourceBounds = new THREE.Box3().setFromObject(model);
      const sourceHeight = sourceBounds.getSize(new THREE.Vector3()).y;
      // Normalize downloaded GLB assets to the same approximate height as the test frame.
      model.scale.setScalar(4.1 / Math.max(sourceHeight, 0.01));
      model.updateMatrixWorld(true);
      const normalizedBounds = new THREE.Box3().setFromObject(model);
      model.position.y -= normalizedBounds.min.y;
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      player.root.add(model);
      player.root.userData.externalModel = model;
      if (gltf.animations.length) {
        playerMixer = new THREE.AnimationMixer(model);
        playerMixer.clipAction(gltf.animations[0]).play();
      }
      objectiveText.textContent = "LOCAL MODEL LOADED";
    },
    undefined,
    () => {
      objectiveText.textContent = "LOCAL MODEL NOT FOUND - USING TEST FRAME";
    }
  );
}

function spawnEnemies() {
  const spawns = [[-20, 16], [22, 17], [-16, -16], [16, -17], [-5, 8], [7, -7], [-24, 0], [25, 1]];
  spawns.forEach((position, index) => {
    const root = createMech(0x3b5268, index % 2 ? 0xff6574 : 0xffa85a, 0.92);
    root.position.set(position[0], 0, position[1]);
    root.rotation.y = 0;
    scene.add(root);
    enemies.push({ root, health: 48, radius: 0.95, fire: 1 + index * 0.11, bob: index, hit: 0 });
  });
}

function reset() {
  bullets.forEach((item) => scene.remove(item.mesh));
  effects.forEach((item) => scene.remove(item.mesh));
  enemies.forEach((enemy) => scene.remove(enemy.root));
  bullets.length = 0;
  effects.length = 0;
  enemies.length = 0;
  playerMixer = null;
  if (player.root) scene.remove(player.root);
  createPlayer();
  spawnEnemies();
  player.health = 100;
  player.energy = 100;
  player.velocity.set(0, 0, 0);
  player.boost = 0;
  player.cooldown = 0;
  score = 0;
  state = "playing";
  overlay.classList.remove("visible");
  updateHud();
}

function collides(x, z, radius) {
  return colliders.some((boxCollider) => {
    const nearestX = THREE.MathUtils.clamp(x, boxCollider.x - boxCollider.hx, boxCollider.x + boxCollider.hx);
    const nearestZ = THREE.MathUtils.clamp(z, boxCollider.z - boxCollider.hz, boxCollider.z + boxCollider.hz);
    return (x - nearestX) ** 2 + (z - nearestZ) ** 2 < radius ** 2;
  });
}

function moveRoot(root, velocity, radius, dt) {
  const nextX = THREE.MathUtils.clamp(root.position.x + velocity.x * dt, -65, 65);
  if (!collides(nextX, root.position.z, radius)) root.position.x = nextX;
  const nextZ = THREE.MathUtils.clamp(root.position.z + velocity.z * dt, -65, 65);
  if (!collides(root.position.x, nextZ, radius)) root.position.z = nextZ;
}

function boost() {
  if (state !== "playing" || player.cooldown > 0 || player.energy < 22) return;
  const forward = new THREE.Vector3(Math.sin(aim.yaw), 0, -Math.cos(aim.yaw));
  player.velocity.copy(forward).multiplyScalar(36);
  player.boost = 0.22;
  player.cooldown = 0.75;
  player.energy -= 22;
  cameraShake = 0.22;
  createBurst(player.root.position, 0xd8ff36, 14);
}

function shoot(from, direction, team, color, damage, speed) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color }));
  mesh.position.copy(from);
  scene.add(mesh);
  bullets.push({ mesh, velocity: direction.multiplyScalar(speed), team, damage, life: 1.6, radius: 0.32, color });
}

function firePlayer() {
  const now = clock.getElapsedTime();
  if (state !== "playing" || now - lastFire < 0.13) return;
  lastFire = now;
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = Math.max(-0.04, direction.y);
  direction.normalize();
  const start = player.root.position.clone().add(new THREE.Vector3(0, 2.2, 0)).add(direction.clone().multiplyScalar(1.4));
  shoot(start, direction, "player", 0xd8ff36, 16, 62);
  createBurst(start, 0xd8ff36, 3);
}

function createBurst(position, color, count) {
  for (let index = 0; index < count; index += 1) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshBasicMaterial({ color }));
    mesh.position.copy(position).add(new THREE.Vector3((Math.random() - 0.5) * 0.5, 1.2 + Math.random(), (Math.random() - 0.5) * 0.5));
    scene.add(mesh);
    effects.push({ mesh, velocity: new THREE.Vector3((Math.random() - 0.5) * 7, Math.random() * 6, (Math.random() - 0.5) * 7), life: 0.3 + Math.random() * 0.35 });
  }
}

function damagePlayer(amount) {
  player.health = Math.max(0, player.health - amount);
  damageFlash.style.opacity = "1";
  setTimeout(() => { damageFlash.style.opacity = "0"; }, 90);
  cameraShake = 0.28;
  createBurst(player.root.position, 0xff6574, 10);
}

function updatePlayer(dt) {
  const inputX = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0) + touchMove.x;
  const inputZ = (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) - (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) + touchMove.y;
  const forward = new THREE.Vector3(Math.sin(aim.yaw), 0, -Math.cos(aim.yaw));
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  const desired = forward.multiplyScalar(-inputZ).add(right.multiplyScalar(inputX));
  if (desired.lengthSq() > 0.02) desired.normalize();
  const targetSpeed = player.boost > 0 ? 34 : 11;
  const wanted = desired.multiplyScalar(targetSpeed);
  player.velocity.lerp(wanted, Math.min(1, dt * (player.boost > 0 ? 9 : 12)));
  moveRoot(player.root, player.velocity, player.radius, dt);
  player.root.rotation.y = aim.yaw + Math.PI;
  player.boost = Math.max(0, player.boost - dt);
  player.cooldown = Math.max(0, player.cooldown - dt);
  player.energy = Math.min(100, player.energy + (player.boost > 0 ? 5 : 16) * dt);
  const stride = Math.min(1, player.velocity.length() / 11);
  player.root.userData.limbs.rotation.x = Math.sin(clock.getElapsedTime() * 12) * 0.18 * stride;
  player.root.userData.core.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 6) * 0.12);
  if (player.boost > 0 && Math.random() < 0.55) createBurst(player.root.position.clone().add(new THREE.Vector3(0, 0.3, 0)), 0xd8ff36, 1);
  if (firing) firePlayer();
}

function updateEnemies(dt) {
  enemies.forEach((enemy) => {
    const toPlayer = player.root.position.clone().sub(enemy.root.position);
    toPlayer.y = 0;
    const distance = toPlayer.length();
    const direction = toPlayer.normalize();
    enemy.root.rotation.y = Math.atan2(direction.x, direction.z);
    const speed = distance > 13 ? 4.2 : distance < 7 ? -2.6 : 0;
    const velocity = direction.multiplyScalar(speed);
    moveRoot(enemy.root, velocity, enemy.radius, dt);
    enemy.root.position.y = Math.sin(clock.getElapsedTime() * 2 + enemy.bob) * 0.08;
    enemy.root.userData.limbs.rotation.x = Math.sin(clock.getElapsedTime() * 8 + enemy.bob) * 0.1;
    enemy.hit = Math.max(0, enemy.hit - dt);
    enemy.fire -= dt;
    if (distance < 34 && enemy.fire <= 0 && !collidesLine(enemy.root.position, player.root.position)) {
      const start = enemy.root.position.clone().add(new THREE.Vector3(0, 2.1, 0));
      const shotDirection = player.root.position.clone().add(new THREE.Vector3(0, 1.4, 0)).sub(start).normalize();
      shoot(start, shotDirection, "enemy", 0xff6574, 9, 35);
      enemy.fire = 1 + Math.random() * 0.65;
    }
  });
}

function collidesLine(start, end) {
  const samples = 14;
  for (let index = 1; index < samples; index += 1) {
    const point = start.clone().lerp(end, index / samples);
    if (collides(point.x, point.z, 0.1)) return true;
  }
  return false;
}

function updateBullets(dt) {
  for (let index = bullets.length - 1; index >= 0; index -= 1) {
    const bullet = bullets[index];
    bullet.mesh.position.addScaledVector(bullet.velocity, dt);
    bullet.life -= dt;
    if (bullet.life <= 0 || collides(bullet.mesh.position.x, bullet.mesh.position.z, 0.08)) {
      scene.remove(bullet.mesh);
      bullets.splice(index, 1);
      continue;
    }
    if (bullet.team === "player") {
      const target = enemies.find((enemy) => enemy.root.position.distanceTo(bullet.mesh.position) < 1.25);
      if (target) {
        target.health -= bullet.damage;
        createBurst(target.root.position, 0xd8ff36, 7);
        scene.remove(bullet.mesh);
        bullets.splice(index, 1);
        if (target.health <= 0) {
          createBurst(target.root.position, 0xff6574, 30);
          scene.remove(target.root);
          enemies.splice(enemies.indexOf(target), 1);
          score += 1;
        }
      }
    } else if (player.root.position.distanceTo(bullet.mesh.position) < 1.45) {
      damagePlayer(bullet.damage);
      scene.remove(bullet.mesh);
      bullets.splice(index, 1);
    }
  }
}

function updateEffects(dt) {
  for (let index = effects.length - 1; index >= 0; index -= 1) {
    const effect = effects[index];
    effect.mesh.position.addScaledVector(effect.velocity, dt);
    effect.velocity.y -= 12 * dt;
    effect.life -= dt;
    effect.mesh.scale.setScalar(Math.max(0.02, effect.life * 2));
    if (effect.life <= 0) {
      scene.remove(effect.mesh);
      effects.splice(index, 1);
    }
  }
}

function updateCamera(dt) {
  const forward = new THREE.Vector3(Math.sin(aim.yaw), 0, -Math.cos(aim.yaw));
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  const desired = player.root.position.clone().add(new THREE.Vector3(0, 5.6, 0)).addScaledVector(forward, -10.5).addScaledVector(right, 1.5);
  const lookAt = player.root.position.clone().add(new THREE.Vector3(0, 2.1, 0)).addScaledVector(forward, 13);
  if (cameraShake > 0) desired.add(new THREE.Vector3((Math.random() - 0.5) * cameraShake, (Math.random() - 0.5) * cameraShake, 0));
  camera.position.lerp(desired, 1 - Math.exp(-dt * 8));
  camera.lookAt(lookAt);
  cameraShake = Math.max(0, cameraShake - dt);
}

function updateHud() {
  healthFill.style.width = player.health + "%";
  energyFill.style.width = player.energy + "%";
  healthText.textContent = Math.ceil(player.health);
  energyText.textContent = Math.ceil(player.energy);
  enemyText.textContent = String(enemies.length).padStart(2, "0");
  scoreText.textContent = String(score).padStart(3, "0");
}

function endGame(victory) {
  state = victory ? "victory" : "defeat";
  overlayTitle.textContent = victory ? "DISTRICT SECURED" : "FRAME DISABLED";
  overlayMessage.textContent = victory ? "训练区已清除。下一步可以把这套第三人称战斗逻辑迁移进 Unity。" : "机甲结构完整度归零。使用推进冲刺拉开距离，再寻找建筑掩体。";
  startButton.textContent = "DEPLOY AGAIN";
  overlay.classList.add("visible");
}

function update(dt) {
  if (state === "playing") {
    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateEffects(dt);
    if (player.health <= 0) endGame(false);
    if (enemies.length === 0) endGame(true);
    objectiveText.textContent = enemies.length ? "CLEAR THE TRAINING DISTRICT" : "DISTRICT SECURED";
    updateHud();
  }
  if (playerMixer) playerMixer.update(dt);
  updateCamera(dt);
}

function loop() {
  const dt = Math.min(clock.getDelta(), 0.033);
  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

canvas.addEventListener("click", () => {
  if (state === "playing" && canvas.requestPointerLock && !aim.touching) canvas.requestPointerLock();
});
document.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement === canvas) {
    aim.yaw -= event.movementX * 0.0028;
    aim.pitch = THREE.MathUtils.clamp(aim.pitch - event.movementY * 0.0015, -0.42, 0.12);
  }
});
window.addEventListener("keydown", (event) => {
  keys.add(event.code);
  if ((event.code === "ShiftLeft" || event.code === "ShiftRight" || event.code === "Space") && !event.repeat) boost();
  if (event.code === "KeyR" && !event.repeat) reset();
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("mousedown", (event) => { if (event.button === 0) firing = true; });
window.addEventListener("mouseup", () => { firing = false; });

function updateStick(event) {
  const rect = joystick.getBoundingClientRect();
  const dx = event.clientX - (rect.left + rect.width / 2);
  const dy = event.clientY - (rect.top + rect.height / 2);
  const limit = rect.width * 0.33;
  const length = Math.hypot(dx, dy) || 1;
  const strength = Math.min(limit, length) / limit;
  touchMove.set(dx / length * strength, dy / length * strength);
  stick.style.transform = "translate(" + touchMove.x * limit + "px," + touchMove.y * limit + "px)";
}
joystick.addEventListener("pointerdown", (event) => { joystick.setPointerCapture(event.pointerId); updateStick(event); });
joystick.addEventListener("pointermove", (event) => { if (event.buttons) updateStick(event); });
["pointerup", "pointercancel"].forEach((name) => joystick.addEventListener(name, () => { touchMove.set(0, 0); stick.style.transform = "translate(0,0)"; }));
canvas.addEventListener("pointerdown", (event) => { if (event.pointerType !== "mouse") aim.touching = true; });
canvas.addEventListener("pointermove", (event) => {
  if (event.pointerType !== "mouse" && aim.touching) { aim.yaw -= event.movementX * 0.01; aim.pitch = THREE.MathUtils.clamp(aim.pitch - event.movementY * 0.004, -0.42, 0.12); }
});
canvas.addEventListener("pointerup", () => { aim.touching = false; });
fireButton.addEventListener("pointerdown", (event) => { event.preventDefault(); firing = true; fireButton.setPointerCapture(event.pointerId); });
["pointerup", "pointercancel"].forEach((name) => fireButton.addEventListener(name, () => { firing = false; }));
boostButton.addEventListener("pointerdown", (event) => { event.preventDefault(); boost(); });
startButton.addEventListener("click", () => { reset(); canvas.requestPointerLock?.(); });
restartButton.addEventListener("click", reset);
window.addEventListener("resize", onResize);

createWorld();
reset();
state = "intro";
overlay.classList.add("visible");
if (new URLSearchParams(location.search).has("autostart")) reset();
window.__mfa3d = { renderer, scene, player, enemies, get state() { return state; } };
loop();
