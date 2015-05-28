<?php

$turbidity=$_GET['turbidity'];
$solar_elevation=$_GET['solar_elevation'];
$albedo=$_GET['albedo'];

$callExp1="dome_points.exe " . $turbidity . " " . $solar_elevation;
$callExp2=$albedo;
$callExp=$callExp1 . " " . $callExp2;

exec($callExp, $res);

$len = count($res);
for($x = 0; $x < $len; $x++) {
    echo $res[$x];
}

?>