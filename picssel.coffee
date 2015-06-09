###
picssel.coffee

version 1.1
Author	Kushagra Gour a.k.a. chinchang (chinchang457@gmail.com)
Licensed under The MIT License

###

$canvas = null
ctx = null
$color_input = null
pixel_size = 6
pixels = []
states = []
undo_size = 15
canvas_size = pixel_size * 20
canvas_size_range =
	min: 50
	max: 200
origin_color = 'transparent'
is_mouse_down = false
current_path = []

$(->
	$canvas = $('#c')
	$color_input = $('input.color')
	ctx = $('#c').get(0).getContext('2d')
	$.data($('#sizedown-button')[0], 'amount', -1);
	$.data($('#sizeup-button')[0], 'amount', 1);

	# initialize zclip
	$('#copy-html').zclip({
		path: 'js/ZeroClipboard.swf',
		copy: ->
			return $('#html-code').text()
	})

	$('#copy-css').zclip({
		path: 'js/ZeroClipboard.swf',
		copy: ->
			return $('#css-code').text()
	})

	$canvas.bind 'mousedown', onMouseDown
	$('#generate-button').bind 'click', generateCode
	$('#undo-button').bind 'click', undo
	$('#clear-button').bind 'click', clearCanvas
	$('#sizedown-button, #sizeup-button').bind 'click' , canvasResize
)

canvasResize = (e) ->
	size = canvas_size + $.data(e.currentTarget, 'amount') * pixel_size
	return if size < canvas_size_range.min or size > canvas_size_range.max
	canvas_size = size
	$canvas.attr 'width', canvas_size
	$canvas.attr 'height', canvas_size
	clearCanvas()

undo = ->
	# get the last state
	last_state = states.pop()
	return if not last_state
	clear = false
	# if change was color -> clear, add a new pixel to the array
	if last_state.new_color is 'clear'
		pixels.push {x: last_state.x, y: last_state.y, color: last_state.old_color}
	else
		# pop the last_state pixel
		for p, pos in pixels
			if(p.x is last_state.x and p.y is last_state.y)
				last_point = pixels.splice(pos, 1)[0]
				break
		# if change was clear -> color, simply pop a pixel
		if last_state.old_color is 'clear'
			clear = true
		# if change was color -> color, replace the last pixel color
		else
			last_point.color = last_state.old_color
			pixels.push last_point

	drawPixel last_state.x, last_state.y, last_state.old_color, clear


clearCanvas = ->
	ctx.clearRect 0, 0, $canvas.attr('width'), $canvas.attr('width')
	pixels = []
	states = []
	$('#css-code').html ''

onMouseDown = (e) ->
	cx = e.clientX - $canvas.offset().left + document.body.scrollLeft
	cy = e.clientY - $canvas.offset().top + document.body.scrollTop

	# get the pixel clicked
	cx = ~~(cx/pixel_size) * pixel_size
	cy = ~~(cy/pixel_size) * pixel_size
	color = $("input.color").css 'background-color'
	pixel_current_color = getPixelColor cx, cy

	###
	if CTRL key pressed, clear the pixel
	if SHIFT key pressed, set current color to pixel color
	else just draw the pixel
	###
	if e.shiftKey
		rgb = getRGB pixel_current_color
		$color_input.get(0).color.fromRGB rgb[0]/255, rgb[1]/255, rgb[2]/255 if rgb
		return
	else if e.ctrlKey or e.metaKey
		return if pixel_current_color is 'clear'
		drawPixel cx, cy, null, true
		# add the new state
		addState cx, cy, pixel_current_color, 'clear'
		for p, pos in pixels
			if(p.x is cx and p.y is cy)
				pixels.splice pos, 1
				break
		return
	else
		drawPixel cx, cy, color
		# add the new state
		addState cx, cy, pixel_current_color, color

		# Dump it somewhere for processing, replace if coordinates already dumped
		for p, pos in pixels
			if(p.x is cx and p.y is cy)
				pixels.splice pos, 1
				break
		pixels.push {x: cx, y: cy, color: color}

onMouseMove = (e) ->
	cx = e.clientX - $canvas.offset().left + document.body.scrollLeft
	cy = e.clientY - $canvas.offset().top + document.body.scrollTop

	# get the pixel clicked
	cx = ~~(cx/pixel_size) * pixel_size
	cy = ~~(cy/pixel_size) * pixel_size
	color = $("input.color").css 'background-color'
	pixel_current_color = getPixelColor cx, cy

onMouseUp = (e) ->
	is_mouse_down = false

###
function drawPixel
@param	x 		x cordinate to draw at
@param	y 		y cordinate to draw at
@param	color 	color of pixel
@param	clear 	clear the pixel or not
###
drawPixel = (x, y, color = '#000', clear = false) ->
	if clear
		ctx.clearRect x, y, pixel_size, pixel_size
		if x is 0 and y is 0 then origin_color = 'transparent'
	else
		ctx.fillStyle = color
		ctx.fillRect x, y, pixel_size, pixel_size
		if x is 0 and y is 0 then origin_color = color


generateCode = ->
	code_prefix = """
				#art {
					width: #{canvas_size}px;
					height: #{canvas_size}px;
				}

				#art:after {
					content: '';
					display: block;
					width: #{pixel_size}px;
					height: #{pixel_size}px;
					background: #{origin_color};
					box-shadow:
				"""

	code_suffix = "\n}"

	code_art = ''

	for p in pixels
		color_hash = RGBToHash p.color
		code_art = code_art.concat "#{p.x}px #{p.y}px #{color_hash}," unless p.x is 0 and p.y is 0
	code_art = code_art.replace(/,$/, '').concat(';')
	code = code_prefix.concat(code_art).concat(code_suffix)
	$('#css-code').html code

addState = (x, y, old_color, new_color) ->
	states.push {x: x, y: y, old_color: old_color, new_color: new_color}
	states.splice 0, 1 if states.length > undo_size

getPixelColor = (x, y) ->
	pixel_array = ctx.getImageData(x, y, 1, 1).data
	if pixel_array[3] is 0 then return 'clear'
	"rgba(#{pixel_array[0]}, #{pixel_array[1]}, #{pixel_array[2]}, #{pixel_array[3]})"

getRGB = (color) ->
	return if not color
	color = color.replace(/\s*/g,'')
	if(color.indexOf '#' is -1 )
		color.match(/rgba?\((\d*),(\d*),(\d*),?\d*\)/)?.slice(1).map( (o) -> parseInt(o))

RGBToHash = (rgb) ->
	rgb = getRGB rgb
	'#' + (rgb[2] | (rgb[1] << 8) | (rgb[0] << 16) | (1 << 24)).toString(16).slice(1)
