/** @license
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
var notesArray = []; //array to store the notes
var noteCount = 0; //variable to count the notes symbols
var notesLayerClicked = false; //flag set to know whether notes layer is clicked or not
var infoContentFocus = null; //variable for storing the info content value when it is focused
var infoContentBlur = null; //variable for storing the info content value when it is focused out
var infoContentClose = null; //variable for storing the info content value when info window was closed
var charCount; //variable for storing the remaining characters count for note
var RSSCounter = 0;
var trendCounter = 0;

//function for creating the info pods for services
function CreateLayerPods(arrSubjectGroups, token, groupdata, indicatorState) {
    RemoveChildren(dojo.byId("divLayerContent"));
    RemoveChildren(dojo.byId("divNAEDisplayContent"));

    var table = document.createElement("table");
    table.cellSpacing = 0;
    table.cellPadding = 0;
    dojo.byId("divLayerContent").appendChild(table);
    var tBody = document.createElement("tbody");
    table.appendChild(tBody);
    var count = 0;
    for (var p in arrSubjectGroups) {
        if (count == 0) {
            var tr = document.createElement("tr");
            tBody.appendChild(tr);
            var td = document.createElement("td");
            tr.appendChild(td);
        }
        var divPod = document.createElement("div");
        divPod.className = "divPod";
        divPod.style.width = "200px";
        divPod.style.height = "150px";
        divPod.style.margin = "10px";
        var webId = "";
        var webTag = "";
        var webTitle = "";
        for (t in arrSubjectGroups[p]) {
            webId += arrSubjectGroups[p][t].webMapId + ",";
            webTag += p + ",";
            webTitle += arrSubjectGroups[p][t].title + ",";
        }
        divPod.setAttribute("WebId", webId);
        divPod.setAttribute("WebTag", webTag);
        divPod.setAttribute("webTitle", webTitle);
        for (var lay in layerImages) {
            if (arrSubjectGroups[p][0].tags[0] == layerImages[lay].Tag) {
                if (layerImages[lay].isPodVisible) {
                    divPod.setAttribute("podVisible", true);
                    break;
                }
            }
        }

        divPod.onclick = function (evt) {
            ShowProgressIndicator();
            if (map) {
                for (var e in map._layers) {
                    if (e.match("eventLayerId")) {
                        map.removeLayer(map._layers[e]);
                    }
                }
            }
            var tag = this.getAttribute("WebTag");
            var webMapId = this.getAttribute("WebId").split(",");
            var webMapTitle = this.getAttribute("WebTitle").split(",");
            var visibility = this.getAttribute("podVisible");
            createDataforPods(null, tag, webMapId, webMapTitle, visibility, token, arrSubjectGroups, groupdata, indicatorState);
        }
        td.appendChild(divPod);
        var divPodInner = document.createElement("div");
        divPodInner.className = "divPodInner";
        divPod.appendChild(divPodInner);
        var tablePod = document.createElement("table");
        tablePod.style.width = "100%";

        tablePod.cellPadding = 0;
        tablePod.cellSpacing = 0;
        divPodInner.appendChild(tablePod);
        var tBodyPod = document.createElement("tbody");
        tablePod.appendChild(tBodyPod);

        var tr2 = document.createElement("tr");
        tBodyPod.appendChild(tr2);
        var td2 = document.createElement("td");
        td2.align = "left";
        td2.style.paddingLeft = "10px";
        td2.style.paddingTop = "23px";
        tr2.appendChild(td2);
        var spanText = document.createElement("span");
        spanText.style.color = "white";
        spanText.style.fontSize = "16px";
        spanText.style.lineHeight = "22px";
        spanText.style.fontWeight = "bolder";
        spanText.innerHTML = p;
        td2.appendChild(spanText);

        for (var g in arrSubjectGroups[p]) {
            for (var j in indicatorState) {
                if (arrSubjectGroups[p][g].title == indicatorState[j].key) {
                    tablePod.style.height = "100%";
                    td2.style.paddingTop = "0px";
                    td2.height = "";
                    td2.colSpan = 2;

                    var trInd = document.createElement("tr");
                    tBodyPod.appendChild(trInd);
                    var tdInd = document.createElement("td");
                    tdInd.align = "left";
                    tdInd.style.paddingLeft = "10px";
                    trInd.appendChild(tdInd);

                    var spanImg = document.createElement("span");
                    spanImg.style.width = "100%";
                    spanImg.style.height = "100%";
                    tdInd.appendChild(spanImg);

                    var imgArr = document.createElement("img");
                    imgArr.style.width = "40px";
                    imgArr.style.height = "25px";
                    spanImg.appendChild(imgArr);

                    var td1 = document.createElement("td");
                    td1.align = "right";
                    td1.style.paddingRight = "10px";
                    trInd.appendChild(td1);

                    var spanText = document.createElement("span");
                    spanText.align = "right";
                    spanText.style.fontSize = "15px";
                    spanText.style.lineHeight = "22px";
                    spanText.style.fontWeight = "bolder";
                    spanText.innerHTML = arrSubjectGroups[p][g].title;
                    td1.appendChild(spanText);

                    var diff = (dojo.string.substitute(infoPodStatics[0].CurrentObservation, indicatorState[j].value) - dojo.string.substitute(infoPodStatics[0].LatestObservation, indicatorState[j].value));
                    if (diff > 0) {
                        imgArr.src = "images/up.png";
                        if (dojo.string.substitute(infoPodStatics[0].StaticsPosition, indicatorState[j].value) == "Yes") {
                            divPod.className = "divPodGreen";
                            divPodInner.className = "divPodInnerGreen";
                        }
                        else {
                            divPod.className = "divPodRed";
                            divPodInner.className = "divPodInnerRed";
                        }
                    }
                    else if (diff < 0) {
                        imgArr.src = "images/down.png";
                        if (dojo.string.substitute(infoPodStatics[0].LatestObservation, indicatorState[j].value) == "Yes") {
                            divPod.className = "divPodRed";
                            divPodInner.className = "divPodInnerRed";
                        }
                        else {
                            divPod.className = "divPodGreen";
                            divPodInner.className = "divPodInnerGreen";
                        }
                    }
                    else {
                        divPod.className = "divPod";
                        divPodInner.className = "divPodInner";
                    }
                    break;
                }
            }
        }
        count++;
    }
    CreateScrollbar(dojo.byId('divLayerContainer'), dojo.byId('divLayerContent'));
    if (share != "") {
        ShowProgressIndicator();
        if (map) {
            for (var e in map._layers) {
                if (e.match("eventLayerId")) {
                    map.removeLayer(map._layers[e]);
                }
            }
        }
        var group;
        if (window.location.href.split("$n=").length > 1) {
            group = window.location.href.split("$t=")[1].split("$n=")[0];
        }
        else {
            group = window.location.href.split("$t=")[1];
        }
        group = group.replace(/%20/g, " ");
        if (group != baseMapLayer[0].MapValue) {
            var flagBreak = false;

            for (var subjectGroup in arrSubjectGroups) {
                for (var t in arrSubjectGroups[subjectGroup]) {
                    if (group == arrSubjectGroups[subjectGroup][t].title) {
                        var tag = "";
                        var webMapId = "";
                        var webMapTitle = "";

                        for (var r in arrSubjectGroups[subjectGroup]) {
                            tag += subjectGroup + ",";
                            webMapId += arrSubjectGroups[subjectGroup][r].webMapId + ",";
                            webMapTitle += arrSubjectGroups[subjectGroup][r].title + ",";
                        }

                        webMapId = webMapId.split(",");
                        webMapTitle = webMapTitle.split(",");


                        var visibility = "";
                        for (var lay in layerImages) {
                            if (subjectGroup == layerImages[lay].Tag) {
                                if (layerImages[lay].isPodVisible) {
                                    visibility = true;
                                    break;
                                }
                            }
                        }
                        flagBreak = true;
                        break;
                    }
                }
                if (flagBreak)
                    break;
            }
            createDataforPods(group, tag, webMapId, webMapTitle, visibility, token, arrSubjectGroups, groupdata, indicatorState);
        }
    }
    HideProgressIndicator();
}

//function to get data for the group metric pods
function createDataforPods(group, tag, webMapId, webMapTitle, visibility, token, arrSubjectGroups, groupdata, indicatorState) {
    var webInfo = [];
    var counter = 0;
    for (var id in webMapId) {
        if (webMapId[id]) {
            var webmapDetails = esri.arcgis.utils.createMap(webMapId[id], "map", {
                mapOptions: {
                    slider: true
                }
            });

            webmapDetails.addErrback(function (error) {
                console.log("Map creation failed: ", dojo.toJson(error));
            });

            webmapDetails.addCallback(function (response) {
                map = response.map;
                map.destroy();

                counter++;
                var webmapInfo = {};
                webmapInfo.key = response.itemInfo.item.title;
                webmapInfo.id = response.itemInfo.item.id;
                webmapInfo.operationalLayers = response.itemInfo.itemData.operationalLayers;
                webmapInfo.baseMap = response.itemInfo.itemData.baseMap.baseMapLayers;
                webInfo.push(webmapInfo);
                if ((webMapId.length - 1) == counter) {
                    webInfo.sort(function (a, b) {
                        var nameA = a.key.toLowerCase(), nameB = b.key.toLowerCase()
                        if (nameA < nameB) //sort string ascending
                            return -1
                        if (nameA > nameB)
                            return 1
                        return 0 //default return value (no sorting)
                    });
                    RemoveChildren(dojo.byId("divServiceContainer"));
                    RemoveChildren(dojo.byId("trBottomHeaders"));
                    RemoveChildren(dojo.byId("trBottomTags"));
                    RemoveChildren(dojo.byId("tblMoreResults"));
                    if (!group) {
                        PopulateEventDetails(webInfo[0].id, arrSubjectGroups, tag.split(",")[0], webInfo[0], groupdata, token, true, visibility, null);
                    }
                    else {
                        for (var w = 0; w < webInfo.length; w++) {
                            if (group == webInfo[w].key) {
                                PopulateEventDetails(webInfo[w].id, arrSubjectGroups, tag.split(",")[0], webInfo[w], groupdata, token, true, visibility, null);
                                break;
                            }
                        }
                    }

                    if (visibility) {
                        var webStats = [];
                        for (var z in webInfo) {
                            for (var y in webInfo[z].operationalLayers) {
                                var str = webInfo[z].operationalLayers[y].url;
                                var ss = str.substring(((str.lastIndexOf("/")) + 1), (str.length))
                                if (!isNaN(ss)) {
                                    webStats.push({ title: webInfo[z].key, url: webInfo[z].operationalLayers[y].url });
                                }
                            }
                        }
                        var statsData = [];
                        FetchStatData(webStats, 0, statsData, webInfo, groupdata, token);
                    }
                    else {
                        dojo.byId("divServiceDetails").style.display = "none";
                        dojo.replaceClass("divGraphComponent", "hideContainerHeight", "showContainerHeight");
                        dojo.byId('divGraphComponent').style.height = '0px';
                        dojo.byId('showHide').style.top = '59px';
                        dojo.byId("divGraphHeader").style.color = "gray";
                        dojo.byId("divGraphHeader").setAttribute("state", "disabled");
                        dojo.byId("divGraphHeader").style.cursor = "default";
                        if (share != "") {
                            shareOnLoad = false;
                        }
                    }
                }
            });
        }
    }
}

//function for fetching the statistical data for the info pods
function FetchStatData(webStats, inc, statsData, webInfo, groupdata, token) {
    dojo.byId("divGraphHeader").style.color = "#FFFFFF";
    dojo.byId("divGraphHeader").setAttribute("state", "enabled");
    dojo.byId("divGraphHeader").style.cursor = "pointer";
    if (webStats.length) {
        if (webStats[inc]) {
            if (webStats[inc].url) {
                queryTask = new esri.tasks.QueryTask(webStats[inc].url);
                var queryCounty = new esri.tasks.Query();
                queryCounty.where = "1=1";
                queryCounty.returnGeometry = false;
                queryCounty.outFields = ["*"];
                queryCounty.spatialRelationship = esri.tasks.Query.SPATIAL_REL_WITHIN;
                queryTask.execute(queryCounty, function (featureSet) {
                    statsData.push({ title: webStats[inc].title, data: featureSet.features[0].attributes, fields: featureSet.fields });
                    inc++;
                    if (webStats.length == statsData.length) {
                        CreateGroupPods(webInfo, groupdata, token, statsData);
                        dojo.disconnect(handlePoll);
                        CreateHorizontalScrollbar(dojo.byId('divServiceData'), dojo.byId("carouselscroll"));
                    }
                    FetchStatData(webStats, inc, statsData, webInfo, groupdata, token);
                }, function (err) {
                    alert(err.message);
                    HideProgressIndicator();
                    return;
                });
            }
        }
    }
    else {
        CreateGroupPods(webInfo, groupdata, token, null);
    }
}

//function for fetching the RSS feeds news and twitter trends through local storage
function PopulateNews(evt) {
    ShowProgressIndicator();
    RSSCounter = 0;
    trendCounter = 0;
    RemoveChildren(dojo.byId("divNAEDisplayContent"));
    setTimeout(function () {
        if (rss.length == 0) {
            rss.push({
                "name": defaultNewsFields[0].RSSFeedName,
                "url": defaultNewsFields[0].RSSFeedURL,
                "checked": true,
                "type": "default"
            });
        }

        if (trends.length == 0) {
            trends.push({
                "name": defaultNewsFields[1].TwitterTrendName,
                "type": "default"
            });
        }

        if (evt.id == "btnNews") {
            dojo.byId("btnNews").className = "customButton";
            dojo.byId("btnTrends").className = "customDisabledButton";

            dojo.byId("btnNews").style.cursor = "default";
            dojo.byId("btnTrends").style.cursor = "pointer";
            CreateScrollbar(dojo.byId('divNAEDisplayContainer'), dojo.byId('divNAEDisplayContent'));

            if (localStorage.getItem("RSSFeedCollection")) {
                if (dojo.fromJson(localStorage.getItem("RSSFeedCollection")).length > 0) {
                    rss = dojo.fromJson(localStorage.getItem("RSSFeedCollection"));
                }
            }

            var chkfeedCount = 0;
            var lastOrder = 0;

            if (rss) {
                for (var c = 0; c < rss.length; c++) {
                    if (rss[c].checked) {
                        chkfeedCount++;
                    }
                }
                FetchNews(0, lastOrder, 0, chkfeedCount);
            }
        } else {
            dojo.byId("btnNews").className = "customDisabledButton";
            dojo.byId("btnTrends").className = "customButton";
            dojo.byId("btnNews").style.cursor = "pointer";
            dojo.byId("btnTrends").style.cursor = "default";

            if (localStorage.getItem("TwitterTrendCollection")) {
                if (dojo.fromJson(localStorage.getItem("TwitterTrendCollection")).length > 0) {
                    trends = dojo.fromJson(localStorage.getItem("TwitterTrendCollection"));
                }
            }
            CreateScrollbar(dojo.byId('divNAEDisplayContainer'), dojo.byId('divNAEDisplayContent'));

            var lastOrder = 0;
            if (trends) {
                FetchNews(null, lastOrder, 0, null);
            }
        }
    }, 500);
}

//function to fetch the news and events
function FetchNews(chkCount, lastOrder, news, chkfeedCount) {
    if (chkCount != null) {
        var q = news;
        if (!rss[q].checked) {
            if (chkCount == (rss.length - 1)) {
                HideProgressIndicator();
            }
            chkCount++;
        }
        if (rss[q].checked) {
            esri.request({
                url: rss[q].url,
                handleAs: "xml",
                load: function (candidates) {
                    if (chkCount != null) {
                        var table = document.createElement("table");
                        dojo.byId("divNAEDisplayContent").appendChild(table);
                        var tBody = document.createElement("tbody");
                        table.appendChild(tBody);
                        table.cellSpacing = 0;
                        table.cellPadding = 0;
                        if (candidates) {
                            for (var i = 0; i < candidates.getElementsByTagName(rssFields[0]).length; i++) {
                                var RSSHeader = candidates.getElementsByTagName(rssFields[0])[i].getElementsByTagName(rssFields[1])[0].childNodes;
                                var RSSLink = candidates.getElementsByTagName(rssFields[0])[i].getElementsByTagName(rssFields[2])[0].childNodes;
                                var RSSContent = candidates.getElementsByTagName(rssFields[0])[i].getElementsByTagName(rssFields[3])[0].childNodes;
                                CreateNewsDataTemplate(RSSHeader, RSSLink, RSSContent, tBody, true, lastOrder);
                                lastOrder++;
                            }
                            RSSCounter++;
                            OnNewsFeedsUpdateEnd(chkfeedCount);
                        }
                        else {
                            RSSCounter++;
                            OnNewsFeedsUpdateEnd(chkfeedCount);
                            alert(messages.getElementsByTagName("noResults")[0].childNodes[0].nodeValue + " " + rss[q].name);
                            HideProgressIndicator();
                        }
                        q++;
                        if (q != rss.length) {
                            FetchNews(chkCount, lastOrder, q, chkfeedCount);
                        }
                    }
                },
                error: function (error) {
                    q++;
                    RSSCounter++;
                    OnNewsFeedsUpdateEnd(chkfeedCount);
                    HideProgressIndicator();
                    alert(error.message);
                }
            }, {
                useProxy: true
            });
        }
        else {
            q++;
            if (q != rss.length) {
                FetchNews(chkCount, lastOrder, q, chkfeedCount);
            }
        }
    }
    else {
        var trend = news;
        esri.request({
            url: twitterDetails[0].TwitterURL,
            handleAs: "xml",
            content: {
                q: trends[trend].name
            },
            load: function (candidates) {
                if (chkCount == null) {
                    var table = document.createElement("table");
                    dojo.byId("divNAEDisplayContent").appendChild(table);
                    var tBody = document.createElement("tbody");
                    table.appendChild(tBody);
                    table.cellSpacing = 0;
                    table.cellPadding = 0;
                    if (candidates) {
                        for (var i = 0; i < candidates.getElementsByTagName(twitterDetails[1].Fields[0]).length; i++) {
                            var trendHeader = candidates.getElementsByTagName(twitterDetails[1].Fields[0])[i].getElementsByTagName(twitterDetails[1].Fields[1])[0].childNodes;
                            var trendLink = candidates.getElementsByTagName(twitterDetails[1].Fields[0])[i].getElementsByTagName(twitterDetails[1].Fields[2])[0].childNodes;
                            var trendContent = candidates.getElementsByTagName(twitterDetails[1].Fields[0])[i].getElementsByTagName(twitterDetails[1].Fields[3])[0].childNodes;
                            CreateNewsDataTemplate(trendHeader, trendLink, trendContent, tBody, false, lastOrder);
                            lastOrder++;
                        }
                        trendCounter++;
                        OnNewsFeedsUpdateEnd(null);
                    }
                    else {
                        trendCounter++;
                        OnNewsFeedsUpdateEnd(null);
                        alert(messages.getElementsByTagName("noResults")[0].childNodes[0].nodeValue + " " + trends[trend].name);
                        HideProgressIndicator();
                    }
                    trend++;
                    if (trend != trends.length) {
                        FetchNews(null, lastOrder, trend, chkfeedCount);
                    }
                }
            },
            error: function (error) {
                trend++;
                trendCounter++;
                OnNewsFeedsUpdateEnd(null);
                HideProgressIndicator();
                alert(error.message);
            }
        }, {
            useProxy: true
        });
    }
}

//function to call when all the feeds are loaded completely
function OnNewsFeedsUpdateEnd(chkfeedCount) {
    if (chkfeedCount) {
        if (RSSCounter == chkfeedCount) {
            CreateScrollbar(dojo.byId('divNAEDisplayContainer'), dojo.byId('divNAEDisplayContent'));
            HideProgressIndicator();
        }
    }
    else {
        if (trendCounter == trends.length) {
            CreateScrollbar(dojo.byId('divNAEDisplayContainer'), dojo.byId('divNAEDisplayContent'));
            HideProgressIndicator();
        }
    }
}


//function for creating structure for news and trends
function CreateNewsDataTemplate(Header, Link, Content, tBody, feed, lastVal) {
    var tr = document.createElement("tr");
    tBody.appendChild(tr);
    var td1 = document.createElement("td");
    td1.style.paddingTop = "5px";
    td1.style.paddingLeft = "5px";
    td1.style.paddingRight = "10px";
    if (Header.length) {
        if (feed) {
            td1.innerHTML = "<u>" + Header[0].nodeValue + "</u>";
        }
        else {
            td1.innerHTML = "<u>" + Header[0].nodeValue.split("(")[1].split(")")[0] + "</u>";
        }
    }

    if (Link.length) {
        td1.setAttribute("link", Link[0].nodeValue);
    }

    if (lastVal % 2 != 0) {
        td1.className = "listDarkColor";
    } else {
        td1.className = "listLightColor";
    }

    td1.onclick = function () {
        window.open(this.getAttribute("link"));
    }
    td1.style.fontWeight = "bolder";
    td1.align = "left";
    td1.style.cursor = "pointer";
    td1.height = 20;
    tr.appendChild(td1);
    var tr1 = document.createElement("tr");
    tBody.appendChild(tr1);
    var td2 = document.createElement("td");
    td2.style.paddingBottom = "5px";
    td2.style.paddingLeft = "5px";
    td2.style.paddingRight = "10px";
    if (Content.length) {
        td2.innerHTML = Content[0].nodeValue;
        td2.title = td2.textContent;
        td2.innerHTML = td2.textContent.trimString(50);
    }
    if (lastVal % 2 != 0) {
        td2.className = "listDarkColor";
    } else {
        td2.className = "listLightColor";
    }

    td2.align = "left";
    td2.style.borderBottom = "#000000 1px solid";
    if (td2.innerHTML) {
        td2.height = 20;
    }
    tr1.appendChild(td2);
}

//function to display the map page with the animation effects
function PopulateEventDetails(id, arrSubjectGroups, header, webmapInfo, groupdata, token, state, podsVisibility, bottomOffset) {
    if (dojo.byId("btnMap").className != "customDisabledButton") {
        dojo.byId("imgSocialMedia").setAttribute("subjectGroup", header);
        dojo.byId("imgSocialMedia").setAttribute("mapName", webmapInfo.key);

        dojo.byId("imgGeolocation").src = "images/imgGeolocation.png";
        ShowProgressIndicator();
        if (dojo.byId("imgNotes").getAttribute("state") != "unSelected") {
            dojo.byId("imgNotes").src = "images/imgNotes.png";
            dojo.byId("imgNotes").setAttribute("state", "unSelected");
        }
        if (map) {
            HideInfoContainer();
            if (map._layers) {
                for (var e in map._layers) {
                    if (e.match("eventLayerId")) {
                        map.removeLayer(map._layers[e]);
                    }
                }
            }
        }
        if (state) {
            dojo.byId("divTextContainer").style.width = dojo.window.getBox().w + "px";
            dojo.byId("divTextContainer").style.height = dojo.window.getBox().h + "px";

            FadeOut(dojo.byId('divApplicationHeader'));
            FadeOut(dojo.byId('divInfoContainer'));
            FadeOut(dojo.byId('divSettingsContainer'));
            FadeIn(dojo.byId('divMapApplicationHeader'));
            FadeIn(dojo.byId("divBottomContainer"));
            FadeIn(dojo.byId('map'));
            FadeIn(dojo.byId('divServiceDetails'));
            FadeIn(dojo.byId('showHide'));
            if (retainState) {
                FadeIn(dojo.byId('divGraphComponent'));
                FadeIn(dojo.byId('divBookmarkContent'));
                FadeIn(dojo.byId('divAddressContent'));
            }
        }
        setTimeout(function () {
            if (state) {
                dojo.byId("divTextContainer").style.width = "100%";
                dojo.byId("divTextContainer").style.height = "100%";
                dojo.byId("divTextContainer").style.display = "none";
                dojo.byId("divMapContainer").style.display = "block";

                dojo.byId("tdEventName").innerHTML = header;
                dojo.byId("map").style.display = "block";
                dojo.byId('map').style.marginLeft = (dojo.coords("holder").l) + "px";
                dojo.byId('showHide').style.right = (dojo.coords("holder").l + 15) + "px";
                dojo.byId('map').style.height = "100%";
                dojo.byId('map').style.width = "100%";
                ToggleContainers();
            }
            if (arrSubjectGroups) {
                CreateBottomHeaders(arrSubjectGroups, groupdata, token, header, bottomOffset);
            }
            selectedPoint = null;

            if (map) {
                map.removeAllLayers();
                map.destroy();
            }
            var mapDeferred;
            if (share != "") {
                startExtent = window.location.href.split("?extent=")[1].split("$t=")[0];
                zoomExtent = startExtent.split(',');
                startExtent = new esri.geometry.Extent(parseFloat(zoomExtent[0]), parseFloat(zoomExtent[1]), parseFloat(zoomExtent[2]), parseFloat(zoomExtent[3]), map.spatialReference);
            }
            if (startExtent) {
                mapDeferred = esri.arcgis.utils.createMap(id, "map", {
                    mapOptions: {
                        slider: true,
                        extent: startExtent
                    }
                });
            }
            else {
                mapDeferred = esri.arcgis.utils.createMap(id, "map", {
                    mapOptions: {
                        slider: true
                    }
                });
            }
            mapDeferred.addCallback(function (response) {
                map = response.map;
                startExtent = map.extent;

                dojo.connect(map, "onExtentChange", function (evt) {
                    startExtent = map.extent;
                });
                if (map.loaded) {
                    MapInitFunction(groupdata, token, webmapInfo, podsVisibility, id);
                }
                else {
                    dojo.connect(map, "onLoad", function () {
                        MapInitFunction(groupdata, token, webmapInfo, podsVisibility, id);
                    });
                }

            });
            mapDeferred.addErrback(function (error) {
                console.log("Map creation failed: ", dojo.toJson(error));
            });
        }, (state) ? 500 : 0);
    }
}

//function calls when map object initialized
function MapInitFunction(groupdata, token, webmapInfo, podsVisibility, id) {
    if (dojo.query('.logo-med', dojo.byId('map')).length > 0) {
        dojo.query('.logo-med', dojo.byId('map'))[0].id = "imgESRILogo";
    }
    else if (dojo.query('.logo-sm', dojo.byId('map')).length > 0) {
        dojo.query('.logo-sm', dojo.byId('map'))[0].id = "imgESRILogo";
    }

    if (dojo.query('.esriControlsBR').length > 0) {
        dojo.query('.esriControlsBR')[0].style.bottom = "75px";
    }
    dojo.addClass("imgESRILogo", "esriLogo");
    var gLayer = new esri.layers.GraphicsLayer();
    gLayer.id = tempGraphicsLayerId;
    map.addLayer(gLayer);
    noteCount = 0;
    dojo.connect(dojo.query(".esriPopup .titleButton .maximize")[0], "onclick", function (info) {
        if (dojo.byId("txtArea")) {
            if (dojo.query(".contentPane")[0].style.height) {
                dojo.byId("txtArea").style.height = (dojo.query(".contentPane")[0].style.height.split("p")[0] - 100) + "px";
            }
            else {
                dojo.byId("txtArea").style.height = "100px";
            }
        }
    });

    var gLayer1 = new esri.layers.GraphicsLayer();
    gLayer1.id = "tempNotesLayerId";
    dojo.connect(gLayer1, "onClick", function (evt) {
        evt.cancelBubble = true;
        if (evt.stopPropagation) evt.stopPropagation();
        evt.preventDefault();
        notesLayerClicked = true;
        if (evt.graphic.attributes[0].note) {
            map.infoWindow.hide();
            for (var q = 0; q < map.getLayer("tempNotesLayerId").graphics.length; q++) {
                if (!map.getLayer("tempNotesLayerId").graphics[q].attributes[0].note) {
                    map.getLayer("tempNotesLayerId").remove(map.getLayer("tempNotesLayerId").graphics[q]);
                }
            }

        } else {
            RemoveGraphic(null, noteCount, webmapInfo.key, null);
        }
        ShowNotesInfo(evt.graphic.attributes[0], evt.graphic.geometry, webmapInfo.key, evt.graphic, Number(evt.graphic.attributes[0].count));
    });
    map.addLayer(gLayer1);

    if (sessionStorage.getItem("notes" + webmapInfo.key)) {
        var nStore = dojo.fromJson(sessionStorage.getItem("notes" + webmapInfo.key));
        CreateGraphic(nStore, webmapInfo, true);
    }
    else {
        dojo.byId("imgSocialMedia").setAttribute("noteGraphics", null);
        dojo.byId("imgSocialMedia").setAttribute("shareNotesLink", null);
    }

    if (share != "") {
        var group;
        if (window.location.href.split("$n=").length > 1) {
            group = window.location.href.split("$t=")[1].split("$n=")[0];
        }
        else {
            group = window.location.href.split("$t=")[1];
        }
        group = group.replace(/%20/g, " ");
        if (!sessionStorage.getItem("notes" + webmapInfo.key)) {
            if (webmapInfo.key == group) {
                var nStore = [];
                if (window.location.href.split("$n=").length > 1) {
                    var note = window.location.href.split("$n=")[1];
                    note = note.replace(/\[/g, "%5B");
                    note = note.replace(/\]/g, "%5D");
                    note = note.replace(/\\n/g, "%5Cn");
                    note = note.replace(/\\/g, "%5C");
                    note = note.replace(/\%27/g, "'");

                    if ((encodeURIComponent(window.location.href.split("$n=")[0] + "$n=") + note.replace(/\,/g, "%2C")).length >= 1425) {
                        dojo.byId("imgNotes").title = "App has reached its annotation capacity for this map";
                        dojo.byId("imgNotes").setAttribute("noteCount" + webmapInfo.key.replace(/ /g, ""), "disabled");
                    }
                    else {
                        dojo.byId("imgNotes").title = "Add Notes";
                        dojo.byId("imgNotes").setAttribute("noteCount" + webmapInfo.key.replace(/ /g, ""), "enabled");
                    }

                    var str = note.substring(3, (note.length - 3));
                    var noteString = str.split("%5D,");
                    for (var c = 0; c < noteString.length; c++) {
                        var internalStr
                        if (c != (noteString.length - 1)) {
                            internalStr = noteString[c].substring(3, (noteString[c].length));
                        }
                        else {
                            internalStr = noteString[c].substring(3, (noteString[c].length - 3));
                        }
                        var internalNote = internalStr.split(",");
                        var counter = 0;
                        var displayNote = internalStr.split(internalNote[1])[1];
                        displayNote = displayNote.substring(4, (displayNote.length - 3));

                        for (var z = 0; z < displayNote.length; z++) {
                            try {
                                displayNote = decodeURIComponent(displayNote);
                                for (var y = 0; y < counter; y++) {
                                    displayNote = displayNote.concat(".");
                                    displayNote = decodeURIComponent(displayNote.replace(/\+/g, " "));
                                }
                                break;
                            }
                            catch (err) {
                                displayNote = displayNote.substring(0, (displayNote.length - 1));
                                counter++;
                            }
                        }

                        displayNote = ReplaceWithSpecialCharacters(displayNote);
                        nStore.push([{ rings: [parseFloat(internalNote[0]), parseFloat(internalNote[1])], notes: displayNote, sr: map.spatialReference, key: window.location.href.split("$t=")[1].split("$n=")[0].replace(/%20/g, " "), count: (c + 1)}]);
                    }
                    CreateGraphic(nStore, webmapInfo, false);
                }
            }
        }
    }

    HideProgressIndicator();
    HideInfoContainer();

    if (dojo.byId("imgNotes").getAttribute("noteCount" + webmapInfo.key.replace(/ /g, "")) == "disabled") {
        dojo.byId("imgNotes").title = "App has reached its annotation capacity for this map";
    }
    else {
        dojo.byId("imgNotes").title = "Add Notes";
    }


    dojo.connect(map, "onClick", function (evt) {
        if (dojo.byId("imgNotes").getAttribute("state") != "unSelected") {
            HideInfoContainer();
            var iconSize = ((isBrowser) ? 30 : 44);
            var symbol = new esri.symbol.PictureMarkerSymbol("images/notesGraphic.png", iconSize, iconSize);
            noteCount++;
            var att = [];
            att.push({ count: noteCount });
            var graphic = new esri.Graphic(evt.mapPoint, symbol, att, null);
            map.getLayer("tempNotesLayerId").add(graphic);
            notesLayerClicked = true;
            ShowNotesInfo(null, evt.mapPoint, webmapInfo.key, null, noteCount);
            dojo.byId("imgNotes").src = "images/imgNotes.png";
            dojo.byId("imgNotes").setAttribute("state", "unSelected");
        }
        else if (!notesLayerClicked) {
            if (dojo.query(".esriPopup .actionsPane .action").length > 0) {
                dojo.query(".esriPopup .actionsPane .action")[0].style.display = "block";
            }
            RemoveGraphic(null, noteCount, webmapInfo.key, null);
        }
    });
}

//function to add the existing note graphics on the map
function CreateGraphic(nStore, webmapInfo, content) {
    var iconSize = ((isBrowser) ? 30 : 44);
    var symbol = new esri.symbol.PictureMarkerSymbol("images/notesGraphic.png", iconSize, iconSize);


    for (var n = 0; n < nStore.length; n++) {
        if (nStore[n][0].key == webmapInfo.key) {
            var attributes = [];
            attributes.push({ note: nStore[n][0].notes, count: nStore[n][0].count });
            var point = new esri.geometry.Point(nStore[n][0].rings[0], nStore[n][0].rings[1], map.spatialReference);
            var graphics = new esri.Graphic(point, symbol, attributes, null);
            map.getLayer("tempNotesLayerId").add(graphics);
            noteCount++;
        }
    }
    if (!content) {
        notesArray = nStore;
        sessionStorage.setItem("notes" + webmapInfo.key, dojo.toJson(nStore));
    }
    dojo.byId("imgSocialMedia").setAttribute("noteGraphics", sessionStorage.getItem("notes" + webmapInfo.key));
    var attrData = [];
    attrData = PopulateNotesData(webmapInfo.key);

    dojo.byId("imgSocialMedia").setAttribute("shareNotesLink", dojo.toJson(attrData));
}

//function to get the data with the latest added notes
function PopulateNotesData(key) {
    var nArray = [];
    var shareNotes = [];
    if (dojo.byId("imgSocialMedia").getAttribute("noteGraphics")) {
        shareNotes = dojo.fromJson(dojo.byId("imgSocialMedia").getAttribute("noteGraphics"));
        if (shareNotes) {
            for (var n = 0; n < shareNotes.length; n++) {
                if (shareNotes[n][0].key == key) {
                    nArray.push([shareNotes[n][0].rings[0], shareNotes[n][0].rings[1], shareNotes[n][0].notes]);
                }
            }
        }
    }
    return nArray;
}


//function to display info window for notes
function ShowNotesInfo(feature, geometry, key, render, note) {
    mapExtent = GetMapExtent();
    var url = esri.urlToObject(window.location.toString());
    nArray = PopulateNotesData(key);

    var urlStr;
    var notesLength;
    var val;
    var level;
    var shareContent = "?extent=" + mapExtent + "$t=" + dojo.byId("imgSocialMedia").getAttribute("mapName") + "$n=";

    if (nArray.length > 0) {
        dojo.byId("imgSocialMedia").setAttribute("shareNotesLink", encodeURIComponent(dojo.toJson(nArray)));
        urlStr = encodeURIComponent(url.path) + encodeURIComponent(shareContent) + encodeURIComponent(dojo.toJson(nArray));

        val = (render) ? 1425 : (1419 - (geometry.x.toString().length + geometry.y.toString().length));
        level = urlStr.length;

        if (!render) {
            if (urlStr.length < (1328 + (geometry.x.toString().length + geometry.y.toString().length))) {
                val = (val - (15));
            }
            else {
                alert((urlStr.length - (1328 + (geometry.x.toString().length + geometry.y.toString().length))) + " " + messages.getElementsByTagName("exceededLimit")[0].childNodes[0].nodeValue);
                RemoveGraphic(null, note, key, true);
                return;
            }
        }
    }
    else {
        urlStr = encodeURIComponent(url.path) + encodeURIComponent(shareContent);
        val = (1401 - (geometry.x.toString().length + geometry.y.toString().length));
        level = urlStr.length;
    }
    if (urlStr.length == 1425) {
        notesLength = "No character(s) remain";
    }
    else {
        notesLength = (val - urlStr.length) + " character(s) remain";
    }


    var divContainer = document.createElement("div");
    divContainer.id = "noteContainer";

    var divContent = document.createElement("div");
    divContent.id = "divContent";
    divContainer.appendChild(divContent);

    var txtArea = document.createElement("textarea");
    txtArea.id = "txtArea";
    txtArea.setAttribute("placeholder", "Add your notes here");
    txtArea.className = "txtArea";

    divContent.appendChild(txtArea);

    if (feature) {
        if (feature.note) {
            txtArea.value = feature.note.trim();
        }
    }
    else {
        txtArea.value = "";
    }

    if (infoContentBlur) {
        dojo.disconnect(infoContentBlur);
    }

    if (infoContentFocus) {
        dojo.disconnect(infoContentFocus);
    }
    infoContentFocus = dojo.connect(txtArea, "onfocus", function () {
        if ((val - level) <= 0) {
            this.setAttribute("capacity", encodeURIComponent(dojo.toJson(this.value.trim()).substring(1, (dojo.toJson(this.value.trim()).length - 1))).length);
        }
        this.setAttribute("dVal", encodeURIComponent(dojo.toJson(this.value.trim()).substring(1, (dojo.toJson(this.value.trim()).length - 1))));
        this.setAttribute("value", this.value.trim());
    })


    infoContentBlur = dojo.connect(txtArea, "onblur", function () {
        if (this.getAttribute("value") != this.value.trim()) {
            var store = dojo.toJson(this.value.trim()).substring(1, (dojo.toJson(this.value.trim()).length - 1));
            store = ReplaceWithSpecialCharacters(store);

            if (this.value.trim() != "") {
                var counter = 0;
                var store1 = encodeURIComponent(dojo.toJson(this.value.trim()).substring(1, (dojo.toJson(this.value.trim()).length - 1)));
                var store2;
                var cap;
                if ((val - level) <= 0) {
                    cap = Number(this.getAttribute("capacity"));
                }
                else {
                    cap = (val - level);
                }

                if (this.getAttribute("dVal")) {
                    if (store1.length < this.getAttribute("dVal").length) {
                        cap = this.getAttribute("dVal").length;
                    }
                    else {
                        cap = (this.getAttribute("dVal").length + charCount);
                    }
                }

                if (store1.length > cap) {
                    store1 = store1.substring(0, cap);
                    for (var z = 0; z < store1.length; z++) {
                        try {
                            store2 = decodeURIComponent(store1);
                            for (var y = 0; y < counter; y++) {
                                store1 = store1.concat(".");
                                store2 = decodeURIComponent(store1);
                            }
                            break;
                        }
                        catch (err) {
                            store1 = store1.substring(0, (store1.length - 1));
                            counter++;
                        }
                    }
                    if (store2) {
                        store2 = ReplaceWithSpecialCharacters(store2);
                        this.value = store2;
                        store = this.value;
                    }
                }
                SaveNotes(geometry, key, note, store);
                mapExtent = GetMapExtent();
                var url = esri.urlToObject(window.location.toString());
                nArray = PopulateNotesData(key);
                var urlSt;
                if (nArray.length > 0) {
                    urlSt = encodeURIComponent(url.path) + encodeURIComponent(shareContent) + encodeURIComponent(dojo.toJson(nArray));

                    if ((urlSt.length == 1425) && (encodeURIComponent(this.value).length >= (1425 - urlSt.length))) {
                        dojo.byId("imgNotes").title = "App has reached its annotation capacity for this map";
                        dojo.byId("imgNotes").setAttribute("noteCount" + key.replace(/ /g, ""), "disabled");
                        dojo.byId("spnResultContainer").innerHTML = "No character(s) remain";
                    }
                    else {
                        dojo.byId("imgNotes").title = "Add Notes";
                        dojo.byId("imgNotes").setAttribute("noteCount" + key.replace(/ /g, ""), "enabled");
                        dojo.byId("spnResultContainer").innerHTML = (1425 - urlSt.length) + " character(s) remain";
                    }
                    charCount = (1425 - urlSt.length);
                    dojo.byId("imgSocialMedia").setAttribute("shareNotesLink", encodeURIComponent(dojo.toJson(nArray)));
                }
            }
        }
    });

    var tblActionContainer = document.createElement("table");
    tblActionContainer.style.width = "97%";
    tblActionContainer.style.height = "100%";
    divContainer.appendChild(tblActionContainer);
    var tbodyActionContainer = document.createElement("tbody");
    tblActionContainer.appendChild(tbodyActionContainer);
    var trActionContainer = document.createElement("tr");
    tbodyActionContainer.appendChild(trActionContainer);

    var tdButtonContainer = document.createElement("td");
    trActionContainer.appendChild(tdButtonContainer);


    var divButton = document.createElement("div");
    divButton.style.width = "85px";
    divButton.style.marginTop = "3px";
    divButton.className = "customButton";
    divButton.onclick = function () {
        RemoveGraphic(render, note, key, true);
    }
    tdButtonContainer.appendChild(divButton);

    var tblButton = document.createElement("table");
    tblButton.style.width = "100%";
    tblButton.style.height = "100%";
    divButton.appendChild(tblButton);

    var tbodyButton = document.createElement("tbody");
    tblButton.appendChild(tbodyButton);

    var trButton = document.createElement("tr");
    tbodyButton.appendChild(trButton);

    var tdButton = document.createElement("td");
    tdButton.align = "center";
    tdButton.style.verticalAlign = "middle";
    tdButton.innerHTML = "Delete";
    trButton.appendChild(tdButton);

    var tdResultContainer = document.createElement("td");
    tdResultContainer.align = "right";
    trActionContainer.appendChild(tdResultContainer);

    var spnResultContainer = document.createElement("span");
    spnResultContainer.id = "spnResultContainer";
    spnResultContainer.innerHTML = notesLength;
    tdResultContainer.appendChild(spnResultContainer);
    selectedPoint = geometry;

    setTimeout(function () {
        if ((!feature) || (feature.note)) {
            for (var q = 0; q < map.getLayer("tempNotesLayerId").graphics.length; q++) {
                if (map.getLayer("tempNotesLayerId").graphics[q].attributes[0]) {
                    if (map.getLayer("tempNotesLayerId").graphics[q].attributes[0].count == note) {
                        map.infoWindow.setTitle("Notes");
                        map.infoWindow.setContent(divContainer);
                        if (dojo.query(".esriPopup .actionsPane .action").length > 0) {
                            dojo.query(".esriPopup .actionsPane .action")[0].style.display = "none";
                        }
                        map.infoWindow.show(geometry, map.getInfoWindowAnchor(map.toScreen(geometry)));
                        break;
                    }
                }
            }
        }
    }, 1500);
    notesLayerClicked = false;
    if (infoContentClose) {
        dojo.disconnect(infoContentClose);
    }
    infoContentClose = dojo.connect(dojo.query(".esriPopup .titleButton.close")[0], "onclick", function () {
        if (!notesLayerClicked) {
            RemoveGraphic(render, note, key, false);
        }
    });
}

//function to replace encode values with special characters
function ReplaceWithSpecialCharacters(str) {
    str = str.replace(/\\n/g, "\n");
    str = str.replace(/\\r/g, "\r");
    str = str.replace(/\\t/g, "\t");
    str = str.replace(/\\b/g, "\b");
    str = str.replace(/\\f/g, "\f");
    str = str.replace(/\\'/g, "'");
    str = str.replace(/\\"/g, '"');
    return str;
}


//function to save the notes
function SaveNotes(geometry, key, note, store) {
    var attributes = [];
    attributes.push({ note: store, count: note });
    for (var q = 0; q < map.getLayer("tempNotesLayerId").graphics.length; q++) {
        if (map.getLayer("tempNotesLayerId").graphics[q].attributes[0]) {
            if (map.getLayer("tempNotesLayerId").graphics[q].attributes[0].count == note) {
                map.getLayer("tempNotesLayerId").graphics[q].attributes[0] = attributes[0];
            }
        }
        else {
            if (map.getLayer("tempNotesLayerId").graphics[q].attributes.count == note) {
                map.getLayer("tempNotesLayerId").graphics[q].attributes[0] = attributes[0];
            }
        }
    }
    var geometrySym = false;

    for (var z = 0; z < notesArray.length; z++) {
        if (notesArray[z][0].key == key) {
            if (notesArray[z][0].count == note) {
                notesArray[z][0].notes = store;
                geometrySym = true;
                break;
            }
        }
    }
    if (!geometrySym) {
        notesArray.push([{ rings: [geometry.x, geometry.y], sr: geometry.spatialReference.wkid, key: key, notes: store, count: note}]);
    }
    sessionStorage.setItem("notes" + key, dojo.toJson(notesArray));
    dojo.byId("imgSocialMedia").setAttribute("noteGraphics", sessionStorage.getItem("notes" + key));
    nArray = PopulateNotesData(key);
    dojo.byId("imgSocialMedia").setAttribute("shareNotesLink", encodeURIComponent(dojo.toJson(nArray)));
}

//function to remove the note graphic from the map
function RemoveGraphic(render, note, key, btnclick) {
    if (dojo.byId("txtArea")) {
        if ((dojo.byId("txtArea").value.trim() == "") || (btnclick)) {
            if (render) {
                map.getLayer("tempNotesLayerId").remove(render);
            }
            else {
                for (var q = 0; q < map.getLayer("tempNotesLayerId").graphics.length; q++) {
                    if (map.getLayer("tempNotesLayerId").graphics[q].attributes[0].count == note) {
                        map.getLayer("tempNotesLayerId").remove(map.getLayer("tempNotesLayerId").graphics[q]);
                    }
                }
            }
            var notes = [];
            noteCount = 0;
            for (var d = 0; d < notesArray.length; d++) {
                if (notesArray[d][0].key == key) {
                    if (notesArray[d][0].count != note) {
                        noteCount++;
                        notesArray[d][0].count = noteCount;
                        notes.push(notesArray[d]);
                    }
                }
                else {
                    notes.push(notesArray[d]);
                }
            }
            notesArray = notes;
            sessionStorage.setItem("notes" + key, dojo.toJson(notesArray));
            dojo.byId("imgSocialMedia").setAttribute("noteGraphics", sessionStorage.getItem("notes" + key));

            for (var q = 0; q < map.getLayer("tempNotesLayerId").graphics.length; q++) {
                if (map.getLayer("tempNotesLayerId").graphics[q].attributes[0].count) {
                    map.getLayer("tempNotesLayerId").graphics[q].attributes[0].count = (q + 1);
                }
            }
            nArray = PopulateNotesData(key);
            dojo.byId("imgSocialMedia").setAttribute("shareNotesLink", encodeURIComponent(dojo.toJson(nArray)));

            var url = esri.urlToObject(window.location.toString());
            var shareContent = "?extent=" + mapExtent + "$t=" + dojo.byId("imgSocialMedia").getAttribute("mapName") + "$n=";

            urlStr = encodeURIComponent(url.path) + encodeURIComponent(shareContent) + encodeURIComponent(dojo.toJson(nArray));
            charCount = (1425 - urlStr.length);
            if (urlStr.length > 1425) {
                dojo.byId("imgNotes").title = "App has reached its annotation capacity for this map";
                dojo.byId("imgNotes").setAttribute("noteCount" + key.replace(/ /g, ""), "disabled");
            }
            else {
                dojo.byId("imgNotes").title = "Add Notes";
                dojo.byId("imgNotes").setAttribute("noteCount" + key.replace(/ /g, ""), "enabled");
            }
            HideInfoContainer();
        }
        else {
            map.infoWindow.hide();
        }
    }
    else {
        RemoveHiglightGraphic();
    }
}

