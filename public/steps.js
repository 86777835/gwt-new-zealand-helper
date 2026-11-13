// 大西部开拓者新西兰助手 · setup checklist and bonus card sets. Every item cites the official English rulebook (printed pages)
// or the official solo rules. Wording follows the Traditional Chinese rulebook, converted to simplified characters (docs/术语表.md).
import {LEVELS, PER_N, mode, setupN} from './logic.js';

export const BOOK = {
  rules: 'https://boardgamegeek.com/filepage/262566',
  solo: 'https://boardgamegeek.com/filepage/263865',
  appendix: 'https://boardgamegeek.com/filepage/263864'
};
// Names that appear in several places on the page.
export const SUPPLY = {
  token: '交换指示物',
  slots: ['船舵', '酒桶', '钟', '罗盘'],
  prices: [3, 3, 4, 5]
};
// One-line description of a room's setup, e.g. 3 人，奖励卡 1·4·7·9
export function summary(c) {
  const who = mode(c) === 'solo' ? `单人对莎拉（${LEVELS[c.level]}）` : c.n + ' 人';
  return `${who}${c.sets?.length === 4 ? '，奖励卡 ' + c.sets.join('·') : ''}`;
}
// Player nicknames → words used on this site (guide search, rules assistant).
export const ALIASES = [['惠灵顿', '威灵顿'], ['剪毛', '剃毛'], ['剪羊毛', '剃毛'], ['卖羊', '运送'], ['运羊', '运送'], ['工人片', '工人'], ['员工', '工人'],
  ['船长', '水手'], ['建筑工', '工匠'], ['羊毛工', '剃毛工人'], ['羊倌', '牧羊人'], ['灾害', '天灾'], ['B板子', '奖励板块'], ['繁育值', '育种价值'], ['繁殖度', '育种价值'],
  ['品质', '育种价值'], ['渡船', '渡轮'], ['渡口', '渡轮'], ['牧羊犬', '边境牧羊犬'], ['小人', '牧场主'], ['片', '圆片']];

// The 10 bonus card sets (组合). Effects from the official appendix, last page (附p4, Traditional Chinese edition; same as the English
// appendix), the rulebook p17–18 and the designer's clarification on set 4. Every special card: you may skip the effect and just draw 1.
const SHEEP = '这个组合是绵羊卡，和普通绵羊卡一样用：收入时算育种价值、剃毛时算羊毛值、终局算卡上的分数。';
const GOAL = '和普通目标卡一样用：打出后放进个人目标卡区，执行立即行动；终局完成加分、没完成扣分。“获得目标卡”的行动拿不到它们，只能用金块买或升级港口得到。';
const SETS = {
  1: {name: '渡轮', text: '个人目标卡区里每有 1 张已打出的目标卡，得 1 元；然后抽 1 张。这张也算“渡轮卡”（港务长计分、目标卡任务）。', page: '附p4'},
  2: {name: '翠鸟', text: '得 1 元，开拓者轨前进 1 格；然后抽 1 张。', page: '附p4'},
  3: {name: '绵羊', text: SHEEP, page: 'p18'},
  4: {name: '骑马者', text: '二选一：得 1 元；或者本回合之后获得的卡都放到个人牌库顶（只算打出这张以后获得的，设计师确认）。然后抽 1 张。只能在自己回合打。', page: '附p4'},
  5: {name: '帆船', text: '二选一：得 1 元；或者在帆船 3 格航程内的港口放 1 个仓库（照样算 1 格移动）。放在航线末端的小型港口时，帆船也要回起点（出版方确认）。然后抽 1 张。只能在自己回合打。', page: '附p4'},
  6: {name: '牧场建筑', text: '二选一：得 2 元；或者把场上自己的 1 片私有建筑换成工匠需求正好多 1 的另一片（不看你有几个工匠，出版方确认）。然后抽 1 张。只能在自己回合打。', page: '附p4'},
  7: {name: '绵羊', text: SHEEP, page: 'p18'},
  8: {name: '奖励目标卡', text: GOAL, page: 'p17'},
  9: {name: '奖励目标卡', text: GOAL, page: 'p17'},
  10: {name: '奖励目标卡', text: GOAL, page: 'p17'}
};
export const setInfo = k => SETS[k];

// Removed Sarah cards per difficulty (SOLO p1).
const SARAH_OUT = {easy: '#1、#6、#8、#14、#15、#16、#17', medium: '#14–#17', hard: '#10–#13'};
const SARAH_FIRST = {easy: 3, medium: 6, hard: 9};

const item = (id, text, page, extra = {}) => ({id, text, page, ...extra});

export function setupList(s) {
  const c = s.config, solo = mode(c) === 'solo', N = setupN(c), k = PER_N[N], list = [];
  const sec = (title, items) => list.push({title, items: items.filter(Boolean)});
  const neutral = c.neutral ? `按上面抽到的顺序，把 8 块中立建筑放到 A–H 中立格上` : '第一局：8 块中立建筑按字母放到 A–H 中立格上';
  const sets = c.sets.length === 4 ? `本局是组合 ${c.sets.join('、')}` : '10 个组合各抽出带白星的那张，洗混后随机抽 4 张，决定用哪 4 个组合；其余 6 张放回盒子';

  sec('图板', [
    item('board', '游戏图板放中间，海路图板放在它上方。', 'p4'),
    item('harbour', '8 块港务长板块洗混，随机正面朝上放到海路图板的 5 个港务长格，剩下 3 块放回盒子。', 'p4'),
    item('neutral', `${neutral}，全部正面朝上（4 块双面的要露出带翻面标记的一面）。中立建筑物预览板放在图板旁。`, 'p4–5'),
    item('token', '奖励市场标记放在奖励市场最上面的虚线圆格。', 'p4'),
    item('bags', '工人（28）、天灾（16）、奖励板块全部背面朝上，按背面字母装进 A、B 两个袋子，放在威灵顿旁边。', 'p4'),
    item('workers1', '<b>先从 A 袋挑出每种工人各 1 个</b>，放到求职市场最上面一行的指定格。', 'p4', {warn: true}),
    item('bagA', `然后从 A 袋抽 <b>${k.bagA}</b> 块：工人放进同色那一列最上面（最贵）的空格；天灾放进对应天灾区编号最小的空格；没位置就放回袋子重抽。`, 'p4'),
    item('bonus', `从 B 袋抽奖励板块摆进奖励市场：第一行从 ${N} 人标志下面那格开始往右放满；第二行同样从 ${N} 人那一列开始，放到市场标记左边那格为止。<b>一共 ${k.bonusTiles} 块，前两行都要填</b>。`, 'p4', {warn: true}),
    item('foresight', '威灵顿的预测区：A 袋抽 2 块放两个 A 格，B 袋抽 2 块放两个 B 格。', 'p4'),
    item('sheep', `37 张市场绵羊卡洗混，背面朝上放在图板右下作为市场牌库，翻开 <b>${k.sheep}</b> 张，按颜色从左到右排：橘、红、黄、蓝、棕、紫。`, 'p4'),
    item('objectives', '24 张目标卡洗混成牌堆，翻开 4 张竖排，作为目标卡展示区。', 'p4'),
    item('deck', '牌组建构卡放在图板左边：罗姆尼羊 <b>18</b> 张（规则书第 4 页印成 16，是笔误）、边境牧羊犬 12、渡轮 14、翠鸟 12。', 'p3–4', {warn: true}),
    item('sets', `奖励卡：${sets}。每个组合补到 <b>${k.setCards}</b> 张（含白星卡）。4 个组合按编号从小到大，依次放在船舵、酒桶、钟、罗盘提示板块下面。`, 'p5'),
    item('steps', solo ? '步数板块：放 1 块到开拓者轨旁 2 人局的橙色格，+1 面朝上。' : `步数板块：${N} 块，+1 面朝上，放到开拓者轨旁 ${N} 人局的橙色格。`, solo ? 'p1' : 'p5', solo ? {solo: true} : {}),
    item('bank', '硬币和交换指示物放一起作为供应区。', 'p5')
  ]);

  sec(solo ? '你的配件' : '每位玩家', [
    item('pboard', '拿一种颜色的玩家图板。人数调整板块（对应人数那面）和费用板块（显示 −1/−2 硬币那面）放进图板的 A 阶段框，费用板块在右。人数调整板块上印着你的起始步数上限。', 'p5'),
    item('private', c.sides ? '10 块私有建筑按上面抽到的 a/b 面摆，按所需工匠数从少到多排在图板上方。全桌一样，之后谁都不能主动翻面。' : '10 块私有建筑全部 a 面朝上，按所需工匠数从少到多排在图板上方。', 'p5'),
    item('discs', '16 个圆片盖住图板上 16 个彩色圆格（左上角 2 个灰格空着）；10 个仓库盖住下方 10 个彩色方格。', 'p5'),
    item('ship', '帆船放在海路图板任意一个起始水域格。', 'p5'),
    item('gold', '认证标记放临时认证轨最上面一格（0 旁边）；<b>金块标记放金块轨第二格，开局就有 1 金块</b>。', 'p5', {warn: true}),
    item('flock', '拿自己颜色的 14 张绵羊卡，洗混作为个人牌库，放在图板左边。牧场主先放在图板旁。', 'p5')
  ]);

  if (solo) sec('莎拉（单人对手）', [
    item('sarahWorker', '摆图板第 5 步：袋子装好后先随机抽 1 块 A 板块；是天灾就放回再抽，直到抽到工人，这个工人留给 Sarah。', 'p1', {solo: true}),
    item('sarahKit', '莎拉拿一种颜色的全部配件，用莎拉图板代替玩家图板：15 个圆片和 10 块私有建筑放在图板旁当储备（建筑朝向抄你的），第 16 个圆片放开拓者轨 0 格；牧场主放在小径起点，帆船放一个起始水域格；仓库、金块和认证标记放回盒子。', 'p1', {solo: true}),
    item('sarahDeck', `难度「${LEVELS[c.level]}」：拿掉 莎拉卡 ${SARAH_OUT[c.level]}，其余洗混作为她的牌堆。她不用绵羊卡。`, 'p1', {solo: true}),
    item('sarahStart', '留给她的工人放到莎拉图板对应行最左的空格；策略板块放到她工人最多那一行左边。莎拉绵羊市场板块放在她的图板上方。这个开局工人不给她船舵奖励卡。', 'p2', {solo: true}),
    item('sarahFirst', `她第一次运送去 ${SARAH_FIRST[c.level]} 号当地贸易站，之后每次去下一个更高的当地站，到 21 以后一直交 21。`, 'p2', {solo: true})
  ]);

  sec('开始前', [
    item('money', solo ? '你是起始玩家：拿 7 元、1 个交换指示物，抽 4 张。莎拉不拿钱、不拿交换指示物、不抽牌。' : `按上面的座位领钱和交换指示物、抽牌（${['7', '8', '9', '10'].slice(0, c.n).join(' / ')} 元，${['4', '5', '6', '7'].slice(0, c.n).join(' / ')} 张）。`, solo ? 'p2' : 'p5', solo ? {solo: true} : {}),
    item('first', '<b>每人的第一个回合</b>：先弃到只剩 4 张；从一个白色边框圆片格拿 1 个圆片放到开拓者轨 0 格；牧场主放到任意一座中立建筑上，<b>不走 A 阶段，直接做 B 阶段</b>。', 'p5', {warn: true})
  ]);
  return list;
}
