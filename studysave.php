<?php
	$result_string = $_POST['postresult_string'];
	$name = $_POST['fname'];
	file_put_contents($name, $result_string, FILE_APPEND); //appends to file a string of data it gets from JS
?>
