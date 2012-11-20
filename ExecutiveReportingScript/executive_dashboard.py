"""
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
# -*- coding: utf-8 -*-
"""----------------------------------------------------------------------------
Name:               executive_dashboard.py
Purpose:
Author:             Local Government Team
Created:            June 22, 2012
ArcGIS Version:     10.1
Python Version:     2.7
----------------------------------------------------------------------------"""
import os
import collections
import getpass
import datetime
import arcpy
import serviceutils
import indicator_constants as ic

# Field names
date1       = u"DATE1"
date2       = u"DATE2"
date3       = u"DATE3"
date4       = u"DATE4"
datecurr    = u"DATECURR"
observ4     = u"OBSERV4"
observ3     = u"OBSERV3"
observ2     = u"OBSERV2"
observ1     = u"OBSERV1"
observcurr  = u"OBSERVCURR"
performind  = u"PERFORMIND"
last_update = u"LASTUPDATE"
last_editor = u"LASTEDITOR"
start_date  = u"STARTDATE"
end_date    = u"ENDDATE"

# Error messages.
gp_error = u"GP ERROR:"
py_error = u"ERROR:"
e1 = u"Spatial Analyst extension is not available."
e2 = u"No constants found for {}."
e3 = u"Please add a domain to the PerformanceIndicators named {}."
e4 = u"No performance indicator matching {}.\n Add a feature to {} matching {}."
e5 = u"The end date is empty."
e6 = u"No incidents found matching {}."
e7 = u"Invalid server URL or login credentials."

# Informative messages
m1 = u"{}: Updating the {} service...\n"
m2 = u"{}: Successfully updated {}.\n\n"


def update_observ_fields(perform_ind_features):
        """Updates the OBSERV and date fields."""
        fields = [observ4, observ3, observ2, observ1, observcurr, date4, date3, date2, date1, datecurr]
        with arcpy.da.UpdateCursor(perform_ind_features, fields) as rows:
                for row in rows:
                    row[0] = row[1] # OBSERV3 moves to OBSERV4
                    row[5] = row[6] # DATE3 moves to DATE4
                    row[1] = row[2] # OBSERV2 moves to OBSERV3
                    row[6] = row[7] # DATE2 moves to DATE3
                    row[2] = row[3] # OBSERV1 moves to OBSERV2
                    row[7] = row[8] # DATE1 moves to DATE2
                    row[3] = row[4] # OBSERVCURR moves to OBSERV1
                    row[8] = row[9] # DATECURR moves to DATE1
                    rows.updateRow(row)
# End update_observ_fields function

def find_key(dic, val):
    """Return the dictionary key given the value.
       Used to get the domain value for the indicator value.
    """
    for k, v in dic.iteritems():
        if v.lower() == val:
            return k
# End find_key function

def main(indicator_value, *argv):

    """
    Main function to record the number of incidents for a selected performance indicator value since
    the data/time the previous count of this value was performed, or within a specified number of days.
    It will also maintain a record of the previous 4 count records. Density of these new incidents
    will be mapped using the Kernel Density tool.

    Required arguments:
            indicator_value -- Performance Indicator value (i.e. Violent Crime)

    """

    # Open log file for reporting.
    with open(os.path.join(os.path.dirname(__file__), 'ed_log.log'), 'a') as log_file:
        try:
            # Check out the Spatial analyst extension.
            if arcpy.CheckExtension('Spatial') == 'Available':
                arcpy.CheckOutExtension('Spatial')
            else:
                raise Exception(e1)

            # Set overwrite output option to True.
            arcpy.env.overwriteOutput = True

            # Set performance indicators (tuples) based on the indicator value.
            try:
                indicator_values = ic.indicators[indicator_value]
            except KeyError:
                raise KeyError(e2.format(indicator_value))

            # Select from perform_ind_features where PERFORMIND == indicator_value.
            dsc = arcpy.Describe(ic.perform_ind_features)
            cp = os.path.dirname(dsc.catalogPath)
            if cp.endswith('.gdb'):
                domains = arcpy.da.ListDomains(cp)
            else:
                domains = arcpy.da.ListDomains(os.path.dirname(cp))
            for domain in domains:
                if domain.name == 'PerformanceIndicators':
                    c = find_key(domain.codedValues, indicator_value.lower())
                    if not c:
                        raise Exception(e3.format(indicator_value))
                    else:
                        break
            # Create a copy in memory instead using Select
            perform_ind_lyr = arcpy.management.MakeFeatureLayer(ic.perform_ind_features,
                                                "perform_ind_lyr", """{0} = {1}""".format(performind, c))

            # Update historical count and date fields.

            row_cnt = arcpy.management.GetCount(perform_ind_lyr)
            if int(row_cnt[0]) > 0:
                update_observ_fields(perform_ind_lyr)
            else:
                raise Exception(e4.format(indicator_value, ic.perform_ind_features, indicator_value))

            inc_time_field = indicator_values["inc_time_field"]
            # Select all incident features where:

            # 1. If number of days parameter is None, do this. Else, grab last # of days from now
            if indicator_values["number_of_days"] == '':
                # a. calltime is more recent than ENDDATE value from PerformanceIndicator where PERFORMIND == domain value
                with arcpy.da.SearchCursor(perform_ind_lyr, end_date, sql_clause=(None, "ORDER BY {0} DESC".format(end_date))) as dates:
                    last_update_value = dates.next()[0]
                    d = last_update_value
                if not last_update_value is None:
                    arcpy.management.MakeFeatureLayer(indicator_values["inc_features"], 'inc_lyr')
                    incident_lyr = arcpy.management.SelectLayerByAttribute('inc_lyr', "NEW_SELECTION",
                        """{0} > date '{1}'""".format(inc_time_field, str(last_update_value.replace(microsecond=0))))
                else:
                    raise Exception(e5)
            else:
                # b. Value of inc_time_field is >= the current date minus the number of days specified in number_of_days.
                d = datetime.datetime.now() - datetime.timedelta(days=int(indicator_values["number_of_days"]))
                arcpy.management.MakeFeatureLayer(indicator_values["inc_features"], 'inc_lyr')
                incident_lyr = arcpy.management.SelectLayerByAttribute('inc_lyr', "NEW_SELECTION",
                                        """{0} >= date '{1}'""".format(inc_time_field, str(d.replace(microsecond=0))))

            # 2. value of inc_type_field is in the list of performance_indicators
            inc_lyr_count = arcpy.management.GetCount(incident_lyr)

            inc_type_field = indicator_values["inc_type_field"]
            if not inc_type_field.upper() == "NONE":
                perform_indicators = indicator_values["perform_indicators"]
                if type(perform_indicators) == tuple:
                    arcpy.management.SelectLayerByAttribute(incident_lyr, "SUBSET_SELECTION",
                                    """{0} IN {1}""".format(inc_type_field, perform_indicators))
                else:
                    arcpy.management.SelectLayerByAttribute(incident_lyr, "SUBSET_SELECTION",
                                    """{0} = '{1}'""".format(inc_type_field, perform_indicators))

            # Populate OBSERVCURR with a count of the selected incident features.
            inc_lyr_count = arcpy.management.GetCount(incident_lyr)
            arcpy.management.CalculateField(perform_ind_lyr, observcurr, int(inc_lyr_count[0]), "PYTHON")

            # Populate DATECURR with current date.
            arcpy.management.CalculateField(perform_ind_lyr, datecurr, """datetime.datetime.now()""", "PYTHON")

            # Update LASTUPDATE and LASTEDITOR with the current date and username.
            arcpy.management.CalculateField(perform_ind_lyr, last_editor, "'{0}'".format(getpass.getuser()), "PYTHON")
            arcpy.management.CalculateField(perform_ind_lyr, last_update, """datetime.datetime.now()""", "PYTHON")

            # Populate STARTDATE and ENDDATE with the date range of the data used.
            with arcpy.da.UpdateCursor(incident_lyr, inc_time_field, sql_clause=(None, "ORDER BY {0} DESC".format(inc_time_field))) as dates:
                startdate = d
            arcpy.management.CalculateField(perform_ind_lyr, start_date, repr(startdate), "PYTHON")
            with arcpy.da.UpdateCursor(incident_lyr, inc_time_field, sql_clause=(None, "ORDER BY {0} ASC".format(inc_time_field))) as dates:
                enddate = datetime.datetime.now()
            arcpy.management.CalculateField(perform_ind_lyr, end_date, repr(enddate), "PYTHON")

            # Get the average distance to the specified Nth nearest neighbor for the selected incident features.
            if not int(inc_lyr_count[0]) > 0:
                raise Exception(e6.format(indicator_value))

            distances = arcpy.stats.CalculateDistanceBand(incident_lyr, indicator_values["neighbors_value"],"EUCLIDEAN_DISTANCE")
            avg_distance = float(distances[1])

            # Calculates the density of incident features in a neighborhood using the avg distance (from above).
            output_density = indicator_values["output_density"]
            arcpy.gp.KernelDensity_sa(incident_lyr, "NONE", output_density, "", avg_distance, "SQUARE_MILES")

            # Retrieve the mean and standard deviation of the raster pixel values.
            mean = arcpy.management.GetRasterProperties(output_density, "MEAN")
            std = arcpy.management.GetRasterProperties(output_density, "STD")

            # Exclude from rendering all values from 0 => (mean + (stdev) x (excluded_raster_values))
            exclusion_value = indicator_values["exclusion_value"]
            if not exclusion_value == str(0):
                mean = float(mean[0])
                std = float(std[0])
                exclude_values = "0 - {0}".format(str(mean + (std) * (int(exclusion_value))))
            else:
                exclude_values = "0"

            mxd = arcpy.mapping.MapDocument(indicator_values["map_document"])
            raster_layer = arcpy.mapping.ListLayers(mxd)[0]
            raster_layer.symbology.excludedValues = exclude_values
            mxd.save()

#TODO: Please review messaging for publishing the services

            # Publish the services.
            dt = datetime.datetime.strftime(datetime.datetime.now(), "%Y-%m-%d %H:%M:%S")
            log_file.write(m1.format(dt, indicator_values["service_name"]))
            print m1.format(dt, indicator_values["service_name"])
            serviceutils.publish_service(indicator_values["service_name"], mxd, "Map")

            dt = datetime.datetime.strftime(datetime.datetime.now(), "%Y-%m-%d %H:%M:%S")
            log_file.write(m1.format(dt, ic.stats_service_name))
            print m1.format(dt, ic.stats_service_name)
            serviceutils.publish_service(ic.stats_service_name, ic.stats_mxd, "Feature")

            # Log the results.
            dt = datetime.datetime.strftime(datetime.datetime.now(), "%Y-%m-%d %H:%M:%S")
            log_file.write(m2.format(dt, indicator_value))

        except arcpy.ExecuteError:
            print("{}\n{}\n".format(gp_error, arcpy.GetMessages(2)))
            dt = datetime.datetime.strftime(datetime.datetime.now(), "%Y-%m-%d %H:%M:%S")
            log_file.write("{} ({}):\n".format(gp_error, dt))
            log_file.write("{}\n".format(arcpy.GetMessages(2)))
        except KeyError as ke:
            print("{} {}\n".format(py_error, ke[0]))
            dt = datetime.datetime.strftime(datetime.datetime.now(), "%Y-%m-%d %H:%M:%S")
            log_file.write("{} ({}):\n".format(py_error, dt))
            log_file.write('{}\n'.format(ke[0]))
        except serviceutils.AGSConnectionError:
            print("{}: {}\n".format(py_error, e7))
            dt = datetime.datetime.strftime(datetime.datetime.now(), "%Y-%m-%d %H:%M:%S")
            log_file.write("{} ({}):\n".format(py_error, dt))
            log_file.write("{}\n".format(e7))
        except Exception as ex:
            print("{}: {}\n".format(py_error, ex[0]))
            dt = datetime.datetime.strftime(datetime.datetime.now(), "%Y-%m-%d %H:%M:%S")
            log_file.write("{} ({}):\n".format(py_error, dt))
            log_file.write("{}\n".format(ex[0]))
# End main function

if __name__ == '__main__':
        argv = tuple(arcpy.GetParameterAsText(i)
                     for i in range(arcpy.GetArgumentCount()))
        main(*argv)