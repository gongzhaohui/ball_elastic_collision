"use strict";


function radToDeg(r) {
    return r * 180 / Math.PI;
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var translation = [45, 150, 0];
  var rotation = [degToRad(40), degToRad(25), degToRad(325)];
    var scale = [1, 1, 1];
  var color = [Math.random(), Math.random(), Math.random(), 1];

function initWebGL(animationFn) {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    // setup GLSL program
    var program = webglUtils.createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);

    // look up where the vertex data needs to go.
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var sizeUniformLocation = gl.getUniformLocation(program, 'u_size');
    var matrixLocation = gl.getUniformLocation(program, 'u_matrix');
    var fudgeLocation = gl.getUniformLocation(program, 'u_fudgeFactor');

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    gl.uniform1f(sizeUniformLocation, gl.canvas.width * this.radius);
    gl.uniform1f(fudgeLocation, 0.8);

    // Create a buffer.
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    requestAnimationFrame(drawScene.bind(this));

    // Draw the scene.
    function drawScene() {
        animationFn(setGeometry);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 3; // 2 components per iteration
        var type = gl.FLOAT; // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0; // start at the beginning of the buffer
        gl.vertexAttribPointer(
            positionAttributeLocation, size, type, normalize, stride, offset)

        // Turn on the attribute
        gl.enableVertexAttribArray(positionAttributeLocation);

        var matrix = m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400);
        matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
        matrix = m4.xRotate(matrix, rotation[0]);
        matrix = m4.yRotate(matrix, rotation[1]);
        matrix = m4.zRotate(matrix, rotation[2]);
        matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
        gl.uniformMatrix4fv(matrixLocation, false, matrix);

        // Draw the geometry.
        var offset = 0;
        var count = this.balls.length;

        gl.clearColor(0.1, 0.1, 0.1, 1);
        // Clear the canvas.
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, offset, count);

        requestAnimationFrame(drawScene.bind(this));
    }

    // Fill the buffer with the values that define a triangle.
    // Note, will put the values in whatever buffer is currently
    // bound to the ARRAY_BUFFER bind point
    function setGeometry(balls) {
        var points = setPoints(balls);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            points,
            gl.STATIC_DRAW);
    }

    // set points array
    function setPoints(args) {
        args.sort(function(a, b) {
            if (a.z < b.z) {
                return true;
            }
        });
        var points = [];
        args.forEach(p => {
            points.push(p.x);
            points.push(p.y);
            points.push(p.z);
        });
        return new Float32Array(points);
    }
}

class Ball {
    constructor() {
      this.balls = [];
      var radius = this.radius = 0.08;
      this.misDist = radius * 2;
      this.spring = 0.4; //弹性系数
      this.bounce = -0.9; //撞墙弹性系数
      this.ballNum = 20;
      this.L = -(1 - radius);
      this.R = (1 - radius);
      this.T = (1 - radius);
      this.B = -(1 - radius);
      this.F = -(0 - radius);
      this.BACK = (1 - radius);

      for (var i = 0; i < this.ballNum; i++) {
        this.createBall();
      }
      initWebGL.call(this, (setBalls) => {
        this.hit();
        this.move();
        setBalls(this.balls);
      });
    }

    createBall() {
        var x = 2 * Math.random() - 1;
        var y = 2 * Math.random() - 1;
        var z = 2 * Math.random() - 1;
        var vx = 0.01 * Math.random();
        var vy = 0.01 * Math.random();
        var vz = 0.01 * Math.random();
        this.balls.push({
            x,
            y,
            z,
            vx,
            vy,
            vz
        });
    }

    hit() {
        for (var i = 0; i < this.balls.length - 1; i++) {
            for (var j = i + 1; j < this.balls.length; j++) {
                var ballA = this.balls[i],
                    ballB = this.balls[j];
                var dx = ballB.x - ballA.x;
                var dy = ballB.y - ballA.y;
                var dz = ballB.z - ballA.z;
                var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist <= this.misDist) {
                    //碰撞
                    var angle, tx, ty, tz, ax, ay, az;
                    //angle = Math.atan2(dy, dx);
                    // tx = ballA.x + Math.cos(angle) * this.misDist;
                    // ty = ballA.y + Math.sin(angle) * this.misDist;
                    // ax = (tx - ballB.x) * this.spring;
                    // ay = (ty - ballB.y) * this.spring;
                    // ballA.vx -= ax;
                    // ballA.vy -= ay;
                    // ballB.vx += ax;
                    // ballB.vy += ay;
                    
                    var long1 = Math.sqrt(dx * dx + dz * dz);
                    var angle = Math.acos(dx / long1);
                    var angle2 = Math.acos(dz / long1);
                    var angle3 = Math.atan2(dy, long1);
                    var long = Math.cos(angle3) * this.misDist;
                    var wy = Math.sin(angle3) * this.misDist;
                    var wx = Math.cos(angle) * long;
                    var wz = Math.cos(angle2) * long;
                    tx = ballA.x + wx;
                    ty = ballA.y + wy;
                    tz = ballA.z + wz;

                    ax = (tx - ballB.x) * this.spring;
                    ay = (ty - ballB.y) * this.spring;
                    az = (tz - ballB.z) * this.spring;
                    ballA.vx -= ax;
                    ballA.vy -= ay;
                    ballA.vz -= az;
                    ballB.vx += ax;
                    ballB.vy += ay;
                    ballB.vz += az;
                }
            }
        }
    }

    move() {
      this.balls.forEach(a => {
        a.x += a.vx;
        a.y += a.vy;
        a.z += a.vz;

        if (a.x > this.R) {
            a.x = this.R;
            a.vx *= this.bounce;
        }
        if (a.x < this.L) {
            a.x = this.L;
            a.vx *= this.bounce;
        }
        if (a.y > this.T) {
            a.y = this.T;
            a.vy *= this.bounce;
        }
        if (a.y < this.B) {
            a.y = this.B;
            a.vy *= this.bounce;
        }
        if (a.z < this.F) {
            a.z = this.F;
            a.vz *= this.bounce;
        }
        if (a.z > this.BACK) {
            a.z = this.BACK;
            a.vz *= this.bounce;
        }
    });
  }
}

var main = function () {
  return new Ball();
}



var m4 = {

  projection: function(width, height, depth) {
    // Note: This matrix flips the Y axis so 0 is at the top.
    return [
       2 / width, 0, 0, 0,
       0, -2 / height, 0, 0,
       0, 0, 2 / depth, 0,
      -1, 1, 0, 1,
    ];
  },

  multiply: function(a, b) {
    var a00 = a[0 * 4 + 0];
    var a01 = a[0 * 4 + 1];
    var a02 = a[0 * 4 + 2];
    var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0];
    var a11 = a[1 * 4 + 1];
    var a12 = a[1 * 4 + 2];
    var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0];
    var a21 = a[2 * 4 + 1];
    var a22 = a[2 * 4 + 2];
    var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0];
    var a31 = a[3 * 4 + 1];
    var a32 = a[3 * 4 + 2];
    var a33 = a[3 * 4 + 3];
    var b00 = b[0 * 4 + 0];
    var b01 = b[0 * 4 + 1];
    var b02 = b[0 * 4 + 2];
    var b03 = b[0 * 4 + 3];
    var b10 = b[1 * 4 + 0];
    var b11 = b[1 * 4 + 1];
    var b12 = b[1 * 4 + 2];
    var b13 = b[1 * 4 + 3];
    var b20 = b[2 * 4 + 0];
    var b21 = b[2 * 4 + 1];
    var b22 = b[2 * 4 + 2];
    var b23 = b[2 * 4 + 3];
    var b30 = b[3 * 4 + 0];
    var b31 = b[3 * 4 + 1];
    var b32 = b[3 * 4 + 2];
    var b33 = b[3 * 4 + 3];
    return [
      b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
      b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
      b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
      b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
      b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
      b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
      b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
      b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
      b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
      b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
      b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
      b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
      b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
      b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
      b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
      b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
    ];
  },

  translation: function(tx, ty, tz) {
    return [
       1,  0,  0,  0,
       0,  1,  0,  0,
       0,  0,  1,  0,
       tx, ty, tz, 1,
    ];
  },

  xRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];
  },

  yRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  },

  zRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
       c, s, 0, 0,
      -s, c, 0, 0,
       0, 0, 1, 0,
       0, 0, 0, 1,
    ];
  },

  scaling: function(sx, sy, sz) {
    return [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ];
  },

  translate: function(m, tx, ty, tz) {
    return m4.multiply(m, m4.translation(tx, ty, tz));
  },

  xRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.xRotation(angleInRadians));
  },

  yRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.yRotation(angleInRadians));
  },

  zRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.zRotation(angleInRadians));
  },

  scale: function(m, sx, sy, sz) {
    return m4.multiply(m, m4.scaling(sx, sy, sz));
  },

};

// Fill the buffer with the values that define a letter 'F'.
function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // left column front
            0,   0,  0,
           30,   0,  0,
            0, 150,  0,
            0, 150,  0,
           30,   0,  0,
           30, 150,  0,

          // top rung front
           30,   0,  0,
          100,   0,  0,
           30,  30,  0,
           30,  30,  0,
          100,   0,  0,
          100,  30,  0,

          // middle rung front
           30,  60,  0,
           67,  60,  0,
           30,  90,  0,
           30,  90,  0,
           67,  60,  0,
           67,  90,  0,

          // left column back
            0,   0,  30,
           30,   0,  30,
            0, 150,  30,
            0, 150,  30,
           30,   0,  30,
           30, 150,  30,

          // top rung back
           30,   0,  30,
          100,   0,  30,
           30,  30,  30,
           30,  30,  30,
          100,   0,  30,
          100,  30,  30,

          // middle rung back
           30,  60,  30,
           67,  60,  30,
           30,  90,  30,
           30,  90,  30,
           67,  60,  30,
           67,  90,  30,

          // top
            0,   0,   0,
          100,   0,   0,
          100,   0,  30,
            0,   0,   0,
          100,   0,  30,
            0,   0,  30,

          // top rung right
          100,   0,   0,
          100,  30,   0,
          100,  30,  30,
          100,   0,   0,
          100,  30,  30,
          100,   0,  30,

          // under top rung
          30,   30,   0,
          30,   30,  30,
          100,  30,  30,
          30,   30,   0,
          100,  30,  30,
          100,  30,   0,

          // between top rung and middle
          30,   30,   0,
          30,   30,  30,
          30,   60,  30,
          30,   30,   0,
          30,   60,  30,
          30,   60,   0,

          // top of middle rung
          30,   60,   0,
          30,   60,  30,
          67,   60,  30,
          30,   60,   0,
          67,   60,  30,
          67,   60,   0,

          // right of middle rung
          67,   60,   0,
          67,   60,  30,
          67,   90,  30,
          67,   60,   0,
          67,   90,  30,
          67,   90,   0,

          // bottom of middle rung.
          30,   90,   0,
          30,   90,  30,
          67,   90,  30,
          30,   90,   0,
          67,   90,  30,
          67,   90,   0,

          // right of bottom
          30,   90,   0,
          30,   90,  30,
          30,  150,  30,
          30,   90,   0,
          30,  150,  30,
          30,  150,   0,

          // bottom
          0,   150,   0,
          0,   150,  30,
          30,  150,  30,
          0,   150,   0,
          30,  150,  30,
          30,  150,   0,

          // left side
          0,   0,   0,
          0,   0,  30,
          0, 150,  30,
          0,   0,   0,
          0, 150,  30,
          0, 150,   0]),
      gl.STATIC_DRAW);
}
