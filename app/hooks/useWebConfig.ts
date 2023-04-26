import { FirebaseOptions } from 'firebase/app'
import React from 'react'
import { client } from './useApiClient'

export interface WebConfig {
  features: Features
  firebase: FirebaseOptions
  gtagId: string
}

export interface WebConfigState {
  config: WebConfig
  loading: boolean
  error: Error | null
}

export class Features {
  private readonly features: Record<string, boolean>

  constructor (features: Record<string, boolean>) {
    this.features = features
  }

  isEnabled (feature: string): boolean {
    return this.features[feature] ?? false
  }

  doConditional (
    feature: string,
    on: () => void,
    off: () => void
  ): void {
    return this.isEnabled(feature) ? on() : off()
  }
}

interface Observer<T> {
  resolve: (v: T | PromiseLike<T>) => void
  reject: (err: Error) => void
}

class RemoteValue<T> {
  private waiting: boolean = false
  private value: T | null = null
  private error: Error | null = null
  private readonly observers: Array<Observer<T | null>> = []

  constructor (value: Promise<T>) {
    value.then(v => {
      this.value = v
    }).catch(err => {
      this.error = err
    }).finally(() => {
      this.waiting = false

      while (this.observers.length > 0) {
        this.resolve(this.observers.shift() as Observer<T | null>)
      }
    })
  }

  private resolve (o: Observer<T | null>): void {
    return this.error !== null ? o.reject(this.error) : o.resolve(this.value)
  }

  async observe (): Promise<T | null> {
    // eslint-disable-next-line @typescript-eslint/return-await
    return new Promise<T | null>((resolve, reject) => {
      const o = { resolve, reject }

      this.observers.push(o)

      if (!this.waiting) {
        this.resolve(o)
      }
    })
  }
}

const configObserver = new RemoteValue<WebConfig>(
  client.config().then(config => ({
    features: new Features(config.features),
    firebase: config.firebase,
    gtagId: config.gtagId
  }))
)

const useConfig = (): WebConfigState => {
  const [config, setConfig] = React.useState<WebConfig>({
    features: new Features({}),
    firebase: {},
    gtagId: ''
  })
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    configObserver.observe()
      .then(v => {
        if (v !== null) {
          setConfig(v)
        }
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [configObserver, setConfig, setLoading, setError])

  return {
    config,
    loading,
    error
  }
}

export default useConfig
