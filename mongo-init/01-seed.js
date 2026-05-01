db = db.getSiblingDB("iot_db");

const types = ["humidity", "temperature", "soil_moisture", "light"];
const units = {
  humidity: "%",
  temperature: "C",
  soil_moisture: "%",
  light: "lux"
};

const now = new Date();
const docs = [];

for (let i = 0; i < 1000; i++) {
  const type = types[i % types.length];
  const value = Number((Math.random() * 100).toFixed(2));

  docs.push({
    deviceId: `esp32-${(i % 10) + 1}`,
    sensorId: `sensor-${(i % 40) + 1}`,
    type,
    value,
    unit: units[type],
    timestamp: new Date(now.getTime() - i * 60000)
  });
}

db.sensor_readings.insertMany(docs);
