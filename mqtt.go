package greenlight

import (
	"encoding/json"
	"log"
	"runtime"

	"github.com/eclipse/paho.mqtt.golang/packets"
	"github.com/fhmq/hmq/broker"
)

var (
	mqttBroker       *broker.Broker
	messageIdCounter = 0
)

func init() {
	runtime.GOMAXPROCS(runtime.NumCPU())
	cfg := broker.DefaultConfig
	cfg.WsPath = "/ws"
	cfg.WsPort = "1888"
	cfg.Debug = true
	b, err := broker.NewBroker(nil)
	if err != nil {
		log.Fatal("error caught creating mqtt broker: ", err)
	}
	b.Start()

	mqttBroker = b
}

func publishMessage(topic string, message interface{}) error {
	buf, err := json.Marshal(message)
	if err != nil {
		return err
	}

	pub := packets.NewControlPacket(packets.Publish).(*packets.PublishPacket)
	pub.Qos = 0
	pub.TopicName = topic
	pub.Payload = buf
	mqttBroker.PublishMessage(pub)

	return nil
}
