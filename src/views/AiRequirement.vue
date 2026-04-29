<script setup>
import { ref } from 'vue'
import { parseRequirement } from '@/api/requirement'

const userInput = ref('')
const isLoading = ref(false)
const messages = ref([]) // { role: 'user' | 'ai', content: string | object }
const supplementInput = ref('')
const errorMsg = ref('')

const sendMessage = async (text) => {
  isLoading.value = true
  errorMsg.value = ''
  try {
    const data = await parseRequirement(text, messages.value)
    messages.value.push({ role: 'ai', content: data })
  } catch (err) {
    errorMsg.value = err.message || '请求失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

// 提交需求描述
const handleSubmit = async () => {
  if (!userInput.value.trim()) return
  const text = userInput.value.trim()
  messages.value.push({ role: 'user', content: text })
  userInput.value = ''
  await sendMessage(text)
}

// 补充描述
const handleSupplement = async () => {
  if (!supplementInput.value.trim()) return
  const text = supplementInput.value.trim()
  supplementInput.value = ''
  messages.value.push({ role: 'user', content: text })
  await sendMessage(text)
}

// 确认需求
const handleConfirm = (aiContent) => {
  messages.value.push({
    role: 'user',
    content: '✅ 确认需求，内容如上。'
  })
  messages.value.push({
    role: 'ai',
    content: { confirmed: true, summary: aiContent.summary, message: '需求已确认，可以开始开发！' }
  })
}

const isObject = (val) => val !== null && typeof val === 'object'
</script>

<template>
  <div class="ai-requirement">
    <h2 class="page-title">AI 需求解析</h2>
    <p class="page-desc">用自然语言描述你的需求，AI 将帮你结构化解析，并支持多轮补充确认。</p>

    <!-- 对话区域 -->
    <div class="chat-area" v-if="messages.length > 0">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message"
        :class="msg.role"
      >
        <div class="message-label">{{ msg.role === 'user' ? '你' : 'AI' }}</div>

        <!-- 用户消息 -->
        <div v-if="msg.role === 'user'" class="bubble user-bubble">
          {{ msg.content }}
        </div>

        <!-- AI 消息 -->
        <div v-else class="bubble ai-bubble">
          <template v-if="isObject(msg.content)">
            <!-- 已确认 -->
            <div v-if="msg.content.confirmed" class="confirmed-msg">
              🎉 {{ msg.content.message }}
            </div>
            <!-- 结构化需求 -->
            <template v-else>
              <div class="ai-section">
                <span class="label">需求摘要：</span>{{ msg.content.summary }}
              </div>
              <div class="ai-section" v-if="msg.content.features?.length">
                <span class="label">功能点：</span>
                <ul>
                  <li v-for="(f, i) in msg.content.features" :key="i">{{ f }}</li>
                </ul>
              </div>
              <div class="ai-section" v-if="msg.content.constraints?.length">
                <span class="label">约束条件：</span>
                <ul>
                  <li v-for="(c, i) in msg.content.constraints" :key="i">{{ c }}</li>
                </ul>
              </div>
              <!-- 操作按钮 -->
              <div class="ai-actions" v-if="index === messages.length - 1">
                <button class="btn confirm-btn" @click="handleConfirm(msg.content)">✅ 确认需求</button>
              </div>
            </template>
          </template>
          <template v-else>{{ msg.content }}</template>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</div>

      <!-- 加载中 -->
      <div v-if="isLoading" class="message ai">
        <div class="message-label">AI</div>
        <div class="bubble ai-bubble loading">正在解析中<span class="dots">...</span></div>
      </div>

      <!-- 补充描述输入框（有对话后显示） -->
      <div class="supplement-area" v-if="!isLoading && messages.some(m => m.role === 'ai' && !m.content?.confirmed)">
        <input
          v-model="supplementInput"
          class="input-box"
          placeholder="补充描述需求..."
          @keyup.enter="handleSupplement"
        />
        <button class="btn submit-btn" @click="handleSupplement">补充</button>
      </div>
    </div>

    <!-- 初始输入区域 -->
    <div class="input-area" v-if="messages.length === 0">
      <textarea
        v-model="userInput"
        class="textarea-box"
        placeholder="请用自然语言描述你的需求，例如：我需要一个用户登录功能，支持手机号和密码登录..."
        rows="5"
        @keydown.ctrl.enter="handleSubmit"
      />
      <button
        class="btn submit-btn"
        :disabled="isLoading || !userInput.trim()"
        @click="handleSubmit"
      >
        {{ isLoading ? '解析中...' : '提交需求' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.ai-requirement {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: bold;
  color: #222;
}

.page-desc {
  color: #666;
  font-size: 14px;
  margin-top: -12px;
}

/* 对话区 */
.chat-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message.user {
  align-items: flex-end;
}

.message.ai {
  align-items: flex-start;
}

.message-label {
  font-size: 12px;
  color: #999;
  padding: 0 4px;
}

.bubble {
  max-width: 90%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.user-bubble {
  background-color: #007bff;
  color: white;
  border-bottom-right-radius: 4px;
}

.ai-bubble {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-bottom-left-radius: 4px;
  color: #333;
}

.ai-section {
  margin-bottom: 8px;
}

.ai-section ul {
  margin: 4px 0 0 16px;
  padding: 0;
}

.ai-section li {
  margin: 2px 0;
}

.label {
  font-weight: bold;
  color: #007bff;
}

.confirmed-msg {
  color: #28a745;
  font-weight: bold;
}

.ai-actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
}

/* 补充输入 */
.supplement-area {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.supplement-area .input-box {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.supplement-area .input-box:focus {
  border-color: #007bff;
}

/* 初始输入区 */
.input-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.textarea-box {
  width: 100%;
  padding: 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 14px;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.textarea-box:focus {
  border-color: #007bff;
}

/* 按钮 */
.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn {
  background-color: #007bff;
  color: white;
  align-self: flex-end;
}

.submit-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.submit-btn:disabled {
  background-color: #a0c4ff;
  cursor: not-allowed;
}

.confirm-btn {
  background-color: #28a745;
  color: white;
}

.confirm-btn:hover {
  background-color: #1e7e34;
}

/* 加载动画 */
.loading .dots {
  display: inline-block;
  animation: blink 1.2s infinite;
}

.error-msg {
  color: #dc3545;
  font-size: 13px;
  padding: 8px 12px;
  background: #fff5f5;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}
</style>
