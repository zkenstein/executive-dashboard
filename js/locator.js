/** @license
 | Version 10.1.1
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

//function to locate address
function LocateAddress() {
    ShowProgressIndicator();
    if (dojo.byId("txtAddress").value.trim() == '') {
        HideProgressIndicator();
        alert(messages.getElementsByTagName("addressToLocate")[0].childNodes[0].nodeValue);
        ValidateAddressControl();
        return;
    }
    var address = [];
    address[locatorFields[0]] = dojo.byId('txtAddress').value;

    var locator1 = new esri.tasks.Locator(locatorURL);
    locator1.outSpatialReference = map.spatialReference;
    locator1.addressToLocations(address, ["Loc_name"], function (candidates) {
        ShowLocatedAddress(candidates);
    },

    function (err) {
        HideProgressIndicator();
        ValidateAddressControl();
        alert(messages.getElementsByTagName("unableToLocate")[0].childNodes[0].nodeValue);
    });
}

function ValidateAddressControl() {
    dojo.byId('txtAddress').value = "";
    dojo.byId('txtAddress').focus();
}

//function to populate address
function ShowLocatedAddress(candidates) {
    RemoveChildren(dojo.byId('tblAddressResults'));
    CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));

    if (candidates.length > 0) {
        if (candidates[0].score == 100) {
            HideProgressIndicator();
            dojo.byId('txtAddress').setAttribute("defaultAddress", candidates[0].address);
            mapPoint = new esri.geometry.Point(candidates[0].location.x, candidates[0].location.y, map.spatialReference);
            LocateAddressOnMap();
            dojo.byId("imgGeolocation").src = "images/imgGeolocation.png";
        } else {
            var table = dojo.byId("tblAddressResults");
            var tBody = document.createElement("tbody");
            table.appendChild(tBody);
            table.cellSpacing = 0;
            table.cellPadding = 0;
            for (var i = 0; i < candidates.length; i++) {
                var candidate = candidates[i];
                var tr = document.createElement("tr");
                tBody.appendChild(tr);
                var td1 = document.createElement("td");
                td1.innerHTML = candidate.address;
                td1.align = "left";
                td1.style.borderBottom = "black 1px solid";
                td1.className = 'bottomborder';
                if (i % 2 != 0) {
                    td1.className = "listDarkColor";
                } else {
                    td1.className = "listLightColor";
                }
                td1.style.cursor = "pointer";
                td1.setAttribute("x", candidate.location.x);
                td1.setAttribute("y", candidate.location.y);
                td1.setAttribute("address", candidate.address);
                td1.onclick = function () {
                    dojo.byId("txtAddress").value = this.innerHTML;
                    dojo.byId('txtAddress').setAttribute("defaultAddress", this.innerHTML);
                    mapPoint = new esri.geometry.Point(this.getAttribute("x"), this.getAttribute("y"), map.spatialReference);
                    LocateAddressOnMap();
                    dojo.byId("imgGeolocation").src = "images/imgGeolocation.png";
                }
                tr.appendChild(td1);
            }
            HideProgressIndicator();
            SetAddressResultsHeight();
        }
    } else {
        HideProgressIndicator();
        dojo.byId('txtAddress').focus();
        alert(messages.getElementsByTagName("unableToLocate")[0].childNodes[0].nodeValue);
    }
}

//function to locate graphic on map fro searched address
function LocateAddressOnMap() {
    var graphicCollection = new esri.geometry.Multipoint(map.spatialReference);
    graphicCollection.addPoint(mapPoint);
    geometryService.project([graphicCollection], map.spatialReference, function (newPointCollection) {
        mapPoint = newPointCollection[0].getPoint(0);
        map.centerAndZoom(mapPoint, zoomLevel);
        if (map.getLayer(tempGraphicsLayerId)) {
            map.getLayer(tempGraphicsLayerId).clear();
        }

        var pushpinSize = ((isBrowser) ? 30 : 44);

        var symbol = new esri.symbol.PictureMarkerSymbol(locatorMarkupSymbolPath, pushpinSize, pushpinSize);
        var graphic = new esri.Graphic(mapPoint, symbol, null, null);
        var features = [];
        features.push(graphic);
        var featureSet = new esri.tasks.FeatureSet();
        featureSet.features = features;
        var layer = map.getLayer(tempGraphicsLayerId);
        layer.add(featureSet.features[0]);
        HideProgressIndicator();
    });
    HideContainer("locate");
}

//function for displaying the current location of the user
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
            LocateAddressOnMap();
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