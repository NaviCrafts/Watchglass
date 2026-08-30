import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceArea,
} from "recharts";

/* ------------------------------------------------------------------ */
/* palette                                                             */
/* ------------------------------------------------------------------ */

const C = {
  deep: "#0c171b",
  surface: "#132329",
  surfaceHi: "#1a2f36",
  line: "#24424b",
  text: "#e4efee",
  dim: "#82a0a6",
  faint: "#5b767c",
  safe: "#4aa88f",
  markRing: "#1f6d5a",
  caution: "#d8a24a",
  danger: "#cf5f4c",
};

const LEVEL_COLOR = { safe: C.safe, caution: C.caution, danger: C.danger };

/* ------------------------------------------------------------------ */
/* parameter definitions                                               */
/* ------------------------------------------------------------------ */

const NITRO = {
  ammonia: {
    name: "Ammonia",
    unit: "ppm",
    min: 0,
    max: 1,
    step: 0.05,
    zones: [
      { from: 0, to: 0.02, level: "safe" },
      { from: 0.02, to: 0.25, level: "caution" },
      { from: 0.25, to: 1, level: "danger" },
    ],
  },
  nitrite: {
    name: "Nitrite",
    unit: "ppm",
    min: 0,
    max: 1,
    step: 0.05,
    zones: [
      { from: 0, to: 0.02, level: "safe" },
      { from: 0.02, to: 0.25, level: "caution" },
      { from: 0.25, to: 1, level: "danger" },
    ],
  },
  nitrate: {
    name: "Nitrate",
    unit: "ppm",
    min: 0,
    max: 80,
    step: 5,
    zones: [
      { from: 0, to: 20, level: "safe" },
      { from: 20, to: 40, level: "caution" },
      { from: 40, to: 80, level: "danger" },
    ],
  },
};

const PRESETS = {
  malawi: {
    label: "Malawi / hard water cichlids",
    params: {
      ...NITRO,
      ph: {
        name: "pH",
        unit: "",
        min: 6,
        max: 9,
        step: 0.1,
        zones: [
          { from: 6, to: 7.2, level: "danger" },
          { from: 7.2, to: 7.8, level: "caution" },
          { from: 7.8, to: 8.6, level: "safe" },
          { from: 8.6, to: 9, level: "caution" },
        ],
      },
      temp: {
        name: "Temperature",
        unit: "\u00B0C",
        min: 20,
        max: 32,
        step: 0.1,
        zones: [
          { from: 20, to: 23, level: "danger" },
          { from: 23, to: 24, level: "caution" },
          { from: 24, to: 27.5, level: "safe" },
          { from: 27.5, to: 29, level: "caution" },
          { from: 29, to: 32, level: "danger" },
        ],
      },
      kh: {
        name: "Carbonate hardness",
        unit: "dKH",
        min: 0,
        max: 20,
        step: 1,
        zones: [
          { from: 0, to: 4, level: "danger" },
          { from: 4, to: 6, level: "caution" },
          { from: 6, to: 16, level: "safe" },
          { from: 16, to: 20, level: "caution" },
        ],
      },
    },
  },
  tropical: {
    label: "General tropical community",
    params: {
      ...NITRO,
      ph: {
        name: "pH",
        unit: "",
        min: 5.5,
        max: 9,
        step: 0.1,
        zones: [
          { from: 5.5, to: 6.2, level: "danger" },
          { from: 6.2, to: 6.5, level: "caution" },
          { from: 6.5, to: 7.8, level: "safe" },
          { from: 7.8, to: 8.4, level: "caution" },
          { from: 8.4, to: 9, level: "danger" },
        ],
      },
      temp: {
        name: "Temperature",
        unit: "\u00B0C",
        min: 20,
        max: 32,
        step: 0.1,
        zones: [
          { from: 20, to: 22, level: "danger" },
          { from: 22, to: 23.5, level: "caution" },
          { from: 23.5, to: 27, level: "safe" },
          { from: 27, to: 29, level: "caution" },
          { from: 29, to: 32, level: "danger" },
        ],
      },
      kh: {
        name: "Carbonate hardness",
        unit: "dKH",
        min: 0,
        max: 20,
        step: 1,
        zones: [
          { from: 0, to: 2, level: "danger" },
          { from: 2, to: 3, level: "caution" },
          { from: 3, to: 12, level: "safe" },
          { from: 12, to: 20, level: "caution" },
        ],
      },
    },
  },
};

const PARAM_ORDER = ["ammonia", "nitrite", "nitrate", "ph", "temp", "kh"];

const EVENT_TYPES = {
  waterChange: { label: "Water change", hasValue: true },
  filter: { label: "Filter rinse", hasValue: false },
  dose: { label: "Dosed conditioner", hasValue: false },
  note: { label: "Note", hasValue: false },
};

const FILTER_TYPES = {
  canister: { label: "External canister", factor: 0.65 },
  internal: { label: "Internal", factor: 0.8 },
  hob: { label: "Hang-on-back", factor: 0.8 },
  sponge: { label: "Sponge", factor: 0 },
};

const EQUIPMENT_FIELDS = [
  { key: "heaterName", label: "Heater", placeholder: "Fluval E200", type: "text" },
  { key: "heaterW", label: "Heater wattage", placeholder: "200", type: "number" },
  { key: "airStones", label: "Air stones", placeholder: "1", type: "number" },
  { key: "spongeFilter", label: "Sponge filter", placeholder: "Second sponge, left corner", type: "text" },
  { key: "waveMaker", label: "Wavemaker", placeholder: "Jecod SW-4", type: "text" },
  { key: "otherKit", label: "Anything else", placeholder: "UV steriliser, auto feeder", type: "text" },
];

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const STORE_KEY = "aquarium-log-v2";
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);

function daysSince(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr + "T00:00:00");
  const now = new Date(today() + "T00:00:00");
  return Math.round((now - then) / 86400000);
}

function levelFor(param, value) {
  if (value === null || value === undefined || value === "") return null;
  const v = Number(value);
  if (Number.isNaN(v)) return null;
  for (const z of param.zones) if (v >= z.from && v < z.to) return z.level;
  return param.zones[param.zones.length - 1].level;
}

function pct(param, value) {
  const v = Math.min(Math.max(Number(value), param.min), param.max);
  return ((v - param.min) / (param.max - param.min)) * 100;
}

const fmt = (v) => (v === null || v === undefined || v === "" ? "\u2014" : String(Number(v)));

function relativeDay(dateStr) {
  const d = daysSince(dateStr);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d !== null && d < 7) return d + " days ago";
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

/* ------------------------------------------------------------------ */
/* advice                                                              */
/* ------------------------------------------------------------------ */

function buildAdvice(latest) {
  if (!latest) {
    return {
      level: "caution",
      headline: "No readings yet",
      detail: "Log a test to start tracking. Ammonia and nitrite matter most while the filter is maturing.",
      changePct: null,
    };
  }
  const a = Number(latest.ammonia || 0);
  const n = Number(latest.nitrite || 0);
  const nt = Number(latest.nitrate || 0);
  const age = daysSince(latest.date);

  if (a > 0.25 || n > 0.25)
    return {
      level: "danger",
      headline: "Change 50% of the water today",
      detail: "Ammonia or nitrite is high enough to damage gills. Match the temperature, dechlorinate, and retest a few hours later.",
      changePct: 50,
    };
  if (a > 0.02 || n > 0.02)
    return {
      level: "caution",
      headline: "Change 30% of the water today",
      detail: "Traces of ammonia or nitrite mean the filter is still catching up. Keep feeding light and test again tomorrow.",
      changePct: 30,
    };
  if (nt > 40)
    return {
      level: "caution",
      headline: "Nitrate is climbing \u2014 change 30%",
      detail: "Ammonia and nitrite are clear, so the filter is working. This is housekeeping, not an emergency.",
      changePct: 30,
    };
  if (age !== null && age > 3)
    return {
      level: "caution",
      headline: "Last test was " + age + " days ago",
      detail: "Readings go stale quickly in a young tank. Worth running ammonia and nitrite again.",
      changePct: null,
    };
  return {
    level: "safe",
    headline: "Parameters look good",
    detail: "Nothing needs doing today. Keep to your normal water change schedule.",
    changePct: null,
  };
}

function effectiveFlow(filters) {
  return filters.reduce(
    (sum, f) => sum + (Number(f.lph) || 0) * (FILTER_TYPES[f.type] ? FILTER_TYPES[f.type].factor : 0.7),
    0
  );
}

function equipmentChecks(settings, equipment, filters, latest) {
  const out = [];
  const vol = Number(settings.volumeL) || 0;
  const watts = Number(equipment.heaterW) || 0;
  const stones = Number(equipment.airStones) || 0;
  const flow = effectiveFlow(filters);

  if (vol && flow) {
    const turnover = flow / vol;
    if (turnover < 3)
      out.push(
        "Real turnover is about " +
          turnover.toFixed(1) +
          "× per hour once media resistance is accounted for. Cichlids want 4× or better, so you're light on filtration."
      );
    else if (turnover > 12)
      out.push(
        "Real turnover is about " + turnover.toFixed(1) + "× per hour, which is brisk. Watch that fish aren't fighting the current."
      );
  }
  if (filters.length > 1)
    out.push("You're running more than one filter. Never clean them in the same week — stagger them so one colony always stays intact.");
  if (vol && watts && watts < vol * 0.8)
    out.push(
      "Heater is " + watts + " W for " + vol + " L. That's light — expect it to struggle if the room gets cold."
    );
  if (latest && Number(latest.temp) >= 27.5 && stones < 1)
    out.push("Temperature is high and no air stone is set up. Warm water holds less oxygen — add aeration.");
  return out;
}

function cycleState(tests) {
  if (tests.length < 3) return null;
  const recent = tests.slice(0, 5);
  const clean = recent.filter((t) => Number(t.ammonia || 0) <= 0.02 && Number(t.nitrite || 0) <= 0.02);
  const hasNitrate = recent.some((t) => Number(t.nitrate || 0) > 5);
  if (clean.length >= 3 && hasNitrate) return "Filter looks established";
  if (recent.some((t) => Number(t.nitrite || 0) > 0.02)) return "Nitrite stage of the cycle";
  if (recent.some((t) => Number(t.ammonia || 0) > 0.02)) return "Ammonia stage of the cycle";
  return "Cycle in progress";
}

/* ------------------------------------------------------------------ */
/* small components                                                    */
/* ------------------------------------------------------------------ */

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  fontSize: 16,
  color: C.text,
  background: C.surfaceHi,
  border: "1px solid " + C.line,
  borderRadius: 8,
  outline: "none",
};

function Mark({ size = 64, tickX = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      <circle cx="32" cy="32" r="26" fill="none" stroke={C.markRing} strokeWidth="4" />
      <rect x="14" y="29" width="36" height="6" rx="3" fill={C.markRing} />
      <rect x={tickX} y="22" width="5" height="20" rx="2.5" fill={C.safe} />
    </svg>
  );
}

function SweepingMark({ size = 76 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ display: "block" }}>
      <circle cx="32" cy="32" r="26" fill="none" stroke={C.markRing} strokeWidth="4" />
      <rect x="14" y="29" width="36" height="6" rx="3" fill={C.markRing} />
      <rect className="wg-tick" x="14" y="22" width="5" height="20" rx="2.5" fill={C.safe} />
    </svg>
  );
}

function RangeBar({ param, value }) {
  const lvl = levelFor(param, value);
  const has = value !== "" && value !== null && value !== undefined && !Number.isNaN(Number(value));
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ color: C.dim, fontSize: 13 }}>{param.name}</span>
        <span
          style={{
            fontVariantNumeric: "tabular-nums",
            fontSize: 15,
            fontWeight: 600,
            color: has ? LEVEL_COLOR[lvl] || C.text : C.faint,
          }}
        >
          {fmt(value)}
          {has && param.unit ? " " + param.unit : ""}
        </span>
      </div>
      <div style={{ position: "relative", height: 8, borderRadius: 4, overflow: "hidden", background: C.surfaceHi }}>
        {param.zones.map((z, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pct(param, z.from) + "%",
              width: pct(param, z.to) - pct(param, z.from) + "%",
              top: 0,
              bottom: 0,
              background: LEVEL_COLOR[z.level],
              opacity: 0.28,
            }}
          />
        ))}
        {has && (
          <div
            style={{
              position: "absolute",
              left: "calc(" + pct(param, value) + "% - 2px)",
              top: -2,
              width: 4,
              height: 12,
              borderRadius: 2,
              background: LEVEL_COLOR[lvl] || C.text,
              boxShadow: "0 0 0 2px " + C.surface,
            }}
          />
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, step, borderColor }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", fontSize: 13, color: C.dim, marginBottom: 6 }}>{label}</span>
      <input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, border: "1px solid " + (borderColor || C.line) }}
      />
    </label>
  );
}

function Tab({ id, active, onClick, children }) {
  const on = id === active;
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        flex: 1,
        padding: "12px 2px",
        background: "transparent",
        border: "none",
        borderTop: "2px solid " + (on ? C.safe : "transparent"),
        color: on ? C.text : C.faint,
        fontSize: 12,
        fontWeight: on ? 600 : 400,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Btn({ onClick, children, tone = "quiet", style = {}, disabled }) {
  const tones = {
    primary: { bg: C.safe, fg: "#071a15", border: C.safe },
    quiet: { bg: "transparent", fg: C.text, border: C.line },
  };
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "11px 16px",
        borderRadius: 8,
        background: t.bg,
        color: t.fg,
        border: "1px solid " + t.border,
        fontSize: 15,
        fontWeight: tone === "primary" ? 600 : 400,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

const Empty = ({ children }) => (
  <p style={{ color: C.faint, fontSize: 14, lineHeight: 1.6, margin: "24px 0" }}>{children}</p>
);

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 13, color: C.dim, marginBottom: 10 }}>{children}</div>
);

/* ------------------------------------------------------------------ */
/* main                                                                */
/* ------------------------------------------------------------------ */

const BLANK = { ammonia: "", nitrite: "", nitrate: "", ph: "", temp: "", kh: "" };
const BLANK_EQUIP = {
  heaterName: "",
  heaterW: "",
  airStones: "",
  spongeFilter: "",
  waveMaker: "",
  otherKit: "",
};

export default function AquariumTracker() {
  const [tab, setTab] = useState("today");
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(null);

  const [settings, setSettings] = useState({ volumeL: 190, preset: "malawi", name: "Trigon" });
  const [equipment, setEquipment] = useState({ ...BLANK_EQUIP });
  const [filters, setFilters] = useState([]);
  const [newFilter, setNewFilter] = useState({ name: "", lph: "", type: "canister" });
  const [tests, setTests] = useState([]);
  const [stock, setStock] = useState([]);
  const [events, setEvents] = useState([]);

  const [draft, setDraft] = useState({ ...BLANK, date: today() });
  const [chartParam, setChartParam] = useState("ammonia");
  const [newFish, setNewFish] = useState({ name: "", count: "", adultCm: "" });
  const [noteDraft, setNoteDraft] = useState("");

  const [chat, setChat] = useState([]);
  const [question, setQuestion] = useState("");
  const [thinking, setThinking] = useState(false);
  const chatEnd = useRef(null);

  const params = PRESETS[settings.preset].params;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await window.storage.get(STORE_KEY);
        if (!cancelled && res && res.value) {
          const d = JSON.parse(res.value);
          if (d.settings) setSettings((s) => ({ ...s, ...d.settings }));
          if (d.equipment) setEquipment((e) => ({ ...e, ...d.equipment }));
          if (d.filters) setFilters(d.filters);
          if (d.tests) setTests(d.tests);
          if (d.stock) setStock(d.stock);
          if (d.events) setEvents(d.events);
        }
      } catch (e) {
        /* first run */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    (async () => {
      try {
        const ok = await window.storage.set(
          STORE_KEY,
          JSON.stringify({ settings, equipment, filters, tests, stock, events })
        );
        setSaveError(ok ? null : "Changes aren't saving. They'll be lost when you close this.");
      } catch (e) {
        setSaveError("Changes aren't saving. They'll be lost when you close this.");
      }
    })();
  }, [settings, equipment, filters, tests, stock, events, loading]);

  useEffect(() => {
    if (chatEnd.current) chatEnd.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat, thinking]);

  const sortedTests = useMemo(() => [...tests].sort((a, b) => (a.date < b.date ? 1 : -1)), [tests]);
  const latest = sortedTests[0] || null;
  const advice = buildAdvice(latest);
  const checks = equipmentChecks(settings, equipment, filters, latest);
  const cycle = cycleState(sortedTests);
  const changeLitres =
    advice.changePct && Number(settings.volumeL)
      ? Math.round((advice.changePct / 100) * Number(settings.volumeL))
      : null;

  const lastChange = useMemo(
    () => events.filter((e) => e.type === "waterChange").sort((a, b) => (a.date < b.date ? 1 : -1))[0] || null,
    [events]
  );

  const chartData = useMemo(
    () =>
      [...sortedTests]
        .reverse()
        .filter((t) => t[chartParam] !== "" && t[chartParam] !== undefined && t[chartParam] !== null)
        .map((t) => ({
          date: new Date(t.date + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" }),
          value: Number(t[chartParam]),
        })),
    [sortedTests, chartParam]
  );

  const bioload = useMemo(() => {
    const totalCm = stock.reduce((s, f) => s + (Number(f.count) || 0) * (Number(f.adultCm) || 0), 0);
    const capacity = Number(settings.volumeL) / 2;
    return { totalCm, capacity, ratio: capacity ? totalCm / capacity : 0 };
  }, [stock, settings.volumeL]);

  /* ---- actions ---- */
  function saveTest() {
    if (!PARAM_ORDER.some((k) => draft[k] !== "")) return;
    setTests((t) => [{ id: uid(), ...draft }, ...t.filter((x) => x.date !== draft.date)]);
    setDraft({ ...BLANK, date: today() });
    setTab("today");
  }

  function quickEvent(type, value) {
    setEvents((e) => [{ id: uid(), date: today(), type, value: value || "", note: "" }, ...e]);
  }

  function addNote() {
    if (!noteDraft.trim()) return;
    setEvents((e) => [{ id: uid(), date: today(), type: "note", value: "", note: noteDraft.trim() }, ...e]);
    setNoteDraft("");
  }

  function addFilter() {
    if (!newFilter.name.trim()) return;
    setFilters((f) => [
      ...f,
      { id: uid(), name: newFilter.name.trim(), lph: Number(newFilter.lph) || 0, type: newFilter.type },
    ]);
    setNewFilter({ name: "", lph: "", type: "canister" });
  }

  function addFish() {
    if (!newFish.name.trim()) return;
    setStock((s) => [
      ...s,
      {
        id: uid(),
        name: newFish.name.trim(),
        count: Number(newFish.count) || 1,
        adultCm: Number(newFish.adultCm) || 0,
        added: today(),
      },
    ]);
    setNewFish({ name: "", count: "", adultCm: "" });
  }

  async function ask() {
    const q = question.trim();
    if (!q || thinking) return;
    setQuestion("");
    const history = [...chat, { role: "user", content: q }];
    setChat(history);
    setThinking(true);

    const snapshot = {
      tank: { name: settings.name, litres: settings.volumeL, type: PRESETS[settings.preset].label },
      equipment,
      filtration: filters.map((f) => ({ name: f.name, type: FILTER_TYPES[f.type].label, ratedLph: f.lph })),
      turnoverPerHour: Number(settings.volumeL)
        ? Number((effectiveFlow(filters) / Number(settings.volumeL)).toFixed(1))
        : null,
      stock: stock.map((f) => ({ species: f.name, count: f.count, adultCm: f.adultCm, added: f.added })),
      recentTests: sortedTests.slice(0, 8),
      recentEvents: events.slice(0, 8),
      cycleStage: cycle,
    };

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [
            ...history.slice(0, -1),
            {
              role: "user",
              content:
                "You are helping the owner of a home freshwater aquarium. Here is the current state of their tank as JSON:\n\n" +
                JSON.stringify(snapshot, null, 1) +
                "\n\nTheir question: " +
                q +
                "\n\nAnswer in plain UK English, under 150 words. Be specific and practical, and use their actual numbers where relevant. If the readings point to something urgent, lead with that. If you'd need a reading they haven't logged, say which one. Don't restate the data back to them.",
            },
          ],
        }),
      });
      const data = await res.json();
      const text = (data.content || [])
        .map((i) => (i.type === "text" ? i.text : ""))
        .filter(Boolean)
        .join("\n");
      setChat([...history, { role: "assistant", content: text || "No answer came back. Try asking again." }]);
    } catch (e) {
      setChat([...history, { role: "assistant", content: "Couldn't reach Claude just then. Check your connection and try again." }]);
    } finally {
      setThinking(false);
    }
  }

  if (loading)
    return (
      <div
        style={{
          background: C.deep,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <style>{
          "@keyframes wg-sweep{0%{transform:translateX(0)}50%{transform:translateX(31px)}100%{transform:translateX(0)}}" +
          ".wg-tick{animation:wg-sweep 1.9s ease-in-out infinite}" +
          "@media (prefers-reduced-motion:reduce){.wg-tick{animation:none;transform:translateX(15px)}}"
        }</style>
        <SweepingMark />
        <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em" }}>
          <span style={{ color: C.safe }}>watch</span>
          <span style={{ color: C.markRing }}>glass</span>
        </div>
      </div>
    );

  return (
    <div
      style={{
        background: C.deep,
        color: C.text,
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1, padding: "20px 18px 8px", maxWidth: 560, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Mark size={26} />
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>{settings.name}</h1>
          </div>
          <span style={{ color: C.faint, fontSize: 13 }}>
            {settings.volumeL} L · {stock.reduce((s, f) => s + (Number(f.count) || 0), 0)} fish
          </span>
        </div>

        {saveError && (
          <div
            style={{
              background: "rgba(207,95,76,0.14)",
              border: "1px solid " + C.danger,
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {saveError}
          </div>
        )}

        {/* ---------------- today ---------------- */}
        {tab === "today" && (
          <div>
            <div
              style={{
                background: C.surface,
                border: "1px solid " + LEVEL_COLOR[advice.level],
                borderRadius: 12,
                padding: 16,
                marginBottom: 18,
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6, color: LEVEL_COLOR[advice.level] }}>
                {advice.headline}
                {changeLitres ? " · " + changeLitres + " L" : ""}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: C.dim }}>{advice.detail}</div>
              {(cycle || lastChange) && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid " + C.line, fontSize: 13, color: C.faint }}>
                  {cycle}
                  {cycle && lastChange ? " · " : ""}
                  {lastChange
                    ? "Last water change " + relativeDay(lastChange.date) + (lastChange.value ? " (" + lastChange.value + "%)" : "")
                    : ""}
                </div>
              )}
            </div>

            {checks.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                {checks.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: C.dim,
                      padding: "10px 12px",
                      background: C.surface,
                      borderLeft: "2px solid " + C.caution,
                      marginBottom: 8,
                    }}
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}

            {latest ? (
              <div>
                <div style={{ fontSize: 13, color: C.faint, marginBottom: 14 }}>Readings from {relativeDay(latest.date)}</div>
                {PARAM_ORDER.map((k) => (
                  <RangeBar key={k} param={params[k]} value={latest[k]} />
                ))}
              </div>
            ) : (
              <Empty>Nothing logged yet. Tap Log test to record your first set of readings.</Empty>
            )}

            <Btn tone="primary" onClick={() => setTab("log")} style={{ width: "100%", marginTop: 4, marginBottom: 22 }}>
              Log a test
            </Btn>

            <div style={{ borderTop: "1px solid " + C.line, paddingTop: 16 }}>
              <SectionLabel>Record maintenance</SectionLabel>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <Btn onClick={() => quickEvent("waterChange", "30")} style={{ flex: 1, minWidth: 100, fontSize: 14 }}>
                  30% change
                </Btn>
                <Btn onClick={() => quickEvent("waterChange", "50")} style={{ flex: 1, minWidth: 100, fontSize: 14 }}>
                  50% change
                </Btn>
                <Btn onClick={() => quickEvent("filter")} style={{ flex: 1, minWidth: 100, fontSize: 14 }}>
                  Filter rinse
                </Btn>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input
                  placeholder="Add a note"
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                />
                <Btn onClick={addNote}>Save</Btn>
              </div>

              {events.slice(0, 6).map((e) => (
                <div
                  key={e.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    padding: "9px 0",
                    borderBottom: "1px solid " + C.surfaceHi,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14 }}>
                      {EVENT_TYPES[e.type].label}
                      {e.type === "waterChange" && e.value ? " · " + e.value + "%" : ""}
                    </div>
                    {e.note && <div style={{ fontSize: 13, color: C.dim, marginTop: 3, lineHeight: 1.5 }}>{e.note}</div>}
                    <div style={{ fontSize: 12, color: C.faint, marginTop: 3 }}>{relativeDay(e.date)}</div>
                  </div>
                  <button
                    onClick={() => setEvents((x) => x.filter((y) => y.id !== e.id))}
                    style={{ background: "none", border: "none", color: C.faint, cursor: "pointer", fontSize: 13 }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- log ---------------- */}
        {tab === "log" && (
          <div>
            <Field label="Date" type="date" value={draft.date} onChange={(v) => setDraft({ ...draft, date: v })} />
            {PARAM_ORDER.map((k) => (
              <Field
                key={k}
                label={params[k].name + (params[k].unit ? " (" + params[k].unit + ")" : "")}
                type="number"
                step={params[k].step}
                value={draft[k]}
                onChange={(v) => setDraft({ ...draft, [k]: v })}
                borderColor={LEVEL_COLOR[levelFor(params[k], draft[k])]}
              />
            ))}
            <p style={{ fontSize: 13, color: C.faint, lineHeight: 1.6, margin: "4px 0 18px" }}>
              Leave anything you didn't test blank. Ammonia and nitrite are the two that matter daily while the filter matures.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn tone="primary" onClick={saveTest} style={{ flex: 1 }}>
                Save reading
              </Btn>
              <Btn
                onClick={() => {
                  setDraft({ ...BLANK, date: today() });
                  setTab("today");
                }}
              >
                Cancel
              </Btn>
            </div>
          </div>
        )}

        {/* ---------------- trends ---------------- */}
        {tab === "trends" && (
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              {PARAM_ORDER.map((k) => (
                <button
                  key={k}
                  onClick={() => setChartParam(k)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 20,
                    fontSize: 13,
                    cursor: "pointer",
                    background: chartParam === k ? C.surfaceHi : "transparent",
                    color: chartParam === k ? C.text : C.faint,
                    border: "1px solid " + (chartParam === k ? C.line : "transparent"),
                  }}
                >
                  {params[k].name}
                </button>
              ))}
            </div>

            {chartData.length > 1 ? (
              <div style={{ height: 260, marginBottom: 20 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    {params[chartParam].zones.map((z, i) => (
                      <ReferenceArea key={i} y1={z.from} y2={z.to} fill={LEVEL_COLOR[z.level]} fillOpacity={0.12} stroke="none" />
                    ))}
                    <CartesianGrid stroke={C.line} strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: C.faint, fontSize: 11 }} stroke={C.line} />
                    <YAxis
                      domain={[params[chartParam].min, params[chartParam].max]}
                      tick={{ fill: C.faint, fontSize: 11 }}
                      stroke={C.line}
                    />
                    <Tooltip
                      contentStyle={{ background: C.surface, border: "1px solid " + C.line, borderRadius: 8, color: C.text, fontSize: 13 }}
                      labelStyle={{ color: C.faint }}
                    />
                    <Line type="monotone" dataKey="value" stroke={C.text} strokeWidth={2} dot={{ r: 3, fill: C.deep, stroke: C.text }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty>Two readings needed before a trend means anything. Keep logging and this fills in.</Empty>
            )}

            <div style={{ borderTop: "1px solid " + C.line, paddingTop: 14 }}>
              <SectionLabel>All readings</SectionLabel>
              {sortedTests.length === 0 && <Empty>No readings logged.</Empty>}
              {sortedTests.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "9px 0",
                    borderBottom: "1px solid " + C.surfaceHi,
                    fontSize: 14,
                  }}
                >
                  <span style={{ color: C.dim, minWidth: 90 }}>{relativeDay(t.date)}</span>
                  <span style={{ display: "flex", gap: 10, fontVariantNumeric: "tabular-nums" }}>
                    {["ammonia", "nitrite", "nitrate"].map((k) => (
                      <span key={k} style={{ color: LEVEL_COLOR[levelFor(params[k], t[k])] || C.faint }}>
                        {fmt(t[k])}
                      </span>
                    ))}
                  </span>
                  <button
                    onClick={() => setTests((x) => x.filter((y) => y.id !== t.id))}
                    style={{ background: "none", border: "none", color: C.faint, cursor: "pointer", fontSize: 13 }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {sortedTests.length > 0 && (
                <div style={{ fontSize: 12, color: C.faint, marginTop: 10 }}>Columns are ammonia, nitrite, nitrate.</div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- tank ---------------- */}
        {tab === "tank" && (
          <div>
            <SectionLabel>Fish</SectionLabel>
            {stock.length === 0 && <Empty>No fish added yet.</Empty>}
            {stock.map((f) => (
              <div
                key={f.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid " + C.surfaceHi,
                }}
              >
                <div>
                  <div style={{ fontSize: 15 }}>
                    {f.count} × {f.name}
                  </div>
                  <div style={{ fontSize: 12, color: C.faint, marginTop: 2 }}>
                    Added {relativeDay(f.added)}
                    {f.adultCm ? " · reaches " + f.adultCm + " cm" : ""}
                  </div>
                </div>
                <button
                  onClick={() => setStock((s) => s.filter((x) => x.id !== f.id))}
                  style={{ background: "none", border: "none", color: C.faint, cursor: "pointer", fontSize: 13 }}
                >
                  Remove
                </button>
              </div>
            ))}

            {stock.length > 0 && bioload.capacity > 0 && (
              <div style={{ marginTop: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: C.dim }}>Stocking at adult size</span>
                  <span
                    style={{
                      color: bioload.ratio > 1 ? C.danger : bioload.ratio > 0.8 ? C.caution : C.safe,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {Math.round(bioload.ratio * 100)}%
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: C.surfaceHi, overflow: "hidden" }}>
                  <div
                    style={{
                      width: Math.min(bioload.ratio * 100, 100) + "%",
                      height: "100%",
                      background: bioload.ratio > 1 ? C.danger : bioload.ratio > 0.8 ? C.caution : C.safe,
                    }}
                  />
                </div>
                <p style={{ fontSize: 12, color: C.faint, lineHeight: 1.6, marginTop: 8 }}>
                  Rough guide based on combined adult length against volume. It ignores temperament and territory, which matter more than
                  numbers in a cichlid tank.
                </p>
              </div>
            )}

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid " + C.line }}>
              <SectionLabel>Add fish</SectionLabel>
              <input
                placeholder="Species"
                value={newFish.name}
                onChange={(e) => setNewFish({ ...newFish, name: e.target.value })}
                style={{ ...inputStyle, marginBottom: 10 }}
              />
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="How many"
                  value={newFish.count}
                  onChange={(e) => setNewFish({ ...newFish, count: e.target.value })}
                  style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                />
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Adult cm"
                  value={newFish.adultCm}
                  onChange={(e) => setNewFish({ ...newFish, adultCm: e.target.value })}
                  style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                />
              </div>
              <Btn onClick={addFish} style={{ width: "100%" }}>
                Add to tank
              </Btn>
            </div>

            <div style={{ marginTop: 28, paddingTop: 18, borderTop: "1px solid " + C.line }}>
              <SectionLabel>Filtration</SectionLabel>
              {filters.length === 0 && <Empty>No filters added yet.</Empty>}
              {filters.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "11px 0",
                    borderBottom: "1px solid " + C.surfaceHi,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15 }}>{f.name}</div>
                    <div style={{ fontSize: 12, color: C.faint, marginTop: 2 }}>
                      {FILTER_TYPES[f.type].label}
                      {f.lph ? " · " + f.lph + " L/h rated" : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => setFilters((x) => x.filter((y) => y.id !== f.id))}
                    style={{ background: "none", border: "none", color: C.faint, cursor: "pointer", fontSize: 13 }}
                  >
                    Remove
                  </button>
                </div>
              ))}

              {filters.length > 0 && Number(settings.volumeL) > 0 && effectiveFlow(filters) > 0 && (
                <div style={{ fontSize: 13, color: C.dim, marginTop: 12, lineHeight: 1.6 }}>
                  Around {(effectiveFlow(filters) / Number(settings.volumeL)).toFixed(1)}× turnover per hour in practice, from{" "}
                  {filters.reduce((s, f) => s + (Number(f.lph) || 0), 0)} L/h of rated output.
                </div>
              )}

              <div style={{ marginTop: 16, marginBottom: 8 }}>
                <input
                  placeholder="Fluval 307"
                  value={newFilter.name}
                  onChange={(e) => setNewFilter({ ...newFilter, name: e.target.value })}
                  style={{ ...inputStyle, marginBottom: 10 }}
                />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  {Object.entries(FILTER_TYPES).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setNewFilter({ ...newFilter, type: k })}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 20,
                        fontSize: 13,
                        cursor: "pointer",
                        background: newFilter.type === k ? C.surfaceHi : "transparent",
                        color: newFilter.type === k ? C.text : C.faint,
                        border: "1px solid " + (newFilter.type === k ? C.line : "transparent"),
                      }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Rated L/h"
                    value={newFilter.lph}
                    onChange={(e) => setNewFilter({ ...newFilter, lph: e.target.value })}
                    style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                  />
                  <Btn onClick={addFilter}>Add filter</Btn>
                </div>
                <p style={{ fontSize: 12, color: C.faint, lineHeight: 1.6, marginTop: 10 }}>
                  Enter the rated pump output from the box. Real throughput is lower once media and hoses are in the loop, and the app
                  accounts for that by filter type.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid " + C.line }}>
              <SectionLabel>Other equipment</SectionLabel>
              {EQUIPMENT_FIELDS.map((f) => (
                <Field
                  key={f.key}
                  label={f.label}
                  type={f.type}
                  placeholder={f.placeholder}
                  value={equipment[f.key]}
                  onChange={(v) => setEquipment({ ...equipment, [f.key]: v })}
                />
              ))}
              <p style={{ fontSize: 12, color: C.faint, lineHeight: 1.6 }}>
                Wattage and air stone count feed into the checks on the Today screen. The rest is kept as a record and passed to Claude
                when you ask a question.
              </p>
            </div>

            <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid " + C.line }}>
              <SectionLabel>Tank</SectionLabel>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <input
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  style={{ ...inputStyle, flex: 2, minWidth: 0 }}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={settings.volumeL}
                  onChange={(e) => setSettings({ ...settings, volumeL: e.target.value })}
                  style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {Object.entries(PRESETS).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => setSettings({ ...settings, preset: k })}
                    style={{
                      flex: 1,
                      padding: "10px 8px",
                      borderRadius: 8,
                      fontSize: 13,
                      cursor: "pointer",
                      lineHeight: 1.4,
                      background: settings.preset === k ? C.surfaceHi : "transparent",
                      color: settings.preset === k ? C.text : C.faint,
                      border: "1px solid " + (settings.preset === k ? C.line : C.surfaceHi),
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: C.faint, lineHeight: 1.6, marginTop: 10 }}>
                The preset sets which pH, temperature and hardness ranges count as safe.
              </p>
            </div>
          </div>
        )}

        {/* ---------------- ask ---------------- */}
        {tab === "ask" && (
          <div>
            {chat.length === 0 && (
              <div style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: C.dim, marginTop: 0 }}>
                  Ask anything about this tank. Your readings, stock and equipment go along with the question, so you don't need to repeat
                  them.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Why are my fish flashing?",
                    "Is my filter big enough for this stocking?",
                    "How is my cycle progressing?",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuestion(s)}
                      style={{
                        textAlign: "left",
                        padding: "11px 13px",
                        borderRadius: 8,
                        background: C.surface,
                        border: "1px solid " + C.line,
                        color: C.dim,
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chat.map((m, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 14,
                  padding: m.role === "user" ? "10px 13px" : "12px 14px",
                  background: m.role === "user" ? C.surfaceHi : C.surface,
                  border: m.role === "user" ? "none" : "1px solid " + C.line,
                  borderRadius: 10,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: m.role === "user" ? C.text : C.dim,
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.content}
              </div>
            ))}

            {thinking && <div style={{ fontSize: 14, color: C.faint, marginBottom: 14 }}>Thinking…</div>}
            <div ref={chatEnd} />

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                placeholder="Ask about your tank"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") ask();
                }}
                style={{ ...inputStyle, flex: 1, minWidth: 0 }}
              />
              <Btn tone="primary" onClick={ask} disabled={thinking || !question.trim()}>
                Ask
              </Btn>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", borderTop: "1px solid " + C.line, background: C.surface, position: "sticky", bottom: 0 }}>
        <Tab id="today" active={tab} onClick={setTab}>
          Today
        </Tab>
        <Tab id="log" active={tab} onClick={setTab}>
          Log test
        </Tab>
        <Tab id="trends" active={tab} onClick={setTab}>
          Trends
        </Tab>
        <Tab id="tank" active={tab} onClick={setTab}>
          Tank
        </Tab>
        <Tab id="ask" active={tab} onClick={setTab}>
          Ask
        </Tab>
      </div>
    </div>
  );
}
