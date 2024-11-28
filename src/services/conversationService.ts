import type { Conversation } from '@/types'

/**
 * 生成唯一ID
 * 使用时间戳和随机数组合生成
 * @returns {string} 唯一ID字符串
 */
const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2)

/**
 * 对话管理服务类
 * 处理所有对话相关的操作
 */
class ConversationService {
  /** 存储所有对话的数组 */
  public conversations: Conversation[] = []

  /**
   * 创建新对话
   * @returns {Conversation} 新创建的对话对象
   */
  createConversation(): Conversation {
    const conversation: Conversation = {
      id: generateId(),
      title: `新对话 ${this.conversations.length + 1}`,
      messages: [],
      createdAt: new Date()
    }
    this.conversations.unshift(conversation)
    return conversation
  }

  /**
   * 删除指定ID的对话
   * @param {string} id - 要删除的对话ID
   */
  deleteConversation(id: string): void {
    const index = this.conversations.findIndex(c => c.id === id)
    if (index !== -1) {
      this.conversations.splice(index, 1)
    }
  }

  /**
   * 更新对话标题
   * @param {string} id - 要更新的对话ID
   * @param {string} title - 新的标题
   */
  updateConversationTitle(id: string, title: string): void {
    const conversation = this.conversations.find(c => c.id === id)
    if (conversation) {
      conversation.title = title
    }
  }

  /**
   * 获取指定ID的对话
   * @param {string} id - 对话ID
   * @returns {Conversation | undefined} 找到的对话对象，如果不存在则返回undefined
   */
  getConversation(id: string): Conversation | undefined {
    return this.conversations.find(c => c.id === id)
  }

  /**
   * 获取所有对话
   * @returns {Conversation[]} 所有对话的数组
   */
  getConversations(): Conversation[] {
    return this.conversations
  }

  /**
   * 清空所有对话
   */
  clearAll(): void {
    this.conversations = []
  }

  /**
   * 获取对话数量
   * @returns {number} 当前对话数量
   */
  getCount(): number {
    return this.conversations.length
  }

  /**
   * 检查对话是否存在
   * @param {string} id - 要检查的对话ID
   * @returns {boolean} 如果对话存在返回true，否则返回false
   */
  hasConversation(id: string): boolean {
    return this.conversations.some(c => c.id === id)
  }
}

/** 导出对话服务实例 */
export const conversationService = new ConversationService() 