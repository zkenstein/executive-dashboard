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
var shareOnLoad = true; //flag set for shared link
var chart; // variable used to store created chart object for trends
var mapExtent;

//Create bottom panel for subject groups with respective images
function CreateBottomHeaders(arrSubjectGroups, groupdata, token, selectedLayer, bottomOffset) {
    RemoveChildren(dojo.dom.byId("trBottomHeaders"));
    RemoveChildren(dojo.dom.byId("trBottomTags"));
    RemoveChildren(dojo.dom.byId("tblMoreResults"));

    dojo.dom.byId("divMoreResultsContent").setAttribute("header", dojo.toJson(selectedLayer));
    dojo.dom.byId("divMoreResultsContent").setAttribute("groupdata", dojo.toJson(groupdata));
    dojo.dom.byId("divMoreResultsContent").setAttribute("token", dojo.toJson(token));
    var ord = 0;
    var lastMetric = 0;
    for (var col in arrSubjectGroups) {
        ord++;
    }
    var lay = 0;
    for (var col in arrSubjectGroups) {
        lay++;
        var tdBottomHeader = document.createElement("td");
        tdBottomHeader.style.width = "100px";
        tdBottomHeader.style.paddingRight = "2px";
        tdBottomHeader.style.paddingTop = ((isBrowser) ? 10 : 5) + "px";
        tdBottomHeader.id = "tdBottomHeader" + lay;

        var webId = "";
        var webTag = "";
        var webTitle = "";
        for (var t in arrSubjectGroups[col]) {
            webId += arrSubjectGroups[col][t].webMapId + ",";
            webTag += col + ",";
            webTitle += arrSubjectGroups[col][t].title + ",";
        }
        tdBottomHeader.align = "center";

        var imgHeader = document.createElement("img");
        imgHeader.className = "imgOptions";
        imgHeader.setAttribute("WebId", webId);
        imgHeader.setAttribute("WebTag", webTag);
        imgHeader.setAttribute("webTitle", webTitle);
        imgHeader.id = "imgBottomHeader" + col;
        imgHeader.setAttribute("con", "bottom");
        imgHeader.setAttribute("parentOrder", lay);
        tdBottomHeader.appendChild(imgHeader);
        for (var l = 0; l < layerImages.length; l++) {
            for (var k = 0; k < arrSubjectGroups[col].length; k++) {
                if (col.toLowerCase() == layerImages[l].Tag.toLowerCase()) {
                    imgHeader.src = layerImages[l].Images[0];
                    imgHeader.style.cursor = "pointer";
                    imgHeader.setAttribute("orgImage", layerImages[l].Images[0]);
                    imgHeader.setAttribute("selImage", layerImages[l].Images[1]);
                    if (layerImages[l].Tag.toLowerCase() == selectedLayer.toLowerCase()) {
                        imgHeader.src = layerImages[l].Images[1];
                        imgHeader.style.cursor = "default";
                    }
                    if (layerImages[l].isPodVisible) {
                        imgHeader.setAttribute("podVisible", true);
                    }
                    break;
                }
            }
        }

        imgHeader.onclick = function () {
            //Upon clicking/tapping on the subject group image; the data for selected subject group will be transferred to function PopulateEventDetails to create map page.
            if (this.style.cursor == "pointer") {
                ShowCompare(false);
                if (dojo['dom-geometry'].getMarginBox("divMoreContent").h > 0) {
                    dojo.dom.byId("imgMore").src = "images/more.png";
                    dojo['dom-class'].replace("divMoreContent", "hideContainerHeight", "showContainerHeight");
                    dojo.dom.byId('divMoreContent').style.height = '0px';
                }
                if (share != "") {
                    shareOnLoad = false;
                }
                var tag = this.getAttribute("WebTag");
                var webMapId = this.getAttribute("WebId").split(",");
                var webMapTitle = this.getAttribute("WebTitle").split(",");
                var visibility = this.getAttribute("podVisible");
                var mContainer = this.getAttribute("con");
                var pOrder = this.getAttribute("parentOrder");
                if (dojo.dom.byId("trMore" + this.getAttribute("parentOrder"))) {
                    var lOrder = dojo.dom.byId("trMore" + this.getAttribute("parentOrder")).getAttribute("btnMore");
                }

                dojo.dom.byId("tdEventName").innerHTML = tag.split(",")[0];
                for (var d in arrSubjectGroups) {
                    dojo.dom.byId("imgBottomHeader" + d).src = dojo.dom.byId("imgBottomHeader" + d).getAttribute("orgImage");
                    dojo.dom.byId("imgBottomHeader" + d).style.cursor = "pointer";
                }
                ShowProgressIndicator();
                this.src = this.getAttribute("selImage");
                this.style.cursor = "default";
                for (var e in map._layers) {
                    if (e.match("eventLayerId")) {
                        map.removeLayer(map._layers[e]);
                    }
                }
                map.destroy();

                var webInfo = [];
                var counter = 0;
                for (var id in webMapId) {
                    if (webMapId[id]) {
                        var mapDeferred = esri.arcgis.utils.createMap(webMapId[id], "map", {
                            mapOptions: {
                                slider: true
                            }
                        });
                        mapDeferred.addCallback(function (response) {
                            map = response.map;
                            map.destroy();
                            var webmapInfo = {};
                            webmapInfo.id = response.itemInfo.item.id;
                            webmapInfo.key = response.itemInfo.item.title;
                            webmapInfo.operationalLayers = response.itemInfo.itemData.operationalLayers;
                            webmapInfo.baseMap = response.itemInfo.itemData.baseMap.baseMapLayers;

                            counter++;
                            webInfo.push(webmapInfo);
                            if ((webMapId.length - 1) == counter) {

                                webInfo.sort(function (a, b) {
                                    var nameA = a.key.toLowerCase(), nameB = b.key.toLowerCase()
                                    if (nameA < nameB) //sort string ascending
                                        return -1
                                    if (nameA > nameB)
                                        return 1
                                    return 0 //default return value (no sorting)
                                })

                                dojo.dom.byId("divMoreResultsContent").setAttribute("header", dojo.toJson(tag.split(",")[0]));
                                dojo.dom.byId("divMoreResultsContent").setAttribute("groupdata", dojo.toJson(groupdata));
                                dojo.dom.byId("divMoreResultsContent").setAttribute("token", dojo.toJson(token));

                                RemoveChildren(dojo.dom.byId("divServiceContainer"));
                                if (mContainer == "more") {
                                    var bottomLayer = [];
                                    for (var lay in arrSubjectGroups) {
                                        bottomLayer.push({ arr: arrSubjectGroups[lay], obj: lay });
                                    }

                                    var temp = bottomLayer[(parseInt(lOrder) - 1)];
                                    bottomLayer[(parseInt(lOrder) - 1)] = bottomLayer[(parseInt(pOrder) - 1)];
                                    bottomLayer[(parseInt(pOrder) - 1)] = temp;

                                    var swappedLayer = [];
                                    for (var z in bottomLayer) {
                                        swappedLayer[bottomLayer[z].obj] = [];
                                        swappedLayer[bottomLayer[z].obj] = bottomLayer[z].arr;
                                    }
                                    RemoveChildren(dojo.dom.byId("trBottomHeaders"));
                                    RemoveChildren(dojo.dom.byId("trBottomTags"));
                                    RemoveChildren(dojo.dom.byId("tblMoreResults"));
                                    PopulateEventDetails(webInfo[0].id, swappedLayer, tag.split(",")[0], webInfo[0], groupdata, token, false, visibility, dojo.dom.byId("trBottomHeaders").getAttribute("offset"));
                                } else {
                                    PopulateEventDetails(webInfo[0].id, null, tag.split(",")[0], webInfo[0], groupdata, token, false, visibility, null);
                                }
                                if (visibility) {
                                    var webStats = [];
                                    for (var z in webInfo) {
                                        for (var y in webInfo[z].operationalLayers) {
                                            if (webInfo[z].operationalLayers[y].title.indexOf(statisticsKeyword) >= 0) {
                                                if (webInfo[z].operationalLayers[y].url) {
                                                    var str = webInfo[z].operationalLayers[y].url;
                                                    var ss = str.substring(((str.lastIndexOf("/")) + 1), (str.length))
                                                    if (!isNaN(ss)) {
                                                        webStats.push({ title: webInfo[z].key, url: webInfo[z].operationalLayers[y].url, statsTitle: webInfo[z].operationalLayers[y].title, definitionExpression: null });
                                                        if (webInfo[z].operationalLayers[y].layerDefinition && webInfo[z].operationalLayers[y].layerDefinition.definitionExpression) {
                                                            webStats[webStats.length - 1].definitionExpression = webInfo[z].operationalLayers[y].layerDefinition.definitionExpression;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    var statsData = [];
                                    FetchStatData(webStats, 0, statsData, webInfo, groupdata, token);
                                }
                                else {
                                    dojo.dom.byId("divServiceDetails").style.display = "none";
                                    HideGraphContainer();
                                }
                            }
                        });
                        mapDeferred.addErrback(function (error) {
                            HideProgressIndicator();
                            alert(dojo.toJson(error));
                        });

                    }
                }
            }
        }
        //Display more button if the number of subject groups can not be accommodated in the bottom panel
        if ((((bottomOffset) ? bottomOffset : dojo.dom.byId("divGroupHolder").offsetWidth) - ((lay == ord) ? 0 : 100)) > (lay * 100)) {
            dojo.dom.byId("trBottomHeaders").appendChild(tdBottomHeader);
        } else {
            var trMoreResults = document.createElement("tr");
            trMoreResults.id = "trMore" + lay;
            if (lastMetric == 0) {
                var val = lay - 1;
            }
            lastMetric++;
            trMoreResults.setAttribute("btnMore", val);
            if (lay % 2 != 0) {
                trMoreResults.className = "listDarkColor";
            } else {
                trMoreResults.className = "listLightColor";
            }
            dojo.dom.byId("tblMoreResults").appendChild(trMoreResults);
            trMoreResults.appendChild(tdBottomHeader);
            imgHeader.setAttribute("con", "more");
        }

        var tdMetricText = document.createElement("td");
        tdMetricText.style.width = "100px";
        tdMetricText.style.paddingRight = "2px";
        tdMetricText.innerHTML = col;
        tdMetricText.style.fontSize = "9px";
        tdMetricText.id = "tdMetricText" + lay;
        tdMetricText.style.color = "white";
        tdMetricText.align = "center";
        tdMetricText.style.fontWeight = "bold";
        tdMetricText.style.verticalAlign = "top";
        if ((((bottomOffset) ? bottomOffset : dojo.dom.byId("divGroupHolder").offsetWidth) - ((lay == ord) ? 0 : 100)) > (lay * 100)) {
            dojo.dom.byId("trBottomTags").appendChild(tdMetricText);
        }
        else {
            tdMetricText.style.verticalAlign = "middle";
            tdMetricText.align = "left";
            trMoreResults.appendChild(tdMetricText);
        }
    }
    if (bottomOffset == null) {
        dojo.dom.byId("trBottomHeaders").setAttribute("offset", dojo.dom.byId("divGroupHolder").offsetWidth);
    }
    var tdMore = document.createElement("td");
    tdMore.align = "center";
    tdMore.style.width = "100px";
    tdMore.id = "tdMore";
    tdMore.style.paddingRight = "2px";
    tdMore.style.paddingTop = "7px";
    dojo.dom.byId("trBottomHeaders").appendChild(tdMore);

    var imgMore = document.createElement("img");
    imgMore.id = "imgMore";
    imgMore.className = "imgOptions";
    imgMore.src = "images/more.png";
    imgMore.style.cursor = "pointer";
    imgMore.onclick = function () {
        ShowMoreContainer();
    }
    tdMore.appendChild(imgMore);

    if (trMoreResults) {
        tdMore.style.display = "block";
    }
    else {
        tdMore.style.display = "none";
        imgMore.src = "images/more.png";
        dojo['dom-class'].replace("divMoreContent", "hideContainerHeight", "showContainerHeight");
        dojo.dom.byId('divMoreContent').style.height = '0px';
    }

    var tdMoreText = document.createElement("td");
    tdMoreText.style.width = "100px";
    tdMoreText.style.paddingRight = "2px";
    tdMoreText.style.textAlign = "center";
    tdMoreText.style.verticalAlign = "top";
    tdMoreText.style.color = "white";
    tdMoreText.innerHTML = "More";
    tdMoreText.style.fontWeight = "bold";
    if (trMoreResults) {
        tdMoreText.style.display = "block";
    }
    else {
        tdMoreText.style.display = "none";
    }
    dojo.dom.byId("trBottomTags").appendChild(tdMoreText);
}

//Display container to show images in bottom panel
function ShowMoreContainer() {
    ToggleHeaderPanels();
    if (dojo['dom-geometry'].getMarginBox("divMoreContent").h <= 0) {
        dojo.dom.byId("imgMore").src = "images/more_hover.png";
        dojo.dom.byId('divMoreContent').style.height = "300px";
        dojo.dom.byId('divMoreContent').style.right = (dojo['dom-geometry'].getMarginBox("holder").l + 15) + "px";
        dojo['dom-class'].replace("divMoreContent", "showContainerHeight", "hideContainerHeight");

        CreateScrollbar(dojo.dom.byId("divMoreResultsContainer"), dojo.dom.byId("divMoreResultsContent"));
    }
}

//Go back to the dashboard page with the animation effects
function BackToPods() {
    ShowCompare(false);
    dojo.dom.byId("divServiceDetails").style.display = "none";
    newLeft = 0;
    dojo.dom.byId('carouselscroll').style.left = "0px";
    dojo.dom.byId("divMapContainer").style.width = dojo.window.getBox().w + "px";
    dojo.dom.byId("divMapContainer").style.height = dojo.window.getBox().h + "px";
    dojo.dom.byId("map").style.display = "none";
    HideInfoContainer();
    map.removeAllLayers();
    map.destroy();
    if (share != "") {
        shareOnLoad = false;
    }
    FadeIn(dojo.dom.byId('divApplicationHeader'));
    FadeIn(dojo.dom.byId('divInfoContainer'));
    FadeIn(dojo.dom.byId('divSettingsContainer'));
    FadeOut(dojo.dom.byId('divMapApplicationHeader'));
    FadeOut(dojo.dom.byId("divBottomContainer"));
    FadeOut(dojo.dom.byId('map'));
    FadeOut(dojo.dom.byId('divServiceDetails'));
    FadeOut(dojo.dom.byId('showHide'));
    //retainState variable is used to store the state of header containers
    if (retainState) {
        FadeOut(dojo.dom.byId('divGraphComponent'));
        FadeOut(dojo.dom.byId('divBookmarkContent'));
        FadeOut(dojo.dom.byId('divAddressContent'));
    }
    setTimeout(function () {
        if (!retainState) {
            ToggleHeaderPanels();
        }
        dojo.dom.byId("divMapContainer").style.width = "100%";
        dojo.dom.byId("divMapContainer").style.height = "100%";
        dojo.dom.byId("divMapContainer").style.display = "none";
        dojo.dom.byId("divTextContainer").style.display = "block";
        if (isTablet) {
            SetHomePageHeight();
        }
        CreateScrollbar(dojo.dom.byId('divLayerContainer'), dojo.dom.byId('divLayerContent'));
        CreateScrollbar(dojo.dom.byId('divNAEDisplayContainer'), dojo.dom.byId('divNAEDisplayContent'));
    }, 500);
}

//Hide info window
function HideInfoContainer() {
    RemoveHiglightGraphic();
    if (!tempMap) {
        if (map.infoWindow) {
            map.infoWindow.hide();
            selectedMapPoint = null;
        }
    }
    else {
        if (tempMap.infoWindow) {
            tempMap.infoWindow.hide();
        }
    }
}

//Remove note graphic on map
function RemoveHiglightGraphic() {
    var notesLayer = (!tempMap) ? map.getLayer("tempNotesLayerId") : tempMap.getLayer("tempNotesGraphicLayerId");
    if (notesLayer) {
        if (notesLayer.graphics.length != 0) {
            if (notesLayer.graphics[(notesLayer.graphics.length - 1)].attributes) {
                if (notesLayer.graphics[(notesLayer.graphics.length - 1)].attributes[0]) {
                    if (!(notesLayer.graphics[(notesLayer.graphics.length - 1)].attributes[0].note)) {
                        notesLayer.remove(notesLayer.graphics[(notesLayer.graphics.length - 1)]);
                    }
                }
            }
        }
    }
    selectedPoint = null;
}

//Show bookmark container with wipe-in animation
function ShowBookmarkContainer() {
    dojo.dom.byId("txtBookmark").value = "";
    ToggleHeaderPanels();
    if (dojo['dom-geometry'].getMarginBox("divBookmarkContent").h <= 0) {
        dojo.dom.byId("showHide").style.display = "none";

        dojo.dom.byId("imgBookmark").src = "images/imgBookmark_hover.png";
        dojo.dom.byId('divBookmarkContent').style.height = "300px";
        dojo.dom.byId('divBookmarkContent').style.right = (dojo['dom-geometry'].getMarginBox("holder").l + 15) + "px";
        dojo['dom-class'].replace("divBookmarkContent", "showContainerHeight", "hideContainerHeight");
        dojo.dom.byId("imgAddBookmark").onclick = function () {
            var bookmarks = [];
            if (dojo.fromJson(localStorage.getItem("BookmarkCollection"))) {
                bookmarks = dojo.fromJson(localStorage.getItem("BookmarkCollection"));
            }
            if (!dojo.dom.byId("txtBookmark").value.trim()) {
                dojo.dom.byId("bookmarkErrorMessage").innerHTML = messages.getElementsByTagName("bookmarkName")[0].childNodes[0].nodeValue;
                return;
            }
            for (var b = 0; b < bookmarks.length; b++) {
                if (dojo.dom.byId("txtBookmark").value.trim() == bookmarks[b].name) {
                    dojo.dom.byId("bookmarkErrorMessage").innerHTML = messages.getElementsByTagName("existingBookmark")[0].childNodes[0].nodeValue;
                    dojo.dom.byId("txtBookmark").value = "";
                    return;
                }
            }
            bookmarks.push({
                "name": dojo.dom.byId("txtBookmark").value.trim(),
                "extent": (!tempMap) ? map.extent : tempMap.extent
            });
            localStorage.setItem("BookmarkCollection", dojo.toJson(bookmarks));
            PopulateBookmarkList();
        }
        PopulateBookmarkList();
    }
}

//Create list of bookmarks from local storage
function PopulateBookmarkList() {
    dojo.dom.byId("bookmarkErrorMessage").innerHTML = "";
    RemoveChildren(dojo.dom.byId("divBookMarksResultsContent"));
    var tblBookMarksResults = document.createElement("table");
    tblBookMarksResults.style.width = "96%";
    tblBookMarksResults.cellSpacing = 0;
    tblBookMarksResults.cellPadding = 0;
    tblBookMarksResults.align = "left";
    dojo.dom.byId("divBookMarksResultsContent").appendChild(tblBookMarksResults);
    var tBodyBookMarksResults = document.createElement("tbody");
    tblBookMarksResults.appendChild(tBodyBookMarksResults);
    var arrayBookmarks = dojo.fromJson(localStorage.getItem("BookmarkCollection"));
    if (arrayBookmarks) {
        for (var r = 0; r < arrayBookmarks.length; r++) {
            var trBookMarksResults = document.createElement("tr");
            if (r % 2 != 0) {
                trBookMarksResults.className = "listDarkColor";
            } else {
                trBookMarksResults.className = "listLightColor";
            }
            tBodyBookMarksResults.appendChild(trBookMarksResults);
            var tdBookMarksResults = document.createElement("td");
            if (isBrowser) {
                tdBookMarksResults.style.width = "185px";
                tdBookMarksResults.style.height = "32px";
            } else {
                tdBookMarksResults.style.height = "100%";
            }

            tdBookMarksResults.style.paddingLeft = "3px";
            tdBookMarksResults.align = "left";
            tdBookMarksResults.style.cursor = "pointer";
            tdBookMarksResults.style.borderBottom = "1px #000 solid";
            tdBookMarksResults.setAttribute("bookmarkName", arrayBookmarks[r].name);

            var x = arrayBookmarks[r].name.split(" ");
            for (var i in x) {
                w = x[i].getWidth(((isTablet) ? 14 : 11));
                var boxWidth = ((isTablet) ? 155 : 200);
                if (boxWidth < w) {
                    tdBookMarksResults.className = "tdBreakWord";
                    continue;
                }
            }

            tdBookMarksResults.innerHTML = arrayBookmarks[r].name.trimString(40);
            if (arrayBookmarks[r].name.length > 40) {
                tdBookMarksResults.title = arrayBookmarks[r].name;
            }

            tdBookMarksResults.onclick = function (evt) {
                //Upon clicking/tapping on this cell map will pan to the respective stored extent of this bookmark
                for (var b = 0; b < arrayBookmarks.length; b++) {
                    if (this.getAttribute("bookmarkName") == arrayBookmarks[b].name) {
                        if (!tempMap) {
                            map.setExtent(new esri.geometry.Extent(arrayBookmarks[b].extent.xmin, arrayBookmarks[b].extent.ymin,
                                                               arrayBookmarks[b].extent.xmax, arrayBookmarks[b].extent.ymax, map.spatialReference));
                        }
                        else {
                            tempMap.setExtent(new esri.geometry.Extent(arrayBookmarks[b].extent.xmin, arrayBookmarks[b].extent.ymin,
                                                               arrayBookmarks[b].extent.xmax, arrayBookmarks[b].extent.ymax, tempMap.spatialReference));
                        }
                        break;
                    }
                }
            }
            trBookMarksResults.appendChild(tdBookMarksResults);
            var tdUp = document.createElement("td");
            tdUp.style.borderBottom = "1px #000 solid";
            tdUp.align = "center";
            tdUp.className = 'imgOptions';
            trBookMarksResults.appendChild(tdUp);
            var imgUP = document.createElement("img");
            imgUP.id = "imgUP" + arrayBookmarks[r].name;
            imgUP.setAttribute("bookmarkName", arrayBookmarks[r].name);
            imgUP.src = "images/up-arrow.png";
            imgUP.title = "Move up";
            imgUP.style.cursor = "pointer";
            if (arrayBookmarks.length > 1) {
                imgUP.style.display = "block";
            } else {
                imgUP.style.display = "none";
            }
            imgUP.className = 'imgOptions';
            imgUP.onclick = function (evt) {
                var array = MoveUp(this.getAttribute("bookmarkName"), arrayBookmarks);
                localStorage.setItem("BookmarkCollection", dojo.toJson(array));
                PopulateBookmarkList();
            }
            tdUp.appendChild(imgUP);
            var tdDown = document.createElement("td");
            tdDown.style.borderBottom = "1px #000 solid";
            tdDown.className = 'imgOptions';
            tdDown.align = "center";
            trBookMarksResults.appendChild(tdDown);
            var imgDown = document.createElement("img");
            imgDown.id = "imgDown" + arrayBookmarks[r].name;
            imgDown.src = "images/down-arrow.png";
            imgDown.setAttribute("bookmarkName", arrayBookmarks[r].name);
            imgDown.style.cursor = "pointer";
            imgDown.title = "Move down";
            if (arrayBookmarks.length > 1) {
                imgDown.style.display = "block";
            } else {
                imgDown.style.display = "none";
            }
            imgDown.className = 'imgOptions';
            imgDown.onclick = function () {
                var dArray = MoveDown(this.getAttribute("bookmarkName"), arrayBookmarks);
                localStorage.setItem("BookmarkCollection", dojo.toJson(dArray));
                PopulateBookmarkList();
            }
            tdDown.appendChild(imgDown);
            var tdClose = document.createElement("td");
            tdClose.style.borderBottom = "1px #000 solid";
            tdClose.align = "center";
            tdClose.className = 'imgOptions';
            trBookMarksResults.appendChild(tdClose);
            var imgClose = document.createElement("img");
            imgClose.id = "imgClose" + arrayBookmarks[r].name;
            imgClose.setAttribute("bookmarkName", arrayBookmarks[r].name);
            imgClose.src = "images/close.png";
            imgClose.title = "Remove";
            imgClose.style.cursor = "pointer";
            imgClose.className = 'imgOptions';
            imgClose.onclick = function (evt) {
                var RArray = RemoveElement(this.getAttribute("bookmarkName"), arrayBookmarks);
                localStorage.setItem("BookmarkCollection", dojo.toJson(RArray));
                PopulateBookmarkList();
            }
            tdClose.appendChild(imgClose);
        }
        dojo.dom.byId("txtBookmark").value = "";
        CreateScrollbar(dojo.dom.byId('divBookMarksResultsContainer'), dojo.dom.byId('divBookMarksResultsContent'));
    }
}

//Display address container
function ShowLocateContainer() {
    ToggleHeaderPanels();
    if (dojo['dom-geometry'].getMarginBox("divAddressContent").h <= 0) {
        dojo.dom.byId("showHide").style.display = "none";
        dojo.dom.byId("imgSearch").src = "images/locate_hover.png";
        dojo.dom.byId('divAddressContent').style.height = "300px";
        dojo.dom.byId('divAddressContent').style.right = (dojo['dom-geometry'].getMarginBox("holder").l + 15) + "px";
        dojo['dom-class'].replace("divAddressContent", "showContainerHeight", "hideContainerHeight");
        dojo.dom.byId("txtAddress").value = dojo.dom.byId("txtAddress").getAttribute("defaultAddress");
        lastSearchString = dojo.dom.byId("txtAddress").value.trim();
        dojo.dom.byId("txtAddress").blur();
        if (dojo.dom.byId("txtAddress").getAttribute("defaultAddress") == dojo.dom.byId("txtAddress").getAttribute("defaultAddressTitle")) {
            dojo.dom.byId("txtAddress").style.color = "gray";
        }
        else {
            dojo.dom.byId("txtAddress").style.color = "#000";
        }
    }
    RemoveChildren(dojo.dom.byId('tblAddressResults'));
    SetAddressResultsHeight();
}

//Get current map Extent
function GetMapExtent() {
    var extents;
    if (tempMap) {
        extents = Math.round(tempMap.extent.xmin).toString() + "," + Math.round(tempMap.extent.ymin).toString() + "," +
                      Math.round(tempMap.extent.xmax).toString() + "," + Math.round(tempMap.extent.ymax).toString();
    }
    else {
        extents = Math.round(map.extent.xmin).toString() + "," + Math.round(map.extent.ymin).toString() + "," +
                  Math.round(map.extent.xmax).toString() + "," + Math.round(map.extent.ymax).toString();
    }
    return (extents);
}

//Open Email client with shared link
function ShareLink(ext) {
    if (!tempMap) {
        dojo.dom.byId("imgSocialMedia").src = "images/imgSocialMedia_hover.png";
        tinyUrl = null;
        mapExtent = GetMapExtent();
        var url = esri.urlToObject(window.location.toString());
        var urlStr;
        if (dojo.dom.byId("imgSocialMedia").getAttribute("shareNotesLink")) {
            if (dojo.dom.byId("imgSocialMedia").getAttribute("shareNotesLink").length > 5) {
                var shareContent = "?extent=" + mapExtent + "$t=" + dojo.dom.byId("imgSocialMedia").getAttribute("mapName") + "$n=";
                urlStr = encodeURI(url.path) + shareContent + dojo.dom.byId("imgSocialMedia").getAttribute("shareNotesLink");
            }
            else {
                urlStr = encodeURI(url.path) + "?extent=" + mapExtent + "$t=" + dojo.dom.byId("imgSocialMedia").getAttribute("mapName").replace("&", "@");
            }
        }
        else {
            urlStr = encodeURI(url.path) + "?extent=" + mapExtent + "$t=" + dojo.dom.byId("imgSocialMedia").getAttribute("mapName").replace("&", "@");
        }
        url = dojo.string.substitute(mapSharingOptions.TinyURLServiceURL, [urlStr]);
        setTimeout(function () {
            dojo.dom.byId("imgSocialMedia").src = "images/imgSocialMedia.png";
        }, 500);
        dojo.io.script.get({
            url: url,
            callbackParamName: "callback",
            load: function (data) {
                tinyResponse = data;
                tinyUrl = data;
                var attr = mapSharingOptions.TinyURLResponseAttribute.split(".");
                for (var x = 0; x < attr.length; x++) {
                    tinyUrl = tinyUrl[attr[x]];
                }
                if (tinyUrl) {
                    parent.location = dojo.string.substitute(mapSharingOptions.ShareByMailLink, [dojo.dom.byId("imgSocialMedia").getAttribute("mapName").replace("&", "and") + " - " + tinyUrl]);

                } else {
                    alert(messages.getElementsByTagName("tinyURLEngine")[0].childNodes[0].nodeValue);
                    return;
                }
            },
            error: function (error) {
                alert(tinyResponse.error);
            }
        });
        setTimeout(function () {
            if (!tinyResponse) {
                alert(messages.getElementsByTagName("tinyURLEngine")[0].childNodes[0].nodeValue);
                return;
            }
        }, 6000);
    }
}

//Set height for address results list and create scrollbar
function SetAddressResultsHeight() {
    var height = dojo['dom-geometry'].getMarginBox(dojo.dom.byId('divAddressContent')).h;
    if (height > 0) {
        dojo.dom.byId('divAddressScrollContent').style.height = (height - ((isTablet) ? 150 : 130)) + "px";
    }
    CreateScrollbar(dojo.dom.byId("divAddressScrollContainer"), dojo.dom.byId("divAddressScrollContent"));
}

//Show progress indicator
function ShowProgressIndicator() {
    dojo.dom.byId('divLoadingIndicator').style.display = "block";
}

//Hide progress indicator
function HideProgressIndicator() {
    dojo.dom.byId('divLoadingIndicator').style.display = "none";
}

//Create metric pods for subject groups
//For each pod this function determines Key indicator, Increase or decrease indicator, Color of pod. This function also handles on click event for each pod.
function CreateGroupPods(webInfo, groupdata, token, statsData) {
    dojo.dom.byId('carouselscroll').style.paddingLeft = "0px";
    dojo.dom.byId("divServiceDetails").style.display = "block";

    dojo.dom.byId("divServiceDetails").style.left = (dojo['dom-geometry'].getMarginBox("holder").l) + "px";
    dojo.dom.byId("divServiceData").style.width = (webInfo.length * 220) + "px";

    dojo.dom.byId('carouselscroll').style.left = "0px";
    newLeft = 0;

    RemoveChildren(dojo.dom.byId("divServiceContainer"));
    var tblMetricPods = document.createElement("table");
    tblMetricPods.id = "tblMetricPods";
    tblMetricPods.style.visibility = "hidden";
    tblMetricPods.cellSpacing = 0;
    tblMetricPods.cellPadding = 0;
    dojo.dom.byId("divServiceContainer").appendChild(tblMetricPods);
    var tBodyMetricPods = document.createElement("tbody");
    tblMetricPods.appendChild(tBodyMetricPods);
    var trMetricPods = document.createElement("tr");
    tBodyMetricPods.appendChild(trMetricPods);
    var count = 0;
    var infoClicked = false;
    for (var p in webInfo) {
        var tdMetricPods = document.createElement("td");
        trMetricPods.appendChild(tdMetricPods);

        var outerdiv = document.createElement("div");
        outerdiv.style.backgroundColor = "#000000";
        if (isBrowser) {
            outerdiv.style.margin = "7px";
        } else {
            outerdiv.style.margin = "12px";
        }
        outerdiv.style.width = "200px";
        outerdiv.style.height = "150px";
        outerdiv.className = "rounded";
        tdMetricPods.appendChild(outerdiv);

        var divPod = document.createElement("div");
        divPod.style.width = "200px";
        divPod.style.height = "150px";
        divPod.style.cursor = "pointer";
        divPod.id = "div" + p + "Pod";
        divPod.setAttribute("layer", p);
        divPod.setAttribute("info", p);
        divPod.setAttribute("divGroupPod", p);

        divPod.onclick = function (evt) {
            //Upon clicking/tapping on the pod, the data for selected pod will be transferred to function to create map page.
            if (!((dojo['dom-class'].contains("div" + this.getAttribute("layer") + "Pod", "divPodRedSelected")) || (dojo['dom-class'].contains("div" + this.getAttribute("layer") + "Pod", "divPodGreenSelected")) || (dojo['dom-class'].contains("div" + this.getAttribute("layer") + "Pod", "divPodGraySelected")))) {
                ShowProgressIndicator();
                RemoveChildren(dojo.dom.byId("divGraphContent"));
                if (map) {
                    for (var e in map._layers) {
                        if (e.match("eventLayerId")) {
                            map.removeLayer(map._layers[e]);
                        }
                    }
                }
                for (var w in webInfo) {
                     dojo['dom-class'].remove("div" + w + "Pod", "divPodRedSelected");
                     dojo['dom-class'].remove("div" + w + "Pod", "divPodGreenSelected");
                     dojo['dom-class'].remove("div" + w + "Pod", "divPodGraySelected");
                }
                //Highlight selected pod depending on its pod color
                if (this.className == "divPodRed") {
                    dojo['dom-class'].add("div" + this.getAttribute("layer") + "Pod", "divPodRedSelected");
                }
                else if (this.className == "divPodGreen") {
                    dojo['dom-class'].add("div" + this.getAttribute("layer") + "Pod", "divPodGreenSelected");
                } else {
                    dojo['dom-class'].add("div" + this.getAttribute("layer") + "Pod", "divPodGraySelected");
                }

                for (var r in webInfo) {
                    if ((dojo['dom-class'].contains("div" + r + "Pod", "divPodRedSelected")) || (dojo['dom-class'].contains("div" + r + "Pod", "divPodGreenSelected")) || (dojo['dom-class'].contains("div" + r + "Pod", "divPodGraySelected"))) {
                        dojo.dom.byId("imgSocialMedia").setAttribute("key", webInfo[r].key);
                        break;
                    }
                }
                dojo.dom.byId("imgSocialMedia").setAttribute("statistical", dojo.toJson(statsData));

                for (var c in webInfo) {
                    if (dojo.dom.byId("divSummary" + c + "Pod")) {
                        FadeOut(dojo.dom.byId("divSummary" + c + "Pod"));
                        dojo.dom.byId("divSummary" + c + "Pod").style.display = "none";
                    }
                    if (dojo.dom.byId("divContainer" + c + "Pod")) {
                        FadeIn(dojo.dom.byId("divContainer" + c + "Pod"));
                        dojo.dom.byId("divContainer" + c + "Pod").style.display = "block";
                    }
                }
                PopulateEventDetails(webInfo[dojo.fromJson(this.getAttribute("info"))].id, null, dojo.dom.byId("tdEventName").innerHTML, webInfo[dojo.fromJson(this.getAttribute("info"))], groupdata, token, false, "Yes", null);


                infoClicked = false;

                if (!dojo.dom.byId("divChartPod")) {
                    CreateLineChart(statsData, webInfo[this.getAttribute("layer")].key);
                }
                if (dojo.dom.byId("divChart" + this.getAttribute("layer") + "Pod")) {
                    setTimeout("PopulateInfoPodDetails(" + this.getAttribute('layer') + "," + true + "," + true + ")", 500);
                }
            }
            else if (infoClicked) {
                //infoClicked variable determines whether pod is selected or not
                if (!dojo.dom.byId("divSummary" + this.getAttribute("layer") + "Pod")) {
                    CreateSummaryData(statsData, this.getAttribute("layer"), webInfo[this.getAttribute("layer")].key);
                }
                if (dojo.dom.byId("divSummary" + this.getAttribute("layer") + "Pod")) {
                    if (dojo.dom.byId("divSummary" + this.getAttribute("layer") + "Pod").style.display != "none") {
                        FadeOut(dojo.dom.byId("divSummary" + this.getAttribute("layer") + "Pod"));
                        FadeIn(dojo.dom.byId("divContainer" + this.getAttribute("layer") + "Pod"));
                        setTimeout("PopulateInfoPodDetails(" + this.getAttribute('layer') + "," + true + "," + false + ")", 500);
                        infoClicked = false;
                    }
                    else {
                        FadeOut(dojo.dom.byId("divContainer" + this.getAttribute("layer") + "Pod"));
                        FadeIn(dojo.dom.byId("divSummary" + this.getAttribute("layer") + "Pod"));
                        setTimeout("PopulateInfoPodDetails(" + this.getAttribute('layer') + "," + false + "," + false + ")", 500);
                    }
                }
            }
            else {
                setTimeout("PopulateInfoPodDetails(" + this.getAttribute('layer') + "," + false + "," + true + ")", 500);
            }
        }
        outerdiv.appendChild(divPod);

        var divPodInner = document.createElement("div");
        divPodInner.id = "divPodInner" + p + "Pod";
        divPod.appendChild(divPodInner);


        var divContainer = document.createElement("div");
        divContainer.style.width = "100%";
        divContainer.style.height = "100%";
        divContainer.id = "divContainer" + p + "Pod";
        divPodInner.appendChild(divContainer);

        var tablePod = document.createElement("table");
        tablePod.style.width = "100%";
        tablePod.style.height = "100%";
        tablePod.cellPadding = 0;
        tablePod.cellSpacing = 0;
        tablePod.id = "tbl" + p + "Pod";
        divContainer.appendChild(tablePod);
        var tBodyPod = document.createElement("tbody");
        tablePod.appendChild(tBodyPod);

        var trPod = document.createElement("tr");
        tBodyPod.appendChild(trPod);

        var tdInner = document.createElement("td");
        tdInner.style.verticalAlign = "top";
        tdInner.style.height = "50%";
        tdInner.style.padingTop = "5px";
        trPod.appendChild(tdInner);

        var tableInner = document.createElement("table");
        tableInner.cellPadding = 0;
        tableInner.cellSpacing = 0;
        tableInner.style.width = "200px";
        tableInner.style.height = "100%";
        tdInner.appendChild(tableInner);
        var tbodyInner = document.createElement("tbody");
        tableInner.appendChild(tbodyInner);

        var trInner = document.createElement("tr");
        tbodyInner.appendChild(trInner);

        var tdKeyInd = document.createElement("td");
        tdKeyInd.align = "left";
        tdKeyInd.style.paddingLeft = "10px";
        tdKeyInd.style.paddingTop = "20px";
        tdKeyInd.style.verticalAlign = "top";
        trInner.appendChild(tdKeyInd);
        var spanText = document.createElement("span");
        spanText.style.color = "white";
        spanText.style.fontSize = "16px";
        spanText.style.lineHeight = "22px";
        spanText.style.fontWeight = "bolder";
        spanText.innerHTML = webInfo[p].key;
        tdKeyInd.appendChild(spanText);

        var tdImg = document.createElement("td");
        tdImg.align = "right";
        tdImg.style.paddingTop = "10px";
        tdImg.style.paddingRight = "10px";
        tdImg.style.verticalAlign = "top";
        trInner.appendChild(tdImg);
        var imgInfo = document.createElement("img");
        imgInfo.style.width = "30px";
        imgInfo.style.height = "30px";
        imgInfo.src = "images/info.png";
        imgInfo.id = "img" + p;
        imgInfo.style.display = "block";
        imgInfo.onclick = function () {
            if (this.style.display == "block") {
                infoClicked = true;
            }
        };
        tdImg.appendChild(imgInfo);

        var trImg = document.createElement("tr");
        tBodyPod.appendChild(trImg);
        var tdMetricStatus = document.createElement("td");
        tdMetricStatus.style.height = "50%";
        trImg.appendChild(tdMetricStatus);
        var tableMetricStatus = document.createElement("table");
        tableMetricStatus.cellPadding = 0;
        tableMetricStatus.cellSpacing = 0;
        tableMetricStatus.style.width = "100%";
        tableMetricStatus.style.height = "100%";
        tdMetricStatus.appendChild(tableMetricStatus);
        var tbodyMetricStatus = document.createElement("tbody");
        tableMetricStatus.appendChild(tbodyMetricStatus);
        var trMetricStatus = document.createElement("tr");
        tbodyMetricStatus.appendChild(trMetricStatus);

        var tdStatusInd = document.createElement("td");
        tdStatusInd.align = "left";
        tdStatusInd.style.paddingLeft = "10px";
        trMetricStatus.appendChild(tdStatusInd);

        var spanImg = document.createElement("span");
        tdStatusInd.appendChild(spanImg);
        var imgArr = document.createElement("img");
        imgArr.style.width = "40px";
        imgArr.style.height = "25px";
        imgArr.style.display = "block";
        spanImg.appendChild(imgArr);

        var tdText = document.createElement("td");
        tdText.align = "right";
        tdText.style.paddingRight = "10px";
        trMetricStatus.appendChild(tdText);

        var spanText = document.createElement("span");
        spanText.className = "spnMetricNumber";
        var featureCollection = true;
        if (statsData) {
            for (var c in statsData) {
                if (webInfo[p].key == statsData[c].title) {
                    featureCollection = false;
                    //If stats keyword mentioned in config file is available in layer then show color, indicator and value for the pod
                    if (statsData[c].statsTitle.indexOf(statisticsKeyword) >= 0) {
                        if (webInfo[0].key) {
                            dojo.dom.byId("divGraphHeader").style.display = "block";
                            dojo.dom.byId("divGraphHeader").style.color = "#FFFFFF";
                            dojo.dom.byId("divGraphHeader").setAttribute("state", "enabled");
                            dojo.dom.byId("divGraphHeader").style.cursor = "pointer";
                        }

                        try {
                            if (dojo.string.substitute(infoPodStatics[0].CurrentObservation, statsData[c].data)) {
                                spanText.innerHTML = dojo.string.substitute(infoPodStatics[0].CurrentObservation, statsData[c].data).format();
                            }
                        }
                        catch (err) {
                            spanText.innerHTML = showNullValueAs;
                        }
                        try {
                            var diff = (dojo.string.substitute(infoPodStatics[0].CurrentObservation, statsData[c].data) - dojo.string.substitute(infoPodStatics[0].LatestObservation, statsData[c].data));
                            // Calculate increase or decrease indicator; Accordingly set the color and arrow symbol for the pod
                            if (diff > 0) {
                                imgArr.src = "images/up.png";
                                if (dojo.string.substitute(infoPodStatics[0].StatisticsPosition, statsData[c].data) == "Yes") {
                                    divPod.className = "divPodGreen";
                                    divPodInner.className = "divPodInnerGreen";
                                }
                                else if (dojo.string.substitute(infoPodStatics[0].StatisticsPosition, statsData[c].data) == "No") {
                                    divPod.className = "divPodRed";
                                    divPodInner.className = "divPodInnerRed";
                                }
                                else {
                                    imgArr.style.display = "none";
                                    divPod.className = "divPod";
                                    divPodInner.className = "divPodInner";
                                }
                                if (diff == 0) {
                                    imgArr.style.display = "none";
                                }
                                else {
                                    imgArr.style.display = "block";
                                }
                            }
                            else if (diff < 0) {
                                imgArr.src = "images/down.png";
                                if (dojo.string.substitute(infoPodStatics[0].StatisticsPosition, statsData[c].data) == "Yes") {
                                    divPod.className = "divPodRed";
                                    divPodInner.className = "divPodInnerRed";
                                }
                                else if (dojo.string.substitute(infoPodStatics[0].StatisticsPosition, statsData[c].data) == "No") {
                                    divPod.className = "divPodGreen";
                                    divPodInner.className = "divPodInnerGreen";
                                }
                                else {
                                    imgArr.style.display = "none";
                                    divPod.className = "divPod";
                                    divPodInner.className = "divPodInner";
                                }
                            }
                            else {
                                imgArr.style.display = "none";
                                divPod.className = "divPod";
                                divPodInner.className = "divPodInner";
                            }
                        }
                        catch (err) {
                            alert(dojo.string.substitute(messages.getElementsByTagName("nullValue")[0].childNodes[0].nodeValue, [webInfo[p].key]));
                            imgArr.style.display = "none";
                            divPod.className = "divPod";
                            divPodInner.className = "divPodInner";
                        }
                        break;
                    }
                    else {
                        imgArr.style.display = "none";
                        CreateNeutralPod(divPod, divPodInner, p);
                        if (p == 0) {
                            if (dojo.dom.byId("divChartPod")) {
                                RemoveChildren(dojo.dom.byId("divChartPod"));
                            }
                            HideGraphContainer();
                        }
                    }
                }
            }
            if (featureCollection) {
                imgArr.style.display = "none";
                CreateNeutralPod(divPod, divPodInner, p);
            }
        } else {
            imgArr.style.display = "none";
            CreateNeutralPod(divPod, divPodInner, p);
        }
        tdText.appendChild(spanText);

        //When a shared link for the app is invoked, highlight the respective pod
        if (share != "") {
            var group;
            if (window.location.href.split("$n=").length > 1) {
                group = window.location.href.split("$t=")[1].split("$n=")[0];
            }
            else {
                group = window.location.href.split("$t=")[1];
            }
            group = group.replace(/%20/g, " ");
            if (shareOnLoad) {
                if (webInfo[p].key == group) {
                    if (divPod.className == "divPodRed") {
                        dojo['dom-class'].add("div" + p + "Pod", "divPodRedSelected");
                    }
                    else if (divPod.className == "divPodGreen") {
                        dojo['dom-class'].add("div" + p + "Pod", "divPodGreenSelected");
                    } else {
                        dojo['dom-class'].add("div" + p + "Pod", "divPodGraySelected");
                        HideGraphContainer();
                    }
                }
            }
            else {
                HighlightMetricPod(divPod, count, p);
            }
        }
        else {
            HighlightMetricPod(divPod, count, p);
        }
        count++;
    }

    dojo.dom.byId("imgSocialMedia").setAttribute("statistical", dojo.toJson(statsData));

    if (share != "") {
        if (shareOnLoad) {
            CreateLineChart(statsData, group);
        }
        else {
            CreateLineChart(statsData, webInfo[0].key);
        }
    }
    else {
        CreateLineChart(statsData, webInfo[0].key);
    }

    if (dojo.dom.byId("divChartPod")) {
        setTimeout("PopulateInfoPodDetails(" + 0 + "," + true + "," + true + ")", 500);
    }

    setTimeout(function () {
        dojo.dom.byId("divServiceDetails").style.display = "block";
        ResetSlideControls();
        HideProgressIndicator();
        shareOnLoad = false;
    }, 500);
}

//Create neutral pod for layers without statistical information
function CreateNeutralPod(divPod, divPodInner, p) {
    divPod.className = "divPod";
    divPodInner.className = "divPodInner";
    dojo.dom.byId("img" + p).style.display = "none";
    if (dojo.dom.byId("divChartPod")) {
        RemoveChildren(dojo.dom.byId("divChartPod"));
    }
    HideGraphContainer();
}

//Hide graph container
function HideGraphContainer() {
    dojo['dom-class'].replace("divGraphComponent", "hideContainerHeight", "showContainerHeight");
    dojo.dom.byId('divGraphComponent').style.height = '0px';
    dojo.dom.byId('showHide').style.top = '59px';
    dojo.dom.byId("divGraphHeader").style.display = "none";
    dojo.dom.byId("divGraphHeader").style.color = "gray";
    dojo.dom.byId("divGraphHeader").setAttribute("state", "disabled");
    dojo.dom.byId("divGraphHeader").style.cursor = "default";
}

//Highlight the first metric pod in the subject group
function HighlightMetricPod(divPod, count, p) {
    //count parameter to check the order of metric
    if (count == 0) {
        if (divPod.className == "divPodRed") {
            dojo['dom-class'].add("div" + p + "Pod", "divPodRedSelected");
        }
        else if (divPod.className == "divPodGreen") {
            dojo['dom-class'].add("div" + p + "Pod", "divPodGreenSelected");
        }
        else {
            dojo['dom-class'].add("div" + p + "Pod", "divPodGraySelected");
            HideGraphContainer();
        }
    }
}

//Populate information for the selected metric
function PopulateInfoPodDetails(store, value, graph) {
    if (value) {
        if (!graph) {
            dojo.dom.byId("divSummary" + store + "Pod").style.display = "none";
        }
        if (dojo.dom.byId("divContainer" + store + "Pod")) {
            dojo.dom.byId("divContainer" + store + "Pod").style.display = "block";
        }
    }
    else {
        if (graph) {
            if (dojo.dom.byId("divChartPod")) {
                dojo.dom.byId("divChartPod").style.display = "block";
            }
        }
        else {
            dojo.dom.byId("divContainer" + store + "Pod").style.display = "none";
            dojo.dom.byId("divSummary" + store + "Pod").style.display = "block";
        }
    }
}

//Create and display information for metric pod based on format defined in configuration file
function CreateSummaryData(statsData, layer, title) {
    if (layer) {
        var divSummary = document.createElement("div");
        divSummary.id = "divSummary" + layer + "Pod";
        divSummary.style.height = "85%";
        divSummary.style.width = "90%";
        divSummary.style.display = "none";
        divSummary.className = "rounded";
        divSummary.style.margin = "10px";
        dojo.dom.byId("divPodInner" + layer + "Pod").appendChild(divSummary);

        var tblSummary = document.createElement("table");
        tblSummary.cellSpacing = 0;
        tblSummary.cellPadding = 0;
        tblSummary.style.width = "100%";
        tblSummary.style.height = "100%";
        divSummary.appendChild(tblSummary);
        var tbodySummary = document.createElement('tbody');
        tblSummary.appendChild(tbodySummary);
        var trSummary = document.createElement("tr");
        tbodySummary.appendChild(trSummary);
        var tdSummary = document.createElement("td");
        tdSummary.style.verticalAlign = "middle";
        tdSummary.align = "center";
        trSummary.appendChild(tdSummary);

        var spanSummary = document.createElement("span");
        spanSummary.style.fontWeight = "bolder";
        tdSummary.appendChild(spanSummary);
    }
    if (!layer) {
        title = dojo.dom.byId("imgSocialMedia").getAttribute("key");
        statsData = dojo.fromJson(dojo.dom.byId("imgSocialMedia").getAttribute("statistical"));
        var spanSummary = document.createElement("span");
    }

    for (var y = 0; y < statsData.length; y++) {
        if (statsData[y].title == title) {
            for (var i in statsData[y].fields) {
                if (statsData[y].fields[i].type == "esriFieldTypeDate") {
                    if (statsData[y].fields[i].name) {
                        if (Number(statsData[y].data[statsData[y].fields[i].name]) == statsData[y].data[statsData[y].fields[i].name]) {
                            var utcMilliseconds = Number(statsData[y].data[statsData[y].fields[i].name]);
                            statsData[y].data[statsData[y].fields[i].name] = dojo.date.locale.format(new Date(utcMilliseconds), { datePattern: formatDateAs, selector: "date" });
                        }
                    }
                }
            }
            try {
                spanSummary.innerHTML = dojo.string.substitute(podInformation, statsData[y].data);
            }
            catch (err) {
                spanSummary.innerHTML = messages.getElementsByTagName("podInformation")[0].childNodes[0].nodeValue;
            }
            if (!layer) {
                return dojo.string.substitute(podInformation, statsData[y].data);
            }
        }
    }
}

//Create chart for metric pod data and style graph container
function CreateLineChart(statsData, title) {
    //statsData to check whether it has layer data or not
    if (statsData) {
        try {
            for (var y = 0; y < statsData.length; y++) {
                if (statsData[y].title == title) {
                    if (statsData[y].statsTitle.indexOf(statisticsKeyword) >= 0) {

                        dojo.dom.byId("tdMetricHeader").innerHTML = statsData[y].statsTitle.split(statisticsKeyword)[0];

                        var chartData = [];
                        for (var z = 0; z < infoPodStatics[1].CountObservations.length; z++) {
                            try {
                                chartData.push(Number(dojo.string.substitute(infoPodStatics[1].CountObservations[z], statsData[y].data)));
                            } catch (err) {
                                chartData.push(showNullValueAs);
                            }
                        }
                        var xAxisData = [];
                        for (var a = 0; a < infoPodStatics[1].DateObservations.length; a++) {
                            try {
                                if (Number(dojo.string.substitute(infoPodStatics[1].DateObservations[a], statsData[y].data)) == dojo.string.substitute(infoPodStatics[1].DateObservations[a], statsData[y].data)) {
                                    var utcMilliseconds = Number(dojo.string.substitute(infoPodStatics[1].DateObservations[a], statsData[y].data));
                                    xAxisData.push(dojo.date.locale.format(new Date(utcMilliseconds), { datePattern: infoPodStatics[1].DatePattern, selector: "date" }));
                                }
                            } catch (err) {
                                xAxisData.push(showNullValueAs);
                            }
                        }
                    }
                }
            }
        }
        catch (err) {
            chartData = null;
        }
    }
    else {
        if (dojo.dom.byId("divChartPod")) {
            RemoveChildren(dojo.dom.byId("divChartPod"));
        }
        HideGraphContainer();
    }
    //chartData determines whether the layer has statistical data or not
    if (chartData) {
        var divChart;
        if (dojo.dom.byId("divChartPod")) {
            RemoveChildren(dojo.dom.byId("divChartPod"));
            divChart = dojo.dom.byId("divChartPod");
        }
        else {
            divChart = document.createElement("div");
            divChart.id = "divChartPod";
            divChart.style.height = "80%";
            divChart.style.width = "90%";
            divChart.style.margin = "10px";
            dojo.dom.byId("divGraphContent").appendChild(divChart);
        }

        var chartNode = document.createElement("div");
        chartNode.id = "chartNodePod";
        divChart.appendChild(chartNode);
        setTimeout("PopulateChart(" + dojo.toJson(chartData) + "," + dojo.toJson(chartData) + "," + dojo.toJson(xAxisData) + ")", 1000);
    }
    else {
        if (dojo.dom.byId("divChartPod")) {
            RemoveChildren(dojo.dom.byId("divChartPod"));
        }
        HideGraphContainer();
    }
}

//Populate chart for the metric pod
function PopulateChart(chartData, data, xAxisData) {
    for (var c = 0; c < data.length; c++) {
        if ((chartData[c] == showNullValueAs) && (xAxisData[c] == showNullValueAs)) {
            chartData.splice(c, 1);
            xAxisData.splice(c, 1);
            data.splice(c, 1);
        }
        else if (chartData[c] == showNullValueAs) {
            chartData[c] = 0;
            data[c] = 0;
        }
    }

    var arrsort = chartData;
    arrsort.sort(function (x, y) {
        return x - y
    });

    var minVal = Number(arrsort[0]) - 10;
    var maxVal = Number(arrsort[(chartData.length - 1)]) + 10;

    chart = new dojox.charting.Chart2D("chartNodePod");
    //style the chart
    chart.margins.l = 0;
    chart.margins.t = 18;
    chart.margins.r = 0;
    chart.margins.b = 0;
    var myTheme = dojox.charting.themes.RoyalPurples;
    myTheme.chart.fill = "transparent";
    myTheme.plotarea.fill = "transparent";
    myTheme.axis.tick.color = "white";
    myTheme.marker.stroke.color = "white";
    myTheme.axis.tick.font = "normal normal normal 11px Verdana";
    myTheme.colors = ["white"];
    chart.setTheme(myTheme);
    chart.addPlot("default", {
        type: "Lines",
        markers: true
    });

    var label = [];
    for (var lbl = 0; lbl <= (xAxisData.length + 1); lbl++) {
        if ((lbl == 0) || (lbl == (xAxisData.length + 1))) {
            label.push({ value: lbl, text: "" });
        }
        else {
            label.push({ value: lbl, text: xAxisData[(lbl - 1)] });
        }
    }


    chart.addAxis("x", {
        stroke: "white", min: 1, max: (xAxisData.length + 1), fontColor: "white", minorTicks: false, minorLabels: false, microTicks: false, font: "normal normal normal 9pt verdana",
        hMajorLines: false, hMinorLines: false, fixLower: "major", fixUpper: "major", includeZero: false, title: "Reporting Period", titleGap: 10, titleFontColor: "#FFF", titleFont: "normal normal normal 11pt verdana", titleOrientation: "away",
        labels: label
    });

    chart.addAxis("y", { stroke: "white", min: minVal, max: maxVal, vertical: true, hMajorLines: false, fontColor: "white", font: "normal normal normal 9pt verdana",
        hMinorLines: false, fixLower: "major", fixUpper: "major", title: "Historical Observations", titleGap: 10, titleFont: "normal normal normal 11pt verdana", titleFontColor: "#FFF"
    });
    chart.addSeries("dashboard", data);
    chart.render();

    //Enable the graph container tab
    dojo.dom.byId("divGraphHeader").style.display = "block";
    dojo.dom.byId("divGraphHeader").style.color = "#FFFFFF";
    dojo.dom.byId("divGraphHeader").setAttribute("state", "enabled");
    dojo.dom.byId("divGraphHeader").style.cursor = "pointer";

    ResizeChartContainer();
}

//Toggle notes icon
function PopulateNotes(evt) {
    if (dojo.dom.byId("imgNotes").title == "Add Notes") {
        if (evt.getAttribute("state") == "unSelected") {
            dojo.dom.byId("imgNotes").src = "images/imgNotes_hover.png";
            evt.setAttribute("state", "selected");
            TogglePopup(false, ((!tempMap) ? map : tempMap));
        }
        else {
            dojo.dom.byId("imgNotes").src = "images/imgNotes.png";
            evt.setAttribute("state", "unSelected");
            TogglePopup(true, ((!tempMap) ? map : tempMap));
            if (!tempMap) {
                notesLayerClicked = false;
            }
            else {
                notesGraphicLayerClicked = false;
            }
        }
    }
}

//Toggle Popup
function TogglePopup(click, mapCtrl) {
    for (var p = 0; p < mapCtrl.graphicsLayerIds.length; p++) {
        var layer = mapCtrl.getLayer(mapCtrl.graphicsLayerIds[p]);
        if (click) {
            layer.infoTemplate = layer.Info;
            layer.Info = null;
        }
        else {
            layer.Info = layer.infoTemplate;
            layer.infoTemplate = null;
        }
    }
}

//Display graph container with Wipe-in animation
function ShowGraphDetails() {
    if (dojo.dom.byId("divGraphHeader").getAttribute("state") == "enabled") {
        ToggleHeaderPanels();
        if (dojo['dom-geometry'].getMarginBox("divGraphComponent").h <= 0) {
            dojo.dom.byId('divGraphComponent').style.right = (dojo['dom-geometry'].getMarginBox("holder").l + 15) + "px";
            dojo.dom.byId('divGraphComponent').style.height = "300px";
            dojo['dom-class'].replace("divGraphComponent", "showContainerHeight", "hideContainerHeight");
            dojo.dom.byId('showHide').style.top = '358px';
            ResizeChartContainer();
        }
    }
}

//Wipe-out panels for Address,Graph,More,Bookmark
function ToggleHeaderPanels() {
    if (dojo['dom-geometry'].getMarginBox("divAddressContent").h > 0) {
        dojo.dom.byId("imgSearch").src = "images/locate.png";
        dojo.dom.byId("imgLocate").src = "images/locate.png";
        dojo['dom-class'].replace("divAddressContent", "hideContainerHeight", "showContainerHeight");
        dojo.dom.byId('divAddressContent').style.height = '0px';
        dojo.dom.byId("imgSearchLoader").style.display = "none";
    }
    if (dojo['dom-geometry'].getMarginBox("divMoreContent").h > 0) {
        dojo.dom.byId("imgMore").src = "images/more.png";
        dojo['dom-class'].replace("divMoreContent", "hideContainerHeight", "showContainerHeight");
        dojo.dom.byId('divMoreContent').style.height = '0px';
    }
    if (dojo['dom-geometry'].getMarginBox("divBookmarkContent").h > 0) {
        dojo.dom.byId("imgBookmark").src = "images/imgBookmark.png";
        dojo['dom-class'].replace("divBookmarkContent", "hideContainerHeight", "showContainerHeight");
        dojo.dom.byId('divBookmarkContent').style.height = '0px';
    }
    if (dojo['dom-geometry'].getMarginBox("divGraphComponent").h > 0) {
        dojo['dom-class'].replace("divGraphComponent", "hideContainerHeight", "showContainerHeight");
        dojo.dom.byId('divGraphComponent').style.height = '0px';
        dojo.dom.byId('showHide').style.top = '59px';
    }
    dojo.dom.byId("showHide").style.display = "block";
}

//Hide containers
function HideContainer(value) {
    switch (value) {
        case 'locate':
            dojo.dom.byId("imgSearch").src = "images/locate.png";
            dojo['dom-class'].replace("divAddressContent", "hideContainerHeight", "showContainerHeight");
            dojo.dom.byId('divAddressContent').style.height = '0px';
            break;
        case 'bookmark':
            dojo.dom.byId("imgBookmark").src = "images/imgBookmark.png";
            dojo['dom-class'].replace("divBookmarkContent", "hideContainerHeight", "showContainerHeight");
            dojo.dom.byId('divBookmarkContent').style.height = '0px';
            break;
        case 'more':
            dojo.dom.byId("imgMore").src = "images/more.png";
            dojo['dom-class'].replace("divMoreContent", "hideContainerHeight", "showContainerHeight");
            dojo.dom.byId('divMoreContent').style.height = '0px';
            break;
    }
    dojo.dom.byId("showHide").style.display = "block";
}