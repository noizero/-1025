// モーターの登録データを管理するモジュール。
// 未確認の仕様値を推測して登録しないこと。
export const motorProfiles = {
  general: {
    label: "一般的なモーター",
    values: {}
  },
  kp104: {
    label: "工進 KP-104 ポンプ用",
    // 公開されているポンプ仕様とモーター単体仕様は別物です。
    // モーター単体のKt・Ke・巻線抵抗などは未確認のため空欄です。
    values: {}
  },
  custom: {
    label: "独自仕様",
    values: {}
  }
};
