# Publishing variables

# Full path to server connection. For ArcGIS Online hosted services use "My Hosted Services"
server_path              = r"C:\Users\<username>\AppData\Roaming\ESRI\Desktop10.2\ArcCatalog\<server connection>"

# Server URL or ArcGIS Online organization URL
server_url               = "http://<server>:6080/arcgis/admin/"

# Full path to cache location (ArcGIS for Server only)
service_cache_directory = r"C:\arcgisserver\directories\arcgiscache"

# Server folder containing services if services are in a folder other than root.
#       ArcGIS Online services are always published to the root directory.
folder_name             = ""

# Username and password for an account with administrative access to the
#       ArcGIS Server Manager or ArcGIS organizational account
user_name               = ""
password                = ""


# Feature service variables

# Name of feature service
stats_service_name       = "PerformanceIndicators"

# Full path to PerformanceIndicators feature class
perform_ind_features     = r"C:\Users\<username>\AppData\Roaming\ESRI\Desktop10.2\ArcCatalog\Connection to <SDE database>.sde\LocalGovernment.DBO.ExecutiveReporting\LocalGovernment.DBO.PerformanceIndicator"

# Full path to map document containing PerformanceIndicators layers
stats_mxd                = r"<your directory>\ExecutiveDashboardfor10.2\MapsandGeodatabase\PerformanceIndicators.mxd"


# ArcGIS Online sharing variables (Upload Service Definition tool)

# All shared services are available through My Contents.
#       "SHARE_ONLINE"      Share the service on ArcGIS Online. The service will be listed under My Content.
#       "NO_SHARE_ONLINE"   The service will not be shared on ArcGIS Online and
#                           will be inaccessible to other ArcGIS Online users and clients on the web.

in_my_contents          = "SHARE_ONLINE"

# Choose whether or not your service will be available to the public.
#       "PUBLIC"            Share the service with the public.
#       "PRIVATE"           Do not share the service with the public.

in_public               = "PRIVATE"

# Share your service with your organization.
#       "SHARE_ORGANIZATION"    Share the service with your organization.
#       "NO_SHARE_ORGANIZATION" Do not share the service with your organization.

in_organization         = "SHARE_ORGANIZATION"

# A list of group names with which to share the service.
# Enclose each group name in quotation marks and separate groups using commas.
in_groups               = []


# Scales at which the incident density maps should be cached.
# Choose from the following cache scales from the ArcGIS Online/Google Maps/Bing Maps cache schema:
""" 591657527.591555, 295828763.79577702, 147914381.89788899, 73957190.948944002,
36978595.474472001, 18489297.737236001, 9244648.8686180003, 4622324.4343090001,
2311162.2171550002, 1155581.108577, 577790.55428899999, 288895.27714399999, 144447.638572,
72223.819285999998, 36111.909642999999, 18055.954822, 9027.9774109999998, 4513.9887049999998,
2256.994353, 1128.4971760000001 """

cache_tile_scales = [144447.638572, 72223.819285999998, 36111.909642999999, 18055.954822, 9027.9774109999998, 4513.9887049999998]


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
                "inc_features"          : r"<your directory>\ExecutiveDashboardfor10.2\MapsandGeodatabase\LocalGovernment.gdb\CitizenService\ServiceRequest",
                "inc_type_field"        : "REQUESTTYPE",
                "inc_time_field"        : "REQUESTDATE",
                "output_density"        : r"<your directory>\ExecutiveDashboardfor10.2\MapsandGeodatabase\LocalGovernment.gdb\AnimalComplaints",
                "map_document"          : r"<your directory>\ExecutiveDashboardfor10.2\MapsandGeodatabase\AnimalComplaints.mxd",
                "neighbors_value"       : '8',
                "exclusion_value"       : '2',
                "number_of_days"        : '1000',
                "perform_indicators"    : ("Animal Complaint")
                },

    'Pothole Complaints' :
                {
                "service_name"          : "PotholeComplaints",
                "inc_features"          : r"<your directory>\ExecutiveDashboardfor10.2\LocalGovernment.gdb\CitizenService\ServiceRequest",
                "inc_type_field"        : "REQUESTTYPE",
                "inc_time_field"        : "REQUESTDATE",
                "output_density"        : r"<your directory>\ExecutiveDashboardfor10.2\LocalGovernment.gdb\PotholeComplaints",
                "map_document"          : r"<your directory>\ExecutiveDashboardfor10.2\PotholeComplaints.mxd",
                "neighbors_value"       : '3',
                "exclusion_value"       : '1',
                "number_of_days"        : '1000',
                "perform_indicators"    : ("Pothole")
                },

    'Street Light Outages' :
                {
                "service_name"          : "StreetLightOutages",
                "inc_features"          : r"<your directory>\ExecutiveDashboardfor10.2\LocalGovernment.gdb\CitizenService\ServiceRequest",
                "inc_type_field"        : "REQUESTTYPE",
                "inc_time_field"        : "REQUESTDATE",
                "output_density"        : r"<your directory>\ExecutiveDashboardfor10.2\LocalGovernment.gdb\StreetLightOutages",
                "map_document"          : r"<your directory>\ExecutiveDashboardfor10.2\StreetLightOutages.mxd",
                "neighbors_value"       : '3',
                "exclusion_value"       : '2',
                "number_of_days"        : '1000',
                "perform_indicators"    : ("Street Light Damage")
                },
}
