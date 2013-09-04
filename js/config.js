/*global dojo */
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
dojo.provide("js.config");
dojo.declare("js.config", null, {

    // This file contains various configuration settings for "Executive Dashboard" template
    //
    // Use this file to perform the following:
    //
    // 1.  Specify path for application favi icon        - [ Tag(s) to look for: ApplicationFaviIcon ]
    // 2.  Specify path for application Home screen icon - [ Tag(s) to look for: HomeScreenIcon ]
    // 3.  Specify application title                     - [ Tag(s) to look for: ApplicationName ]
    // 4.  Set welcome screen message                    - [ Tag(s) to look for: WelcomeScreenMessage ]
    // 5.  Set URL for help page                         - [ Tag(s) to look for: HelpURL ]
    //
    // 6.  Specify URLs for basemaps                     - [ Tag(s) to look for: BaseMapLayers ]
    //
    // 7.  Specify Authenticated links                   - [ Tag(s) to look for: AuthenticatedLinks ]
    //
    // 8.  Specify Authenticated group                   - [ Tag(s) to look for: AuthenticatedGroup ]
    //
    // 9.  Specify Bookmark Header                       - [ Tag(s) to look for: BookmarkHeader ]
    //
    // 11.  Specify state of retaining                   - [ Tag(s) to look for: RetainState ]
    //
    // 12. Customize data formatting                     - [ Tag(s) to look for: ShowNullValueAs, FormatDateAs ]
    //
    // 13. Customize address search settings             - [ Tag(s) to look for: LocatorSettings ]
    //
    // 14. Set Fields for RSS                            - [ Tag(s) to look for: RSSFields ]
    //
    // 15. Set Fields for Trends                         - [ Tag(s) to look for: TwitterDetails ]
    //
    // 16. Specify images for welcome screen             - [ Tag(s) to look for: WelcomeScreenImages ]
    //
    // 17. Specify images for subject groups             - [ Tag(s) to look for: LayerImages ]
    //
    // 18. Set Fields for Metric pods                    - [ Tag(s) to look for: InfoPodStatics ]
    //
    // 19. Set Fields for Metric pods information        - [ Tag(s) to look for: PodInformation ]
    //
    // 20. Set keyword to detect statistics layer        - [ Tag(s) to look for: StatisticsKeyword ]
    //
    // 21. Specify URLs for map sharing                  - [ Tag(s) to look for:  ShareByMailLink ]
    // 22.In case of changing the TinyURL service
    //     Specify URL for the new service               - [ Tag(s) to look for: MapSharingOptions (set TinyURLServiceURL, TinyURLResponseAttribute) ]
    //
    //

    // ------------------------------------------------------------------------------------------------------------------------
    // GENERAL SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------

    //Set Favorite Icon
    ApplicationFaviIcon: "images/appIcon.ico",

    //Set Home Screen Icon for touch devices.
    HomeScreenIcon: "images/appIcon.png",

    //Set application name.
    ApplicationName: "Executive Dashboard",

    //Message that appears when the application starts.
    WelcomeScreenMessage: "<p>The <b>Executive Dashboard</b> is used by local government leaders to proactively view critical metrics, identify trends, raise questions, and devise new management strategies. It supports community-wide efforts to increase accountability and transparency within government and with the citizens they serve.</p><p>The Dashboard displays key performance indicators (KPIs) that policy-makers and senior management need to effectively run an organization. It aggregates information from multiple sources and serves as a starting point from which the executive can get a sense of the big picture before digging deeper into data. Finally, the Dashboard can be used to view performance across an entire community, or in a specific neighborhood that requires more detailed attention.</p>",

    //Set URL of help page/portal.
    HelpURL: "help.htm",

    //Set baseMap layer value.
    BaseMapLayer: [{
        MapValue: "Basemap"
    }],

    //Authenticated links to generate tokens with the credentials.
    AuthenticatedLinks: "http://www.arcgis.com/sharing/rest/content/groups/${0}?f=json&token=${0}",

    //Authenticated group id for dashboard group.
    AuthenticatedGroup: "4cd8df6c536347399d67314a89117f4f",

    //Flag for retaining the webmap initial extent when changing from one webmap to another.
    LoadInitialExtentForWebmap: true,

    //Title for bookmarks header
    BookmarkHeader: "Bookmarks",

    //Flag for retaining the state of containers.(Bookmark,Address)
    RetainState: true,

    //Title for the graph container tab
    GraphTabName: "Trends",

    //Set date format
    FormatDateAs: "MMM dd, yyyy",

    //Set string value to be shown for null or blank values.
    ShowNullValueAs: "N/A",

    //Set locator settings
    LocatorSettings: {
        DisplayText: "Search by Address or County",
        DefaultLocatorSymbol: "images/redPushpin.png",
        MarkupSymbolSize: {
            width: 35,
            height: 35
        },
        DefaultValue: "1848 N Mill St Naperville IL 60563",
        LocatorParameters: {
            SearchField: "SingleLine",
            SearchBoundaryField: "searchExtent"
        },
        LocatorURL: "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
        LocatorOutFields: ["Addr_Type", "Type", "Score", "Match_Addr","xmin","xmax","ymin","ymax"],
        DisplayField: "${Match_Addr}",
        ZoomLevel: 14,
        AddressMatchScore: {
            Field: "Score",
            Value: 80
        },
        AddressSearch: {
            FilterFieldName: 'Addr_Type',
            FilterFieldValues: ["StreetAddress", "StreetName", "PointAddress"]
        },
        PlaceNameSearch: {
            LocatorFieldValue: "POI",
            FilterFieldName: "Type",
            FilterFieldValues: ["county"]
        }
    },

    //Fields for RSS Feed.
    RSSFields: ["item", "title", "link", "description"],

    //Link and fields for twitter trend.
    TwitterDetails: [{
        SearchURL: "https://api.twitter.com/1.1/search/tweets.json",
        StatusField: "statuses"
    }, {
        TitleFields: ["user", "name"]
    }, {
        DescriptionField: "text"
    }, {
        StatusURL: "https://twitter.com/${0}/statuses",
        StatusFields: ["user", "screen_name"],
        StatusId: "id_str"
    }],

    //Default values to set the RSS Feed and Twitter trend.
    DefaultNewsFields: [{
        RSSFeedName: "Florida Local News",
        RSSFeedURL: "http://www.floridapsc.com/home/news/newsrss.ashx"
    }, {
        TwitterTrendName: "Florida"
    }],

    //Set headers and Images for the welcome screen.
    WelcomeScreenImages: [{
        Name: "Efficient Transportation",
        Image: "images/b1.png"
    }, {
        Name: "Quality Education",
        Image: "images/b2.png"
    }, {
        Name: "Vibrant Downtown",
        Image: "images/b3.png"
    }],

    //Layer Images for the subject groups.
    LayerImages: [{
        Tag: "Employment",
        Images: ["images/employment.png", "images/employment-hover.png"],
        isPodVisible: true
    }, {
        Tag: "Growth",
        Images: ["images/growth.png", "images/growth_hover.png"],
        isPodVisible: true
    }, {
        Tag: "Health",
        Images: ["images/health.png", "images/health_hover.png"],
        isPodVisible: true
    }, {
        Tag: "Indicator",
        Images: ["images/indicators.png", "images/indicators-hover.png"],
        isPodVisible: true
    }, {
        Tag: "Education",
        Images: ["images/education.png", "images/education-hover.png"],
        isPodVisible: true
    }, {
        Tag: "ARRA",
        Images: ["images/reinvestment.png", "images/reinvestment-hover.png"],
        isPodVisible: true
    }],

    //Specify fields for the Metric pods.
    InfoPodStatics: [{
        CurrentObservation: "${OBSERVCURR}",
        LatestObservation: "${OBSERV1}",
        StatisticsPosition: "${INCREASEPOS}"
    }, {
        DateObservations: ["${DATE1}", "${DATE2}", "${DATE3}", "${DATECURR}"],
        CountObservations: ["${OBSERV1}", "${OBSERV2}", "${OBSERV3}", "${OBSERVCURR}"],
        DatePattern: "MMM dd, yyyy"
    }],

    //Update information for info pods.
    PodInformation: "This report was updated on ${LASTUPDATE} and includes data from ${STARTDATE} to ${ENDDATE}.",

    //Keyword to detect the statistics layer.
    StatisticsKeyword: "@ Stats",

    // ------------------------------------------------------------------------------------------------------------------------
    // SETTINGS FOR MAP SHARING
    // ------------------------------------------------------------------------------------------------------------------------
    // Set URL for TinyURL service, and URLs for Email.
    MapSharingOptions: {
        TinyURLServiceURL: "http://api.bit.ly/v3/shorten?login=esri&apiKey=R_65fd9891cd882e2a96b99d4bda1be00e&uri=${0}&format=json",
        TinyURLResponseAttribute: "data.url",
        ShareByMailLink: "mailto:%20?subject=Note%20from%20my%20Executive%20Dashboard&body=${0}"
    }

});
