<?php

// This file runs when we're in localhost
if($_SERVER['REMOTE_ADDR'] == '::1')
{
	exec('clang --target=wasm32 -Os -flto -nostdlib -std=c99 -Wl,--no-entry -Wl,--export-all -fno-builtin -o script.wasm script.c 2>&1',$message);
}

?>

<!DOCTYPE HTML>
<html>
<head>
	<title>ANALOG</title>
	<link rel="stylesheet" type="text/css" href="styles.css?t=<?php echo filemtime('styles.css'); ?>">
	
	<meta name="description" content="Fail to be perfect."><!-- 155-160 char max -->
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	
	<!-- Get favicons -->
	<link id="dynamic-favicon" rel="icon" type="image/png">
</head>
<body>
	<canvas id="canvas" height="100" width="100"></canvas>
	
	<p id="measure">
		<strong>IMPERFECTION RATING</strong>
		<br>000.00
		<br><strong>MIN SCORE</strong>
		<br>Will calculate once trail is longer...
	</p>
	
	<div id="button-holder">
		<div id="button"><div id="button-coloration"></div></div>
		<div id="column"><div id="column-coloration"></div></div>
		<div id="button-holder-coloration"></div>
	</div>
	
	<button id="menu-button">Menu</button>
	
	<div id="menu-container">
		<div id="menu" style="display:none;">
			<img id="logo" src="assets/logo-tagline.png">
		
			<h2>Settings</h2>
			<h3>Analog Stick Color</h3>
			<input id="r" type="range" min="0" max="255" step="1" value="255">
			<input id="g" type="range" min="0" max="255" step="1" value="255">
			<input id="b" type="range" min="0" max="255" step="1" value="255">
			
			<h3>Analog Stick Graphic</h3>
			<input type="text" id="image-top" placeholder="Empty for default, or image link">
			
			<h3>Developer Commentary Volume</h3>
			<p>More commentary unlocks with a lower Min Score.</p>
			<p><input id="commentary" type="range" min="0" max="1" step=".1" value="0"></p>
			
			<hr>
			
			<h2>Credits</h2>
			<h3>Creator/Coder/Story</h3>
			<p><a target="_blank" href="https://joshpowlison.com/">Josh Powlison</a></p>
			
			<h3>Producers</h3>
			<p>Shirra, Orange, AkiAndPeach, Cowmash, No response, Jnoodle Games</p>
			
			<h3>Co-Producers</h3>
			<p>JL, JN, MC, DH, RS, ????, CB</p>
			
			<h3>Analog Stick Artist</h3>
			<p><a href="https://instagram.com/pip400art" target="_blank">Rachael Allen</a></p>
			
			<hr>
			
			<p><a target="_blank" href="https://www.kickstarter.com/projects/joshuapowlison/analog-a-heartfelt-metaphor-about-living-with-yourself">Funded with Kickstarter</a> | <a target="_blank" href="https://joshpowlison.com/">My Website</a><br><a target="_blank" href="https://thebutton.life/">Play the Prequel, BUTTON</a></p>
			
			<button id="menu-close-button">Close Menu</button>
		</div>
	</div>
	
	<script src="script.js?t=<?php echo filemtime('script.js'); ?>"></script>
	<script>console.log(<?php echo json_encode($message); ?>);</script>
</body>
</html>