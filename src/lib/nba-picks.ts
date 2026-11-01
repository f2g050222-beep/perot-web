/* NBA Picks 内容（演示内容 / 公开信息整理）
   ★ 资料截至 2026-10，参考 Sole Retriever「2026-27 NBA Season Signature Sneakers by Team」、
     Hypebeast「NBA and WNBA Signature Shoe List 2026」、Sports Business Journal（2026-02）、
     PUMA / New Balance 官方发布。代言关系会变化，以品牌最新公告为准。
   ★ 不含比赛、上脚频率或销量数据；「人气球星」为编辑精选，不是官方排名。
   ★ shoeId 仅在演示鞋库中存在对应鞋款时填写。 */
export const PICKS_AS_OF = "2026-10";

export interface NbaPick {
  id: string;
  player: string;
  brand: string;
  line: string;     // 签名系列 / 最新已知型号（英文型号不翻译）
  shoeId?: string;
  note: string;
}

/** 一、五大品牌签名鞋球员 */
export const SIGNATURE_BY_BRAND: { brand: string; players: NbaPick[] }[] = [
  { brand: "Nike", players: [
    { id: "lebron", player: "LeBron James", brand: "Nike", line: "LeBron", shoeId: "lebron-23", note: "终身合约球员，重缓震与强保护的代表系列。" },
    { id: "kd", player: "Kevin Durant", brand: "Nike", line: "KD 19", shoeId: "kd-18", note: "终身合约球员，均衡型锋线配置。" },
    { id: "giannis", player: "Giannis Antetokounmpo", brand: "Nike", line: "Giannis Freak 8", shoeId: "freak-7", note: "冲击篮筐型，推进与稳定兼顾。" },
    { id: "ja", player: "Ja Morant", brand: "Nike", line: "Ja", shoeId: "ja-3", note: "爆发起跳与高速突破，前掌响应优先。" },
    { id: "booker", player: "Devin Booker", brand: "Nike", line: "Book 2", note: "中距离投手，低帮与稳定脚感。" },
  ] },
  { brand: "Jordan", players: [
    { id: "luka", player: "Luka Dončić", brand: "Jordan", line: "Luka 5", shoeId: "luka-4", note: "节奏型持球手，重视稳定与急停控制。" },
    { id: "tatum", player: "Jayson Tatum", brand: "Jordan", line: "Tatum 4", shoeId: "tatum-4", note: "轻量化与贴地感，适合多面手锋线。" },
  ] },
  { brand: "adidas", players: [
    { id: "edwards", player: "Anthony Edwards", brand: "adidas", line: "AE 2", shoeId: "ae-2", note: "力量型突破后卫，兼顾缓震与稳定。" },
    { id: "lillard", player: "Damian Lillard", brand: "adidas", line: "Dame X", note: "终身合约球员，远投与持球推进。" },
    { id: "harden", player: "James Harden", brand: "adidas", line: "Harden Vol. 9", shoeId: "harden-9", note: "后撤步与变速，宽底盘与缓震。" },
  ] },
  { brand: "Under Armour", players: [
    { id: "fox", player: "De'Aaron Fox", brand: "Under Armour", line: "D. Fox 2", note: "极速推进型后卫。Stephen Curry 已于 2025 年 11 月结束与 Under Armour 的合作。" },
  ] },
  { brand: "PUMA", players: [
    { id: "lamelo", player: "LaMelo Ball", brand: "PUMA", line: "MB.05", note: "NITROFOAM 中底，风格鲜明的组织后卫系列。" },
    { id: "haliburton", player: "Tyrese Haliburton", brand: "PUMA", line: "Hali 1", note: "首款签名鞋，与设计师 Salehe Bembury 合作。" },
  ] },
];

/** 二、人气球星（编辑精选，非官方排名） */
export const POPULAR: NbaPick[] = [
  { id: "p-lebron", player: "LeBron James", brand: "Nike", line: "LeBron", shoeId: "lebron-23", note: "联盟历史得分王，全球关注度最高的球员之一。" },
  { id: "p-curry", player: "Stephen Curry", brand: "Li-Ning", line: "Curry Brand × Li-Ning", note: "三分时代的代表人物；2026 年起与李宁合作，签名鞋款开发中。" },
  { id: "p-luka", player: "Luka Dončić", brand: "Jordan", line: "Luka 5", shoeId: "luka-4", note: "新一代国际巨星，球衣与球鞋都极具人气。" },
  { id: "p-giannis", player: "Giannis Antetokounmpo", brand: "Nike", line: "Giannis Freak 8", shoeId: "freak-7", note: "MVP 级别的冲击力与国际影响力。" },
  { id: "p-sga", player: "Shai Gilgeous-Alexander", brand: "Converse", line: "SHAI 001", note: "节奏大师型后卫，Converse 篮球线的核心球员。" },
];

/** 三、中国品牌代表 */
export const CHINA_BRANDS: NbaPick[] = [
  { id: "c-butler", player: "Jimmy Butler", brand: "Li-Ning", line: "JB 5", note: "李宁签名系列；同品牌还有 Stephen Curry 与 Way of Wade 系列。" },
  { id: "c-klay", player: "Klay Thompson", brand: "ANTA", line: "KT 11", note: "2026 年 2 月续约至职业生涯之后；队友 Kyrie Irving 的 ANTA KAI 3 也在同一品牌。" },
  { id: "c-wiggins", player: "Andrew Wiggins", brand: "Peak", line: "AW5", note: "2020 年 12 月起与匹克合作，已推出第五代签名鞋。" },
  { id: "c-gordon", player: "Aaron Gordon", brand: "361°", line: "AG 7", note: "361° 合作时间最长的签名球员；Nikola Jokić 的 Joker 2 同属该品牌。" },
  { id: "c-reaves", player: "Austin Reaves", brand: "Rigorer", line: "AR3", note: "准者首位 NBA 签名球员；据报道 2025-26 季前赛曾改穿其他品牌，合作现状待确认。" },
];
