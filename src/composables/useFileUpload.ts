import { ref, Ref } from 'vue'
import { storage } from '@/services/supabase'

export interface FileUploadOptions {
  bucket: string
  maxSize?: number // in bytes
  allowedTypes?: string[]
  generateFileName?: (file: File) => string
}

export interface UploadResult {
  url: string
  fileName: string
}

export function useFileUpload(options: FileUploadOptions) {
  const file = ref<File | null>(null)
  const preview = ref<string>('')
  const uploading = ref(false)
  const error = ref<string | null>(null)

  const defaultMaxSize = 5 * 1024 * 1024 // 5MB
  const maxSize = options.maxSize || defaultMaxSize

  const validateFile = (inputFile: File): boolean => {
    // Check file size
    if (inputFile.size > maxSize) {
      const sizeMB = Math.round(maxSize / 1024 / 1024)
      error.value = `檔案大小不能超過 ${sizeMB}MB`
      return false
    }

    // Check file type
    if (options.allowedTypes && options.allowedTypes.length > 0) {
      const isAllowed = options.allowedTypes.some(type =>
        inputFile.type.startsWith(type)
      )
      if (!isAllowed) {
        error.value = '請選擇正確的檔案類型'
        return false
      }
    }

    return true
  }

  const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    const inputFile = target.files?.[0]

    if (inputFile) {
      if (!validateFile(inputFile)) {
        return
      }

      file.value = inputFile
      error.value = null

      // Generate preview for images
      if (inputFile.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          preview.value = e.target?.result as string
        }
        reader.readAsDataURL(inputFile)
      }
    }
  }

  const upload = async (customFileName?: string): Promise<UploadResult | null> => {
    if (!file.value) {
      error.value = '請選擇檔案'
      return null
    }

    uploading.value = true
    error.value = null

    try {
      const fileName = customFileName ||
        (options.generateFileName ? options.generateFileName(file.value) : file.value.name)

      await storage.upload(options.bucket, fileName, file.value, { upsert: true })

      const publicUrl = storage.getPublicUrl(options.bucket, fileName)
      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`

      return {
        url: urlWithTimestamp,
        fileName
      }
    } catch (err: any) {
      console.error('上傳檔案失敗:', err)

      if (err.message?.includes('Bucket not found') || err.error === 'Bucket not found') {
        error.value = `儲存空間未設定。請聯繫系統管理員在 Supabase 中創建 "${options.bucket}" bucket。`
      } else {
        error.value = `上傳失敗: ${err.message || '未知錯誤'}`
      }

      return null
    } finally {
      uploading.value = false
    }
  }

  const reset = () => {
    file.value = null
    preview.value = ''
    error.value = null
  }

  return {
    file,
    preview,
    uploading,
    error,
    handleFileChange,
    upload,
    reset,
    validateFile
  }
}
