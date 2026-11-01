"use client";

/* ============================================================================
   测评五步表单（PRD 13.3 – 13.7）
   ============================================================================
   每一步只负责自己的字段，整体状态由 AssessWizard 持有。
   字段与 types.ts 严格对应，不做多余推断。
   ============================================================================ */

import type {
  PlayAction,
  PlayStyleTag,
  Position,
  UserProfile,
} from "@/lib/types";
import {
  CheckRow,
  ChoiceGroup,
  FieldGroup,
  Grid2,
  MultiChoiceGroup,
  NumberField,
  ScaleRow,
} from "./controls";

/* ---------------------------------------------------------------- 选项 */

const GENDER = [
  { value: "male" as const, label: "男" },
  { value: "female" as const, label: "女" },
];

const FOREFOOT = [
  { value: "narrow" as const, label: "窄", hint: "容易被两侧挤压" },
  { value: "standard" as const, label: "标准" },
  { value: "wide" as const, label: "宽", hint: "常被鞋头夹脚" },
  { value: "veryWide" as const, label: "很宽", hint: "很难买到合适楦型" },
];

const ARCH = [
  { value: "low" as const, label: "低足弓" },
  { value: "medium" as const, label: "正常" },
  { value: "high" as const, label: "高足弓" },
];

const INSTEP = [
  { value: "low" as const, label: "低" },
  { value: "medium" as const, label: "中等" },
  { value: "high" as const, label: "高" },
];

const LAST_PREF = [
  { value: "normal" as const, label: "正常楦" },
  { value: "wide" as const, label: "偏宽楦" },
  { value: "narrow" as const, label: "偏窄楦" },
];

const INJURY_AREA = [
  { value: "ankle" as const, label: "脚踝" },
  { value: "achilles" as const, label: "跟腱" },
  { value: "knee" as const, label: "膝盖" },
  { value: "acl" as const, label: "前交叉韧带" },
  { value: "plantar" as const, label: "足底" },
  { value: "arch" as const, label: "足弓" },
  { value: "forefoot" as const, label: "前掌" },
  { value: "other" as const, label: "其他" },
];

const INJURY_STATE = [
  { value: "current" as const, label: "当前有伤" },
  { value: "recovering" as const, label: "恢复中" },
  { value: "history" as const, label: "既往伤病" },
];

const POSITION = [
  { value: "PG" as const, label: "PG 控球后卫" },
  { value: "SG" as const, label: "SG 得分后卫" },
  { value: "SF" as const, label: "SF 小前锋" },
  { value: "PF" as const, label: "PF 大前锋" },
  { value: "C" as const, label: "C 中锋" },
];

/** 打法按位置分组（PRD 5.4 级联） */
export const PLAY_STYLE_BY_POS: Record<Position, { value: PlayStyleTag; label: string }[]> = {
  PG: [
    { value: "rhythmChange", label: "节奏变换" },
    { value: "burstDrive", label: "突破爆发" },
    { value: "movingShot", label: "移动投篮" },
    { value: "offBallShot", label: "无球投篮" },
    { value: "guardAllRound", label: "后卫全能" },
  ],
  SG: [
    { value: "rhythmChange", label: "节奏变换" },
    { value: "burstDrive", label: "突破爆发" },
    { value: "movingShot", label: "移动投篮" },
    { value: "offBallShot", label: "无球投篮" },
    { value: "guardAllRound", label: "后卫全能" },
  ],
  SF: [
    { value: "wingAllRound", label: "锋线全能" },
    { value: "driveAndShoot", label: "突破投篮" },
    { value: "defRebound", label: "防守篮板" },
    { value: "transition", label: "转换冲击" },
    { value: "dunkFinish", label: "扣篮终结" },
  ],
  PF: [
    { value: "wingAllRound", label: "锋线全能" },
    { value: "driveAndShoot", label: "突破投篮" },
    { value: "defRebound", label: "防守篮板" },
    { value: "transition", label: "转换冲击" },
    { value: "dunkFinish", label: "扣篮终结" },
  ],
  C: [
    { value: "stretchBig", label: "空间型内线" },
    { value: "postAnchor", label: "站桩对抗" },
    { value: "postUp", label: "背打对抗" },
    { value: "rimProtect", label: "护框快跳" },
    { value: "switchMobile", label: "移动换防" },
  ],
};

const ACTIONS: { value: PlayAction; label: string }[] = [
  { value: "onBall", label: "持球" },
  { value: "pickAndRoll", label: "挡拆" },
  { value: "crossover", label: "变向启动" },
  { value: "stepBack", label: "急停后撤" },
  { value: "lateralDefense", label: "横移防守" },
  { value: "jumpLanding", label: "起跳落地" },
  { value: "paintContact", label: "篮下对抗" },
];

const FORMAT = [
  { value: "half" as const, label: "半场" },
  { value: "full" as const, label: "全场" },
  { value: "both" as const, label: "两者都有" },
];

const COURT = [
  { value: "indoorWood" as const, label: "室内木地板" },
  { value: "outdoorRubber" as const, label: "室外橡胶" },
  { value: "outdoorConcrete" as const, label: "室外水泥" },
];

const MOVEMENT: { value: "straight" | "lateral" | "crossover" | "stepBack" | "jumpLanding"; label: string }[] = [
  { value: "straight", label: "直线加速" },
  { value: "lateral", label: "横移" },
  { value: "crossover", label: "变向启动" },
  { value: "stepBack", label: "急停后撤" },
  { value: "jumpLanding", label: "起跳落地" },
];

const CUSHION = [
  { value: "soft" as const, label: "偏软" },
  { value: "balanced" as const, label: "平衡" },
  { value: "firm" as const, label: "偏硬" },
];

const RESPONSE = [
  { value: "fast" as const, label: "要快" },
  { value: "balanced" as const, label: "平衡" },
  { value: "comfort" as const, label: "舒适优先" },
];

const COURT_FEEL = [
  { value: "ground" as const, label: "贴地" },
  { value: "balanced" as const, label: "平衡" },
  { value: "cushioned" as const, label: "高缓震" },
];

const COLLAR = [
  { value: "low" as const, label: "低帮" },
  { value: "mid" as const, label: "中帮" },
  { value: "high" as const, label: "高帮" },
];

const PLATE_PREF = [
  { value: "want" as const, label: "希望有碳板" },
  { value: "neutral" as const, label: "无所谓" },
  { value: "avoid" as const, label: "想避开碳板" },
];

/* ---------------------------------------------------------------- 通用类型 */

type Patch<T> = (p: Partial<T>) => void;

/* ================================================================ 步骤 1 */

export function StepBody({
  profile,
  patch,
}: {
  profile: UserProfile;
  patch: Patch<UserProfile["body"]>;
}) {
  const b = profile.body;

  const setAbility = (
    key: "explosive" | "mobility" | "running" | "braking" | "contact" | "landingStability",
    level: 1 | 2 | 3 | 4 | 5
  ) => {
    const cur = b[key];
    patch({ [key]: { level, source: cur.source } } as Partial<UserProfile["body"]>);
  };

  const toggleSource = (tested: boolean) => {
    const src = tested ? "tested" : "selfReported";
    patch({
      explosive: { ...b.explosive, source: src },
      mobility: { ...b.mobility, source: src },
      running: { ...b.running, source: src },
      braking: { ...b.braking, source: src },
      contact: { ...b.contact, source: src },
      landingStability: { ...b.landingStability, source: src },
    });
  };

  return (
    <div className="step-body">
      <FieldGroup title="基础资料" note="身高体重直接影响缓震与稳定的需求强度。">
        <Grid2>
          <NumberField label="年龄" value={b.age} onChange={(v) => patch({ age: v ?? 25 })} unit="岁" min={10} max={80} />
          <div>
            <span className="num-label">性别</span>
            <ChoiceGroup options={GENDER} value={b.gender} onChange={(v) => patch({ gender: v })} cols={2} />
          </div>
          <NumberField label="身高" value={b.heightCm} onChange={(v) => patch({ heightCm: v ?? 175 })} unit="cm" min={140} max={230} />
          <NumberField label="体重" value={b.weightKg} onChange={(v) => patch({ weightKg: v ?? 70 })} unit="kg" min={40} max={180} />
        </Grid2>
      </FieldGroup>

      <FieldGroup
        title="运动能力"
        note="六项独立评估，不合成总分。有标准化测试成绩请勾选下方开关。"
      >
        <CheckRow
          label="以下能力来自标准化测试"
          hint="未勾选则按自评处理，相关结论可信度会降低"
          checked={b.explosive.source === "tested"}
          onChange={toggleSource}
        />
        <div className="scale-stack">
          <ScaleRow label="爆发力" hint="第一步启动与起跳" value={b.explosive.level} onChange={(v) => setAbility("explosive", v)} anchors={["较弱", "很强"]} />
          <ScaleRow label="移动能力" hint="横移与变向" value={b.mobility.level} onChange={(v) => setAbility("mobility", v)} anchors={["较弱", "很强"]} />
          <ScaleRow label="跑动能力" hint="持续跑动与续航" value={b.running.level} onChange={(v) => setAbility("running", v)} anchors={["较弱", "很强"]} />
          <ScaleRow label="制动能力" hint="急停与减速" value={b.braking.level} onChange={(v) => setAbility("braking", v)} anchors={["较弱", "很强"]} />
          <ScaleRow label="对抗能力" hint="身体接触与卡位" value={b.contact.level} onChange={(v) => setAbility("contact", v)} anchors={["较弱", "很强"]} />
          <ScaleRow label="落地稳定" hint="起跳后控制身体" value={b.landingStability.level} onChange={(v) => setAbility("landingStability", v)} anchors={["较弱", "很强"]} />
        </div>
      </FieldGroup>

      <FieldGroup title="运动习惯" note="仅用于履历与辅助解释，默认不直接影响排序。">
        <Grid2>
          <NumberField label="每周打球" value={b.frequencyPerWeek} onChange={(v) => patch({ frequencyPerWeek: v ?? 2 })} unit="次" min={0} max={7} />
          <NumberField label="单次时长" value={b.sessionMinutes} onChange={(v) => patch({ sessionMinutes: v ?? 90 })} unit="分钟" min={20} max={300} />
          <NumberField label="球龄" value={b.experienceYears} onChange={(v) => patch({ experienceYears: v ?? 3 })} unit="年" min={0} max={40} />
        </Grid2>
      </FieldGroup>
    </div>
  );
}

/* ================================================================ 步骤 2 */

export function StepFoot({
  profile,
  patch,
}: {
  profile: UserProfile;
  patch: Patch<UserProfile["foot"]>;
}) {
  const f = profile.foot;

  return (
    <div className="step-foot">
      <FieldGroup
        title="左右脚实测"
        note="必须分开填写。系统会以「更需要空间的一侧」作为楦型与尺码的约束。"
      >
        <div className="foot-table">
          <div className="foot-row foot-head">
            <span />
            <span>左脚</span>
            <span>右脚</span>
          </div>
          <div className="foot-row">
            <span className="foot-key">脚长 mm</span>
            <NumberField label="" value={f.left.lengthMm} onChange={(v) => patch({ left: { ...f.left, lengthMm: v } })} unit="mm" min={200} max={330} />
            <NumberField label="" value={f.right.lengthMm} onChange={(v) => patch({ right: { ...f.right, lengthMm: v } })} unit="mm" min={200} max={330} />
          </div>
          <div className="foot-row">
            <span className="foot-key">脚宽 mm</span>
            <NumberField label="" value={f.left.widthMm} onChange={(v) => patch({ left: { ...f.left, widthMm: v } })} unit="mm" min={70} max={140} />
            <NumberField label="" value={f.right.widthMm} onChange={(v) => patch({ right: { ...f.right, widthMm: v } })} unit="mm" min={70} max={140} />
          </div>
          <div className="foot-row">
            <span className="foot-key">常穿尺码</span>
            <NumberField label="" value={f.left.usualSize} onChange={(v) => patch({ left: { ...f.left, usualSize: v } })} unit="EU" min={35} max={52} step={0.5} />
            <NumberField label="" value={f.right.usualSize} onChange={(v) => patch({ right: { ...f.right, usualSize: v } })} unit="EU" min={35} max={52} step={0.5} />
          </div>
        </div>
        <p className="foot-tip">
          怎么量：傍晚站立踩白纸，沿脚最外缘画线。脚长取脚后跟到最长脚趾的直线距离，脚宽取前掌最宽处。
        </p>
      </FieldGroup>

      <FieldGroup title="前掌">
        <ChoiceGroup options={FOREFOOT} value={f.forefoot.width} onChange={(v) => patch({ forefoot: { ...f.forefoot, width: v } })} cols={2} />
        <Grid2>
          <ScaleRow label="空间需求" hint="需要多少前掌空间" value={f.forefoot.spaceNeed} onChange={(v) => patch({ forefoot: { ...f.forefoot, spaceNeed: v } })} anchors={["够用就行", "必须宽裕"]} />
          <ScaleRow label="压迫敏感度" hint="被挤脚时有多难受" value={f.forefoot.pressureSensitivity} onChange={(v) => patch({ forefoot: { ...f.forefoot, pressureSensitivity: v } })} anchors={["不敏感", "非常敏感"]} />
        </Grid2>
      </FieldGroup>

      <FieldGroup title="足中">
        <ChoiceGroup options={ARCH} value={f.midfoot.arch} onChange={(v) => patch({ midfoot: { ...f.midfoot, arch: v } })} cols={3} />
        <Grid2>
          <ScaleRow label="包裹需求" value={f.midfoot.wrapNeed} onChange={(v) => patch({ midfoot: { ...f.midfoot, wrapNeed: v } })} anchors={["松一点", "要紧"]} />
          <ScaleRow label="足弓支撑需求" value={f.midfoot.archSupportNeed} onChange={(v) => patch({ midfoot: { ...f.midfoot, archSupportNeed: v } })} anchors={["无所谓", "很需要"]} />
        </Grid2>
      </FieldGroup>

      <FieldGroup title="后跟与脚背">
        <Grid2>
          <ScaleRow label="掉跟风险" hint="穿鞋时后跟是否容易滑出" value={f.heel.slipRisk} onChange={(v) => patch({ heel: { ...f.heel, slipRisk: v } })} anchors={["从不", "经常"]} />
          <ScaleRow label="锁定需求" value={f.heel.lockdownNeed} onChange={(v) => patch({ heel: { ...f.heel, lockdownNeed: v } })} anchors={["一般", "必须锁紧"]} />
        </Grid2>
        <div className="mt-block">
          <span className="num-label">脚背高度</span>
          <ChoiceGroup options={INSTEP} value={f.instep.height} onChange={(v) => patch({ instep: { ...f.instep, height: v } })} cols={3} />
        </div>
        <ScaleRow label="鞋带区压力敏感" value={f.instep.lacePressureSensitivity} onChange={(v) => patch({ instep: { ...f.instep, lacePressureSensitivity: v } })} anchors={["不敏感", "压得疼"]} />
      </FieldGroup>

      <FieldGroup title="楦型偏好">
        <ChoiceGroup options={LAST_PREF} value={f.lastPreference} onChange={(v) => patch({ lastPreference: v })} cols={3} />
      </FieldGroup>
    </div>
  );
}

/* ================================================================ 步骤 3 */

export function StepInjury({
  profile,
  patch,
}: {
  profile: UserProfile;
  patch: Patch<UserProfile["injury"]>;
}) {
  const inj = profile.injury;
  const r = inj.restrictions;

  const addEntry = (area: (typeof INJURY_AREA)[number]["value"]) => {
    if (inj.entries.some((e) => e.area === area)) return;
    patch({ entries: [...inj.entries, { area, state: "recovering", severity: 2 }] });
  };

  const removeEntry = (area: string) => {
    patch({ entries: inj.entries.filter((e) => e.area !== area) });
  };

  const updateEntry = (area: string, p: Partial<(typeof inj.entries)[number]>) => {
    patch({ entries: inj.entries.map((e) => (e.area === area ? { ...e, ...p } : e)) });
  };

  return (
    <div className="step-injury">
      <FieldGroup
        title="当前或既往伤病"
        note="点击添加。平台不提供医疗诊断，仅用于筛选结构上更安全的鞋款。"
      >
        <div className="injury-picker">
          {INJURY_AREA.map((a) => {
            const on = inj.entries.some((e) => e.area === a.value);
            return (
              <button
                type="button"
                key={a.value}
                className={`injury-chip ${on ? "is-on" : ""}`}
                onClick={() => (on ? removeEntry(a.value) : addEntry(a.value))}
              >
                {a.label}
                <b>{on ? "✓" : "+"}</b>
              </button>
            );
          })}
        </div>

        {inj.entries.length > 0 && (
          <div className="injury-list">
            {inj.entries.map((e) => (
              <div className="injury-item" key={e.area}>
                <strong>{INJURY_AREA.find((x) => x.value === e.area)?.label}</strong>
                <div className="injury-item-row">
                  <ChoiceGroup
                    options={INJURY_STATE}
                    value={e.state}
                    onChange={(v) => updateEntry(e.area, { state: v })}
                    cols={3}
                  />
                </div>
                <div className="injury-item-row">
                  <ScaleRow
                    label="严重程度"
                    value={e.severity}
                    onChange={(v) => updateEntry(e.area, { severity: v as 1 | 2 | 3 })}
                    anchors={["轻微", "严重"]}
                    levels={[1, 2, 3]}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </FieldGroup>

      <FieldGroup
        title="硬性限制"
        note="勾选后会被当作不可妥协的条件，不满足的鞋款将直接被排除。"
      >
        <div className="restrict-stack">
          <ChoiceGroup
            options={[
              { value: "any" as const, label: "落差无要求" },
              { value: "lowOnly" as const, label: "必须低落差（≤8mm）" },
            ]}
            value={r.dropLimit}
            onChange={(v) => patch({ restrictions: { ...r, dropLimit: v } })}
            cols={2}
          />
          <ChoiceGroup
            options={[
              { value: "none" as const, label: "鞋领无要求" },
              { value: "mid" as const, label: "必须中帮以上" },
              { value: "high" as const, label: "必须高帮" },
            ]}
            value={r.collarRequired === undefined ? null : (r.collarRequired ?? "none")}
            onChange={(v) => patch({ restrictions: { ...r, collarRequired: v === "none" ? null : v } })}
            cols={3}
          />
          <CheckRow label="必须有缓震" hint="足底或膝部不适时建议勾选" checked={r.cushionRequired} onChange={(v) => patch({ restrictions: { ...r, cushionRequired: v } })} />
          <CheckRow label="必须有抗扭支撑" hint="膝或前交叉韧带问题建议勾选" checked={r.torsionRequired} onChange={(v) => patch({ restrictions: { ...r, torsionRequired: v } })} />
          <CheckRow label="必须避开碳板" hint="部分用户穿碳板会不适" checked={r.carbonPlateAvoid} onChange={(v) => patch({ restrictions: { ...r, carbonPlateAvoid: v } })} />
        </div>
      </FieldGroup>
    </div>
  );
}

/* ================================================================ 步骤 4 */

export function StepPlay({
  profile,
  patchPlay,
  patchEnv,
}: {
  profile: UserProfile;
  patchPlay: Patch<UserProfile["play"]>;
  patchEnv: Patch<UserProfile["environment"]>;
}) {
  const p = profile.play;
  const env = profile.environment;
  const styles = p.position ? PLAY_STYLE_BY_POS[p.position] ?? [] : [];

  return (
    <div className="step-play">
      <FieldGroup title="位置" note="切换位置后，打法选项会随之变化。">
        <ChoiceGroup
          options={POSITION}
          value={p.position}
          onChange={(v) => {
            /* 切换位置时，打法重置为该位置第一项，避免出现非法组合 */
            patchPlay({ position: v, primaryStyle: "" as never, secondaryStyle: undefined });
          }}
          cols={3}
        />
      </FieldGroup>

      {p.position && <FieldGroup title="主打法" note={`当前显示 ${p.position} 位置的打法选项。`}>
        <ChoiceGroup
          options={styles}
          value={p.primaryStyle}
          onChange={(v) => patchPlay({ primaryStyle: v })}
          cols={2}
        />
      </FieldGroup>}

      {p.position && <FieldGroup title="次打法" note="可留空。用于在主打法接近时区分优先级。">
        <ChoiceGroup
          options={[{ value: "" as PlayStyleTag, label: "不选" }, ...styles]}
          value={p.secondaryStyle ?? ""}
          onChange={(v) => patchPlay({ secondaryStyle: v === "" ? undefined : v })}
          cols={2}
        />
      </FieldGroup>}

      <FieldGroup title="动作侧重" note="可多选。影响制动、抓地与侧向支撑的权重。">
        <MultiChoiceGroup
          options={ACTIONS}
          value={p.actions}
          onChange={(v) => patchPlay({ actions: v })}
          cols={3}
        />
      </FieldGroup>

      <FieldGroup title="比赛形式">
        <ChoiceGroup options={FORMAT} value={env.format} onChange={(v) => patchEnv({ format: v })} cols={3} />
      </FieldGroup>

      <FieldGroup title="主要场地" note="抓地与耐磨会按场地类型分别判断。">
        <ChoiceGroup options={COURT} value={env.court} onChange={(v) => patchEnv({ court: v })} cols={3} />
      </FieldGroup>

      {env.court && env.court === "indoorWood" && (
        <FieldGroup title="室内场地状况" note="浮灰与潮湿会显著改变抓地表现。">
          <div className="restrict-stack">
            <CheckRow
              label="场地有浮灰"
              hint="木地板发滑、有灰尘"
              checked={env.indoor?.dusty ?? false}
              onChange={(v) => patchEnv({ indoor: { ...(env.indoor ?? { dusty: false, humid: false }), dusty: v } })}
            />
            <CheckRow
              label="潮湿或梅雨季节"
              hint="南方梅雨、空调冷凝水"
              checked={env.indoor?.humid ?? false}
              onChange={(v) => patchEnv({ indoor: { ...(env.indoor ?? { dusty: false, humid: false }), humid: v } })}
            />
          </div>
        </FieldGroup>
      )}

      {env.court && env.court !== "indoorWood" && (
        <FieldGroup title="室外磨损程度" note="磨损越大，耐磨权重越高。">
          <ChoiceGroup
            options={[
              { value: "low" as const, label: "轻微" },
              { value: "medium" as const, label: "中等" },
              { value: "high" as const, label: "严重" },
            ]}
            value={env.outdoorWear ?? "medium"}
            onChange={(v) => patchEnv({ outdoorWear: v })}
            cols={3}
          />
        </FieldGroup>
      )}

      <FieldGroup title="移动特征" note="可多选。">
        <MultiChoiceGroup
          options={MOVEMENT}
          value={env.movement}
          onChange={(v) => patchEnv({ movement: v })}
          cols={3}
        />
      </FieldGroup>
    </div>
  );
}

/* ================================================================ 步骤 5 */

export function StepPreference({
  profile,
  patch,
}: {
  profile: UserProfile;
  patch: Patch<UserProfile["preference"]>;
}) {
  const p = profile.preference;

  return (
    <div className="step-pref">
      <FieldGroup
        title="缓震手感"
        note="这是最关键的一项。如果你要缓震但不接受软塌，选「平衡」。"
      >
        <ChoiceGroup options={CUSHION} value={p.cushion} onChange={(v) => patch({ cushion: v })} cols={3} />
      </FieldGroup>

      <FieldGroup title="响应与贴地">
        <div className="mt-block">
          <span className="num-label">响应</span>
          <ChoiceGroup options={RESPONSE} value={p.response} onChange={(v) => patch({ response: v })} cols={3} />
        </div>
        <div className="mt-block">
          <span className="num-label">贴地感</span>
          <ChoiceGroup options={COURT_FEEL} value={p.courtFeel} onChange={(v) => patch({ courtFeel: v })} cols={3} />
        </div>
      </FieldGroup>

      <FieldGroup title="鞋领偏好" note="仅作为偏好。若伤病页勾选了鞋领硬需求，以硬需求为准。">
        <ChoiceGroup options={COLLAR} value={p.collar} onChange={(v) => patch({ collar: v })} cols={3} />
      </FieldGroup>

      <FieldGroup title="其他偏好">
        <div className="scale-stack">
          <ScaleRow label="包裹需求" value={p.wrapNeed} onChange={(v) => patch({ wrapNeed: v })} anchors={["松", "紧"]} />
          <ScaleRow label="灵活需求" value={p.flexibilityNeed} onChange={(v) => patch({ flexibilityNeed: v })} anchors={["稳定优先", "灵活优先"]} />
          <ScaleRow label="滚动感需求" value={p.rollFeelNeed} onChange={(v) => patch({ rollFeelNeed: v })} anchors={["不需要", "很需要"]} />
          <ScaleRow label="稳定感需求" value={p.stabilityFeelNeed} onChange={(v) => patch({ stabilityFeelNeed: v })} anchors={["不需要", "很需要"]} />
          <ScaleRow label="重量敏感度" value={p.weightSensitivity} onChange={(v) => patch({ weightSensitivity: v })} anchors={["不在意", "越轻越好"]} />
        </div>
      </FieldGroup>

      <FieldGroup title="碳板偏好">
        <ChoiceGroup options={PLATE_PREF} value={p.carbonPlatePref} onChange={(v) => patch({ carbonPlatePref: v })} cols={3} />
      </FieldGroup>
    </div>
  );
}
