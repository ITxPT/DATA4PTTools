import axios from 'axios'
import crypto from 'crypto-js'
import { Profile, Script, Session } from './types'

async function calculateChecksum (file: any): Promise<any> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.readAsArrayBuffer(file)
    reader.onload = () => {
      const data = crypto.lib.WordArray.create(reader.result as any)
      const hash = crypto.SHA256(data).toString()

      resolve({ checksum: hash })
    }
  })
}

class ApiClient {
  private readonly url: string
  private readonly basePath: string = '/api'

  constructor (url: string) {
    this.url = url
  }

  private withUrl (path: string): string {
    return this.url + this.basePath + '/' + path
  }

  async ping (): Promise<any> {
    return await axios({
      method: 'get',
      url: this.withUrl('ping')
    })
  }

  async config (): Promise<Record<string, any>> {
    return await axios({
      method: 'get',
      url: this.withUrl('config')
    }).then(res => res.data)
  }

  async scripts (): Promise<Script[]> {
    return await axios({
      method: 'post',
      url: this.withUrl('scripts')
    }).then(res => res.data)
  }

  async profiles (): Promise<Profile[]> {
    return await axios({
      method: 'post',
      url: this.withUrl('profiles')
    }).then(res => res.data)
  }

  async createSession (): Promise<Session> {
    return await axios({
      method: 'post',
      url: this.withUrl('sessions')
    }).then(res => res.data)
  }

  async sessions (): Promise<Session[]> {
    return await axios({
      method: 'get',
      url: this.withUrl('sessions')
    }).then(res => res.data)
  }

  async session (id: string): Promise<Session> {
    return await axios({
      method: 'get',
      url: this.withUrl('sessions/' + id)
    }).then(res => res.data)
  }

  async setProfile (id: string, data: Profile): Promise<Session> {
    return await axios({
      method: 'POST',
      url: this.withUrl(`sessions/${id}/profile`),
      data
    }).then(res => res.data)
  }

  async addFile (id: string, file: File, onProgress?: (p: any) => void): Promise<any> {
    const { checksum } = await calculateChecksum(file)
    const data = new FormData()

    data.append('file', file)

    return await axios({
      method: 'post',
      url: this.withUrl(`sessions/${id}/upload`),
      data,
      params: { checksum },
      onUploadProgress: (p) => {
        if (onProgress !== undefined) {
          onProgress(p)
        }
      }
    })
  }

  async validate (id: string): Promise<any> {
    return await axios({
      method: 'get',
      url: this.withUrl(`sessions/${id}/validate`)
    }).then(res => res.data)
  }

  reportLink (id: string, format: string): string {
    return `${this.url}/report/${id}?f=${format}`
  }

  reportFileLink (id: string, name: string, format: string): string {
    return `${this.url}/report/${id}/${name}?f=${format}`
  }
}

export default ApiClient
