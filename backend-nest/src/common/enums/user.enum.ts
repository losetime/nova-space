export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum UserLevel {
  BASIC = 'basic', // 基础层 - 航天爱好者、学生
  ADVANCED = 'advanced', // 进阶层 - 科研人员、开发者
  PROFESSIONAL = 'professional', // 专业层 - 企业、政府机构
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PENDING = 'pending',
}

export enum SubscriptionPlan {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  LIFETIME = 'lifetime',
  CUSTOM = 'custom',
}

export enum PointsAction {
  REGISTER = 'register', // 注册奖励
  DAILY_LOGIN = 'daily_login', // 每日登录
  SHARE = 'share', // 分享
  INVITE = 'invite', // 邀请好友
  TASK_COMPLETE = 'task_complete', // 完成任务
  PURCHASE = 'purchase', // 购买
  CONSUME = 'consume', // 消费
  ADMIN_GRANT = 'admin_grant', // 管理员发放
  EXPIRE = 'expire', // 过期扣除
}

export enum FavoriteType {
  SATELLITE = 'satellite',
  NEWS = 'news',
  EDUCATION = 'education',
  INTELLIGENCE = 'intelligence',
}
