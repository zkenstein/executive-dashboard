#-------------------------------------------------------------------------------
# Name:         executive_dashboard.py
# Purpose:
#
# Author:       Local Government
#
# Created:      05/06/2016 AM
# Version:      Python 2.7
#-------------------------------------------------------------------------------

import json, urllib, arcrest, re
from arcrest.security import AGOLTokenSecurityHandler
from arcresthelper import securityhandlerhelper
from arcresthelper import common
from arcrest.agol import FeatureLayer
from datetime import datetime as dt
from datetime import timedelta as td
import getpass
import indicator_constants as ic
from os.path import dirname, join

# Messages
m1 = "Can not not create token to access map. Please check username, password, and organization URL."
m2 = "Can not access web map JSON. Please check map ID."
m3 = "Map does not contain the specified data layer"
m4 = "Map does not contain the specified stats layer"
m5 = "Apply a filter to the stats layer so that exactly one record is available in the map."
m6 = "Layer does not contain a filter that uses the provided date field, {0}, and the BETWEEN operator."
m7 = "Stats layer capabilities must include 'Update'."

def get_layer_properties(title, layers):
    """Parse the JSON of a web map and retrieve the URL of a specific layer,
    and any filters that have been applied to that layer."""
    for layer in layers:
        if layer['title'] == title:
            url = layer['url']
            if 'layerDefinition' in layer:
                query = layer['layerDefinition']['definitionExpression']
            else:
                query = "1=1"
            return url, query
    return "", "", ""

def connect_to_layer(url, sh, proxy_port=None, proxy_url=None, initialize=True):
    """Establish a connection to an ArcGIS Online feature layer"""
    fl = FeatureLayer(
            url=url,
            securityHandler=sh,
            proxy_port=proxy_port,
            proxy_url=proxy_url,
            initialize=initialize)
    return fl

def count_features(layer, query="1=1"):
    """Count feature in a feature layer, optionally respecting a where clause"""
    cnt = layer.query(where=query, returnGeometry=False, returnCountOnly=True)
    return cnt['count']

def featureset_to_dict(fs):
    """Returns JSON of a feature set in dictionary format"""
    fs_str = fs.toJSON
    fs_dict =json.loads(fs_str)
    return fs_dict

def get_attributes(layer, query="1=1", fields="*"):
    """Get all attributes for a record in a table"""
    vals = layer.query(where=query, out_fields=fields, returnGeometry=False)
    valsdict = featureset_to_dict(vals)
    return valsdict['features'][0]['attributes']

def update_values(layer, field_info, query="1=1"):
    """Update feature values """
    out_fields = ['objectid']
    for fld in field_info:
        out_fields.append(fld['FieldName'])

    resFeats = layer.query(where=query, out_fields=",".join(out_fields))
    for feat in resFeats:

        for fld in field_info:
            feat.set_value(fld["FieldName"],fld['ValueToSet'])

    return layer

def trace():
    """
        trace finds the line, the filename
        and error message and returns it
        to the user
    """
    import traceback, inspect,sys
    tb = sys.exc_info()[2]
    tbinfo = traceback.format_tb(tb)[0]
    filename = inspect.getfile(inspect.currentframe())
    # script name + line number
    line = tbinfo.split(", ")[1]
    # Get Python syntax error
    #
    synerror = traceback.format_exc().splitlines()[-1]
    return line, filename, synerror

def create_security_handler(security_type='Portal', username="", password="",
                            org_url="", proxy_url=None, proxy_port=None,
                            referer_url=None, token_url=None, certificatefile=None,
                            keyfile=None, client_id=None, secret_id=None):
    """Creates a security handler helper using the specified properties."""
    securityinfo = {}
    securityinfo['security_type'] = security_type#LDAP, NTLM, OAuth, Portal, PKI, ArcGIS
    securityinfo['username'] = username
    securityinfo['password'] = password
    securityinfo['org_url'] = org_url
    securityinfo['proxy_url'] = proxy_url
    securityinfo['proxy_port'] = proxy_port
    securityinfo['referer_url'] = referer_url
    securityinfo['token_url'] = token_url
    securityinfo['certificatefile'] = certificatefile
    securityinfo['keyfile'] = keyfile
    securityinfo['client_id'] = client_id
    securityinfo['secret_id'] = secret_id

    return securityhandlerhelper.securityhandlerhelper(securityinfo=securityinfo)

def get_epoch_time(date):
    epoch = dt.utcfromtimestamp(0)
    return (date - epoch).total_seconds() * 1000

def main():
    with open(join(dirname(__file__), 'DashboardLog.log'), 'a') as log_file:

        # Get current time for report datetime range
        start_time = dt.utcnow()
        today_agol = get_epoch_time(start_time)
        temp_fc = arcpy.env.scratchGDB + "\\temp_fc"
        proj_out = "{}_proj".format(temp_fc)
        min_date = None

        try:

            # Get security handler for organization content
            org_shh = create_security_handler(security_type='Portal',
                                              username=ic.org_username,
                                              password=ic.org_password,
                                              org_url=ic.org_url)
            if org_shh.valid == False:
                raise Exception(org_shh.message)

            shh = org_shh.securityhandler

            # Access map JSON
            admin = arcrest.manageorg.Administration(securityHandler=shh)
            item = admin.content.getItem(ic.map_id)
            mapjson = item.itemData()

            if 'error' in mapjson:
                raise Exception(m2)

            print "Getting stats layer info..."

            # Get attributes of a single row in stats layer
            statsurl, statsquery = get_layer_properties(ic.stats_layer_name,
                                                      mapjson['operationalLayers'])
            if not statsurl:
                raise Exception(m4)

            statslayer = connect_to_layer(statsurl, shh)

            if not count_features(statslayer, query=statsquery) == 1:
                raise Exception(m5)

            stats = get_attributes(statslayer, query=statsquery)

            # If requested, update layer query using today as max date
            if ic.auto_update_date_query:

                print "Updating date filter on layer..."

                if ic.report_duration:
                    # get diff value to min date
                    if ic.report_time_unit == 'minutes':
                        delta = td(minute=ic.report_duration)
                    elif ic.report_time_unit == 'hours':
                        delta = td(hours=ic.report_duration)
                    elif ic.report_time_unit == 'days':
                        delta = td(days=ic.report_duration)
                    elif ic.report_time_unit == 'weeks':
                        delta = td(weeks=ic.report_duration)

                    min_date = start_time - delta
                else:
                    # Use end date of previous report
                    min_date = stats[ic.end_date]

                # update filter on layer
                for layer in mapjson['operationalLayers']:
                    if layer['title'] == ic.data_layer_name:
                        try:
                            original_query = layer['layerDefinition']['definitionExpression']

                            #Find if the expression has a clause using the date field and Between operator
                            match = re.search(".*?{0} BETWEEN.*?'(.*?)'.*?AND.*?'(.*?)'.*".format(ic.date_field), original_query)
                            if match is None:
                                raise ValueError()

                            #Construct a new query replacing the min and max date values with the new dates
                            new_query = match.group()[0:match.start(1)] + min_date.strftime("%Y-%m-%d %H:%M:%S") + match.group()[match.end(1):match.start(2)] + start_time.strftime("%Y-%m-%d %H:%M:%S") + match.group()[match.end(2):]

                            # Update JSON with new query
                            layer['layerDefinition']['definitionExpression'] = new_query

                        except ValueError, KeyError:
                            d = dt.strftime(dt.now(), "%Y-%m-%d %H:%M:%S")
                            log_file.write("{}:\n".format(d))
                            log_file.write("{}\n".format(m6.format(ic.date_field)))
                            print(m6.format(ic.date_field))
                            continue

                # Commit update to AGOL item
                useritem = item.userItem
                params = arcrest.manageorg.ItemParameter()
                useritem.updateItem(itemParameters = params,
                                    text=json.dumps(mapjson))

            # Retrieve the url and queries associated with the data and stats layers
            print "Getting layer info..."

            dataurl, dataquery = get_layer_properties(ic.data_layer_name, mapjson['operationalLayers'])

            if not dataurl:
                raise Exception(m3)

            # Connect to the services
            print "Connecting to data layer..."

            datalayer = connect_to_layer(dataurl, shh)

            # If necessary, load new points to hosted service
            if ic.data_feature_class:

                # only attemp append if there are new features
                temp_fc = arcpy.CopyFeatures_management(ic.data_feature_class, temp_fc)
                sr_output = datalayer.extent['spatialReference']['wkid']
                temp_fc_proj = arcpy.Project_management(temp_fc, proj_out, sr_output)

                # Load data from layer to service
                datalayer.deleteFeatures(where="1=1")
                datalayer.addFeatures(temp_fc_proj)
                arcpy.Delete_management(temp_fc)
                arcpy.Delete_management(temp_fc_proj)

            # Count the data features that meet the map query
            print "Counting features"
            feature_cnt = count_features(datalayer, query=dataquery)

            print "Getting new stats..."

            # Current editor
            editor = getpass.getuser()

            attributes = get_attributes(statslayer, statsquery)
            attributes[ic.datecurr] = today_agol
            attributes[ic.date1] = stats[ic.datecurr]
            attributes[ic.date2] = stats[ic.date1]
            attributes[ic.date3] = stats[ic.date2]
            attributes[ic.date4] = stats[ic.date3]
            attributes[ic.observcurr] = feature_cnt
            attributes[ic.observ1] = stats[ic.observcurr]
            attributes[ic.observ2] = stats[ic.observ1]
            attributes[ic.observ3] = stats[ic.observ2]
            attributes[ic.observ4] = stats[ic.observ3]
            attributes[ic.last_update] = today_agol
            attributes[ic.last_editor] = editor
            attributes[ic.end_date] = today_agol
            if min_date is None:
                attributes[ic.start_date] = stats[ic.end_date]
            else:
                attributes[ic.start_date] = get_epoch_time(min_date)        

            edits = [{"attributes" : attributes}]
            statslayer.applyEdits(updateFeatures=edits)

            print "Done."

        except (common.ArcRestHelperError),e:
            print "error in function: %s" % e[0]['function']
            print "error on line: %s" % e[0]['line']
            print "error in file name: %s" % e[0]['filename']
            print "with error message: %s" % e[0]['synerror']
            if 'arcpyError' in e[0]:
                print "with arcpy message: %s" % e[0]['arcpyError']

        except Exception as ex:
            print("{}\n".format(ex))
            d = dt.strftime(dt.now(), "%Y-%m-%d %H:%M:%S")
            log_file.write("{}:\n".format(d))
            log_file.write("{}\n".format(ex))
        finally:
            if arcpy.Exists(temp_fc):
                arcpy.Delete_management(temp_fc)
            if arcpy.Exists(proj_out):
                arcpy.Delete_management(proj_out)

# End main function

if __name__ == '__main__':
    main()
