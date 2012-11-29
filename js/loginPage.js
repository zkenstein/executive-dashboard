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
var defaultNewsFields;
var formatDateAs; //variable to store the date format
var geometryService; //variable for storing the geometry service URL
var infoPodStatics; //variable for storing statistics data of the layers
var infoWindow; //variable for storing the info window object
var isBrowser = false; //flag set to know the browser
var isTablet = false; //flag set to know the tablet
var layerImages; //variable for storing the images for subject groups
var locatorFields; //variable for storing the locator fields
var locatorMarkupSymbolPath; //variable for storing the source path of the image to place it on the map
var locatorURL; //variable for storing the locator URL
var map; //variable for storing the map object
var mapClick; //variable for storing the click event handling for map
var mapPoint; //variable for storing the point geometry
var mapSharingOptions; //variable for storing the tiny URL links
var messages; //variable for the error messages
var retainState; //flag set for retain state to containers
var rssFields; //variable for storing the rss fields
var showNullValueAs; //variable for storing the default null value
var startExtent; //variable for storing the default extent
var statisticsKeyword;
var tempGraphicsLayerId = 'tempGraphicsLayerID';  //variable to store graphics layer ID
var twitterDetails; //variable for storing twitter link and fields
var podInformation; //variable for storing the update information of pods
var welcomeScreenImages; //variable for storing the images for welcome screen
var zoomLevel;
var portal, portalUrl = document.location.protocol + '//www.arcgis.com';
var portalUser = null;
var share;

//function to call when the application starts
function Init() {
    esri.config.defaults.io.proxyUrl = "proxy.ashx";
    esriConfig.defaults.io.alwaysUseProxy = false;
    esriConfig.defaults.io.timeout = 180000;

    // Create the portal
    portal = new esri.arcgis.Portal(portalUrl);

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

            if (userAgent.indexOf("iPad") >= 0) {
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

            var responseObject = new js.config();
            dojo.byId("lblAppName").innerHTML = responseObject.ApplicationName;
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
            zoomLevel = responseObject.ZoomLevel;
            statisticsKeyword = responseObject.StatisticsKeyword;
            dojo.byId("tdGraphTab").innerHTML = responseObject.GraphTabName;
            defaultNewsFields = responseObject.DefaultNewsFields;
            dojo.byId("tdHeaderBookmark").innerHTML = responseObject.BookmarkHeader;

            locatorURL = responseObject.LocatorURL;
            locatorMarkupSymbolPath = responseObject.LocatorMarkupSymbolPath;
            locatorFields = responseObject.LocatorFields.split(",");

            dojo.byId("txtAddress").setAttribute("defaultAddress", responseObject.LocatorDefaultAddress);
            dojo.byId('txtAddress').value = responseObject.LocatorDefaultAddress;
            dojo.connect(dojo.byId("txtAddress"), 'onkeydown', function (evt) {
                if (evt) {
                    var key = evt.which || evt.keyCode;
                    if (key == 13) {
                        if (dojo.coords("divAddressContent").h > 0) {
                            dojo.byId("txtAddress").blur();
                            LocateAddress();
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



            dojo.connect(dojo.byId('btnHelp'), "onclick", function () {
                window.open(responseObject.HelpURL);
            });
            dojo.connect(dojo.byId('btnMapHelp'), "onclick", function () {
                window.open(responseObject.HelpURL);
            });
            setTimeout(function () {
                CreateScrollbar(dojo.byId('divWelcomeContainer'), dojo.byId('divWelcomeContent'));
            }, 500);
        }
    });
}
dojo.addOnLoad(Init);


//function to authenticate the user
function AuthenticateUser() {
    ShowProgressIndicator();
    var signInLink = dojo.byId('tdPanelSign');
    if (signInLink.innerHTML.indexOf('In') !== -1) {
        portal.signIn().then(function (loggedInUser) {
            portalUser = loggedInUser;
            sessionStorage.clear();
            FindArcGISGroup();
            // update results
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

//function to find the authenticated group
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

                var orderedLayer = [];
                for (var u in layerImages) {
                    for (var v in arrSubjectGroups) {
                        if (layerImages[u].Tag == v) {
                            orderedLayer[v] = [];
                            orderedLayer[v] = arrSubjectGroups[v];
                        }
                    }
                }
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


                if (keyCounter == 0) {
                    CreateLayerPods(orderedLayer, data.token, groupdata, null);
                    PopulateNews(dojo.byId("btnNews"));
                }

                mapClick = dojo.connect(dojo.byId('btnMap'), "onclick", function (evt) {
                    ShowProgressIndicator();
                    map.destroy();
                    CreateBasemap(orderedLayer, groupdata, data);
                });

                if (share != "") {
                    var group;
                    if (window.location.href.split("$n=").length > 1) {
                        group = window.location.href.split("$t=")[1].split("$n=")[0];
                    }
                    else {
                        group = window.location.href.split("$t=")[1];
                    }
                    group = group.replace(/%20/g, " ");
                    if (group == baseMapLayer[0].MapValue) {
                        CreateBasemap(orderedLayer, groupdata, data);
                    }
                }
            }
        }, { useProxy: true });
        dojo.byId("map").style.display = "none";

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

//function for creating the basemap
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

//function calls when user wants to log out
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

//function to populate indicators according to data
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