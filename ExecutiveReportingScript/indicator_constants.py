"""
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
"""
# Server variables

# Full path to server connection
server_path              = r"C:\Users\username\AppData\Roaming\ESRI\Desktop10.1\ArcCatalog\arcgis on yourserver (admin)"

# Server URL
server_url               = "http://yourserver/arcgis/admin"

# Full path to cache location
service_cache_directory = r"C:\arcgisserver\directories\arcgiscache"

# Server folder containing services if services are in a folder other than root
folder_name             = ""

# Username and password for an account with administrative access to the ArcGIS Server Manager
user_name               = ""
password                = ""


# Feature service variables

# Name of feature service
stats_service_name       = "PerformanceIndicators"

# Full path to PerformanceIndicators feature class
perform_ind_features     = r"C:\Users\username\AppData\Roaming\ESRI\Desktop10.1\ArcCatalog\Connection to yourserver_sqlexpress.sde\LocalGovernment.DBO.ExecutiveReporting\LocalGovernment.DBO.PerformanceIndicator"

# Full path to map document containing PerformanceIndicators layers
stats_mxd                = r"C:\ExecutiveDashboard\PerformanceIndicators.mxd"


# Scales at which the incident density maps should be cached.
# Choose from the following cache scales from the ArcGIS Online/Google Maps/Bing Maps cache schema:
""" 591657527.591555, 295828763.79577702, 147914381.89788899, 73957190.948944002,
36978595.474472001, 18489297.737236001, 9244648.8686180003, 4622324.4343090001,
2311162.2171550002, 1155581.108577, 577790.55428899999, 288895.27714399999, 144447.638572,
72223.819285999998, 36111.909642999999, 18055.954822, 9027.9774109999998, 4513.9887049999998,
2256.994353, 1128.4971760000001 """

cache_tile_scales = [288895.27714399999, 144447.638572, 72223.819285999998, 36111.909642999999, 18055.954822, 9027.9774109999998]


# Variables for each performance indicator:
"""
    'Name of performance indicator':
                {
                "service_name"          : "Name of the incident density tiled map service",
                "inc_features"          : r"Full path to incident features",
                "inc_type_field"        : "Field in inc_features used to identify features belonging to the performance indicator.
                                            Use the value 'None'" to indicate all features belong to one performance indicator.,
                "inc_time_field"        : "Date field in inc_features",
                "output_density"        : r"Full path to incident density raster",
                "map_document"          : r"Full path to map document containing incident density raster",
                "neighbors_value"       : 'Number of neighbors used to calculate the search radius for creating the incident density raster
                                            See the related help topic for more details.',
                "exclusion_value"       : 'Value used to calculate which incident density raster values to render
                                            See the related help topic for more details.',
                "number_of_days"        : 'Leave blank to use all incidents since the last time the script was run.
                                            The number of days of incidents to use',
                "perform_indicators"    : ("Comma separated values from inc_type_field belonging to the perfornamce indicator.")
                },
"""
indicators = {
    'Animal Complaints':
                {
                "service_name"          : "AnimalComplaints",
                "inc_features"          : r"C:\ExecutiveDashboard\LocalGovernment.gdb\CitizenService\ServiceRequest",
                "inc_type_field"        : "REQUESTTYPE",
                "inc_time_field"        : "REQUESTDATE",
                "output_density"        : r"C:\ExecutiveDashboard\ExecReporting2.gdb\AnimalComplaints",
                "map_document"          : r"C:\ExecutiveDashboard\AnimalComplaints.mxd",
                "neighbors_value"       : '8',
                "exclusion_value"       : '2',
                "number_of_days"        : '',
                "perform_indicators"    : ("Animal Complaint")
                },

    'Pothole Complaints' :
                {
                "service_name"          : "PotholeComplaints",
                "inc_features"          : r"C:\ExecutiveDashboard\LocalGovernment.gdb\CitizenService\ServiceRequest",
                "inc_type_field"        : "REQUESTTYPE",
                "inc_time_field"        : "REQUESTDATE",
                "output_density"        : r"C:\ExecutiveDashboard\LocalGovernment.gdb\PotholeComplaints",
                "map_document"          : r"C:\ExecutiveDashboard\PotholeComplaints.mxd",
                "neighbors_value"       : '3',
                "exclusion_value"       : '1',
                "number_of_days"        : '1000',
                "perform_indicators"    : ("Pothole")
                },

    'Street Light Outages' :
                {
                "service_name"          : "StreetLightOutages",
                "inc_features"          : r"C:\ExecutiveDashboard\LocalGovernment.gdb\CitizenService\ServiceRequest",
                "inc_type_field"        : "REQUESTTYPE",
                "inc_time_field"        : "REQUESTDATE",
                "output_density"        : r"C:\ExecutiveDashboard\LocalGovernment.gdb\StreetLightOutages",
                "map_document"          : r"C:\ExecutiveDashboard\StreetLightOutages.mxd",
                "neighbors_value"       : '3',
                "exclusion_value"       : '2',
                "number_of_days"        : '1000',
                "perform_indicators"    : ("Street Light Damage")
                },
}
