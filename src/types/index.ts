// Event Types
export interface TikTokUser {
  userId: string;
  uniqueId: string;
  nickname: string;
  profilePictureUrl?: string;
  isFollowing?: boolean;
  isModerator?: boolean;
}

export interface CommentEvent {
  type: 'comment';
  user: TikTokUser;
  message: string;
  timestamp: number;
  isCommand?: boolean;
  command?: string;
  args?: string[];
}

export interface GiftEvent {
  type: 'gift';
  user: TikTokUser;
  gift: {
    id: number;
    name: string;
    count: number;
    diamondCount: number;
    repeatEnd: boolean;
  };
  timestamp: number;
}

export interface LikeEvent {
  type: 'like';
  user: TikTokUser;
  likeCount: number;
  totalLikeCount: number;
  timestamp: number;
}

export interface FollowEvent {
  type: 'follow';
  user: TikTokUser;
  timestamp: number;
}

export interface ShareEvent {
  type: 'share';
  user: TikTokUser;
  timestamp: number;
}

export interface ViewersEvent {
  type: 'viewers';
  viewerCount: number;
  timestamp: number;
}

export interface JoinEvent {
  type: 'join';
  user: TikTokUser;
  timestamp: number;
}

export type TikTokEvent =
  | CommentEvent
  | GiftEvent
  | LikeEvent
  | FollowEvent
  | ShareEvent
  | ViewersEvent
  | JoinEvent;

// Config Types
export interface WebhookConfig {
  discord?: string;
  custom?: string[];
}

export interface MQTTConfig {
  broker: string;
  port: number;
  username?: string;
  password?: string;
  topics: {
    comments: string;
    gifts: string;
    likes: string;
    follows: string;
    shares: string;
    viewers: string;
    joins: string;
  };
}

export interface OBSConfig {
  host: string;
  port: number;
  password: string;
  enabled: boolean;
}

export interface FilterConfig {
  min_gift_value?: number;
  banned_words?: string[];
  vip_users?: string[];
  min_comment_length?: number;
}

export interface ServerConfig {
  port: number;
  enable_websocket: boolean;
  enable_api: boolean;
}

export interface FeaturesConfig {
  auto_reconnect: boolean;
  rate_limiting: boolean;
  spam_filter: boolean;
  commands_enabled: boolean;
  command_prefix: string;
}

export interface PluginConfig {
  name: string;
  enabled: boolean;
  triggers: {
    [eventType: string]: {
      condition?: string;
      action: string;
      params?: Record<string, any>;
    };
  };
}

export interface AppConfig {
  tiktok_username: string;
  webhooks: WebhookConfig;
  mqtt: MQTTConfig;
  obs: OBSConfig;
  filters: FilterConfig;
  plugins: PluginConfig[];
  server: ServerConfig;
  features: FeaturesConfig;
}

// Stats Types
export interface StreamStats {
  totalComments: number;
  totalGifts: number;
  totalLikes: number;
  totalFollows: number;
  totalShares: number;
  totalJoins: number;
  currentViewers: number;
  peakViewers: number;
  totalRevenue: number;
  topGifter?: TikTokUser;
  startTime: number;
  uptime: number;
}

// Plugin Interface
export interface Plugin {
  name: string;
  initialize(): Promise<void>;
  onEvent(event: TikTokEvent): Promise<void>;
  destroy(): Promise<void>;
}
