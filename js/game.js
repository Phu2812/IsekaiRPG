let player = {};
let enemy = null;
let currentArea = null;
let storyIdx = 0;
let isPlayerTurn = true;
let isDefending = false;
let enemyDebuff = 0; // % reduction
let resultRewards = {};
let battleTimeout = null;

// ============ NAVIGATION ============
function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + screenId).classList.add('active');
}

// ============ INIT PLAYER ============
function initPlayer(name, cls) {
  const c = CLASSES[cls];
  player = {
    name, cls,
    level: 1, xp: 0, xpNext: 100,
    gold: 0,
    hp: c.baseHP, maxHP: c.baseHP,
    mp: c.baseMP, maxMP: c.baseMP,
    atk: c.baseATK, def: c.baseDEF,
    baseAtk: c.baseATK, baseDef: c.baseDEF,
    baseMaxHP: c.baseHP, baseMaxMP: c.baseMP,
    equip: { weapon: null, armor: null, ring: null },
    owned: [],
  };
}

function levelUp() {
  player.level++;
  player.xpNext = Math.floor(player.xpNext * 1.5);
  recalcStats();
  // Hồi full HP/MP khi lên cấp
  player.hp = player.maxHP;
  player.mp = player.maxMP;
  addLog(`✨ Lên cấp! Bây giờ là Lv.${player.level}!`, 'sys');
}

// ============ NAME SCREEN ============
function confirmName() {
  const v = document.getElementById('name-input').value.trim();
  if (!v) { document.getElementById('name-input').placeholder = 'Nhập tên đi bạn ơi...'; return; }
  player.pendingName = v;
  goTo('class');
}

// ============ CLASS SELECT ============
function selectClass(cls) {
  document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  setTimeout(() => {
    initPlayer(player.pendingName, cls);
    storyIdx = 0;
    showStory();
    goTo('story');
  }, 300);
}

// ============ STORY ============
let typeInterval = null;
let currentTypeText = '';
let typeElId = '';

function showStory() {
  const s = STORY_LINES[storyIdx];
  document.getElementById('story-art').textContent = s.art;
  document.getElementById('story-speaker').textContent = s.speaker;
  typeText('story-text', s.text);
}

function typeText(elId, text) {
  if (typeInterval) { clearInterval(typeInterval); typeInterval = null; }
  currentTypeText = text;
  typeElId = elId;
  const el = document.getElementById(elId);
  el.textContent = '';
  let i = 0;
  typeInterval = setInterval(() => {
    i++;
    el.textContent = text.slice(0, i);
    if (i >= text.length) {
      clearInterval(typeInterval);
      typeInterval = null;
    }
  }, 28);
}

function nextStory() {
  if (typeInterval) {
    clearInterval(typeInterval);
    typeInterval = null;
    document.getElementById(typeElId).textContent = currentTypeText;
    return;
  }
  storyIdx++;
  if (storyIdx >= STORY_LINES.length) {
    // Slide cuối → vào tutorial battle
    startTutorialBattle();
  } else {
    showStory();
  }
}

// ============ EQUIP / STATS ============
function recalcStats() {
  const c = CLASSES[player.cls];
  const lv = player.level - 1;
  let baseAtk = c.baseATK + lv * c.atkPerLv;
  let baseDef = c.baseDEF + lv * c.defPerLv;
  let bonusHP = 0, bonusMP = 0, bonusAtk = 0, bonusDef = 0;
  ['weapon','armor','ring'].forEach(slot => {
    const item = player.equip[slot];
    if (item) { bonusAtk += item.atk; bonusDef += item.def; bonusHP += item.hp; bonusMP += item.mp; }
  });
  player.atk = baseAtk + bonusAtk;
  player.def = baseDef + bonusDef;
  const baseMaxHP = c.baseHP + lv * c.hpPerLv;
  const baseMaxMP = c.baseMP + lv * c.mpPerLv;
  const prevMaxHP = player.maxHP;
  const prevMaxMP = player.maxMP;
  player.maxHP = baseMaxHP + bonusHP;
  player.maxMP = baseMaxMP + bonusMP;
  // scale current HP/MP proportionally
  player.hp = Math.min(player.hp + (player.maxHP - prevMaxHP), player.maxHP);
  player.mp = Math.min(player.mp + (player.maxMP - prevMaxMP), player.maxMP);
}

function openStats() {
  const mpRegen = Math.floor(player.maxMP * 0.12);
  const slots = [
    { icon:'❤️', label:'HP', val:`${player.hp}/${player.maxHP}`, sub:'' },
    { icon:'💧', label:'MP', val:`${player.mp}/${player.maxMP}`, sub:`+${mpRegen}/lượt` },
    { icon:'⚔️', label:'ATK', val:player.atk, sub:'sát thương' },
    { icon:'🛡️', label:'DEF', val:player.def, sub:'giảm dame' },
    { icon:'⭐', label:'LV', val:player.level, sub:`${player.xp}/${player.xpNext} XP` },
    { icon:'💰', label:'Gold', val:player.gold, sub:'tích lũy' },
  ];
  document.getElementById('stats-grid').innerHTML = slots.map(s => `
    <div class="stat-card">
      <div class="s-icon">${s.icon}</div>
      <div class="s-label">${s.label}</div>
      <div class="s-val">${s.val}</div>
      ${s.sub ? `<div class="s-sub">${s.sub}</div>` : ''}
    </div>
  `).join('');

  const slotNames = { weapon:'🗡️ Vũ khí', armor:'🛡️ Giáp', ring:'💍 Nhẫn' };
  document.getElementById('equip-slots').innerHTML = ['weapon','armor','ring'].map(slot => {
    const item = player.equip[slot];
    return `<div class="equip-row">
      <div class="equip-icon">${item ? item.icon : '—'}</div>
      <div class="equip-info">
        <div class="equip-slot-name">${slotNames[slot]}</div>
        <div class="equip-item-name">${item ? item.name : 'Trống'}</div>
        ${item ? `<div class="equip-bonus">${item.bonus}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  document.getElementById('modal-stats').classList.add('active');
}

function openShop() {
  document.getElementById('shop-gold').textContent = `💰 Gold: ${player.gold}`;
  document.getElementById('shop-items').innerHTML = SHOP_ITEMS.map(item => {
    const isOwned = player.owned.includes(item.id);
    const isEquipped = player.equip[item.slot]?.id === item.id;
    const cantAfford = !isOwned && player.gold < item.price;
    let cls = isOwned ? 'owned' : (cantAfford ? 'cant-afford' : '');
    let priceEl = isOwned
      ? `<div class="shop-item-price owned-tag">${isEquipped ? '✅ Đang mặc' : '✔ Đã mua'}</div>`
      : `<div class="shop-item-price">${item.price}💰</div>`;
    return `<div class="shop-item ${cls}" onclick="buyOrEquip('${item.id}')">
      <div class="shop-item-icon">${item.icon}</div>
      <div class="shop-item-info">
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-desc">${item.desc}</div>
        <div class="shop-item-bonus">${item.bonus}</div>
      </div>
      ${priceEl}
    </div>`;
  }).join('');
  document.getElementById('modal-shop').classList.add('active');
}

function buyOrEquip(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;
  if (player.owned.includes(itemId)) {
    // Trang bị / tháo
    if (player.equip[item.slot]?.id === itemId) {
      player.equip[item.slot] = null;
    } else {
      player.equip[item.slot] = item;
    }
    recalcStats();
    openShop();
    updateMapBars();
    return;
  }
  if (player.gold < item.price) return;
  player.gold -= item.price;
  player.owned.push(itemId);
  player.equip[item.slot] = item;
  recalcStats();
  openShop();
  updateMapBars();
}

function closeModal(name) {
  document.getElementById('modal-' + name).classList.remove('active');
}

// ============ MAP ============
function showMap() {
  document.getElementById('map-player-name').textContent = player.name;
  document.getElementById('map-class-badge').textContent = CLASSES[player.cls].nameVi;
  document.getElementById('map-level-badge').textContent = `Lv.${player.level}`;
  updateMapBars();

  const grid = document.getElementById('map-areas');
  grid.innerHTML = '';
  AREAS.forEach(area => {
    const locked = player.level < area.minLv;
    const card = document.createElement('div');
    card.className = 'area-card' + (locked ? ' locked' : '');
    card.innerHTML = `<div class="area-icon">${area.icon}</div><div class="area-name">${area.name}</div><div class="area-level">${area.level}</div>`;
    if (!locked) card.onclick = () => startAreaBattle(area);
    grid.appendChild(card);
  });
}

function updateMapBars() {
  const hp = player.hp / player.maxHP * 100;
  const xp = player.xp / player.xpNext * 100;
  document.getElementById('map-hp-bar').style.width = hp + '%';
  document.getElementById('map-hp-val').textContent = `${player.hp}/${player.maxHP}`;
  document.getElementById('map-xp-bar').style.width = xp + '%';
  document.getElementById('map-xp-val').textContent = `${player.xp}/${player.xpNext}`;
}

// ============ BATTLE ============
function startAreaBattle(area) {
  currentArea = area;
  const eKey = area.enemies[Math.floor(Math.random() * area.enemies.length)];
  const eData = ENEMIES[eKey];
  // Scale enemy to area level
  const scale = 1 + (area.minLv - 1) * 0.3;
  enemy = {
    ...eData,
    hp: Math.floor(eData.hp * scale),
    maxHP: Math.floor(eData.hp * scale),
    atk: Math.floor(eData.atk * scale),
    def: eData.def,
    xp: Math.floor(eData.xp * scale),
    gold: Math.floor(eData.gold * scale),
  };

  isPlayerTurn = true;
  isDefending = false;
  enemyDebuff = 0;

  // Update battle UI
  document.getElementById('battle-player-name').textContent = player.name;
  document.getElementById('battle-class-badge').textContent = CLASSES[player.cls].nameVi;
  document.getElementById('battle-level-badge').textContent = `Lv.${player.level}`;
  document.getElementById('enemy-art').textContent = enemy.icon;
  document.getElementById('enemy-name').textContent = enemy.name;

  updateBattleBars();
  updateEnemyBar();

  const log = document.getElementById('battle-log');
  log.innerHTML = `<div class="log-entry sys">⚔️ ${enemy.name} xuất hiện!</div>`;

  buildSkills();
  setTurnUI(true);
  goTo('game');
}

function buildSkills() {
  const grid = document.getElementById('skills-grid');
  grid.innerHTML = '';
  CLASSES[player.cls].skills.forEach(sk => {
    const btn = document.createElement('div');
    btn.className = `skill-btn ${player.cls}`;
    btn.id = `skill-${sk.id}`;
    btn.innerHTML = `<span class="skill-icon">${sk.icon}</span><span class="skill-name">${sk.name}</span><span class="skill-mp">${sk.mp > 0 ? sk.mp + ' MP' : 'Miễn phí'}</span>`;
    btn.onclick = () => useSkill(sk);
    grid.appendChild(btn);
  });
}

function setTurnUI(playerTurn) {
  isPlayerTurn = playerTurn;
  const indicator = document.getElementById('turn-indicator');
  if (playerTurn) {
    indicator.innerHTML = 'Lượt của <span>bạn</span>';
    document.querySelectorAll('.skill-btn').forEach(b => b.removeAttribute('disabled'));
    // Disable skills with not enough MP
    CLASSES[player.cls].skills.forEach(sk => {
      if (player.mp < sk.mp) {
        const b = document.getElementById(`skill-${sk.id}`);
        if (b) b.setAttribute('disabled', true);
      }
    });
  } else {
    indicator.innerHTML = `Lượt của <span style="color:var(--red)">${enemy ? enemy.name : 'địch'}</span>`;
    document.querySelectorAll('.skill-btn').forEach(b => b.setAttribute('disabled', true));
  }
}

function updateBattleBars() {
  document.getElementById('hp-bar').style.width = (player.hp / player.maxHP * 100) + '%';
  document.getElementById('hp-val').textContent = `${player.hp}/${player.maxHP}`;
  document.getElementById('mp-bar').style.width = (player.mp / player.maxMP * 100) + '%';
  document.getElementById('mp-val').textContent = `${player.mp}/${player.maxMP}`;
}

function updateEnemyBar() {
  const pct = Math.max(0, enemy.hp / enemy.maxHP * 100);
  document.getElementById('enemy-hp-bar').style.width = pct + '%';
  document.getElementById('enemy-hp-text').textContent = `${Math.max(0,enemy.hp)} / ${enemy.maxHP}`;
}

function addLog(msg, type = '') {
  const log = document.getElementById('battle-log');
  const d = document.createElement('div');
  d.className = 'log-entry ' + type;
  d.textContent = msg;
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
}

function showDmgFloat(el, val, type='') {
  const f = document.createElement('div');
  f.className = 'dmg-float ' + type;
  f.textContent = (type === 'heal-f' ? '+' : '-') + val;
  const rect = el.getBoundingClientRect();
  f.style.left = (rect.left + rect.width/2 - 20) + 'px';
  f.style.top = (rect.top + window.scrollY) + 'px';
  f.style.position = 'fixed';
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 900);
}

function useSkill(sk) {
  if (!isPlayerTurn) return;
  if (player.mp < sk.mp) return;
  player.mp -= sk.mp;

  setTurnUI(false);
  isDefending = false;

  let dmg = 0;
  if (sk.type === 'physical') {
    const base = Math.floor(player.atk * sk.power);
    const variance = Math.floor(base * 0.15);
    dmg = base + Math.floor(Math.random() * variance * 2) - variance;
    const isCrit = (player.cls === 'rogue' && sk.id !== 'attack') && Math.random() < 0.35;
    if (isCrit) { dmg = Math.floor(dmg * 1.8); addLog(`💥 Chí mạng!`, 'sys'); }
    if (sk.id === 'reckless') { const selfDmg = Math.floor(player.atk * 0.3); player.hp = Math.max(1, player.hp - selfDmg); addLog(`😤 Tử chiến! Nhận ${selfDmg} dame phản.`, 'dmg'); }
    if (sk.id === 'combo') {
      // 3 hits
      let total = 0;
      for (let i = 0; i < 3; i++) {
        const h = Math.max(1, Math.floor(player.atk * 1.5) - enemy.def);
        total += h;
      }
      dmg = total;
      addLog(`⚡ Combo 3 đòn! Tổng ${dmg} dame!`, 'dmg');
    } else {
      const netDmg = Math.max(1, dmg - enemy.def);
      enemy.hp -= netDmg;
      addLog(`${sk.icon} ${sk.name}: Gây ${netDmg} dame cho ${enemy.name}!`, 'dmg');
      showDmgFloat(document.getElementById('enemy-art'), netDmg);
      document.getElementById('enemy-section').classList.add('shake');
      setTimeout(() => document.getElementById('enemy-section').classList.remove('shake'), 300);
      updateEnemyBar();
      updateBattleBars();
      checkEnemyDead(); return;
    }
    enemy.hp -= Math.max(1, dmg - enemy.def);
    updateEnemyBar();
    updateBattleBars();
    checkEnemyDead(); return;
  }

  if (sk.type === 'magic') {
    const base = Math.floor(player.atk * sk.power);
    dmg = base + Math.floor(Math.random() * 8) - 4;
    const netDmg = Math.max(1, dmg);
    enemy.hp -= netDmg;
    addLog(`${sk.icon} ${sk.name}: Phép ${netDmg} dame lên ${enemy.name}!`, 'dmg');
    showDmgFloat(document.getElementById('enemy-art'), netDmg);
    if (sk.id === 'blizzard' && Math.random() < 0.3) addLog('❄️ Địch bị đóng băng 1 lượt!', 'sys');
    document.getElementById('enemy-section').classList.add('shake');
    setTimeout(() => document.getElementById('enemy-section').classList.remove('shake'), 300);
    updateEnemyBar();
    updateBattleBars();
    checkEnemyDead(); return;
  }

  if (sk.type === 'heal') {
    const healAmt = Math.floor(player.atk * sk.power) + Math.floor(Math.random() * 10);
    player.hp = Math.min(player.maxHP, player.hp + healAmt);
    addLog(`${sk.icon} Hồi phục +${healAmt} HP!`, 'heal');
    showDmgFloat(document.getElementById('hp-bar'), healAmt, 'heal-f');
    updateBattleBars();
    setTimeout(() => enemyTurn(), 800);
    return;
  }

  if (sk.type === 'defend') {
    isDefending = true;
    addLog(`🛡️ Phòng thủ! Giảm 60% dame lượt này.`, 'sys');
    setTimeout(() => enemyTurn(), 800);
    return;
  }

  if (sk.type === 'debuff') {
    enemyDebuff = 0.3;
    addLog(`${sk.icon} ${enemy.name} bị yếu! ATK giảm 30%.`, 'sys');
    setTimeout(() => enemyTurn(), 800);
    return;
  }
}

function checkEnemyDead() {
  if (enemy.hp <= 0) {
    enemy.hp = 0;
    updateEnemyBar();
    setTimeout(() => showWin(), 600);
  } else {
    setTimeout(() => enemyTurn(), 900);
  }
}

function enemyTurn() {
  document.getElementById('turn-indicator').innerHTML = `Lượt của <span style="color:var(--red)">${enemy.name}</span>`;
  setTimeout(() => {
    let eAtk = Math.floor(enemy.atk * (1 - enemyDebuff));
    const eDmg = Math.max(1, eAtk - Math.floor(player.def * (isDefending ? 3 : 1)));
    player.hp = Math.max(0, player.hp - eDmg);
    addLog(`${enemy.icon} ${enemy.name} tấn công! Gây ${eDmg} dame.`, 'enemy-dmg');
    showDmgFloat(document.getElementById('hp-bar'), eDmg);
    document.getElementById('hp-bar').parentElement.parentElement.classList.add('shake');
    setTimeout(() => document.getElementById('hp-bar').parentElement.parentElement.classList.remove('shake'), 300);

    // Regen MP
    player.mp = Math.min(player.maxMP, player.mp + Math.floor(player.maxMP * 0.12));
    enemyDebuff = 0;
    updateBattleBars();

    if (player.hp <= 0) {
      setTimeout(() => showLose(), 500);
    } else {
      setTurnUI(true);
    }
  }, 400);
}

function showWin() {
  const wasTutorial = isTutorial;
  endTutorial();
  player.xp += enemy.xp;
  player.gold += enemy.gold;
  let lvUp = false;
  while (player.xp >= player.xpNext) {
    player.xp -= player.xpNext;
    levelUp();
    lvUp = true;
  }

  if (wasTutorial) {
    document.getElementById('result-art').textContent = '🌟';
    document.getElementById('result-title').className = 'result-title win';
    document.getElementById('result-title').textContent = 'Hoàn thành!';
    document.getElementById('result-desc').textContent = 'Ngươi đã hạ gục Slime Tutorial. Vị Thần gật đầu hài lòng. Cuộc phiêu lưu thật sự bắt đầu!';
    document.getElementById('result-rewards').innerHTML = `
      <div class="reward-row"><span class="reward-label">Gold nhận được</span><span class="reward-val">+${enemy.gold} 💰</span></div>
      <div class="reward-row"><span class="reward-label" style="color:var(--purple)">Tutorial</span><span class="reward-val" style="color:var(--purple)">Hoàn thành ✓</span></div>
    `;
    document.getElementById('result-btn').textContent = 'Vào thế giới →';
    goTo('result');
    return;
  }

  resultRewards = { xp: enemy.xp, gold: enemy.gold, lvUp };
  document.getElementById('result-art').textContent = lvUp ? '⬆️' : '🏆';
  document.getElementById('result-title').className = 'result-title win';
  document.getElementById('result-title').textContent = lvUp ? 'Lên Cấp!' : 'Chiến Thắng!';
  document.getElementById('result-desc').textContent = `${enemy.name} đã bị đánh bại!`;
  document.getElementById('result-rewards').innerHTML = `
    <div class="reward-row"><span class="reward-label">XP nhận được</span><span class="reward-val">+${enemy.xp}</span></div>
    <div class="reward-row"><span class="reward-label">Gold nhận được</span><span class="reward-val">+${enemy.gold} 💰</span></div>
    ${lvUp ? `<div class="reward-row"><span class="reward-label" style="color:var(--gold)">Level mới</span><span class="reward-val">Lv.${player.level}!</span></div>` : ''}
  `;
  document.getElementById('result-btn').textContent = 'Quay về bản đồ';
  goTo('result');
}

function showLose() {
  document.getElementById('result-art').textContent = '💀';
  document.getElementById('result-title').className = 'result-title lose';
  document.getElementById('result-title').textContent = 'Thất Bại...';
  document.getElementById('result-desc').textContent = `${player.name} đã ngã xuống. Nhưng cuộc phiêu lưu chưa kết thúc — hãy đứng dậy!`;
  document.getElementById('result-rewards').innerHTML = `
    <div class="reward-row"><span class="reward-label">HP còn lại</span><span class="reward-val" style="color:var(--red)">0</span></div>
    <div class="reward-row"><span class="reward-label">HP hồi phục</span><span class="reward-val">30%</span></div>
  `;
  player.hp = Math.floor(player.maxHP * 0.3);
  player.mp = player.maxMP;
  document.getElementById('result-btn').textContent = 'Tiếp tục...';
  goTo('result');
}

function afterBattle() {
  showMap();
  goTo('map');
}

function fleeBattle() {
  player.hp = Math.max(1, player.hp - Math.floor(player.maxHP * 0.1));
  player.mp = Math.min(player.maxMP, player.mp + 10);
  showMap();
  goTo('map');
}

// ============ TUTORIAL BATTLE ============
let isTutorial = false;
let tutStep = 0;

const TUT_STEPS = [
  {
    targetId: 'enemy-section',
    arrow: '👆 KẺ ĐỊCH',
    text: 'Đây là Slime Tutorial — kẻ địch đầu tiên của ngươi. Thanh đỏ phía dưới là HP của nó. Đưa HP về 0 để thắng!',
  },
  {
    targetId: 'hp-bar',
    arrow: '❤️ HP & MP CỦA NGƯƠI',
    text: 'Thanh đỏ là HP (máu) — về 0 là thua. Thanh xanh là MP — dùng để thi triển kỹ năng, tự hồi mỗi lượt.',
  },
  {
    targetId: 'battle-log',
    arrow: '📜 NHẬT KÝ CHIẾN ĐẤU',
    text: 'Mọi diễn biến trận đánh hiện ở đây — dame gây ra, dame nhận, hiệu ứng kỹ năng. Theo dõi để đưa ra quyết định!',
  },
  {
    targetId: 'skills-grid',
    arrow: '⚔️ KỸ NĂNG',
    text: 'Đây là các kỹ năng của ngươi. Số MP bên dưới là chi phí. Skill màu xám là không đủ MP. Hãy chọn một kỹ năng để tấn công Slime!',
    isLast: true,
  },
];

function startTutorialBattle() {
  isTutorial = true;
  tutStep = 0;

  // Setup tutorial slime — rất yếu
  enemy = {
    name: 'Slime Tutorial', icon: '🟢',
    hp: 20, maxHP: 20,
    atk: 2, def: 0,
    xp: 0, gold: 30,
  };

  isPlayerTurn = true;
  isDefending = false;
  enemyDebuff = 0;

  document.getElementById('battle-player-name').textContent = player.name;
  document.getElementById('battle-class-badge').textContent = CLASSES[player.cls].nameVi;
  document.getElementById('battle-level-badge').textContent = `Lv.${player.level}`;
  document.getElementById('enemy-art').textContent = enemy.icon;
  document.getElementById('enemy-name').textContent = enemy.name;

  updateBattleBars();
  updateEnemyBar();

  const log = document.getElementById('battle-log');
  log.innerHTML = `<div class="log-entry sys">✨ Vị Thần triệu hồi một Slime yếu để luyện tập!</div>`;

  buildSkills();
  // Disable skill buttons during tutorial tooltip
  document.querySelectorAll('.skill-btn').forEach(b => b.setAttribute('disabled', true));

  goTo('game');

  // Delay nhỏ để screen render xong rồi mới show tooltip
  setTimeout(() => showTutStep(0), 400);
}

function showTutStep(idx) {
  const step = TUT_STEPS[idx];
  const overlay = document.getElementById('tut-overlay');
  const highlight = document.getElementById('tut-highlight');
  const bubble = document.getElementById('tut-bubble');

  overlay.classList.add('active');

  // Highlight target element
  const target = document.getElementById(step.targetId);
  if (target) {
    const rect = target.getBoundingClientRect();
    const pad = 6;
    highlight.style.left = (rect.left - pad) + 'px';
    highlight.style.top = (rect.top + window.scrollY - pad) + 'px';
    highlight.style.width = (rect.width + pad * 2) + 'px';
    highlight.style.height = (rect.height + pad * 2) + 'px';
  }

  // Position bubble — trên hoặc dưới target
  const targetRect = target ? target.getBoundingClientRect() : { top: 200, left: 20, bottom: 300 };
  const bubbleTop = targetRect.bottom + 16 < window.innerHeight - 160
    ? targetRect.bottom + window.scrollY + 16
    : targetRect.top + window.scrollY - 160;

  bubble.style.top = Math.max(8, bubbleTop) + 'px';
  bubble.style.left = '16px';
  bubble.style.right = '16px';
  bubble.style.maxWidth = 'calc(100% - 32px)';

  document.getElementById('tut-arrow').textContent = '💡 ' + step.arrow;
  document.getElementById('tut-text').textContent = step.text;
  document.getElementById('tut-step-ind').textContent = `${idx + 1} / ${TUT_STEPS.length}`;
  document.getElementById('tut-btn').textContent = step.isLast ? 'Bắt đầu chiến đấu! ⚔️' : 'Hiểu rồi →';
}

function nextTutStep() {
  tutStep++;
  if (tutStep >= TUT_STEPS.length) {
    // Đóng tutorial, mở skill buttons
    document.getElementById('tut-overlay').classList.remove('active');
    setTurnUI(true);
  } else {
    showTutStep(tutStep);
  }
}

function endTutorial() {
  isTutorial = false;
  document.getElementById('tut-overlay').classList.remove('active');
}

function resetGame() {
  player = {};
  enemy = null;
  typeInterval && clearInterval(typeInterval);
  typeInterval = null;
  document.getElementById('name-input').value = '';
}
