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
    // 1.  Specify application title                  - [ Tag(s) to look for: ApplicationName ]
    // 2.  Set welcome screen message                 - [ Tag(s) to look for: WelcomeScreenMessage ]
    // 3.  Set URL for help page                      - [ Tag(s) to look for: HelpURL ]
    //
    // 4.  Specify URLs for basemaps                  - [ Tag(s) to look for: BaseMapLayers ]
    //
    // 5.  Specify Authenticated links                - [ Tag(s) to look for: AuthenticatedLinks ]
    //
    // 6.  Specify Authenticated group                - [ Tag(s) to look for: AuthenticatedGroup ]
    //
    // 7.  Specify Bookmark Header                    - [ Tag(s) to look for: BookmarkHeader ]
    //
    // 8.  Specify state of retaining                 - [ Tag(s) to look for: RetainState ]
    //
    // 9. Customize data formatting                   - [ Tag(s) to look for: ShowNullValueAs, FormatDateAs ]
    //
    // 10. Customize address search settings          - [ Tag(s) to look for: LocatorSettings ]
    //
    // 11. Set Fields for RSS                         - [ Tag(s) to look for: RSSFields ]
    //
    // 12. Set Fields for Trends                      - [ Tag(s) to look for: TwitterDetails ]
    //
    // 13. Specify images for welcome screen          - [ Tag(s) to look for: WelcomeScreenImages ]
    //
    // 14. Specify images for subject groups           - [ Tag(s) to look for: LayerImages ]
    //
    // 15. Set Fields for Metric pods                 - [ Tag(s) to look for: InfoPodStatics ]
    //
    // 16. Set Fields for Metric pods information     - [ Tag(s) to look for: PodInformation ]
    //
    // 17. Set keyword to detect statistics layer     - [ Tag(s) to look for: StatisticsKeyword ]
    //
    // 18. Specify URLs for map sharing               - [ Tag(s) to look for:  ShareByMailLink ]
    // 19.In case of changing the TinyURL service
    //     Specify URL for the new service            - [ Tag(s) to look for: MapSharingOptions (set TinyURLServiceURL, TinyURLResponseAttribute) ]
    //
    //

    // ------------------------------------------------------------------------------------------------------------------------
    // GENERAL SETTINGS
    // ------------------------------------------------------------------------------------------------------------------------
    //Set application title.
    ApplicationName: "Executive Dashboard",

    //Message that appears when the application starts.
    WelcomeScreenMessage: "<p>The <b>Executive Dashboard</b> is used by local government leaders to proactively view critical metrics, identify trends, raise questions, and devise new management strategies. It supports community-wide efforts to increase accountability and transparency within government and with the citizens they serve.</p><p>The Dashboard displays key performance indicators (KPIs) that policy-makers and senior management need to effectively run an organization. It aggregates information from multiple sources and serves as a starting point from which the executive can get a sense of the big picture before digging deeper into data. Finally, the Dashboard can be used to view performance across an entire community, or in a specific neighborhood that requires more detailed attention.</p>",

    //Set URL of help page/portal.
    HelpURL: "help.htm",

    //Set baseMap layer value.
    BaseMapLayer:
          [
          {
              MapValue: "Basemap"
          }
          ],

    //Authenticated links to generate tokens with the credentials.
    AuthenticatedLinks: "http://www.arcgis.com/sharing/rest/content/groups/${0}?f=json&token=${0}",

    //Authenticated group id for dashboard group.
    AuthenticatedGroup: "4cd8df6c536347399d67314a89117f4f",

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
        DefaultLocatorSymbol: "images/RedPushpin.png",
        MarkupSymbolSize: { width: 35, height: 35 },
        DefaultValue: "1848 N Mill St Naperville IL 60563",
        LocatorParamaters: { SearchField: "text", SearchResultField: "outFields", SearchCountField: "maxLocations", SearchBoundaryField: "bbox", SpatialReferenceField: "outSR" },
        LocatorURL: "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find",
        CandidateFields: "Addr_type,Type,Score, Match_addr",
        DisplayField: "${Match_addr}",
        ZoomLevel: 14,
        AddressMatchScore: { Field: "Score", Value: 80 },
        LocatorFieldName: 'Addr_type',
        LocatorFieldValues: ["StreetAddress", "StreetName", "PointAddress"],
        CountyFields: { LocatorFieldValue: 'POI', FieldName: 'Type', Value: 'county' },
        MaxResults: 100
    },

    //Fields for RSS Feed.
    RSSFields: ["item", "title", "link", "description"],

    //Link and fields for twitter trend.
    TwitterDetails: [
    { SearchURL: "https://api.twitter.com/1.1/search/tweets.json", StatusField: "statuses" },
    { TitleFields: ["user", "name"] },
    { DescriptionField: "text" },
    { StatusURL: "https://twitter.com/${0}/statuses", StatusFields: ["user", "screen_name"], StatusId: "id_str" }
    ],

    //Default values to set the RSS Feed and Twitter trend.
    DefaultNewsFields: [
    { RSSFeedName: "Florida Local News", RSSFeedURL: "http://www.floridapsc.com/home/news/newsrss.ashx" },
    { TwitterTrendName: "Florida" }
    ],

    //Set headers and Images for the welcome screen.
    WelcomeScreenImages: [
    { Name: "Efficient Transportation", Image: "images/b1.png" },
    { Name: "Quality Education", Image: "images/b2.png" },
    { Name: "Vibrant Downtown", Image: "images/b3.png" }
    ],

    //Layer Images for the subject groups.
    LayerImages: [
          { Tag: "Employment", Images: ["images/employment.png", "images/employment-hover.png"], isPodVisible: true },
          { Tag: "Growth", Images: ["images/growth.png", "images/growth_hover.png"], isPodVisible: true },
          { Tag: "Health", Images: ["images/health.png", "images/health_hover.png"], isPodVisible: true },
          { Tag: "Indicator", Images: ["images/indicators.png", "images/indicators-hover.png"], isPodVisible: true }
    ],

    //Specify fields for the Metric pods.
    InfoPodStatics: [
    { CurrentObservation: "${OBSERVCURR}", LatestObservation: "${OBSERV3}", PreviousObservations: ["${OBSERV2}", "${OBSERV1}"], StatisticsPosition: "${INCREASEPOS}" },
    { DateObservations: ["${DATECURR}", "${DATE3}", "${DATE2}", "${DATE1}"], DatePattern: "MMM dd, yyyy" }
    ],

    //Update information for info pods.
    PodInformation: "This report was updated on ${LASTUPDATE} and includes data from ${STARTDATE} to ${ENDDATE}.",

    //Keyword to detect the statistics layer.
    StatisticsKeyword: "- Stats",

    // ------------------------------------------------------------------------------------------------------------------------
    // SETTINGS FOR MAP SHARING
    // ------------------------------------------------------------------------------------------------------------------------
    // Set URL for TinyURL service, and URLs for Email.
    MapSharingOptions:
          {
              TinyURLServiceURL: "http://api.bit.ly/v3/shorten?login=esri&apiKey=R_65fd9891cd882e2a96b99d4bda1be00e&uri=${0}&format=json",
              TinyURLResponseAttribute: "data.url",
              ShareByMailLink: "mailto:%20?subject=Note%20from%20my%20Executive%20Dashboard&body=${0}"
          }

});
