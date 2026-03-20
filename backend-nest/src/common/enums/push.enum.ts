// 推送订阅状态
export enum PushSubscriptionStatus {
  ACTIVE = 'active',     // 活跃
  PAUSED = 'paused',     // 已暂停
  CANCELLED = 'cancelled', // 已取消
}

// 推送类型
export enum PushType {
  DAILY_DIGEST = 'daily_digest',       // 每日汇总
  WEATHER_ALERT = 'weather_alert',     // 空间天气预警
  SATELLITE_PASS = 'satellite_pass',   // 卫星过境提醒
}

// 推送记录状态
export enum PushRecordStatus {
  PENDING = 'pending',   // 待发送
  SENT = 'sent',         // 已发送
  FAILED = 'failed',     // 发送失败
}