<?php
$Module = array('name' => 'scvg');
$ViewList = array();
$ViewList['playlist'] = array(
    'script'            => 'list.php',
    'functions'         => 'playlist',
    'params'            => array('node_url')
);
$ViewList['apikey'] = array(
    'script'            => 'apikey.php',
    'functions'         => 'apikey'
);
