import { FirebaseOptions } from 'firebase/app'
import React from 'react'
import { client } from './useApiClient'

export interface WebConfig {
  firebase: FirebaseOptions
  features: Features
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

const useConfig = (): WebConfig => {
  const [webConfig, setWebConfig] = React.useState<WebConfig>({
    firebase: {} as any,
    features: new Features({})
  })

  React.useEffect(() => {
    client.config().then(config => {
      setWebConfig({
        ...config,
        features: new Features(config.features)
      } as any)
    }).catch(err => console.log(err))
  }, [setWebConfig, client])

  return webConfig
}

export default useConfig
