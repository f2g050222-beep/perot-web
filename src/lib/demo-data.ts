export type Shoe = { id: string; brand: string; model: string; player: string; position: string; court: string; price: string; strengths: string[]; tone: string; status?: string };

export const featuredShoes: Shoe[] = [
  { id: "lebron-23", brand: "NIKE", model: "LeBron 23", player: "LeBron James", position: "SF / PF", court: "室内木地板", price: "待核实", strengths: ["缓震", "支撑", "耐久"], tone: "#d8ff46" },
  { id: "ja-3", brand: "NIKE", model: "Ja 3", player: "Ja Morant", position: "PG", court: "室内 / 外场", price: "待核实", strengths: ["响应", "抓地", "启动"], tone: "#ff6d3b" },
  { id: "ae-2", brand: "ADIDAS", model: "AE 2", player: "Anthony Edwards", position: "SG", court: "室内木地板", price: "待核实", strengths: ["稳定", "缓震", "突破"], tone: "#79aeff" },
  { id: "freak-7", brand: "NIKE", model: "Giannis Freak 7", player: "Giannis Antetokounmpo", position: "PF", court: "室内木地板", price: "待核实", strengths: ["推进", "包裹", "灵活"], tone: "#f8ce42" },
  { id: "book-2", brand: "NIKE", model: "Book 2", player: "Devin Booker", position: "SG", court: "室内木地板", price: "待核实", strengths: ["中底", "稳定", "投射"], tone: "#f29ac0" },
  { id: "luka-4", brand: "JORDAN", model: "Luka 4", player: "Luka Dončić", position: "PG", court: "室内木地板", price: "待核实", strengths: ["节奏", "稳定", "脚感"], tone: "#b7a5ff" },
];

export const nbaPicks = [
  ...featuredShoes,
  { id: "kd-18", brand: "NIKE", model: "KD 18", player: "Kevin Durant", position: "SF", court: "室内木地板", price: "待核实", strengths: ["缓震", "平衡", "投射"], tone: "#80e0d1" },
  { id: "tatum-4", brand: "JORDAN", model: "Tatum 4", player: "Jayson Tatum", position: "SF", court: "室内木地板", price: "待核实", strengths: ["贴地", "侧向", "舒适"], tone: "#e5ad7e" },
  { id: "gt-hustle-3", brand: "NIKE", model: "GT Hustle 3", player: "Victor Wembanyama", position: "C", court: "室内木地板", price: "待核实", strengths: ["轻量", "缓震", "机动"], tone: "#b5e887" },
  { id: "harden-9", brand: "ADIDAS", model: "Harden Vol. 9", player: "James Harden", position: "SG", court: "室内 / 外场", price: "待核实", strengths: ["变向", "缓震", "抓地"], tone: "#e1e1e1" },
];
