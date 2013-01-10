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
dojo.require("js.date");
dojo.require("dojo.window");
dojo.require("dojo.string");
dojo.require("dojox.charting.Chart2D");
dojo.require("dojox.charting.themes.RoyalPurples");
dojo.require("esri.map");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.tasks.locator");
dojo.require("esri.tasks.geometry");
dojo.require("esri.arcgis.utils");
dojo.require("esri.arcgis.Portal");

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
var twitterDetails; //variable for storing twitter link and fields
var podInformation; //variable for storing information of pods
var welcomeScreenImages; //variable for storing images for welcome screen
var portal, portalUrl = document.location.protocol + '//www.arcgis.com';
var portalUser = null;
var share; //flag to determine whether the application is shared or not


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
                dojo.byId("divTextContainer").style.display = "none";
                dojo.byId("divMapContainer").style.display = "none";

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
                dojo.byId("divTextContainer").style.display = "block";
            }

            var userAgent = window.navigator.userAgent;

            if ((userAgent.indexOf("iPad") >= 0)||(userAgent.indexOf("Android") >= 0)) {
                isTablet = true;
                dojo.byId('dynamicStyleSheet').href = "styles/tablet.css";
            }
            else {
                isBrowser = true;
                dojo.byId('dynamicStyleSheet').href = "styles/browser.css";
            }

            dojo.connect(window, 'onresize', function (evt) {
                setTimeout(function () {
                    CreateScrollbar(dojo.byId('divLayerContainer'), dojo.byId('divLayerContent'));
                }, 500);
                if (map) {
                    if (dojo.byId("map").style.display != "none") {
                        dojo.byId('map').style.marginLeft = (dojo.coords("holder").l) + "px";
                        dojo.byId('showHide').style.right = (dojo.coords("holder").l + 15) + "px";
                        ToggleContainers();
                        ResetSlideControls();
                        map.reposition();
                        map.resize();
                    }
                }
            })

            if (isTablet) {
                SetLoginPageHeight();
            }

            // Read config.js file to set appropriate values
            var responseObject = new js.config();
            dojo.byId("lblAppName").innerHTML = responseObject.ApplicationName.trimString(19);
            dojo.byId("lblAppName").title = responseObject.ApplicationName;
            dojo.byId("divWelcomeContent").innerHTML = responseObject.WelcomeScreenMessage;
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
            dojo.byId("tdGraphTab").innerHTML = responseObject.GraphTabName.trimString(10);
            dojo.byId("tdGraphTab").title = responseObject.GraphTabName;
            defaultNewsFields = responseObject.DefaultNewsFields;
            dojo.byId("tdHeaderBookmark").innerHTML = responseObject.BookmarkHeader;
            locatorSettings = responseObject.LocatorSettings;

            // Set address search parameters
            dojo.byId("txtAddress").setAttribute("defaultAddress", responseObject.LocatorSettings.DefaultValue);
            dojo.byId('txtAddress').value = responseObject.LocatorSettings.DefaultValue;
            dojo.byId("txtAddress").setAttribute("defaultAddressTitle", responseObject.LocatorSettings.DefaultValue);
            dojo.byId("txtAddress").style.color = "gray";
            dojo.connect(dojo.byId('txtAddress'), "ondblclick", ClearDefaultText);
            dojo.connect(dojo.byId('txtAddress'), "onfocus", function (evt) {
                this.style.color = "#000";
            });
            dojo.connect(dojo.byId('txtAddress'), "onblur", ReplaceDefaultText);

            // Identify the key presses while implementing auto-complete and assign appropriate actions
            dojo.connect(dojo.byId("txtAddress"), 'onkeyup', function (evt) {
                if (evt) {
                    if (evt.keyCode == dojo.keys.ENTER) {
                        if (dojo.byId("txtAddress").value != '') {
                            dojo.byId("imgSearchLoader").style.display = "block";
                            LocateAddress();
                            return;
                        }
                    }
                    if (!((evt.keyCode > 46 && evt.keyCode < 58) || (evt.keyCode > 64 && evt.keyCode < 91) || (evt.keyCode > 95 && evt.keyCode < 106) || evt.keyCode == 8 || evt.keyCode == 110 || evt.keyCode == 188)) {
                        evt = (evt) ? evt : event;
                        evt.cancelBubble = true;
                        if (evt.stopPropagation) evt.stopPropagation();
                        return;
                    }

                    if (dojo.coords("divAddressContent").h > 0) {
                        if (dojo.byId("txtAddress").value.trim() != '') {
                            setTimeout(function () {
                                dojo.byId("imgSearchLoader").style.display = "block";
                                LocateAddress();
                            }, 500);
                        } else {
                            dojo.byId("imgSearchLoader").style.display = "none";
                            RemoveChildren(dojo.byId('tblAddressResults'));
                            CreateScrollbar(dojo.byId("divAddressScrollContainer"), dojo.byId("divAddressScrollContent"));
                        }
                    }
                }
            });

            retainState = responseObject.RetainState;
            twitterDetails = responseObject.TwitterDetails;
            baseMapLayer = responseObject.BaseMapLayer;

            for (var i = 0; i < welcomeScreenImages.length; i++) {
                dojo.byId("span" + i + "Welcome").innerHTML = welcomeScreenImages[i].Name;
                dojo.byId("img" + i + "Welcome").src = welcomeScreenImages[i].Image;
            }

            // Open help page upon clicking help button on dashboard page
            dojo.connect(dojo.byId('btnHelp'), "onclick", function () {
                window.open(responseObject.HelpURL);
            });
            // Open help page upon clicking help button on map page
            dojo.connect(dojo.byId('btnMapHelp'), "onclick", function () {
                window.open(responseObject.HelpURL);
            });
            // Create scroll bar for welcome text on home page
            setTimeout(function () {
                CreateScrollbar(dojo.byId('divWelcomeContainer'), dojo.byId('divWelcomeContent'));
            }, 500);
        }
    });
}
dojo.addOnLoad(Init);

//This function is used to authenticate the user
function AuthenticateUser() {
    ShowProgressIndicator();
    var signInLink = dojo.byId('tdPanelSign');
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

        RemoveChildren(dojo.byId("divLayerContent"));
        arrSubjectGroups = [];

        dojo.byId("btnSettings").className = "customButton";
        dojo.byId("tdPanelSign").innerHTML = "Sign Out";
        dojo.byId("btnMap").className = "customButton";
        dojo.byId("divLoginScreenContainer").style.display = "none";
        dojo.byId("divInfoContainer").style.display = "block";
        dojo.byId("btnSettings").style.cursor = "pointer";
        dojo.byId("btnMap").style.cursor = "pointer";

        if (isTablet) {
            SetHomePageHeight();
        }
        CreateScrollbar(dojo.byId('divLayerContainer'), dojo.byId('divLayerContent'));
        CreateScrollbar(dojo.byId('divNAEDisplayContainer'), dojo.byId('divNAEDisplayContent'));
        CreateScrollbar(dojo.byId('divRSSFeedContainer'), dojo.byId('divRSSFeedContent'));
        CreateScrollbar(dojo.byId('divTwitterFeedContainer'), dojo.byId('divTwitterFeedContent'));

        var userGroupDetails = authenticatedLinks.split("${0}");
        var userGroupLink = userGroupDetails[0] + authenticatedGroup + userGroupDetails[1] + data.token;
        esri.request({
            url: userGroupLink,
            callbackParamName: "callback",
            load: function (groupdata) {
                for (var t = 0; t < groupdata.items.length; t++) {
                    for (var u = 0; u < groupdata.items[t].tags.length; u++) {
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
                                mapDeferred.addCallback(function (response) {
                                    map = response.map;
                                    map.destroy();
                                    responseCounter++;
                                    var webmapInfo = {};
                                    webmapInfo.key = response.itemInfo.item.title
                                    webmapInfo.operationalLayers = response.itemInfo.itemData.operationalLayers;
                                    webmapInfo.baseMap = response.itemInfo.itemData.baseMap.baseMapLayers;
                                    keyIndicators.push(webmapInfo);
                                    if (keyCounter == responseCounter) {
                                        PopulateIndicatorData(keyIndicators, 0, indicatorState, orderedLayer, data.token, groupdata);
                                    }
                                });
                                mapDeferred.addErrback(function (error) {
                                    console.log("Map creation failed: ", dojo.toJson(error));
                                });
                                break;
                            }
                        }
                    }
                }
                //Display News and Events panel when none groups have key indicator
                if (keyCounter == 0) {
                    CreateLayerPods(orderedLayer, data.token, groupdata, null);
                    PopulateNews(dojo.byId("btnNews"));
                }
                //Create basemap when clicked on Map button on dashboard page
                mapClick = dojo.connect(dojo.byId('btnMap'), "onclick", function (evt) {
                    ShowProgressIndicator();
                    if (map) {
                        map.destroy();
                    }
                    CreateBasemap(orderedLayer, groupdata, data);
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
        dojo.byId("map").style.display = "none";
        //Open Setting page upon clicking 'Settings' on dashboard page
        dojo.byId("btnSettings").onclick = function () {
            if (dojo.byId("btnSettings").className != "customDisabledButton") {
                if (dojo.byId("divSettingsContainer").style.display != "block") {
                    dojo.byId("divInfoContainer").style.display = "none";
                    dojo.byId("divSettingsContainer").style.display = "block";
                    if (isTablet) {
                        SetSettingsHeight();
                    }
                    dojo.byId("btnSettings").style.cursor = "default";
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
                webmapDetails.addCallback(function (response) {
                    map = response.map;
                    map.destroy();

                    var webmapInfo = {};
                    webmapInfo.id = response.itemInfo.item.id;
                    webmapInfo.key = response.itemInfo.item.title;
                    webmapInfo.operationalLayers = response.itemInfo.itemData.operationalLayers;
                    webmapInfo.baseMap = response.itemInfo.itemData.baseMap.baseMapLayers;

                    dojo.byId("divServiceDetails").style.display = "none";
                    RemoveChildren(dojo.byId("trBottomHeaders"));
                    RemoveChildren(dojo.byId("trBottomTags"));
                    RemoveChildren(dojo.byId("tblMoreResults"));

                    dojo.replaceClass("divGraphComponent", "hideContainerHeight", "showContainerHeight");
                    dojo.byId('divGraphComponent').style.height = '0px';
                    dojo.byId('showHide').style.top = '59px';
                    dojo.byId("divGraphHeader").style.color = "gray";
                    dojo.byId("divGraphHeader").setAttribute("state", "disabled");
                    dojo.byId("divGraphHeader").style.cursor = "default";

                    PopulateEventDetails(webmapInfo.id, orderedLayer, dojo.byId("lblAppName").innerHTML, webmapInfo, groupdata, data.token, true, false, null);
                });
                webmapDetails.addErrback(function (error) {
                    console.log("Map creation failed: ", dojo.toJson(error));
                });
                break;
            }
        }
    }
}

//When user logs out, Clear session storage and redirect to home page
function SignOut() {
    sessionStorage.clear();
    startExtent = "";
    dojo.disconnect(mapClick);

    RemoveChildren(dojo.byId("divLayerContent"));
    RemoveChildren(dojo.byId("divNAEDisplayContent"));

    dojo.replaceClass("divGraphComponent", "hideContainerHeight", "showContainerHeight");
    dojo.byId('divGraphComponent').style.height = '0px';
    dojo.byId('showHide').style.top = '59px';

    dojo.byId("imgBookmark").src = "images/imgBookmark.png";
    dojo.replaceClass("divBookmarkContent", "hideContainerHeight", "showContainerHeight");
    dojo.byId('divBookmarkContent').style.height = '0px';

    dojo.byId("imgSearch").src = "images/locate.png";
    dojo.replaceClass("divAddressContent", "hideContainerHeight", "showContainerHeight");
    dojo.byId('divAddressContent').style.height = '0px';

    if (dojo.byId("imgMore")) {
        dojo.byId("imgMore").src = "images/more.png";
    }
    dojo.replaceClass("divMoreContent", "hideContainerHeight", "showContainerHeight");
    dojo.byId('divMoreContent').style.height = '0px';

    dojo.byId("imgGeolocation").src = "images/imgGeolocation.png";

    dojo.byId("btnSettings").style.cursor = "default";
    dojo.byId("btnMap").style.cursor = "default";

    dojo.byId("divInfoContainer").style.display = "none";
    dojo.byId("divSettingsContainer").style.display = "none";

    dojo.byId("btnSettings").className = "customDisabledButton";
    dojo.byId("tdPanelSign").innerHTML = "Sign In";
    dojo.byId("btnMap").className = "customDisabledButton";
    dojo.byId("divLoginScreenContainer").style.display = "block";
    if (isTablet) {
        SetLoginPageHeight();
    }
}

//For every subject group query statistics layer that consists of key indicators then transfer the data to create pods for subject groups
function PopulateIndicatorData(keyIndicators, val, indicatorState, orderedLayer, token, groupdata) {
    if (keyIndicators[val]) {
        for (var b = 0; b < keyIndicators[val].operationalLayers.length; b++) {
            if (keyIndicators[val].operationalLayers[b].title.indexOf(statisticsKeyword) >= 0) {
                queryTask = new esri.tasks.QueryTask(keyIndicators[val].operationalLayers[b].url);
                var queryCounty = new esri.tasks.Query();
                queryCounty.where = "1=1";
                queryCounty.returnGeometry = false;
                queryCounty.outFields = ["*"];
                queryCounty.spatialRelationship = esri.tasks.Query.SPATIAL_REL_WITHIN;
                queryTask.execute(queryCounty, function (featureSet) {
                    indicatorState.push({ key: keyIndicators[val].key, value: featureSet.features[0].attributes });
                    val++;
                    if (keyIndicators.length == val) {
                        CreateLayerPods(orderedLayer, token, groupdata, indicatorState);
                        PopulateNews(dojo.byId("btnNews"));
                    }
                    PopulateIndicatorData(keyIndicators, val, indicatorState, orderedLayer, token, groupdata);
                },
                        function (err) {
                            alert(err.message);
                            val++;
                            if (keyIndicators.length == val) {
                                CreateLayerPods(orderedLayer, token, groupdata, indicatorState);
                                PopulateNews(dojo.byId("btnNews"));
                            }
                            PopulateIndicatorData(keyIndicators, val, indicatorState, orderedLayer, token, groupdata);
                        });
            }
        }
    }
}

