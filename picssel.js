window.$ = document.querySelector.bind(document);

var $canvas = null,
	ctx = null,
	$color_input = null,
	pixel_size = 25,
	pixels = [],
	states = [],
	undo_size = 15,
	canvas_size = 10,
	canvas_size_range = {
		min: 5,
		max: 200
	},
	origin_color = 'transparent',
	is_mouse_down = false,
	current_path = [];

document.addEventListener('DOMContentLoaded', () => {
	$canvas = document.querySelector('#c')
	$color_input = document.querySelector('input.color')
	ctx = $canvas.getContext('2d')
	pixelSizeSlider.value = pixel_size;

	$canvas.addEventListener('mousedown', onMouseDown);
	$('#generate-button').addEventListener('click', generateCode)
	$('#undo-button').addEventListener('click', undo)
	$('#clear-button').addEventListener('click', clearCanvas)
	$('#sizedown-button').addEventListener('click', canvasResize)
	$('#sizeup-button').addEventListener('click', canvasResize)
	pixelSizeSlider.addEventListener('change', pixelSizeChangeHandler)
	canvasResize()
	new ClipboardJS('.js-copy-btn');
})

pixelSizeChangeHandler = (e) => {
	pixel_size = parseInt(e.target.value, 10);
	canvasResize()
}

canvasResize = (e) => {
	if (e) {
		canvas_size += parseInt(e.target.dataset.amount, 10);
	}
	const size = canvas_size * pixel_size;
	if (canvas_size < canvas_size_range.min || canvas_size > canvas_size_range.max) {
		return;
	}
	$canvas.setAttribute('width', size)
	$canvas.setAttribute('height', size)
	generateCode()
}

undo = () => {
	// get the last state
	last_state = states.pop()
	if (!last_state) return;
	clear = false

	// if change was color - > clear, add a new pixel to the array
	if (last_state.new_color === 'clear') {
		pixels.push({
			x: last_state.x,
			y: last_state.y,
			color: last_state.old_color
		});
	} else {
		//  pop the last_state pixel
		for (let pos = 0, i = 0, len = pixels.length; i < len; pos = ++i) {
			let p = pixels[pos];
			if (p.x === last_state.x && p.y === last_state.y) {
				last_point = pixels.splice(pos, 1)[0]
				break;
			}
		}
		// if change was clear - > color, simply pop a pixel
		if (last_state.old_color === 'clear') clear = true

		// if change was color - > color, replace the last pixel color
		else {
			last_point.color = last_state.old_color
			pixels.push(last_point)
		}
	}

	drawPixel(last_state.x, last_state.y, last_state.old_color, clear);
	generateCode();
}


clearCanvas = () => {
	// ctx.clearRect(0, 0, $canvas.getAttribute('width'), $canvas.getAttribute('width'))
	pixels = []
	states = []
	$('#css-code').innerHTML = ''
	generateCode();
}

onMouseDown = (e) => {
	const canvasBounds = $canvas.getBoundingClientRect()
	let cx = e.clientX - canvasBounds.left + document.body.scrollLeft
	let cy = e.clientY - canvasBounds.top + document.body.scrollTop

	//  get the pixel clicked
	let px = ~~(cx / pixel_size);
	let py = ~~(cy / pixel_size);
	cx = px * pixel_size;
	cy = py * pixel_size;
	let color = $("input.color").style.backgroundColor;
	let pixel_current_color = getPixelColor(cx, cy)

	// if CTRL key pressed, clear the pixel
	// if SHIFT key pressed, set current color to pixel color
	// else just draw the pixel
	if (e.shiftKey) {
		rgb = getRGB(pixel_current_color)
		if (rgb) {
			$color_input.get(0).color.fromRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
		}
	} else if (e.ctrlKey || e.metaKey) {
		if (pixel_current_color === 'clear') {
			return;
		}
		drawPixel(cx, cy, null, true)
		addState(cx, cy, pixel_current_color, 'clear')
		for (let pos = 0, i = 0, len = pixels.length; i < len; pos = ++i) {
			let p = pixels[pos];
			if (p.x === px && p.y === py) {
				pixels.splice(pos, 1)
				break
			}
		}
	} else {
		drawPixel(cx, cy, color)
		addState(px, py, pixel_current_color, color)

		// # Dump it somewhere for processing, replace if coordinates already dumped
		for (let pos = 0, j = 0, len1 = pixels.length; j < len1; pos = ++j) {
			let p = pixels[pos];
			if (p.x === cx && p.y === cy) {
				pixels.splice(pos, 1)
				break
			}
		}
		pixels.push({
			x: px,
			y: py,
			color: color
		});
	}

	setTimeout(() => {
		generateCode();
	}, 10);
}

onMouseMove = (e) => {
	cx = e.clientX - $canvas.offset().left + document.body.scrollLeft
	cy = e.clientY - $canvas.offset().top + document.body.scrollTop

	// get the pixel clicked
	cx = ~~(cx / pixel_size) * pixel_size
	cy = ~~(cy / pixel_size) * pixel_size
	color = $("input.color").css('background-color');
	pixel_current_color = getPixelColor(cx, cy)
}
onMouseUp = (e) => {
	is_mouse_down = false
}

/*
function drawPixel
@param x x cordinate to draw at
@param y y cordinate to draw at
@param color color of pixel
@param clear clear the pixel or not
*/
drawPixel = (x, y, color = '#000', clear = false) => {
	if (clear) {
		// ctx.clearRect(x, y, pixel_size, pixel_size);
		if (x === 0 && y === 0) {
			return origin_color = 'transparent';
		}

	} else {
		// ctx.fillStyle = color
		// ctx.fillRect(x, y, pixel_size, pixel_size)
		if (x === 0 && y === 0) {
			return origin_color = color
		}
	}
}

generateCode = () => {
	const size = canvas_size * pixel_size;
	code_prefix = `
#art {
	width: ${size}px;
	height: ${size}px;
}

#art:after {
	content: '';
	display: block;
	width: ${pixel_size}px;
	height: ${pixel_size}px;
	background: ${origin_color};
	box-shadow:
	`;
	code_suffix = '\n}'

	code_art = ''

	pixels.forEach(p => {
		color_hash = RGBToHash(p.color)
		if (p.x !== 0 || p.y !== 0) {
			code_art = code_art.concat(`${p.x * pixel_size}px ${p.y * pixel_size}px ${color_hash},`)
		}
	});
	code_art = code_art.replace(/,$/, '').concat(';')
	code = code_prefix.concat(code_art).concat(code_suffix)
	$('#css-code').innerHTML = code;
	renderStyles.textContent = code;

	data = {
		title: 'piCSSel-art generated art',
		html: $('#html-code').innerHTML,
		css: code,
	}

	jsonString = JSON.stringify(data)
		.replace(/"/g, "&​quot;")
		.replace(/'/g, "&apos;")

	return $('#js-form-data').value = jsonString

}

addState = (x, y, old_color, new_color) => {
	states.push({
		x: x,
		y: y,
		old_color: old_color,
		new_color: new_color
	})
	if (states.length > undo_size) return states.splice(0, 1);
}
getPixelColor = (x, y) => {
	pixel_array = ctx.getImageData(x, y, 1, 1).data
	if (pixel_array[3] === 0) {
		return 'clear';
	}
	return 'rgba(#{pixel_array[0]}, #{pixel_array[1]}, #{pixel_array[2]}, #{pixel_array[3]})'
}

getRGB = (color) => {
	if (!color) return;
	color = color.replace(/\s*/g, '')
	if (color.indexOf('#') === -1) {
		const val = color.match(/rgba?\((\d*),(\d*),(\d*),?\d*\)/);
		return val ? val.slice(1).map((o) => parseInt(o)) : null;
	}
}
RGBToHash = (rgb) => {
	rgb = getRGB(rgb);
	return '#' + (rgb[2] | (rgb[1] << 8) | (rgb[0] << 16) | (1 << 24)).toString(16).slice(1)
}