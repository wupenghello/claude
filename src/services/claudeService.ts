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
   * 可配置的默认参数
   */
  public defaultConfig: ClaudeConfig = {
    max_tokens: 4000,          // 最大返回的token数量
    temperature: 0.7,          // 温度参数，控制输出的随机性 (0.0-1.0)
    top_p: 0.9,               // 控制输出的多样性
    top_k: 10,                // 控制每一步生成时考虑的token数量
    system: "You are Claude, an AI assistant. Respond in Chinese (中文).",  // 系统提示语
    stop_sequences: [],        // 停止序列
    messages_window: 10,       // 保留的历史消息数量
    repetition_penalty: 1.1,   // 重复惩罚系数
    min_tokens: 0,            // 最小生成长度
    use_context: true         // 是否增强上下文理解
  }

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

      // 创建新的消息对象
      const newMessage: ConversationMessage = {
        role: 'user',
        content: [
          {
            type: 'text',
            text: message
          }
        ]
      }

      // 处理文件内容
      if (files.length > 0) {
        try {
          const fileContents = files.map(file => {
            if (file.content.startsWith('data:image')) {
              const [mediaType, base64Data] = file.content.split(',');
              const extractedMediaType = mediaType.replace('data:', '').split(';')[0];
              
              const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
              if (!supportedTypes.includes(extractedMediaType)) {
                throw new Error('不支持的图片格式，请使用 JPEG、PNG、GIF 或 WebP 格式');
              }

              return {
                type: 'image' as const,
                source: {
                  type: 'base64' as const,
                  media_type: extractedMediaType,
                  data: base64Data
                }
              };
            } else {
              return {
                type: 'text' as const,
                text: file.content
              };
            }
          });
          newMessage.content.push(...fileContents);
        } catch (error) {
          throw new Error(`处理文件时出错: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

      // 添加用户消息到历史记录
      this.conversationHistories[conversationId].push(newMessage);

      try {
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
            max_tokens: this.defaultConfig.max_tokens,
            temperature: this.defaultConfig.temperature,
            top_p: this.defaultConfig.top_p,
            top_k: this.defaultConfig.top_k,
            system: this.defaultConfig.system,
            stop_sequences: this.defaultConfig.stop_sequences,
            messages: this.conversationHistories[conversationId].slice(-this.defaultConfig.messages_window)
          })
        });

        if (!response.ok) {
          this.conversationHistories[conversationId].pop();
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'API 请求失败');
        }

        const data = await response.json();
        
        // 添加助手的回复
        this.conversationHistories[conversationId].push({
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: data.content[0].text
            }
          ]
        });

        return {
          content: data.content[0].text
        };
      } catch (error) {
        this.conversationHistories[conversationId].pop();
        throw error;
      }
    } catch (error) {
      console.error('API 错误:', error);
      throw error;
    }
  }

  /**
   * 更新默认配置
   * @param newConfig - 新的配置参数
   */
  updateConfig(newConfig: Partial<typeof this.defaultConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...newConfig };
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