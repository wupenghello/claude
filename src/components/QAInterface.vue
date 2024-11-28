<template>
  <div class="app-container">
    <div class="header-controls">
      <button class="control-button settings-button" @click="showSettings = true" data-tooltip="API 设置">
        <svg viewBox="0 0 24 24" class="control-icon">
          <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.65.07-.97 0-.32-.03-.65-.07-.97l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65c-.04-.24-.25-.42-.5-.42h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.63c-.04.32-.07.65-.07.97 0 .32.03.65.07.97l-2.11 1.63c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.31.61.22l2.49-1c.52.39 1.06.73 1.69.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.25 1.17-.59 1.69-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.63z"/>
        </svg>
      </button>
      <button class="control-button logout-button" @click="handleLogout" data-tooltip="退出登录">
        <svg viewBox="0 0 24 24" class="control-icon">
          <path d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 012 2v2h-2V4H5v16h9v-2h2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2h9z"/>
        </svg>
      </button>
    </div>
    
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
      
      <div v-if="showSettings" class="settings-panel">
        <div class="settings-header">
          <h3>API 设置</h3>
          <button class="close-button" @click="showSettings = false">×</button>
        </div>
        
        <div class="settings-content">
          <!-- 基础设置组 -->
          <div class="settings-group">
            <h4 class="group-title">基础设置</h4>
            
            <div class="setting-item">
              <label data-tooltip="控制AI回复的最大长度，较大的值允许更详细的回答，但会消耗更多tokens">最大返回 Tokens</label>
              <div class="input-with-value">
                <input type="range" v-model="apiSettings.max_tokens" min="100" max="10000" step="100">
                <span class="value-display">{{ apiSettings.max_tokens }}</span>
              </div>
            </div>
            
            <div class="setting-item">
              <label data-tooltip="控制输出的随机性：值越低输出越保守可预测，值越高输出越有创意多样">温度 (Temperature)</label>
              <div class="input-with-value">
                <input type="range" v-model="apiSettings.temperature" min="0" max="1" step="0.1">
                <span class="value-display">{{ apiSettings.temperature }}</span>
              </div>
            </div>
          </div>

          <!-- 高级设置组 -->
          <div class="settings-group">
            <h4 class="group-title">高级设置</h4>
            
            <div class="setting-item">
              <label data-tooltip="控制输出的多样性：较低的值会使输出更加集中和确定，较高的值会产生更多样化的输出">Top P (核采样)</label>
              <div class="input-with-value">
                <input type="range" v-model="apiSettings.top_p" min="0" max="1" step="0.1">
                <span class="value-display">{{ apiSettings.top_p }}</span>
              </div>
            </div>
            
            <div class="setting-item">
              <label data-tooltip="控制每一步生成时考虑的候选词数量：较小的值会使输出更保守，较大的值会使用更丰富的词汇">Top K</label>
              <div class="input-with-value">
                <input type="range" v-model="apiSettings.top_k" min="1" max="100" step="1">
                <span class="value-display">{{ apiSettings.top_k }}</span>
              </div>
            </div>

            <div class="setting-item">
              <label data-tooltip="控制模型对重复内容的惩罚程度：较高的值会减少重复，但可能影响连贯性">重复惩罚</label>
              <div class="input-with-value">
                <input type="range" v-model="apiSettings.repetition_penalty" min="1" max="2" step="0.1">
                <span class="value-display">{{ apiSettings.repetition_penalty }}</span>
              </div>
            </div>

            <div class="setting-item">
              <label data-tooltip="控制模型生成时的最小长度：确保生成的内容不会过于简短">最小生成长度</label>
              <div class="input-with-value">
                <input type="range" v-model="apiSettings.min_tokens" min="0" max="1000" step="10">
                <span class="value-display">{{ apiSettings.min_tokens }}</span>
              </div>
            </div>
          </div>

          <!-- 上下文设置组 -->
          <div class="settings-group">
            <h4 class="group-title">上下文设置</h4>
            
            <div class="setting-item">
              <label data-tooltip="保留的历史消息数量：较多的历史消息可以提供更好的上下文理解，但会消耗更多tokens">历史消息数量</label>
              <div class="input-with-value">
                <input type="range" v-model="apiSettings.messages_window" min="1" max="20" step="1">
                <span class="value-display">{{ apiSettings.messages_window }}</span>
              </div>
            </div>

            <div class="setting-item system-prompt">
              <label data-tooltip="设定AI助手角色和行为方式，影响其回答的风格和专业方向">系统提示语</label>
              <div class="system-prompt-container">
                <textarea 
                  v-model="apiSettings.system" 
                  rows="6"
                  placeholder="设定AI助手的角色和行为方式..."
                  class="system-prompt-input"
                ></textarea>
                <div class="system-prompt-tips">
                  <p>提示：</p>
                  <ul>
                    <li>可以设定AI的专业领域</li>
                    <li>可以定义回答的风格和语气</li>
                    <li>可以指定特定的输出格式</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- 高级功能组 -->
          <div class="settings-group">
            <h4 class="group-title">高级功能</h4>
            
            <div class="setting-item checkbox-item">
              <label data-tooltip="启用此选项可以让AI更好地理解和保持多轮对话的上下文">
                <input type="checkbox" v-model="apiSettings.use_context">
                增强上下文理解
              </label>
            </div>
          </div>
        </div>
        
        <div class="settings-footer">
          <button class="reset-button" @click="resetSettings">恢复默认值</button>
          <button class="save-button" @click="saveSettings">保存设置</button>
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
        </div>

        <div class="input-area">
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
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
const showSettings = ref(false)
const apiSettings = ref({ ...claudeService.defaultConfig })
const STORAGE_KEY = 'claude_api_settings'

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
  
  // 阻止默认的回车换行行为
  e.preventDefault()
  
  // 如果输入框为空或只包含空白字符，不发送消息
  if (!userInput.value.trim()) {
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
  const messageText = userInput.value.replace(/\n\s*\n/g, '\n').replace(/^\s+|\s+$/g, '')
  
  if (!messageText || isLoading.value) return

  isLoading.value = true
  
  try {
    const newUserMessage: Message = {
      role: 'user',
      content: messageText
    }
    
    const conversation = conversationService.getConversation(currentConversationId.value)
    if (!conversation) return
    
    conversation.messages.push(newUserMessage)
    chatHistory.value = conversation.messages
    
    userInput.value = ''
    scrollToBottom()

    const messageData = {
      model: selectedModel.value,
      message: messageText,
      files: uploadedFiles.value,
      conversationId: currentConversationId.value
    }

    uploadedFiles.value = []

    const response = await claudeService.sendMessage(messageData)
    
    if (response && response.content) {
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.content
      }
      
      conversation.messages.push(assistantMessage)
      chatHistory.value = [...conversation.messages]
      await nextTick()
      scrollToBottom()
    } else {
      throw new Error('接收到空的响应内容')
    }
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

  // 从 localStorage 加载设置
  const savedSettings = localStorage.getItem(STORAGE_KEY)
  if (savedSettings) {
    const parsedSettings = JSON.parse(savedSettings)
    apiSettings.value = { ...claudeService.defaultConfig, ...parsedSettings }
    // 立即应用加载的设置
    claudeService.updateConfig(apiSettings.value)
  }
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

const saveSettings = () => {
  claudeService.updateConfig(apiSettings.value)
  // 保存到 localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apiSettings.value))
  showSettings.value = false
}

const resetSettings = () => {
  apiSettings.value = { ...claudeService.defaultConfig }
  // 清除 localStorage 中的设置
  localStorage.removeItem(STORAGE_KEY)
}

// 在组件卸载时清理定时器
onUnmounted(() => {
  if (typingTimer) {
    clearTimeout(typingTimer)
  }
})
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

.message.user .message-content {
  flex-direction: row-reverse;
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
  flex-shrink: 0;  /* 防止头像被压缩 */
}

.message-body {
  padding: 8px 16px;
  border-radius: 18px;
  background: #f5f5f7;
  line-height: 1.4;
  font-size: 0.95em;
  white-space: pre-wrap;
  min-height: 35px;
  display: flex;
  align-items: center;
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
  padding: 0 44px;  /* 与头像对齐 */
}

.user .message-time {
  text-align: right;
}

.assistant .message-time {
  text-align: left;
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
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.action-button {
  width: 32px;
  height: 32px;
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
  width: 32px;
  height: 32px;
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
  opacity: 1;
  margin-bottom: 0;
}

.loading-body {
  min-width: 60px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f7;
  border-radius: 18px 18px 18px 4px;
  padding: 8px 16px;
}

.typing-dots {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  background-color: #999;
  border-radius: 50%;
  display: inline-block;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% { 
    transform: scale(0);
    opacity: 0.4;
  }
  40% { 
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

.header-controls {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 12px;
  z-index: 1000;
}

.control-button {
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-button:hover {
  background: #f5f5f7;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.control-icon {
  width: 20px;
  height: 20px;
  fill: #666666;
}

.control-button:hover .control-icon {
  fill: #007AFF;
}

.settings-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #e5e5e5;
  background: #ffffff;
  color: #666666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-button:hover {
  background: #f5f5f7;
  border-color: #007AFF;
  color: #007AFF;
}

.settings-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.settings-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 480px;
  max-height: 80vh;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.settings-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-header h3 {
  font-size: 16px;
  font-weight: 500;
  color: #1d1d1f;
  margin: 0;
}

.settings-content {
  padding: 0;
  max-height: calc(80vh - 120px);
  overflow-y: auto;
}

.settings-group {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.settings-group:last-child {
  border-bottom: none;
}

.group-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 16px 0;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.input-with-value {
  display: flex;
  align-items: center;
  gap: 12px;
}

.value-display {
  min-width: 40px;
  text-align: right;
  font-size: 13px;
  color: #666666;
}

.setting-item input[type="range"] {
  flex: 1;
  height: 4px;
  background: #e5e5e5;
  border-radius: 2px;
  -webkit-appearance: none;
}

.setting-item input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #007AFF;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.setting-item input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin: 0;
}

.checkbox-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.settings-footer {
  padding: 16px;
  border-top: 1px solid #e5e5e5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.reset-button,
.save-button {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.2s ease;
}

.reset-button {
  background: #f5f5f7;
  color: #666666;
}

.save-button {
  background: #007AFF;
  color: white;
}

.reset-button:hover {
  background: #e5e5e5;
}

.save-button:hover {
  background: #0066CC;
}

.close-button {
  width: 24px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 20px;
  color: #666666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: #f5f5f7;
}

.setting-item label[data-tooltip]:before {
  width: 200px;
  white-space: normal;
  text-align: center;
  line-height: 1.4;
  bottom: 100%;
  margin-bottom: 5px;
}

.setting-item label[data-tooltip]:after {
  bottom: 100%;
  margin-bottom: 1px;
}

/* 为 header-controls 中的按钮单独设置 tooltip 样式 */
.header-controls .control-button[data-tooltip]:before {
  bottom: auto;  /* 移除底部定位 */
  top: 100%;    /* 改为顶部定位 */
  margin-bottom: 0;
  margin-top: 8px;
}

.header-controls .control-button[data-tooltip]:after {
  bottom: auto;  /* 移除底部定位 */
  top: 100%;    /* 改为顶部定位 */
  border-top-color: transparent;  /* 移除顶部三角形 */
  border-bottom-color: rgba(0, 0, 0, 0.8);  /* 添加底部三角形 */
  margin-bottom: 0;
  margin-top: 4px;
}

.system-prompt {
  margin-top: 24px;
}

.system-prompt-container {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
}

.system-prompt-input {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: #ffffff;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
}

.system-prompt-tips {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e5e5e5;
  font-size: 12px;
  color: #666666;
}

.system-prompt-tips p {
  margin: 0 0 8px 0;
  font-weight: 500;
}

.system-prompt-tips ul {
  margin: 0;
  padding-left: 20px;
}

.system-prompt-tips li {
  margin: 4px 0;
}

/* 修改 tooltip 样式，确保内容完全可见 */
[data-tooltip]:before {
  max-width: none;  /* 移除最大宽度限制 */
  white-space: normal;  /* 允许文本换行 */
  width: max-content;  /* 根据内容自动调整宽度 */
  max-width: 300px;   /* 设置最大宽度 */
  z-index: 1100;      /* 确保显示在最上层 */
}

.settings-panel [data-tooltip]:before {
  transform: translate(-50%, -100%);  /* 调整提示框位置 */
  margin-top: -8px;  /* 微调位置 */
}

/* 确保设置面板中的 tooltip 不会被截断 */
.settings-panel {
  position: fixed;
  overflow: visible;  /* 允许内容溢出 */
}

.settings-content {
  overflow-y: auto;
  overflow-x: visible;  /* 允许水平方向溢出 */
}

/* 移除多余的设置按钮样式 */
.model-controls {
  display: none;
}

/* 修改设置面板相关样式 */
.settings-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 480px;
  max-height: 80vh;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

/* 设置面板中的 tooltip 样式 */
.settings-panel [data-tooltip] {
  position: relative;
}

.settings-panel [data-tooltip]:before {
  content: attr(data-tooltip);
  position: absolute;
  left: auto;
  right: -10px;
  top: 50%;
  transform: translateY(-50%) translateX(100%);
  margin: 0;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 12px;
  line-height: 1.6;
  white-space: normal;
  width: 280px;
  min-height: fit-content;
  height: auto;
  border-radius: 8px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  pointer-events: none;
  z-index: 1100;
  word-wrap: break-word;
  overflow: visible;
}

.settings-panel [data-tooltip]:after {
  content: '';
  position: absolute;
  left: auto;
  right: -10px;
  top: 50%;
  transform: translateY(-50%);
  border: 8px solid transparent;
  border-right-color: rgba(0, 0, 0, 0.8);
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  pointer-events: none;
}

.settings-panel [data-tooltip]:hover:before,
.settings-panel [data-tooltip]:hover:after {
  opacity: 1;
  visibility: visible;
}

/* 确保设置面板内容可以正常滚动 */
.settings-content {
  overflow-y: auto;
  overflow-x: visible;
  padding-right: 30px;
  position: relative;
}

.settings-panel {
  overflow: visible !important;
}

/* 添加打字机效果相关样式 */
.message-body {
  /* 其他样式保持不变 */
  white-space: pre-wrap;  /* 保留换行符 */
}

/* 确保打字时的光标效果 */
.message.assistant:last-child .message-body {
  border-right: 2px solid transparent;
  animation: cursor-blink 1s infinite;
}

@keyframes cursor-blink {
  0%, 100% {
    border-right-color: transparent;
  }
  50% {
    border-right-color: currentColor;
  }
}

/* 添加蒙层样式 */
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  backdrop-filter: blur(2px);
}

/* 确保设置面板在蒙层之上 */
.settings-panel {
  z-index: 1000;
}

/* 统一设置面板中的 tooltip 样式为右侧显示 */
.settings-panel [data-tooltip] {
  position: relative;
}

.settings-panel [data-tooltip]:before {
  content: attr(data-tooltip);
  position: absolute;
  left: auto;
  right: -10px;
  top: 50%;
  transform: translateY(-50%) translateX(100%);
  margin: 0;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 12px;
  line-height: 1.6;
  white-space: normal;
  width: 280px;
  min-height: fit-content;
  height: auto;
  border-radius: 8px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  pointer-events: none;
  z-index: 1100;
  word-wrap: break-word;
  overflow: visible;
}

.settings-panel [data-tooltip]:after {
  content: '';
  position: absolute;
  left: auto;
  right: -10px;
  top: 50%;
  transform: translateY(-50%);
  border: 8px solid transparent;
  border-right-color: rgba(0, 0, 0, 0.8);
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  pointer-events: none;
}

.settings-panel [data-tooltip]:hover:before,
.settings-panel [data-tooltip]:hover:after {
  opacity: 1;
  visibility: visible;
}

/* 调整内容区域的内边距，为右侧 tooltip 预留空间 */
.settings-content {
  padding-right: 30px;
}
</style> 