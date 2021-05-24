<?php

// This file runs when we're in localhost
if($_SERVER['REMOTE_ADDR'] == '::1'){

	exec('clang --target=wasm32 -Os -flto -nostdlib -std=c99 -Wl,--no-entry -Wl,--export-all -fno-builtin -o script.wasm script.c 2>&1',$message);
}

?>

<!DOCTYPE HTML>
<html>
<head>
	<title>ANALOG</title>
	<link rel="stylesheet" type="text/css" href="styles.css">
	
	<meta name="description" content="Fail to be perfect."><!-- 155-160 char max -->
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	
	<!-- Get favicons -->
	<link id="dynamic-favicon" rel="icon" type="image/png">
</head>
<body>
	<canvas id="canvas" height="100" width="100"></canvas>
	
	<p id="measure">0</p>
	
	<div id="button-holder">
		<div id="button"></div>
		<div id="column"></div>
	</div>
	
	<button id="menu-button">Menu</button>
	
	<div id="menu-container">
		<div id="menu" style="display:none;">
			<input id="r" type="range" min="0" max="255" step="1" value="200">
			<input id="g" type="range" min="0" max="255" step="1" value="200">
			<input id="b" type="range" min="0" max="255" step="1" value="200">
			
			<p>Commentary Volume <input id="commentary" type="range" min="0" max="1" step=".1" value="0"></p>
			
			<p>Creator: Josh Powlison</p>
			<p>Co-Producers: None yet!</p>
			
			<p><a target="_blank" href="https://www.kickstarter.com/projects/joshuapowlison/analog-a-heartfelt-metaphor-about-living-with-yourself">Funded with Kickstarter</a></p>
			<p><a target="_blank" href="https://joshpowlison.com/">My Website</a></p>
			
			<p><em>V 1.0.0 i guess</em></p>
			<button id="menu-close-button">Close Menu</button>
		</div>
	</div>
	
	<script>
	// Commentary files
		const COMMENTARY		= [<?php
			// Read all of the commentary file names from the folder; add them into here
			
			$files = scandir('commentary');
			
			for($i = 0, $l = count($files); $i < $l; $i ++){
				if(intval($files[$i]) === 0) continue;
				
				echo intval($files[$i]);
				
				// Exit out so we don't echo a comma
				if(intval($files[$i]) !== 999999999) echo ',';
			}
		?>];
	</script>
	<script src="script.js?t=<?php echo filemtime('script.js'); ?>"></script>
	<script>console.log(<?php echo json_encode($message); ?>);</script>
</body>
</html>