/** @license
 | Version 10.2
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
    var thisSearchTime = lastSearchTime = (new Date()).getTime();

    dojo.dom.byId("imgSearchLoader").style.display = "block";
    if (dojo.dom.byId("txtAddress").value.trim() == '') {
        dojo.dom.byId("imgSearchLoader").style.display = "none";
        RemoveChildren(dojo.dom.byId('tblAddressResults'));
        CreateScrollbar(dojo.dom.byId("divAddressScrollContainer"), dojo.dom.byId("divAddressScrollContent"));
        if (dojo.dom.byId("txtAddress").value != "") {
            alert(messages.getElementsByTagName("addressToLocate")[0].childNodes[0].nodeValue);
        }
        return;
    }

    var params = {};
    params["f"] = "json";
    params[locatorSettings.LocatorParamaters.SearchField] = dojo.dom.byId('txtAddress').value;
    params[locatorSettings.LocatorParamaters.SpatialReferenceField] = ((map.spatialReference.wkid) ? ("{wkid:" + map.spatialReference.wkid + "}") : ("{wkt:" + map.spatialReference.wkt + "}"));
    params[locatorSettings.LocatorParamaters.SearchResultField] = locatorSettings.CandidateFields;
    params[locatorSettings.LocatorParamaters.SearchCountField] = locatorSettings.MaxResults;
    params[locatorSettings.LocatorParamaters.SearchBoundaryField] = dojo.toJson(baseMapExtent);
    esri.request({
        url: locatorSettings.LocatorURL,
        content: params,
        callbackParamName: "callback",
        load: function (candidates) {
            // Discard searches made obsolete by new typing from user
            if (thisSearchTime < lastSearchTime) {
                return;
            }
            ShowLocatedAddress(candidates.locations);
        }, error: function (err) {
            dojo.dom.byId("imgSearchLoader").style.display = "none";
            LoctorErrBack("locatorService");
        }
    });
}

//Populate candidate address list in address container
function ShowLocatedAddress(candidates) {
    RemoveChildren(dojo.dom.byId('tblAddressResults'));
    CreateScrollbar(dojo.dom.byId("divAddressScrollContainer"), dojo.dom.byId("divAddressScrollContent"));

    if (candidates.length > 0) {
        var table = dojo.dom.byId("tblAddressResults");
        var tBody = document.createElement("tbody");
        table.appendChild(tBody);
        table.cellSpacing = 0;
        table.cellPadding = 0;

        //Filter and display valid address results according to locator settings in configuration file
        var counter = 0;
        var validResult = true;
        var searchFields = [];
        for (var s in locatorSettings.LocatorFieldValues) {
            searchFields.push(locatorSettings.LocatorFieldValues[s]);
        }

        searchFields.push(locatorSettings.CountyFields.LocatorFieldValue);
        for (var i in candidates) {
            if (candidates[i].feature.attributes[locatorSettings.AddressMatchScore.Field] > locatorSettings.AddressMatchScore.Value) {
                var locatePoint = new esri.geometry.Point(Number(candidates[i].feature.geometry.x), Number(candidates[i].feature.geometry.y), map.spatialReference);
                for (var j in searchFields) {
                    if (candidates[i].feature.attributes[locatorSettings.LocatorFieldName] == searchFields[j]) {
                        if (candidates[i].feature.attributes[locatorSettings.LocatorFieldName] == locatorSettings.CountyFields.LocatorFieldValue) {
                            if (candidates[i].feature.attributes[locatorSettings.CountyFields.FieldName] != locatorSettings.CountyFields.Value) {
                                validResult = false;
                            }
                            else {
                                validResult = true;
                            }
                        }
                        else {
                            validResult = true;
                        }
                        if (validResult) {
                            counter++;
                            var candidate = candidates[i];
                            var tr = document.createElement("tr");
                            tBody.appendChild(tr);
                            var td1 = document.createElement("td");
                            td1.innerHTML = dojo.string.substitute(locatorSettings.DisplayField, candidate.feature.attributes);
                            td1.align = "left";
                            td1.style.borderBottom = "black 1px solid";

                            if (counter % 2 != 0) {
                                td1.className = "bottomborder listLightColor";
                            } else {
                                td1.className = "bottomborder listDarkColor";
                            }
                            td1.style.cursor = "pointer";
                            td1.setAttribute("x", candidate.feature.geometry.x);
                            td1.setAttribute("y", candidate.feature.geometry.y);
                            td1.setAttribute("address", dojo.string.substitute(locatorSettings.DisplayField, candidate.feature.attributes));
                            if (candidate.feature.attributes[locatorSettings.CountyFields.FieldName] == locatorSettings.CountyFields.Value) {
                                td1.setAttribute("county", dojo.toJson(candidate.extent));
                            }
                            else {
                                td1.setAttribute("county", "");
                            }
                            td1.onclick = function () {
                                dojo.dom.byId("txtAddress").value = this.innerHTML;
                                lastSearchString = dojo.dom.byId("txtAddress").value.trim();
                                dojo.dom.byId('txtAddress').setAttribute("defaultAddress", this.innerHTML);
                                mapPoint = new esri.geometry.Point(Number(this.getAttribute("x")), Number(this.getAttribute("y")), map.spatialReference);
                                dojo.dom.byId("txtAddress").setAttribute("defaultAddressTitle", this.innerHTML);
                                LocateGraphicOnMap(this);
                                dojo.dom.byId("imgGeolocation").src = "images/imgGeolocation.png";
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
            dojo.dom.byId("imgSearchLoader").style.display = "none";
            return;
        }
        dojo.dom.byId("imgSearchLoader").style.display = "none";
        SetAddressResultsHeight();
    } else {
        dojo.dom.byId("imgSearchLoader").style.display = "none";
        LoctorErrBack("noSearchResults");
    }
}

//This function is called when locator service fails or does not return any data
function LoctorErrBack(val) {
    var table = dojo.dom.byId("tblAddressResults");
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
function LocateGraphicOnMap(evt) {
    HideContainer("locate");
    setTimeout(function () {
        if (evt) {
            if (evt.getAttribute("county")) {
                var countyExtent = dojo.fromJson(evt.getAttribute("county"));
                var extent = new esri.geometry.Extent(parseFloat(countyExtent.xmin), parseFloat(countyExtent.ymin), parseFloat(countyExtent.xmax), parseFloat(countyExtent.ymax), map.spatialReference);
            }
        }
        if (!tempMap) {
            map.infoWindow.hide();
            if (!countyExtent) {
                map.centerAndZoom(mapPoint, locatorSettings.ZoomLevel);
            }
            else {
                map.setExtent(extent.expand(1.75));
            }
            if (map.getLayer(tempGraphicsLayerId)) {
                map.getLayer(tempGraphicsLayerId).clear();
            }
        }
        else {
            tempMap.infoWindow.hide();
            if (!countyExtent) {
                tempMap.centerAndZoom(mapPoint, locatorSettings.ZoomLevel);
            }
            else {
                tempMap.setExtent(extent.expand(1.75));
            }
            if (tempMap.getLayer(temporaryGraphicsLayerId)) {
                tempMap.getLayer(temporaryGraphicsLayerId).clear();
            }
        }

        var symbol = new esri.symbol.PictureMarkerSymbol(locatorSettings.DefaultLocatorSymbol, locatorSettings.MarkupSymbolSize.width, locatorSettings.MarkupSymbolSize.height);
        var graphic = new esri.Graphic(mapPoint, symbol, null, null);
        var features = [];
        features.push(graphic);
        var featureSet = new esri.tasks.FeatureSet();
        featureSet.features = features;
        var layer = (!tempMap) ? map.getLayer(tempGraphicsLayerId) : tempMap.getLayer(temporaryGraphicsLayerId);
        layer.add(featureSet.features[0]);
        HideProgressIndicator();
    }, 1000);
}

//Display the current location of the user
function ShowMyLocation() {
    var cTimeout = 8000 /* ms */, cBackupTimeout = 16000 /* ms */;

    var backupTimeoutTimer = setTimeout(function () {
        alert(messages.getElementsByTagName("geolocationTimeout")[0].childNodes[0].nodeValue);
    }, cBackupTimeout)

    navigator.geolocation.getCurrentPosition(
    function (position) {
        clearTimeout(backupTimeoutTimer);
        dojo.dom.byId("imgGeolocation").src = "images/imgGeolocation_hover.png";
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
                if (!tempMap) {
                    map.infoWindow.hide();
                    map.getLayer(tempGraphicsLayerId).clear();
                }
                else {
                    tempMap.infoWindow.hide();
                    tempMap.getLayer(temporaryGraphicsLayerId).clear();
                }
                mapPoint = null;
                HideProgressIndicator();
                alert(messages.getElementsByTagName("geoLocation")[0].childNodes[0].nodeValue);
                return;
            }
            LocateGraphicOnMap(false);
            HideProgressIndicator();
        });
    },
    function (error) {
        clearTimeout(backupTimeoutTimer);
        dojo.dom.byId("imgGeolocation").src = "images/imgGeolocation.png";
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
        timeout: cTimeout
    });
}
