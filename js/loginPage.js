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
dojo.require("js.date");
dojo.require("dojo.window");
dojo.require("dojo.string");
dojo.require("dojox.charting.Chart2D");
dojo.require("dojox.charting.themes.RoyalPurples");
dojo.require("esri.map");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.tasks.geometry");
dojo.require("esri.arcgis.utils");
dojo.require("esri.arcgis.Portal");
dojo.require("dojo.number");
dojo.require("dojo.dom");
dojo.require("dojo.dom-geometry");
dojo.require("dojo.dom-class");

var authenticatedGroup; //variable for storing the group link for authentication
var authenticatedLinks; //variable for storing the links for token generation
var baseMapLayer; //variable for storing the basemap value
var defaultNewsFields; //variable to store default news feeds for twitter and RSS
var formatDateAs; //variable to store the date format
var geometryService; //variable for storing the geometry service URL
var infoPodStatics; //variable for storing statistics data of the layers
var infoWindow; //variable for storing the info window object
var isBrowser = false; //This variable will be set to 'true' when application is accessed from desktop browsers
var isTablet = false; //This variable will be set to 'true' when application is accessed from tablet device
var layerImages; //variable for storing the images for subject groups
var locatorSettings; //variable to store the locator settings

var map; //variable for storing the map object
var mapClick; //variable for storing the click event handling for map
var mapPoint; //variable for storing the point geometry
var mapSharingOptions; //variable for storing the tiny URL links
var messages; //variable for the error messages
var retainState; //flag set to retain state of containers
var rssFields; //variable for storing the rss fields
var showNullValueAs; //variable for storing values to be shown for null values
var startExtent; //variable for storing the default extent
var statisticsKeyword; // variable for identifying statistics layer
var tempGraphicsLayerId = 'tempGraphicsLayerID';  //variable to store graphics layer ID
var temporaryGraphicsLayerId = 'temporaryGraphicsLayerId'; //variable to store graphics layer ID for temporary map
var twitterDetails; //variable for storing twitter link and fields
var podInformation; //variable for storing information of pods
var welcomeScreenImages; //variable for storing images for welcome screen
var portal, portalUrl = document.location.protocol + '//www.arcgis.com';
var portalUser = null;
var share; //flag to determine whether the application is shared or not

var lastSearchString; //variable for storing the last search string value
var stagedSearch; //variable for storing the time limit for search
var lastSearchTime; //variable for storing the time of last searched value

//This initialization function is called when the DOM elements are ready
function Init() {
    esri.config.defaults.io.proxyUrl = "proxy.ashx";
    esriConfig.defaults.io.alwaysUseProxy = false;
    esriConfig.defaults.io.timeout = 180000;

    // Create the portal
    portal = new esri.arcgis.Portal(portalUrl);

    // Set error messages from xml file
    dojo.xhrGet({
        url: "errorMessages.xml",
        handleAs: "xml",
        preventCache: true,
        load: function (xmlResponse) {
            messages = xmlResponse;


            if (dojo.isIE < 9 || dojo.isFF <= 3.5 || dojo.isChrome <= 5 || dojo.isOpera <= 9.5 || dojo.isSafari <= 3.1) {
                alert(messages.getElementsByTagName("browserSupport")[0].childNodes[0].nodeValue);
                return;
            }

            share = GetQuerystring('extent');
            if (share != "") {
                dojo.dom.byId("divTextContainer").style.display = "none";
                dojo.dom.byId("divMapContainer").style.display = "none";

                ShowProgressIndicator();

                portal.signIn().then(function (loggedInUser) {
                    portalUser = loggedInUser;
                    sessionStorage.clear();
                    FindArcGISGroup();
                });
                if (dojo.query(".dijitDialogPaneContentArea")[0]) {
                    dojo.query(".dijitDialogPaneContentArea")[0].childNodes[0].innerHTML = "Enter your Username and Password";
                }
            }
            else {
                dojo.dom.byId("divTextContainer").style.display = "block";
            }

            var userAgent = window.navigator.userAgent;

            if ((userAgent.indexOf("iPad") >= 0) || (userAgent.indexOf("Android") >= 0)) {
                isTablet = true;
                dojo.dom.byId('dynamicStyleSheet').href = "styles/tablet.css";
            }
            else {
                isBrowser = true;
                dojo.dom.byId('dynamicStyleSheet').href = "styles/browser.css";
            }

            dojo.connect(window, 'onresize', function (evt) {
                setTimeout(function () {
                    CreateScrollbar(dojo.dom.byId('divLayerContainer'), dojo.dom.byId('divLayerContent'));
                }, 500);
                if (map) {
                    if (dojo.dom.byId("map").style.display != "none") {
                        dojo.dom.byId('map').style.marginLeft = (dojo['dom-geometry'].getMarginBox("holder").l) + "px";
                        dojo.dom.byId('divFrozen').style.marginLeft = (dojo['dom-geometry'].getMarginBox("holder").l) + "px";
                        dojo.dom.byId('showHide').style.right = (dojo['dom-geometry'].getMarginBox("holder").l + 15) + "px";
                        ToggleContainers();
                        map.reposition();
                        map.resize();
                        ResetSlideControls();
                        dojo.dom.byId("divTempMap").style.left = ((dojo['dom-geometry'].getMarginBox("mapContainer").w + (dojo['dom-geometry'].getMarginBox("holder").l)) - dojo['dom-geometry'].getMarginBox("divMap").w) + "px";
                        setTimeout(function () {
                            dojo.dom.byId("divFrozen").style.height = (map.height - 140) + "px";
                        }, 500);
                        ResizeChartContainer();
                    }
                }
            });

            dojo.connect(window, 'onkeyup', function (evt) {
                if (dojo.dom.byId("divLoginScreenContainer").style.display != "none") {
                    if (evt.keyCode == dojo.keys.ESCAPE) {
                        HideProgressIndicator();
                    }
                }
            });

            if (isTablet) {
                SetLoginPageHeight();
                dojo.dom.byId("tdMapControls").style.width = ((window.matchMedia("(orientation: portrait)").matches) ? "300px" : "330px");
                dojo.dom.byId("tdMapButtons").style.width = ((window.matchMedia("(orientation: portrait)").matches) ? "300px" : "330px");
            }

            // Read config.js file to set appropriate values
            var responseObject = new js.config();
            document.title = responseObject.ApplicationName;

            var link = document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            link.href = responseObject.ApplicationFaviIcon;
            document.getElementsByTagName('head')[0].appendChild(link);

            var HomeLink = document.createElement('link');
            HomeLink.type = 'image/png';
            HomeLink.rel = 'apple-touch-icon';
            HomeLink.href = responseObject.HomeScreenIcon;
            document.getElementsByTagName('head')[0].appendChild(HomeLink);

            dojo.dom.byId("lblAppName").innerHTML = responseObject.ApplicationName.trimString(19);
            dojo.dom.byId("lblAppName").title = responseObject.ApplicationName;
            dojo.dom.byId("divWelcomeContent").innerHTML = responseObject.WelcomeScreenMessage;
            dojo.dom.byId("tdSearchHeader").innerHTML = responseObject.LocatorSettings.DisplayText;
            welcomeScreenImages = responseObject.WelcomeScreenImages;
            authenticatedGroup = responseObject.AuthenticatedGroup;
            authenticatedLinks = responseObject.AuthenticatedLinks;
            mapSharingOptions = responseObject.MapSharingOptions;
            infoPodStatics = responseObject.InfoPodStatics;
            showNullValueAs = responseObject.ShowNullValueAs;
            formatDateAs = responseObject.FormatDateAs;
            podInformation = responseObject.PodInformation;
            layerImages = responseObject.LayerImages;
            geometryService = new esri.tasks.GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
            rssFields = responseObject.RSSFields;
            statisticsKeyword = responseObject.StatisticsKeyword;
            dojo.dom.byId("tdGraphTab").innerHTML = responseObject.GraphTabName.trimString(10);
            dojo.dom.byId("tdGraphTab").title = responseObject.GraphTabName;
            defaultNewsFields = responseObject.DefaultNewsFields;
            dojo.dom.byId("tdHeaderBookmark").innerHTML = responseObject.BookmarkHeader;
            locatorSettings = responseObject.LocatorSettings;

            // Set address search parameters
            dojo.dom.byId("txtAddress").setAttribute("defaultAddress", responseObject.LocatorSettings.DefaultValue);
            dojo.dom.byId('txtAddress').value = responseObject.LocatorSettings.DefaultValue;
            lastSearchString = dojo.dom.byId("txtAddress").value.trim();
            dojo.dom.byId("txtAddress").setAttribute("defaultAddressTitle", responseObject.LocatorSettings.DefaultValue);
            dojo.dom.byId("txtAddress").style.color = "gray";
            dojo.connect(dojo.dom.byId('txtAddress'), "ondblclick", ClearDefaultText);
            dojo.connect(dojo.dom.byId('txtAddress'), "onfocus", function (evt) {
                this.style.color = "#000";
            });
            dojo.connect(dojo.dom.byId('txtAddress'), "onblur", ReplaceDefaultText);

            // Identify the key presses while implementing auto-complete and assign appropriate actions
            dojo.connect(dojo.dom.byId("txtAddress"), 'onkeyup', function (evt) {
                if (evt) {
                    if (evt.keyCode == dojo.keys.ENTER) {
                        if (dojo.dom.byId("txtAddress").value != '') {
                            dojo.dom.byId("imgSearchLoader").style.display = "block";
                            LocateAddress();
                            return;
                        }
                    }
                    if ((!((evt.keyCode >= 46 && evt.keyCode < 58) || (evt.keyCode > 64 && evt.keyCode < 91) || (evt.keyCode > 95 && evt.keyCode < 106) || evt.keyCode == 8 || evt.keyCode == 110 || evt.keyCode == 188)) || (evt.keyCode == 86 && evt.ctrlKey) || (evt.keyCode == 88 && evt.ctrlKey)) {
                        evt = (evt) ? evt : event;
                        evt.cancelBubble = true;
                        if (evt.stopPropagation) evt.stopPropagation();
                        return;
                    }

                    if (dojo['dom-geometry'].getMarginBox("divAddressContent").h > 0) {
                        if (dojo.dom.byId("txtAddress").value.trim() != '') {
                            if (lastSearchString != dojo.dom.byId("txtAddress").value.trim()) {
                                lastSearchString = dojo.dom.byId("txtAddress").value.trim();
                                RemoveChildren(dojo.dom.byId('tblAddressResults'));

                                // Clear any staged search
                                clearTimeout(stagedSearch);

                                if (dojo.dom.byId("txtAddress").value.trim().length > 0) {
                                    // Stage a new search, which will launch if no new searches show up
                                    // before the timeout
                                    stagedSearch = setTimeout(function () {
                                        dojo.dom.byId("imgSearchLoader").style.display = "block";
                                        LocateAddress();
                                    }, 500);
                                }
                            }
                        } else {
                            lastSearchString = dojo.dom.byId("txtAddress").value.trim();
                            dojo.dom.byId("imgSearchLoader").style.display = "none";
                            RemoveChildren(dojo.dom.byId('tblAddressResults'));
                            CreateScrollbar(dojo.dom.byId("divAddressScrollContainer"), dojo.dom.byId("divAddressScrollContent"));
                        }
                    }
                }
            });

            dojo.connect(dojo.dom.byId("txtAddress"), 'onpaste', function (evt) {
                setTimeout(function () {
                    LocateAddress();
                }, 100);
            });

            dojo.connect(dojo.dom.byId("txtAddress"), 'oncut', function (evt) {
                setTimeout(function () {
                    LocateAddress();
                }, 100);
            });

            retainState = responseObject.RetainState;
            twitterDetails = responseObject.TwitterDetails;
            baseMapLayer = responseObject.BaseMapLayer;

            for (var i = 0; i < welcomeScreenImages.length; i++) {
                dojo.dom.byId("span" + i + "Welcome").innerHTML = welcomeScreenImages[i].Name;
                dojo.dom.byId("img" + i + "Welcome").src = welcomeScreenImages[i].Image;
            }

            // Open help page upon clicking help button on dashboard page
            dojo.connect(dojo.dom.byId('btnHelp'), "onclick", function () {
                window.open(responseObject.HelpURL);
            });
            // Open help page upon clicking help button on map page
            dojo.connect(dojo.dom.byId('btnMapHelp'), "onclick", function () {
                window.open(responseObject.HelpURL);
            });
            // Create scroll bar for welcome text on home page
            setTimeout(function () {
                CreateScrollbar(dojo.dom.byId('divWelcomeContainer'), dojo.dom.byId('divWelcomeContent'));
            }, 500);
        }
    });
}
dojo.addOnLoad(Init);

//This function is used to authenticate the user
function AuthenticateUser() {
    ShowProgressIndicator();
    var signInLink = dojo.dom.byId('tdPanelSign');
    if (signInLink.innerHTML.indexOf('In') !== -1) {
        portal.signIn().then(function (loggedInUser) {
            portalUser = loggedInUser;
            sessionStorage.clear();
            FindArcGISGroup();
        });
        if (dojo.query(".dijitDialogPaneContentArea")[0]) {
            dojo.query(".dijitDialogPaneContentArea")[0].childNodes[0].innerHTML = "Enter your Username and Password";
        }
    } else {
        portal.signOut().then(function (portalInfo) {
            HideProgressIndicator();
            SignOut();
            portalUser = null;
            if (share != "") {
                var url = decodeURIComponent(window.location.toString());
                window.location.href = url.split("?extent=")[0];
            }
        });
    }

    dojo.connect(dojo.query(".dijitDialogCloseIcon")[0], "onclick", function (info) {
        HideProgressIndicator();
    });
    dojo.connect(dojo.query(".esriIdCancel")[0], "onclick", function (info) {
        HideProgressIndicator();
    });
}

//Function to find the authenticated group
//This function is used to find the group by its groupId; It also identifies webmaps for each subject group
function FindArcGISGroup() {
    var params = {
        q: 'group:' + authenticatedGroup,
        num: 100  // max allowed value
    }

    portal.queryItems(params).then(function (groupdata) {
        var data = portalUser.credential;

        RemoveChildren(dojo.dom.byId("divLayerContent"));
        arrSubjectGroups = [];

        dojo.dom.byId("btnSettings").className = "customButton";
        dojo.dom.byId("tdPanelSign").innerHTML = "Sign Out";
        dojo.dom.byId("btnMap").className = "customButton";
        dojo.dom.byId("divLoginScreenContainer").style.display = "none";
        dojo.dom.byId("divInfoContainer").style.display = "block";
        dojo.dom.byId("btnSettings").style.cursor = "pointer";
        dojo.dom.byId("btnMap").style.cursor = "pointer";

        if (isTablet) {
            SetHomePageHeight();
        }
        CreateScrollbar(dojo.dom.byId('divLayerContainer'), dojo.dom.byId('divLayerContent'));
        CreateScrollbar(dojo.dom.byId('divNAEDisplayContainer'), dojo.dom.byId('divNAEDisplayContent'));
        CreateScrollbar(dojo.dom.byId('divRSSFeedContainer'), dojo.dom.byId('divRSSFeedContent'));
        CreateScrollbar(dojo.dom.byId('divTwitterFeedContainer'), dojo.dom.byId('divTwitterFeedContent'));

        var userGroupDetails = authenticatedLinks.split("${0}");
        var userGroupLink = userGroupDetails[0] + authenticatedGroup + userGroupDetails[1] + data.token;
        esri.request({
            url: userGroupLink,
            callbackParamName: "callback",
            load: function (groupdata) {
                var compareWebmaps = [];
                for (var t = 0; t < groupdata.items.length; t++) {
                    for (var u = 0; u < groupdata.items[t].tags.length; u++) {
                        if (groupdata.items[t].type == "Web Map") {
                            if (groupdata.items[t].tags[u] != baseMapLayer[0].MapValue) {
                                if (groupdata.items[t].tags[u] != "Key Indicator") {
                                    if (arrSubjectGroups[groupdata.items[t].tags[u]]) {
                                        arrSubjectGroups[groupdata.items[t].tags[u]].push({ "webMapId": groupdata.items[t].id, "title": groupdata.items[t].title, "tags": groupdata.items[t].tags });
                                    }
                                    else {
                                        arrSubjectGroups[groupdata.items[t].tags[u]] = [];
                                        arrSubjectGroups[groupdata.items[t].tags[u]].push({ "webMapId": groupdata.items[t].id, "title": groupdata.items[t].title, "tags": groupdata.items[t].tags });
                                    }
                                }
                            }
                            else {
                                if (groupdata.items[t].tags[u] == "Compare") {
                                    compareWebmaps.push(groupdata.items[t].id);
                                }
                            }
                        }
                    }
                }

                //Arrange dashboard pods as per the order specified in configuration file
                var orderedLayer = [];
                for (var u in layerImages) {
                    for (var v in arrSubjectGroups) {
                        if (layerImages[u].Tag == v) {
                            orderedLayer[v] = [];
                            orderedLayer[v] = arrSubjectGroups[v];
                        }
                    }
                }

                //For each group, identify webmaps having key indicators and get it's statistical information
                var keyCounter = 0;
                var responseCounter = 0;
                var keyIndicators = [];
                var indicatorState = [];

                for (var p in orderedLayer) {
                    for (var g in orderedLayer[p]) {
                        for (var h in orderedLayer[p][g].tags) {
                            if (orderedLayer[p][g].tags[h] == "Key Indicator") {
                                keyCounter++;
                                var mapDeferred = esri.arcgis.utils.createMap(orderedLayer[p][g].webMapId, "map", {
                                    mapOptions: {
                                        slider: false
                                    }
                                });
                                dojo.dom.byId("imgResize").setAttribute("webmapID", orderedLayer[p][g].webMapId);
                                mapDeferred.addCallback(function (response) {
                                    map = response.map;
                                    map.destroy();
                                    responseCounter++;
                                    var webmapInfo = {};
                                    webmapInfo.key = response.itemInfo.item.title;
                                    dojo.dom.byId("imgResize").setAttribute("webmapKey", webmapInfo.key);
                                    webmapInfo.operationalLayers = response.itemInfo.itemData.operationalLayers;
                                    webmapInfo.baseMap = response.itemInfo.itemData.baseMap.baseMapLayers;
                                    keyIndicators.push(webmapInfo);
                                    if (keyCounter == responseCounter) {
                                        PopulateIndicatorData(keyIndicators, 0, indicatorState, orderedLayer, data.token, groupdata);
                                    }
                                });
                                mapDeferred.addErrback(function (error) {
                                    HideProgressIndicator();
                                    alert(dojo.toJson(error));
                                });
                            }
                            else if (orderedLayer[p][g].tags[h] == "Compare") {
                                compareWebmaps.push(orderedLayer[p][g].webMapId);
                            }
                        }
                    }
                }
                if (compareWebmaps.length > 0) {
                    dojo.dom.byId("imgResize").setAttribute("compareId", dojo.toJson(compareWebmaps));
                }

                //Display News and Events panel when none groups have key indicator
                if (keyCounter == 0) {
                    CreateLayerPods(orderedLayer, data.token, groupdata, null);
                    PopulateNews(dojo.dom.byId("btnNews"));
                }
                CheckBasemap(orderedLayer, groupdata, data);

                //Create basemap when clicked on Map button on dashboard page
                mapClick = dojo.connect(dojo.dom.byId('btnMap'), "onclick", function (evt) {
                    if (dojo.dom.byId("btnMap").style.cursor == "pointer") {
                        ShowProgressIndicator();
                        if (map) {
                            map.destroy();
                        }
                        CreateBasemap(orderedLayer, groupdata, data);
                    }
                });
                //Decode the shared URL when shared application is accessed
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
                    if (group == baseMapLayer[0].MapValue) {
                        CreateBasemap(orderedLayer, groupdata, data);
                    }
                }
            }
        }, { useProxy: true });
        dojo.dom.byId("map").style.display = "none";
        //Open Setting page upon clicking 'Settings' on dashboard page
        dojo.dom.byId("btnSettings").onclick = function () {
            if (dojo.dom.byId("btnSettings").className != "customDisabledButton") {
                if (dojo.dom.byId("divSettingsContainer").style.display != "block") {
                    dojo.dom.byId("divInfoContainer").style.display = "none";
                    dojo.dom.byId("divSettingsContainer").style.display = "block";
                    if (isTablet) {
                        SetSettingsHeight();
                    }
                    dojo.dom.byId("btnSettings").style.cursor = "default";
                    DisplaySettings();
                }
            }
        }
    });
}

//Function to create the basemap
function CreateBasemap(orderedLayer, groupdata, data) {
    for (var q = 0; q < groupdata.items.length; q++) {
        for (i = 0; i < groupdata.items[q].tags.length; i++) {
            if (groupdata.items[q].tags[i] == baseMapLayer[0].MapValue) {
                var webmapDetails = esri.arcgis.utils.createMap(groupdata.items[q].id, "map", {
                    mapOptions: {
                        slider: false
                    }
                });
                dojo.dom.byId("imgResize").setAttribute("webmapID", groupdata.items[q].id);
                webmapDetails.addCallback(function (response) {
                    map = response.map;
                    map.destroy();

                    var webmapInfo = {};
                    webmapInfo.id = response.itemInfo.item.id;
                    webmapInfo.key = response.itemInfo.item.title;
                    dojo.dom.byId("imgResize").setAttribute("webmapKey", webmapInfo.key);
                    webmapInfo.operationalLayers = response.itemInfo.itemData.operationalLayers;
                    webmapInfo.baseMap = response.itemInfo.itemData.baseMap.baseMapLayers;

                    dojo.dom.byId("divServiceDetails").style.display = "none";
                    RemoveChildren(dojo.dom.byId("trBottomHeaders"));
                    RemoveChildren(dojo.dom.byId("trBottomTags"));
                    RemoveChildren(dojo.dom.byId("tblMoreResults"));

                    dojo['dom-class'].replace("divGraphComponent", "hideContainerHeight", "showContainerHeight");
                    dojo.dom.byId('divGraphComponent').style.height = '0px';
                    dojo.dom.byId('showHide').style.top = '59px';
                    dojo.dom.byId("divGraphHeader").style.display = "none";
                    dojo.dom.byId("divGraphHeader").style.color = "gray";
                    dojo.dom.byId("divGraphHeader").setAttribute("state", "disabled");
                    dojo.dom.byId("divGraphHeader").style.cursor = "default";

                    PopulateEventDetails(webmapInfo.id, orderedLayer, dojo.dom.byId("lblAppName").innerHTML, webmapInfo, groupdata, data.token, true, false, null);
                });
                webmapDetails.addErrback(function (error) {
                    HideProgressIndicator();
                    alert(dojo.toJson(error));
                });
                break;
            }
        }
    }
}

//Function to check the basemap
function CheckBasemap(orderedLayer, groupdata, data) {
    var baseLayer = false;
    for (var q = 0; q < groupdata.items.length; q++) {
        for (i = 0; i < groupdata.items[q].tags.length; i++) {
            if (groupdata.items[q].tags[i] == baseMapLayer[0].MapValue) {
                baseLayer = true;
            }
        }
    }
    if (!baseLayer) {
        dojo.dom.byId("btnMap").style.color = "gray";
        dojo.dom.byId("btnMap").style.cursor = "default";
    }
}

//When user logs out, Clear session storage and redirect to home page
function SignOut() {
    sessionStorage.clear();
    startExtent = "";
    dojo.disconnect(mapClick);

    RemoveChildren(dojo.dom.byId("divLayerContent"));
    RemoveChildren(dojo.dom.byId("divNAEDisplayContent"));

    dojo['dom-class'].replace("divGraphComponent", "hideContainerHeight", "showContainerHeight");
    dojo.dom.byId('divGraphComponent').style.height = '0px';
    dojo.dom.byId('showHide').style.top = '59px';

    dojo.dom.byId("imgBookmark").src = "images/imgBookmark.png";
    dojo['dom-class'].replace("divBookmarkContent", "hideContainerHeight", "showContainerHeight");
    dojo.dom.byId('divBookmarkContent').style.height = '0px';

    dojo.dom.byId("imgSearch").src = "images/locate.png";
    dojo['dom-class'].replace("divAddressContent", "hideContainerHeight", "showContainerHeight");
    dojo.dom.byId('divAddressContent').style.height = '0px';

    if (dojo.dom.byId("imgMore")) {
        dojo.dom.byId("imgMore").src = "images/more.png";
    }
    dojo['dom-class'].replace("divMoreContent", "hideContainerHeight", "showContainerHeight");
    dojo.dom.byId('divMoreContent').style.height = '0px';

    dojo.dom.byId("imgGeolocation").src = "images/imgGeolocation.png";

    dojo.dom.byId("btnSettings").style.cursor = "default";
    dojo.dom.byId("btnMap").style.cursor = "default";

    dojo.dom.byId("divInfoContainer").style.display = "none";
    dojo.dom.byId("divSettingsContainer").style.display = "none";

    dojo.dom.byId("btnSettings").className = "customDisabledButton";
    dojo.dom.byId("tdPanelSign").innerHTML = "Sign In";
    dojo.dom.byId("btnMap").className = "customDisabledButton";
    dojo.dom.byId("divLoginScreenContainer").style.display = "block";
    if (isTablet) {
        SetLoginPageHeight();
    }
}

//For every subject group query statistics layer that consists of key indicators then transfer the data to create pods for subject groups
function PopulateIndicatorData(keyIndicators, val, indicatorState, orderedLayer, token, groupdata) {
    var statsFlag = false;
    if (keyIndicators[val]) {
        for (var b = 0; b < keyIndicators[val].operationalLayers.length; b++) {
            if (keyIndicators[val].operationalLayers[b].title.indexOf(statisticsKeyword) >= 0) {
                statsFlag = true;
                var queryDate = (new Date()).getTime();
                var queryTask = new esri.tasks.QueryTask(keyIndicators[val].operationalLayers[b].url);
                var queryCounty = new esri.tasks.Query();
                queryCounty.where = "1=1 AND " + queryDate + "=" + queryDate;
                queryCounty.returnGeometry = false;
                queryCounty.outFields = ["*"];
                queryCounty.outSpatialReference = map.spatialReference;

                queryTask.execute(queryCounty, function (featureSet) {
                    indicatorState.push({ key: keyIndicators[val].key, value: featureSet.features[0].attributes });
                    val++;
                    if (keyIndicators.length == val) {
                        CreateLayerPods(orderedLayer, token, groupdata, indicatorState);
                        PopulateNews(dojo.dom.byId("btnNews"));
                        return;
                    }
                    PopulateIndicatorData(keyIndicators, val, indicatorState, orderedLayer, token, groupdata);
                },
                        function (err) {
                            alert(err.message);
                            val++;
                            if (keyIndicators.length == val) {
                                CreateLayerPods(orderedLayer, token, groupdata, indicatorState);
                                PopulateNews(dojo.dom.byId("btnNews"));
                                return;
                            }
                            PopulateIndicatorData(keyIndicators, val, indicatorState, orderedLayer, token, groupdata);
                        });
            }
        }
        if (!statsFlag) {
            val++;
            if (keyIndicators.length == val) {
                CreateLayerPods(orderedLayer, token, groupdata, indicatorState);
                PopulateNews(dojo.dom.byId("btnNews"));
                return;
            }
            PopulateIndicatorData(keyIndicators, val, indicatorState, orderedLayer, token, groupdata);
        }
    }
}