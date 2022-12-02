import mqtt from 'mqtt'
import React from 'react'

const host = typeof window !== 'undefined' ? window.location.host : ''
const ssl = typeof window !== 'undefined' && window.location.protocol === 'https:'
const mqttClient = mqtt.connect(process.env.MQTT_URL || `ws${ssl ? 's' : ''}://${host}/ws`)

const useMqttClient = () => mqttClient

export const useSubscription = (topic: string) => {
  const [message, setMessage] = React.useState<any>(null)
  const pattern = new RegExp(`^${topic.replace(/[+]/g, '[^\\/]+').replace(/[#]/g, '.+')}$`)

  const handler = React.useCallback((topic: string, payload: any) => {
    if (!topic.match(pattern)) {
      return
    }

    try {
      setMessage(JSON.parse(payload.toString()))
    } catch (err) {
      console.log('error caught decoding message', err)
    }
  }, [topic])

  React.useEffect(() => {
    mqttClient.subscribe(topic)
    mqttClient.on('message', handler)

    return () => {
      mqttClient.off('message', handler)
      mqttClient.unsubscribe(topic)
    }
  }, [mqttClient, handler])

  return message
}

export default useMqttClient
