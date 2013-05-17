# executive-dashboard

The Executive Dashboard is a configuration of ArcGIS Online and a HTML 5 / JavaScript application used by local government leaders to proactively view critical metrics, identify trends, raise questions, and devise new management strategies.  It supports community-wide efforts to increase accountability and transparency within government and with the citizens they serve.   The Dashboard is a single application that can be deployed by local governments and used by decision-makers on a tablet device and desktop PC.

[Try the Executive Dashboard application](http://localgovtemplates2.esri.com/ExecutiveDashboardTryItLive/)

[![Image of Executive Dashboard application](https://raw.github.com/Esri/executive-dashboard/master/executive-dashboard.png "Executive Dashboard application")](http://localgovtemplates2.esri.com/ExecutiveDashboardTryItLive/)

## Features

* Review key performance indicators
* Identify concentrations of activities
* Review trends
* Share concerns and collaborate with other decision makers in organization

## Instructions

### Your Services

[Detailed help](http://resources.arcgis.com/en/help/localgovernment/10.1/index.html#/What_is_Executive_Dashboard/028s0000011n000000/)
on the ArcGIS Resource Center can guide you in the setup and configuration of the app with your services.

### Developer Notes

Of interest to the developer is the configuration of the proxy for RSS
feeds. If you configure the proxy to require URLs to match those present in the proxy.config file
as [recommended by Esri](http://help.arcgis.com/en/webapi/javascript/arcgis/help/jshelp_start.htm#jshelp/ags_proxy.htm),
you limit your users to whatever RSS feed URLs are configured. If instead you change mustMatch to
"false", you permit your users to select any RSS feed, but there is the possibility that the site
might be used by unexpected sources. This is a security tradeoff that you and your organization must
decide.

### General Help
[New to Github? Get started here.](http://htmlpreview.github.com/?https://github.com/Esri/esri.github.com/blob/master/help/esri-getting-to-know-github.html)

## Requirements

### Your Services

* ArcGIS Online
* ArcGIS for Desktop 10.1 - Standard or Advanced - [About](http://www.esri.com/software/arcgis/arcgis-for-desktop)
* ArcGIS for Server 10.1 - Standard or Advanced - [About](http://www.esri.com/software/arcgis/arcgisserver)
* Local Government Information Model - [About](http://www.arcgis.com/home/item.html?id=5f799e6d23d94e25b5aaaf2a58e63fb1)
* Microsoft ASP.NET Framework 4.0 available from the [Microsoft website](http://www.microsoft.com/en-us/download/details.aspx?id=17851)

## Resources

Learn more about Esri's [ArcGIS for Local Government maps and apps](http://resources.arcgis.com/en/communities/local-government/).

Show me a list of other [Local Government GitHub repositories](http://esri.github.io/#Local-Government).

Additional [information and sample data](http://www.arcgis.com/home/item.html?id=9c31136ff6f54dfb90edbc74f08573ed)
are available for the application.

This application uses the 3.5 version of
[Esri's ArcGIS API for JavaScript](http://help.arcgis.com/en/webapi/javascript/arcgis/);
see the site for concepts, samples, and a reference for using the API to create mapping web sites.

## Issues

Find a bug or want to request a new feature?  Please let us know by submitting an issue.

## Contributing

Anyone and everyone is welcome to contribute.

## Licensing

Copyright 2012 Esri

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

A copy of the license is available in the repository's
[license.txt](https://raw.github.com/Esri/executive-dashboard/master/license.txt) file.

[](Esri Tags: Local-Government Local Government Executive Dashboard)
[](Esri Language: JavaScript)
