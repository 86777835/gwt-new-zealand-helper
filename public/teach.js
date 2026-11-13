// N-minute teach: a script the teacher reads aloud to start a first game of Great Western Trail: New Zealand, written from the
// official English rulebook and appendix, with the words of the Traditional Chinese rulebook in simplified characters (same as
// tools/讲解稿.md). It names every important element in a sentence and leaves the fine rulings to the rules assistant. Terms in
// {text|id} open a note with a picture cropped from the official English rulebook (img/teach/<icon>.webp); the 「问」 buttons and
// each note's 「问规则助手」 ask the rules assistant (chat.js) straight away. Every 「问」 question is an entry of tools/faq.json.
const ICON = (id, cls = '') => id ? `<img class="ico ${cls}" src="/img/teach/${id}.webp" alt="" loading="lazy">` : '';

// id: name, where you see it on the table, what it means. icon: a picture in img/teach/.
const TERMS = {
  board: { name: '游戏图板', icon: 'board', where: '桌子中间的大图板：一条从左下角通往威灵顿的小路，右边是求职市场和奖励市场，左上是开拓者轨。', what: '大家的牧场主在这条小路上走；路边的建筑格放中立建筑、私有建筑和天灾。' },
  sea: { name: '海路图板', icon: 'seaboard', where: '游戏图板上方的蓝色海图。', what: '帆船在这里航行，沿途有小型、中型、大型港口，还有当地羊毛贸易站。' },
  pboard: { name: '玩家图板', icon: 'boarddiagram', where: '每人面前一块：左边附属行动区，中间四行工人列，右边金块轨和临时认证轨，下面一排仓库。', what: '你的“仪表盘”。上面盖着 16 个圆片和 10 个仓库，拿走一个就解锁那一格的能力。' },
  runholder: { name: '牧场主', icon: 'runholder', where: '灰色人形棋子，戴着你颜色的帽子。', what: '代表你，沿小路走向威灵顿，停在哪里就在哪里行动。' },
  neutral: { name: '中立建筑', icon: 'neutral', where: '游戏图板上 8 块灰边建筑板块，印着 A–H。', what: '谁都能用的建筑。其中 4 块会在半局时翻面，换成别的行动。' },
  private: { name: '私有建筑', icon: 'private', where: '每人 10 块红边建筑板块，编号 1–10，排在玩家图板上方。', what: '你自己盖在小路上的建筑：你停下能用它的行动；别人经过要付过路费给你；终局算右上角的分。' },
  hazard: { name: '天灾板块', icon: 'rockfall', where: '小路上的落石、洪水板块，印着 2–4 分和绿手或黑手。', what: '挡在路上收过路费。可以花行动把它移除放到自己面前，终局算分。' },
  fee: { name: '过路费', icon: 'fee', where: '天灾和私有建筑上的绿手、黑手图示；玩家图板 A 阶段框里的费用板块。', what: '经过或停下都要付：绿手 2 元、黑手 1 元。' },
  step: { name: '步数上限', icon: 'steptile', where: '玩家图板 A 阶段框里的人数调整板块，以及开拓者轨上拿到的橘色步数板块。', what: '一回合最多走几步。起始 3 或 4 步（看人数调整板块），之后可以提高。' },
  wellington: { name: '威灵顿', icon: 'wellington', where: '小路的终点，游戏图板右上角。', what: '到这里按 4 步走：收入、运送、预测 A、预测 B。然后回到起点再走一圈。' },
  wsteps: { name: '威灵顿四步骤', icon: 'wsteps', where: '游戏图板上威灵顿旁边的 1–4 号格，规则书第 9 页的四步图条。', what: '① 收入 ② 运送 ③ 预测 A ④ 预测 B，按顺序做完。可以把牧场主沿 1–4 号格挪，免得漏步。' },
  sheep: { name: '绵羊卡', icon: 'sheep', where: '你的手牌。左上角是育种价值，两侧圆圈是羊毛值，底下是终局分数。', what: '游戏的核心：到威灵顿按育种价值赚钱，剃毛时按羊毛值赚钱。' },
  breeding: { name: '育种价值', icon: 'sheep', where: '绵羊卡左上、右上角的大数字。', what: '到威灵顿收入时，亮出的不同种羊把这个数加起来，就是这次能拿的钱，也决定能运送到哪个贸易站。' },
  wool: { name: '羊毛值', icon: 'suffolk', where: '绵羊卡两侧的圆圈数字。', what: '剃毛时把亮出的羊的羊毛值加起来，按总数拿钱。' },
  flock: { name: '牧羊牌库', icon: 'sheep', where: '个人牌库（抽牌）、手牌和个人弃牌区合在一起。', what: '开局 14 张起始绵羊卡，买来的羊和其他卡都先进弃牌区，以后洗进牌库。' },
  sheepmarket: { name: '绵羊市场', icon: 'suffolk', where: '游戏图板下方翻开的一排绵羊卡，按颜色排。', what: '用牧羊人从这里买更值钱的羊，越好的羊越贵。' },
  post: { name: '贸易站', icon: 'post', where: '游戏图板上方一排当地贸易站，每个站标着数值和分数；外国贸易站在海路图板的大型港口旁。', what: '运送时往一个数值不超过这次育种价值的站放 1 个圆片：立刻拿站上的奖励，终局算分。' },
  disc: { name: '玩家圆片', icon: 'disc', where: '玩家图板上 16 个，盖住彩色圆格。', what: '运送、升级中型港口时从图板上拿走一个放出去；拿走的那一格就解锁对应能力。白色边框格的圆片哪里都能放，黑色边框格的只能放黑色边框位置。' },
  foresight: { name: '预测区', icon: 'bonustile', where: '威灵顿旁边 4 个格子，两个 A、两个 B。', what: '运送后各选 1 块放出去：工人进求职市场，天灾上小路，奖励板块进奖励市场。' },
  jobmarket: { name: '求职市场', icon: 'shepherd', where: '游戏图板右边，四种工人各一列，越往上越贵。', what: '雇工的地方。工人越少越贵。' },
  workers: { name: '工人', icon: 'shepherd', where: '玩家图板中间四行：牧羊人、工匠、水手、剃毛工人，每行第一格印好了 1 个。', what: '雇到的工人放进自己那一行，有的格子当场给奖励。人越多，对应的行动越强。' },
  shepherd: { name: '牧羊人', icon: 'shepherd', where: '绿衣女牧羊人板块。', what: '买羊时用：几个牧羊人决定能买哪些羊、多少钱。' },
  craftsman: { name: '工匠', icon: 'craftsman', where: '拿锤子的工匠板块。', what: '盖私有建筑时用：工匠数不少于建筑要求才能盖。' },
  sailor: { name: '水手', icon: 'sailor', where: '戴帽子的水手板块。', what: '移帆船时用：几个水手就最多走几格。' },
  shearer: { name: '剃毛工人', icon: 'shearer', where: '拿剪刀的剃毛工人板块。', what: '剃毛时用：几个剃毛工人就最多剃几只羊。' },
  ship: { name: '帆船', icon: 'ship', where: '每人一艘，放在海路图板的起点格。', what: '在海上移动，到港口花 1 步升级港口：放仓库或圆片，拿卡、解锁奖励。' },
  harbour: { name: '港口', icon: 'smallharbour', where: '海路图板上的小型、中型、大型港口。', what: '小型放仓库、中型放圆片（还能换港务长板块）、大型免费放仓库解锁外国贸易站。' },
  storehouse: { name: '仓库', icon: 'storehouse', where: '玩家图板下方 10 个灰色小房子。', what: '升级小型、大型港口时放出去；相连的两格都空了，触发奖励。' },
  harbourmaster: { name: '港务长板块', icon: 'harbourmaster', where: '海路图板中型港口旁的蓝色板块，每局 5 块。', what: '升级那个中型港口时，可以派一个工人去换：上半部分立即奖励或永久认证，下半部分终局计分。' },
  hmscore: { name: '港务长计分', icon: 'hmtasks', where: '港务长板块下半部分。', what: '8 种终局任务，和目标卡完全分开算。' },
  shear: { name: '剃毛', icon: 'shearer', where: '中立建筑 E、H 和一些私有建筑上的剪刀图示。', what: '亮出几只羊（不超过剃毛工人数），羊毛值加永久羊毛，按总数拿钱，之后可以往羊毛贸易站放圆片。' },
  pathfinder: { name: '开拓者轨', icon: 'pathfinder', where: '游戏图板左上方一条竖着的数字轨道，0 到 16 以上。', what: '前进途中拿金块、步数板块、免过路费，解锁更多建筑格；终局按到过的最高分格算分。' },
  aux: { name: '附属行动', icon: 'auxsection', where: '玩家图板左边 5 行，每行旁边 2 个圆片。', what: '小行动：拿钱、抽弃牌、认证、移船、开拓者轨。清空 1 个圆片能做单次，清空 2 个才能做双倍。' },
  auxdouble: { name: '单次和双倍', icon: 'auxtable', where: '规则书第 18 页的对照表。', what: '双倍就是代价和奖励都翻倍；只有画着双倍图示的地方才能做双倍。' },
  cert: { name: '认证', icon: 'certificate', where: '玩家图板右边的临时认证轨，还有永久认证。', what: '收入时加到育种价值上，让你一次拿更多钱、运送到更远的贸易站。' },
  gold: { name: '金块', icon: 'gold', where: '玩家图板右边的金块轨，开局 1 个，最多 5 个。', what: '只用来买奖励卡。' },
  money: { name: '钱（元）', icon: 'coin', where: '银币 1 元、金币 5 元。', what: '雇工、买羊、盖建筑、付过路费都要钱；终局每 5 元 1 分。' },
  exchange: { name: '交换指示物', icon: 'exchange', where: '蓝色圆角指示物，开局每人 1 个。', what: '随时能用：1 个抽 2 弃 2；2 个把一张灰色绵羊卡移出游戏并拿 1 金块。' },
  deckcards: { name: '牌组建构卡', icon: 'romney', where: '游戏图板左边四叠：罗姆尼羊、边境牧羊犬、渡轮、翠鸟。', what: '通过贸易站、港口、天灾等拿到，放进弃牌区，以后抽到再用。' },
  romney: { name: '罗姆尼羊', icon: 'romney', where: '粉色的绵羊卡，在牌组建构供应区。', what: '一种羊，从不出现在绵羊市场，只能通过行动和奖励拿到。' },
  sheepdog: { name: '边境牧羊犬', icon: 'sheepdog', where: '牌组建构供应区。', what: '移除落石天灾时得到；打出后有效果，打完抽 1 张。' },
  ferry: { name: '渡轮', icon: 'ferry', where: '牌组建构供应区。', what: '移除洪水天灾时得到；打出后有效果，打完抽 1 张。有些计分按渡轮卡张数算。' },
  kotare: { name: '翠鸟', icon: 'kotare', where: '牌组建构供应区。', what: '打出：开拓者轨前进 1 格，然后抽 1 张。' },
  bonuscard: { name: '奖励卡', icon: 'bonuscard', where: '海路图板旁 4 叠，放在船舵、酒桶、钟、罗盘提示板块下面，每局从 10 个组合里抽 4 个。', what: '用金块买：船舵、酒桶 3 个，钟 4 个，罗盘 5 个。有的是好羊，有的是特殊效果，有的是奖励目标卡。' },
  objective: { name: '目标卡', icon: 'objective', where: '游戏图板旁翻开 4 张的目标卡展示区。', what: '拿到后打出放进个人目标卡区，马上得一个小奖励；终局完成任务加分，没完成扣分。' },
  bonustile: { name: '奖励板块', icon: 'bonustile', where: '游戏图板右下的奖励市场，背面字母 B。', what: '花钱投资，立刻拿奖励（永久认证、金块、交换指示物等），终局还有分。' },
  token: { name: '奖励市场标记', icon: 'markettoken', where: '奖励市场一角的圆形标记，背面印 5 分。', what: '游戏的计时器：每填满一行就往下一行，途中补羊市场、翻中立建筑，离开市场就触发终局。' },
  endgame: { name: '终局触发', icon: 'endgame', where: '奖励市场最后一格。', what: '谁放满最后一格，谁拿走标记（5 分），其他人各再走 1 回合。' },
  scorepad: { name: '计分纸', icon: 'scorepad', where: '盒子里的一叠计分纸，12 项。', what: '终局逐项算分。本站房间里每人在自己手机上填，自动加总。' }
};

// The script: what to read aloud. Every important element gets one sentence; how it is ruled exactly is for the assistant.
const PARTS = [
  { title: '怎么赢', sec: 25, lines: [
    '这局玩《大西部开拓者：新西兰开拓史》。我先讲一遍主流程，讲完再一条条过注意事项。',
    '我们是 19 世纪末新西兰的{牧场主|runholder}：养羊、{剃毛|shear}、把羊运到{威灵顿|wellington}卖，开{帆船|ship}跑港口，盖自己的{私有建筑|private}。',
    '游戏里不计分，终局一次算：贸易站、港口、建筑、羊、{目标卡|objective}等 12 项加起来，分高的人赢。'
  ], ask: ['终局怎么触发？最后一回合要补牌吗？', '平局怎么判？'] },
  { title: '你面前有什么', sec: 40, lines: [
    '每人一块{玩家图板|pboard}，上面盖着 16 个{玩家圆片|disc}和 10 个{仓库|storehouse}。拿走一个，就解锁那一格的能力，所以拿走的位置很重要。',
    '图板中间四行是{工人|workers}：{牧羊人|shepherd}买羊、{工匠|craftsman}盖建筑、{水手|sailor}开船、{剃毛工人|shearer}剃毛，每行先印好 1 个。',
    '手牌是{绵羊卡|sheep}：左上角的{育种价值|breeding}决定在威灵顿赚多少，两侧的{羊毛值|wool}决定剃毛赚多少。手牌、牌库、弃牌区合起来叫{牧羊牌库|flock}。',
    '另外还有{钱|money}、{金块|gold}、{认证|cert}和{交换指示物|exchange}，等用到再说。'
  ], ask: ['每人的起始资金和手牌一样吗？', '第一个回合有什么不一样？'] },
  { title: '一回合怎么走', sec: 40, lines: [
    '每回合三步。A：沿{游戏图板|board}的小路往前走，最多走到你的{步数上限|step}；只有放了板块的格才算一步。经过或停在绿手、黑手上要付{过路费|fee}。',
    'B：在停下的地方行动。{中立建筑|neutral}和自己的私有建筑，可以做上面的行动；停在别人的建筑或{天灾|hazard}上，只能做一个小的{附属行动|aux}。',
    'C：补牌到手牌上限，起始 4 张。',
    '一直往前走，到了{威灵顿|wellington}就停下运送，然后从起点再走一圈。'
  ], ask: ['过路费是停下才付还是经过就付？', '空的建筑格算步数吗？', '附属行动什么时候能做双倍？'] },
  { title: '到威灵顿', sec: 45, lines: [
    '威灵顿按 {4 步|wsteps}走。第 1 步收入：从手牌亮出不同种的羊，每种一张，把育种价值加起来，可以再加{认证|cert}，拿这么多钱。亮出的牌弃掉，**没亮的牌留在手里**。',
    '第 2 步运送：把 1 个圆片放到一个数值不超过这次育种价值的{贸易站|post}，立刻拿站上的东西，终局还算分。越远的站越值钱。',
    '第 3、4 步：从{预测区|foresight}各选一块放出去：工人进{求职市场|jobmarket}，天灾上小路，{奖励板块|bonustile}进奖励市场。',
    '做完，牧场主回到起点，重新出发。'
  ], ask: ['运送以后，手里重复的羊要弃掉吗？', '白色边框和黑色边框的圆片有什么区别？'] },
  { title: '主要行动', sec: 45, lines: [
    '建筑上的行动大致这几类：在求职市场雇工；用牧羊人在{绵羊市场|sheepmarket}买更值钱的羊；用工匠盖私有建筑。',
    '剃毛：亮出几只羊，按羊毛值拿钱，还可以往羊毛贸易站放一个圆片。',
    '移帆船：在{海路图板|sea}上航行，到{港口|harbour}花一步升级，放仓库或圆片、拿卡；中型港口旁的{港务长板块|harbourmaster}可以派一个工人去换。',
    '还有：移除天灾放到自己面前、在{开拓者轨|pathfinder}上前进、拿{目标卡|objective}、投资{奖励板块|bonustile}。'
  ], ask: ['升级港口要满足什么？', '剃毛后放羊毛贸易站是强制的吗？', '开拓者轨各格有什么奖励？'] },
  { title: '卡牌和资源', sec: 30, lines: [
    '行动和港口会给你{牌组建构卡|deckcards}：{罗姆尼羊|romney}是一种羊；{边境牧羊犬|sheepdog}、{渡轮|ferry}、{翠鸟|kotare}打出来有效果，打完抽一张。',
    '{金块|gold}只用来买{奖励卡|bonuscard}，每局有 4 个组合，越贵的越强。',
    '{交换指示物|exchange}随时能用来换牌。目标卡打出去先拿小奖励，终局完成加分、没完成扣分。'
  ], ask: ['奖励卡、牌组建构卡什么时候能打？', '没打出的目标卡要扣分吗？'] },
  { title: '游戏结束', sec: 30, lines: [
    '计时器是奖励市场：{奖励市场标记|token}所在的那一行放满，它就往下一行走，途中会补满绵羊市场、把 4 块中立建筑翻面。',
    '有人把最后一格放满，{终局触发|endgame}：他拿 5 分，其他人各再走一回合，最后一回合都不补牌。',
    '然后按{计分纸|scorepad}的 12 项算分，每人在自己手机上填。主流程就这些，我们过一遍注意事项。'
  ], ask: ['什么奖励板块不能买？', '卡牌分要算哪些牌？'] }
];

// 注意事项: fine points outside the main flow that are easy to get wrong. Read them one by one after the script.
// Each has a written answer (from tools/faq.json, i.e. the rulebook, appendix and official clarifications).
// [title, answer, question for the assistant]
const NOTES = [
  ['重复的同种羊留在手里', '在威灵顿收入时每种羊只能亮一张，只有亮出的弃掉，**重复的同种羊留在手里**，会占手牌上限。玩过美利坚、阿根廷的人最容易错。', '运送以后，手里重复的羊要弃掉吗？'],
  ['标记所在那一行的奖励板块不能买', '投资{奖励板块|bonustile}时，{奖励市场标记|token}所在那一行的不能买。漏了这条，游戏会拖得很长。', '什么奖励板块不能买？'],
  ['过路费固定，经过也要付', '{过路费|fee}绿手 2 元、黑手 1 元，不看人数；不是只有停下才付，经过也要付。钱不够就付光为止，照样能走。', '过路费是停下才付还是经过就付？'],
  ['威灵顿先收入、再运送', '和老版本不同：先按育种价值拿钱，再选贸易站，所以运费总付得起。运送**必须**放 1 个圆片，站上给的卡必须拿。', '运送时一定要放圆片吗？'],
  ['开局就有 1 金块，第一回合不用走', '每人金块标记放在第二格，开局 1 {金块|gold}。第一回合先弃到 4 张，放一个开拓者轨圆片，牧场主直接放在任意中立建筑上，从 B 阶段开始。', '第一个回合有什么不一样？'],
  ['开局奖励市场前两行都要放', '2/3/4 人局放 3/5/7 块：第一行放满，第二行放到标记左边。规则书的摆放图上这两行是空的，别被骗了。', '奖励市场开局要放几块？'],
  ['白色边框、黑色边框', '{玩家圆片|disc}所在的格有白色、黑色两种边框：白色边框的圆片哪里都能放，黑色边框的只能放黑色边框的贸易站或港口格。拿的时候想清楚。', '白色边框和黑色边框的圆片有什么区别？'],
  ['附属行动单次和双倍', '{附属行动|aux}清空 1 个圆片能做单次，清空 2 个才能做双倍；停在别人的建筑、天灾上，或放弃地点行动时只能做单次。', '附属行动什么时候能做双倍？'],
  ['剃毛后放羊毛贸易站是可选的', '{剃毛|shear}拿完钱，**可以**往羊毛贸易站放圆片，不强制；黑色边框的站给的罗姆尼羊必须拿。威灵顿的运送才是强制放。', '剃毛后放羊毛贸易站是强制的吗？'],
  ['中立建筑半局会翻面', '奖励市场标记走青绿色箭头时，4 块双面{中立建筑|neutral}翻面，换成另一组行动，整局不翻回。黄色箭头是补满绵羊市场。', '市场标记换行时会发生什么？'],
  ['港务长只有升级那一刻能换', '升级有{港务长板块|harbourmaster}的中型港口时，当场从工人列最右边调一个工人去换；错过就再也拿不到。', '港务长板块什么时候能拿？'],
  ['航线末端的小型港口要回起点', '升级三条航线最末端的小型港口后，{帆船|ship}回到起点格。远程放仓库到那里也一样。', '航线末端的小型港口有什么特别？'],
  ['雇来的工人格奖励当场用', '工人放进的那一格如果有立即行动，当场做或放弃，不能留到以后。', '雇到的工人格上的立即行动可以留到以后吗？'],
  ['打卡的时机', '{奖励卡|bonuscard}、牌组建构卡只能在 A 阶段之前、或 B 阶段一个完整行动的前后打；移动中、威灵顿 4 步中间、C 阶段都不能打。打完进弃牌区，抽 1 张。', '奖励卡、牌组建构卡什么时候能打？'],
  ['补牌是一次补齐', 'C 阶段一次补到手牌上限，中途不能插用{交换指示物|exchange}。亮牌收入开始后，也不能再换牌。', 'C 阶段补牌时能插用交换指示物吗？'],
  ['最后一回合不补牌', '有人触发终局后，其他人各走 1 回合；每个人的最后一回合都不补牌。最后一回合在预测 B 选到的奖励板块直接移出游戏。', '终局怎么触发？最后一回合要补牌吗？'],
  ['目标卡：放进去的必须算', '{目标卡|objective}放进个人目标卡区的，终局完成加分、没完成扣分；还留在牧羊牌库里的，终局可以选择不算。', '没打出的目标卡要扣分吗？'],
  ['卡牌分算整个牧羊牌库', '终局卡牌分算个人牌库、手牌、弃牌区里所有带分的羊和奖励卡，不只是弃牌区。', '卡牌分要算哪些牌？'],
  ['两处印错', '罗姆尼羊是 18 张（第 4 页印成 16）；第 14 页说放私有建筑的是中立建筑 B，按附录实际是 D。', '罗姆尼羊到底是 16 张还是 18 张？']
];

// Icon guide, grouped the way things sit on the table.
const GROUPS = [
  ['游戏图板', ['board', 'runholder', 'neutral', 'private', 'hazard', 'wellington', 'wsteps', 'post', 'jobmarket', 'bonustile', 'token', 'sheepmarket', 'pathfinder']],
  ['海路图板', ['sea', 'ship', 'harbour', 'harbourmaster', 'hmscore']],
  ['你面前', ['pboard', 'disc', 'storehouse', 'aux', 'auxdouble', 'cert', 'gold', 'money', 'exchange', 'fee', 'step']],
  ['四种工人', ['shepherd', 'craftsman', 'sailor', 'shearer']],
  ['卡牌', ['sheep', 'wool', 'romney', 'sheepdog', 'ferry', 'kotare', 'bonuscard', 'objective', 'scorepad', 'endgame']]
];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const term = (text, id) => `<button type="button" class="term" data-t="${id}">${ICON(TERMS[id].icon)}${esc(text)}</button>`;
const line = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\{([^|}]+)\|(\w+)\}/g, (_, t, id) => term(t, id));
// inside a button the terms show their icon but are not buttons themselves
const label = s => esc(s).replace(/\{([^|}]+)\|(\w+)\}/g, (_, t, id) => `<span class="tlab">${ICON(TERMS[id].icon)}${esc(t)}</span>`);
const askBtn = (text, q) => `<button type="button" class="tq" data-q="${esc(q)}">问 <span>${label(text)}</span></button>`;
const RULEBOOK = 'https://boardgamegeek.com/filepage/262566';

document.getElementById('teach').innerHTML = `
  <p class="tlead">讲的人先照着念主流程（四分钟左右），再一条条过注意事项。<b>带下划线的词</b>点一下看图和解释；有疑问点「问」，规则助手马上回答。玩过美利坚或阿根廷的老玩家，重点听注意事项前 6 条。</p>
  <nav class="tnav">${PARTS.map((p, i) => `<a href="#p${i + 1}"><i>${i + 1}</i>${p.title}</a>`).join('')}<a href="#later">注意事项</a><a href="#icons">图标速查</a></nav>
  ${PARTS.map((p, i) => `<section class="card tpart" id="p${i + 1}">
    <h2 class="h"><span><i>${i + 1}</i>${p.title}</span><small>约 ${p.sec} 秒</small></h2>
    ${p.lines.map(s => `<p class="tline">${line(s)}</p>`).join('')}
    <div class="tasks"><em>桌上常见疑问</em>${p.ask.map(q => askBtn(q, q)).join('')}</div>
  </section>`).join('')}
  <section class="card tpart" id="later">
    <h2 class="h"><span><i>✓</i>注意事项</span><small>${NOTES.length} 条</small></h2>
    <p class="tnote">流程讲完后，一条一条过一遍。都是规则书里写了、但最容易漏掉或吵起来的地方。点开就是答案。</p>
    <div class="tnotes">${NOTES.map(([t, a, q], i) => `<details class="tni"><summary><i>${i + 1}</i>${esc(t)}</summary><p>${line(a)}</p>${askBtn('还有疑问？问规则助手', q)}</details>`).join('')}</div>
    <p class="tnote">注意事项里没有的，点右下角「规则」问 AI，本站资料查不到会联网找。</p>
  </section>
  <a class="button primary big tgo" href="/">讲完了，去建房间</a>
  <h2 class="tih" id="icons">图标速查<small>点图标看解释</small></h2>
  ${GROUPS.map(([g, ids]) => `<div class="card tgrid"><h3>${g}</h3><div>${ids.map(id => `<button type="button" class="tic" data-t="${id}">${ICON(TERMS[id].icon)}<span>${TERMS[id].name}</span></button>`).join('')}</div></div>`).join('')}
  <footer class="tfoot">依据官方规则书、附录和设计师在 BGG 的澄清，用词按繁体中文版规则书 · 图片截自 eggertspiele 官方英文规则书（<a href="${RULEBOOK}" target="_blank" rel="noopener">原文</a>），© 2023 eggertspiele / Plan B Games Europe GmbH · 非官方玩家工具</footer>`;

// The note for a term: a sheet from the bottom with the picture, where it is and what it means.
const sheet = document.createElement('div');
sheet.className = 'tsheet hidden';
document.body.appendChild(sheet);
const close = () => sheet.classList.add('hidden');
function show(id) {
  const t = TERMS[id];
  sheet.innerHTML = `<div class="tsbg"></div><div class="tsbox" role="dialog" aria-label="${esc(t.name)}">
    <div class="tshd">${ICON(t.icon, 'big')}<b>${esc(t.name)}</b><button type="button" class="tsx" aria-label="关闭">×</button></div>
    <p><em>在哪儿看到</em>${esc(t.where)}</p><p><em>什么意思</em>${esc(t.what)}</p>
    <button type="button" class="primary wide tsask" data-q="${esc(`「${t.name}」是什么，怎么用？`)}">还不懂？问规则助手</button></div>`;
  sheet.classList.remove('hidden');
}
const ask = q => { close(); window.askRules?.(q); };
document.addEventListener('click', e => {
  const t = e.target.closest('[data-t]');
  if (t) return show(t.dataset.t);
  const q = e.target.closest('[data-q]');
  if (q) return ask(q.dataset.q);
  if (e.target.closest('.tsx,.tsbg')) close();
});
addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
