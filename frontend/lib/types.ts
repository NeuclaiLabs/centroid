import { CoreMessage } from 'ai'
export interface StorageObject {
  storageProvider: 'S3' | 'MinIO' | 'Azure'
  container: string
  key: string
  eTag?: string
  lastModified?: Date
  size?: number
  contentType?: string
  getUrl(region?: string): string // Method signature
}

class CloudStorageObject implements StorageObject {
  storageProvider: 'S3' | 'MinIO' | 'Azure'
  container: string
  key: string
  eTag?: string
  lastModified?: Date
  size?: number
  contentType?: string

  constructor(
    storageProvider: 'S3' | 'MinIO' | 'Azure',
    container: string,
    key: string,
    eTag?: string,
    lastModified?: Date,
    size?: number,
    contentType?: string
  ) {
    this.storageProvider = storageProvider
    this.container = container
    this.key = key
    this.eTag = eTag
    this.lastModified = lastModified
    this.size = size
    this.contentType = contentType
  }

  getUrl(region?: string): string {
    if (this.storageProvider === 'S3' || this.storageProvider === 'MinIO') {
      return `https://${this.container}.s3.${region}.amazonaws.com/${this.key}`
    } else if (this.storageProvider === 'Azure') {
      return `https://${this.container}.blob.core.windows.net/${this.key}`
    } else {
      throw new Error('Unsupported storage provider')
    }
  }
}

export type Message = CoreMessage & {
  id: string
  files?: StorageObject[]
}

export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: Message[]
  sharePath?: string
}
export interface Connection extends Record<string, any> {
  id: string
  name: string
  type: string
  data: { url?: string; key?: string }
  createdAt?: Date
  updatedAt?: Date
  ownerId: string
}

export interface Settings extends Record<string, any> {
  id: string
  data: {
    [key: string]: any
  }
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>

export interface Session {
  user: {
    id: string
    email: string
  }
}

export interface AuthResult {
  type: string
  message: string
}

export interface User extends Record<string, any> {
  id: string
  email: string
  password: string
  salt: string
}

export interface Model {
  id: string
  name?: string
  connection: Connection
}
