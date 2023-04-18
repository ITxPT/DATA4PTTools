export interface Profile {
  name: string
  description: string
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

export interface Session {
  id: string
  name: string
  ref: string
  created: number
  stopped: number
  files: string[]
  status: string
  results: any[]
  profile?: Profile
}
