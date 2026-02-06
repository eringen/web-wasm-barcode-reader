const snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  

// Execute the application code when the WebAssembly module is ready.
Module.onRuntimeInitialized = async _ => {

	// wrap all C functions using cwrap. Note that we have to provide crwap with the function signature.
	const api = {
		scan_image: Module.cwrap('scan_image', '', ['number', 'number', 'number']),
		create_buffer: Module.cwrap('create_buffer', 'number', ['number', 'number']),
		destroy_buffer: Module.cwrap('destroy_buffer', '', ['number']),
	}

	const barcontainer = document.getElementById("barcontainer");
	const cameraWidth = barcontainer.clientWidth;
	const cameraHeight = barcontainer.clientHeight;
	const barcodeWidth = parseInt(cameraWidth*.702);
	const barcodeHeight = parseInt(cameraHeight*.242);
	const barcodeOffset = [parseInt((cameraWidth/2)-(barcodeWidth/2)), parseInt((cameraHeight/2)-(barcodeHeight/2))];
	const light = document.getElementById('light');
	const sound = document.getElementById('sound');
	const video = document.getElementById("live");
	// make image processing canvas offscreen
	const canvas = new OffscreenCanvas(barcodeWidth, barcodeHeight);
	const canvas2 = document.getElementById("canvas2");
	const ctx = canvas.getContext('2d');
	const ctx2 = canvas2.getContext('2d');
	// make desired h/w bigger for clearer barcode image
	const desiredWidth = barcontainer.clientWidth*2;
	const desiredHeight =barcontainer.clientWidth*2;

	// set overlay canvas size
	ctx2.canvas.width = barcontainer.clientWidth;
	ctx2.canvas.height = barcontainer.clientHeight;

	sound.addEventListener('click', function(){
		snd.play();
	})
	console.log(barcodeOffset)


	const constraints = {
		video: {
			// the browser will try to honor this resolution, but it may end up being lower.
			width: desiredWidth,
			height: desiredHeight,
			facingMode:'environment',
			resizeMode: "crop-and-scale",
			aspectRatio: {exact:1},
		}
	};



	// open the webcam stream
	navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
		// added attributes for ios
		video.setAttribute('autoplay', '');
		video.setAttribute('muted', '');
		video.setAttribute('playsinline', '')
		video.srcObject = stream;
		video.play();
		let there_be_light = false;
		// tell the canvas which resolution we ended up getting from the webcam
		const track = stream.getVideoTracks()[0];
		const actualSettings = track.getSettings();

		// flashlight
		light.addEventListener('click', function(){
			there_be_light = !there_be_light
			track.applyConstraints({
				advanced: [{torch: there_be_light}]
			});
		})

		console.log(actualSettings.width, actualSettings.height)
		// fixed resolution for time being
		// TODO: make these dynamic
		canvas.width = barcodeWidth*2;
		canvas.height = barcodeHeight*2;

		// scan interval
		const timer = setInterval(detectSymbols, 150);

	}).catch((e) => {
		throw e
	});

	function detectSymbols() {
		// grab a frame from the media source and draw it to the canvas
		// get part of image (in rectangle layout)
		ctx.drawImage(video, barcodeOffset[0]*2,barcodeOffset[1]*2,barcodeWidth*2,barcodeHeight*2,0,0,barcodeWidth*2,barcodeHeight*2);
		const image = ctx.getImageData(0, 0, canvas.width, canvas.height)

		// convert the image data to grayscale 
		const grayData = []
		const d = image.data;
		for (var i = 0, j = 0; i < d.length; i += 4, j++) {
			grayData[j] = (d[i] * 66 + d[i + 1] * 129 + d[i + 2] * 25 + 4096) >> 8;
		}

		// clear overlay
		ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

		// put the data into the allocated buffer on the wasm heap.
		const p = api.create_buffer(image.width, image.height);
		Module.HEAP8.set(grayData, p);

		// call the scanner function
		api.scan_image(p, image.width, image.height)

		// clean up 
		//(this is not really necessary in this example as we could reuse the buffer, but is used to demonstrate how you can manage Wasm heap memory from the js environment)
		//api.destroy_buffer(p);

	}

	function drawPoly(ctx, poly) {
		// drawPoly expects a flat array of coordinates forming a polygon (e.g. [x1,y1,x2,y2,... etc])
		ctx.beginPath();
		for (item = 2; item < poly.length - 1; item += 2) { ctx.lineTo(poly[item]/2+barcodeOffset[0], poly[item + 1]/2+barcodeOffset[1]) }

		ctx.lineWidth = 2;
		ctx.strokeStyle = "#FF0000";
		ctx.closePath();
		ctx.stroke();
	}

	// render the string contained in the barcode as text on the canvas
	function renderData(ctx, data, x, y) {
		ctx.font = "bold 35px Arial";
		ctx.fillStyle = "white";
		ctx.fillText(data, barcodeOffset[0]*1.5, cameraHeight/2+barcodeOffset[1]/2);
		snd.play();
	}

	// set the function that should be called whenever a barcode is detected
	Module['processResult'] = (symbol, data, polygon) => {
		if(data != 0){
			console.log('s',symbol)
			console.log('d',data)
			console.log('p',polygon)
		}

		// draw the bounding polygon
		drawPoly(ctx2, polygon)

		// render the data at the first coordinate of the polygon
		renderData(ctx2, data, polygon[0], polygon[1] - 10)
	}

}
