<?php
/**
 * Created by PhpStorm.
 * User: moeller
 * Date: 20.08.14
 * Time: 18:02
 */
//ini_set('display_errors', 1);
//error_reporting(E_ALL);
$Module         = $Params['Module'];
$resultsPerPage = (int)eZINI::instance('scvideo.ini')->variable('Settings', 'ResultsPerPage');

//$Result['content']  = $result;
//$Result['Module']   = $Module;

$Module = $Params['Module'];

$rawUrl = $Params['node_url'];
$url  = str_replace(array("|", "-"), array("/", "_"), $rawUrl);

$node           = eZContentObjectTreeNode::fetchByURLPath($url);
$startId        = (int)$node->attribute('node_id');
$startVideo     = null; // dataMap of the requested video
$startYtId      = null; // youtube-id of the requested video
$parentNodeId   = (int)$node->attribute('parent_node_id');

$filterArray    = array(
    'ClassFilterType'          => 'include',
    'ClassFilterArray'         => array('yt_video')
);

$videos = eZContentObjectTreeNode::subTreeByNodeID($filterArray, $parentNodeId);
$sortedMaps = array(); // use this map at the end
$maps = array(); // array for sorting, keys are the keywords
$maps['noKeyword'] = array(); // unsorted videos

foreach ($videos as $video) {

    $nodeId = (int)$video->attribute('node_id');
    // save all relevant data in an array: $map
    $map = array();
    $map['locationId']  = $nodeId;
    $videoDataMap   = $video->dataMap();

    foreach ($videoDataMap as $key => $attribute) {
        switch ($key) {
            case 'longdesc':
                $map[$key]  = nl2br($attribute->content(), false);
                break;

            case 'keywords':
                $map[$key]  = $attribute->content()->KeywordArray;
                break;

            default:
                $map[$key]  = $attribute->content();
                break;
            }
    }

    if ($nodeId == $startId) {
        $startYtId      = $map['id'];
        $startVideo     = $map;
    } else {
        $keywords = $map['keywords'];

        if (count($keywords) > 0) {
            $key = $keywords[0]; // first keyword is used for sorting

            if (!is_array($maps[$key])) {
                $maps[$key] = array();
            }
            $maps[$key][] = $map;
        } else {
            $maps['noKeyword'][] = $map;
        }
    }
}

// sort the keywordMap alphabetically
foreach ($maps as $keywordMap) {
    ksort($keywordMap, SORT_STRING);
}

$startKeywords  = $startVideo['keywords'];

//$sortedMaps[]   = $startVideo;
if (count($startKeywords) > 0) {
    $starterKey = $startKeywords[0];
    foreach ($maps as $key => $keywordMap) {
        foreach ($keywordMap as $map) {
            if ($key == $starterKey) {
                array_unshift($sortedMaps, $map);
            } else {
                $sortedMaps[] = $map;
            }
        }
    }
}
array_unshift($sortedMaps, $startVideo);
$videoCount = count($sortedMaps);
$data = array(
    'kind'          => 'shortcut#playlistListResponse',
    'etag'          => '',
    'nextPageToken' => '',
    'prefPageToken' => '',
    'pageInfo'      => array(
        'totalResults'      => $videoCount,
        'resultsPerPage'    => $resultsPerPage
    ),
    'dataMaps'      => $sortedMaps,
    'items'         => null,
    'playlistParams'=> array(
        'index' => 1,
        'v'     => $startYtId,
        'list'  => null
    )
);

header('Content-type: application/json');
echo json_encode($data );
eZExecution::cleanExit();

function test($var, $quit = true) {
    echo '<pre>';
    var_dump($var);
    echo '</pre>';
    if ($quit) {
        die();
    }
}
