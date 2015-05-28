var turbidity;
var demoId;
var intervalIdFunction;
var solar_elevation;

function getMaxOfArray(numArray) {
  return Math.max.apply(null, numArray);
}

function checkIfDemoPlaying(selection) {
	var val = selection.value;
	var prev_val = document.getElementById("selectId").innerHTML;
	
	// check if a demo is already playing!
	var demoIsPlaying = parseInt(document.getElementById("playingDemo").innerHTML);
	if (demoIsPlaying) {
		alert('Do not change this value when demoing...');
		var opts = selection.options;
		for(var opt, j = 0; opt = opts[j]; j++) {
			if(opt.value == prev_val) {
				selection.selectedIndex = j;
				break;
			}
		}
    } else { // change the value of selectId
		document.getElementById("selectId").innerHTML = val;
	}
}

function stopDemo() {
	// check if a demo is already playing!
	var demoIsPlaying = parseInt(document.getElementById("playingDemo").innerHTML);
	if (demoIsPlaying) {
		var cur_demoId = document.getElementById("demoId").innerHTML;
		clearInterval(cur_demoId);
		document.getElementById("playingDemo").innerHTML = 0;
		document.getElementById("solarElevationForDemo").innerHTML = 1.0;
	} else {
		alert("No Demo is playing! :)");
	}
}

function playDemo() {
	// check if a demo is already playing!
	var demoIsPlaying = parseInt(document.getElementById("playingDemo").innerHTML);
	if (demoIsPlaying) {
		alert("Demo is playing! wait for it to finish or stop it!");
		return 0;
	} else { // demo will now begin playing!
		document.getElementById("playingDemo").innerHTML = 1;
	}
	
	var xmlHttp = createXmlHttpRequestObject();
	if (xmlHttp) {
		
		// we don't need solar elevation for the demo
		turbidity = document.getElementById("turbidity").value;
		var albedo = document.getElementById("albedo").value;
		
		// check them
		var tur_pos = turbidity.search(/^\d+\.?\d*$/); //{digits}(.{digits})
		var al_pos = albedo.search(/^\d+\.?\d*$/);
		
		if ((tur_pos != 0) || (al_pos != 0)) {
			alert('Please fill in the Turbidity and Albedo Value boxes with double numbers or integers!');
			return 0;
		}
		if ((turbidity < 1) || (turbidity > 10)) {
			alert('Tubidity values: [1-10]');
			return 0;
		}
		if ((albedo < 0) || (albedo > 1)) {
			alert('Ground albedo values: [0-1]');
			return 0;
		}
		
		// a tricky way to do the demo!
		demoId = setInterval( function() { playDemoFunction(turbidity,albedo) }, 1000);
		document.getElementById("demoId").innerHTML = demoId;
	}
}

function playDemoFunction(turbidity,albedo) {
	// take the solarElevation
	solar_elevation = document.getElementById("solarElevationForDemo").innerHTML;
	
	// prepare the AJAX request
	var data = 'turbidity=' + escape(turbidity) + '&solar_elevation=' + escape(solar_elevation) + '&albedo=' + escape(albedo);
	var url = 'dome.php' + '?' + data;
	console.log(url);
	solar_elevation = parseFloat(solar_elevation) + 0.5;
	//solar_elevation++;
	document.getElementById("solarElevationForDemo").innerHTML = solar_elevation;
	
	// make the AJAX request
	try {
		xmlHttp.open("GET", url, true);
		xmlHttp.onreadystatechange = handleRequestStateChange;
		xmlHttp.send(null);
	} catch (e) {
		alert("Can't connect to server:\n" + e.toString());
	}
	
	if (parseInt(solar_elevation) >= 90) {
		clearInterval(demoId);
		document.getElementById("playingDemo").innerHTML = 0;
		document.getElementById("solarElevationForDemo").innerHTML = 1.0;
	}
}


function requestSceneRendering() {
	var xmlHttp = createXmlHttpRequestObject();
	if (xmlHttp) {
		
		// first check if demo is playing
		var demoIsPlaying = parseInt(document.getElementById("playingDemo").innerHTML);
		
		if (demoIsPlaying) {
			alert("Demo is playing! wait for it to finish or stop it!");
			return 0;
		}
		
		// take the values from the fields 
		turbidity = document.getElementById("turbidity").value;
		solar_elevation = document.getElementById("solar_elevation").value;
		var albedo = document.getElementById("albedo").value;
		
		// check them
		var tur_pos = turbidity.search(/^\d+\.?\d*$/); //{digits}(.{digits})
		var sol_pos = solar_elevation.search(/^\d+\.?\d*$/);
		var al_pos = albedo.search(/^\d+\.?\d*$/);
		
		if ((tur_pos != 0) || (sol_pos != 0) || (al_pos != 0)) {
			alert('Please fill in all the boxes with double numbers or integers!');
			return 0;
		}
		if ((turbidity < 1) || (turbidity > 10)) {
			alert('Tubidity values: [1-10]');
			return 0;
		}
		if ((solar_elevation <= 0) || (solar_elevation > 90)) {
			alert('Solar elevation values: (0-90]');
			return 0;
		}
		if ((albedo < 0) || (albedo > 1)) {
			alert('Ground albedo values: [0-1]');
			return 0;
		}
		
		// prepare the AJAX request
		var data = 'turbidity=' + escape(turbidity) + '&solar_elevation=' + escape(solar_elevation) + '&albedo=' + escape(albedo);
		var url = 'dome.php' + '?' + data;
		console.log(url);
		// make the AJAX request
		try {
			xmlHttp.open("GET", url, true);
			xmlHttp.onreadystatechange = handleRequestStateChange;
			xmlHttp.send(null);
		} catch (e) {
			alert("Can't connect to server:\n" + e.toString());
		}
	}
}

function handleRequestStateChange(){
	if (xmlHttp.readyState == 4){
		if (xmlHttp.status == 200){
			try {
				// read the message from the server and start the rendering process
				result = xmlHttp.responseText;
				drawDomeOnCanvas(result);
			} catch(e) {
				alert("Error reading the response: " + e.toString());
			}
		}
		else {
			alert("There was a problem retrieving the data:\n" + xmlHttp.statusText);
		}
	}
}

function createXmlHttpRequestObject(){	
	try {
	// try to create XMLHttpRequest object
	xmlHttp = new XMLHttpRequest();
	} catch(e) {
		try { 
			// try to create XMLHttpRequest object
			xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
		} catch (e) {}
	}
	// return the created object or display an error message
	if (!xmlHttp) alert("Error creating the XMLHttpRequest object.");
	else return xmlHttp;
}

function drawDomeOnCanvas(result){
	
	// Analyze the result from the server
	var res = result.split(',');
	//console.log(res);
	var dome_points_length = parseInt(res[0]);
	var indices_length = parseInt(res[2*dome_points_length + 1]);
	var lights_length = parseInt(res[(2*dome_points_length+1) + (indices_length+1)]);
	//console.log(dome_points_length);
	//console.log(indices_length);
	//console.log(lights_length);
	
	var dome_points		 = new Float32Array(dome_points_length);
	var colors_points	 = new Float32Array(dome_points_length);
	var triangle_indices = new Uint16Array(indices_length);
	var lights_points	 = new Float32Array(lights_length);
	var lights_colors	 = new Float32Array(lights_length);
	var sun_position	 = new Float32Array(3);
	var sun_color		 = new Float32Array(3);
	
	var res_index = 0;
	// get the vertices (coordinates (x,y,z) of the dome points)
	for (var i = 1; i <= dome_points_length; i++) {
		res_index++;
		dome_points[i-1] = parseFloat(res[res_index]);
	}
	//console.log(dome_points);
	
	// get the colors of the dome points (R,G,B) values for each dome point
	for (var j = 0; j < dome_points_length; j++) {
		res_index++;
		colors_points[j] = parseFloat(res[res_index]);
	}
	//console.log(colors_points);
	
	// the below is needed to get the start index of the triangle indices correctly
	res_index++;
	// get the triangle faces/indices
	for (var k = 0; k < indices_length; k++) {
		res_index++;
		triangle_indices[k] = parseFloat(res[res_index]);
	}
	//console.log(triangle_indices);
	
	// get the light sources (x,y,z) coordinates and their respective RGB colors
	res_index++;
	for (var i = 0; i < lights_length; i++) {
		res_index++;
		lights_points[i] = parseFloat(res[res_index]);
	}
	
	for (var j = 0; j < lights_length; j++) {
		res_index++;
		lights_colors[j] = parseFloat(res[res_index]);
	}
	//console.log(lights_colors);
	
	// sun position and color
	for (var j = 0; j < 3; j++) {
		res_index++;
		sun_position[j] = parseFloat(res[res_index]);
	}
	for (var j = 0; j < 3; j++) {
		res_index++;
		sun_color[j] = parseFloat(res[res_index]);
	}
	console.log(sun_color);
	
	// color mapping/toning for the Sky Dome (make the results more bright if you want)
	var maxim_dome = getMaxOfArray(colors_points);
	for (var i = 0; i < dome_points_length; i++) {
		colors_points[i] = colors_points[i] / maxim_dome;
	}
	//console.log(maxim_dome);
	
	// color mapping/toning for the Sun Light
	var sun_maxim = getMaxOfArray(sun_color);
	if (sun_maxim <= 0.001) { 
	// for some situations (usually high turbidities (>7) and solar elevation < 2 degrees) we just give
	// a static color to the Sun because the model returns nasty values (very small or even zero, negative, ...)
		sun_color[0] = 0.95;
		sun_color[1] = 0.2;
		sun_color[2] = 0.1;
	} else {
		for (var i = 0; i < 3; i++) {
			if (solar_elevation < 2.0) {
				sun_color[i] = sun_color[i] / (sun_maxim + 0.0005);
			} else {
				sun_color[i] = sun_color[i] / sun_maxim;
			}
		}
	}
	console.log(sun_color);
	
	// cancel the animate function that is running right now :)
	var cur_requestID = document.getElementById("animeId").innerHTML;
	var cur_intervalID = document.getElementById("intervalId").innerHTML;
	if (cur_requestID != 0) {
		console.log('Cancelling the animation frame with id: ' + cur_requestID);
		cancelAnimationFrame(cur_requestID);
		console.log('Cancelling setInterval function with id: ' + cur_intervalID);
		clearInterval(cur_intervalID);
    }
	
	// initialise renderer on Canvas element
	var CANVAS=document.getElementById("DomeCanvas");
	var RENDERER=new THREE.WebGLRenderer({
		antialias  : true,
		canvas : CANVAS
	});
	RENDERER.shadowMapEnabled = false;
	//RENDERER.shadowMapType = THREE.PCFShadowMap;
	
	//create the scene
	var SCENE = new THREE.Scene();
	
	//create the camera
	var CAMERA = new THREE.PerspectiveCamera(65, CANVAS.width / CANVAS.height, 1, 2000);
	//var posX=0, posZ=30;
	var posX, posZ;
	posX = parseFloat(document.getElementById("posX").innerHTML); 
	posZ = parseFloat(document.getElementById("posZ").innerHTML);
	
	CAMERA.position.set(posX, 5, posZ);
	SCENE.add(CAMERA);
	
	// Camera movement with mouse and keyboard
	
	var speedX=0, speedZ=0; //camera speed
	window.onkeydown=function(event){
		keyUpDown(event.keyCode, 0.1);
	};
	window.onkeyup=function(event){
		keyUpDown(event.keyCode, 0);
	};
	
	var keyUpDown=function(keycode, sensibility) {
		// note that the "arrow" keys make you faster to move!
		switch(keycode) {
		case 37: //left arrow
			speedX=-10*sensibility;
			break;
		case 65: //A 
			speedX=-5*sensibility;
			break;
		case 39: //right arrow
			speedX=10*sensibility;
			break;
		case 68: //D
			speedX=5*sensibility;
			break;
		case 38: //up arrow
			speedZ=-10*sensibility;
			break;
		case 87: //W
			speedZ=-5*sensibility;
			break;
		case 79: //O
			speedZ=-50*sensibility;
			break;
		case 40: //down arrow
			speedZ=10*sensibility;
			break;
		case 83://S
			speedZ=5*sensibility;
			break;
		case 75: //K
			speedZ=50*sensibility;
			break;
		} //end switch keycode
	};

	var drag, oldX, oldY, dX=0, dY=0, rotX, rotY;
	rotX = parseFloat(document.getElementById("rotX").innerHTML); 
	rotY = parseFloat(document.getElementById("rotY").innerHTML);
	
	
	window.onmousedown=function(event) {
		drag=1;
		document.getElementById("drag").innerHTML = 1;
		oldX=event.clientX;
		oldY=event.clientY;
	};

	window.onmouseup=function() {
		drag=0;
		document.getElementById("drag").innerHTML = 0;
	};
	
	window.onmousemove=function(event) {
		drag = parseInt(document.getElementById("drag").innerHTML);
		if (!drag) return false;
		dX=event.clientX-oldX;
		dY=event.clientY-oldY;
		oldX=event.clientX;
		oldY=event.clientY;
		if (isNaN(dX)) dX = 0; // source of bug when moving mouce pointer while changing solarElevation at the Demo! 
		if (isNaN(dY)) dY = 0; 
	};

	var intervalIdFunction = setInterval(function() {
		rotY = parseFloat(document.getElementById("rotY").innerHTML);
		var cos=Math.cos(rotY);
		var sin=Math.sin(rotY);
		
		posX+=speedX*cos+speedZ*sin;
		posZ+=speedX*-sin+speedZ*cos;
		
		document.getElementById("posX").innerHTML = posX;
		document.getElementById("posZ").innerHTML = posZ;
		
		CAMERA.position.set(posX, 5, posZ);
		rotY-=dX*0.005;
		rotX-=dY*0.005;
		
		document.getElementById("rotX").innerHTML = rotX;
		document.getElementById("rotY").innerHTML = rotY;
		
		CAMERA.rotation.set(0,0,0);
		CAMERA.rotateY(rotY);
		CAMERA.rotateX(rotX);
		
		drag = parseInt(document.getElementById("drag").innerHTML);
		if (!drag) {
			dX*=0.9; 
			dY*=0.9;
		}
		
	}, 16);
	
	document.getElementById("intervalId").innerHTML = intervalIdFunction;
	
	// the Dome
	var domeGeometry = new THREE.BufferGeometry();
	domeGeometry.addAttribute('position',new THREE.BufferAttribute(dome_points,3));
	domeGeometry.addAttribute('color',new THREE.BufferAttribute(colors_points,3));
	domeGeometry.addAttribute('index',new THREE.BufferAttribute(triangle_indices,3));
	var material = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors, side: THREE.DoubleSide } );
	var domeMesh = new THREE.Mesh( domeGeometry, material );
	SCENE.add(domeMesh);
	
	// the Sun
	var dome_radius = 1000; // this is the same as R defined in dome_points.c
	var sun_radius = 2 * (dome_radius * 0.004675); // sun_radius = dome_radius * tan(d/2), where d=0.5357 degrees (d is Sun's angular diameter)
	var sunColor = new THREE.Color(sun_color[0],sun_color[1],sun_color[2]);
	var sunGeometry = new THREE.SphereGeometry(sun_radius,24,24); //radius and how many "zones" to draw
	var sunMaterial = new THREE.MeshBasicMaterial({
		color: sunColor
	});
	var Sun = new THREE.Mesh( sunGeometry, sunMaterial );
	Sun.position.set(sun_position[0],sun_position[1],sun_position[2]);
	Sun.castShadow = false;
	SCENE.add(Sun);
	
	//the ground
	var planeBufferGeometry = new THREE.PlaneBufferGeometry (2000, 2000); // R=1000 (dome radius)
	var planeColor = new THREE.Color("#8B4513"); 	// SaddleBrown 
	//var planeColor = new THREE.Color("#F4A460"); 	// SandyBrown
	var planeMaterial = new THREE.MeshLambertMaterial( {
		color: planeColor,
		map: THREE.ImageUtils.loadTexture('images/funkyGround.jpg')
		//map: THREE.ImageUtils.loadTexture('images/earth_rigid.jpg') / for change :)
	});
	var planeMesh = new THREE.Mesh(planeBufferGeometry, planeMaterial);
	planeMaterial.map.wrapS = THREE.RepeatWrapping;
	planeMaterial.map.wrapT = THREE.RepeatWrapping;
	planeMaterial.map.repeat.set(500,500);
	planeMesh.position.set(0,0,0); //center of the ground quad
	planeMesh.rotateX(-Math.PI/2); //set it horizontally because planeBufferGeometry is along X,Y
	planeMesh.castShadow = false;
	planeMesh.receiveShadow = true;
	planeMaterial.map.repeat.x = planeMaterial.map.repeat.y = 50;
	SCENE.add(planeMesh);
	
	// add a model
	var whatToLoad = parseInt(document.getElementById('selectId').innerHTML);
	// 1 = horse, 2 = dinosaur, 3 = simple sphere, 4 = sittingBox, 5 = monster, 6 = avatar, 0 = No 3D-Model
	
	if (whatToLoad == 1) {
		var loader = new THREE.JSONLoader();
		loader.load('3d_models/horse.js', function ( geometry, materials ) {
			var material = new THREE.MeshFaceMaterial( materials );
			var horse = new THREE.Mesh( geometry, material );
			horse.scale.x = horse.scale.y = horse.scale.z = 0.1; 
			SCENE.add(horse);
		});
	} else if (whatToLoad == 2) {
		var model;
		var loader = new THREE.ColladaLoader();
		loader.load('3d_models/dinosaur.dae', function (collada) {
			model = collada.scene;
			model.position.set(100,22,0);
			SCENE.add(model);
		});
	} else if (whatToLoad == 3) {
		var sphereColor = new THREE.Color(0.9,0.9,1);
		var sphereGeometry = new THREE.SphereGeometry(6,24,24); //radius and how many "zones" to draw
		var sphereMaterial = new THREE.MeshPhongMaterial({
			color: sphereColor,
			shininess: 10
		});
		var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
		sphere.position.set(0, 6, 0);
		sphere.castShadow = true;
		sphere.receiveShadow = false;
		SCENE.add(sphere);
	} else if (whatToLoad == 4) {
		var loader = new THREE.JSONLoader();
		loader.load('3d_models/sittingBox.js', function ( geometry, materials ) {
			var material = new THREE.MeshFaceMaterial( materials );
			var Box = new THREE.Mesh( geometry, material );
			Box.scale.x = Box.scale.y = Box.scale.z = 10; 
			SCENE.add(Box);
		});
	} else if (whatToLoad == 5) {
		var model;
		var loader = new THREE.ColladaLoader();
		loader.load('3d_models/monster.dae', function (collada) {
			model = collada.scene;
			model.position.set(-30,0,0);
			model.rotateX(3*Math.PI/2);
			model.updateMatrix();
			SCENE.add(model);
		});
	} else if (whatToLoad == 6) {
		var model;
		var loader = new THREE.ColladaLoader();
		loader.load('3d_models/avatar.dae', function (collada) {
			model = collada.scene;
			model.scale.x = model.scale.y = model.scale.z = 8; 
			model.rotateX(3*Math.PI/2);
			model.updateMatrix();
			SCENE.add(model);
		});
	}
	
	// the (5) lights
	var num_lights = lights_points.length / 3; // should be 5 here
	
	var color1 = new THREE.Color(lights_colors[0],lights_colors[1],lights_colors[2]);
	var domePointLight1 = new THREE.PointLight( color1 );
	domePointLight1.position.set(lights_points[0],lights_points[1],lights_points[2]);
	domePointLight1.intensity = 1;
	SCENE.add(domePointLight1);
	
	var color2 = new THREE.Color(lights_colors[3],lights_colors[4],lights_colors[5]);
	var domePointLight2 = new THREE.PointLight( color2 );
	domePointLight2.position.set(lights_points[3],lights_points[4],lights_points[5]);
	domePointLight2.intensity = 1;
	SCENE.add(domePointLight2);
	
	var color3 = new THREE.Color(lights_colors[6],lights_colors[7],lights_colors[8]);
	var domePointLight3 = new THREE.PointLight( color3 );
	domePointLight3.position.set(lights_points[6],lights_points[7],lights_points[8]);
	domePointLight3.intensity = 1;
	SCENE.add(domePointLight3);
	
	var color4 = new THREE.Color(lights_colors[9],lights_colors[10],lights_colors[11]);
	var domePointLight4 = new THREE.PointLight( color4 );
	domePointLight4.position.set(lights_points[9],lights_points[10],lights_points[11]);
	domePointLight4.intensity = 1;
	SCENE.add(domePointLight4);
	
	var color5 = new THREE.Color(lights_colors[12],lights_colors[13],lights_colors[14]);
	var domePointLight5 = new THREE.PointLight( color5 );
	domePointLight5.position.set(lights_points[12],lights_points[13],lights_points[14]);
	domePointLight5.intensity = 1;
	SCENE.add(domePointLight5);
	
	// the Sun light source (strongest)
	var sunLight = new THREE.PointLight( sunColor );
	sunLight.position.set(sun_position[0],sun_position[1],sun_position[2]);
	sunLight.intensity = 2;
	SCENE.add(sunLight);
	
	// (de-)activate the lightHelpers
	var active_light_helpers = 0;
	if (active_light_helpers) {
		SCENE.add(new THREE.PointLightHelper(domePointLight1, 100));
		SCENE.add(new THREE.PointLightHelper(domePointLight2, 100));
		SCENE.add(new THREE.PointLightHelper(domePointLight3, 100));
		SCENE.add(new THREE.PointLightHelper(domePointLight4, 100));
		SCENE.add(new THREE.PointLightHelper(domePointLight5, 100));
		SCENE.add(new THREE.PointLightHelper(sunLight, 100));
	}
	
	//RENDER LOOP
	var animate=function() {
		RENDERER.render(SCENE,CAMERA);
		var id = requestAnimationFrame(animate);
		document.getElementById("animeId").innerHTML = id;
	};
	
	// begin the rendering!
	animate();
}