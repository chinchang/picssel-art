/*
picssel.coffee

version 1.0
Author	Kushagra Gour a.k.a. chinchang (chinchang457@gmail.com)
Licensed under The MIT License
*/
var $canvas, $color_input, addState, canvasResize, canvas_size, canvas_size_range, clearCanvas, ctx, drawPixel, generateCode, getPixelColor, getRGB, onClick, origin_color, pixel_size, pixels, states, undo, undo_size;

$canvas = null;

ctx = null;

$color_input = null;

pixel_size = 8;

pixels = [];

states = [];

undo_size = 15;

canvas_size = pixel_size * 10;

canvas_size_range = {
  min: 50,
  max: 200
};

origin_color = 'transparent';

$(function() {
  $canvas = $('#c');
  $color_input = $('input.color');
  ctx = $('#c').get(0).getContext('2d');
  $.data($('#sizedown-button')[0], 'amount', -1);
  $.data($('#sizeup-button')[0], 'amount', 1);
  $('a#copy-html').zclip({
    path: 'js/ZeroClipboard.swf',
    copy: function() {
      return $('#html-code').text();
    },
    afterCopy: function() {
      $(this).text('Copied');
      return (function($button) {
        return setTimeout(function() {
          return $button.text('Copy');
        }, 800);
      })($(this));
    }
  });
  $('a#copy-css').zclip({
    path: 'js/ZeroClipboard.swf',
    copy: function() {
      return $('#css-code').text();
    },
    afterCopy: function() {
      $(this).text('Copied');
      return (function($button) {
        return setTimeout(function() {
          return $button.text('Copy');
        }, 800);
      })($(this));
    }
  });
  $canvas.bind('click', onClick);
  $('#generate-button').bind('click', generateCode);
  $('#undo-button').bind('click', undo);
  $('#clear-button').bind('click', clearCanvas);
  return $('#sizedown-button, #sizeup-button').bind('click', canvasResize);
});

canvasResize = function(e) {
  var size;
  size = canvas_size + $.data(e.currentTarget, 'amount') * pixel_size;
  if (size < canvas_size_range.min || size > canvas_size_range.max) return;
  canvas_size = size;
  $canvas.attr('width', canvas_size);
  $canvas.attr('height', canvas_size);
  return clearCanvas();
};

undo = function() {
  var last_point, last_state, _ref;
  last_point = pixels.pop();
  last_state = states.pop();
  if (states) {
    return drawPixel(last_state.x, last_state.y, last_state.old_color, (_ref = last_state.old_color === 'clear') != null ? _ref : {
      "true": false
    });
  }
};

clearCanvas = function() {
  ctx.clearRect(0, 0, $canvas.attr('width'), $canvas.attr('width'));
  pixels = [];
  states = [];
  return $('#css-code').html('');
};

onClick = function(e) {
  var color, cx, cy, p, pixel_current_color, pos, rgb, _len, _len2;
  cx = e.clientX - $canvas.offset().left + document.body.scrollLeft;
  cy = e.clientY - $canvas.offset().top + document.body.scrollTop;
  cx = ~~(cx / pixel_size) * pixel_size;
  cy = ~~(cy / pixel_size) * pixel_size;
  color = $("input.color").css('background-color');
  pixel_current_color = getPixelColor(cx, cy);
  /*
  	if CTRL key pressed, clear the pixel
  	if SHIFT key pressed, set current color to pixel color
  	else just draw the pixel
  */
  if (e.shiftKey) {
    rgb = getRGB(pixel_current_color);
    if (rgb) {
      $color_input.get(0).color.fromRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
    }
  } else if (e.ctrlKey || e.metaKey) {
    if (pixel_current_color === 'clear') return;
    drawPixel(cx, cy, null, true);
    addState(cx, cy, pixel_current_color, 'clear');
    for (pos = 0, _len = pixels.length; pos < _len; pos++) {
      p = pixels[pos];
      if (p.x === cx && p.y === cy) {
        pixels.splice(pos, 1);
        break;
      }
    }
    return;
  } else {
    drawPixel(cx, cy, color);
  }
  addState(cx, cy, pixel_current_color, color);
  for (pos = 0, _len2 = pixels.length; pos < _len2; pos++) {
    p = pixels[pos];
    if (p.x === cx && p.y === cy) {
      pixels.splice(pos, 1);
      break;
    }
  }
  pixels.push({
    x: cx,
    y: cy,
    color: color
  });
  if (cx === 0 && cy === 0) return origin_color = color;
};

/*
function drawPixel
@param	x 		x cordinate to draw at
@param	y 		y cordinate to draw at
@param	color 	color of pixel
@param	clear 	clear the pixel or not
*/

drawPixel = function(x, y, color, clear) {
  if (color == null) color = '#000';
  if (clear == null) clear = false;
  if (clear) {
    return ctx.clearRect(x, y, pixel_size, pixel_size);
  } else {
    ctx.fillStyle = color;
    return ctx.fillRect(x, y, pixel_size, pixel_size);
  }
};

generateCode = function() {
  var code, code_art, code_prefix, code_suffix, p, _i, _len;
  code_prefix = "#art {\n	width: " + canvas_size + "px;\n	height: " + canvas_size + "px;\n}\n\n#art div{\n	width: " + pixel_size + "px;\n	height: " + pixel_size + "px;\n	background: " + origin_color + ";\n	box-shadow: ";
  code_suffix = "\n}";
  code_art = '';
  for (_i = 0, _len = pixels.length; _i < _len; _i++) {
    p = pixels[_i];
    if (!(p.x === 0 && p.y === 0)) {
      code_art = code_art.concat("\n\t" + p.x + "px " + p.y + "px " + p.color + ",");
    }
  }
  code_art = code_art.replace(/,$/, '').concat(';');
  code = code_prefix.concat(code_art).concat(code_suffix);
  return $('#css-code').html(code);
};

addState = function(x, y, old_color, new_color) {
  states.push({
    x: x,
    y: y,
    old_color: old_color,
    new_color: new_color
  });
  if (states.length > undo_size) return states.splice(0, 1);
};

getPixelColor = function(x, y) {
  var pixel_array;
  pixel_array = ctx.getImageData(x, y, 1, 1).data;
  if (pixel_array[3] === 0) return 'clear';
  return "rgba(" + pixel_array[0] + ", " + pixel_array[1] + ", " + pixel_array[2] + ", " + pixel_array[3] + ")";
};

getRGB = function(color) {
  var _ref;
  if (!color) return;
  color = color.replace(/\s*/g, '');
  if (color.indexOf('#' === -1)) {
    return (_ref = color.match(/rgba?\((\d*),(\d*),(\d*),?\d*\)/)) != null ? _ref.slice(1).map(function(o) {
      return parseInt(o);
    }) : void 0;
  }
};
