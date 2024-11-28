import { API_CONFIG } from '../config/api'
import type { MessageData, ApiResponse } from '@/types'

/**
 * 消息内容接口，支持文本和图片
 */
interface MessageContent {
  /** 内容类型：文本或图片 */
  type: 'text' | 'image'
  /** 文本内容（当type为text时） */
  text?: string
  /** 图片源（当type为image时） */
  source?: {
    /** 源类型，固定为base64 */
    type: 'base64'
    /** 媒体类型 */
    media_type: string
    /** base64编码的数据 */
    data: string
  }
}

/**
 * 对话消息接口
 */
interface ConversationMessage {
  /** 消息角色：用户或助手 */
  role: 'user' | 'assistant'
  /** 消息内容数组 */
  content: MessageContent[]
}

/**
 * Claude API 服务类
 * 处理与 Claude API 的所有交互
 */
class ClaudeService {
  /** 存储所有对话的历史记录 */
  private conversationHistories: Record<string, ConversationMessage[]> = {}

  /**
   * 发送消息到 Claude API
   * @param model - 使用的模型ID
   * @param message - 消息文本
   * @param files - 附带的文件列表
   * @param conversationId - 会话ID
   * @returns Promise<ApiResponse> - API响应
   */
  async sendMessage({ model, message, files = [], conversationId }: MessageData): Promise<ApiResponse> {
    try {
      if (!this.conversationHistories[conversationId]) {
        this.conversationHistories[conversationId] = []
      }

      const fileContents = files.map(file => {
        if (file.content.startsWith('data:image')) {
          return {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: file.content.split(';')[0].split(':')[1],
              data: file.content.split(',')[1]
            }
          }
        } else {
          return {
            type: 'text' as const,
            text: file.content
          }
        }
      })

      this.conversationHistories[conversationId].push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: message
          },
          ...fileContents
        ]
      })

      const response = await fetch('/api/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_CONFIG.API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 4000,
          system: "You are Claude, an AI assistant. Respond in Chinese (中文).",
          messages: this.conversationHistories[conversationId].slice(-10)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'API 请求失败')
      }

      const data = await response.json()
      
      this.conversationHistories[conversationId].push({
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: data.content[0].text
          }
        ]
      })

      return {
        content: data.content[0].text
      }
    } catch (error) {
      console.error('API 错误:', error)
      throw error
    }
  }

  /**
   * 清除指定会话或所有会话的历史记录
   * @param conversationId - 可选的会话ID，如果不提供则清除所有历史
   */
  clearHistory(conversationId?: string): void {
    if (conversationId) {
      this.conversationHistories[conversationId] = []
    } else {
      this.conversationHistories = {}
    }
  }
}

export const claudeService = new ClaudeService() 