<?php
/**
 *
 * User: Frank Möller
 * Date: 03.10.14
 * Time: 16:58
 */
//$Module         = $Params['Module'];
echo eZINI::instance('scvideo.ini')->variable('Settings', 'ApiKey');
eZExecution::cleanExit();
