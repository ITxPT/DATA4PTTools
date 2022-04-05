import mqtt from 'mqtt';
import React from 'react';

const mqttClient = mqtt.connect(process.env.MQTT_URL); // TODO move this to provider maybe

const useMqttClient = () => {
  return mqttClient;
};

export const useSubscription = (topic: string) => {
  const [message, setMessage] = React.useState<any>(null);

  const handler = React.useCallback((topic: string, payload: any) => {
    try {
      setMessage(JSON.parse(payload.toString()));
    } catch (err) {
      console.log('error caught decoding message', err);
    }
  }, [topic]);

  React.useEffect(() => {
    mqttClient.subscribe(topic); // TODO unsubscribe
    mqttClient.on('message', handler);

    return () => {
      mqttClient.off('message', handler);
      mqttClient.unsubscribe(topic);
    };
  }, [mqttClient, handler]);

  return message;
};

export default useMqttClient;
