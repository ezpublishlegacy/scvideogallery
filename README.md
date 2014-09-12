scvideogallery
==============
What is this
------------

This is an eZ Publish extension (legacy) for a video gallery. It is tested on 4.7 and in 5.3 with legacy fallback.
A symfony pendand will follow.

Features
--------
It is possible to play playlists from eZ repositories and playlists from youtube. The eZ content objects are storing
only metadatas for further functionalities (e.g. a longdescription for screenreader).

Installation
------------

* import yt_video class from doc folder in the eZ backend (Setup -> Classes)
* be sure that the permissions for the anonymous role is setted correctly
* activate the extension in the siteaccess.ini.append.php (override oder siteaccess)
* change RewriteRule in vhost-config to enable the fontawesome (do not include it twice)
  RewriteRule ^/extension/[^/]+/design/[^/]+/(stylesheets|flash|fonts|images|lib|javascripts?)/.* - [L]
  (legacy VHost-Config)
* insert external youtube api in the head
        <script src="https://www.youtube.com/iframe_api"></script>
* be sure, that jQuery is loaded before the sc-video-gallery.js
* create a project on [google developer console](https://console.developers.google.com/project) for the gallery,
configure the project and add the generated key in scvideogallery/design/standard/javascript/sc-video-gallery.js
for the ytApi.key (line 54)




