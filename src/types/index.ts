/**
 * Claude 模型配置接口
 */
export interface Model {
  /** 模型唯一标识符 */
  id: string;
  /** 模型显示名称 */
  name: string;
  /** 模型价格（每1K tokens） */
  price: string;
  /** 模型功能描述 */
  description: string;
  /** 模型特性列表（可选） */
  features?: string[];
  /** 是否为默认模型（可选） */
  isDefault?: boolean;
}

/**
 * 对话消息接口
 */
export interface Message {
  /** 消息角色：用户或助手 */
  role: 'user' | 'assistant';
  /** 消息内容 */
  content: string;
}

/**
 * 对话会话接口
 */
export interface Conversation {
  /** 会话唯一标识符 */
  id: string;
  /** 会话标题 */
  title: string;
  /** 会话中的消息列表 */
  messages: Message[];
  /** 会话创建时间 */
  createdAt: Date;
}

/**
 * 文件内容接口
 */
export interface FileContent {
  /** 文件名 */
  name: string;
  /** 文件内容（文本或base64） */
  content: string;
}

/**
 * 发送消息数据接口
 */
export interface MessageData {
  /** 使用的模型ID */
  model: string;
  /** 消息文本内容 */
  message: string;
  /** 附带的文件列表 */
  files: FileContent[];
  /** 会话ID */
  conversationId: string;
}

/**
 * API响应接口
 */
export interface ApiResponse {
  /** 响应内容 */
  content: string;
} 