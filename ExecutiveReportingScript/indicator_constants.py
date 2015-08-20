# Credentials
org_url             = "http://arcgis.com"   # URL of the organization containing the web map
org_username        = ""                    # Username & password for an account in the organization
org_password        = ""

server_url          = ""                    # If the services are hosted on a server ourside the organization
server_username     = ""                    # Supplyt the URL to the server and the server administrator's
server_password     = ""                    # username and password

# Web Map Information
mapid           = ""                        # Web map ID
statslayername  = "Stats"                   # Name of layer containing the historical count dates and values
datalayername   = ""                        # Name of the feature layer containing the features to be counted

# Data Layer Information
data_service_type       = 'AGOL' # 'Server'       # Is the data layer hosted in the org_url organization ("AGOL"), or on the server_url ArcGIS Server ("Server")
datefield               = "REQUESTDATE"           # Field in the data layer containing the date each report was created
auto_update_date_query  = True                    # True if the script should update an existing date range filter on the data layer in the map to show only the summarized features
report_duration         = 4                       # duration and unit of time to calculate the report start date. Leave blank to use the end date of the previous report. The report end date will always be now.
report_time_unit        = "weeks" # minutes, hours, days, weeks

# Stats Layer Information
stats_service_type = 'AGOL'                 # Layer in the web map containing the historical counts and report dates

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

