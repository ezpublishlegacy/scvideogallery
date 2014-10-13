// requirements: starter must be an anchor element
var SC = {
    'player'        : null,     // the youtube player object
    'apiIsLoaded'   : false,    // loaded flag
    'playerStatus'  : null,     // the status of the YTPlayer, is used for toggeling the long description
    'debug'         : false,     // currently unused
    'specialStatus' : null,     // used for coordination toggeling desc and longdesc
    'log'           : function(msg){
        if (SC.debug && window.console) {
            console.log('SC-Debug: ' + msg);
        }
    }
    // todo make the layer available globally, because there's only one layer
};

(function($) {
    // configuration part
    // the defaults-object can be overridden by jquery constructor
    var defaults = {
        'moduleUrl'         : '/scvg/playlist/',
        'layerId'           : 'sc-layer',
        'eventPrefix'       : 'scvg',
        // todo test enableLayerClose
        'enableLayerClose'  : 0, // enable closing of the player with a click on the layer
        'videoContainer'    : 'sc-video-container',
        'animate'           : {
            'close' : false
        },
        'ytPlayerVars'      : {
            'autoplay'          : 1,
            'version'           : 3,
            'enablejsapi'       : 1,
            'fs'                : 1, // enable fullscreen
            'hl'                : 'de', // language
            'modestbranding'    : 1, // prevent big logo
            'rel'               : 0, // show related videos
            'showinfo'          : 0, // show a panel with video infos at the beginning of the video
            'cc_load_policy'    : 1,
            'autohide'          : 1,
            'html5'             : 1,
            'origin'            : window.location.origin
        },
        translations : {
            de : {
                'short-description' : 'Kurzbeschreibung des Videos',
                'close-gallery'     : 'Videogalerie schließen',
                'long-description'  : 'Textfassung des Videos'
            }
        },
        lang : 'de'
    };
    var ytApiUrl = 'https://www.googleapis.com/youtube/v3/';
    var ytApi   = {
        'part'          : 'snippet',
        'maxResults'    : 15
    };
    var playlistParams    = {};
    var domElements = {
        'navDescIcon'       : 'i.fa-info-circle',
        'navLongDesc'       : 'fa-bars', // long desciption buttton, when video is displayed
        'navLongDescGeneral': 'i.long-desc', // the long description button regardless the icon
        'navVideo'          : 'fa-file-video-o', // long desciption buttton, when text is displayed
        'navCloseIcon'      : 'i.fa-times',
        'topNavigation'     : '.sc-operating-panel',
        'longDescription'   : 'sc-long-desc', // the target container for displaying the long description
        'navPanel'          : '#sc-navigation', // the video navigation on the right site
        'descContainer'     : '#sc-description' // layer for short description
    };
    var animEndEventNames = {
        'WebkitAnimation'   : 'webkitAnimationEnd',
        'OAnimation'        : 'oAnimationEnd',
        'msAnimation'       : 'MSAnimationEnd',
        'animation'         : 'animationend'
    }

    // method part
    var methods = {
        // this is the triggering jquery object
        process : function(url) {
            var ytParams    = null, // from url, if it's an anchor to a youtube playlist
                targetUrl   = null, // used for fetching playlist data
                appendix    = null; // parameter appendix for targetUrl

            // check, if it's a youtube playlist
            ytParams  = methods.detectYoutubePlaylist(url);

            if (ytParams) {
                playlistParams  = ytParams;
                targetUrl   = ytApiUrl + 'playlistItems?';
                // aggregate youtube parameters
                var params  = $.extend({}, ytApi, { 'playlistId' : ytParams.list});
                appendix    = [];
                for ( i in params) {
                    appendix.push(i + '=' + params[i]);
                };
                appendix    = appendix.join('&')
            } else {
                // if not -> prepare a local url, format eZ url path
                var start   = url.indexOf(location.hostname) + location.hostname.length + 1;
                targetUrl     = defaults.moduleUrl;
                appendix    = url   .slice(start)
                                    .replace(/\//g, '|');
                appendix    = encodeURIComponent(appendix);
            }
            targetUrl += appendix;
            // $navbar = $(domElements.navPanel); // create an empty nav panel

            $.get(
                targetUrl,
                function(data){
                    data    = ($.type(data) === 'string') ? $.parseJSON(data) : data;
                    // if local list -> fetch other data from youtube
                    if (data.kind == 'shortcut#playlistListResponse') {

                        playlistParams = data.playlistParams;
                        var ids         = [],
                            videoUrl    = ytApiUrl + 'videos?',
                            appendix    = [];
                        // gather ytids for the call
                        for (var i = 0; i < data.pageInfo.totalResults; i++) {
                            ids.push(data.dataMaps[i].id);
                        }
                        for (key in ytApi) {
                            appendix.push(key + '=' + ytApi[key]);
                        }
                        appendix.push('id=' + ids.join(','));
                        videoUrl += appendix.join('&');
                        $.get(videoUrl, function(videoData){
                            data.items = videoData.items;
                            methods.insertVideoDetails(data);
                        })
                    } else {
                        methods.insertVideoDetails(data);
                    }
                }
            );

        },

        // items is the data.items.object from eZ or youtube
        insertVideoDetails : function(data) {
            var $layer          = $(methods.createLayout()),
                $navbar         = $('#sc-navigation', $layer),
                totalResults    = data.pageInfo.totalResults,
                startIndex      = -1,
                startMap        = null;

            // prepare layer actions
            if (defaults.enableLayerClose === 1) {
                $layer.on('click.' + defaults.eventPrefix, methods.end);
            }

            $(window).on('resize.' + defaults.eventPrefix, function(){
                methods.resize.apply($layer);
            });
            // create videos as sidebar entry
            for( var i = 0; i < totalResults; i++) {
                var item        = data.items[i],
                    $img        = $('<img />', { 'src' : item.snippet.thumbnails.default.url}),
                    $title      = $('<h4 />').text(item.snippet.title),
                    $desc       = null,
                    $navAnchor  = null,
                    $navItem    = null,
                    ytid        = null,
                    $longdesc   = '';

                var classes = ['sc-nav-item', 'clearfix'];
                // find the id of the single video in different places
                if (data.kind == "shortcut#playlistListResponse") {
                    ytid        = item.id;
                    var text    =data.dataMaps[i]['longdesc'];
                    if (text) {
                        $longdesc   = $('<div />', { 'class' : 'template long-desc'}).text(text);
                    }
                } else {
                    ytid    = item.snippet.resourceId.videoId;
                }

                if (ytid == playlistParams.v) {
                    classes.push('active');
                    startIndex  = i;
                }
                var $navItem    = $('<div />', {
                            'class'     : classes.join(' '),
                            'data-ytid' : ytid
                        })  .append('<a href="#" ></a>')
                            .append($longdesc)
                            .appendTo($navbar);

                $navAnchor  = $navItem.children('a');
                //
                if (item.snippet.description) {
                    $desc       = $('<p />', { 'class' : 'description' }).text(item.snippet.description);
                    if (i == 0) {
                        $(domElements.navDescIcon, domElements.topNavigation).removeClass('hidden');
                        $desc.clone().appendTo(domElements.descContainer);
                    }
                }
                $navAnchor.append($img, $('<div />').append($title, $desc));
            }
            $('body')   .addClass('sc-no-overflow')
                        .append($layer);
            methods.resize.apply($('#' + defaults.layerId));

            // todo : prepare data for first video
            methods.loadFirstVideo(startIndex);

            $($navbar)  .perfectScrollbar({ 'suppressScrollX' : true });
            $('#' + domElements.longDescription).perfectScrollbar({ 'suppressScrollX' : true });
        },

        // this points to the clicked .sc-nav-item
        loadVideo : function() {
            var $opPanel    = $(domElements.topNavigation),
                $ld         = this.find('.long-desc'),
                $desc       = this.find('p.description');


            // start video
            SC.player.loadVideoById(this.data('ytid'));
            // mark .sc-nav-item as active
            this    .siblings()
                    .removeClass('active')
                    .end()
                    .addClass('active');

            // change long description
            methods.insertLongDesc.apply($ld, [$opPanel]);

            // change small description
            methods.insertDescription.apply($desc, [$opPanel]);
        },

        loadFirstVideo : function(startIndex) {
            var $opPanel        = $(domElements.topNavigation),
                $descButton     = $(domElements.navDescIcon, $opPanel),
                $startNavItem   = $(domElements.navPanel)   .children('.sc-nav-item')
                                                            .eq(startIndex),
                $longDesc       = $startNavItem.find('.long-desc'),
                $desc           = $startNavItem.find('.description');

            // register different event handler
            // close handler
            $(domElements.navCloseIcon ,$opPanel).on('click.' + defaults.eventPrefix, methods.end);

            // register longdescription
            $(domElements.navLongDescGeneral, $opPanel).on('click.' + defaults.eventPrefix, function(){
                methods.toggleLongDescription.apply($(this));
            });

            methods.insertLongDesc.apply( $longDesc, [$opPanel]);

            // register description
            if ($desc.length > 0) {
                //$descButton.removeClass('hidden');
                methods.insertDescription.apply($desc);
            }
            // event handler for the short description
            $descButton.on('click.' + defaults.eventPrefix, methods.toggleDesc);

            // catch video links from the nav bar
            $('.sc-nav-item').on('click.' + defaults.eventPrefix, function(){
                methods.loadVideo.apply($(this));
                return false;
            });

            SC.player = new YT.Player('sc-player', {
                'videoId'       : playlistParams.v,
                'playerVars'    : defaults.ytPlayerVars,
                'events'        : {
                    'onReady'       : methods.events.onReady,
                    'onStateChange' : methods.events.onStateChange,
                    'onError'       : methods.events.onError
                }
            });

        },

        // this points to the longdesc source
        insertLongDesc : function($opPanel) {
            $opPanel            = ($opPanel) ? $opPanel : $(domElements.topNavigation);
            var $ld             = this,
                $longdescCont   = $('#' + domElements.longDescription);
            $longdescCont.empty();
            if ($ld.length > 0) {
                methods.toggleLongDescription.apply($(domElements.navLongDescGeneral, $opPanel), ['video', false]);
                $ld .first()
                    .clone()
                    .removeClass('template')
                    .appendTo($longdescCont);
            } else {
                methods.toggleLongDescription.apply($(domElements.navLongDescGeneral, $opPanel), ['disable']);
            }
        },

        // this points to the description source
        insertDescription : function($opPanel) {
            $opPanel = ($opPanel) ? $opPanel : $(domElements.topNavigation);
            var $descCont   = $(domElements.descContainer),
                $desc       = this;

            $descCont.empty();
            if ($desc.length > 0) {
                $(domElements.navDescIcon, $opPanel).removeClass('hidden');
                $desc   .clone()
                        .appendTo($descCont);
            } else {
                $(domElements.navDescIcon, $opPanel).addClass('hidden');
            }
        },

        toggleDesc : function() {
            var $navItem    = $(domElements.navDescIcon, domElements.topNavigation);
            switch(SC.specialStatus) {
                case null:
                    SC.specialStatus = 'desc';
                    break;
                case 'desc':
                    SC.specialStatus = null;
                    break;
                case 'ld':
                    methods.toggleLongDescription.apply($(), ['video', true]);
                    SC.specialStatus = 'desc';
                    break;
            }
            $navItem.toggleClass('active');
            $(domElements.descContainer).toggle('fast');

        },

        // this is the long-desc-switch (jquery-object)
        // possible values for status: toggle, video, ld, disable
        // the toggle parameter indicates the toggeling of the containers, only the navigation button otherwise
        toggleLongDescription : function(status, toggle) {
//          todo: refactor, to complex
            $this = this;
            if ($this.length == 0) {
                $this = $(domElements.navLongDescGeneral);
            }
            if (!status || status == 'toggle') {
                status = ($this.hasClass(domElements.navLongDesc)) ? 'ld' : 'video';
            }
            toggle = (toggle != undefined) ? toggle : true;

            switch ( status) {
                case 'disable':
                    $this.addClass('hidden');
                    toggle = false;
                    break;
                case 'ld':
                    if (SC.specialStatus == 'desc') {
                        methods.toggleDesc();
                    }
                    $this   .removeClass('hidden ' + domElements.navLongDesc)
                            .addClass(domElements.navVideo + ' active');
                    SC.specialStatus = 'ld';
                    if (SC.playerStatus == 1 || SC.playerStatus == 3) {
                        SC.player.pauseVideo();
                    }
                    break;
                case 'video':
                    $this.removeClass('hidden active ' + domElements.navVideo)
                        .addClass(domElements.navLongDesc);
                    SC.specialStatus = null;
                    if (SC.playerStatus == 2) {
                        SC.player.playVideo();
                    }
                    break;
                default:
                    throw 'not a valid status in toggleLongDesc()';
            }

            if (toggle) {
                 $('#' + domElements.longDescription)   .slideToggle(400)
                                                        .perfectScrollbar('update');
            }
        },

        //this is the jquery layer object
        resize : function() {
            var $container  = $('.' + defaults.videoContainer),
                $iframe     = this.find('iframe'),
                y           = ($(window).height() - $container.height()) / 2;

            // set the layer to the correct vertical position
            this.offset({ "top" : window.scrollY });
            //if (!$container.hasClass('hidden')) {
                $container.css('marginTop', y);
            //}
            // set the width of navbar (if iframe is loaded)
            if ($iframe.length > 0) {
                var iw  = $iframe.first().width(),
                    w   = $container.width() - iw;
                $(domElements.navPanel).width(w);
                $(domElements.descContainer).css('maxWidth', iw);
            }
        },

        end : function() {
            if (defaults.animate.close && Modernizr.cssanimations) {
                SC.player.pauseVideo(); // pauseVideo();
                $('.' + defaults.videoContainer).addClass('animate-out');
                // methods.remove() is called from the animateOut-event-handler
            } else {
                methods.remove();
            }
        },

        remove : function(){
            SC.specialStatus = null;
            $('#' + defaults.layerId).remove();
            $('body').removeClass('sc-no-overflow');
        },


        detectYoutubePlaylist : function(href) {
            if (href.indexOf('https://www.youtube.com') > -1){
                var params  = {};
                href    = href  .split('?') // separate parameter
                                .pop() // take the parameter
                                .split('&'); // split
                for (var i = 0; i < href.length; i++) {
                    var elem = href[i].split('=');
                    params[elem[0]] = elem[1];
                }
                // check the imported params
                if ("v" in params && 'list' in params) {
                    return params;
                }
            }
            return null;
        },

        // is used when default.strictYoutube == true
        createLayout : function() {
            return '<div id="' + defaults.layerId + '">' +
                        '<div class="' + defaults.videoContainer + ' hidden" >' +
                            '<div class="sc-operating-panel">' +
                                '<i title="' + methods.trans('short-description') + '" class="fa fa-info-circle fa-2x fa-fw hidden"></i>' +
                                '<i title="' + methods.trans('long-description') + '" class="fa fa-bars fa-2x fa-fw long-desc hidden"></i>' +
                                '<i title="' + methods.trans('close-gallery') + '" class="fa fa-times fa-2x fa-fw"></i>' +

                            '</div>' +
                            '<div class="sc-ratio-wrapper">' +
                                '<div id="sc-navigation" ></div><div id="sc-description"></div><div id="sc-player"></div>' +
                            '</div>' +
                            '<div id="' + domElements.longDescription + '"></div>' +
                        '</div>' +
                    '</div';
        },

        trans : function(key) {
            if (undefined !== defaults.translations[defaults.lang][key]) {
                return defaults.translations[defaults.lang][key];
            }
            return null;
        },

        events : {
            onReady : function(e){
                var $layer  = $('#' + defaults.layerId);
                if (defaults.animate.close) {
                    $('.' + defaults.videoContainer).on(animEndEventNames[Modernizr.prefixed('animation')], methods.remove);
                }

                $('.' + defaults.videoContainer).removeClass('hidden');
                $layer.addClass('simple');
                methods.resize.apply($layer);
            },

            onStateChange : function(e) {
                SC.playerStatus = e.data;
                SC.log('statechange to ' + e.data);
            },

            onError : function (e) {
                SC.log(e.data);
            }
        }
    }

    $.fn.scVideoGallery = function(options) {
        // the default-object will be overridden
        $.extend( defaults, options );
        if (this.length > 0) {
            $.get(
                '/scvg/apikey',
                function(apiKey) {
                    ytApi.key = apiKey;
            });
        }
        return this.each(function(){
            var $this   = $(this);
            $this.on('click.' + defaults.eventPrefix, {'url' : $this.prop('href')}, function(e){
                e.preventDefault();
                e.stopPropagation();
                methods.process.apply($this, [e.data.url]);
                return false;
            });
        });
    };
})(jQuery)

// fallback function after loading the player api
function onYouTubeIframeAPIReady() {
    SC.apiIsLoaded = true;
}
