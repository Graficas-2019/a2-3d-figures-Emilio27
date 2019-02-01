var projectionMatrix;

var shaderProgram, shaderVertexPositionAttribute, shaderVertexColorAttribute, 
    shaderProjectionMatrixUniform, shaderModelViewMatrixUniform;

var duration = 5000; // ms

// Attributes: Input variables used in the vertex shader. Since the vertex shader is called on each vertex, these will be different every time the vertex shader is invoked.
// Uniforms: Input variables for both the vertex and fragment shaders. These do not change values from vertex to vertex.
// Varyings: Used for passing data from the vertex shader to the fragment shader. Represent information for which the shader can output different value for each vertex.
var vertexShaderSource =    
    "    attribute vec3 vertexPos;\n" +
    "    attribute vec4 vertexColor;\n" +
    "    uniform mat4 modelViewMatrix;\n" +
    "    uniform mat4 projectionMatrix;\n" +
    "    varying vec4 vColor;\n" +
    "    void main(void) {\n" +
    "		// Return the transformed and projected vertex value\n" +
    "        gl_Position = projectionMatrix * modelViewMatrix * \n" +
    "            vec4(vertexPos, 1.0);\n" +
    "        // Output the vertexColor in vColor\n" +
    "        vColor = vertexColor;\n" +
    "    }\n";

// precision lowp float
// This determines how much precision the GPU uses when calculating floats. The use of highp depends on the system.
// - highp for vertex positions,
// - mediump for texture coordinates,
// - lowp for colors.
var fragmentShaderSource = 
    "    precision lowp float;\n" +
    "    varying vec4 vColor;\n" +
    "    void main(void) {\n" +
    "    gl_FragColor = vColor;\n" +
    "}\n";

function initWebGL(canvas)
{
    var gl = null;
    var msg = "Your browser does not support WebGL, " +
        "or it is not enabled by default.";
    try 
    {
        gl = canvas.getContext("experimental-webgl");
    } 
    catch (e)
    {
        msg = "Error creating WebGL Context!: " + e.toString();
    }

    if (!gl)
    {
        alert(msg);
        throw new Error(msg);
    }

    return gl;        
 }

function initViewport(gl, canvas)
{
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function initGL(canvas)
{
    // Create a project matrix with 45 degree field of view
    projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 1, 10000);
}

// TO DO: Create the functions for each of the figures.

function createShader(gl, str, type)
{
    var shader;
    if (type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShader(gl)
{
    // load and compile the fragment and vertex shader
    var fragmentShader = createShader(gl, fragmentShaderSource, "fragment");
    var vertexShader = createShader(gl, vertexShaderSource, "vertex");

    // link them together into a new program
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // get pointers to the shader params
    shaderVertexPositionAttribute = gl.getAttribLocation(shaderProgram, "vertexPos");
    gl.enableVertexAttribArray(shaderVertexPositionAttribute);

    shaderVertexColorAttribute = gl.getAttribLocation(shaderProgram, "vertexColor");
    gl.enableVertexAttribArray(shaderVertexColorAttribute);
    
    shaderProjectionMatrixUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
    shaderModelViewMatrixUniform = gl.getUniformLocation(shaderProgram, "modelViewMatrix");

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
}

function draw(gl, objs) 
{
    // clear the background (with black)
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);

    // set the shader to use
    gl.useProgram(shaderProgram);

    for(i = 0; i<objs.length; i++)
    {
        obj = objs[i];
        // connect up the shader parameters: vertex position, color and projection/model matrices
        // set up the buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.buffer);
        gl.vertexAttribPointer(shaderVertexPositionAttribute, obj.vertSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
        gl.vertexAttribPointer(shaderVertexColorAttribute, obj.colorSize, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indices);

        gl.uniformMatrix4fv(shaderProjectionMatrixUniform, false, projectionMatrix);
        gl.uniformMatrix4fv(shaderModelViewMatrixUniform, false, obj.modelViewMatrix);

        // Draw the object's primitives using indexed buffer information.
        // void gl.drawElements(mode, count, type, offset);
        // mode: A GLenum specifying the type primitive to render.
        // count: A GLsizei specifying the number of elements to be rendered.
        // type: A GLenum specifying the type of the values in the element array buffer.
        // offset: A GLintptr specifying an offset in the element array buffer.
        gl.drawElements(obj.primtype, obj.nIndices, gl.UNSIGNED_SHORT, 0);
    }
}

function run(gl, objs) 
{
    // The window.requestAnimationFrame() method tells the browser that you wish to perform an animation and requests that the browser call a specified function to update an animation before the next repaint. The method takes a callback as an argument to be invoked before the repaint.
    requestAnimationFrame(function() { run(gl, objs); });
    draw(gl, objs);

    for(i = 0; i<objs.length; i++)
        objs[i].update();
}


function createPyramid(gl, translation, rotationAxis){    
    // Vertex Data
    var vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    var verts = [
       // Base1
        0.0, 0.0,  0.0,
        3.0, 0.0,  0,
        1.5,  0.0,  2.31,

       // Base2
        3.0, 0.0, 0.0,
        3.93,  0.0, 2.85,
        1.5,  0.0,  2.31,

       // Base3
       3.93,  0.0, 2.85,
       1.5, 0.0, 4.62,
       1.5,  0.0,  2.31,

       // Base4
       1.5, 0.0, 4.62,
       -0.93, 0.0, 2.85,
       1.5,  0.0,  2.31,

       // Base5
       -0.93, 0.0, 2.85,
       0.0, 0.0,  0.0,
        1.5,  0.0,  2.31,

        //Face1
        0.0, 0.0,  0.0,
        3.0, 0.0,  0,
        1.5,  10.0,  2.31,

        //Face2
        3.0, 0.0, 0.0,
        3.93,  0.0, 2.85,
        1.5,  10.0,  2.31,

        //Face3
        3.93,  0.0, 2.85,
       1.5, 0.0, 4.62,
       1.5,  10.0,  2.31,

        //Face4
        1.5, 0.0, 4.62,
       -0.93, 0.0, 2.85,
       1.5,  10.0,  2.31,

        //Face5
        -0.93, 0.0, 2.85,
       0.0, 0.0,  0.0,
        1.5,  10.0,  2.31,

       
       ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    // Color data
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var faceColors = [
        [0.0, 0.0, 0.0, 0.0], // Base1
        [0.0, 0.0, 0.0, 0.0], // Base2
        [0.0, 0.0, 0.0, 0.0], // Base3
        [0.0, 0.0, 0.0, 0.0], // Base4
        [0.0, 0.0, 0.0, 0.0], // Base5
        [0.0, 1.0, 1.0, 1.0],  // Face1
        [1.0, 0.0, 1.0, 1.0], // Face2
        [1.0, 1.0, 0.0, 1.0], // Face3
        [0.0, 0.0, 1.0, 1.0], // Face4
        [0.0, 1.0, 0.0, 1.0], //Face5
    ];

    // Each vertex must have the color information, that is why the same color is concatenated 4 times, one for each vertex of the cube's face.
    var vertexColors = [];
    // for (var i in faceColors) 
    // {
    //     var color = faceColors[i];
    //     for (var j=0; j < 4; j++)
    //         vertexColors = vertexColors.concat(color);
    // }
    for (const color of faceColors) 
    {
        for (var j=0; j < 3; j++)
            vertexColors = vertexColors.concat(color);
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn).
    var cubeIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
    var cubeIndices = [
        0,1,2, //Base1
        3,4,5, //Base2
        6,7,8, //Base3
        9,10,11, //Base4
        12,13,14, //Base5

        15,16,17, //Face1
        18,19,20, //Face2
        21,22,23, //Face3
        24,25,26, //Face4
        27,28,29, //Face5
    ];

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);
    
    var pyramid = {
            buffer:vertexBuffer, colorBuffer:colorBuffer, indices:cubeIndexBuffer,
            vertSize:3, nVerts:30, colorSize:4, nColors: 24, nIndices:30,
            primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()};

    mat4.translate(pyramid.modelViewMatrix, pyramid.modelViewMatrix, translation);

    pyramid.update = function()
    {
        var now = Date.now();
        var deltat = now - this.currentTime;
        this.currentTime = now;
        var fract = deltat / duration;
        var angle = Math.PI * 2 * fract;
    
        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);
    };
    
    return pyramid;
}

function createOcta(gl, translation, rotationAxis){
     // Vertex Data
     var vertexBuffer;
     vertexBuffer = gl.createBuffer();
     gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
 
     var verts = [
        // Face1
         1.0, 0.0,  0.0,
         0.0, 1.0,  0.0,
         0.0, 0.0, 1.0,

        // Face2
        -1.0, 0.0,  0.0,
         0.0, 1.0,  0.0,
         0.0, 0.0, 1.0,
 
        // Face3
        1.0, 0.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, 0.0, 1.0,

        //Face4
         1.0, 0.0,  0.0,
         0.0, 1.0,  0.0,
         0.0, 0.0, -1.0,

        // Face5
        -1.0, 0.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, 0.0, 1.0,        
 
         //Face6
         1.0, 0.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, 0.0, -1.0,
 
         //Face7
         -1.0, 0.0,  0.0,
         0.0, 1.0,  0.0,
         0.0, 0.0, -1.0,

        //Face8
         -1.0, 0.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, 0.0, -1.0,
 
 
        
        ];
 
     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
 
     // Color data
     var colorBuffer = gl.createBuffer();
     gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
     var faceColors = [
         [1.0, 0.0, 0.0, 1.0], // Face1
         [0.0, 1.0, 0.0, 1.0], // Face2
         [0.0, 0.0, 0.0, 1.0], // Face3
         [0.0, 1.0, 1.0, 1.0],  // Face4
         [1.0, 0.0, 1.0, 1.0], // Face5
         [1.0, 1.0, 0.0, 1.0], // Face6
         [0.0, 0.0, 1.0, 1.0], // Face7
         [0.0, 1.0, 0.0, 1.0], //Face8
     ];
 
     // Each vertex must have the color information, that is why the same color is concatenated 4 times, one for each vertex of the cube's face.
     var vertexColors = [];
     // for (var i in faceColors) 
     // {
     //     var color = faceColors[i];
     //     for (var j=0; j < 4; j++)
     //         vertexColors = vertexColors.concat(color);
     // }
     for (const color of faceColors) 
     {
         for (var j=0; j < 3; j++)
             vertexColors = vertexColors.concat(color);
     }
 
     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);
 
     // Index data (defines the triangles to be drawn).
     var cubeIndexBuffer = gl.createBuffer();
     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
     var cubeIndices = [
         0,1,2, //Face1
         3,4,5, //Face2
         6,7,8, //Face3
         9,10,11, //Face4
         12,13,14, //Face5
         15,16,17, //Face6
         18,19,20, //Face7
         21,22,23, //Face8
     ];
 
     // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
     // Uint16Array: Array of 16-bit unsigned integers.
     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);
     
     var octahedron = {
             buffer:vertexBuffer, colorBuffer:colorBuffer, indices:cubeIndexBuffer,
             vertSize:3, nVerts:24, colorSize:4, nColors: vertexColors.length, nIndices:24,
             primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()};
 
     mat4.translate(octahedron.modelViewMatrix, octahedron.modelViewMatrix, translation);
        
     var flag = true;
     octahedron.update = function()
     {
         var now = Date.now();
         var deltat = now - this.currentTime;
         this.currentTime = now;
         var fract = deltat / duration;
         var angle = Math.PI * 2 * fract;
     
         // Rotates a mat4 by the given angle
         // mat4 out the receiving matrix
         // mat4 a the matrix to rotate
         // Number rad the angle to rotate the matrix by
         // vec3 axis the axis to rotate around
         mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);

         if (flag) {
            mat4.translate(this.modelViewMatrix, this.modelViewMatrix, [0.0, 15.0*fract, 0]);
            if (this.modelViewMatrix[13]>4) 
              flag = false;
          } else{
            mat4.translate(this.modelViewMatrix, this.modelViewMatrix, [0.0, -15.0*fract, 0]);
            if (this.modelViewMatrix[13]<-4)
              flag = true;
}
     };
     
     return octahedron;
}

function createDodeca(gl, translation, rotationAxis){
    
    var vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    rho = 1.6;

    var verts = [

        //1
        0.86,3.12, 0.0, //a
        3.34, 3.12, 0.0, //b
        4.11, 5.48, 0.0, //c
        2.1, 6.94, 0.0, //d
        0.09, 5.48, 0, //e

        //2
        0.86,3.12,0.0, //a
        3.34, 3.12, 0.0, //b
        4.11, 2.07, 2.11,//f
        2.1, 1.41, 3.41, //k
        0.09, 2.07, 2.11, //j
        

        //3   ----
        0.09,2.07, 2.11, //j
        -1.15, 3.77, 3.41, //O
        0.09, 4.17, 5.52, //t
        2.1, 2.72, 5.52, //p
        2.1, 1.41, 3.41, //k
       

        //4
        4.11, 2.07, 2.11, //f
        5.35, 3.77, 3.41, //L
        4.11, 4.17, 5.52, //q
        2.1, 2.72, 5.52, //p
        2.1, 1.41, 3.41, //k
        
        

        //5
        3.34, 3.12, 0.0, //b
        4.11, 5.48, 0.0, //c
        5.35, 5.88, 2.11, //G
        5.35, 3.77, 3.41, //L
        4.11, 2.07, 2.11,//f
        
        
       
        //6
        0.86,3.12,0.0, //a
        0.09, 5.48, 0, //e
        -1.15, 5.88, 2.11, //I
        -1.15, 3.77, 3.41, //O
        0.09,2.07, 2.11, //j
        
        

        //7
        -1.15, 5.88, 2.11, //I
        0.09, 7.59, 3.41, //N
        0.86, 6.53, 5.52, //S
        0.09, 4.17, 5.52, //t
        -1.15, 3.77, 3.41, //O
        


        //8
        2.1, 6.94, 0.0, //d
        2.1, 8.24, 2.11, //H
        0.09, 7.59, 3.41, //N
        -1.15, 5.88, 2.11, //I
        0.09, 5.48, 0, //e
        

        //9
        4.11, 5.48, 0.0, //c
        5.35, 5.88, 2.11, //G
        4.11, 7.59, 3.41, //M
        2.1, 8.24, 2.11, //H
        2.1, 6.94, 0.0, //d

        //10
        2.1, 2.72, 5.52, //p
        4.11, 4.17, 5.52, //q
        3.34, 6.53, 5.52, //r
        0.86, 6.53, 5.52, //S
        0.09, 4.17, 5.52, //t
        

        //11  
        5.35, 5.88, 2.11, //G
        5.35, 3.77, 3.41, //L
        4.11, 4.17, 5.52, //q
        3.34, 6.53, 5.52, //r
        4.11, 7.59, 3.41, //M
        

        //12 
        2.1, 8.24, 2.11, //H
        4.11, 7.59, 3.41, //M
        3.34, 6.53, 5.52, //r
        0.86, 6.53, 5.52, //S
        0.09, 7.59, 3.41, //N
        
        
    
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    // Color data
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var faceColors = [

        [1.0, 1.0, 0.0, 1.0], //1
        [0.5, 0.0, 0.0, 1.0], //2
        [0.0, 0.5, 0.0, 1.0], //3
        [1.0, 0.0, 1.0, 1.0], //4
        [0.6, 0.5, 0.1, 1.0], //5
        [0.0, 0.0, 0.0, 0.5], //6       
        [0.0, 1.0, 1.0, 1.0], //7
        [0.0, 0.0, 0.5, 1.0], //8
        [0.1, 0.3, 0.2, 1.0], //9
        [1.0, 0.0, 0.0, 1.0], //10
        [0.0, 1.0, 0.0, 1.0], //11
        [0.0, 0.0, 1.0, 1.0], //12

    ];
    var vertexColors = [];

    for (const color of faceColors) 
    {
        for (var j=0; j < 5; j++)
            vertexColors = vertexColors.concat(color);
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    var dodecahedronIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, dodecahedronIndexBuffer);
    var dodecahedronIndices = [
        
        //1
        0, 1, 2,    
        0, 2, 3,    
        0, 3, 4, 
        //2
        5, 6, 7,
        5, 7, 8,
        5, 8, 9,
        //3
        10, 11, 12,
        10, 12, 13,
        10, 13, 14,
        //4
        15, 16, 17,
        15, 17, 18,
        15, 18, 19,
        //5
        20, 21, 22, 
        20, 22, 23, 
        20, 23, 24,
        //6
        25, 26, 27,
        25, 27, 28, 
        25, 28, 29,
        //7
        30, 31, 32,
        30, 32, 33, 
        30, 33, 34,
        //8
        35, 36, 37,
        35, 37, 38,
        35, 38, 39,
        //9
        40, 41, 42,
        40, 42, 43,
        40, 43, 44,
        //10
        45, 46, 47,
        45, 47, 48,
        45, 48, 49,
        //11
        50, 51, 52, 
        50, 52, 53,
        50, 53, 54,
        //12
        55, 56, 57,
        55, 57, 58,
        55, 58, 59,
    ];

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(dodecahedronIndices), gl.STATIC_DRAW);
    
    var dodecahedron = {
            buffer:vertexBuffer, colorBuffer:colorBuffer, indices:dodecahedronIndexBuffer,
            vertSize:3, nVerts:vertexBuffer.length, colorSize:4, nColors: faceColors.length, nIndices:dodecahedronIndices.length,
            primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()};

    mat4.translate(dodecahedron.modelViewMatrix, dodecahedron.modelViewMatrix, translation);


    dodecahedron.update = function()
    {
        var now = Date.now();
        var deltat = now - this.currentTime;
        this.currentTime = now;
        var fract = deltat / duration;
        var angle = Math.PI * 2 * fract;
    
        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around

        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);          
    };
    
    return dodecahedron;
}