var apiv1 = "/api/v1/"
var socket = io();

google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(getAndDraw);

function drawChart(title, _data, elementId) {

    var data = google.visualization.arrayToDataTable(_data);

    var options = {
        title: title
    };

    var chart = new google.visualization.PieChart(document.getElementById(elementId));

    data.sort([{column: 1}])
    chart.draw(data, options);
}

function map(data, header) {
    var maped = $.map(data, function(value, index) {
        return [[index, value]];
    });
    maped.unshift(header)
    return maped;
}

function getAndDraw() {
    $.getJSON(apiv1 + "stats", function(data) {
        $("#total").text(data.total);
        $("#date").text(data.startDate.split(":")[0]);
        drawChart("Devices", map(data.devices, ["Devices", "Users"]), "devices")
        drawChart("Channels", map(data.channels, ["Channels", "Users"]), "channels")
        drawChart("Countries", map(data.countries, ["Countries", "Users"]), "countries")
    });
}

socket.on("updated_data", function(data) {
    $("#total").text(data.total);
    $("#date").text(data.startDate.split(":")[0]);
    drawChart("Devices", map(data.devices, ["Devices", "Users"]), "devices")
    drawChart("Channels", map(data.channels, ["Channels", "Users"]), "channels")
    drawChart("Countries", map(data.countries, ["Countries", "Users"]), "countries")
})
