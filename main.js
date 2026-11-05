import { calculateFromActualCurrent, calculateWithCurrentLimit } from "./dc-calculator.js";
import { calculateGearOutput } from "./gear-calculator.js";
import { motorProfiles } from "./motor-data.js";

const $ = (id) => document.getElementById(id);
const number = (id) => {
  const value = $(id).value.trim();
  return value === "" ? null : Number(value);
};
const format = (value) => Number.isFinite(value)
  ? value.toLocaleString("ja-JP", { maximumFractionDigits: 2 })
  : "—";
let lastResult = null;

function setStatus(id, message, type = "") {
  $(id).textContent = message;
  $(id).className = `status ${type}`;
}
function show(id, value) { $(id).textContent = value == null ? "—" : format(value); }

function clearResults() {
  ["rpm", "torque", "outCurrent", "mechanical", "electrical", "efficiency",
   "gearRpm", "gearTorque", "gearPower"].forEach((id) => $(id).textContent = "—");
  $("resultNote").textContent = "計算結果はここに表示されます。";
  $("gearMessage").textContent = "モーターの計算後、減速比を入力してください。";
  lastResult = null;
  drawChart(null);
}
function drawChart(result) {
  const canvas = $("chart");
  const ctx = canvas.getContext("2d");
  const width = canvas.width, height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "#dce3ed";
  for (let i = 1; i < 5; i++) {
    const y = i * height / 5;
    ctx.beginPath(); ctx.moveTo(42, y); ctx.lineTo(width - 12, y); ctx.stroke();
  }
  ctx.fillStyle = "#68758a"; ctx.font = "13px sans-serif";
  ctx.fillText("トルク (N·m)", 12, 18);
  ctx.fillText("回転数 (RPM)", width - 115, height - 10);
  if (result) {
    const x = 42 + (width - 65) * 0.55;
    const y = height - 35 - (height - 65) * 0.55;
    ctx.fillStyle = "#1769aa"; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillText("計算点", x + 12, y - 8);
  } else {
    ctx.fillText("計算結果がありません", width / 2 - 65, height / 2);
  }
}
function updateMode() {
  const limitMode = $("mode").value === "limit";
  $("actualWrap").classList.toggle("hidden", limitMode);
  $("limitWrap").classList.toggle("hidden", !limitMode);
  $("loadWrap").classList.toggle("hidden", !limitMode);
  $("modeHint").textContent = limitMode
    ? "負荷トルクから必要電流を求め、電流上限以内で運転できるか確認します。上限値だけでは実電流は決まりません。"
    : "実測したモーター電流から、回転数と発生トルクを計算します。";
}
function updateType() {
  const isDc = $("motorType").value === "dc";
  const isSupported = isDc && $("dcKind").value === "brushed";
  $("dcKindWrap").classList.toggle("hidden", !isDc);
  $("unsupported").classList.toggle("hidden", isSupported);
  $("calculate").disabled = !isSupported;
  const profile = motorProfiles[$("profile").value];
  $("profileNote").textContent = $("profile").value === "kp104"
    ? "KP-104はポンプ製品としての仕様とモーター単体の仕様を区別してください。ポンプの流量・揚程・電源情報からモーター単体の回転数やトルクを推測して入力しないでください。"
    : $("profile").value === "custom"
      ? "独自仕様のモーター情報を入力します。確認できない項目は空欄のままにしてください。"
      : `${profile.label}を想定した入力欄です。参考値は自動入力せず、確認できた仕様を入力してください。`;
}
function calculate() {
  clearResults();
  if ($("motorType").value !== "dc" || $("dcKind").value !== "brushed") {
    setStatus("message", "第1版で計算できるのはブラシ付きDCモーターです。", "warning");
    return;
  }
  const voltage = number("voltage");
  const resistance = number("resistance");
  const kt = number("kt");
  const ke = number("ke");
  const noLoadCurrent = number("noLoad");
  const missing = [];
  [["使用電圧", voltage], ["巻線抵抗 R", resistance], ["トルク定数 Kt", kt],
   ["逆起電力定数 Ke", ke], ["無負荷電流 I₀", noLoadCurrent]]
    .forEach(([name, value]) => { if (value === null) missing.push(name); });
  if (missing.length) {
    setStatus("message", `計算に必要な未入力項目：${missing.join("、")}`, "warning");
    return;
  }
  try {
    let result;
    if ($("mode").value === "actual") {
      const current = number("current");
      if (current === null) throw new Error("実際の電流を入力してください。");
      result = calculateFromActualCurrent({ voltage, current, resistance, kt, ke, noLoadCurrent });
      $("resultNote").textContent = "入力された実電流に基づく計算結果です。";
    } else {
      const currentLimit = number("currentLimit");
      const loadTorque = number("loadTorque");
      if (currentLimit === null || loadTorque === null) throw new Error("電流上限と負荷トルクを入力してください。");
      result = calculateWithCurrentLimit({ voltage, currentLimit, loadTorque, resistance, kt, ke, noLoadCurrent });
      if (!result.feasible) {
        show("outCurrent", currentLimit);
        show("torque", result.maximumTorque);
        $("resultNote").textContent = `指定負荷を維持するには ${format(result.requiredCurrent)} A が必要です。電流上限 ${format(currentLimit)} A を超えています。表示トルクは電流上限時の理論上限です。`;
        setStatus("message", "電流上限を超えています。負荷を下げるか、適切なモーター／駆動系を選んでください。", "error");
        return;
      }
      $("resultNote").textContent = "指定負荷を電流上限以内で維持できる計算結果です。";
    }
    lastResult = result;
    show("rpm", result.rpm); show("torque", result.torque); show("outCurrent", result.current);
    show("mechanical", result.mechanicalPower); show("electrical", result.electricalPower);
    show("efficiency", result.efficiency);
    setStatus("message", "計算が完了しました。実機の測定値と照合してください。", "success");
    drawChart(result);
    calculateGear();
  } catch (error) {
    setStatus("message", error.message, "error");
  }
}
function calculateGear() {
  if (!lastResult) return;
  const ratio = number("ratio"), efficiencyPercent = number("gearEff");
  if (ratio === null || efficiencyPercent === null) return;
  try {
    const result = calculateGearOutput({
      motorRpm: lastResult.rpm, motorTorque: lastResult.torque,
      motorPower: lastResult.mechanicalPower, ratio, efficiencyPercent
    });
    show("gearRpm", result.rpm); show("gearTorque", result.torque); show("gearPower", result.power);
    setStatus("gearMessage", "理想化した減速比と効率による概算です。ギヤの許容トルク・回転数も別途確認してください。");
  } catch (error) {
    setStatus("gearMessage", error.message, "warning");
  }
}

$("mode").addEventListener("change", updateMode);
["motorType", "dcKind", "profile"].forEach((id) => $(id).addEventListener("change", updateType));
$("calculate").addEventListener("click", calculate);
$("ratio").addEventListener("input", calculateGear);
$("gearEff").addEventListener("input", calculateGear);
$("reset").addEventListener("click", () => {
  document.querySelectorAll("input").forEach((input) => {
    input.value = input.id === "gearEff" ? "90" : "";
  });
  $("mode").value = "actual";
  updateMode(); clearResults();
  setStatus("message", "入力をクリアしました。");
});

updateMode();
updateType();
drawChart(null);
