# 三维小球弹性碰撞
基于webGL的小球弹性碰撞demo

演示地址：<a href="http://htmlpreview.github.io/?https://github.com/wisdomofgod/ball_elastic_collision/blob/master/index.html">http://htmlpreview.github.io/?https://github.com/wisdomofgod/ball_elastic_collision/blob/master/index.html</a>

二维小球地址：
<a href="https://github.com/wisdomofgod/ball_elastic_collision/tree/2d">https://github.com/wisdomofgod/ball_elastic_collision/tree/2d</a>

**小球弹性碰撞**：

- **小球设置** ：小球位置，速度，角度由random函数生成，其中角度由x，y, z轴速度控制, 所有小球等大小，显示的大小由距离屏幕远近决定，近大远小，；
- **小球颜色** ：小球颜色由小球所在位置计算得出，色值 = 小球位置 * 0.5， 同时增加由圆心向外的渐变效果；
- **小球碰撞** ：小球碰撞有小球撞击墙壁与撞击其他小球两种情况，有两个撞击的弹性参数决定反弹力。
 ![Alt text](./WechatIMG64.jpeg)
![Alt text](./WechatIMG63.jpeg)

-------------------

## 片段着色器

> 在顶点着色器中，设置v_color = gl_Position * 0.5;
> 在片段着色器中，首先因为我们要画圆球，所以判断一下当前插值的点跟球心的距离，插值的时候，是按方形进行插值的，我们只对距离小于等于半径的点进行着色，
> 如果距离小于半径，则设置颜色色值为 v_color + d - 0.2;（为了实现从圆心到边缘的颜色渐变)
> 
### 代码块
``` javascript
    <script id="2d-fragment-shader" type="x-shader/x-fragment">
        precision mediump float;
        varying vec4 v_color;

        void main() {
            gl_FragColor = v_color;

            float d = distance(gl_PointCoord, vec2(0.5,0.5));
            if (d < 0.5) {
                vec4 color = v_color + d - 0.2;
                gl_FragColor = color;
            } else { 
                discard;
            }
        }
    </script>
```

## 小球撞击墙体

> 小球撞击墙壁，在move函数中进行判断，如果撞击墙壁，则将撞击方向的速度 v * bounce （撞击墙壁弹性）
> 
### 代码块
``` javascript
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
        if (a.z < this.F) {
            a.z = this.F;
            a.vz *= this.bounce;
        }
        if (a.z > this.BACK) {
            a.z = this.BACK;
            a.vz *= this.bounce;
        }
    });
```

## 小球之间碰撞

> 首先通过两个小球之间的距离，如果距离小于等于小球直径，则两小球叠加
> 小球发生叠加时，计算三个平面上投影夹角。
> 首先是两个小球之间的连线在x0z上的投影, 投影的线段长度为 dx * dx + dz * dz 的开平方
>（投影上的线段点在x轴、z轴上的投影差值是，坐标系中,两点的x, z轴坐标差值
> 有了投影线段长后， 我们可以通过反余弦函数acos计算出x,z轴与投影线段的夹角
> 同时，做投影线段与真实线段的平面，投影点与真实点的高度差是两点坐标的y坐标差值
> 由此可以计算出投影的夹角
> 有了这三个夹角，我们就可以计算出，要将两小球分开的最短距离， 这一距离乘以小球间的弹性，得到小球分开的反向加速度。
> 将反向加速度加上小球的原有x, y, z轴速度。
> 由于速度值大于反向加速度值，所以小球将继续往里挤压直到速度方向与加速度方向一致后，加速分离。因此可以产生挤压弹开效果。
> 
### 代码块
``` javascript
    if (dist <= this.misDist) {
        //碰撞
        var angle, tx, ty, ax, ay;
        var long = Math.sqrt(dx * dx + dz * dz);
        var angle = Math.acos(dx / long);
        var angle2 = Math.acos(dz / long);
        var angle3 = Math.atan2(dy, long);
        long = Math.cos(angle3) * this.misDist;
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
```