/* Wind & Wetter Beispiel */

// Innsbruck, Objekt lat, lon von innsbruck
let ibk = {
    lat: 47.267222,
    lng: 11.392778
};

// Karte initialisieren
let map = L.map("map", {
    fullscreenControl: true
}).setView([ibk.lat, ibk.lng], 5);

// thematische Layer
let themaLayer = {
    forecast: L.featureGroup().addTo(map),
    wind: L.featureGroup().addTo(map),
}

// Hintergrundlayer
let layerControl = L.control.layers({
    "Openstreetmap": L.tileLayer.provider("OpenStreetMap.Mapnik"),
    "Esri WorldTopoMap": L.tileLayer.provider("Esri.WorldTopoMap"),
    "Esri WorldImagery": L.tileLayer.provider("Esri.WorldImagery").addTo(map)
}, {
    "Wettervorhersage MET Norway": themaLayer.forecast,
    "ECMWF Windvorhersage": themaLayer.wind,
}).addTo(map);

// Maßstab
L.control.scale({
    imperial: false,
}).addTo(map);

// Wettervorhersage MET Norway
async function showForecast(url) {
    let response = await fetch(url);
    let jsondata = await response.json();

    // aktuelles Wetter und Wettervorhersage implementieren
    console.log(jsondata);
    L.geoJSON(jsondata, { //wir holen die Daten und machen ein geoJSON
        pointToLayer: function (feature, latlng) { // ich mach den Content um das wo zuerst hello world steht das dann drin steht
            let details = feature.properties.timeseries[0].data.instant.details; // wenn eckige Klammer im Original feature muss ich mit Index zugreifen ich mache eine Variable um auf die features zuzugreifen weil es so tief hinein geht und man das nicht immer schreiben will
            let time = new Date(feature.properties.timeseries[0].time); // das new Date mach ein echtes Datum aus einem Datumsstring --> mit echtem Datum kann ich rechnen, nur mir string nicht


            let content = ` 
            <h4>Wettervorhersage für ${time.toLocaleString()}</h4>
            <ul>
                <li>Luftdruck Meereshöhe (hPa): ${details.air_pressure_at_sea_level} </li>
                <li>Temperatur (°C): ${details.air_temperature}</li>
                <li>Bewölkungsgrad (%): ${details.cloud_area_fraction}</li>
                <li>Relative Luftfeuchte (%):  ${details.relative_humidity}</li>
                <li>Windrichtung (°): ${details.wind_from_direction}</li>
                <li>Windgeschwindigkeit (km/h): ${Math.round(details.wind_speed * 3.6)}</li>
            </ul>
            `;
            // Wettericons für die nächsten 24 Stunden in 3-Stunden Schritten
            for (let i = 0; i <= 24; i += 3) {
                let symbol = feature.properties.timeseries[i].data.next_1_hours.summary.symbol_code; //ich geh die ganzen Datensätze durch. von der stelle 0 bis 24. --> für die nächsten 24h Dann schreib ich [i] nach timeseries
                let time = new Date(feature.properties.timeseries[i].time); //Vorhersagezeit, auch in der For-Schleife
                content += `
                <img src="icons/${symbol}.svg" alt="${symbol}" style="width:30px" title="${time.toLocaleString()}"> 
                ` // mit title = .... habe wir wenn wir mit der Maus drüber fahren die Uhrzeit und das Datum für das jeweilige Wetter icon
            } // += heißt dann man was hinzufügt zu content mit nur = wird der content überschrieben

            //Link zum Datendownload
            content += `
            <p><a href="${url}" target = "met.no"> Daten downloaden</a></p>
            `

            L.popup(latlng, {
                content: content // das popup hat den content der variable content
            }).openOn(themaLayer.forecast);
        }
    }).addTo(themaLayer.forecast);
}
showForecast("https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=47.267222&lon=11.392778");

// es soll auf einen Klick auf die Karte reagiert werden
map.on("click", function (evt) {
    showForecast(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${evt.latlng.lat}&lon=${evt.latlng.lng}`);
});

//Klick auf Innsbruck simulieren --> bruachen wir eher nicht
map.fire("click", {
    latlng: ibk
});

// Windkarte
async function loadWind(url) {
    const response = await fetch(url);
    const jsondata = await response.json();
    console.log(jsondata);
    L.velocityLayer({
        data: jsondata
    }).addTo(themaLayer.wind);
}
loadWind("https://geographie.uibk.ac.at/data/ecmwf/data/wind-10u-10v-europe.json");

