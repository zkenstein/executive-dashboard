"""
Utility functions for managing the map services.
"""
from os.path import join
import shutil
import tempfile
import xml.dom.minidom as DOM
import arcpy
import indicator_constants as ic

def update_sddraft(sddraft_file, soe='', enabled=''):
    """Updates the sddraft file to
    disable or enable Server Object Extentions.
    """
    doc = DOM.parse(sddraft_file)

    # This is where the server object extension (SOE) names are defined.
    # Valid only for ArcGIS Server and not hosted services.
    if not soe == '':
        typeNames = doc.getElementsByTagName('TypeName')
        for typeName in typeNames:
            # Get the SOE (TypeName) we want to enable/disable.
            if typeName.firstChild.data == soe:
                extension = typeName.parentNode
                for extElement in extension.childNodes:
                    if extElement.tagName == 'Enabled':
                        extElement.firstChild.data = enabled

    # Update draft file to enable overwritting.
    newType = 'esriServiceDefinitionType_Replacement'
    newState = 'esriSDState_Published'
    myTagsType = doc.getElementsByTagName('Type')
    for myTagType in myTagsType:
        if myTagType.parentNode.tagName == 'SVCManifest':
            if myTagType.hasChildNodes():
                myTagType.firstChild.data = newType

    myTagsState = doc.getElementsByTagName('State')
    for myTagState in myTagsState:
        if myTagState.parentNode.tagName == 'SVCManifest':
            if myTagState.hasChildNodes():
                myTagState.firstChild.data = newState

    # Output to a new sddraft.
    outXml = sddraft_file
    f = open(outXml, 'w')
    doc.writexml( f )
    f.close()
# End disable_kml function

def publish_service(service_name, mxd, service_type, hosted=False):
    """Publishe the service."""
    if ic.server_path == "My Hosted Services":
        hosted = True

    # Create an sddraft file from the mxd.
    sd_dir = tempfile.mkdtemp()

    if service_type == "Feature":
        mxd = arcpy.mapping.MapDocument(mxd)

    if hosted == False:
        arcpy.mapping.CreateMapSDDraft(mxd,
                                        join(sd_dir, "ed.sddraft"),
                                        service_name,
                                        "ARCGIS_SERVER",
                                        "{}.ags".format(ic.server_path),
                                        folder_name=ic.folder_name)
    else:
        arcpy.mapping.CreateMapSDDraft(mxd,
                                    join(sd_dir, "ed.sddraft"),
                                    service_name,
                                    "MY_HOSTED_SERVICES",
                                    copy_data_to_server=False)

    # Disable KML service capability.
    if hosted == False:
        update_sddraft(join(sd_dir, "ed.sddraft"), "KmlServer", "false")

    else:
        # Update sddraft to enabled overwriting of an exisiting service.
        update_sddraft(join(sd_dir, "ed.sddraft"))

    # If creating a feature service, enable FeatureServer.
    if service_type == 'Feature':
        update_sddraft(join(sd_dir, "ed.sddraft"), "FeatureServer", "true")

    # Stage the sddraft file.
    arcpy.server.StageService(join(sd_dir, "ed.sddraft"), join(sd_dir, "ed.sd"))

    if hosted == True:
        arcpy.server.SignInToPortal(ic.user_name, ic.password, ic.server_url)

        # Upload (publish) map service.
        arcpy.server.UploadServiceDefinition(join(sd_dir, "ed.sd"),
                                    "My Hosted Services",
                                    service_name,
                                    in_folder_type="FROM_SERVICE_DEFINITION",
                                    in_startupType="STARTED",
                                    in_override="OVERRIDE_DEFINITION",
                                    in_my_contents=ic.in_my_contents,
                                    in_public=ic.in_public,
                                    in_organization=ic.in_organization,
                                    in_groups=ic.in_groups)
        if service_type == 'Map':
            # Re-generate the cache for the incident raster service.
            service = join("My Hosted Services", "{0}.MapServer".format(service_name))
            arcpy.server.ManageMapServerCacheTiles(service,
                                                 ic.cache_tile_scales,
                                                "RECREATE_ALL_TILES")
    else:
        # Remove the existing tiled service, cache, & publish.
        if service_type == 'Map':
            service = join(ic.server_path, "{}/{}.MapServer".format(ic.folder_name, service_name))
            if not ic.folder_name == "":
                try:
                    arcpy.server.DeleteMapServerCache(service)
                except Exception:
                    pass

                arcpy.server.UploadServiceDefinition(join(sd_dir, "ed.sd"),
                                                    ic.server_path,
                                                    service_name,
                                                    in_folder=ic.folder_name)

                arcpy.server.CreateMapServerCache(service,
                                                ic.service_cache_directory,
                                                "NEW",
                                                "CUSTOM",
                                                dots_per_inch=96,
                                                tile_size="256 x 256",
                                                scales=ic.cache_tile_scales,
                                                cache_tile_format="PNG")

                arcpy.server.ManageMapServerCacheTiles(service,
                                                    ic.cache_tile_scales,
                                                    "RECREATE_ALL_TILES")

            else:
                service = join(ic.server_path, "{}.MapServer".format(service_name))
                arcpy.server.DeleteMapServerCache(service)
                arcpy.server.UploadServiceDefinition(join(sd_dir, "ed.sd"),
                                                    ic.server_path,
                                                    service_name)

                arcpy.server.CreateMapServerCache(service,
                                                ic.service_cache_directory,
                                                "NEW",
                                                "CUSTOM",
                                                dots_per_inch=96,
                                                tile_size="256 x 256",
                                                scales=ic.cache_tile_scales,
                                                cache_tile_format="PNG")

                arcpy.server.ManageMapServerCacheTiles(service,
                                                    ic.cache_tile_scales,
                                                    "RECREATE_ALL_TILES")

        # Remove the existing feature service and publish a new one.
        else:
            arcpy.server.UploadServiceDefinition(join(sd_dir, "ed.sd"),
                                                ic.server_path,
                                                service_name,
                                                in_folder=ic.folder_name)

    # Delete temporary draft file folder.
    shutil.rmtree(sd_dir)

# End publish_service function