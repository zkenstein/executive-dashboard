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
var rss = []; //array for storing the rss feeds
var trends = []; //array for storing the twitter trends

//function for creating settings page according to feeds and trends through local storage
function DisplaySettings() {
    dojo.byId("btnSettings").className = "customDisabledButton";

    GetDataFromStorage();

    dojo.byId("imgRSSAdd").onclick = function () {
        if (!dojo.byId("txtRSSFeedName").value.trim()) {
            if (!dojo.byId("txtRSSFeedURL").value.trim()) {
                dojo.byId("RSSErrorMessage").innerHTML = messages.getElementsByTagName("enterRSS")[0].childNodes[0].nodeValue;
                return;
            }
        }
        if (!dojo.byId("txtRSSFeedName").value.trim()) {
            dojo.byId("RSSErrorMessage").innerHTML = messages.getElementsByTagName("RSSName")[0].childNodes[0].nodeValue;
            return;
        }
        if (!dojo.byId("txtRSSFeedURL").value.trim()) {
            dojo.byId("RSSErrorMessage").innerHTML = messages.getElementsByTagName("RSSUrl")[0].childNodes[0].nodeValue;
            return;
        }

        if (!(dojo.byId("txtRSSFeedURL").value.match("http:") || dojo.byId("txtRSSFeedURL").value.match("https:"))) {
            dojo.byId("RSSErrorMessage").innerHTML = messages.getElementsByTagName("UrlFormat")[0].childNodes[0].nodeValue;
            return;
        }
        if (rss) {
            for (var b = 0; b < rss.length; b++) {
                if (dojo.byId("txtRSSFeedName").value.trim() == rss[b].name) {
                    dojo.byId("RSSErrorMessage").innerHTML = messages.getElementsByTagName("existingFeed")[0].childNodes[0].nodeValue;
                    dojo.byId("txtRSSFeedName").value = "";
                    return;
                }
            }
        }
        rss.push({
            "name": dojo.byId("txtRSSFeedName").value.trim(),
            "url": dojo.byId("txtRSSFeedURL").value,
            "checked": false
        });
        PopulateFeedList();
    };
    dojo.byId("imgTwiiterAdd").onclick = function () {
        if (!dojo.byId("txtTwitterTrendName").value.trim()) {
            dojo.byId("twitterErrorMessage").innerHTML = messages.getElementsByTagName("trendName")[0].childNodes[0].nodeValue;
            return;
        }
        if (trends) {
            for (var b = 0; b < trends.length; b++) {
                if (dojo.byId("txtTwitterTrendName").value.trim() == trends[b].name) {
                    dojo.byId("twitterErrorMessage").innerHTML = messages.getElementsByTagName("existingTrend")[0].childNodes[0].nodeValue;
                    dojo.byId("txtTwitterTrendName").value = "";
                    return;
                }
            }
        }
        trends.push({
            "name": dojo.byId("txtTwitterTrendName").value.trim()
        });
        PopulateTrendList();
    };
    PopulateFeedList();
    PopulateTrendList();
}

//function for creating the RSS feed list in the panel
function PopulateFeedList() {
    dojo.byId("RSSErrorMessage").innerHTML = "";
    RemoveChildren(dojo.byId("divRSSFeedContent"));
    var table = document.createElement("table");
    table.style.width = "100%";
    table.cellSpacing = 0;
    table.cellPadding = 0;
    dojo.byId("divRSSFeedContent").appendChild(table);
    var tBody = document.createElement("tbody");
    table.appendChild(tBody);
    CreateSettingsListTemplate(rss, tBody, true);
    dojo.byId("txtRSSFeedName").value = "";
    dojo.byId("txtRSSFeedURL").value = "";
    CreateScrollbar(dojo.byId('divRSSFeedContainer'), dojo.byId('divRSSFeedContent'));
}

//function for creating the twitter trend list in the panel
function PopulateTrendList() {
    dojo.byId("twitterErrorMessage").innerHTML = "";
    RemoveChildren(dojo.byId("divTwitterFeedContent"));
    var table = document.createElement("table");
    table.style.width = "100%";
    table.cellSpacing = 0;
    table.cellPadding = 0;
    dojo.byId("divTwitterFeedContent").appendChild(table);
    var tBody = document.createElement("tbody");
    table.appendChild(tBody);
    CreateSettingsListTemplate(trends, tBody, false);
    dojo.byId("txtTwitterTrendName").value = "";
    CreateScrollbar(dojo.byId('divTwitterFeedContainer'), dojo.byId('divTwitterFeedContent'));
}

//function to move up the position of list element
function MoveUp(Cname, Carray) {
    for (var arr = 0; arr < Carray.length; arr++) {
        if (Cname == Carray[arr].name) {
            var sortArray = [];
            if (arr != 0) {
                sortArray.push({
                    "sort": Carray[arr - 1]
                });
                sortArray.push({
                    "sort": Carray[arr]
                });
                Carray[arr - 1] = sortArray[1].sort;
                Carray[arr] = sortArray[0].sort;
                break;
            } else {
                sortArray.push({
                    "sort": Carray[Carray.length - 1]
                });
                sortArray.push({
                    "sort": Carray[arr]
                });
                Carray[Carray.length - 1] = sortArray[1].sort;
                Carray[arr] = sortArray[0].sort;
                break;
            }
        }
    }
    return Carray;
}

//function to move down the position of list element
function MoveDown(Dname, Darray) {
    for (var arr = 0; arr < Darray.length; arr++) {
        if (Dname == Darray[arr].name) {
            var sortArray = [];
            if (arr != (Darray.length - 1)) {
                sortArray.push({
                    "sort": Darray[arr + 1]
                });
                sortArray.push({
                    "sort": Darray[arr]
                });
                Darray[arr + 1] = sortArray[1].sort;
                Darray[arr] = sortArray[0].sort;
                break;
            } else {
                sortArray.push({
                    "sort": Darray[0]
                });
                sortArray.push({
                    "sort": Darray[arr]
                });
                Darray[0] = sortArray[1].sort;
                Darray[arr] = sortArray[0].sort;
                break;
            }
        }
    }
    return Darray;
}

//function to remove the element
function RemoveElement(Rname, Rarray) {
    for (var l = 0; l < Rarray.length; l++) {
        if (Rname == Rarray[l].name) {
            Rarray.splice(l, 1);
            break;
        }
    }
    return Rarray;
}

//function to create the settings list data structure
function CreateSettingsListTemplate(arrayList, tBody, feed) {
    if (arrayList) {
        for (var r = 0; r < arrayList.length; r++) {
            var tr = document.createElement("tr")
            if (r % 2 != 0) {
                tr.className = "listDarkColor";
            } else {
                tr.className = "listLightColor";
            }
            tBody.appendChild(tr);
            var td = document.createElement("td");
            td.style.width = "75%";
            td.style.paddingLeft = "3px";
            td.style.paddingTop = "10px";
            td.style.paddingBottom = "10px";
            td.style.borderBottom = "1px #000 solid";
            if (arrayList[r].name.length > ((isBrowser) ? 100 : 70)) {
                td.innerHTML = arrayList[r].name.trimString(((isBrowser) ? 100 : 70));
                td.title = arrayList[r].name;
            }
            else {
                td.innerHTML = arrayList[r].name;
            }
            tr.appendChild(td);

            var tdUp = document.createElement("td");
            tdUp.style.borderBottom = "1px #000 solid";
            tdUp.align = "center";
            tdUp.className = 'imgOptions';
            tr.appendChild(tdUp);
            var imgUP = document.createElement("img");
            imgUP.id = "imgUP" + arrayList[r].name;
            imgUP.setAttribute("ComName", arrayList[r].name);
            imgUP.src = "images/up-arrow.png";
            imgUP.title = "Move up";
            imgUP.style.cursor = "pointer";
            if (arrayList.length > 1) {
                imgUP.style.display = "block";
            } else {
                imgUP.style.display = "none";
            }
            imgUP.className = 'imgOptions';
            imgUP.onclick = function (evt) {
                var array = MoveUp(this.getAttribute("ComName"), arrayList);
                if (feed) {
                    rss = array;
                    PopulateFeedList();
                } else {
                    trends = array;
                    PopulateTrendList();
                }
            }
            tdUp.appendChild(imgUP);
            var tdDown = document.createElement("td");
            tdDown.style.borderBottom = "1px #000 solid";
            tdDown.className = 'imgOptions';
            tdDown.align = "center";
            tr.appendChild(tdDown);
            var imgDown = document.createElement("img");
            imgDown.id = "imgDown" + arrayList[r].name;
            imgDown.src = "images/down-arrow.png";
            imgDown.setAttribute("ComName", arrayList[r].name);
            imgDown.style.cursor = "pointer";
            imgDown.title = "Move down";
            if (arrayList.length > 1) {
                imgDown.style.display = "block";
            } else {
                imgDown.style.display = "none";
            }
            imgDown.className = 'imgOptions';
            imgDown.onclick = function () {
                var dArray = MoveDown(this.getAttribute("ComName"), arrayList)
                if (feed) {
                    rss = dArray;
                    PopulateFeedList();
                } else {
                    trends = dArray;
                    PopulateTrendList();
                }
            }
            tdDown.appendChild(imgDown);
            var tdClose = document.createElement("td");
            tdClose.style.borderBottom = "1px #000 solid";
            tdClose.align = "center";
            tdClose.className = 'imgOptions';
            tr.appendChild(tdClose);
            if (!arrayList[r].type) {
                var imgClose = document.createElement("img");
                imgClose.id = "imgClose" + arrayList[r].name;
                imgClose.setAttribute("ComName", arrayList[r].name);
                imgClose.src = "images/close.png";
                imgClose.style.cursor = "pointer";
                imgClose.className = 'imgOptions';
                imgClose.title = "Remove";
                imgClose.onclick = function (evt) {
                    var Rarray = RemoveElement(this.getAttribute("ComName"), arrayList);
                    if (feed) {
                        rss = Rarray;
                        PopulateFeedList();
                    } else {
                        trends = Rarray;
                        PopulateTrendList();
                    }
                }
                tdClose.appendChild(imgClose);
            }

            if (feed) {
                var tdCheck = document.createElement("td");
                tdCheck.style.borderBottom = "1px #000 solid";
                tdCheck.align = "center";
                tdCheck.className = 'imgOptions';


                var check = document.createElement("img");
                check.className = 'imgOptions';

                if (arrayList[r].checked) {
                    check.src = "images/checked.png";
                    check.setAttribute("checked", true);
                } else {
                    check.src = "images/unchecked.png";
                    check.setAttribute("checked", false);
                }
                check.onclick = function () {
                    if (this.getAttribute("checked").bool()) {
                        this.src = "images/unchecked.png";
                        this.setAttribute("checked", false);
                    }
                    else {
                        this.src = "images/checked.png";
                        this.setAttribute("checked", true);
                    }

                    for (var z = 0; z < arrayList.length; z++) {
                        if (this.id.split("chkBox")[1] == arrayList[z].name) {
                            arrayList[z].checked = this.getAttribute("checked").bool();
                            rss = arrayList;
                        }
                    }
                }
                check.id = 'chkBox' + arrayList[r].name;
                tdCheck.appendChild(check);
                tr.appendChild(tdCheck);
            }
        }
    }
}

//function for converting string to boolean
String.prototype.bool = function () {
    return (/^true$/i).test(this);
};

//function for saving the changes in settings page
function SaveSettings() {
    dojo.byId("btnSettings").className = "customButton";
    dojo.byId("btnSettings").style.cursor = "pointer";
    if (rss) {
        for (var l = 0; l < rss.length; l++) {
            if (dojo.byId("chkBox" + rss[l].name).getAttribute("checked").bool()) {
                rss[l].checked = true;
            } else {
                rss[l].checked = false;
            }
        }
    }

    localStorage.setItem("RSSFeedCollection", dojo.toJson(rss));
    localStorage.setItem("TwitterTrendCollection", dojo.toJson(trends));
    PopulateNews(dojo.byId("btnNews"));
    dojo.byId("divSettingsContainer").style.display = "none";
    dojo.byId("divInfoContainer").style.display = "block";
    if (isTablet) {
        SetHomePageHeight();
    }
}

//function to cancel the changes in settings page
function CancelSettings() {
    dojo.byId("btnSettings").className = "customButton";
    dojo.byId("btnSettings").style.cursor = "pointer";
    dojo.byId("divInfoContainer").style.display = "block";
    dojo.byId("divSettingsContainer").style.display = "none";
    GetDataFromStorage();

    if (isTablet) {
        SetHomePageHeight();
    }
}

//function to fetch data from local storage
function GetDataFromStorage() {
    if (dojo.fromJson(localStorage.getItem("RSSFeedCollection"))) {
        rss = dojo.fromJson(localStorage.getItem("RSSFeedCollection"));
        if (!rss) {
            rss = [];
            rss.push({
                "name": defaultNewsFields[0].RSSFeedName,
                "url": defaultNewsFields[0].RSSFeedURL,
                "checked": true,
                "type": "default"
            });
        }
    }
    if (dojo.fromJson(localStorage.getItem("TwitterTrendCollection"))) {
        trends = dojo.fromJson(localStorage.getItem("TwitterTrendCollection"));
        if (!trends) {
            trends = [];
            trends.push({
                "name": defaultNewsFields[1].TwitterTrendName,
                "type": "default"
            });
        }
    }
}