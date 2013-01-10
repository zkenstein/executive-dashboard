/** @license
 | Version 10.1.2
 | Copyright 2012 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
var searchAddress;

//Get candidate address results for searched address
function LocateAddress() {
    dojo.byId("imgSearchLoader").style.display = "block";
    if (dojo.byId("txtAddress").value.trim() == '') {
        dojo.byId("imgSearchLoader").style.display = "none";
        RemoveChildren(dojo.byId('tblAddressResults'));
        CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));
        if (dojo.byId("txtAddress").value != "") {
            alert(messages.getElementsByTagName("addressToLocate")[0].childNodes[0].nodeValue);
        }
        return;
    }
    var address = [];
    address[locatorSettings.LocatorParamaters] = dojo.byId('txtAddress').value;

    var locator1 = new esri.tasks.Locator(locatorSettings.LocatorURL);
    locator1.outSpatialReference = map.spatialReference;
    locator1.addressToLocations(address, [locatorSettings.CandidateFields], function (candidates) {
        ShowLocatedAddress(candidates);
    },
    function (err) {
        dojo.byId("imgSearchLoader").style.display = "none";
    });
}

//Populate candidate address list in address container
function ShowLocatedAddress(candidates) {
    RemoveChildren(dojo.byId('tblAddressResults'));
    CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));

    if (candidates.length > 0) {
        var table = dojo.byId("tblAddressResults");
        var tBody = document.createElement("tbody");
        table.appendChild(tBody);
        table.cellSpacing = 0;
        table.cellPadding = 0;

        //Filter and display valid address results according to locator settings in configuration file
        var counter = 0;
        for (var i in candidates) {
            if (candidates[i].score > locatorSettings.AddressMatchScore) {
                if (baseMapExtent.contains(candidates[i].location)) {
                    for (j in locatorSettings.LocatorFieldValues) {
                        if (candidates[i].attributes[locatorSettings.LocatorFieldName] == locatorSettings.LocatorFieldValues[j]) {
                            counter++;
                            var candidate = candidates[i];
                            var tr = document.createElement("tr");
                            tBody.appendChild(tr);
                            var td1 = document.createElement("td");
                            td1.innerHTML = dojo.string.substitute(locatorSettings.DisplayField, candidate.attributes);
                            td1.align = "left";
                            td1.style.borderBottom = "black 1px solid";
                            if (i % 2 != 0) {
                                td1.className = "bottomborder listDarkColor";
                            } else {
                                td1.className = "bottomborder listLightColor";
                            }
                            td1.style.cursor = "pointer";
                            td1.setAttribute("x", candidate.location.x);
                            td1.setAttribute("y", candidate.location.y);
                            td1.setAttribute("address", dojo.string.substitute(locatorSettings.DisplayField, candidate.attributes));
                            td1.onclick = function () {
                                dojo.byId("txtAddress").value = this.innerHTML;
                                dojo.byId('txtAddress').setAttribute("defaultAddress", this.innerHTML);
                                mapPoint = new esri.geometry.Point(Number(this.getAttribute("x")), Number(this.getAttribute("y")), map.spatialReference);
                                dojo.byId("txtAddress").setAttribute("defaultAddressTitle", this.innerHTML);
                                LocateGraphicOnMap();
                                dojo.byId("imgGeolocation").src = "images/imgGeolocation.png";
                            }
                            tr.appendChild(td1);
                        }
                    }
                }
            }
        }
        //Display error message if there are no valid candidate addresses
        if (counter == 0) {
            var tr = document.createElement("tr");
            tBody.appendChild(tr);
            var td1 = document.createElement("td");
            td1.innerHTML = messages.getElementsByTagName("noSearchResults")[0].childNodes[0].nodeValue;
            tr.appendChild(td1);
            dojo.byId("imgSearchLoader").style.display = "none";
            return;
        }
        dojo.byId("imgSearchLoader").style.display = "none";
        SetAddressResultsHeight();
    } else {
        dojo.byId("imgSearchLoader").style.display = "none";
        LoctorErrBack("noSearchResults");
    }
}

//This function is called when locator service fails or does not return any data
function LoctorErrBack(val) {
    var table = dojo.byId("tblAddressResults");
    var tBody = document.createElement("tbody");
    table.appendChild(tBody);
    table.cellSpacing = 0;
    table.cellPadding = 0;

    var tr = document.createElement("tr");
    tBody.appendChild(tr);
    var td1 = document.createElement("td");
    td1.innerHTML = messages.getElementsByTagName(val)[0].childNodes[0].nodeValue;
    tr.appendChild(td1);
}

//Locate searched address on map with pushpin graphic
function LocateGraphicOnMap() {
    map.centerAndZoom(mapPoint, locatorSettings.ZoomLevel);
    if (map.getLayer(tempGraphicsLayerId)) {
        map.getLayer(tempGraphicsLayerId).clear();
    }

    var symbol = new esri.symbol.PictureMarkerSymbol(locatorSettings.DefaultLocatorSymbol, locatorSettings.MarkupSymbolSize.width, locatorSettings.MarkupSymbolSize.height);
    var graphic = new esri.Graphic(mapPoint, symbol, null, null);
    var features = [];
    features.push(graphic);
    var featureSet = new esri.tasks.FeatureSet();
    featureSet.features = features;
    var layer = map.getLayer(tempGraphicsLayerId);
    layer.add(featureSet.features[0]);
    HideProgressIndicator();
    HideContainer("locate");
}

//Display the current location of the user
function ShowMyLocation() {
    navigator.geolocation.getCurrentPosition(
    function (position) {
        dojo.byId("imgGeolocation").src = "images/imgGeolocation_hover.png";
        ShowProgressIndicator();
        mapPoint = new esri.geometry.Point(position.coords.longitude, position.coords.latitude, new esri.SpatialReference({
            wkid: 4326
        }));
        var graphicCollection = new esri.geometry.Multipoint(new esri.SpatialReference({
            wkid: 4326
        }));
        graphicCollection.addPoint(mapPoint);
        geometryService.project([graphicCollection], map.spatialReference, function (newPointCollection) {
            mapPoint = newPointCollection[0].getPoint(0);
            if (!(baseMapExtent.contains(mapPoint))) {
                map.infoWindow.hide();
                mapPoint = null;
                map.getLayer(tempGraphicsLayerId).clear();
                HideProgressIndicator();
                alert(messages.getElementsByTagName("geoLocation")[0].childNodes[0].nodeValue);
                return;
            }
            LocateGraphicOnMap();
            HideProgressIndicator();
        });
    },
    function (error) {
        dojo.byId("imgGeolocation").src = "images/imgGeolocation.png";
        HideProgressIndicator();
        switch (error.code) {
            case error.TIMEOUT:
                alert(messages.getElementsByTagName("geolocationTimeout")[0].childNodes[0].nodeValue);
                break;
            case error.POSITION_UNAVAILABLE:
                alert(messages.getElementsByTagName("geolocationPositionUnavailable")[0].childNodes[0].nodeValue);
                break;
            case error.PERMISSION_DENIED:
                alert(messages.getElementsByTagName("geolocationPermissionDenied")[0].childNodes[0].nodeValue);
                break;
            case error.UNKNOWN_ERROR:
                alert(messages.getElementsByTagName("geolocationUnKnownError")[0].childNodes[0].nodeValue);
                break;
        }
    }, {
        timeout: 10000
    });
}
