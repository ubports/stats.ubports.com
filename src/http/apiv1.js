var express = require("express");

function ApiV1(parseApacheLog) {
    thisApi = this;
    this.parseApacheLog = parseApacheLog;
    this.router = express.Router();

    this.router.get("/stats", function(req, res) {
        res.send(thisApi.parseApacheLog ? thisApi.parseApacheLog.getData() : "{}");
    });
    this.router.get("/stats/device/:device", function (req, res) {
        if (thisApi.parseApacheLog.getDeviceData(req.params.device))
            res.send(thisApi.parseApacheLog.getDeviceData(req.params.device));
        else
            res.sendStatus(404);
    });
    this.router.get("/stats/channel/:channel", function (req, res) {
        if (thisApi.parseApacheLog.getChannelData(req.params.channel))
            res.send(thisApi.parseApacheLog.getChannelData(req.params.channel));
        else
            res.sendStatus(404);
    });
    this.router.get("/stats/country/:country", function (req, res) {
        if (thisApi.parseApacheLog.getCountriesData(req.params.country))
            res.send(thisApi.parseApacheLog.getCountriesData(req.params.country));
        else
            res.sendStatus(404);
    });
}

ApiV1.prototype.getRouter = function () {
    return this.router;
};

module.exports = ApiV1;
