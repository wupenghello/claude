import { API_CONFIG } from '../config/api'

/** 文件类型数组类型定义 */
type FileTypes = string[]

/**
 * 文件服务
 * 处理文件的验证和读取操作
 */
export const fileService = {
  /**
   * 验证文件是否符合要求
   * @param file - 要验证的文件对象
   * @throws {Error} 当文件大小超过限制或类型不支持时抛出错误
   * @returns {boolean} 验证通过返回 true
   */
  validateFile(file: File): boolean {
    if (file.size > API_CONFIG.MAX_FILE_SIZE) {
      throw new Error(`文件大小不能超过 ${API_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    
    const isValidType = Object.values(API_CONFIG.FILE_TYPES).some(
      (types: FileTypes) => types.includes(extension)
    )
    
    if (!isValidType) {
      throw new Error('不支持的文件类型')
    }

    return true
  },

  /**
   * 读取文件内容
   * @param file - 要读取的文件对象
   * @returns {Promise<string>} 返回文件内容的Promise
   * - 如果是图片文件，返回base64编码的字符串
   * - 如果是文本文件，返回文本内容
   */
  async readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          resolve(e.target.result as string)
        }
      }
      
      reader.onerror = (error: ProgressEvent<FileReader>) => {
        reject(error)
      }

      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file)
      } else {
        reader.readAsText(file)
      }
    })
  }
} 