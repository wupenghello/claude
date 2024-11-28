<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <button class="new-chat-button" @click="createNewChat">
        <svg class="plus-icon" viewBox="0 0 16 16">
          <path d="M8 2a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2H9v4a1 1 0 1 1-2 0V9H3a1 1 0 1 1 0-2h4V3a1 1 0 0 1 1-1z"/>
        </svg>
        新对话
      </button>
    </div>
    
    <div class="conversations-list">
      <div
        v-for="conv in conversations"
        :key="conv.id"
        :class="['conversation-item', { active: currentConversationId === conv.id }]"
        @click="selectConversation(conv.id)"
      >
        <div class="conversation-icon">
          <svg viewBox="0 0 16 16">
            <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2.5a2 2 0 0 0-1.6.8L8 14.333 6.1 11.8a2 2 0 0 0-1.6-.8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.5a1 1 0 0 1 .8.4l1.9 2.533a1 1 0 0 0 1.6 0l1.9-2.533a1 1 0 0 1 .8-.4H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
          </svg>
        </div>
        <div class="conversation-content">
          <span class="title">{{ conv.title }}</span>
          <span class="time">{{ formatDate(conv.createdAt) }}</span>
        </div>
        <div class="actions">
          <button class="action-btn edit" @click.stop="editTitle(conv)">
            <svg viewBox="0 0 16 16">
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
            </svg>
          </button>
          <button class="action-btn delete" @click.stop="deleteConversation(conv.id)">
            <svg viewBox="0 0 16 16">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
              <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { conversationService } from '../services/conversationService'
import type { Conversation } from '@/types'

/**
 * 组件属性接口
 */
interface Props {
  /** 当前选中的对话ID */
  currentConversationId: string
}

const props = defineProps<Props>()

/**
 * 定义组件事件
 * select-conversation: 当选择一个对话时触发
 */
const emit = defineEmits<{
  (e: 'select-conversation', id: string): void
}>()

/** 对话列表计算属性 */
const conversations = computed(() => conversationService.conversations)

/**
 * 创建新对话
 * 创建后自动选择新创建的对话
 */
const createNewChat = (): void => {
  const newConv = conversationService.createConversation()
  emit('select-conversation', newConv.id)
}

/**
 * 选择对话
 * @param id - 要选择的对话ID
 */
const selectConversation = (id: string): void => {
  emit('select-conversation', id)
}

/**
 * 删除对话
 * 如果删除的是当前选中的对话，会自动选择列表中的第一个对话
 * 如果删除后没有对话，会创建一个新对话
 * @param id - 要删除的对话ID
 */
const deleteConversation = (id: string): void => {
  if (window.confirm('确定要删除这个对话吗？')) {
    conversationService.deleteConversation(id)
    if (props.currentConversationId === id) {
      if (conversations.value.length > 0) {
        emit('select-conversation', conversations.value[0].id)
      } else {
        createNewChat()
      }
    }
  }
}

/**
 * 编辑对话标题
 * @param conversation - 要编辑的对话对象
 */
const editTitle = async (conversation: Conversation): Promise<void> => {
  const newTitle = prompt('输入新的标题', conversation.title)
  if (newTitle?.trim()) {
    conversationService.updateConversationTitle(conversation.id, newTitle.trim())
  }
}

/**
 * 格式化日期
 * @param date - 要格式化的日期对象
 * @returns 格式化后的日期字符串，格式：月 日 时:分
 */
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  background: #f5f5f7;
  border-right: 1px solid #d2d2d7;
  display: flex;
  flex-direction: column;
  height: 100vh;
  user-select: none;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #d2d2d7;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  position: sticky;
  top: 0;
  z-index: 1;
}

.new-chat-button {
  width: 100%;
  height: 32px;
  background: #0071e3;
  border: none;
  border-radius: 16px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.new-chat-button:hover {
  background: #0077ED;
}

.plus-icon {
  width: 12px;
  height: 12px;
  fill: currentColor;
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 8px;
  margin: 2px 0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 12px;
  position: relative;
}

.conversation-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.conversation-item.active {
  background: rgba(0, 113, 227, 0.1);
}

.conversation-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.conversation-icon svg {
  width: 16px;
  height: 16px;
  fill: #1d1d1f;
  opacity: 0.8;
}

.conversation-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 13px;
  color: #1d1d1f;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time {
  font-size: 11px;
  color: #86868b;
  margin-top: 2px;
}

.actions {
  display: none;
  gap: 4px;
  position: absolute;
  right: 8px;
  background: inherit;
  padding-left: 8px;
}

.conversation-item:hover .actions {
  display: flex;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn svg {
  width: 14px;
  height: 14px;
  fill: #86868b;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.action-btn:hover svg {
  fill: #1d1d1f;
}

/* 自定义滚动条 */
.conversations-list::-webkit-scrollbar {
  width: 8px;
}

.conversations-list::-webkit-scrollbar-track {
  background: transparent;
}

.conversations-list::-webkit-scrollbar-thumb {
  background: #86868b;
  border-radius: 4px;
  border: 2px solid #f5f5f7;
}

.conversations-list::-webkit-scrollbar-thumb:hover {
  background: #737373;
}
</style> 