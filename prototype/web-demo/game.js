(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
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
  const joystick = document.getElementById("joystick");
  const stick = document.getElementById("stick");
  const fireButton = document.getElementById("fireButton");
  const boostButton = document.getElementById("boostButton");

  const view = { width: canvas.width, height: canvas.height };
  const world = { width: 2400, height: 1600 };
  const keys = new Set();
  const pointer = { x: view.width / 2, y: view.height / 2, down: false };
  const touchMove = { x: 0, y: 0, active: false };
  const touchAim = { x: 1, y: 0, active: false };
  const camera = { x: 0, y: 0, shake: 0 };
  let gameState = "intro";
  let lastTime = performance.now();
  let score = 0;
  let flash = 0;
  let messageTimer = 0;
  let projectiles = [];
  let particles = [];
  let enemies = [];

  const buildings = [
    { x: 220, y: 190, w: 370, h: 250, color: "#273d4b" },
    { x: 810, y: 110, w: 380, h: 320, color: "#2b4453" },
    { x: 1480, y: 170, w: 430, h: 260, color: "#243b49" },
    { x: 250, y: 770, w: 320, h: 420, color: "#2b4351" },
    { x: 920, y: 680, w: 470, h: 250, color: "#304958" },
    { x: 1710, y: 770, w: 360, h: 400, color: "#263e4c" }
  ];

  const cover = [
    { x: 680, y: 500, w: 150, h: 58 },
    { x: 1190, y: 500, w: 170, h: 58 },
    { x: 1500, y: 550, w: 120, h: 62 },
    { x: 680, y: 1060, w: 160, h: 60 },
    { x: 1340, y: 1100, w: 150, h: 60 },
    { x: 1570, y: 1280, w: 180, h: 64 }
  ];

  const collisionRects = buildings.concat(cover);
  const player = createPlayer();

  function createPlayer() {
    return {
      x: 1200,
      y: 1240,
      vx: 0,
      vy: 0,
      r: 25,
      angle: -Math.PI / 2,
      health: 100,
      energy: 100,
      boostTimer: 0,
      boostCooldown: 0,
      fireCooldown: 0,
      hitTimer: 0,
      trailTimer: 0
    };
  }

  function resetGame() {
    Object.assign(player, createPlayer());
    projectiles = [];
    particles = [];
    enemies = createEnemies();
    score = 0;
    flash = 0;
    messageTimer = 0;
    gameState = "playing";
    overlay.classList.remove("visible");
    updateHud();
  }

  function createEnemies() {
    const spawns = [
      [700, 650], [1460, 650], [2040, 600],
      [590, 1370], [1680, 1340], [2160, 1320]
    ];
    return spawns.map((spawn, index) => ({
      x: spawn[0],
      y: spawn[1],
      vx: 0,
      vy: 0,
      r: 22,
      angle: Math.PI / 2,
      health: 46,
      maxHealth: 46,
      fireCooldown: 0.35 + index * 0.09,
      hitTimer: 0,
      strafe: index % 2 === 0 ? 1 : -1,
      strafeTimer: 1.2 + index * 0.1
    }));
  }

  function startOrRestart() {
    resetGame();
  }

  function showEndState(victory) {
    gameState = victory ? "victory" : "defeat";
    overlayTitle.textContent = victory ? "District Secured" : "Astra Frame Disabled";
    overlayMessage.textContent = victory
      ? `All hostile drones cleared. Final eliminations: ${String(score).padStart(3, "0")}.`
      : "The training frame lost structural integrity. Reposition, use cover, and boost through pressure.";
    startButton.textContent = "Deploy Again";
    overlay.classList.add("visible");
  }

  function screenToWorld(screenX, screenY) {
    return { x: screenX + camera.x, y: screenY + camera.y };
  }

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) * (view.width / rect.width);
    pointer.y = (event.clientY - rect.top) * (view.height / rect.height);
  }

  function getInput() {
    let x = 0;
    let y = 0;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;
    if (keys.has("KeyW") || keys.has("ArrowUp")) y -= 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) y += 1;

    if (touchMove.active) {
      x += touchMove.x;
      y += touchMove.y;
    }

    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }

    return { x, y, moving: length > 0.02 };
  }

  function aimPlayer() {
    let target;
    if (touchAim.active) {
      target = { x: player.x + touchAim.x * 100, y: player.y + touchAim.y * 100 };
    } else {
      target = screenToWorld(pointer.x, pointer.y);
    }
    player.angle = Math.atan2(target.y - player.y, target.x - player.x);
  }

  function requestBoost() {
    if (gameState !== "playing" || player.boostCooldown > 0 || player.energy < 22) return;
    const input = getInput();
    const dx = input.moving ? input.x : Math.cos(player.angle);
    const dy = input.moving ? input.y : Math.sin(player.angle);
    player.vx = dx * 920;
    player.vy = dy * 920;
    player.boostTimer = 0.18;
    player.boostCooldown = 0.72;
    player.energy -= 22;
    camera.shake = Math.max(camera.shake, 5);
    burst(player.x, player.y, "#d6f43d", 16, 150);
  }

  function tryFire(team) {
    if (team === "player") {
      if (player.fireCooldown > 0 || gameState !== "playing") return;
      const dirX = Math.cos(player.angle);
      const dirY = Math.sin(player.angle);
      projectiles.push({
        x: player.x + dirX * 31,
        y: player.y + dirY * 31,
        vx: dirX * 850,
        vy: dirY * 850,
        r: 5,
        life: 1.15,
        damage: 15,
        team,
        color: "#d6f43d"
      });
      player.fireCooldown = 0.13;
      burst(player.x + dirX * 28, player.y + dirY * 28, "#d6f43d", 4, 70);
      return;
    }
  }

  function enemyFire(enemy) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const length = Math.hypot(dx, dy) || 1;
    projectiles.push({
      x: enemy.x + (dx / length) * 28,
      y: enemy.y + (dy / length) * 28,
      vx: (dx / length) * 450,
      vy: (dy / length) * 450,
      r: 6,
      life: 1.8,
      damage: 10,
      team: "enemy",
      color: "#fb7680"
    });
    burst(enemy.x, enemy.y, "#fb7680", 3, 50);
  }

  function updatePlayer(dt) {
    const input = getInput();
    aimPlayer();

    if (player.boostTimer > 0) {
      player.boostTimer -= dt;
      player.trailTimer -= dt;
      if (player.trailTimer <= 0) {
        particle(player.x, player.y, "#d6f43d", 0.45, 6, 0);
        player.trailTimer = 0.025;
      }
    } else {
      const acceleration = 1500;
      player.vx += input.x * acceleration * dt;
      player.vy += input.y * acceleration * dt;
      const damping = Math.pow(0.0009, dt);
      player.vx *= damping;
      player.vy *= damping;
      const topSpeed = 280;
      const speed = Math.hypot(player.vx, player.vy);
      if (speed > topSpeed) {
        player.vx = (player.vx / speed) * topSpeed;
        player.vy = (player.vy / speed) * topSpeed;
      }
    }

    moveCircle(player, player.vx * dt, player.vy * dt);
    player.energy = Math.min(100, player.energy + (player.boostTimer > 0 ? 4 : 19) * dt);
    player.boostCooldown = Math.max(0, player.boostCooldown - dt);
    player.fireCooldown = Math.max(0, player.fireCooldown - dt);
    player.hitTimer = Math.max(0, player.hitTimer - dt);

    if (pointer.down) tryFire("player");
  }

  function updateEnemies(dt) {
    for (const enemy of enemies) {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = Math.hypot(dx, dy) || 1;
      const nx = dx / distance;
      const ny = dy / distance;
      enemy.angle = Math.atan2(dy, dx);
      enemy.strafeTimer -= dt;
      if (enemy.strafeTimer <= 0) {
        enemy.strafe *= -1;
        enemy.strafeTimer = 0.8 + Math.random() * 1.1;
      }

      const desired = distance > 320 ? 165 : distance < 220 ? -115 : 35;
      const sideX = -ny * enemy.strafe * 80;
      const sideY = nx * enemy.strafe * 80;
      enemy.vx += (nx * desired + sideX - enemy.vx) * Math.min(1, dt * 3.8);
      enemy.vy += (ny * desired + sideY - enemy.vy) * Math.min(1, dt * 3.8);
      moveCircle(enemy, enemy.vx * dt, enemy.vy * dt);

      enemy.fireCooldown -= dt;
      enemy.hitTimer = Math.max(0, enemy.hitTimer - dt);
      if (distance < 610 && enemy.fireCooldown <= 0 && hasLineOfSight(enemy.x, enemy.y, player.x, player.y)) {
        enemyFire(enemy);
        enemy.fireCooldown = 0.65 + Math.random() * 0.35;
      }
    }
  }

  function updateProjectiles(dt) {
    for (let index = projectiles.length - 1; index >= 0; index -= 1) {
      const shot = projectiles[index];
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.life -= dt;

      if (shot.life <= 0 || pointInRectList(shot.x, shot.y, collisionRects)) {
        projectiles.splice(index, 1);
        continue;
      }

      if (shot.team === "player") {
        const target = enemies.find((enemy) => distanceBetween(shot, enemy) < shot.r + enemy.r);
        if (target) {
          target.health -= shot.damage;
          target.hitTimer = 0.12;
          camera.shake = Math.max(camera.shake, 2);
          burst(target.x, target.y, "#d6f43d", 7, 105);
          projectiles.splice(index, 1);
          if (target.health <= 0) {
            burst(target.x, target.y, "#fb7680", 28, 240);
            enemies = enemies.filter((enemy) => enemy !== target);
            score += 1;
            messageTimer = 0.8;
          }
        }
      } else if (distanceBetween(shot, player) < shot.r + player.r) {
        player.health = Math.max(0, player.health - shot.damage);
        player.hitTimer = 0.16;
        flash = 0.22;
        camera.shake = Math.max(camera.shake, 8);
        burst(player.x, player.y, "#fb7680", 10, 120);
        projectiles.splice(index, 1);
      }
    }
  }

  function updateParticles(dt) {
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const item = particles[index];
      item.x += item.vx * dt;
      item.y += item.vy * dt;
      item.vx *= Math.pow(0.05, dt);
      item.vy *= Math.pow(0.05, dt);
      item.life -= dt;
      if (item.life <= 0) particles.splice(index, 1);
    }
  }

  function moveCircle(entity, dx, dy) {
    const previousX = entity.x;
    entity.x = clamp(entity.x + dx, entity.r, world.width - entity.r);
    if (circleHitsRect(entity, collisionRects)) entity.x = previousX;

    const previousY = entity.y;
    entity.y = clamp(entity.y + dy, entity.r, world.height - entity.r);
    if (circleHitsRect(entity, collisionRects)) entity.y = previousY;
  }

  function circleHitsRect(circle, rects) {
    return rects.some((rect) => {
      const nearestX = clamp(circle.x, rect.x, rect.x + rect.w);
      const nearestY = clamp(circle.y, rect.y, rect.y + rect.h);
      const dx = circle.x - nearestX;
      const dy = circle.y - nearestY;
      return dx * dx + dy * dy < circle.r * circle.r;
    });
  }

  function pointInRectList(x, y, rects) {
    return rects.some((rect) => x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h);
  }

  function hasLineOfSight(x1, y1, x2, y2) {
    const steps = 18;
    for (let step = 1; step < steps; step += 1) {
      const t = step / steps;
      if (pointInRectList(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, collisionRects)) return false;
    }
    return true;
  }

  function distanceBetween(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function particle(x, y, color, life, speed, size) {
    const angle = Math.random() * Math.PI * 2;
    const actualSpeed = speed || 85 + Math.random() * 95;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * actualSpeed,
      vy: Math.sin(angle) * actualSpeed,
      color,
      life,
      maxLife: life,
      size: size || 2 + Math.random() * 3
    });
  }

  function burst(x, y, color, count, speed) {
    for (let index = 0; index < count; index += 1) {
      particle(x, y, color, 0.2 + Math.random() * 0.45, speed || 100, 2 + Math.random() * 3);
    }
  }

  function updateHud() {
    healthFill.style.width = `${player.health}%`;
    energyFill.style.width = `${player.energy}%`;
    healthText.textContent = `${Math.ceil(player.health)} / 100`;
    energyText.textContent = `${Math.ceil(player.energy)} / 100`;
    enemyText.textContent = String(enemies.length).padStart(2, "0");
    scoreText.textContent = String(score).padStart(3, "0");
    objectiveText.textContent = enemies.length === 0
      ? "District secured."
      : messageTimer > 0
        ? "Hostile drone eliminated."
        : "Clear the training district.";
  }

  function updateCamera(dt) {
    camera.x += (player.x - view.width / 2 - camera.x) * Math.min(1, dt * 6);
    camera.y += (player.y - view.height / 2 - camera.y) * Math.min(1, dt * 6);
    camera.x = clamp(camera.x, 0, world.width - view.width);
    camera.y = clamp(camera.y, 0, world.height - view.height);
    camera.shake = Math.max(0, camera.shake - dt * 24);
  }

  function update(dt) {
    if (gameState !== "playing") return;
    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updateCamera(dt);
    flash = Math.max(0, flash - dt);
    messageTimer = Math.max(0, messageTimer - dt);
    if (player.health <= 0) showEndState(false);
    if (enemies.length === 0) showEndState(true);
    updateHud();
  }

  function draw() {
    ctx.clearRect(0, 0, view.width, view.height);
    const shakeX = camera.shake ? (Math.random() - 0.5) * camera.shake : 0;
    const shakeY = camera.shake ? (Math.random() - 0.5) * camera.shake : 0;
    ctx.save();
    ctx.translate(-camera.x + shakeX, -camera.y + shakeY);
    drawGround();
    drawArena();
    for (const shot of projectiles) drawProjectile(shot);
    for (const enemy of enemies) drawEnemy(enemy);
    drawPlayer();
    for (const item of particles) drawParticle(item);
    ctx.restore();

    if (flash > 0) {
      ctx.fillStyle = `rgba(241, 91, 102, ${flash * 0.55})`;
      ctx.fillRect(0, 0, view.width, view.height);
    }

    if (gameState === "playing") drawCrosshair();
  }

  function drawGround() {
    ctx.fillStyle = "#172631";
    ctx.fillRect(0, 0, world.width, world.height);
    ctx.strokeStyle = "rgba(146, 184, 201, 0.12)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= world.width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, world.height);
      ctx.stroke();
    }
    for (let y = 0; y <= world.height; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(world.width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(214, 244, 61, 0.18)";
    ctx.lineWidth = 4;
    ctx.strokeRect(55, 55, world.width - 110, world.height - 110);
  }

  function drawArena() {
    for (const building of buildings) {
      ctx.fillStyle = "#0d161e";
      ctx.fillRect(building.x + 12, building.y + 12, building.w, building.h);
      ctx.fillStyle = building.color;
      ctx.fillRect(building.x, building.y, building.w, building.h);
      ctx.strokeStyle = "#567080";
      ctx.lineWidth = 2;
      ctx.strokeRect(building.x, building.y, building.w, building.h);
      ctx.fillStyle = "rgba(183, 222, 235, 0.13)";
      for (let x = building.x + 22; x < building.x + building.w - 18; x += 45) {
        for (let y = building.y + 22; y < building.y + building.h - 18; y += 45) {
          ctx.fillRect(x, y, 18, 10);
        }
      }
    }
    for (const block of cover) {
      ctx.fillStyle = "#182630";
      ctx.fillRect(block.x + 7, block.y + 8, block.w, block.h);
      ctx.fillStyle = "#5d7581";
      ctx.fillRect(block.x, block.y, block.w, block.h);
      ctx.strokeStyle = "#a1c4ce";
      ctx.strokeRect(block.x, block.y, block.w, block.h);
    }

    ctx.fillStyle = "rgba(214, 244, 61, 0.08)";
    ctx.beginPath();
    ctx.arc(1200, 1210, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(214, 244, 61, 0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawPlayer() {
    drawMecha(player, "#d6f43d", "#2a3a19", player.hitTimer > 0 ? "#ffffff" : null);
    if (player.boostCooldown > 0) {
      ctx.strokeStyle = "rgba(214, 244, 61, 0.55)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r + 9, -Math.PI / 2, -Math.PI / 2 + (1 - player.boostCooldown / 0.72) * Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawEnemy(enemy) {
    drawMecha(enemy, "#fb7680", "#4b2832", enemy.hitTimer > 0 ? "#ffffff" : null);
    const width = 48;
    ctx.fillStyle = "rgba(8, 17, 23, 0.8)";
    ctx.fillRect(enemy.x - width / 2, enemy.y - 44, width, 5);
    ctx.fillStyle = "#fb7680";
    ctx.fillRect(enemy.x - width / 2, enemy.y - 44, width * Math.max(0, enemy.health) / enemy.maxHealth, 5);
  }

  function drawMecha(unit, accent, dark, hitColor) {
    ctx.save();
    ctx.translate(unit.x, unit.y);
    ctx.rotate(unit.angle);
    ctx.fillStyle = "rgba(4, 10, 15, 0.45)";
    ctx.beginPath();
    ctx.ellipse(0, 12, unit.r + 10, unit.r * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = hitColor || dark;
    ctx.fillRect(-20, -17, 38, 34);
    ctx.fillStyle = hitColor || accent;
    ctx.fillRect(-8, -24, 20, 17);
    ctx.fillRect(17, -5, 26, 10);
    ctx.fillRect(-27, -14, 10, 28);
    ctx.fillStyle = "#101b21";
    ctx.fillRect(-18, 15, 12, 16);
    ctx.fillRect(7, 15, 12, 16);
    ctx.fillStyle = hitColor || "#dff8ff";
    ctx.fillRect(0, -19, 12, 5);
    ctx.restore();
  }

  function drawProjectile(shot) {
    ctx.fillStyle = shot.color;
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, shot.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = shot.color;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(shot.x, shot.y);
    ctx.lineTo(shot.x - shot.vx * 0.035, shot.y - shot.vy * 0.035);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawParticle(item) {
    ctx.globalAlpha = Math.max(0, item.life / item.maxLife);
    ctx.fillStyle = item.color;
    ctx.fillRect(item.x - item.size / 2, item.y - item.size / 2, item.size, item.size);
    ctx.globalAlpha = 1;
  }

  function drawCrosshair() {
    const x = pointer.x;
    const y = pointer.y;
    ctx.save();
    ctx.strokeStyle = "#dff8ff";
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.moveTo(x - 16, y);
    ctx.lineTo(x - 5, y);
    ctx.moveTo(x + 5, y);
    ctx.lineTo(x + 16, y);
    ctx.moveTo(x, y - 16);
    ctx.lineTo(x, y - 5);
    ctx.moveTo(x, y + 5);
    ctx.lineTo(x, y + 16);
    ctx.stroke();
    ctx.restore();
  }

  function frame(time) {
    const dt = Math.min(0.033, (time - lastTime) / 1000);
    lastTime = time;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  canvas.addEventListener("pointermove", updatePointer);
  canvas.addEventListener("pointerdown", (event) => {
    updatePointer(event);
    if (event.pointerType === "mouse") pointer.down = true;
  });
  window.addEventListener("pointerup", () => { pointer.down = false; });
  window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
    keys.add(event.code);
    if ((event.code === "ShiftLeft" || event.code === "ShiftRight" || event.code === "Space") && !event.repeat) requestBoost();
    if (event.code === "KeyR" && !event.repeat) startOrRestart();
  });
  window.addEventListener("keyup", (event) => keys.delete(event.code));

  function updateTouchMove(event) {
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const length = Math.hypot(dx, dy) || 1;
    const cap = rect.width * 0.34;
    const amount = Math.min(cap, length);
    touchMove.x = (dx / length) * (amount / cap);
    touchMove.y = (dy / length) * (amount / cap);
    stick.style.transform = `translate(${touchMove.x * cap}px, ${touchMove.y * cap}px)`;
  }

  joystick.addEventListener("pointerdown", (event) => {
    touchMove.active = true;
    joystick.setPointerCapture(event.pointerId);
    updateTouchMove(event);
  });
  joystick.addEventListener("pointermove", (event) => {
    if (touchMove.active) updateTouchMove(event);
  });
  function resetTouchMove() {
    touchMove.active = false;
    touchMove.x = 0;
    touchMove.y = 0;
    stick.style.transform = "translate(0, 0)";
  }
  joystick.addEventListener("pointerup", resetTouchMove);
  joystick.addEventListener("pointercancel", resetTouchMove);

  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse") {
      canvas.setPointerCapture(event.pointerId);
      touchAim.active = true;
      updateTouchAim(event);
    }
  });
  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" && touchAim.active) updateTouchAim(event);
  });
  canvas.addEventListener("pointerup", () => { touchAim.active = false; });
  canvas.addEventListener("pointercancel", () => { touchAim.active = false; });

  function updateTouchAim(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * view.width;
    const y = (event.clientY - rect.top) / rect.height * view.height;
    const point = screenToWorld(x, y);
    const dx = point.x - player.x;
    const dy = point.y - player.y;
    const length = Math.hypot(dx, dy) || 1;
    touchAim.x = dx / length;
    touchAim.y = dy / length;
  }

  fireButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    pointer.down = true;
    fireButton.setPointerCapture(event.pointerId);
  });
  fireButton.addEventListener("pointerup", () => { pointer.down = false; });
  fireButton.addEventListener("pointercancel", () => { pointer.down = false; });
  boostButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    requestBoost();
  });

  startButton.addEventListener("click", startOrRestart);
  restartButton.addEventListener("click", startOrRestart);

  enemies = createEnemies();
  updateHud();
  if (new URLSearchParams(window.location.search).has("autostart")) resetGame();
  requestAnimationFrame(frame);
})();
