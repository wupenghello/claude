<template>
  <div class="app-container">
    <button class="logout-button" @click="handleLogout" data-tooltip="退出登录">
      <svg viewBox="0 0 24 24" class="logout-icon">
        <path d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 012 2v2h-2V4H5v16h9v-2h2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2h9z"/>
      </svg>
    </button>
    
    <ConversationList
      :current-conversation-id="currentConversationId"
      @select-conversation="handleConversationSelect"
    />
    
    <div class="main-content">
      <div class="model-selector-container">
        <div class="model-cards">
          <div v-for="model in API_CONFIG.MODELS" 
               :key="model.id"
               :class="['model-card', { active: selectedModel === model.id }]"
               @click="selectModel(model.id)"
               :data-tooltip="getModelTooltip(model)">
            <div class="model-header">
              <span class="model-name">{{ model.name }}</span>
              <span class="model-price">{{ model.price }}</span>
            </div>
            <div class="model-description">
              {{ model.description }}
            </div>
          </div>
        </div>
      </div>
      
      <div class="chat-container">
        <div class="chat-history" ref="chatHistoryRef">
          <div v-for="(message, index) in chatHistory" 
               :key="index" 
               :class="['message', message.role]">
            <div class="message-content">
              <div class="avatar">{{ message.role === 'user' ? '👤' : '🤖' }}</div>
              <div class="message-body" v-html="formatMessage(message.content)"></div>
            </div>
            <div class="message-time">{{ formatTime() }}</div>
          </div>
          <div v-if="isLoading" class="message assistant loading-message">
            <div class="message-content">
              <div class="avatar">🤖</div>
              <div class="message-body loading-body">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="input-area">
          <div class="input-header">
            <div class="resize-handle"></div>
            <button 
              class="reset-height-button" 
              @click="resetInputHeight"
              data-tooltip="还原输入框高度"
            >
              <svg viewBox="0 0 24 24" class="reset-icon">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              </svg>
            </button>
          </div>
          <textarea
            ref="messageInputRef"
            v-model="userInput"
            class="message-input"
            placeholder="输入消息... (Enter 发送, Cmd/Ctrl + Enter 换行)"
            @keydown.enter.exact.prevent="handleEnterPress"
            @keydown.meta.enter="handleNewLine"
            @keydown.ctrl.enter="handleNewLine"
            :disabled="isLoading"
          ></textarea>
          
          <div class="action-buttons">
            <label class="action-button upload-btn" data-tooltip="上传文件">
              <input
                type="file"
                @change="handleFileUpload"
                multiple
                class="file-input"
              >
              <i class="icon">📎</i>
            </label>
            <button class="action-button" data-tooltip="清空对话历史" @click="clearChat">
              <i class="icon">🗑️</i>
            </button>
            <button 
              class="send-button" 
              data-tooltip="发送消息"
              :disabled="!userInput.trim() || isLoading"
              @click="sendMessage"
            >
              <i class="icon">{{ isLoading ? '⏳' : '↑' }}</i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import ConversationList from './ConversationList.vue'
import { API_CONFIG } from '../config/api'
import { fileService } from '../services/fileService'
import { claudeService } from '../services/claudeService'
import { marked } from 'marked'
import { conversationService } from '../services/conversationService'
import Cookies from 'js-cookie'
import type { Model, Message, FileContent } from '@/types'

interface MessageEvent extends Event {
  target: HTMLInputElement
}

const chatHistoryRef = ref<HTMLDivElement | null>(null)
const messageInputRef = ref<HTMLTextAreaElement | null>(null)
const userInput = ref('')
const chatHistory = ref<Message[]>([])
const selectedModel = ref(API_CONFIG.MODELS.find((m: Model) => m.isDefault)?.id || API_CONFIG.DEFAULT_MODEL)
const uploadedFiles = ref<FileContent[]>([])
const isLoading = ref(false)
const lastSendTime = ref(0)
const SEND_COOLDOWN = 1000 // 1秒冷却时间
const currentConversationId = ref('')
const DEFAULT_INPUT_HEIGHT = '44px'

const formatMessage = (content: string): string => {
  return marked(content)
}

const handleFileUpload = async (event: Event): Promise<void> => {
  const input = event.target as HTMLInputElement
  if (!input.files) return
  
  const files = Array.from(input.files)
  
  try {
    for (const file of files) {
      await fileService.validateFile(file)
      const content = await fileService.readFile(file)
      uploadedFiles.value.push({
        name: file.name,
        content: content
      })
    }
    userInput.value += `\n已上传文件: ${files.map(f => f.name).join(', ')}`
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message)
    }
  }
}

const handleEnterPress = async (e: KeyboardEvent): Promise<void> => {
  const now = Date.now()
  if (now - lastSendTime.value < SEND_COOLDOWN) {
    e.preventDefault()
    return
  }
  lastSendTime.value = now
  await sendMessage()
}

const scrollToBottom = (): void => {
  nextTick(() => {
    const chatHistory = chatHistoryRef.value
    if (chatHistory) {
      chatHistory.scrollTop = chatHistory.scrollHeight
    }
  })
}

const sendMessage = async (): Promise<void> => {
  if (!userInput.value.trim() || isLoading.value) return

  isLoading.value = true
  
  try {
    const newUserMessage: Message = {
      role: 'user',
      content: userInput.value
    }
    
    const conversation = conversationService.getConversation(currentConversationId.value)
    if (!conversation) return
    
    conversation.messages.push(newUserMessage)
    chatHistory.value = conversation.messages
    
    const messageToSend = userInput.value
    userInput.value = ''
    scrollToBottom()

    const messageData = {
      model: selectedModel.value,
      message: messageToSend,
      files: uploadedFiles.value,
      conversationId: currentConversationId.value
    }

    uploadedFiles.value = []

    const response = await claudeService.sendMessage(messageData)
    
    const assistantMessage: Message = {
      role: 'assistant',
      content: response.content
    }
    
    conversation.messages.push(assistantMessage)
    chatHistory.value = conversation.messages
  } catch (error) {
    const errorMessage: Message = {
      role: 'assistant',
      content: `错误: ${error instanceof Error ? error.message : '未知错误'}`
    }
    chatHistory.value.push(errorMessage)
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

const handleMouseMove = (e: MouseEvent, textarea: HTMLTextAreaElement, startY: number, startHeight: number): void => {
  const deltaY = startY - e.clientY
  const newHeight = Math.min(Math.max(startHeight + deltaY, 44), 300)
  textarea.style.height = `${newHeight}px`
}

onMounted(() => {
  adjustHeight()
  window.addEventListener('resize', adjustHeight)

  if (conversationService.conversations.length === 0) {
    const initialConv = conversationService.createConversation()
    currentConversationId.value = initialConv.id
  } else {
    currentConversationId.value = conversationService.conversations[0].id
  }

  const textarea = messageInputRef.value
  if (!textarea) return

  let isResizing = false
  let startY = 0
  let startHeight = 0

  textarea.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.offsetY <= 20) {
      isResizing = true
      startY = e.clientY
      startHeight = textarea.offsetHeight
      
      const handleMouseUp = () => {
        isResizing = false
        document.removeEventListener('mousemove', handleMouseMoveWrapper)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      const handleMouseMoveWrapper = (e: MouseEvent) => {
        if (!isResizing) return
        handleMouseMove(e, textarea, startY, startHeight)
      }

      document.addEventListener('mousemove', handleMouseMoveWrapper)
      document.addEventListener('mouseup', handleMouseUp)
      
      e.preventDefault()
    }
  })
})

const adjustHeight = (): void => {
  const vh = window.innerHeight
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}

const selectModel = (modelId: string): void => {
  selectedModel.value = modelId
}

const handleNewLine = (e: KeyboardEvent): void => {
  e.preventDefault()
  userInput.value += '\n'
}

const clearChat = (): void => {
  const conversation = conversationService.getConversation(currentConversationId.value)
  if (!conversation) return
  
  conversation.messages = []
  chatHistory.value = []
  claudeService.clearHistory(currentConversationId.value)
}

const handleConversationSelect = (id: string): void => {
  currentConversationId.value = id
  const conversation = conversationService.getConversation(id)
  if (conversation) {
    chatHistory.value = conversation.messages
  }
}

const formatTime = (): string => {
  return new Date().toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const getModelTooltip = (model: Model): string => {
  let tooltip = `${model.name}\n价格: ${model.price}\n\n${model.description}`
  
  if (model.features) {
    tooltip += '\n\n特点:'
    model.features.forEach(feature => {
      tooltip += `\n• ${feature}`
    })
  }
  
  return tooltip
}

const handleLogout = (): void => {
  if (confirm('确定要退出登录吗？')) {
    Cookies.remove('auth')
    window.location.reload()
  }
}

const resetInputHeight = (): void => {
  if (messageInputRef.value) {
    messageInputRef.value.style.height = DEFAULT_INPUT_HEIGHT
  }
}
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  background-color: #ffffff;
  color: #1a1a1a;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f5f7;
}

.model-selector-container {
  padding: 12px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 2;
}

.model-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr); /* 固定5列 */
  gap: 10px;
  max-width: 1600px;
  margin: 0 auto;
}

.model-card {
  background: #ffffff;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e5e5e5;
  min-width: 0; /* 允许卡片缩小 */
}

.model-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.model-card.active {
  border-color: #007AFF;
  background: #F5F9FF;
}

.model-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  gap: 8px;
}

.model-name {
  font-weight: 500;
  font-size: 13px;
  color: #1d1d1f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: help;
}

.model-price {
  color: #666666;
  font-size: 11px;
  white-space: nowrap;
  cursor: help;
}

.model-description {
  color: #666666;
  font-size: 11px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  cursor: help;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  margin: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message {
  margin-bottom: 20px;
  max-width: 80%;
}

.message.assistant {
  margin-left: 0;
  margin-right: auto;
}

.message.user {
  margin-left: auto;
  margin-right: 0;
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f7;
  font-size: 1.2em;
}

.message-body {
  padding: 12px 16px;
  border-radius: 18px;
  background: #f5f5f7;
  line-height: 1.5;
  font-size: 0.95em;
}

.user .message-body {
  background: #007AFF;
  color: #ffffff;
  border-radius: 18px 18px 4px 18px;
}

.assistant .message-body {
  border-radius: 18px 18px 18px 4px;
}

.message-time {
  font-size: 0.8em;
  color: #999;
  margin-top: 4px;
  margin-left: 44px;
}

.input-area {
  padding: 20px;
  border-top: 1px solid #e5e5e5;
  background: #ffffff;
  position: relative;
}

.input-header {
  position: relative;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.resize-handle {
  width: 40px;
  height: 4px;
  background: #e5e5e5;
  border-radius: 2px;
  cursor: row-resize;
  transition: background-color 0.2s ease;
}

.resize-handle:hover {
  background: #d1d1d1;
}

.reset-height-button {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
}

.input-header:hover .reset-height-button {
  opacity: 1;
}

.reset-icon {
  width: 16px;
  height: 16px;
  fill: #666666;
}

.reset-height-button:hover .reset-icon {
  fill: #007AFF;
}

.message-input {
  width: 100%;
  min-height: 44px;
  max-height: 300px;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 22px;
  background: #f5f5f7;
  font-size: 0.95em;
  resize: none;
  transition: all 0.2s ease;
  overflow-y: auto;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  align-items: center;
}

.action-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f5f5f7;
  color: #666666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.action-button:hover {
  background: #e5e5e5;
}

.send-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #007AFF;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.send-button:hover:not(:disabled) {
  background: #0066CC;
}

.send-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.file-input {
  display: none;
}

.loading-message {
  opacity: 0.8;
}

.loading-body {
  min-width: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 8px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background-color: #666666;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 100% {
    transform: scale(0.7);
    opacity: 0.5;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #e5e5e5;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #cccccc;
}

/* 修改 tooltip 样式 */
[data-tooltip] {
  position: relative;
}

[data-tooltip]:before {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 12px;
  white-space: nowrap;
  border-radius: 6px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  pointer-events: none;
  z-index: 1000;
}

[data-tooltip]:after {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.8);
  margin-bottom: 0;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  pointer-events: none;
}

[data-tooltip]:hover:before,
[data-tooltip]:hover:after {
  opacity: 1;
  visibility: visible;
}

/* 为模型卡片单独设置 tooltip 样式 */
.model-card[data-tooltip]:before {
  top: 100%;
  bottom: auto;
  margin-top: 8px;
  margin-bottom: 0;
  white-space: pre-line;
  text-align: left;
  padding: 12px;
  line-height: 1.4;
  max-width: 300px;
  width: max-content;
}

.model-card[data-tooltip]:after {
  top: 100%;
  bottom: auto;
  border-top-color: transparent;
  border-bottom-color: rgba(0, 0, 0, 0.8);
  margin-top: 0;
}

.logout-button {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.logout-button:hover {
  background: #f5f5f7;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.logout-icon {
  width: 20px;
  height: 20px;
  fill: #666666;
}

.logout-button:hover .logout-icon {
  fill: #007AFF;
}

.user .message-content {
  flex-direction: row-reverse; /* 反转内容顺序 */
}

.user .message-time {
  text-align: right;
  margin-left: 0;
  margin-right: 44px;
}

.user .message-body {
  background: #007AFF;
  color: #ffffff;
  border-radius: 18px 18px 4px 18px;
}

.assistant .message-body {
  border-radius: 18px 18px 18px 4px;
}
</style> 