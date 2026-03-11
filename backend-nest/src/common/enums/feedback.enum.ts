// 反馈类型
export enum FeedbackType {
  BUG = 'bug',           // Bug 反馈
  FEATURE = 'feature',   // 功能建议
  SUGGESTION = 'suggestion', // 意见建议
  OTHER = 'other',       // 其他
}

// 反馈状态
export enum FeedbackStatus {
  PENDING = 'pending',       // 待处理
  PROCESSING = 'processing', // 处理中
  RESOLVED = 'resolved',     // 已解决
  CLOSED = 'closed',        // 已关闭
}