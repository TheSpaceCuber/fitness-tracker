#!/usr/bin/env python3

# Bridge between MQTT and Models
# Requires paho for subscribing to MQTT
###################################

from json.decoder import JSONDecodeError
from ExerciseClassifier import ExerciseClassifier
import paho.mqtt.client as MqttClient

import logging, os, json

##### MQTT Setup #####
MQTT_USER = ""
MQTT_PASS = ""
MQTT_BROKER = ""
MQTT_PORT = 1883
MQTT_TOPIC = [("cs3237/predict", 0)]

##### Other setup #####
logger = logging.getLogger(__name__)
filehandle = logging.FileHandler(f"{os.path.splitext(__file__)[0]}.log", mode="a")
formatter = logging.Formatter('%(asctime)s : %(levelname)s - %(message)s')
filehandle.setFormatter(formatter)
logger.addHandler(filehandle)

logger.setLevel(logging.INFO)

##### Main code #####
classifiers = {}

def on_connect(client, user, flags, rc):
    if rc == 0:
        logger.info(f"Connected to {MQTT_BROKER} with code {rc}")
        client.subscribe(MQTT_TOPIC)
    else:
        logger.error(f"Error connecting to {MQTT_BROKER} with code {rc}")
        raise ConnectionError()

def on_subscribe(client, user, mid, qos):
    logger.info(f"Subscribed to {MQTT_TOPIC}")

def on_publish(client, user, mid):
    logger.info(f"Message published successfully.")

def predict_exercise(client, msg):
    if "session_id" not in msg:
        return
    session = msg["session_id"]
    accel_X = msg["accelX"]
    accel_Y = msg["accelY"]
    accel_Z = msg["accelZ"]
    gyro_X = msg["gyroX"]
    gyro_Y = msg["gyroY"]
    gyro_Z = msg["gyroZ"]
    if session not in classifiers:
        classifiers[session] = ExerciseClassifier()
    count, result = classifiers[session].predict(accel_X, accel_Y, accel_Z, gyro_X, gyro_Y, gyro_Z)
    result = json.dumps({"exercise": result, "count": count})
    client.publish(f"cs3237/prediction/{session}", result, qos=0)

def on_message(client, user, message):
    logger.info(f"From {message.topic}: {message.payload.decode()}")
    # pseudo-switch statement based on the topic
    try:
        msg = json.loads(message.payload)
        predict_exercise(client, msg)
    except JSONDecodeError:
        logger.error(f"{message.payload.decode()} is not a valid JSON document")

def main():
    mqttClient = MqttClient.Client(client_id="mqtt2mongo")
    mqttClient.username_pw_set(MQTT_USER, MQTT_PASS)
    mqttClient.on_connect = on_connect
    mqttClient.on_subscribe = on_subscribe
    mqttClient.on_publish = on_publish
    mqttClient.on_message = on_message
    mqttClient.connect(MQTT_BROKER, MQTT_PORT, 60)
    try:
        mqttClient.loop_forever()
    finally:
        mqttClient.disconnect()

if __name__ == "__main__":
    logger.info("Starting MQTT2Mongo")
    try:
        main()
    except Exception as e:
        logger.error(repr(e))
    finally:
        logger.info("MQTT2Mongo ended")
