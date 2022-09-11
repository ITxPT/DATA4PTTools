package main

import (
	"encoding/json"
	"runtime"

	"github.com/eclipse/paho.mqtt.golang/packets"
	"github.com/fhmq/hmq/broker"
)

var (
	defaultMQTTPort = "1883"
	defaultWSPort   = "1888"
)

func DefaultBrokerConfig() *broker.Config {
	runtime.GOMAXPROCS(runtime.NumCPU())

	cfg := broker.DefaultConfig
	cfg.WsPath = "/ws"
	cfg.WsPort = "1888"
	cfg.Debug = true

	return cfg
}

func publishMessage(b *broker.Broker, topic string, message interface{}) error {
	if b == nil {
		return nil
	}

	buf, err := json.Marshal(message)
	if err != nil {
		return err
	}

	pub := packets.NewControlPacket(packets.Publish).(*packets.PublishPacket)
	pub.Qos = 0
	pub.TopicName = topic
	pub.Payload = buf

	b.PublishMessage(pub)

	return nil
}

type Broker struct {
	broker *broker.Broker
}

func NewMQTTBroker(cfg *broker.Config) (*Broker, error) {
	b, err := broker.NewBroker(cfg)
	if err != nil {
		return nil, err
	}

	return &Broker{
		broker: b,
	}, nil
}

func (b *Broker) Start() { b.broker.Start() }

func (b *Broker) PublishMessage(topic string, message interface{}) error {
	buf, err := json.Marshal(message)
	if err != nil {
		return err
	}

	pub := packets.NewControlPacket(packets.Publish).(*packets.PublishPacket)
	pub.Qos = 0
	pub.Retain = true
	pub.TopicName = topic
	pub.Payload = buf

	b.broker.PublishMessage(pub)

	return nil
}
