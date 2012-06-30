###
picssel.coffee

version 1.0
Author	Kushagra Gour a.k.a. chinchang (chinchang457@gmail.com)
Licensed under The MIT License

Description:
###

$canvas = null
ctx = null
$color_input = null
pixel_length = 10
pixels = []
states = []
undo_size = 15
canvas_size = 100
canvas_size_range = 
	min: 50
	max: 200
origin_color = 'transparent'

$(->
	$canvas = $('#c')
	$color_input = $('input.color')
	ctx = $('#c').get(0).getContext('2d')
	$.data($('#sizedown-button')[0], 'amount', -1);
	$.data($('#sizeup-button')[0], 'amount', 1);
	
	# initialize zclip
	$('a#copy-html').zclip({
        path: 'js/ZeroClipboard.swf',
        copy: 'sdsfsf'
    })

	$('#copy-css').zclip({
        path: 'js/ZeroClipboard.swf',
        copy: 'sdsdsds'
    })

	$canvas.bind 'click', onClick
	$('#generate-button').bind 'click', generateCode
	$('#undo-button').bind 'click', undo
	$('#clear-button').bind 'click', clearCanvas
	$('#sizedown-button, #sizeup-button').bind 'click' , canvasResize
)

canvasResize = (e) ->
	size = canvas_size + $.data(e.currentTarget, 'amount') * pixel_length
	return if size < canvas_size_range.min or size > canvas_size_range.max
	canvas_size = size
	$canvas.attr 'width', canvas_size
	$canvas.attr 'height', canvas_size
	clearCanvas()

undo = ->
	last_point = pixels.pop()
	last_state = states.pop()
	if states
		drawPixel last_state.x, last_state.y, last_state.old_color, last_state.old_color is 'clear' ? true : false

clearCanvas = ->
	ctx.clearRect 0, 0, $canvas.attr('width'), $canvas.attr('width')
	pixels = []
	states = []
	$('#css-code').html ''

onClick = (e) ->
	cx = e.clientX - $canvas.offset().left
	cy = e.clientY - $canvas.offset().top

	# get the pixel clicked
	cx = ~~(cx/10) * 10
	cy = ~~(cy/10) * 10
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
	pixels.push({x: cx, y: cy, color: color})
	if cx is 0 and cy is 0 then origin_color = color

###
function drawPixel
@param	x 		x cordinate to draw at
@param	y 		y cordinate to draw at
@param	color 	color of pixel
@param	clear 	clear the pixel or not
###
drawPixel = (x, y, color = '#000', clear = false) ->
	if clear
		ctx.clearRect x, y, pixel_length, pixel_length
	else
		ctx.fillStyle = color
		ctx.fillRect x, y, pixel_length, pixel_length


generateCode = ->
	code_prefix = """
				#art {
					width: #{pixel_length}px;
					height: #{pixel_length}px;
					background: #{origin_color};
					box-shadow: 
				"""	
	
	code_suffix = "\n}"

	code_art = ''

	for p in pixels
		code_art = code_art.concat "\n\t#{p.x}px #{p.y}px #{p.color}," unless p.x is 0 and p.y is 0
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