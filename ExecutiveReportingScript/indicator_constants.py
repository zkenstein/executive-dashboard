# Credentials - required for ArcGIS Online or Portal layers and Web Map
org_url             = "http://www.arcgis.com"  		# URL of the organization containing the web map
org_username        = ""                    		# Username & password for an account in the organization
org_password        = ""

# Credentials - required for ArcGIS Server layers only
ags_username		= "" 							# Username & password secured arcgis server services. Leave blank if service is unsecured.
ags_password		= ""
ags_token_url		= "" 							# ex. "http://gisserver.domain.com:6080/arcgis/tokens/generateToken"

# Web Map Information
map_id           	= "" 							# Web map ID

# Data Layer Information
data_service_type 		= 'Server'					# Is the data layer hosted in the org_url organization ("AGOL", or "Portal"), or on ArcGIS Server ("Server")
data_layer_name   		= "Animal Complaints"       # Name of the map layer containing the features to be counted
data_feature_class 		= r"" 						# Path to feature class containing data to load into hosted layer. Must be same schema as layer. Leave blank to not load new features.
date_field              = "REQUESTDATE"           	# Field in the data layer containing the date each report was created
auto_update_date_query  = True                    	# True if the script should update an existing date range filter on the data layer in the map to show only the summarized features.
report_duration         = 4                       	# Duration and unit of time to calculate the report start date. Use "" to use the end date of the previous report. The report end date will always be now.
report_time_unit        = "weeks"                 	# minutes, hours, days, weeks

# Stats Layer Information
stats_service_type 		= "Server"                 	# Layer in the web map containing the historical counts and report dates. Valid values are 'AGOL', 'Portal', and 'Server'
stats_layer_name  		= "Stats"                 	# Name of layer containing the historical count dates and values

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

