// Somewhat based on Smple Pan and Zoom Canvas:
// Copyright (c) 2021 by Chengarda (https://codepen.io/chengarda/pen/wRxoyB)
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// 
let canvas;
let ctx;

let img_height = 1951;
let cameraOffset;
let cameraZoom;
let MAX_ZOOM = 5
let MIN_ZOOM = 0.1
let SCROLL_SENSITIVITY = 0.0005
let cw;
let ch;

function initZoom() {
  canvas = <HTMLCanvasElement> document.getElementById("canvas")
  ctx = canvas.getContext('2d')
  cameraOffset = { x: canvas.clientWidth/2, y: canvas.clientHeight/2 }
  cameraZoom = canvas.clientHeight / img_height;
  cw = canvas.clientWidth;
  ch = canvas.clientHeight;

  $(window).resize(resize); // Set handler
  resize(); // Call handler now
  ctx = canvas.getContext('2d')
  cameraOffset = { x: canvas.clientWidth/2, y: canvas.clientHeight/2 }
  cameraZoom = canvas.clientHeight / img_height;

  // Events for zooming
  canvas.addEventListener('resize', resize);
  canvas.addEventListener('click', (e) => console.log(e));
  canvas.addEventListener('mousedown', onPointerDown)
  canvas.addEventListener('touchstart', (e) => handleTouch(e, onPointerDown))
  canvas.addEventListener('mouseup', onPointerUp)
  canvas.addEventListener('mousemove', onPointerMove)
  canvas.addEventListener('touchmove', (e) => handleTouch(e, onPointerMove))

  canvas.addEventListener( 'wheel', function(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.ctrlKey) {
      adjustZoomAmount(-e.deltaY * SCROLL_SENSITIVITY * 10);
    } else {
      adjustZoomAmount(-e.deltaY * SCROLL_SENSITIVITY);
    }
  });
}

function draw()
{
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Identity
    cw = canvas.clientWidth;
    ch = canvas.clientHeight;
    canvas.width = cw;
    canvas.height = ch;
    ctx.translate( cw / 2, ch / 2);
    ctx.scale(cameraZoom, cameraZoom) // Zoom around center of canvas
    ctx.translate( -cw / 2 + cameraOffset.x, -ch / 2 + cameraOffset.y);
    consoleDraw();
}

// Gets the relevant location from a mouse or single touch event
function getEventLocation(e)
{
    if (e.touches && e.touches.length == 1)
    {
        return { x:e.touches[0].clientX, y: e.touches[0].clientY }
    }
    else if (e.clientX && e.clientY)
    {
        return { x: e.clientX, y: e.clientY }        
    }
}

let isDragging = false
let dragStart = { x: 0, y: 0 }
let dragStartRaw = { x: 0, y: 0 }

function onPointerDown(e)
{
    isDragging = true
    dragStart.x = getEventLocation(e).x/cameraZoom - cameraOffset.x
    dragStart.y = getEventLocation(e).y/cameraZoom - cameraOffset.y
    dragStartRaw.x = getEventLocation(e).x;
    dragStartRaw.y = getEventLocation(e).y;
}

function onPointerUp(e)
{
    if (Math.abs(getEventLocation(e).x - dragStartRaw.x) < 5 && Math.abs(getEventLocation(e).y - dragStartRaw.y) < 5) {
      clicked(e);
    }
    isDragging = false
    initialPinchDistance = null
    lastZoom = cameraZoom
}

function onPointerMove(e)
{
    if (e.buttons == 0) {
      isDragging = false; // Button might have been lifted while mouse was outside window
    }
    if (isDragging)
    {
        cameraOffset.x = getEventLocation(e).x/cameraZoom - dragStart.x
        cameraOffset.y = getEventLocation(e).y/cameraZoom - dragStart.y
        requestAnimationFrame( draw )
    }
}

function handleTouch(e, singleTouchHandler)
{
    if ( e.touches.length == 1 )
    {
        singleTouchHandler(e)
    }
    else if (e.type == "touchmove" && e.touches.length == 2)
    {
        isDragging = false
        handlePinch(e)
    }
}

let initialPinchDistance = null
let lastZoom = cameraZoom

function handlePinch(e)
{
    e.preventDefault()
    
    let touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    let touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }
    
    // This is distance squared, but no need for an expensive sqrt as it's only used in ratio
    let currentDistance = (touch1.x - touch2.x)**2 + (touch1.y - touch2.y)**2
    
    if (initialPinchDistance == null)
    {
        initialPinchDistance = currentDistance
    }
    else
    {
        adjustZoomFactor(currentDistance/initialPinchDistance )
    }
}

function adjustZoomAmount(zoomAmount)
{
    requestAnimationFrame( draw )
    if (!isDragging)
    {
        cameraZoom += zoomAmount
        
        cameraZoom = Math.min( cameraZoom, MAX_ZOOM )
        cameraZoom = Math.max( cameraZoom, MIN_ZOOM )
    }
}

function adjustZoomFactor(zoomFactor)
{
    requestAnimationFrame( draw )
    if (!isDragging && zoomFactor != 0)
    {
        cameraZoom = zoomFactor*lastZoom
        
        cameraZoom = Math.min( cameraZoom, MAX_ZOOM )
        cameraZoom = Math.max( cameraZoom, MIN_ZOOM )
    }
}
