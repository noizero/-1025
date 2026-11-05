export function calculateGearOutput({ motorRpm, motorTorque, motorPower, ratio, efficiencyPercent }) {
  if (![motorRpm, motorTorque, motorPower, ratio, efficiencyPercent].every(Number.isFinite) ||
      ratio <= 0 || efficiencyPercent < 0 || efficiencyPercent > 100) {
    throw new Error("減速比とギヤ効率を確認してください。");
  }
  const efficiency = efficiencyPercent / 100;
  return {
    rpm: motorRpm / ratio,
    torque: motorTorque * ratio * efficiency,
    power: motorPower * efficiency
  };
}
