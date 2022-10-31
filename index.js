var Service;
var Characteristic;
var HomebridgeAPI;
var noble = require('@abandonware/noble');
var rgbConversion = require('./rgbConversion');

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    HomebridgeAPI = homebridge;

    homebridge.registerAccessory('homebridge-heppylighting-ble-led', 'heppylighting-ble-led', MagicBlueBulb);
};

function MagicBlueBulb(log, config) {
    this.log = log;
    this.name = config.name;
    this.ledsStatus = {
        on: true,
        values: rgbConversion.rgbToHsl(255, 255, 255),
    };
    this.mac = config.mac.toLowerCase();
    this.connected = false;
    this.handle = config.handle || 0x000c; // v9 is 0x000b
    this.statusHandle = config.statusHandle || 0; // status feedback handle
    this.monoPort = config.monoPort.toUpperCase() || 'color'; // monochrome port or <false> RGB
    this.monoMode = config.monoPort != 'color';

    this.findBulb(this.mac);

    // info service
    this.informationService = new Service.AccessoryInformation();

    this.informationService
        .setCharacteristic(Characteristic.Manufacturer, config.manufacturer || 'Light')
        .setCharacteristic(Characteristic.Model, config.model || 'Magic Blue')
        .setCharacteristic(Characteristic.SerialNumber, config.serial || '5D4989E80E44');

    this.service = new Service.Lightbulb(this.name);

    this.service.getCharacteristic(Characteristic.On).on('get', this.getState.bind(this));
    this.service.getCharacteristic(Characteristic.On).on('set', this.setState.bind(this));

    this.service.getCharacteristic(Characteristic.Brightness).on('get', this.getBright.bind(this));
    this.service.getCharacteristic(Characteristic.Brightness).on('set', this.setBright.bind(this));

    if (this.monoPort == 'color') {
        this.service.getCharacteristic(Characteristic.Hue).on('get', this.getHue.bind(this));
        this.service.getCharacteristic(Characteristic.Hue).on('set', this.setHue.bind(this));

        this.service.getCharacteristic(Characteristic.Saturation).on('get', this.getSat.bind(this));
        this.service.getCharacteristic(Characteristic.Saturation).on('set', this.setSat.bind(this));
    };
}

MagicBlueBulb.prototype.findBulb = function (mac, callback) {
    var that = this;
    noble.on('stateChange', function (state) {
        if (state === 'poweredOn') {
            noble.startScanning();
            that.log('Scanning for LED.');
        } else {
            noble.stopScanning();
        }
    });

    noble.on('discover', function (peripheral) {
        this.log(peripheral.address);
        if (peripheral.id === mac || peripheral.address === mac) {
            that.log('Found my LED, mac: %s.', mac);
            that.log('LED is at %s mode at port %s.', that.monoMode ? 'monochrome' : 'color', that.monoPort);
            this.peripheral = peripheral;
        }
    });
};

MagicBlueBulb.prototype.writeColor = function (callback) {
    var that = this;
    var temp = function (res) {
        if (!res) {
            //callback(new Error());
            return;
        }
        if (that.monoPort == 'color') {
            this.hue = that.ledsStatus.values[0];
            this.saturation = that.ledsStatus.values[1];
        } else if (that.monoPort == 'R') {
            this.hue = 0;
            this.saturation = 100;
        } else if (that.monoPort == 'G') {
            this.hue = 120;
            this.saturation = 100;
        } else if (that.monoPort == 'B') {
            this.hue = 240;
            this.saturation = 100;
        };
        var rgb = rgbConversion.hslToRgb(
            // that.ledsStatus.values[0],
            // that.ledsStatus.values[1],
            this.hue,
            this.saturation,
            that.ledsStatus.values[2],
        );
        console.log('rgb',rgb);
        that.peripheral.writeHandle(
            that.handle,
            new Buffer.from([0x56, rgb.r, rgb.g, rgb.b, 0x00, 0xf0, 0xaa]),
            true,
            function (error) {
                if (error) console.log('BLE: Write handle Error: ' + error);
                callback();
            },
        );
    };
    this.attemptConnect(temp);
};

MagicBlueBulb.prototype.attemptConnect = function (callback) {
    if (this.peripheral && this.peripheral.state == 'connected') {
        callback(true);
        noble.stopScanning();
    } else if (this.peripheral && this.peripheral.state == 'disconnected') {
        noble.startScanningAsync();;
        this.log('Lost connection to LED. Attempting reconnect...');
        this.peripheral.connect(function (error) {
            if (!error) {
                this.log('Reconnection successful.');
                callback(true);
            } else {
                this.log('Reconnection failed.');
                callback(false);
            }
        });
    }
};

MagicBlueBulb.prototype.setState = function (status, callback) {
    this.log('Setting status to \'%s\'.', status ? 'ON' : 'OFF');
    var code = 0x24,
        that = this;
    if (status) {
        code = 0x23;
    }
    var temp = function (res) {
        if (!that.peripheral || !res) {
            callback(new Error());
            return;
        }
        that.peripheral.writeHandle(that.handle, new Buffer.from([0xcc, code, 0x33]), true, function (error) {
            if (error) that.log('BLE: Write handle Error: ' + error);
            callback();
        });
    };
    this.attemptConnect(temp);
    this.ledsStatus.on = status;
};

MagicBlueBulb.prototype.getState = function (callback) {
    if (this.statusHandle != 0x0000) {
        this.log ('Listening to status return as statusHandle is \'%s\'.', this.statusHandle);
        // var that = this;
        // var getter = new Buffer.from ([0xef, 0x01, 0x77]);
        // that.log('Firing %s to handle %s', getter, that.statusHandle)
        // that.peripheral.writeHandle(
        //     that.statusHandle,
        //     getter,
        //     true,
        //     function (error) {
        //         if (error) console.log('BLE: Write handle Error: ' + error);
        //         callback();
        //     },
        // ).then(() => {
        //     that.log('Getting status from handle', that.handle)
        //     that.peripheral.readHandle(
        //         that.handle,
        //         async (error,data) => {
        //             if (error) console.log('BLE: Write handle Error: ' + error);
        //             this.statusData = data;
        //             that.log('Returned data from', that.handle, 'is', data);
        //         }
        //     )
        // })
    } else {
        callback(null, this.ledsStatus.on);
        this.log('Getting default status as \'ON\', as statusHandle is \'%s\'.', this.statusHandle);
    }
};

MagicBlueBulb.prototype.getHue = function (callback) {
    callback(null, this.ledsStatus.values[0]);
};

MagicBlueBulb.prototype.setHue = function (level, callback) {
    this.log('Setting hue to %s deg.', level);
    this.ledsStatus.values[0] = level;
    if (this.ledsStatus.on) {
        this.writeColor(function () {
            callback();
        });
    } else {
        callback();
    }
};

MagicBlueBulb.prototype.getSat = function (callback) {
    callback(null, this.ledsStatus.values[1]);
};

MagicBlueBulb.prototype.setSat = function (level, callback) {
    this.log('Setting saturation to %s%.', level);
    this.ledsStatus.values[1] = level;
    if (this.ledsStatus.on) {
        this.writeColor(function () {
            callback();
        });
    } else {
        callback();
    }
};

MagicBlueBulb.prototype.getBright = function (callback) {
    callback(null, this.ledsStatus.values[2]);
};

MagicBlueBulb.prototype.setBright = function (level, callback) {
    this.log('Setting brightness level to %s%.', level);
    this.ledsStatus.values[2] = level;
    if (this.ledsStatus.on) {
        this.writeColor(function () {
            callback();
        });
    } else {
        callback();
    }
};

MagicBlueBulb.prototype.getServices = function () {
    return [this.informationService, this.service];
};