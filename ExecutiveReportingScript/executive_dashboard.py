#-------------------------------------------------------------------------------
# Name:         executive_dashboard.py
# Purpose:
#
# Author:       Local Government
#
# Created:      13/08/2015
# Version:      Python 2.7
#-------------------------------------------------------------------------------

import json, urllib, arcrest
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
m6 = "Layer does not contain a filter that uses the provided date field."
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

    resFeats = layer.query(where=query,
                        out_fields=",".join(out_fields))
    for feat in resFeats:

        for fld in field_info:
            feat.set_value(fld["FieldName"],fld['ValueToSet'])

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

def main():
    with open(join(dirname(__file__), 'DashboardLog.log'), 'a') as log_file:

        # Get current time for report datetime range
        start_time = dt.utcnow()
        today_agol = dt.isoformat(start_time)

        try:

            # Get security handler for organization content
            org_shh = create_security_handler(security_type='Portal',
                                              username=ic.org_username,
                                              password=ic.org_password,
                                              org_url=ic.org_url)
            if org_shh.valid == False:
                raise Exception(org_shh.message)

            # Get security handler for services
            if 'Server' in [ic.data_service_type, ic.stats_service_type]:
                service_shh = create_security_handler(security_type='Portal',
                                                  username=ic.server_username,
                                                  password=ic.server_password,
                                                  org_url=ic.server_url)

                if server_shh.valid == False:
                    raise Exception(org_shh.message)

                if ic.data_service_type == 'Server':
                    data_sh = server_shh

                if ic.stats_service_type == 'Server':
                    stats_sh = server_shh

            if ic.data_service_type == 'AGOL':
                data_sh = org_shh.securityhandler

            if ic.stats_service_type == 'AGOL':
                stats_sh = org_shh.securityhandler

            # Access map JSON
            admin = arcrest.manageorg.Administration(securityHandler=org_shh.securityhandler)
            item = admin.content.getItem(ic.mapid)
            mapjson = item.itemData()

            if 'error' in mapjson:
                raise Exception(m2)

            print "Getting stats layer info..."

            # Get attributes of a single row in stats layer
            statsurl, statsquery = get_layer_properties(ic.statslayername,
                                                      mapjson['operationalLayers'])
            if not statsurl:
                raise Exception(m4)

            statslayer = connect_to_layer(statsurl, stats_sh)
            if not "Update" in statslayer.capabilities:
                raise Exception(m7)

            if not count_features(statslayer, query=statsquery) == 1:
                raise Exception(m5)

            stats = get_attributes(statslayer, query=statsquery)

            # If requested, update layer query using today as max date
            if ic.auto_update_date_query:

                print "Updating date filter on layer..."

                if ic.report_frequency:
                    # get diff value to min date
                    if ic.report_time_unit == 'minutes':
                        delta = td(minute=ic.report_frequency)
                    elif ic.report_time_unit == 'hours':
                        delta = td(hours=ic.report_frequency)
                    elif ic.report_time_unit == 'days':
                        delta = td(days=ic.report_frequency)
                    elif ic.report_time_unit == 'weeks':
                        delta = td(weeks=ic.report_frequency)

                    min_date = start_time - delta
                else:
                    # Use end date of previous report
                    min_date = stats[ic.end_date]

                # update filter on layer
                for layer in mapjson['operationalLayers']:
                    if layer['title'] == ic.datalayername:
                        try:
                            original_query = layer['layerDefinition']['definitionExpression']
                            query_words = original_query.split(" ")

                            # Get starting points of all date queries
                            date_locations = [d for d,x in enumerate(query_words) if ic.datefield in x]

                            # Find the date range query
                            for dloc in date_locations:
                                if query_words[dloc + 1] == "BETWEEN":
                                    query_start = dloc

                                    date_length_found = False
                                    date_length = 0

                                    # Dates can span multiple list elements
                                    # Find the # elements needed for each date
                                    while not date_length_found:
                                        if query_words[dloc + 2 + date_length] == 'AND':
                                            date_length_found = True
                                            break
                                        date_length += 1
                                    break

                            # replace max date
                            # preserve final ) if present
                            if ')' in query_words[dloc + 2 + (2*date_length)]:
                                suffix = ')'
                            else:
                                suffix = ""

                            # Delete current max date elements and insert new max date
                            del(query_words[dloc + 3 + date_length: dloc + 3 + (2*date_length)])
                            query_words.insert(dloc + 3 + date_length, "'{}'{}".format(start_time, suffix))


                            # replace min date
                            del(query_words[dloc + 2: dloc + 2 + date_length])
                            query_words.insert(dloc + 2, "'{}'".format(min_date))

                            # ReBuild query string
                            query = query_words[0]
                            for i in query_words[1:]:
                                query += " {}".format(i)

                            # Update JSON with new query
                            layer['layerDefinition']['definitionExpression'] = query

                        except ValueError, KeyError:
                            raise Exception(m6)

                # Commit update to AGOL item
                useritem = item.userItem
                params = arcrest.manageorg.ItemParameter()
                useritem.updateItem(itemParameters = params,
                                    text=json.dumps(mapjson))

            # Retrieve the url and queries associated with the data and stats layers
            print "Getting layer info..."

            dataurl, dataquery = get_layer_properties(ic.datalayername,
                                                      mapjson['operationalLayers'])
            if not dataurl:
                raise Exception(m3)

            # Connect to the services
            print "Connecting to data layer..."

            datalayer = connect_to_layer(dataurl, data_sh)

            # Count the data features that meet the map query
            print "Counting features"
            feature_cnt = count_features(datalayer, query=dataquery)

            print "Getting new stats..."

            # Current editor
            editor = getpass.getuser()

            # Stats fields and their new values
            field_info =[{
                            'FieldName':ic.datecurr,
                            'ValueToSet':today_agol
                        },{
                            'FieldName':ic.date1,
                            'ValueToSet':stats[ic.datecurr]
                        },{
                            'FieldName':ic.date2,
                            'ValueToSet':stats[ic.date1]
                        },{
                            'FieldName':ic.date3,
                            'ValueToSet':stats[ic.date2]
                        },{
                            'FieldName':ic.date4,
                            'ValueToSet':stats[ic.date3]
                        },{
                            'FieldName':ic.observcurr,
                            'ValueToSet':feature_cnt
                        },{
                            'FieldName':ic.observ1,
                            'ValueToSet':stats[ic.observcurr]
                        },{
                            'FieldName':ic.observ2,
                            'ValueToSet':stats[ic.observ1]
                        },{
                            'FieldName':ic.observ3,
                            'ValueToSet':stats[ic.observ2]
                        },{
                            'FieldName':ic.observ4,
                            'ValueToSet':stats[ic.observ3]
                        },{
                            'FieldName':ic.last_update,
                            'ValueToSet':today_agol
                        },{
                            'FieldName':ic.last_editor,
                            'ValueToSet':editor
                        },{
                            'FieldName':ic.start_date,
                            'ValueToSet':min_date
                        },{
                            'FieldName':ic.end_date,
                            'ValueToSet':today_agol
                        }]

            # Update stats layer
            print "Updating stats..."
            update_values(statslayer, field_info, query=statsquery)

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

# End main function

if __name__ == '__main__':
    argv = tuple(arcpy.GetParameterAsText(i)
                 for i in range(arcpy.GetArgumentCount()))
    main(*argv)