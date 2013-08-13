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
var baseMapExtent; //variable to store the basemap extent
var notesArray = []; //array to store the notes
var noteCount = 0; //variable to count the notes symbols
var notesLayerClicked = false; //flag set to know whether notes layer is clicked or not
var notesGraphicLayerClicked = false; //flag set to know whether notes layer is clicked or not
var infoContentFocus = null; //variable for storing the info content value when it is focused
var infoContentBlur = null; //variable for storing the info content value when it is focused out
var infoContentClose = null; //variable for storing the info content value when info window was closed
var infoContentChange = null; //variable for storing the info content value when content changed
var infoContentPaste = null; //variable for storing the info content value when content pasted
var infoContentCut = null; //variable for storing the info content value when content was cut
var charCount; //variable for storing the remaining characters count for note
var RSSCounter = 0; //variable for storing the count of RSS feeds
var trendCounter = 0; //variable for storing the count of twitter trends
var tempMap;

//Function to create the info pods for subject groups(eg:Public Safety,Transportation,Capital Projects etc.)
//For each webmap this function determines subject group, Key indicator, Increase or decrease indicator, Color of pod. This function also handles on click event for each pod.
function CreateLayerPods(arrSubjectGroups, token, groupdata, indicatorState) {
    RemoveChildren(dojo.dom.byId("divLayerContent"));
    RemoveChildren(dojo.dom.byId("divNAEDisplayContent"));

    var table = document.createElement("table");
    table.cellSpacing = 0;
    table.cellPadding = 0;
    dojo.dom.byId("divLayerContent").appendChild(table);
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
            //Upon clicking/tapping on the pod, the data for selected pod will be transferred to function to create map page and pods for selected pod.
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

        // Create pods for each subject group
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
                    imgArr.style.display = "block";
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

                    try {
                        //Decide color of pod using Increase or decrease indicator, Current and Past observation
                        var diff = (dojo.string.substitute(infoPodStatics[0].CurrentObservation, indicatorState[j].value) - dojo.string.substitute(infoPodStatics[0].LatestObservation, indicatorState[j].value));
                        if (diff > 0) {
                            imgArr.src = "images/up.png";
                            if (dojo.string.substitute(infoPodStatics[0].StatisticsPosition, indicatorState[j].value)) {
                                if (dojo.string.substitute(infoPodStatics[0].StatisticsPosition, indicatorState[j].value) == "Yes") {
                                    divPod.className = "divPodGreen";
                                    divPodInner.className = "divPodInnerGreen";
                                }
                                else if (dojo.string.substitute(infoPodStatics[0].StatisticsPosition, indicatorState[j].value) == "No") {
                                    divPod.className = "divPodRed";
                                    divPodInner.className = "divPodInnerRed";
                                }
                                else {
                                    CreateStyleforNeutralPods(divPod, divPodInner, imgArr);
                                }
                            }
                            else {
                                CreateStyleforNeutralPods(divPod, divPodInner, imgArr);
                            }                          
                        }
                        else if (diff < 0) {
                            imgArr.src = "images/down.png";
                            if (dojo.string.substitute(infoPodStatics[0].StatisticsPosition, indicatorState[j].value)) {
                                if (dojo.string.substitute(infoPodStatics[0].StatisticsPosition, indicatorState[j].value) == "Yes") {
                                    divPod.className = "divPodRed";
                                    divPodInner.className = "divPodInnerRed";
                                }
                                else if (dojo.string.substitute(infoPodStatics[0].StatisticsPosition, indicatorState[j].value) == "No") {
                                    divPod.className = "divPodGreen";
                                    divPodInner.className = "divPodInnerGreen";
                                }
                                else {
                                    CreateStyleforNeutralPods(divPod, divPodInner, imgArr);
                                }
                            }
                            else {
                                CreateStyleforNeutralPods(divPod, divPodInner, imgArr);
                            }
                        }
                        else {
                            CreateStyleforNeutralPods(divPod, divPodInner, imgArr);
                        }
                        break;
                    }
                    catch (err) {
                        CreateStyleforNeutralPods(divPod, divPodInner, imgArr);
                        HideProgressIndicator();
                        alert(dojo.string.substitute(messages.getElementsByTagName("nullValue")[0].childNodes[0].nodeValue, [arrSubjectGroups[p][g].title]));
                    }
                }
            }
        }
        count++;
    }
    CreateScrollbar(dojo.dom.byId('divLayerContainer'), dojo.dom.byId('divLayerContent'));
    //Below code block will get executed when a shared link for the app is invoked.
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
        group = group.replace("@", "&");
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

//This function assigns style classes to neutral pods
function CreateStyleforNeutralPods(divPod, divPodInner, imgArr) {
    divPod.className = "divPod";
    divPodInner.className = "divPodInner";
    imgArr.style.display = "none";
}

//Function to get data for the sub group(metric) pods(eg:Thefts,Ems Runs etc)
//This function creates info pods for the webmapid
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
                HideProgressIndicator();
                alert(dojo.toJson(error));
            });

            dojo.dom.byId("imgResize").setAttribute("webmapID", webMapId[id]);

            webmapDetails.addCallback(function (response) {
                map = response.map;
                map.destroy();

                counter++;
                var webmapInfo = {};
                webmapInfo.key = response.itemInfo.item.title;
                dojo.dom.byId("imgResize").setAttribute("webmapKey", webmapInfo.key);
                webmapInfo.id = response.itemInfo.item.id;
                webmapInfo.operationalLayers = response.itemInfo.itemData.operationalLayers;
                webmapInfo.baseMap = response.itemInfo.itemData.baseMap.baseMapLayers;
                webInfo.push(webmapInfo);
                if ((webMapId.length - 1) == counter) {
                    //function to sort the metric pods in alphabetical order
                    webInfo.sort(function (a, b) {
                        var nameA = a.key.toLowerCase(), nameB = b.key.toLowerCase()
                        if (nameA < nameB) //sort string ascending
                            return -1
                        if (nameA > nameB)
                            return 1
                        return 0 //default return value (no sorting)
                    });
                    RemoveChildren(dojo.dom.byId("divServiceContainer"));
                    RemoveChildren(dojo.dom.byId("trBottomHeaders"));
                    RemoveChildren(dojo.dom.byId("trBottomTags"));
                    RemoveChildren(dojo.dom.byId("tblMoreResults"));
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
                    //visibility(isPodVisible) flag is used to determine creation and display of info pod. The pods will be created and displayed only if this flag is set to true.
                    if (visibility) {
                        var webStats = [];
                        for (var z in webInfo) {
                            for (var y in webInfo[z].operationalLayers) {
                                if (webInfo[z].operationalLayers[y].title.indexOf(statisticsKeyword) >= 0) {
                                    if (webInfo[z].operationalLayers[y].url) {
                                        var str = webInfo[z].operationalLayers[y].url;
                                        var ss = str.substring(((str.lastIndexOf("/")) + 1), (str.length))
                                        if (!isNaN(ss)) {
                                            webStats.push({ title: webInfo[z].key, url: webInfo[z].operationalLayers[y].url, statsTitle: webInfo[z].operationalLayers[y].title });
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
        }
    }
}

//Function to fetch the statistical data for the metric pods
//This function queries each statistics layer and creates infopods for each webmap of subject group
function FetchStatData(webStats, inc, statsData, webInfo, groupdata, token) {
    if (webStats.length) {
        if (webStats[inc]) {
            if (webStats[inc].url) {
                var queryTask = new esri.tasks.QueryTask(webStats[inc].url);
                var queryDate = (new Date()).getTime();
                var queryCounty = new esri.tasks.Query();
                queryCounty.where = "1=1 AND " + queryDate + "=" + queryDate;
                queryCounty.returnGeometry = false;
                queryCounty.outFields = ["*"];
                queryCounty.outSpatialReference = map.spatialReference;
                queryTask.execute(queryCounty, function (featureSet) {
                    statsData.push({ title: webStats[inc].title, data: featureSet.features[0].attributes, fields: featureSet.fields, statsTitle: webStats[inc].statsTitle });
                    inc++;
                    if (webStats.length == statsData.length) {
                        CreateGroupPods(webInfo, groupdata, token, statsData);
                        dojo.disconnect(handlePoll);
                        CreateHorizontalScrollbar(dojo.dom.byId('divServiceData'), dojo.dom.byId("carouselscroll"));
                        return;
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

//Function fetches data from RSS feeds and Twitter trends for default keywords and the keywords stored in local storage
function PopulateNews(evt) {
    ShowProgressIndicator();
    RSSCounter = 0;
    trendCounter = 0;
    RemoveChildren(dojo.dom.byId("divNAEDisplayContent"));
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
            dojo.dom.byId("btnNews").className = "customButton";
            dojo.dom.byId("btnTrends").className = "customDisabledButton";

            dojo.dom.byId("btnNews").style.cursor = "default";
            dojo.dom.byId("btnTrends").style.cursor = "pointer";
            CreateScrollbar(dojo.dom.byId('divNAEDisplayContainer'), dojo.dom.byId('divNAEDisplayContent'));

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
            dojo.dom.byId("btnNews").className = "customDisabledButton";
            dojo.dom.byId("btnTrends").className = "customButton";
            dojo.dom.byId("btnNews").style.cursor = "pointer";
            dojo.dom.byId("btnTrends").style.cursor = "default";

            if (localStorage.getItem("TwitterTrendCollection")) {
                if (dojo.fromJson(localStorage.getItem("TwitterTrendCollection")).length > 0) {
                    trends = dojo.fromJson(localStorage.getItem("TwitterTrendCollection"));
                }
            }
            CreateScrollbar(dojo.dom.byId('divNAEDisplayContainer'), dojo.dom.byId('divNAEDisplayContent'));

            var lastOrder = 0;
            if (trends) {
                FetchNews(null, lastOrder, 0, null);
            }
        }
    }, 500);
}

//Function to fetch the data for each RSS feed name and twitter trend name.
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
            //Fetch data for rss feeds
            esri.request({
                url: rss[q].url,
                handleAs: "xml",
                load: function (candidates) {
                    if (chkCount != null) {
                        var table = document.createElement("table");
                        dojo.dom.byId("divNAEDisplayContent").appendChild(table);
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
        //Fetch data for twitter trends
        var trend = news;
        esri.request({
            url: twitterDetails[0].SearchURL,
            handleAs: "json",
            content: {
                q: trends[trend].name
            },
            load: function (candidates) {
                if (chkCount == null) {
                    var table = document.createElement("table");
                    dojo.dom.byId("divNAEDisplayContent").appendChild(table);
                    var tBody = document.createElement("tbody");
                    table.appendChild(tBody);
                    table.cellSpacing = 0;
                    table.cellPadding = 0;
                    if (candidates) {
                        for (var i = 0; i < candidates[twitterDetails[0].StatusField].length; i++) {
                            var trendHeader = candidates[twitterDetails[0].StatusField][i][twitterDetails[1].TitleFields[0]][twitterDetails[1].TitleFields[1]];
                            var trendContent = candidates[twitterDetails[0].StatusField][i][twitterDetails[2].DescriptionField];
                            var trendLink = dojo.string.substitute(twitterDetails[3].StatusURL, [candidates[twitterDetails[0].StatusField][i][twitterDetails[3].StatusFields[0]][twitterDetails[3].StatusFields[1]]]) + "/"
                                             + candidates[twitterDetails[0].StatusField][i][twitterDetails[3].StatusId];
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

//Function to create scroll bar for RSS feeds and twitter trends.
function OnNewsFeedsUpdateEnd(chkfeedCount) {
    if (chkfeedCount) {
        if (RSSCounter == chkfeedCount) {
            CreateScrollbar(dojo.dom.byId('divNAEDisplayContainer'), dojo.dom.byId('divNAEDisplayContent'));
            HideProgressIndicator();
        }
    }
    else {
        if (trendCounter == trends.length) {
            CreateScrollbar(dojo.dom.byId('divNAEDisplayContainer'), dojo.dom.byId('divNAEDisplayContent'));
            HideProgressIndicator();
        }
    }
}


//Function to display list of RSS feeds and Twitter trends
function CreateNewsDataTemplate(Header, Link, Content, tBody, feed, lastVal) {
    var tr = document.createElement("tr");
    tBody.appendChild(tr);
    var td1 = document.createElement("td");
    td1.style.paddingTop = "5px";
    td1.style.paddingLeft = "5px";
    td1.style.paddingRight = "10px";
    if (feed) {
        if (Header.length) {
            td1.innerHTML = "<u>" + Header[0].nodeValue + "</u>";
        }
        if (Link.length) {
            td1.setAttribute("link", Link[0].nodeValue);
        }
    }
    else {
        td1.innerHTML = "<u>" + Header + "</u>";
        td1.setAttribute("link", Link);
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
    if (feed) {
        if (Content.length) {
            td2.innerHTML = Content[0].nodeValue;
        }
    } else {
        td2.innerHTML = Content;
    }
    td2.title = td2.textContent;
    td2.innerHTML = td2.textContent.trimString(50);

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

//This function is used to resize chart container
function ResizeChartContainer() {
    dojo.dom.byId("divGraphComponent").style.width = ((dojo['dom-geometry'].getMarginBox("divGroupHolder").w - 70)) + "px";
    if (chart) {
        chart.resize((dojo['dom-geometry'].getMarginBox("divGroupHolder").w - 70), 250);
    }
}

//Function to display the map page with the animation effects
//This function displays the webmap using webmap ID
function PopulateEventDetails(id, arrSubjectGroups, header, webmapInfo, groupdata, token, state, podsVisibility, bottomOffset) {
    if (dojo.dom.byId("btnMap").className != "customDisabledButton") {
        dojo.dom.byId("imgSocialMedia").setAttribute("subjectGroup", header);
        dojo.dom.byId("imgSocialMedia").setAttribute("mapName", webmapInfo.key);
        ResizeChartContainer();
        dojo.dom.byId("imgGeolocation").src = "images/imgGeolocation.png";
        ShowProgressIndicator();
        if (dojo.dom.byId("imgNotes").getAttribute("state") != "unSelected") {
            dojo.dom.byId("imgNotes").src = "images/imgNotes.png";
            dojo.dom.byId("imgNotes").setAttribute("state", "unSelected");
        }

        var comArray = dojo.fromJson(dojo.dom.byId("imgResize").getAttribute("compareId"));
        if (comArray) {
            for (var comp = 0; comp < comArray.length; comp++) {
                if (comArray[comp] == id) {
                    dojo.dom.byId("imgResize").style.cursor = "pointer";
                    dojo.dom.byId("imgResize").title = "Compare";
                    dojo.dom.byId("imgResize").src = "images/resize.png";
                    break;
                }
                else {
                    dojo.dom.byId("imgResize").style.cursor = "default";
                    dojo.dom.byId("imgResize").title = "";
                    dojo.dom.byId("imgResize").src = "images/resize-disable.png";
                }
            }
        }
        else {
            dojo.dom.byId("imgResize").style.cursor = "default";
            dojo.dom.byId("imgResize").title = "";
            dojo.dom.byId("imgResize").src = "images/resize-disable.png";
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
            dojo.dom.byId("divTextContainer").style.width = dojo.window.getBox().w + "px";
            dojo.dom.byId("divTextContainer").style.height = dojo.window.getBox().h + "px";

            //Fade In and Fade Out animations
            FadeOut(dojo.dom.byId('divApplicationHeader'));
            FadeOut(dojo.dom.byId('divInfoContainer'));
            FadeOut(dojo.dom.byId('divSettingsContainer'));
            FadeIn(dojo.dom.byId('divMapApplicationHeader'));
            FadeIn(dojo.dom.byId("divBottomContainer"));
            FadeIn(dojo.dom.byId('map'));
            FadeIn(dojo.dom.byId('divServiceDetails'));
            FadeIn(dojo.dom.byId('showHide'));
            if (retainState) {
                FadeIn(dojo.dom.byId('divGraphComponent'));
                FadeIn(dojo.dom.byId('divBookmarkContent'));
                FadeIn(dojo.dom.byId('divAddressContent'));
            }
        }
        setTimeout(function () {
            if (state) {
                dojo.dom.byId("divTextContainer").style.width = "100%";
                dojo.dom.byId("divTextContainer").style.height = "100%";
                dojo.dom.byId("divTextContainer").style.display = "none";
                dojo.dom.byId("divMapContainer").style.display = "block";

                dojo.dom.byId("tdEventName").innerHTML = header;
                dojo.dom.byId("map").style.display = "block";
                dojo.dom.byId('map').style.marginLeft = (dojo['dom-geometry'].getMarginBox("holder").l) + "px";
                dojo.dom.byId('divFrozen').style.marginLeft = (dojo['dom-geometry'].getMarginBox("holder").l) + "px";
                dojo.dom.byId('showHide').style.right = (dojo['dom-geometry'].getMarginBox("holder").l + 15) + "px";
                dojo.dom.byId('map').style.height = "100%";
                dojo.dom.byId('map').style.width = "100%";
                ToggleContainers();
            }
            if (arrSubjectGroups) {
                CreateBottomHeaders(arrSubjectGroups, groupdata, token, header, bottomOffset);
            }

            selectedPoint = null;
            selectedMapPoint = null;
            selectedTempPoint = null;

            if (map) {
                if (map._layers.length) {
                    map.removeAllLayers();
                }
                map.destroy();
            }
            var mapDeferred;
            if (share != "") {
                startExtent = window.location.href.split("?extent=")[1].split("$t=")[0];
                zoomExtent = startExtent.split(',');
                startExtent = new esri.geometry.Extent(parseFloat(zoomExtent[0]), parseFloat(zoomExtent[1]), parseFloat(zoomExtent[2]), parseFloat(zoomExtent[3]), map.spatialReference);
            }
            var deferred = esri.arcgis.utils.createMap(id, "map");
            deferred.addCallback(function (res) {
                ShowProgressIndicator();
                var defExtent = res.map.extent.xmin + "," + res.map.extent.ymin + "," + res.map.extent.xmax + "," + res.map.extent.ymax;
                res.map.destroy();

                if (startExtent && (!loadInitialExtentForWebmap)) {
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
                dojo.dom.byId("imgResize").setAttribute("webmapID", id);
                dojo.dom.byId("imgResize").setAttribute("webmapKey", webmapInfo.key);
                mapDeferred.addCallback(function (response) {
                    map = response.map;
                    map.disableKeyboardNavigation();
                    dojo.create("div", {
                        className: "esriSimpleSliderHomeButton",
                        onclick: function () {
                            if (defExtent) {
                                var defaultExtent = new esri.geometry.Extent(Number(defExtent.split(",")[0]), Number(defExtent.split(",")[1]), Number(defExtent.split(",")[2]), Number(defExtent.split(",")[3]), map.spatialReference);
                                map.setExtent(defaultExtent);
                            }
                        }
                    }, dojo.query(".esriSimpleSliderIncrementButton")[0], "after");
                    baseMapExtent = response.itemInfo.itemData.baseMap.baseMapLayers[0].layerObject.fullExtent;

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
                    HideProgressIndicator();
                    alert(dojo.toJson(error));
                });
            });
        }, (state) ? 500 : 0);
    }
}

function ShowCompare(click) {
    ToggleHeaderPanels();
    if (dojo.dom.byId("imgNotes").getAttribute("state") != "unSelected") {
        dojo.dom.byId("imgNotes").src = "images/imgNotes.png";
        dojo.dom.byId("imgNotes").setAttribute("state", "unSelected");
        TogglePopup(true, ((!tempMap) ? map : tempMap));
    }
    mapExtent = GetMapExtent();
    if (click) {
        if (dojo.dom.byId("imgResize").style.cursor == "pointer") {
            if (selectedMapPoint) {
                if (!tempMap) {
                    ShowProgressIndicator();
                    dojo.dom.byId("divMap").style.width = "50%";
                    dojo.dom.byId("divServiceDetails").style.marginLeft = "0px";
                    dojo.dom.byId("divFrozen").style.display = "block";
                    dojo.dom.byId("divFrozen").style.width = "50%";
                    dojo.dom.byId("divFrozen").style.height = (map.height - 140) + "px";
                    dojo.dom.byId("imgResize").src = "images/resize-hover.png";
                    dojo.dom.byId("imgResize").title = "Back to regular mode";
                    dojo.dom.byId("divTempMap").style.width = "50%";
                    dojo.dom.byId("divTempMap").style.left = ((dojo['dom-geometry'].getMarginBox("mapContainer").w + (dojo['dom-geometry'].getMarginBox("holder").l)) - dojo['dom-geometry'].getMarginBox("divMap").w) + "px";
                    dojo.query('[divGroupPod]', "tblMetricPods").forEach(function (node) {
                        if ((dojo['dom-class'].contains(node, "divPodRedSelected")) || (dojo['dom-class'].contains(node, "divPodGreenSelected")) || (dojo['dom-class'].contains(node, "divPodGraySelected"))) {
                            node.style.display = "block";
                            node.parentNode.style.display = "block";
                        }
                        else {
                            node.style.display = "none";
                            node.parentNode.style.display = "none";
                        }
                    });
                }
                else {
                    BackToRegularMode();
                }
                map.resize(true);
                map.reposition();

                setTimeout(function () {
                    map.setExtent(GetBrowserMapExtentforInfoWindow(selectedMapPoint));
                    var point = selectedMapPoint;
                    map.infoWindow.hide();
                    setTimeout(function () {
                        map.infoWindow.show(point);
                        selectedMapPoint = point;
                    }, 500);

                    if (dojo.dom.byId("imgResize").title != "Compare") {
                        if (dojo.dom.byId("imgResize").getAttribute("webmapID")) {
                            var deferred = esri.arcgis.utils.createMap(dojo.dom.byId("imgResize").getAttribute("webmapID"), "tempMap");
                            deferred.addCallback(function (res) {
                                var defExtent = res.map.extent.xmin + "," + res.map.extent.ymin + "," + res.map.extent.xmax + "," + res.map.extent.ymax;
                                res.map.destroy();
                                var mapDeferred = esri.arcgis.utils.createMap(dojo.dom.byId("imgResize").getAttribute("webmapID"), "tempMap", {
                                    mapOptions: {
                                        extent: map.extent
                                    }
                                });
                                mapDeferred.then(function (response) {
                                    if (!isBrowser) {
                                        if (dojo.query(".esriPopup .contentPane").length > 0) {
                                            dojo.query(".esriPopup .contentPane")[0].style.overflow = "hidden";
                                        }
                                    }
                                    HideProgressIndicator();
                                    tempMap = response.map;
                                    tempMap.disableKeyboardNavigation();

                                    dojo.create("div", {
                                        className: "esriSimpleSliderHomeButton",
                                        onclick: function () {
                                            if (defExtent) {
                                                var defaultTempMapExtent = new esri.geometry.Extent(Number(defExtent.split(",")[0]), Number(defExtent.split(",")[1]), Number(defExtent.split(",")[2]), Number(defExtent.split(",")[3]), map.spatialReference);
                                                tempMap.setExtent(defaultTempMapExtent);
                                            }
                                        }
                                    }, dojo.query(".esriSimpleSliderIncrementButton")[1], "after");

                                    dojo.dom.byId("imgSocialMedia").style.cursor = "default";
                                    dojo.dom.byId("imgSocialMedia").title = "";
                                    dojo.dom.byId("imgSocialMedia").src = "images/share-disable.png";

                                    var gLayer = new esri.layers.GraphicsLayer();
                                    gLayer.id = temporaryGraphicsLayerId;
                                    tempMap.addLayer(gLayer);

                                    dojo.connect(tempMap.infoWindow, "onHide", function () {
                                        selectedTempPoint = null;
                                        selectedPoint = null;
                                        if (dojo.query(".esriPopup .contentPane").length > 0) {
                                            dojo.query(".esriPopup .contentPane")[1].style.overflow = "hidden";
                                        }
                                    });
                                    dojo.connect(tempMap.infoWindow, "onShow", function () {
                                        if (dojo.query(".esriPopup .contentPane").length > 0) {
                                            dojo.query(".esriPopup .contentPane")[1].style.overflow = "auto";
                                        }
                                    });
                                    dojo.connect(tempMap.infoWindow, "onMaximize", function () {
                                        dojo.query(".esriPopup")[1].style.zIndex = "3100";
                                    });
                                    dojo.connect(tempMap.infoWindow, "onRestore", function () {
                                        dojo.query(".esriPopup")[1].style.zIndex = "1005";
                                    });

                                    dojo.query(".esriPopup")[1].style.zIndex = "1005";

                                    CreateGraphicLayer(tempMap, dojo.dom.byId("imgResize").getAttribute("webmapKey"));
                                }, function (error) {
                                    HideProgressIndicator();
                                    alert(dojo.toJson(error));
                                });
                            });
                            deferred.addErrback(function (error) {
                                alert("Map creation failed: ", dojo.toJson(error));
                            });
                        }
                    }
                }, 1000);

            } else {
                alert(messages.getElementsByTagName("selectLocation")[0].childNodes[0].nodeValue);
            }
        }
    }
    else {
        BackToRegularMode();
    }
}

function BackToRegularMode() {
    if (!isBrowser) {
        if (dojo.query(".esriPopup .contentPane").length > 0) {
            dojo.query(".esriPopup .contentPane")[0].style.overflow = "auto";
        }
    }

    dojo.dom.byId("imgSocialMedia").style.cursor = "pointer";
    dojo.dom.byId("imgSocialMedia").title = "Share";
    dojo.dom.byId("imgSocialMedia").src = "images/imgSocialMedia.png";

    dojo.query('[divGroupPod]', "tblMetricPods").forEach(function (node) {
        node.style.display = "block";
        node.parentNode.style.display = "block";
    });

    dojo.dom.byId("divMap").style.width = "100%";
    dojo.dom.byId("imgResize").src = "images/resize.png";
    dojo.dom.byId("imgResize").title = "Compare";
    dojo.dom.byId("divFrozen").style.display = "none";
    dojo.dom.byId("divFrozen").style.width = "100%";

    dojo.dom.byId("divTempMap").style.width = "0px";
    if (tempMap) {
        tempMap.destroy();
        tempMap = null;
    }
    if (dojo.dom.byId("imgResize").getAttribute("webmapKey")) {
        var tempNotesArray = PopulateNotesData("temp" + dojo.dom.byId("imgResize").getAttribute("webmapKey"));

        nArray = PopulateNotesData(dojo.dom.byId("imgResize").getAttribute("webmapKey"));
        for (var b = 0; b < tempNotesArray.length; b++) {
            nArray.push(tempNotesArray[b]);
        }
        for (var c = 0; c < notesArray.length; c++) {
            if (notesArray[c][0].key == "temp" + dojo.dom.byId("imgResize").getAttribute("webmapKey")) {
                notesArray[c][0].key = dojo.dom.byId("imgResize").getAttribute("webmapKey");
            }
        }
        sessionStorage.setItem("notes" + dojo.dom.byId("imgResize").getAttribute("webmapKey"), dojo.toJson(notesArray));
        dojo.dom.byId("imgSocialMedia").setAttribute("noteGraphics", sessionStorage.getItem("notes" + dojo.dom.byId("imgResize").getAttribute("webmapKey")));
        nArray = PopulateNotesData(dojo.dom.byId("imgResize").getAttribute("webmapKey"));
        dojo.dom.byId("imgSocialMedia").setAttribute("shareNotesLink", encodeURIComponent(dojo.toJson(nArray)));

        var webmapInfo = {};
        webmapInfo.key = dojo.dom.byId("imgResize").getAttribute("webmapKey");
        sessionStorage.setItem("temp" + webmapInfo.key, null);
        map.getLayer("tempNotesLayerId").clear();
        CreateGraphic(notesArray, webmapInfo, true);
    }
    ResetSlideControls();
}

//Function to create graphics layer and graphics from session storage
function MapInitFunction(groupdata, token, webmapInfo, podsVisibility, id) {
    var gLayer = new esri.layers.GraphicsLayer();
    gLayer.id = tempGraphicsLayerId;
    map.addLayer(gLayer);

    dojo.connect(map.infoWindow, "onHide", function () {
        if (dojo.query(".esriPopup .contentPane").length > 0) {
            dojo.query(".esriPopup .contentPane")[0].style.overflow = "hidden";
        }
        selectedMapPoint = null;
        selectedPoint = null;
    });

    dojo.connect(map.infoWindow, "onShow", function () {
        if (dojo.query(".esriPopup .contentPane").length > 0) {
            dojo.query(".esriPopup .contentPane")[0].style.overflow = "auto";
        }
    });

    dojo.connect(map.infoWindow, "onMaximize", function () {
        dojo.query(".esriPopup")[0].style.zIndex = "3100";
    });

    dojo.connect(map.infoWindow, "onRestore", function () {
        dojo.query(".esriPopup")[0].style.zIndex = "1005";
    });

    dojo.query(".esriPopup")[0].style.zIndex = "1005";

    noteCount = 0;
    dojo.connect(dojo.query(".esriPopup .titleButton .maximize")[0], "onclick", function (info) {
        if (dojo.dom.byId("txtArea")) {
            if (dojo.query(".contentPane")[0].style.height) {
                dojo.dom.byId("txtArea").style.height = (dojo.query(".contentPane")[0].style.height.split("p")[0] - 100) + "px";
            }
            else {
                dojo.dom.byId("txtArea").style.height = "100px";
            }
        }
    });

    CreateGraphicLayer(map, webmapInfo);

    if (sessionStorage.getItem("notes" + webmapInfo.key)) {
        var nStore = dojo.fromJson(sessionStorage.getItem("notes" + webmapInfo.key));
        CreateGraphic(nStore, webmapInfo, true);
    }
    else {
        dojo.dom.byId("imgSocialMedia").setAttribute("noteGraphics", "");
        dojo.dom.byId("imgSocialMedia").setAttribute("shareNotesLink", "");
    }

    //Create graphics using data from URL when a shared link for the app is invoked
    if (share != "") {
        var group;
        if (window.location.href.split("$n=").length > 1) {
            group = window.location.href.split("$t=")[1].split("$n=")[0];
        }
        else {
            group = window.location.href.split("$t=")[1];
        }
        group = group.replace(/%20/g, " ");
        group = group.replace("@", "&");
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
                        dojo.dom.byId("imgNotes").title = "App has reached its annotation capacity for this map";
                        dojo.dom.byId("imgNotes").setAttribute("noteCount" + webmapInfo.key.replace(/ /g, ""), "disabled");
                    }
                    else {
                        dojo.dom.byId("imgNotes").title = "Add Notes";
                        dojo.dom.byId("imgNotes").setAttribute("noteCount" + webmapInfo.key.replace(/ /g, ""), "enabled");
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
                        if (internalStr) {
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
                    }
                    CreateGraphic(nStore, webmapInfo, false);
                }
            }
        }
    }
    HideProgressIndicator();
    HideInfoContainer();
    if (dojo.dom.byId("imgNotes").getAttribute("noteCount" + webmapInfo.key.replace(/ /g, "")) == "disabled") {
        dojo.dom.byId("imgNotes").title = "App has reached its annotation capacity for this map";
    }
    else {
        dojo.dom.byId("imgNotes").title = "Add Notes";
    }
}

//Function to add the existing note graphics on the map
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
    dojo.dom.byId("imgSocialMedia").setAttribute("noteGraphics", sessionStorage.getItem("notes" + webmapInfo.key));
    var attrData = [];
    attrData = PopulateNotesData(webmapInfo.key);
    dojo.dom.byId("imgSocialMedia").setAttribute("shareNotesLink", dojo.toJson(attrData));
}

//Function to populate updated notes
function PopulateNotesData(key) {
    var nArray = [];
    var shareNotes = [];
    if (dojo.dom.byId("imgSocialMedia").getAttribute("noteGraphics")) {
        shareNotes = dojo.fromJson(dojo.dom.byId("imgSocialMedia").getAttribute("noteGraphics"));
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


//This function creates and displays info window with existing notes for each note graphic
function ShowNotesInfo(feature, geometry, key, render, note) {
    mapExtent = GetMapExtent();
    var url = esri.urlToObject(window.location.toString());

    nArray = PopulateNotesData(key);
    var tempArray = PopulateNotesData(key.split("temp")[1]);
    for (var t = 0; t < tempArray.length; t++) {
        nArray.push(tempArray[t]);
    }

    var urlStr;
    var notesLength;
    var val;
    var level;
    var shareContent = "?extent=" + mapExtent + "$t=" + dojo.dom.byId("imgSocialMedia").getAttribute("mapName") + "$n=";

    if (nArray.length > 0) {
        dojo.dom.byId("imgSocialMedia").setAttribute("shareNotesLink", encodeURIComponent(dojo.toJson(nArray)));
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
        notesLength = messages.getElementsByTagName("noCharacters")[0].childNodes[0].nodeValue;
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
    if (infoContentChange) {
        dojo.disconnect(infoContentChange);
    }
    if (infoContentPaste) {
        dojo.disconnect(infoContentPaste);
    }
    if (infoContentCut) {
        dojo.disconnect(infoContentCut);
    }
    infoContentFocus = dojo.connect(txtArea, "onfocus", function () {
        if ((val - level) <= 0) {
            this.setAttribute("capacity", encodeURIComponent(dojo.toJson(this.value.trim()).substring(1, (dojo.toJson(this.value.trim()).length - 1))).length);
        }
        this.setAttribute("dVal", encodeURIComponent(dojo.toJson(this.value.trim()).substring(1, (dojo.toJson(this.value.trim()).length - 1))));
        this.setAttribute("value", this.value.trim());
    });

    infoContentBlur = dojo.connect(txtArea, "onkeyup", function (evt) {
        if ((evt.keyCode == 86 && evt.ctrlKey) || (evt.keyCode == 88 && evt.ctrlKey)) {
            return;
        }
        CalculateCharactersCount(this, geometry, key, note, shareContent);
    });

    infoContentChange = dojo.connect(txtArea, "onchange", function () {
        CalculateCharactersCount(this, geometry, key, note, shareContent);
    });

    infoContentPaste = dojo.connect(txtArea, "onpaste", function () {
        setTimeout(dojo.hitch(this, function () {
            CalculateCharactersCount(this, geometry, key, note, shareContent);
        }), 100);
    });

    infoContentCut = dojo.connect(txtArea, "oncut", function () {
        setTimeout(dojo.hitch(this, function () {
            CalculateCharactersCount(this, geometry, key, note, shareContent);
        }), 100);
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

    if ((!feature) || (feature.note)) {
        var notesGraphicLayer = (tempMap) ? tempMap.getLayer("tempNotesGraphicLayerId") : map.getLayer("tempNotesLayerId");
        var mapCtrl = (!tempMap) ? map : tempMap;
        for (var q = 0; q < notesGraphicLayer.graphics.length; q++) {
            if (notesGraphicLayer.graphics[q].attributes[0]) {
                if (notesGraphicLayer.graphics[q].attributes[0].count == note) {
                    mapCtrl.infoWindow.setTitle("Notes");
                    mapCtrl.infoWindow.setContent(divContainer);
                    for (var zoom = 0; zoom < dojo.query(".esriPopup .actionsPane .action").length; zoom++) {
                        dojo.query(".esriPopup .actionsPane .action")[zoom].style.display = "none";
                        dojo.query(".esriPopup .actionsPane .action")[zoom].style.width = "0px";
                    }
                    for (var next = 0; next < dojo.query(".esriPopup .titleButton.next").length; next++) {
                        dojo.query(".esriPopup .titleButton.next")[next].style.display = "none";
                    }
                    mapCtrl.setExtent(GetBrowserMapExtent(geometry, mapCtrl));

                    setTimeout(function () {
                        mapCtrl.infoWindow.show(geometry);
                    }, 500);
                    break;
                }
            }
        }
    }

    if (!tempMap) {
        notesLayerClicked = false;
    }
    else {
        notesGraphicLayerClicked = false;
    }

    if (infoContentClose) {
        dojo.disconnect(infoContentClose);
    }

    infoContentClose = dojo.connect(((!tempMap) ? dojo.query(".esriPopup .titleButton.close")[0] : dojo.query(".esriPopup .titleButton.close")[1]), "onclick", function () {
        if (!tempMap) {
            selectedMapPoint = null;
        }
        else {
            selectedTempPoint = null;
        }
        selectedPoint = null;
        if (((!tempMap) ? (!notesLayerClicked) : (!notesGraphicLayerClicked))) {
            RemoveGraphic(render, note, key, false);
        }
    });
}

//Calculate remaining number of characters to be entered
function CalculateCharactersCount(obj, geometry, key, note, shareContent) {
    var store = dojo.toJson(obj.value.trim()).substring(1, (dojo.toJson(obj.value.trim()).length - 1));
    store = ReplaceWithSpecialCharacters(store);
    var counter = 0;
    var store1 = encodeURIComponent(dojo.toJson(obj.value.trim()).substring(1, (dojo.toJson(obj.value.trim()).length - 1)));
    var store2;
    var cap;

    if (charCount) {
        var diff = encodeURIComponent(dojo.toJson(obj.value.trim()).substring(1, (dojo.toJson(obj.value.trim()).length - 1))).length - Number(obj.getAttribute("storeLen"));
        if (charCount > diff) {
            cap = encodeURIComponent(dojo.toJson(obj.value.trim()).substring(1, (dojo.toJson(obj.value.trim()).length - 1))).length + charCount;
        }
        else {
            cap = encodeURIComponent(dojo.toJson(obj.value.trim()).substring(1, (dojo.toJson(obj.value.trim()).length - 1))).length - (diff - charCount);
        }
    }
    else {
        if (obj.getAttribute("dVal").length < encodeURIComponent(dojo.toJson(obj.value.trim()).substring(1, (dojo.toJson(obj.value.trim()).length - 1))).length) {
            cap = obj.getAttribute("dVal").length;
        }
        else {
            cap = encodeURIComponent(dojo.toJson(obj.value.trim()).substring(1, (dojo.toJson(obj.value.trim()).length - 1))).length;
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
            obj.value = store2;
            store = obj.value;
        }
    }
    SaveNotes(geometry, key, note, store);
    mapExtent = GetMapExtent();
    var url = esri.urlToObject(window.location.toString());
    nArray = PopulateNotesData(key);
    var tempArray = PopulateNotesData(key.split("temp")[1]);
    for (var t = 0; t < tempArray.length; t++) {
        nArray.push(tempArray[t]);
    }
    var urlSt;

    if (nArray.length > 0) {
        urlSt = encodeURIComponent(url.path) + encodeURIComponent(shareContent) + encodeURIComponent(dojo.toJson(nArray));
        if ((urlSt.length == 1425) && (encodeURIComponent(dojo.toJson(obj.value)).length >= (1425 - urlSt.length))) {
            dojo.dom.byId("imgNotes").title = "App has reached its annotation capacity for this map";
            dojo.dom.byId("imgNotes").setAttribute("noteCount" + key.replace(/ /g, ""), "disabled");
            dojo.dom.byId("spnResultContainer").innerHTML = messages.getElementsByTagName("noCharacters")[0].childNodes[0].nodeValue;
            dojo.dom.byId("txtArea").blur();
        }
        else {
            dojo.dom.byId("imgNotes").title = "Add Notes";
            dojo.dom.byId("imgNotes").setAttribute("noteCount" + key.replace(/ /g, ""), "enabled");
            if ((1425 - urlSt.length) > 0) {
                dojo.dom.byId("spnResultContainer").innerHTML = (1425 - urlSt.length) + " character(s) remain";
            }
            else {
                dojo.dom.byId("spnResultContainer").innerHTML = messages.getElementsByTagName("noCharacters")[0].childNodes[0].nodeValue;
            }
        }

        charCount = (1425 - urlSt.length);
        dojo.dom.byId("imgSocialMedia").setAttribute("shareNotesLink", encodeURIComponent(dojo.toJson(nArray)));
    }
    obj.setAttribute("storeLen", encodeURIComponent(dojo.toJson(obj.value.trim()).substring(1, (dojo.toJson(obj.value.trim()).length - 1))).length);
}

//Function to encode values with special characters
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

//Function to save the notes in session storage
function SaveNotes(geometry, key, note, store) {
    var attributes = [];
    attributes.push({ note: store, count: note });
    var notesGraphicLayer = (tempMap) ? tempMap.getLayer("tempNotesGraphicLayerId") : map.getLayer("tempNotesLayerId");
    for (var q = 0; q < notesGraphicLayer.graphics.length; q++) {
        if (notesGraphicLayer.graphics[q].attributes[0]) {
            if (notesGraphicLayer.graphics[q].attributes[0].count == note) {
                notesGraphicLayer.graphics[q].attributes[0] = attributes[0];
            }
        }
        else {
            if (notesGraphicLayer.graphics[q].attributes.count == note) {
                notesGraphicLayer.graphics[q].attributes[0] = attributes[0];
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
    dojo.dom.byId("imgSocialMedia").setAttribute("noteGraphics", sessionStorage.getItem("notes" + key));
    nArray = PopulateNotesData(key);
    dojo.dom.byId("imgSocialMedia").setAttribute("shareNotesLink", encodeURIComponent(dojo.toJson(nArray)));
}

//Function to remove the note graphic from the map
function RemoveGraphic(render, note, key, btnclick) {
    var notesLayer = (!tempMap) ? map.getLayer("tempNotesLayerId") : tempMap.getLayer("tempNotesGraphicLayerId");
    if (dojo.dom.byId("txtArea")) {
        if ((dojo.dom.byId("txtArea").value.trim() == "") || (btnclick)) {
            if (render) {
                notesLayer.remove(render);
            }
            else {
                for (var q = 0; q < notesLayer.graphics.length; q++) {
                    if (notesLayer.graphics[q].attributes[0].count == note) {
                        notesLayer.remove(notesLayer.graphics[q]);
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
            dojo.dom.byId("imgSocialMedia").setAttribute("noteGraphics", sessionStorage.getItem("notes" + key));

            for (var q = 0; q < notesLayer.graphics.length; q++) {
                if (notesLayer.graphics[q].attributes[0].count) {
                    notesLayer.graphics[q].attributes[0].count = (q + 1);
                }
            }
            nArray = PopulateNotesData(key);
            dojo.dom.byId("imgSocialMedia").setAttribute("shareNotesLink", encodeURIComponent(dojo.toJson(nArray)));

            var url = esri.urlToObject(window.location.toString());
            var shareContent = "?extent=" + mapExtent + "$t=" + dojo.dom.byId("imgSocialMedia").getAttribute("mapName") + "$n=";

            urlStr = encodeURIComponent(url.path) + encodeURIComponent(shareContent) + encodeURIComponent(dojo.toJson(nArray));
            charCount = (1425 - urlStr.length);
            if (urlStr.length > 1425) {
                dojo.dom.byId("imgNotes").title = "App has reached its annotation capacity for this map";
                dojo.dom.byId("imgNotes").setAttribute("noteCount" + key.replace(/ /g, ""), "disabled");
            }
            else {
                dojo.dom.byId("imgNotes").title = "Add Notes";
                dojo.dom.byId("imgNotes").setAttribute("noteCount" + key.replace(/ /g, ""), "enabled");
            }
            HideInfoContainer();
        }
        else {
            if (!tempMap) {
                map.infoWindow.hide();
            }
            else {
                tempMap.infoWindow.hide();
            }
        }
    }
    else {
        RemoveHiglightGraphic();
    }
}
var selectedMapPoint;
var selectedTempPoint;

function CreateGraphicLayer(mapCtrl, webmapInfo) {
    var gLayer1 = new esri.layers.GraphicsLayer();
    gLayer1.id = (!tempMap) ? "tempNotesLayerId" : "tempNotesGraphicLayerId";
    dojo.connect(gLayer1, "onClick", function (evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.cancelBubble = true;

        if (!tempMap) {
            notesLayerClicked = true;
        } else {
            notesGraphicLayerClicked = true;
        }
        if (evt.graphic.attributes[0].note) {
            mapCtrl.infoWindow.hide();
            var notesLayer = (!tempMap) ? mapCtrl.getLayer("tempNotesLayerId") : mapCtrl.getLayer("tempNotesGraphicLayerId");
            for (var q = 0; q < notesLayer.graphics.length; q++) {
                if (!notesLayer.graphics[q].attributes[0].note) {
                    notesLayer.remove(notesLayer.graphics[q]);
                }
            }

        } else {
            RemoveGraphic(null, noteCount, (!tempMap) ? webmapInfo.key : "temp" + webmapInfo, null);
        }

        ShowNotesInfo(evt.graphic.attributes[0], evt.graphic.geometry, ((!tempMap) ? webmapInfo.key : "temp" + webmapInfo), evt.graphic, Number(evt.graphic.attributes[0].count));
    });
    mapCtrl.addLayer(gLayer1);

    dojo.connect(mapCtrl, "onClick", function (evt) {
        if (dojo.dom.byId("imgNotes").getAttribute("state") != "unSelected") {
            HideInfoContainer();
            var iconSize = ((isBrowser) ? 30 : 44);
            var symbol = new esri.symbol.PictureMarkerSymbol("images/notesGraphic.png", iconSize, iconSize);
            noteCount++;
            var att = [];
            att.push({ count: noteCount });
            var graphic = new esri.Graphic(evt.mapPoint, symbol, att, null);

            if (!tempMap) {
                notesLayerClicked = true;
                mapCtrl.getLayer("tempNotesLayerId").add(graphic);
            } else {
                notesGraphicLayerClicked = true;
                mapCtrl.getLayer("tempNotesGraphicLayerId").add(graphic);
            }
            ShowNotesInfo(null, evt.mapPoint, ((!tempMap) ? webmapInfo.key : "temp" + webmapInfo), null, noteCount);
        }
        else if (((!tempMap) ? (!notesLayerClicked) : (!notesGraphicLayerClicked))) {
            mapCtrl.infoWindow.hide();
            if (!tempMap) {
                selectedMapPoint = evt.mapPoint;
            }
            else {
                selectedTempPoint = evt.mapPoint;
            }
            mapCtrl.setExtent(GetBrowserMapExtentforInfoWindow(evt.mapPoint));
            setTimeout(function () {
                mapCtrl.infoWindow.show(evt.mapPoint);
            }, 500);

            for (var zoom = 0; zoom < dojo.query(".esriPopup .actionsPane .action").length; zoom++) {
                dojo.query(".esriPopup .actionsPane .action")[zoom].style.display = "block";
                dojo.query(".esriPopup .actionsPane .action")[zoom].style.width = "57px";
            }
            var btnCount = 0;
            for (var next = 0; next < dojo.query(".esriPopup .titleButton.next").length; next++) {
                if (!(tempMap && next == 0)) {
                    dojo.query(".esriPopup .titleButton.next")[next].style.display = "none";
                }
                for (var title = 0; title < dojo.query(".esriPopup .titlePane .title").length; title++) {
                    setTimeout(function () {
                        btnCount++;
                        if (dojo.query(".esriPopup .titlePane .title")[btnCount - 1]) {
                            if (dojo.query(".esriPopup .titlePane .title")[btnCount - 1].innerHTML != "&nbsp;") {
                                if (dojo.query(".esriPopup .actionsPane .action")[btnCount - 1].style.display != "none") {
                                    dojo.query(".esriPopup .titleButton.next")[btnCount - 1].style.display = "block";
                                }
                            }
                        }
                    }, 2000);
                }
            }
            RemoveGraphic(null, noteCount, ((!tempMap) ? webmapInfo.key : "temp" + webmapInfo), null);
        }
    });
}



