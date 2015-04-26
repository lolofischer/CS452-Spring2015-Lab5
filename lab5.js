//Logan Fischer
//Lab 5 - CS452
var canvas;
var gl;
var numVertices  = 36;
var texSize = 64;
var texCoordsArray = [];
var pointsArray = [];
var normalsArray = [];
var texture;
var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
	];
	
	//cube
vertices = [
            // Front face
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,

            // Back face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,

            // Top face
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0, -1.0,

            // Bottom face
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,

            // Right face
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  1.0,
             1.0, -1.0,  1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0,
        ]	
//plane for shadow projection
  var vertices = new Float32Array([
    2.0, -1.7, 2.5,  
   -2.0, -1.7, 2.5,  
   -2.0, -1.7, -2.5,   
   2.0, -1.7, -2.5 
  ]);
  
// Vertex shader program for generating a shadow map
<script id="shader-vs" type="x-shader/x-vertex">
  attribute vec4 a_Position;
  uniform mat4 u_MvpMatrix;
  void main() {
  gl_Position = u_MvpMatrix * a_Position;
  };
</script>

// Fragment shader program for generating a shadow map
<script id="shader-fs" type="x-shader/x-fragment">
  #ifdef GL_ES
  precision mediump float;
  #endif
  void main() {
    gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 0.0); // Write the z-value in R
  };
  </script>
var lightPosition = vec4(0.0, 0.0, 0.5, 1.0 );
var lightAmbient = vec4(0.0, 0.4, 0.6, 1.0 );
var lightDiffuse = vec4( 0.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 0.0, 0.8, 1.0, 1.0 );
var materialDiffuse = vec4( 0.0, 0.5, 0.8, 1.0);
var materialSpecular = vec4( 1.0, 0.8, 1.0, 1.0 );
var materialShininess = 100.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelView, projection;
var viewerPos;
var program;
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var theta =[0, 0, 0];

var thetaLoc;
var flag = false;

function configureTexture( image ) {
    	texture = gl.createTexture();
    	gl.bindTexture( gl.TEXTURE_2D, texture );
    	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    	gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image );
    	gl.generateMipmap( gl.TEXTURE_2D );
	    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
           gl.NEAREST_MIPMAP_LINEAR );
	    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    
	    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
	}

function quad(a, b, c, d) {

     var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[b]);
     var normal = cross(t1, t2);
     var normal = vec3(normal);


     pointsArray.push(vertices[a]); 
     normalsArray.push(normal); 
     pointsArray.push(vertices[b]); 
     normalsArray.push(normal); 
     pointsArray.push(vertices[c]); 
     normalsArray.push(normal);   
     pointsArray.push(vertices[a]);  
     normalsArray.push(normal); 
     pointsArray.push(vertices[c]); 
     normalsArray.push(normal); 
     pointsArray.push(vertices[d]); 
     normalsArray.push(normal);    
}


function color()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    //Shadow Mapping
    var shadowProgram = createProgram(gl, SHADOW_VSHADER_SOURCE, SHADOW_FSHADER_SOURCE);
    shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'a_Position');
    shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');
    color();

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

	var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    	gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    	gl.enableVertexAttribArray( vTexCoord ); 

var image = document.getElementById("texImage");
configureTexture( image );
	
thetaLoc = gl.getUniformLocation(program, "theta"); 
    
    viewerPos = vec3(0.0, 0.0, -20.0 );

    projection = ortho(-1, 1, -1, 1, -100, 100);
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
       flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
       flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), 
       flatten(specularProduct) );	
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
       flatten(lightPosition) );
       
    gl.uniform1f(gl.getUniformLocation(program, 
       "shininess"),materialShininess);
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),
       false, flatten(projection));
    
    render();
}

var render = function(){
            
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
    modelView = mat4();
    modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
    modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program,
            "modelViewMatrix"), false, flatten(modelView) );

    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
            
            
    requestAnimFrame(render);
}


window.onkeydown = function(event) {
flag = true;
function handleKeys() {
 
	 if (currentlyPressedKeys[37]) {
	// Left cursor key
	 ySpeed -= 1;
	 axis = yAxis; 
	if(flag) theta[axis] += 1}
	  if (currentlyPressedKeys[39]) {
	// Right cursor key
	 ySpeed += 1;
	 axis = yAxis; 
	if(flag) theta[axis] -= 1}
	  if (currentlyPressedKeys[38]) {
	// Up cursor key
	xSpeed -= 1;
	axis = xAxis; 
	if(flag) theta[axis] += 1;
	  }
	  if (currentlyPressedKeys[40]) {
	// Down cursor key
	xSpeed += 1;
	axis = xAxis; 
	if(flag) theta[axis] -= 1}
	  }
	}
}
