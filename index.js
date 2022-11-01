"use strict";
module.exports = (homebridge) => {
    const BLEAccessory = require("./src/accessory.js")(homebridge);

    homebridge.registerAccessory(
        'homebridge-happylighting-ble-led', 
        'happylighting-ble-led', 
        BLEAccessory
    );
};
