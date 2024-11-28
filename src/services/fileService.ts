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
    // 检查文件大小 (限制为5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error(`文件大小不能超过 5MB`)
    }

    // 检查文件类型
    if (file.type.startsWith('image/')) {
      const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!supportedTypes.includes(file.type)) {
        throw new Error('仅支持 JPEG、PNG、GIF 或 WebP 格式的图片');
      }
    }

    return true
  },

  /**
   * 读取文件内容
   * @param file - 要读取的文件对象
   * @returns {Promise<string>} 返回文件内容的Promise
   */
  async readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          if (file.type.startsWith('image/')) {
            // 对于图片，先加载到 Image 对象中验证
            try {
              await this.validateImageData(e.target.result as string);
              resolve(e.target.result as string);
            } catch (error) {
              reject(new Error('图片格式无效或已损坏'));
            }
          } else {
            resolve(e.target.result as string);
          }
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
  },

  /**
   * 验证图片数据是否有效
   * @param dataUrl - 图片的 Data URL
   * @returns {Promise<boolean>}
   */
  validateImageData(dataUrl: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // 检查图片是否有效尺寸
        if (img.width > 0 && img.height > 0) {
          resolve(true);
        } else {
          reject(new Error('Invalid image dimensions'));
        }
      };
      img.onerror = () => reject(new Error('Invalid image data'));
      img.src = dataUrl;
    });
  }
} 