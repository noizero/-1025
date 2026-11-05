// ブラシ付き永久磁石DCモーターの簡易定常モデル
const TAU = 2 * Math.PI;

export function calculateFromActualCurrent({ voltage, current, resistance, kt, ke, noLoadCurrent }) {
  validateCommon({ voltage, resistance, kt, ke, noLoadCurrent });
  if (!Number.isFinite(current) || current < noLoadCurrent) {
    throw new Error("電流は無負荷電流以上の値を入力してください。");
  }
  const torque = kt * (current - noLoadCurrent);
  const omega = (voltage - current * resistance) / ke;
  return buildResult({ voltage, current, torque, omega });
}

export function calculateWithCurrentLimit({ voltage, currentLimit, loadTorque, resistance, kt, ke, noLoadCurrent }) {
  validateCommon({ voltage, resistance, kt, ke, noLoadCurrent });
  if (![currentLimit, loadTorque].every(Number.isFinite) || currentLimit < 0 || loadTorque < 0) {
    throw new Error("電流上限と負荷トルクは0以上の数値で入力してください。");
  }
  const requiredCurrent = noLoadCurrent + loadTorque / kt;
  if (requiredCurrent > currentLimit + 1e-9) {
    const maximumTorque = kt * Math.max(0, currentLimit - noLoadCurrent);
    return { feasible: false, requiredCurrent, maximumTorque };
  }
  const omega = (voltage - requiredCurrent * resistance) / ke;
  return { feasible: true, ...buildResult({ voltage, current: requiredCurrent, torque: loadTorque, omega }) };
}

function validateCommon(v) {
  const values = [v.voltage, v.resistance, v.kt, v.ke, v.noLoadCurrent];
  if (!values.every(Number.isFinite) || v.voltage < 0 || v.resistance <= 0 || v.kt <= 0 || v.ke <= 0 || v.noLoadCurrent < 0) {
    throw new Error("電圧・抵抗・モーター定数・無負荷電流を確認してください。R・Kt・Keは0より大きい値が必要です。");
  }
}
function buildResult({ voltage, current, torque, omega }) {
  if (omega < 0) throw new Error("この電流条件を維持できません。計算上の回転数が負になります。");
  const rpm = omega * 60 / TAU;
  const mechanicalPower = torque * omega;
  const electricalPower = voltage * current;
  const efficiency = electricalPower > 0 ? mechanicalPower / electricalPower * 100 : null;
  if (efficiency !== null && efficiency > 100.5) {
    throw new Error("計算効率が100%を超えました。入力値・単位・測定値を確認してください。");
  }
  return { feasible: true, rpm, torque, current, omega, mechanicalPower, electricalPower, efficiency };
}
