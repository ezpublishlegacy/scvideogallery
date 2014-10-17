scvideogallery
==============
What is this?
-------------

Version
-------
1.0.1

This is an eZ Publish extension (legacy) for a video gallery. It is tested on 4.7 and 5.3 with legacy fallback.
A symfony pendant will follow.

Features
--------
It is possible to play playlists from eZ repositories and playlists from youtube. The eZ content objects are storing
only metadatas for further functionalities (e.g. a longdescription for screenreader).

Installation
------------

* import yt_video class from the package in the doc-folder in the eZ backend (Setup -> Classes)
* be sure that the permissions for the anonymous role is setted correctly
* activate the extension in the siteaccess.ini.append.php (override oder siteaccess)
* change RewriteRule in vhost-config to enable the fontawesome (do not include it twice)
  RewriteRule ^/extension/[^/]+/design/[^/]+/(stylesheets|flash|fonts|images|lib|javascripts?)/.* - [L]
  (legacy VHost-Config)
* insert external youtube api in the head
    <script src="https://www.youtube.com/iframe_api"></script>
* if there is a library already enabled in your project comment it out in design.ini
* be sure, that *jQuery is loaded before the sc-video-gallery.js*
* create a project on [google developer console](https://console.developers.google.com/project) for the gallery,
configure the project and add the generated key in settings/scvideo.ini or an override file in another extension.
* bootstrap the jQuery plugin in an appropriate js-file:
    $(function(){
        $('.sc-video-starter').scVideoGallery(options);
    })
  Note: options is a native javascript object. Here it is possible to override each entry of the defaults-object
  (e.g. moduleUrl, translations, ...).
* clear cache

How to use
----------

To reference a video gallery insert an anchor element in the administration interface. Choose the class sc-video-starter
from the dropdown. In case of youtube gallery insert the raw link as https, for instance:
>https://www.youtube.com/watch?v=videoId&index=3&list=playlistId

Notice the following pattern in the url:
* /watch
* GET parameter: v, index, list

To insert a gallery from a local yt_video-content-object simply reference this object from the editorial interface. The
video list is built from the video objects in folder the referenced object is situated.

Best way is to include the extension as a git-submodule. Feel free to contact me.


