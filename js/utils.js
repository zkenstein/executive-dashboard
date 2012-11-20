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
var newLeft = 0;    //Variable to store the new left value for carousel of polling place
var operationalLayers; //variable for storing the operational layer details
var orientationChange = false; //variable for setting the flag on orientation
var handlePoll;
var selectedPoint; //variable for storing the selected point geometry
var tinyUrl; //variable for storing the tiny URL link

//function to create scroll-bar
function CreateScrollbar(container, content) {
    var yMax;
    var pxLeft, pxTop, xCoord, yCoord;
    var scrollbar_track;
    var isHandleClicked = false;
    this.container = container;
    this.content = content;
    content.scrollTop = 0;
    if (dojo.byId(container.id + 'scrollbar_track')) {
        RemoveChildren(dojo.byId(container.id + 'scrollbar_track'));
        container.removeChild(dojo.byId(container.id + 'scrollbar_track'));
    }
    if (!dojo.byId(container.id + 'scrollbar_track')) {
        scrollbar_track = document.createElement('div');
        scrollbar_track.id = container.id + "scrollbar_track";
        scrollbar_track.className = "scrollbar_track";
    } else {
        scrollbar_track = dojo.byId(container.id + 'scrollbar_track');
    }
    var containerHeight = dojo.coords(container);
    scrollbar_track.style.height = (containerHeight.h - 6) + "px";
    var scrollbar_handle = document.createElement('div');
    scrollbar_handle.className = 'scrollbar_handle';
    scrollbar_handle.id = container.id + "scrollbar_handle";
    scrollbar_track.appendChild(scrollbar_handle);
    container.appendChild(scrollbar_track);
    if ((content.scrollHeight - content.offsetHeight) <= 5) {
        scrollbar_handle.style.display = 'none';
        scrollbar_track.style.display = 'none';
        return;
    } else {
        scrollbar_handle.style.display = 'block';
        scrollbar_track.style.display = 'block';
        scrollbar_handle.style.height = Math.max(this.content.offsetHeight * (this.content.offsetHeight / this.content.scrollHeight), 25) + 'px';
        yMax = this.content.offsetHeight - scrollbar_handle.offsetHeight;
        yMax = yMax - 5; //for getting rounded bottom of handle
        if (window.addEventListener) {
            content.addEventListener('DOMMouseScroll', ScrollDiv, false);
        }
        content.onmousewheel = function (evt) {
            console.log(content.id);
            ScrollDiv(evt);
        }
    }

    function ScrollDiv(evt) {
        var evt = window.event || evt //equalize event object
        var delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta //delta returns +120 when wheel is scrolled up, -120 when scrolled down
        pxTop = scrollbar_handle.offsetTop;
        if (delta <= -120) {
            var y = pxTop + 10;
            if (y > yMax) y = yMax;  // Limit vertical movement
            if (y < 0) y = 0;  // Limit vertical movement
            scrollbar_handle.style.top = y + "px";
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        } else {
            var y = pxTop - 10;
            if (y > yMax) y = yMax;  // Limit vertical movement
            if (y < 0) y = 2;  // Limit vertical movement
            scrollbar_handle.style.top = (y - 2) + "px";
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        }
    }
    //Attaching events to scrollbar components
    scrollbar_track.onclick = function (evt) {
        if (!isHandleClicked) {
            evt = (evt) ? evt : event;
            pxTop = scrollbar_handle.offsetTop // Sliders vertical position at start of slide.
            var offsetY;
            if (!evt.offsetY) {
                var coords = dojo.coords(evt.target);
                offsetY = evt.layerY - coords.t;
            } else offsetY = evt.offsetY;
            if (offsetY < scrollbar_handle.offsetTop) {
                scrollbar_handle.style.top = offsetY + "px";
                content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
            } else if (offsetY > (scrollbar_handle.offsetTop + scrollbar_handle.clientHeight)) {
                var y = offsetY - scrollbar_handle.clientHeight;
                if (y > yMax) y = yMax; // Limit vertical movement
                if (y < 0) y = 0; // Limit vertical movement
                scrollbar_handle.style.top = y + "px";
                content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
            } else {
                return;
            }
        }
        isHandleClicked = false;
    };
    //Attaching events to scrollbar components
    scrollbar_handle.onmousedown = function (evt) {
        isHandleClicked = true;
        evt = (evt) ? evt : event;
        evt.cancelBubble = true;
        if (evt.stopPropagation) evt.stopPropagation();
        pxTop = scrollbar_handle.offsetTop // Sliders vertical position at start of slide.
        yCoord = evt.screenY // Vertical mouse position at start of slide.
        document.body.style.MozUserSelect = 'none';
        document.body.style.userSelect = 'none';
        document.onselectstart = function () {
            return false;
        }
        document.onmousemove = function (evt) {
            evt = (evt) ? evt : event;
            evt.cancelBubble = true;
            if (evt.stopPropagation) evt.stopPropagation();
            var y = pxTop + evt.screenY - yCoord;
            if (y > yMax) y = yMax; // Limit vertical movement
            if (y < 0) y = 0; // Limit vertical movement
            scrollbar_handle.style.top = y + "px";
            content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        }
    };
    document.onmouseup = function () {
        document.body.onselectstart = null;
        document.onmousemove = null;
    };
    scrollbar_handle.onmouseout = function (evt) {
        document.body.onselectstart = null;
    };
    var startPos;
    var scrollingTimer;
    dojo.connect(container, "touchstart", function (evt) {
        touchStartHandler(evt);
    });
    dojo.connect(container, "touchmove", function (evt) {
        touchMoveHandler(evt);
    });
    dojo.connect(container, "touchend", function (evt) {
        touchEndHandler(evt);
    });
    //Handlers for Touch Events
    function touchStartHandler(e) {
        startPos = e.touches[0].pageY;
    }

    function touchMoveHandler(e) {
        var touch = e.touches[0];
        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
        e.preventDefault();
        pxTop = scrollbar_handle.offsetTop;
        var y;
        if (startPos > touch.pageY) {
            y = pxTop + 10;
        } else {
            y = pxTop - 10;
        }
        //setting scrollbar handel
        if (y > yMax) y = yMax;  // Limit vertical movement
        if (y < 0) y = 0;  // Limit vertical movement
        scrollbar_handle.style.top = y + "px";
        //setting content position
        content.scrollTop = Math.round(scrollbar_handle.offsetTop / yMax * (content.scrollHeight - content.offsetHeight));
        scrolling = true;
        startPos = touch.pageY;
    }

    function touchEndHandler(e) {
        scrollingTimer = setTimeout(function () {
            clearTimeout(scrollingTimer);
            scrolling = false;
        }, 100);
    }
    //touch scrollbar end
}

//function for creating tap events at devices for bottom panel
function CreateHorizontalScrollbar(container, content) {
    var startHPos;
    var scrollingHTimer;

    dojo.connect(container, "touchstart", function (evt) {
        touchHStartHandler(evt);
    });
    if (content.id == "carouselscroll") {
        handlePoll = dojo.connect(container, "touchmove", function (evt) {
            if ((dojo.byId('ServiceLeftArrow').style.display == "block") || (dojo.byId('ServiceRightArrow').style.display == "block")) {
                touchHMoveHandler(evt);
            }
        });
    }

    dojo.connect(container, "touchend", function (evt) {
        touchHEndHandler(evt);
    });

    //Handlers for Touch Events
    function touchHStartHandler(e) {
        startHPos = e.touches[0].pageX;
    }

    function touchHMoveHandler(e) {
        if (!scrollingH) {
            var touch = e.touches[0];
            e.cancelBubble = true;
            if (e.stopPropagation) e.stopPropagation();
            e.preventDefault();

            if (touch.pageX - startHPos >= 2) {
                setTimeout(function () {
                    if (content.id == "carouselscroll") {
                        SlideLeft();
                    }
                }, 100);
            }
            if (startHPos - touch.pageX >= 2) {
                setTimeout(function () {
                    if (content.id == "carouselscroll") {
                        SlideRight();
                    }
                }, 100);
            }
            scrollingH = true;
            startHPos = touch.pageX;
        }
    }
    function touchHEndHandler(e) {
        scrollingHTimer = setTimeout(function () { clearTimeout(scrollingHTimer); scrollingH = false; }, 100);
    }
    //touch scrollbar end
}

//function to get the extent based on the map point
function GetBrowserMapExtent(mapPoint) {
    var width = map.extent.getWidth();
    var height = map.extent.getHeight();
    var xmin = mapPoint.x - (width / 2);
    if (dojo.byId("divServiceDetails").style.display == "block") {
        var ymin = mapPoint.y - (height / 2.5);
    } else {
        var ymin = mapPoint.y - (height / 3);
    }
    var xmax = xmin + width;
    var ymax = ymin + height;
    return new esri.geometry.Extent(xmin, ymin, xmax, ymax, map.spatialReference);
}


//Function for refreshing address container div
function RemoveChildren(parentNode) {
    if (parentNode) {
        while (parentNode.hasChildNodes()) {
            parentNode.removeChild(parentNode.lastChild);
        }
    }
}
//Function for validating Email in comments tab
function CheckMailFormat(emailValue) {
    var pattern = /^([a-zA-Z][a-zA-Z0-9\_\-\.]*\@[a-zA-Z0-9\-]*\.[a-zA-Z]{2,4})?$/i;
    return pattern.test(emailValue);
}
//Function to append ... for a string
String.prototype.trimString = function (len) {
    return (this.length > len) ? this.substring(0, len) + "..." : this;
}
//function to trim string
String.prototype.trim = function () {
    return this.replace(/^\s*/, "").replace(/\s*$/, "");
}

//function to set the height of the login page
function SetLoginPageHeight() {
    if (!isBrowser) {
        if (dojo.query(".dijitDialogUnderlayWrapper")) {
            if (dojo.query(".dijitDialogUnderlayWrapper").length > 0) {
                dojo.query(".dijitDialogUnderlayWrapper")[0].style.left = "0px";
                dojo.query(".esriSignInDialog")[0].style.left = ((dojo.coords("divLoginScreenContainer").w / 2)-165) + "px";
            }
        }
    }
    dojo.byId("divWelcomeContent").style.height = (dojo.coords("divLoginScreenContainer").h - 400) + "px";
    setTimeout(function () {
        CreateScrollbar(dojo.byId('divWelcomeContainer'), dojo.byId('divWelcomeContent'));
    }, 100);
}

//function to set the height of the home page
function SetHomePageHeight() {
    dojo.byId("divLayerContainer").style.height = (dojo.coords("divInfoContainer").h - 85) + "px";
    dojo.byId("divLayerContent").style.height = (dojo.coords("divInfoContainer").h - 85) + "px";
    dojo.byId("divNAEDisplayContainer").style.height = (dojo.coords("divInfoContainer").h - 205) + "px";
    dojo.byId("divNAEDisplayContent").style.height = (dojo.coords("divInfoContainer").h - 205) + "px";
    setTimeout(function () {
        CreateScrollbar(dojo.byId('divLayerContainer'), dojo.byId('divLayerContent'));
        CreateScrollbar(dojo.byId('divNAEDisplayContainer'), dojo.byId('divNAEDisplayContent'));
    }, 100);
}

//function to set the height of the settings page
function SetSettingsHeight() {
    dojo.byId("divRSSFeedContent").style.height = (dojo.coords("divSettingsContainer").h / 2 - 210) + "px";
    dojo.byId("divTwitterFeedContent").style.height = (dojo.coords("divSettingsContainer").h / 2 - 210) + "px";
    CreateScrollbar(dojo.byId('divRSSFeedContainer'), dojo.byId('divRSSFeedContent'));
    CreateScrollbar(dojo.byId('divTwitterFeedContainer'), dojo.byId('divTwitterFeedContent'));
}

//function to call when the orientation changes
function orientationChanged() {
    orientationChange = true;
    setTimeout(function () {
        if (dojo.byId("divLoginScreenContainer").style.display != "none") {
            SetLoginPageHeight();
        }
        if (dojo.byId("divInfoContainer").style.display != "none") {
            SetHomePageHeight();
        }
        if (dojo.byId("divSettingsContainer").style.display != "none") {
            SetSettingsHeight();
        }
        if (selectedPoint) {
            if (map) {
                map.setExtent(GetBrowserMapExtent(selectedPoint));
            }
        }
        orientationChange = false;
    }, 500);
}

//function for fade Out the div container.
function FadeOut(node) {
    var fadeArgs = {
        node: node,
        duration: 500
    };
    dojo.fadeOut(fadeArgs).play();
}

//function for fade In the div container.
function FadeIn(node) {
    var fadeArgs = {
        node: node,
        duration: 500
    };
    dojo.fadeIn(fadeArgs).play();
}

//sliding to the right
function SlideRight() {
    var difference = dojo.byId('divServiceData').offsetWidth - dojo.byId('carouselscroll').offsetWidth;
    if (newLeft >= difference) {
        dojo.byId('ServiceLeftArrow').style.display = "block";
        var node = dojo.byId('carouselscroll');
        newLeft = newLeft - (220);

        var node = dojo.byId('carouselscroll');
        var anim1 = dojo.animateProperty({
            node: node,
            duration: 700,
            properties: {
                left: { end: newLeft, unit: "px" }
            }
        });
        animG = dojo.fx["chain"]([anim1]).play();

        if (newLeft < difference) {
            dojo.byId('ServiceRightArrow').style.display = "none";
        }
        if (dojo.byId('ServiceRightArrow').style.display == "none") {
            dojo.byId('ServiceLeftArrow').style.display = "block";
        }
    }
    if (difference > 0) {
        dojo.byId('ServiceRightArrow').style.display = "none";
    }
    RepositionMetricPods();
}

//sliding to the left
function SlideLeft() {
    var difference = dojo.byId('divServiceData').offsetWidth - dojo.byId('carouselscroll').offsetWidth;
    if (newLeft < 0) {
        if (newLeft > -(220)) {
            newLeft = 0;
        }
        else {
            newLeft = newLeft + (220);
        }
        var node = dojo.byId('carouselscroll');
        var anim1 = dojo.animateProperty({
            node: node,
            duration: 700,
            properties: {
                left: { end: newLeft, unit: "px" }
            }
        });
        animG = dojo.fx["chain"]([anim1]).play();

        if (dojo.byId('ServiceRightArrow').style.display == "none") {
            if (newLeft > difference) {
                dojo.byId('ServiceRightArrow').style.display = "block";
            }
        }
        if (newLeft == 0) {
            dojo.byId('ServiceLeftArrow').style.display = "none";
        }
    }
    RepositionMetricPods();
}

//function for reseting the slide controls
function ResetSlideControls() {
    dojo.byId("divServiceDetails").style.left = (dojo.coords("holder").l) + "px";

    if (dojo.byId("carouselscroll").offsetWidth > (dojo.coords("divGroupHolder").w - 90)) {
        dojo.byId("divServiceData").style.width = (dojo.coords("divGroupHolder").w - 90) + "px";
    }
    else {
        dojo.byId("divServiceData").style.width = dojo.byId("carouselscroll").offsetWidth + "px";
    }
    dojo.byId('carouselscroll').style.paddingLeft = "0px";


    if (newLeft > dojo.byId("divServiceData").offsetWidth - dojo.byId("carouselscroll").offsetWidth) {
        dojo.byId('tdServiceRightArrow').style.width = "37px";
        dojo.byId('tdServiceLeftArrow').style.width = "37px";

        dojo.byId('ServiceRightArrow').style.display = "block";
        dojo.byId('ServiceRightArrow').style.cursor = "pointer";
    }
    else {
        dojo.byId('tdServiceRightArrow').style.width = "1px";
        dojo.byId('tdServiceLeftArrow').style.width = "1px";

        dojo.byId('ServiceRightArrow').style.display = "none";
        dojo.byId('ServiceRightArrow').style.cursor = "default";
    }

    if (newLeft == 0) {
        dojo.byId('ServiceLeftArrow').style.display = "none";
        dojo.byId('ServiceLeftArrow').style.cursor = "default";
    }
    else {
        dojo.byId('ServiceLeftArrow').style.display = "block";
        dojo.byId('ServiceLeftArrow').style.cursor = "pointer";
    }
    RepositionMetricPods();
    setTimeout(function () {
        if (dojo.byId("tblMetricPods")) {
            dojo.byId("tblMetricPods").style.visibility = "visible";
        }
    }, 500);
}

function RepositionMetricPods() {
    if (dojo.byId("divServiceData").offsetWidth - dojo.byId("carouselscroll").offsetWidth == 0) {
        if (dojo.byId('ServiceLeftArrow').style.display == "none" && dojo.byId('ServiceRightArrow').style.display == "none") {
            var cal = dojo.coords("divGroupHolder").w - dojo.byId("carouselscroll").offsetWidth;
            dojo.byId('divServiceDetails').style.marginLeft = (cal / 2) + "px";
        }
    }
    else {
        dojo.byId('divServiceDetails').style.marginLeft = "0px";
    }
}


//function to toggle containers
function ToggleContainers() {
    if (dojo.coords('divBookmarkContent').h > 0) {
        dojo.byId('divBookmarkContent').style.right = (dojo.coords("holder").l + 15) + "px";
    }
    if (dojo.coords('divAddressContent').h > 0) {
        dojo.byId('divAddressContent').style.right = (dojo.coords("holder").l + 15) + "px";
    }
    if (dojo.coords('divMoreContent').h > 0) {
        dojo.byId('divMoreContent').style.right = (dojo.coords("holder").l + 15) + "px";
    }
    if (dojo.coords('divGraphComponent').h > 0) {
        dojo.byId('divGraphComponent').style.right = (dojo.coords("holder").l + 15) + "px";
    }
}


//Function to get width of a control when text and font size are specified
String.prototype.getWidth = function (fontSize) {
    var test = document.createElement("span");
    document.body.appendChild(test);
    test.style.visibility = "hidden";

    test.style.fontSize = fontSize + "px";

    test.innerHTML = this;
    var w = test.offsetWidth;
    document.body.removeChild(test);
    return w;
}

//Function to get the query string value of the provided key if not found the function returns empty string
function GetQuerystring(key) {
    var _default;
    if (_default == null) _default = "";
    key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
    var qs = regex.exec(window.location.href);
    if (qs == null)
        return _default;
    else
        return qs[1];
}



