var fs = require('fs')
var fst = require('fs-tail-stream');
var Alpine = require('alpine');
var es = require('event-stream');
var geoip = require('geoip-lite');
var _ = require('lodash');
var apacheConfig = require("../apache.json")
var isoCountries = require("./isoCountries.js");
var alpine = new Alpine(apacheConfig.log_format);

function addNum(data, obj, value, subObj) {
    if (subObj){
        dataPtr=data;
        data=data[subObj];
    }
    if (typeof data === "undefined")
        data={};
    if (typeof data[obj] === "undefined")
        data[obj]={};
    if (typeof data[obj][value] === "number")
        data[obj][value]++;
    else
        data[obj][value] = 1;
    if (subObj)
        dataPtr[subObj] = data;
}

function ParseApacheLog() {
    // IP log is private to this class and is only used to check for duplicates
    // and check geo!
    var ips = {};
    var thisPal = this;

    // Use a debounce function here to batch request burst into one
    // This way we dont overload callback
    var deb = _.debounce(() => { thisPal.callback(thisPal.data) }, 250, { 'maxWait': 1000 });
    this.data = {
        total: 0,
        channels: {},
        devices: {},
        countries: {}
    }
    this.deviceData = {}
    this.channelData = {}
    this.countryData = {}
    this.stream = fst.createReadStream(apacheConfig.access_log, {
        encoding: "utf8",
        tail: true
    }).pipe(es.split()).on('data', function(line) {
        try {
            var data = alpine.parseLine(line)
            if (!data["RequestHeader User-Agent"].startsWith("Ubuntu System Image Upgrade Client"))
                return;
            var deviceInfo = {};
            data["RequestHeader User-Agent"].split(":")[1].replace(" ", "").split(";").forEach((i) => {
                var sp = i.split("=")
                deviceInfo[sp[0]] = sp[1];
            });
            if(!thisPal.data.startDate)
                thisPal.data.startDate = data.time
            deviceInfo.channel = deviceInfo.channel.replace("ubuntu-touch/", "")

            if (ips[data.remoteIP]){
                if (ips[data.remoteIP].device === deviceInfo.device &&
                ips[data.remoteIP].channel === deviceInfo.channel)
                return;
            }
            // From this point we know this is a new device or new channel
            ips[data.remoteIP] = deviceInfo;

            // Get geo from ip
            var geo = isoCountries(geoip.lookup(data.remoteIP).country || "N/A");

            // Add to general data
            thisPal.data.total++;
            addNum(thisPal.data, "channels", deviceInfo.channel);
            addNum(thisPal.data, "devices", deviceInfo.device);
            addNum(thisPal.data, "countries", geo);

            // Add to device data
            addNum(thisPal.deviceData, "channels", deviceInfo.channel, deviceInfo.device);
            addNum(thisPal.deviceData, "countries", geo, deviceInfo.device);

            // Add to channel data
            addNum(thisPal.channelData, "devices", deviceInfo.device, deviceInfo.channel);
            addNum(thisPal.channelData, "countries", geo, deviceInfo.channel);

            // Add to countries data
            addNum(thisPal.countryData, "channels", deviceInfo.channel, geo);
            addNum(thisPal.countryData, "devices", deviceInfo.device, geo);

            // Check if callback exists, if true call it
            if (typeof thisPal.callback === "function")
                deb();

        } catch (e) {
            console.log(e)
        }
    });
}

ParseApacheLog.prototype.attachCallback = function(callback) {
    this.callback = callback;
};

ParseApacheLog.prototype.getData = function() {
    return this.data;
}

ParseApacheLog.prototype.getDeviceData = function(device) {
    return (typeof this.deviceData[device] !== "undefined") ? this.deviceData[device]: false;
}

ParseApacheLog.prototype.getChannelData = function(channel) {
    return (typeof this.channelData[channel] !== "undefined") ? this.channelData[channel] : false;
}

ParseApacheLog.prototype.getCountriesData = function(country) {
    return (typeof this.countryData[country] !== "undefined") ? this.countryData[country] : false;
}

ParseApacheLog.prototype.close = function() {
    this.stream.close();
};

module.exports = ParseApacheLog;
