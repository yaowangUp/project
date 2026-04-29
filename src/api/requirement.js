import request from './request'

/**
 * 提交自然语言需求，获取 AI 结构化解析结果
 * @param {string} message - 用户输入的需求描述
 * @param {Array}  history - 历史对话记录
 */
export function parseRequirement(message) {
  return request.post('/api/analyze', { text: message })
}
