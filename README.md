# Homebridge Triones LED Strip Homebridge Plugin

This plug-in enables you to control your Happy Lightning LED strip.

## New Version

Releases that start with version 1.x.x are based on the old code base. If you want to support this
project feel free to install version 2.x.x by running this command:

```shell
npm install -g homebridge-triones-led-strip@latest
```

This software is still in the alpha phase. Should you find any issues, please open up an
[issue](https://github.com/uhteddy/homebridge-triones-led-strip/issues/new) on
GitHub. Nevertheless, this new version should work as a drop-in replacement for the old version, so
your configuration does not require an update.

## Connecting and setting up

The light bulb uses Bluetooth low energy. This means that your Raspberry Pi needs to have Bluetooth
in some way. You will need to know the mac address of the light bulb. You can discover it by
installing bluez and everything to your Raspberry Pi. A possible guide can be found
[here](http://www.elinux.org/RPi_Bluetooth_LE). However, you don't need to compile it yourself.
I find the version in the repositories to be sufficient. You can then discover the mac address
by running the command shown below. The mac is "FB:00:E0:82:AA:1F" in this case.

```shell
	$ sudo hcitool lescan
	LE Scan ...
	22:20:7B:99:D3:AF (unknown)
	FB:00:E0:82:AA:1F Triones:FB00E082AA1F    <--- this is your light bulb
	22:20:7B:99:D3:AF (unknown)
```

### Acquiring handles

Handles are different for different type of bulbs. It is very important that you set the handle for the LED control to work properly
```shell
	$ gatttool -b FB:00:E0:82:AA:1F -I
```
(change ``FB:00:E0:82:AA:1F`` to your BLE device MAC address)

```shell
[98:9E:63:39:8B:ED][LE]> char-desc
handle: 0x0001, uuid: 00002800-0000-...
handle: 0x0002, uuid: 00002803-0000-...
handle: 0x0003, uuid: 00002a00-0000-...
handle: 0x0004, uuid: 00002800-0000-...
handle: 0x0005, uuid: 00002803-0000-...
handle: 0x0006, uuid: 0000ffda-0000-...
handle: 0x0007, uuid: 00002902-0000-...
handle: 0x0008, uuid: 00002803-0000-...
handle: 0x0009, uuid: 0000ffd9-0000-...  <--- this is the status feedback handle {statusHandle}
handle: 0x000a, uuid: 00002800-0000-...
handle: 0x000b, uuid: 00002803-0000-...
handle: 0x000c, uuid: 0000ffd4-0000-...  <--- this is the write handle {handle}
handle: 0x000d, uuid: 00002902-0000-...
handle: 0x000e, uuid: 00002803-0000-...
handle: 0x000f, uuid: 0000ffd1-0000-...
```

## Installation

Run the following command

```shell
npm install -g homebridge-triones-led-strip@latest
```

Chances are you are going to need sudo with that.

## Config.json file

```json
{
    "accessory": "triones-led-strip",
    "name": "MagicBlue",
    "mac": "FB:00:E0:82:AA:1F",
    "handle": 46
}
```

| Key       | Description                                                                                                                                                                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| accessory | Required. Has to be "magic-blue-bulb"                                                                                                                                                                                                                             |
| name      | Required. The name of this accessory. This will appear in your Homekit app                                                                                                                                                                                        |
| mac       | Required. The mac address that you discovered earlier                                                                                                                                                                                                             |
| handle    | Optional. The handle that is used by the bulb for setting on/off and colors. This basically works like a key and you are writing the value. Use 46 for the newer(?) version of the bulbs. The standard value for the older(?) version is integrated into the code |

## Issues

This software comes with no warranty. It works for me and it might for you.

## Credit

I used the codes that were discovered by the author of this [post](https://bene.tweakblogs.net/blog/12447/connect-a-bluetooth-lightbulb-to-philips-hue). His findings were also used in his [repository](https://github.com/b0tting/magicbluehue). If the author reads this, I did not find your name on your blog. You can send me a message and I'll gladly add your name.

Another thanks to Garry Tan for the conversion methods. See his post [here](http://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c).
