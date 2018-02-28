"use strict";

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

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    gl.uniform1f(sizeUniformLocation, gl.canvas.width * this.radius);

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
        var size = 2; // 2 components per iteration
        var type = gl.FLOAT; // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0; // start at the beginning of the buffer
        gl.vertexAttribPointer(
            positionAttributeLocation, size, type, normalize, stride, offset)

        // Turn on the attribute
        gl.enableVertexAttribArray(positionAttributeLocation);

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
        var points = [];
        args.forEach(p => {
            points.push(p.x);
            points.push(p.y);
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
        var vx = 0.01 * Math.random();
        var vy = 0.01 * Math.random();
        this.balls.push({
            x,
            y,
            vx,
            vy
        });
    }

    hit() {
        for (var i = 0; i < this.balls.length - 1; i++) {
            for (var j = i + 1; j < this.balls.length; j++) {
                var ballA = this.balls[i],
                    ballB = this.balls[j];
                var dx = ballB.x - ballA.x;
                var dy = ballB.y - ballA.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= this.misDist) {
                    //碰撞
                    var angle, tx, ty, ax, ay;
                    angle = Math.atan2(dy, dx);
                    tx = ballA.x + Math.cos(angle) * this.misDist;
                    ty = ballA.y + Math.sin(angle) * this.misDist;
                    ax = (tx - ballB.x) * this.spring;
                    ay = (ty - ballB.y) * this.spring;
                    ballA.vx -= ax;
                    ballA.vy -= ay;
                    ballB.vx += ax;
                    ballB.vy += ay;
                }
            }
        }
    }

    move() {
      this.balls.forEach(a => {
        a.x += a.vx;
        a.y += a.vy;

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
    });
  }
}

var main = function () {
  return new Ball();
}