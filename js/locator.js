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

    var locator = new esri.tasks.Locator(locatorSettings.LocatorURL);
    var searchFieldName = locatorSettings.LocatorParameters.SearchField;
    var addressField = {};
    addressField[searchFieldName] = dojo.dom.byId('txtAddress').value;

    var options = {};
    options["address"] = addressField;
    options["outFields"] = locatorSettings.LocatorOutFields;
    options[locatorSettings.LocatorParameters.SearchBoundaryField] = baseMapExtent;
    locator.outSpatialReference = map.spatialReference;
    locator.addressToLocations(options);
    locator.on("address-to-locations-complete", function (candidates) {
        // Discard searches made obsolete by new typing from user
        if (thisSearchTime < lastSearchTime) {
            return;
        }
        ShowLocatedAddress(candidates.addresses);
    }, function () {
        dojo.dom.byId("imgSearchLoader").style.display = "none";
        LoctorErrBack("locatorService");
    });
}

//Populate candidate address list in address container
function ShowLocatedAddress(candidates) {
    RemoveChildren(dojo.dom.byId('tblAddressResults'));
    CreateScrollbar(dojo.dom.byId("divAddressScrollContainer"), dojo.dom.byId("divAddressScrollContent"));

    if (candidates.length > 0) {
        var tblAddressResults = dojo.dom.byId("tblAddressResults");
        var tBodyAddressResults = document.createElement("tbody");
        tblAddressResults.appendChild(tBodyAddressResults);
        tblAddressResults.cellSpacing = 0;
        tblAddressResults.cellPadding = 0;

        //Filter and display valid address results according to locator settings in configuration file
        var counter = 0;
        var validResult = true;
        var searchFields = [];
        var addressFieldName = locatorSettings.AddressSearch.FilterFieldName;
        var addressFieldValues = locatorSettings.AddressSearch.FilterFieldValues;
        var placeFieldName = locatorSettings.PlaceNameSearch.FilterFieldName;
        var placeFieldValues = locatorSettings.PlaceNameSearch.FilterFieldValues;
        for (var s in addressFieldValues) {
            searchFields.push(addressFieldValues[s]);
        }
        searchFields.push(locatorSettings.PlaceNameSearch.LocatorFieldValue);
        for (var i in candidates) {
            if (candidates[i].attributes[locatorSettings.AddressMatchScore.Field] > locatorSettings.AddressMatchScore.Value) {
                var locatePoint = new esri.geometry.Point(Number(candidates[i].location.x), Number(candidates[i].location.y), map.spatialReference);
                for (var j in searchFields) {
                    if (candidates[i].attributes[addressFieldName] == searchFields[j]) {
                        if (candidates[i].attributes[addressFieldName] == locatorSettings.PlaceNameSearch.LocatorFieldValue) {
                            for (var placeField in placeFieldValues) {
                                if (candidates[i].attributes[placeFieldName] != placeFieldValues[placeField]) {
                                    validResult = false;
                                }
                                else {
                                    validResult = true;
                                    break;
                                }
                            }
                        }
                        else {
                            validResult = true;
                        }
                        if (validResult) {
                            counter++;
                            var candidate = candidates[i];
                            var trData = document.createElement("tr");
                            tBodyAddressResults.appendChild(trData);
                            var tdData = document.createElement("td");
                            tdData.innerHTML = dojo.string.substitute(locatorSettings.DisplayField, candidate.attributes);
                            tdData.align = "left";
                            tdData.style.borderBottom = "black 1px solid";

                            if (counter % 2 != 0) {
                                tdData.className = "bottomborder listLightColor";
                            } else {
                                tdData.className = "bottomborder listDarkColor";
                            }
                            tdData.style.cursor = "pointer";
                            tdData.setAttribute("x", candidate.location.x);
                            tdData.setAttribute("y", candidate.location.y);
                            tdData.setAttribute("address", dojo.string.substitute(locatorSettings.DisplayField, candidate.attributes));
                            if (candidate.attributes[addressFieldName] == locatorSettings.PlaceNameSearch.LocatorFieldValue) {
                                for (var field in locatorSettings.PlaceNameSearch.FilterFieldValues) {
                                    if (candidate.attributes[placeFieldName] == placeFieldValues[field]) {
                                        var ext = { xmin: candidate.attributes.xmin, ymin: candidate.attributes.ymin, xmax: candidate.attributes.xmax, ymax: candidate.attributes.ymax };
                                        tdData.setAttribute("county", dojo.toJson(ext));
                                        break;
                                    }
                                    else {
                                        tdData.setAttribute("county", "");
                                    }
                                }
                            }
                            else {
                                tdData.setAttribute("county", "");
                            }
                            tdData.onclick = function () {
                                dojo.dom.byId("txtAddress").value = this.innerHTML;
                                lastSearchString = dojo.dom.byId("txtAddress").value.trim();
                                dojo.dom.byId('txtAddress').setAttribute("defaultAddress", this.innerHTML);
                                mapPoint = new esri.geometry.Point(Number(this.getAttribute("x")), Number(this.getAttribute("y")), map.spatialReference);
                                dojo.dom.byId("txtAddress").setAttribute("defaultAddressTitle", this.innerHTML);
                                LocateGraphicOnMap(this);
                                dojo.dom.byId("imgGeolocation").src = "images/imgGeolocation.png";
                            }
                            trData.appendChild(tdData);
                        }
                    }
                }
            }
        }
        //Display error message if there are no valid candidate addresses
        if (counter == 0) {
            var trData = document.createElement("tr");
            tBodyAddressResults.appendChild(trData);
            var tdData = document.createElement("td");
            tdData.innerHTML = messages.getElementsByTagName("noSearchResults")[0].childNodes[0].nodeValue;
            trData.appendChild(tdData);
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

function CreateExtentForCounty(ext) {
    var projExtent;
    projExtent = new esri.geometry.Extent({
        "xmin": parseFloat(ext.xmin),
        "ymin": parseFloat(ext.ymin),
        "xmax": parseFloat(ext.xmax),
        "ymax": parseFloat(ext.ymax),
        "spatialReference": {
            "wkid": 4326
        }
    });
    return projExtent;
}

//This function is called when locator service fails or does not return any data
function LoctorErrBack(val) {
    var tblAddressResults = dojo.dom.byId("tblAddressResults");
    var tBodyAddressResults = document.createElement("tbody");
    tblAddressResults.appendChild(tBodyAddressResults);
    tblAddressResults.cellSpacing = 0;
    tblAddressResults.cellPadding = 0;

    var trData = document.createElement("tr");
    tBodyAddressResults.appendChild(trData);
    var tdData = document.createElement("td");
    tdData.innerHTML = messages.getElementsByTagName(val)[0].childNodes[0].nodeValue;
    trData.appendChild(tdData);
}

//Locate searched address on map with pushpin graphic
function LocateGraphicOnMap(evt) {
    HideContainer("locate");
    HideContainer("bookmark");
    if (evt) {
        if (evt.getAttribute("county")) {
            var countyExtent = CreateExtentForCounty(dojo.fromJson(evt.getAttribute("county")));
            geometryService.project([countyExtent], map.spatialReference, function (results) {
                if (results.length) {
                    var extent = new esri.geometry.Extent(parseFloat(results[0].xmin), parseFloat(results[0].ymin), parseFloat(results[0].xmax), parseFloat(results[0].ymax), map.spatialReference);
                    CreateGraphicforLocation(extent);
                }
            });
        } else {
            setTimeout(function () {
                CreateGraphicforLocation(null);
            }, 1000);
        }
    }
    else {
        setTimeout(function () {
            CreateGraphicforLocation(null);
        }, 1000);
    }

}

function CreateGraphicforLocation(extent) {
    if (!tempMap) {
        map.infoWindow.hide();
        if (!extent) {
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
        if (!extent) {
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
