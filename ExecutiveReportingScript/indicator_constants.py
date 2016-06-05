# Credentials - required for ArcGIS Online layers only
org_url             = "http://www.arcgis.com"   # URL of the organization containing the web map
org_username        = ""                    # Username & password for an account in the organization
org_password        = ""

# Web Map Information
map_id           = "" # Web map ID

# Data Layer Information
data_service_type = 'Server'                  # Is the data layer hosted in the org_url organization ("AGOL", or "Portal"), or on ArcGIS Server ("Server")
data_layer_name   = "Animal Complaints"           # Name of the map layer containing the features to be counted
data_feature_class = r"" # Path to feature class containing data to load into hosted layer. Must be same schema as layer. Leave blank to not load new features.
date_field              = "REQUESTDATE"           # Field in the data layer containing the date each report was created
auto_update_date_query  = True                    # True if the script should update an existing date range filter on the data layer in the map to show only the summarized features.
report_duration         = 4                       # duration and unit of time to calculate the report start date. Use "" to use the end date of the previous report. The report end date will always be now.
report_time_unit        = "weeks"                 # hours, days, weeks

# Stats Layer Information
stats_service_type = ""                 # Layer in the web map containing the historical counts and report dates. Valid values are 'AGOL', 'Portal', and 'Server'
stats_layer_name  = "Stats"                 # Name of layer containing the historical count dates and values
stats_feature_class = r""                    # Full path to the feature class containing the Performance Indicators stats features. This parameter is required when stats_service_type is 'Server'
stats_feature_id = 0                       # OID value of the feature containing the statistics for the current performance indicator. This parameter is required when when stats_service_type is 'Server'

# Stats layer field names
date1           = u"DATE1"
date2           = u"DATE2"
date3           = u"DATE3"
date4           = u"DATE4"
datecurr        = u"DATECURR"
observ4         = u"OBSERV4"
observ3         = u"OBSERV3"
observ2         = u"OBSERV2"
observ1         = u"OBSERV1"
observcurr      = u"OBSERVCURR"
performind      = u"PERFORMIND"
last_update     = u"LASTUPDATE"
last_editor     = u"LASTEDITOR"
start_date      = u"STARTDATE"
end_date        = u"ENDDATE"

