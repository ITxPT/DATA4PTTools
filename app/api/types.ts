export interface Profile {
  name: string
  description: string
  longDescription: string
  version?: string
  scripts: Script[]
}

export interface Script {
  name: string
  description?: string
  longDescription?: string
  version: string
  configOptions?: ScriptConfigOption[]
  config?: Record<string, any>
}

export interface ScriptConfigOption {
  name: string
  description: string
  type: string
  default?: any
  options?: any[]
}

export interface XSDUploadFile {
  id: string
  name: string
}

export interface XSDUpload {
  name: string
  files?: XSDUploadFile[]
}

export interface Session {
  id: string
  name: string
  ref: string
  created: number
  stopped: number
  files: string[]
  xsdFiles?: XSDUpload[]
  status: string
  results: any[]
  profile?: Profile
}
