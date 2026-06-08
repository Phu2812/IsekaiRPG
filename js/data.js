

// ============ DATA ============
const CLASSES = {
  warrior: {
    name: 'Warrior', nameVi: 'Kiếm Sĩ', icon: '⚔️',
    baseHP: 120, baseMP: 30, baseATK: 18, baseDEF: 10,
    hpPerLv: 20, mpPerLv: 5, atkPerLv: 4, defPerLv: 2,
    skills: [
      { id:'attack', name:'Chém', icon:'⚔️', mp:0, type:'physical', power:1.0, desc:'Đòn tấn công cơ bản' },
      { id:'slash', name:'Trảm', icon:'🗡️', mp:8, type:'physical', power:1.8, desc:'Chém mạnh x1.8' },
      { id:'guard', name:'Phòng thủ', icon:'🛡️', mp:0, type:'defend', power:0, desc:'Giảm dame lượt này' },
      { id:'reckless', name:'Tử chiến', icon:'💥', mp:12, type:'physical', power:2.5, desc:'ATK x2.5, nhận thêm dame' },
    ]
  },
  mage: {
    name: 'Mage', nameVi: 'Pháp Sư', icon: '🔮',
    baseHP: 75, baseMP: 80, baseATK: 22, baseDEF: 5,
    hpPerLv: 12, mpPerLv: 12, atkPerLv: 5, defPerLv: 1,
    skills: [
      { id:'attack', name:'Địa lôi', icon:'⚡', mp:4, type:'magic', power:1.0, desc:'Phép tấn công cơ bản' },
      { id:'fireball', name:'Hỏa cầu', icon:'🔥', mp:15, type:'magic', power:2.0, desc:'Cầu lửa x2.0' },
      { id:'heal', name:'Hồi phục', icon:'💚', mp:12, type:'heal', power:0.4, desc:'Hồi HP 40% ATK' },
      { id:'blizzard', name:'Băng bão', icon:'❄️', mp:25, type:'magic', power:3.2, desc:'Bão tuyết x3.2, chance freeze' },
    ]
  },
  rogue: {
    name: 'Rogue', nameVi: 'Thích Khách', icon: '🗡️',
    baseHP: 90, baseMP: 50, baseATK: 20, baseDEF: 7,
    hpPerLv: 15, mpPerLv: 8, atkPerLv: 5, defPerLv: 1,
    skills: [
      { id:'attack', name:'Đâm', icon:'🗡️', mp:0, type:'physical', power:1.0, desc:'Đòn tấn công cơ bản' },
      { id:'backstab', name:'Ám sát', icon:'🌑', mp:10, type:'physical', power:2.2, desc:'Crit cao x2.2' },
      { id:'smoke', name:'Khói độc', icon:'💨', mp:8, type:'debuff', power:0, desc:'Giảm ATK địch 30%' },
      { id:'combo', name:'Combo', icon:'⚡', mp:18, type:'physical', power:1.5, desc:'3 đòn liên tiếp x1.5 mỗi đòn' },
    ]
  }
};

const AREAS = [
  { id:'forest', name:'Rừng Xanh', icon:'🌲', level:'Lv 1-3', minLv:1, enemies:['goblin','slime','wolf'] },
  { id:'cave', name:'Hang Động', icon:'🌑', level:'Lv 3-6', minLv:3, enemies:['bat','golem','spider'] },
  { id:'ruins', name:'Phế Tích', icon:'🏚️', level:'Lv 6-10', minLv:6, enemies:['skeleton','zombie','ghost'] },
  { id:'castle', name:'Lâu Đài', icon:'🏰', level:'Lv 10+', minLv:10, enemies:['knight','dragon','demon'] },
];

const ENEMIES = {
  goblin: { name:'Goblin', icon:'👺', hp:40, atk:8, def:2, xp:20, gold:10 },
  slime: { name:'Slime', icon:'🟢', hp:30, atk:6, def:5, xp:15, gold:8 },
  wolf: { name:'Sói Xám', icon:'🐺', hp:55, atk:12, def:3, xp:30, gold:15 },
  bat: { name:'Dơi Quỷ', icon:'🦇', hp:50, atk:14, def:4, xp:35, gold:18 },
  golem: { name:'Thổ Tinh', icon:'🪨', hp:100, atk:10, def:15, xp:50, gold:30 },
  spider: { name:'Nhện Độc', icon:'🕷️', hp:65, atk:16, def:5, xp:40, gold:22 },
  skeleton: { name:'Bộ Xương', icon:'💀', hp:80, atk:18, def:8, xp:60, gold:35 },
  zombie: { name:'Xác Sống', icon:'🧟', hp:110, atk:15, def:6, xp:55, gold:32 },
  ghost: { name:'Hồn Ma', icon:'👻', hp:70, atk:22, def:10, xp:70, gold:40 },
  knight: { name:'Kỵ Sĩ Bóng Tối', icon:'⚔️', hp:150, atk:28, def:18, xp:100, gold:60 },
  dragon: { name:'Rồng Đỏ', icon:'🐉', hp:200, atk:35, def:12, xp:150, gold:100 },
  demon: { name:'Ác Ma', icon:'😈', hp:180, atk:40, def:20, xp:180, gold:120 },
};

const STORY_LINES = [
  { speaker:'Vị Thần', art:'✨', text:'...Ngươi đã chết tại thế giới cũ. Nhưng ta thấy trong mắt ngươi còn lửa chưa tắt.' },
  { speaker:'Vị Thần', art:'🌟', text:'Ta sẽ cho ngươi một cơ hội — tái sinh tại dị giới. Nhưng đây không phải nghỉ dưỡng. Đây là chiến trường.' },
  { speaker:'Vị Thần', art:'⚡', text:'Ngươi sẽ bắt đầu từ con số không. Yếu ớt, vô danh. Nhưng tiềm năng của ngươi... vô hạn.' },
  { speaker:'Vị Thần', art:'❤️', text:'Hãy nghe ta — mỗi sinh linh có HP (máu) và MP (năng lượng). HP về 0 là ngươi ngã xuống. MP dùng để thi triển kỹ năng, tự hồi sau mỗi lượt.' },
  { speaker:'Vị Thần', art:'⚔️', text:'Chiến đấu theo lượt — ngươi ra đòn trước, rồi đến địch. Chọn kỹ năng phù hợp: tấn công, phòng thủ, hay hồi máu.' },
  { speaker:'Vị Thần', art:'🛡️', text:'DEF (phòng thủ) giảm dame nhận vào. Kỹ năng Phòng Thủ sẽ nhân DEF lên 3 lần trong một lượt — dùng khi địch mạnh.' },
  { speaker:'Vị Thần', art:'🏪', text:'Sau mỗi trận thắng, ngươi nhận gold. Mang đến Shop để mua vũ khí, giáp, nhẫn — trang bị tốt thay đổi cuộc chơi hoàn toàn.' },
  { speaker:'Vị Thần', art:'🌅', text:'Đủ rồi. Lời nói không bằng trải nghiệm. Ta sẽ triệu hồi một Slime nhỏ — hãy tự tay cảm nhận chiến đấu.' },
];

const STORY_TUTORIAL_START = 7; // index của slide cuối → trigger tutorial battle

// ============ SHOP DATA ============
const SHOP_ITEMS = [
  // Vũ khí
  { id:'iron_sword', slot:'weapon', name:'Kiếm Sắt', icon:'⚔️', desc:'Vũ khí cơ bản của dị giới', bonus:'+8 ATK', atk:8, def:0, hp:0, mp:0, price:50 },
  { id:'steel_sword', slot:'weapon', name:'Kiếm Thép', icon:'🗡️', desc:'Lưỡi kiếm sắc bén', bonus:'+18 ATK', atk:18, def:0, hp:0, mp:0, price:150 },
  { id:'magic_staff', slot:'weapon', name:'Trượng Phép', icon:'🪄', desc:'Khuếch đại phép thuật', bonus:'+12 ATK, +20 MP', atk:12, def:0, hp:0, mp:20, price:180 },
  { id:'dark_blade', slot:'weapon', name:'Kiếm Tối', icon:'🌑', desc:'Hấp thụ bóng tối', bonus:'+25 ATK', atk:25, def:0, hp:0, mp:0, price:300 },
  // Giáp
  { id:'leather_armor', slot:'armor', name:'Giáp Da', icon:'🧥', desc:'Nhẹ nhàng, linh hoạt', bonus:'+6 DEF', atk:0, def:6, hp:0, mp:0, price:60 },
  { id:'iron_armor', slot:'armor', name:'Giáp Sắt', icon:'🛡️', desc:'Phòng thủ vững chắc', bonus:'+14 DEF, +20 HP', atk:0, def:14, hp:20, mp:0, price:200 },
  { id:'mage_robe', slot:'armor', name:'Áo Pháp Sư', icon:'👘', desc:'Tăng mana tối đa', bonus:'+5 DEF, +40 MP', atk:0, def:5, hp:0, mp:40, price:220 },
  // Nhẫn
  { id:'hp_ring', slot:'ring', name:'Nhẫn Sinh Lực', icon:'💍', desc:'Tăng máu tối đa', bonus:'+40 HP', atk:0, def:0, hp:40, mp:0, price:80 },
  { id:'power_ring', slot:'ring', name:'Nhẫn Sức Mạnh', icon:'💎', desc:'Tăng sức tấn công', bonus:'+10 ATK', atk:10, def:0, hp:0, mp:0, price:120 },
  { id:'balance_ring', slot:'ring', name:'Nhẫn Cân Bằng', icon:'🔮', desc:'Tăng mọi chỉ số', bonus:'+6 ATK, +6 DEF, +20 HP', atk:6, def:6, hp:20, mp:0, price:250 },
];
