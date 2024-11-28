import { Model } from '@/types'

/**
 * 文件类型配置接口
 */
interface FileTypes {
  /** 支持的文本文件扩展名列表 */
  text: string[]
  /** 支持的图片文件扩展名列表 */
  image: string[]
  /** 支持的PDF文件扩展名列表 */
  pdf: string[]
}

/**
 * API配置接口
 */
interface ApiConfig {
  /** Claude API 端点URL */
  CLAUDE_API_URL: string
  /** API密钥 */
  API_KEY: string
  /** 默认使用的模型ID */
  DEFAULT_MODEL: string
  /** 登录用户名 */
  LOGIN_USERNAME: string
  /** 登录密码 */
  LOGIN_PASSWORD: string
  /** 可用的模型列表 */
  MODELS: Model[]
  /** 支持的文件类型配置 */
  FILE_TYPES: FileTypes
  /** 最大文件大小限制（字节） */
  MAX_FILE_SIZE: number
}

/**
 * API配置对象
 * 包含所有API相关的配置信息
 */
export const API_CONFIG: ApiConfig = {
  CLAUDE_API_URL: import.meta.env.VITE_CLAUDE_API_URL,
  API_KEY: import.meta.env.VITE_CLAUDE_API_KEY,
  DEFAULT_MODEL: 'claude-3-5-sonnet-20241022',
  LOGIN_USERNAME: import.meta.env.VITE_LOGIN_USERNAME,
  LOGIN_PASSWORD: import.meta.env.VITE_LOGIN_PASSWORD,
  MODELS: [
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      price: '¥0.1100/1K tokens',
      description: '最强大的模型，适合复杂任务和创造性工作'
    },
    {
      id: 'claude-3-sonnet-20240229',
      name: 'Claude 3 Sonnet',
      price: '¥0.0366/1K tokens',
      description: '优秀的性能价格比，适合大多数任务'
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      price: '¥0.0146/1K tokens',
      description: '快速响应的轻量版，适合简单对话'
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      price: '¥0.0293/1K tokens',
      description: '最智能的模型，结合顶级性能和更快的速度',
      isDefault: true
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      price: '¥0.0146/1K tokens',
      description: '最快速和最具成本效益的模型',
      features: [
        '实时聊天机器人',
        '数据提取和标记',
        '内容分类'
      ]
    }
  ],
  FILE_TYPES: {
    text: ['txt', 'md', 'json', 'csv', 'js', 'py', 'java', 'c', 'cpp', 'html', 'css'],
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    pdf: ['pdf']
  },
  MAX_FILE_SIZE: 10 * 1024 * 1024
} 