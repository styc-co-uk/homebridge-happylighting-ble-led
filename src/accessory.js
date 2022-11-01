let Service, Characteristic, homebridgeAPI;
// const Scanner = require("./scanner.js");
// var rgbConversion = require('./rgbConversion');

const defaultTimeout = 15;

const ColorType = {
  RGB: "RGB",
  Mono: "Mono"
};

class BLEAccessory {
  constructor(log, config) {
    this.log = log;
    this.config = config || {};
    this.type = this.config.type || ColorType.RGB;
    this.displayName = this.config.name;

    // this.latestBatteryLevel = undefined;
    // this.lastUpdatedAt = undefined;
    // this.lastBatchUpdatedAt = undefined;

    // this.latestTemperature = undefined;
    // this.temperatureMQTTTopic = undefined;
    // this.batteryMQTTTopic = undefined;
    this.bulb = new Service.Lightbulb(this.config.name);

    this.enablePower();
    this.enableBrightness();

    this.bulb.getCharacteristic(Characteristic.Brightness)
      .on("get", this.getBright.bind(this))
      .on("set", this.setBright.bind(this));

    switch (this.type) {
      case AccessoryType.RGB:
        // this.bulb.getCharacteristic(Characteristic.Hue)
        //   .on("get", this.getHue.bind(this))
        //   .on("set", this.setHue.bind(this));
        // this.bulb.getCharacteristic(Characteristic.Saturation)
        //   .on("get", this.getSat.bind(this))
        //   .on("set", this.setSat.bind(this));
        break;
      case AccessoryType.Mono:
        break;
      default:
        throw Error(`Unsupported accessory type "${this.type}"`);
    }

    // this.informationService = this.getInformationService();
    // this.batteryService = this.getBatteryService();
    // this.fakeGatoHistoryService = this.getFakeGatoHistoryService();
    // this.temperatureService = this.getTemperatureService();

    // this.mqttClient = this.setupMQTTClient();

    // this.scanner = this.setupScanner();

    this.log.debug(`Initialized accessory of type ${this.type}`);
  }

  enablePower() {
    var power = this.bulb.getCharacteristic(this.Characteristic.On);

    power.on('get', (callback) => {
      callback(null, this.power);
      this.log('DEBUG: POWER ON GET, %s.', this.power);
    });
    power.on('set', (value, callback) => {
      this.setPower(value, callback);
      this.log('DEBUG: POWER ON SET, %s.', value);
    });

    this.updatePower();
  }

  setPower(value, callback) {
    this.log('Setting power to %s on blub \'%s\'', value ? 'ON' : 'OFF', this.name);
    this.power = value;

    // this.platform.gateway.operateLight(this.device, {
    //   onOff: this.power
    // })
    // .then(() => {
    //   if (callback)
    //     callback();
    // })
    // .catch((error) => {
    //   this.log(error);
    // });
  }

  updatePower() {
    // var light = this.device.lightList[0];
    var power = this.blub.getCharacteristic(this.Characteristic.On);

    // this.power = true; //light.onOff;
    // send 0xef0177 to ffd9 and read from ffd4

    this.log('Updating power to %s on lightbulb \'%s\'', this.power ? 'ON' : 'OFF', this.name);
    power.updateValue(this.power);
  }

  enableBrightness() {
    var brightness = this.bulb.addCharacteristic(this.Characteristic.Brightness);

    brightness.on('get', (callback) => {
      callback(null, this.brightness);
      this.log('DEBUG: BRIGHTNESS ON GET, %s.', this.brightness);
    });

    brightness.on('set', (value, callback) => {
      this.setBrightness(value, callback);
      this.log('DEBUG: BRIGHTNESS ON SET, %s.', value);
    });

    this.updateBrightness();
  }

  setBrightness(value, callback) {
    this.log('Setting brightness to %s on lightbulb \'%s\'', value, this.name);
    this.brightness = value;

    // this.platform.gateway.operateLight(this.device, {
    //   dimmer: this.brightness
    // })
    // .then(() => {
    //   if (callback)
    //     callback();
    // });
  }

  updateBrightness() {
    // var light = this.device.lightList[0];
    var brightness = this.bulb.getCharacteristic(this.Characteristic.Brightness);

    // this.brightness =  // light.dimmer;

    this.log('Updating brightness to %s%% on lightbulb \'%s\'', this.brightness, this.name);
    brightness.updateValue(this.brightness);
  }
}

// function bleLED(log, config, api) {
//   this.log = log;
//   this.config = config;
//   this.homebridge = api;

//   // if (this.config.defaultVolume)
//   //     this.defaultVolume = this.config.defaultVolume;
//   // else
//   //     this.defaultVolume = 10;

//   // this.log('Volume accessory is Created!');
//   // this.log('defaultVolume is ' + this.defaultVolume);

//   this.bulb = new Service.Lightbulb(this.config.name);

  
//   this.log('all event handler was setup.')
// };

// bleLED.prototype = {
//   getServices: function() {
//     if (!this.bulb) return [];
//     this.log('Homekit asked to report service');
//     const infoService = new Service.AccessoryInformation();
//     infoService.setCharacteristic(Characteristic.Manufacturer,'Triones')
//     return [infoService, this.bulb];
//   },

//   connectBLE: function() {

//   },

//   getPower: function(callback) {
//     this.log('getPower');

//     // read speaker volume info
//     let req = http.get('http://localhost:5000/volume', res => {
//       let recv_data = '';
//       res.on('data', chunk => { recv_data += chunk});
//       res.on('end', () => {
//         // recv_data contains volume info.
//         let vol = JSON.parse(recv_data).volume; // vol = [0,100]
//         this.log('Read from Sonos; volume: ' + vol);
//         this.vol = vol;

//         callback(null, this.vol > 0);
//       });
//     });
//     req.on('error', err => {
//       this.log("Error in getPower: "+ err.message);
//       callback(err);
//     });
//   },
