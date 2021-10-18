// Somewhat based on Smple Pan and Zoom Canvas:
// Copyright (c) 2021 by Chengarda (https://codepen.io/chengarda/pen/wRxoyB)
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// 
let canvas = document.getElementById("canvas")
let ctx = canvas.getContext('2d')

let img_height = 1951;
let cameraOffset = { x: canvas.clientWidth/2, y: canvas.clientHeight/2 }
let cameraZoom = canvas.clientHeight / img_height;
let MAX_ZOOM = 5
let MIN_ZOOM = 0.1
let SCROLL_SENSITIVITY = 0.0005
let cw = canvas.clientWidth;
let ch = canvas.clientHeight;

function init() {
  resize();
  canvas = document.getElementById("canvas")
  ctx = canvas.getContext('2d')
  cameraOffset = { x: canvas.clientWidth/2, y: canvas.clientHeight/2 }
  cameraZoom = canvas.clientHeight / img_height;
}

function draw()
{
    cw = canvas.clientWidth;
    ch = canvas.clientHeight;
    canvas.width = cw;
    canvas.height = ch;
    // Translate to the canvas centre before zooming - so you'll always zoom on what you're looking directly at
    // ctx.setTransform(1, 0, 0, 1, 0, 0); // Identity
    ctx.translate( cw / 2, ch / 2 );
    ctx.scale(cameraZoom, cameraZoom)
    ctx.translate( -cw / 2 + cameraOffset.x, -ch / 2 + cameraOffset.y )
    // ctx.translate( -cw / 2, -ch / 2);
    drawInt();
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

function onPointerDown(e)
{
    isDragging = true
    dragStart.x = getEventLocation(e).x/cameraZoom - cameraOffset.x
    dragStart.y = getEventLocation(e).y/cameraZoom - cameraOffset.y
}

function onPointerUp(e)
{
    isDragging = false
    initialPinchDistance = null
    lastZoom = cameraZoom
}

function onPointerMove(e)
{
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
        adjustZoom( null, currentDistance/initialPinchDistance )
    }
}

function adjustZoom(zoomAmount, zoomFactor)
{
    requestAnimationFrame( draw )
    if (!isDragging)
    {
        if (zoomAmount)
        {
            cameraZoom += zoomAmount
        }
        else if (zoomFactor)
        {
            cameraZoom = zoomFactor*lastZoom
        }
        
        cameraZoom = Math.min( cameraZoom, MAX_ZOOM )
        cameraZoom = Math.max( cameraZoom, MIN_ZOOM )
        
    }
}

canvas.addEventListener('mousedown', onPointerDown)
canvas.addEventListener('touchstart', (e) => handleTouch(e, onPointerDown))
canvas.addEventListener('mouseup', onPointerUp)
canvas.addEventListener('mouseout', onPointerUp)
canvas.addEventListener('mouseleave', onPointerUp)
canvas.addEventListener('mousemove', onPointerMove)
canvas.addEventListener('touchmove', (e) => handleTouch(e, onPointerMove))

canvas.addEventListener( 'wheel', function(e) {
  e.preventDefault();
  e.stopImmediatePropagation();
  if (e.ctrlKey) {
    adjustZoom(-e.deltaY * SCROLL_SENSITIVITY * 10);
  } else {
    adjustZoom(-e.deltaY * SCROLL_SENSITIVITY);
  }
});
