"""
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
"""
"""
Utility functions for managing the map services.
"""
import os
import urllib
import urllib2
import json
import shutil
import tempfile
import xml.dom.minidom as DOM
import arcpy
from _server_admin import admin
import indicator_constants as ic

class AGSConnectionError(Exception):
    """ArcGIS Server connection exception class."""
    pass

def gentoken(server, adminUser, adminPass, expiration=60):
    """Get a token required for Admin changes."""
    query_dict = {'username':   adminUser,
                  'password':   adminPass,
                  'expiration': str(expiration),
                  'client':     'requestip'}

    query_string = urllib.urlencode(query_dict)
    url = "{}/generateToken".format(server)

    token = json.loads(urllib.urlopen(url + "?f=json", query_string).read())

    if "token" not in token:
        raise Exception(token['messages'])
    else:
        # Return the token to the function which called for it
        return token['token']
# End gentoken function

def deleteHostedMapsService(itemToDelete, itemToDeleteType, user_name, password):
    """Deletes a hosted map service on arcgis.com."""
    token = gentoken('https://www.arcgis.com/sharing/generateToken', user_name, password)
    userContentUrl = "{}/sharing/content/users/{}?&token={}&f=json".format("https://www.arcgis.com", user_name, token)
    response = urllib2.urlopen(userContentUrl, ' ').read()

    dictionary = json.loads(response)
    items = dictionary['items']

    delete_items = itemToDelete.split('.')
    for item in items:
        currentItem = item['item']
        currentItemType = item['itemType']
        currentItemID = item['id']
        if currentItem:
            if delete_items[0] in currentItem and delete_items[1] in currentItem and itemToDeleteType == currentItemType:
                delete_service_url = "{}/sharing/content/users/{}/items/{}/delete?&token={}&f=json".format("https://www.arcgis.com", user_name, currentItemID, token)
                response = urllib2.urlopen(delete_service_url, ' ').read()
    return response
# End deleteHostedMapService function

def update_sddraft(sddraft_file, soe, enabled):
    """Updates the sddraft file to disable or enable Server Object Extentions."""
    # Read the sddraft xml.
    doc = DOM.parse(sddraft_file)
    # Find all elements named TypeName. This is where the server object extension (SOE) names are defined.
    typeNames = doc.getElementsByTagName('TypeName')
    for typeName in typeNames:
        # Get the TypeName we want to enable/disable.
        if typeName.firstChild.data == soe:
            extension = typeName.parentNode
            for extElement in extension.childNodes:
                if extElement.tagName == 'Enabled':
                    extElement.firstChild.data = enabled

    # Output to a new sddraft.
    outXml = sddraft_file
    f = open(outXml, 'w')
    doc.writexml( f )
    f.close()
# End disable_kml function

def publish_service(service_name, mxd, service_type, hosted=False):
    """Publishes the service."""
    # Create an sddraft file from the mxd.
    sd_dir = tempfile.mkdtemp()
    if service_type == "Feature":
        mxd = arcpy.mapping.MapDocument(mxd)

    if hosted == False:

        arcpy.mapping.CreateMapSDDraft(mxd, os.path.join(sd_dir, "ed.sddraft"),
                                        service_name, "ARCGIS_SERVER", "{}.ags".format(ic.server_path), "", ic.folder_name, )

    else:
        arcpy.mapping.CreateMapSDDraft(mxd, os.path.join(sd_dir, "ed.sddraft"), service_name, "MY_HOSTED_SERVICES", "", False,)

    # Disable KML service capability.
    update_sddraft(os.path.join(sd_dir, "ed.sddraft"), "KmlServer", "false")

    # If creating a feature service, enable FeatureServer.
    if service_type == 'Feature':
        update_sddraft(os.path.join(sd_dir, "ed.sddraft"), "FeatureServer", "true")

    # Stage the sddraft file.
    arcpy.server.StageService(os.path.join(sd_dir, "ed.sddraft"), os.path.join(sd_dir, "ed.sd"))

    if hosted == True:
        arcpy.server.SignInToPortal(ic.user_name, ic.password, "http://www.arcgis.com/")
        # Delete the existing hosted service and sd draft -- if it doesn't exist, it will continue.
        deleteHostedMapsService("{0}.MapServer".format(service_name), "url", ic.user_name, ic.password)
        deleteHostedMapsService("{0}.sd".format(service_name), "file", ic.user_name, ic.password)
        # Upload/publish map service.
        result = arcpy.server.UploadServiceDefinition(os.path.join(sd_dir, "ed.sd"), "My Hosted Services",
                                    service_name, "", "FROM_SERVICE_DEFINITION", "", "STARTED",
                                    "OVERRIDE_DEFINITION","SHARE_ONLINE","PRIVATE","NO_SHARE_ORGANIZATION","#")
        if service_type == 'Map':
            # Re-generate the cache for the incident raster service.
            arcpy.server.ManageMapServerCacheTiles(os.path.join("My Hosted Services",
                                "{0}.MapServer".format(service_name)), ic.cache_tile_scales, "RECREATE_ALL_TILES")
    else:
        try:
            adm = admin.Admin(ic.server_url, ic.user_name, ic.password, generate_token=True)
        except TypeError:
            raise AGSConnectionError()

        if not ic.folder_name == "":
            srv = adm.services["{}/{}".format(ic.folder_name, service_name)]
        else:
            srv = adm.services[service_name]

        # Remove the existing tiled service and cache and publish and cache a new incident raster service.
        if service_type == 'Map':
            if not ic.folder_name == "":
                arcpy.server.DeleteMapServerCache(os.path.join(ic.server_path, "{}/{}.MapServer".format(ic.folder_name, service_name)))

                srv.delete()

                result = arcpy.server.UploadServiceDefinition(os.path.join(sd_dir, "ed.sd"),
                                                    ic.server_path, service_name, "", "", ic.folder_name)
                arcpy.server.CreateMapServerCache(os.path.join(ic.server_path, "{}/{}.MapServer".format(ic.folder_name, service_name)),
                                                    ic.service_cache_directory,"NEW","CUSTOM","",96,"256 x 256","","",ic.cache_tile_scales,"PNG")
                arcpy.server.ManageMapServerCacheTiles(os.path.join(ic.server_path, "{}/{}.MapServer".format(ic.folder_name, service_name)),
                                                    ic.cache_tile_scales,"RECREATE_ALL_TILES")

            else:
                arcpy.server.DeleteMapServerCache(os.path.join(ic.server_path, "{}.MapServer".format(service_name)))

                srv.delete()

                result = arcpy.server.UploadServiceDefinition(os.path.join(sd_dir, "ed.sd"),
                                                    ic.server_path, service_name, "", "")
                arcpy.server.CreateMapServerCache(os.path.join(ic.server_path, "{}.MapServer".format(service_name)),
                                                    ic.service_cache_directory,"NEW","CUSTOM","",96,"256 x 256","","",ic.cache_tile_scales,"PNG")
                arcpy.server.ManageMapServerCacheTiles(os.path.join(ic.server_path, "{}.MapServer".format(service_name)),
                                                    ic.cache_tile_scales,"RECREATE_ALL_TILES")

        # Remove the existing feature service and publish a new one
        else:
                srv.delete()

                result = arcpy.server.UploadServiceDefinition(os.path.join(sd_dir, "ed.sd"),
                                                    ic.server_path, service_name, "", "", ic.folder_name)

    # Delete temporary draft file folder.
    shutil.rmtree(sd_dir)

# End publish_service function