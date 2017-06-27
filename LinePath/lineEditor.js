// scene global variables
var renderer, scene, controls;
var container;
var activeCamera;
var cameraPerspective, cameraOrtho;

var dibanObjects = []; //相交对象
var isAddPoint = false; //是否开始绘制点
var isDowned=false;
var isDraged=false;

var mouse = {
    x: 1,
    y: 1
};
var raycaster = new THREE.Raycaster();
var boxGeometry, boxMaterial;
var bbox, points = [];
var WIDTH, HEIGHT, minWIDTH, minHEIGHT;
var TYPE = "2D";
var offset={};

// axisHelper.position.z=50;
function setup() {

    // set up all the 3D objects in the scene
    createScene();
    drawFrame(0);
    getExhibitionHallInfo();
    getPointInfo();
    animate();

}

var onProgress = function(xhr) {
    if (xhr.lengthComputable) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        drawFrame(Math.round(percentComplete, 2));
        // console.log(Math.round(percentComplete,2));
        if (Math.round(percentComplete, 2) >= 100) {
            $(".loading").hide();
        }
    }

}

function createScene() {
    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
    }

    // set the scene size
    WIDTH = $(".cont").width(); // window.innerWidth,
    HEIGHT = $(".cont").height(); // window.innerHeight;
    // var WIDTH=596,HEIGHT=596;

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor(0x343d56);
    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.setSize(WIDTH, HEIGHT);
    container = document.getElementById('pathCanvas');

    container.appendChild(renderer.domElement);

    // Environment camera
    scene = new THREE.Scene();

    cameraPerspective = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 0.01, 200000);
    // 正交相机--left, right, top, bottom, near, far

    // cameraOrtho = new THREE.OrthographicCamera(WIDTH/-zoom,WIDTH/zoom,HEIGHT/zoom,HEIGHT/-zoom,-200000,200000);

    // cameraOrtho.zoom=20;
    // cameraOrtho.updateProjectionMatrix();

    activeCamera = cameraPerspective.clone();
    // camera = new THREE.CombinedCamera( WIDTH / 2, HEIGHT / 2, 60, 0.01, 1000, - 50000, 30000 );
    // activeCamera.position.set(0, 28, 0);
    // camera.position.set(0, 28, 0);
    // camera.lookAt(new THREE.Vector3(0, 0, 0));
    // camera.toOrthographic();
    // camera.toTopView();
    // camera.setFov( 2.5 );
    // camera.setLens( 105 );
    //Axis Helper
    // var axes = new THREE.AxisHelper(30);
    // scene.add(axes);
    // controls = new THREE.OrbitControls(activeCamera,renderer.domElement);
    // controls.noRotate=true;
    // controls.rotateSpeed=0.5;
    // controls.staticMoving=true;
    // controls.noZoom=false;
    // controls.keyPanSpeed=1;

    boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    boxMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        opacity: 0.5,
        transparent: true
    });

    // mbox = new THREE.Mesh(boxGeometry, boxMaterial);
    // scene.add(mbox);
    // EVENTS
    THREEx.WindowResize(renderer, activeCamera, "cont");

    // STATS
    // stats = new Stats();
    // stats.domElement.style.position = 'absolute';
    // stats.domElement.style.top = '0px';
    // stats.domElement.style.zIndex = 100;
    // container.appendChild(stats.domElement);

    // Light
    // directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    // directionalLight.position.set(0, 5, -5);
    // scene.add(directionalLight);

    // directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    // directionalLight.position.set(-5, 5, 5);
    // scene.add(directionalLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 10, 0);
    scene.add(directionalLight);

    var ambienlLight = new THREE.AmbientLight(0xffffff, 0.6);
    ambienlLight.position.set(0, 0, 0);
    scene.add(ambienlLight);

    //单独监听canvas点击事件---区分canvas点击和div点击
    renderer.domElement.addEventListener('mousedown', onCanvasMouseDown, false);


    renderer.domElement.addEventListener('mousemove', onCanvasMouseMove, false);

    renderer.domElement.addEventListener('mouseup', onCanvasMouseUp, false);
    offset=$("#pathCanvas").offset();

}

/**
 * 根据方案guid获取展厅详情
 * @return {[type]} [description]
 */
function getExhibitionHallInfo() {
    var param = "SchemeGuid=" + GetQueryString("guid");
    $.ajax({
        url:'../data/HallInfo.json',
        // url: config.hostUrl + '/api/WebApi/GetExhibitionHallBySchemeGuid',
        type: 'GET',
        // data: param,
        dataType: 'json',
        success: function(data) {
            // data = $.parseJSON(data);
            if (data != null) {
                loadModel(data.ModelUrl);
            }

        },
        error: function() {

        }
    });
}

function loadModel(path) {
    var index = path.lastIndexOf("\/"); //最后一个/分隔
    var pathFront = path.substr(0, index + 1); //setPath
    var pathBehind = path.substr(index + 1);
    var filename = pathBehind.substr(0, pathBehind.lastIndexOf("."));
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setCrossOrigin('');
    mtlLoader.setPath(pathFront);
    mtlLoader.load(filename + '_wugai.mtl', function(materials) {
        materials.preload();

        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath(pathFront);
        objLoader.load(filename + '_wugai.obj', function(object) {
            scene.add(object);

            var box3 = new THREE.Box3().setFromObject(object);
            var size = box3.size();
            // object.scale.set(0.85, 0.85, 0.85);

            var minsize = (size.x > size.z ? size.x : size.z) * 28;
            var minHeight = (minsize > HEIGHT ? HEIGHT : minsize);
            minHEIGHT = minHeight;
            minWIDTH = size.x * minHeight / size.z;

            if(minWIDTH>WIDTH){
                minWIDTH=WIDTH;
                minHEIGHT=size.z * minWIDTH / size.x;
            }

            // console.log(WIDTH,minWIDTH,HEIGHT,minHEIGHT);

            // renderer.setViewport(0, 0, minWIDTH, minHEIGHT);
            renderer.setViewport(0.5*(WIDTH - minWIDTH),0.5*(HEIGHT - minHEIGHT), minWIDTH, minHEIGHT);

            cameraOrtho = new THREE.OrthographicCamera(-size.x / 2,
                size.x / 2,
                size.z / 2, -size.z / 2, -5000,
                5000);
            activeCamera = cameraOrtho.clone();
            activeCamera.up = new THREE.Vector3(0, 0, -1);
            activeCamera.lookAt(new THREE.Vector3(0, -1, 0));
            activeCamera.position.y = 28;
            // scene.add(mapCamera);
            controls = new THREE.OrbitControls(activeCamera, renderer.domElement);
            controls.noRotate = true;
            controls.maxZoom = 1;

        }, onProgress);


    });
    //对应地板模型加载
    // var mtlLoader1 = new THREE.MTLLoader();
    // mtlLoader1.setCrossOrigin('');
    // mtlLoader1.setPath(pathFront+"diban/");
    // mtlLoader1.load('diban.mtl', function(materials) {
    //   materials.preload();
    var objLoader = new THREE.OBJLoader();
    // objLoader.setMaterials(materials);
    objLoader.setPath(pathFront + "diban/");
    objLoader.load('diban.obj', function(object) {
        // object.scale.set(0.85, 0.85, 0.85);//与模型的缩放比要保持一致
        dibanObjects.push(object); //AllObject
        // scene.add(object);
    });

    // });


    //对应地板模型加载
    // var objLoader = new THREE.OBJLoader();
    // objLoader.setPath('../models/wugai/');
    // objLoader.load('diban.obj', function(object) {
    //   dibanObjects.push(object); //AllObject

    // });
}



/**
 * 开始绘制点
 * @return {[type]} [description]
 */
function startAddPoint() {
    isAddPoint = true;
}

function onCanvasMouseUp(event){
    if (isAddPoint && !isDraged) {
        var intersects = raycaster.intersectObjects(dibanObjects, true);

        if (intersects.length > 0) {
            var click = intersects[0];
            // scene.remove(bbox);

            bbox = new THREE.Mesh(boxGeometry, boxMaterial);
            bbox.name = "point";
            scene.add(bbox);
            bbox.position.copy(click.point);

            points.push(click.point);
            $("#deletelx,#savelx").removeClass("disabled");
            if (points.length > 1) {
                dragCurve();
            }


        }
        // renderer.domElement.addEventListener('mousemove', onCanvasMouseMove, false);


    }
    isDraged=false;
    isDowned=false;
}

function onCanvasMouseDown(event) {
    event.preventDefault();


    isDowned=true;
    // renderer.domElement.addEventListener('mouseup', onCanvasMouseUp, false);
}


/**
 * 绘制线路-曲线
 * @param  {Boolean} isAuto 自动绘制
 * @return {[type]}         [description]
 */
function dragCurve(arrPoints) {
    disposeNode(scene.getObjectByName("curve"));
    //加入第一个点
    // newpoints.push(newpoints[0]);
    var curve;
    if (arrPoints) {
        curve = new THREE.CatmullRomCurve3(arrPoints);
    } else {
        curve = new THREE.CatmullRomCurve3(points)
    }
    var geometry = new THREE.Geometry();
    geometry.vertices = curve.getPoints(50);
    // geometry.vertices=points;
    var material = new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 2,
        depthTest: false

    });
    var splineObject = new THREE.Line(geometry, material);
    splineObject.name = "curve";
    scene.add(splineObject);
    // if (!isAuto) {
    //   placeEnd();
    // }
}

function animate() {

    requestAnimationFrame(animate);
    TWEEN.update();
    // update();
    // stats.update();
    if (controls) {
        controls.update();
    }

    render();
    //time = Date.now();

}

function swichmodel(type) {
    TYPE = type;
    //根据相机类型切换模型
    // controls=null;
    // if (activeCamera instanceof THREE.PerspectiveCamera) {
    if (type == "2D") {
        //过渡效果
        var tween = new TWEEN.Tween(activeCamera.position)
            .to({
                y: 22,
                z: 0
            }, 1600)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onComplete(function() {
                activeCamera = cameraOrtho.clone();
                controls = new THREE.OrbitControls(activeCamera, renderer.domElement);
                controls.enableRotate = false;
                activeCamera.position.set(0, 28, 0);
                renderer.setViewport(0.5*(WIDTH - minWIDTH),0.5*(HEIGHT - minHEIGHT), minWIDTH, minHEIGHT);
            })
            .start();

    } else {
        activeCamera = cameraPerspective.clone(); //三维切换
        controls = new THREE.OrbitControls(activeCamera, renderer.domElement);
        activeCamera.position.y = 20;
        renderer.setViewport(0, 0, WIDTH, HEIGHT) //三维时切换回全区域渲染
            //过渡效果
        var tween = new TWEEN.Tween(activeCamera.position)
            .to({
                y: 25,
                z: 10
            }, 1600)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();
    }

}




function onCanvasMouseMove(event) {
    event.preventDefault();
    if(TYPE == "2D"){
        // console.log(WIDTH,minWIDTH,HEIGHT,minHEIGHT);
        // mouse.x = ((event.clientX -offset.left-0.5*(WIDTH - minWIDTH)) / minWIDTH) * 2 - 1;
        mouse.x = ((event.clientX -offset.left-0.5*(WIDTH - minWIDTH)) / minWIDTH) * 2 - 1;
        mouse.y = -(event.clientY-offset.top-0.5*(HEIGHT - minHEIGHT)) / minHEIGHT * 2 + 1;

    }else{
        mouse.x = ((event.clientX -offset.left) / WIDTH) * 2 - 1;
        mouse.y = -(event.clientY-offset.top) / HEIGHT * 2 + 1;
        
        if (isDowned && (Math.abs(event.movementY)>1 || Math.abs(event.movementX)>1)) {
            isDraged=true;
        }
    }
    
    
    raycaster.setFromCamera(mouse, activeCamera);

}

/**
 * 清空路线点
 * @return {[type]} [description]
 */
function clearPoint() {
    disposeNode(scene.getObjectByName("curve"));
    disposeNodeByName("point");
    points = [];
    isAddPoint = false;
    $("#deletelx,#savelx").addClass("disabled");
}

/**
 * 保存路线
 * @return {[type]} [description]
 */
function savePoint(options) {
    var position =""; //.replace(/\"/g, "'");
    
    //调整点顺序
    // console.log(points);
    if (points.length != 0){
        var tempArr=[];
        for (var i = points.length - 1; i >= 0; i--) {
            tempArr.push(points.pop());
        }
        position=JSON.stringify(tempArr);
        // console.log(tempArr);
    }

    var param = "SchemeGuid=" + GetQueryString("guid") + "&Name=" + options.Name + "&Position=" + position;
    if (options.Guid) {
        param += "&Guid=" + options.Guid;
    }
    $.ajax({
        url: config.hostUrl + '/api/WebApi/SavePathLineInfo',
        data: param + "&rnd=" + new Date().getMilliseconds(),
        type: 'POST',
        // cache: true,
        dataType: 'json',
        success: function(data) {
            // data = $.parseJSON(data);
            // var str = "";
            layer.msg("<span style=\"color:#fff\">" + data + "</span>");
            getPointInfo();
            clearPoint();
        },
        error: function() {

        }
    });

}

function getPointInfo() {
    var param = "SchemeGuid=" + GetQueryString("guid");
    $.ajax({
        url:'../data/PathLine.json',
        // url: config.hostUrl + '/api/WebApi/GetPathLineInfo',
        // data: param + "&rnd=" + new Date().getMilliseconds(),
        type: 'GET',
        // cache: true,
        dataType: 'json',
        success: function(data) {
            // data = $.parseJSON(data);
            if (data == null) {
                $(".lxlist ul").html("");
                return;
            }
            // var position = $.parseJSON(data.Position);
            var str = "";
            var pointsData = [];
            for (var i = 0; i < data.length; i++) {
                str += "<li guid=\"" + data[i].Guid + "\">";
                str += "<input type=\"text\" value=\"" + data[i].Name + "\"  readonly=\"readonly\" ></input>";
                str += "<div class=\"editdelete\"><i class=\"edit\" title=\"编辑\"></i><i class=\"delete\" title=\"删除\"></i></div>";
                str += "<div class=\"savecancel\"><i class=\"save\" title=\"保存\"></i><i class=\"cancel\" title=\"取消\"></i></div>";
                str += "</li>";
                var points = objectToVertor3($.parseJSON(data[i].Position));
                pointsData.push(points);
            }
            // console.log(data);
            $(".lxlist ul").html(str);

            $(".lxlist li").mouseover(function(event) {
                if (!isAddPoint) {
                    var index = $(this).index();
                    dragCurve(pointsData[index]);
                }

            }).mouseout(function(event) {

                if (!isAddPoint) {
                    clearPoint();
                }
            });
        },
        error: function() {

        }
    });
}


function deletePath(lxguid) {
    var param = "=" + lxguid;
    $.ajax({
        url: config.hostUrl + '/api/WebApi/DeletePathLineInfo',
        data: param + "&rnd=" + new Date().getMilliseconds(),
        type: 'POST',
        // cache: true,
        dataType: 'json',
        success: function(data) {
            layer.msg("<span style=\"color:#fff\">" + data + "</span>");
            getPointInfo();
            clearPoint();
        },
        error: function() {

        }
    });
}


// 将point转换成Vertor3对象
function objectToVertor3(positions) {
    var points = [];
    if(positions){
        for (var i = positions.length - 1; i >= 0; i--) {
            var point = positions[i];
            points.push(new THREE.Vector3(point.x, point.y, point.z));
            // position[i].constructor=new THREE.Vector3().prototype;
        }
    }
    
    return points;
}


function render() {
    // log(activeCamera.position);
    if (activeCamera) {
        renderer.render(scene, activeCamera);
    }

}

/**
 * 获取Url参数
 * @param {[type]} name [description]
 */
function GetQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return unescape(r[2]);
        return null;
    }
}


function disposeNodeByName(name) {
    for (var i = scene.children.length - 1; i >= 0; i--) {
        var child = scene.children[i];
        if (child.name == name) {
            disposeNode(child);
        }
    }
}
/*
释放内存
 */
function disposeNode(node) {
    if (node instanceof THREE.Mesh || node instanceof THREE.Sprite || node instanceof THREE.Line) {
        scene.remove(node);
        // node.mesh.dispose()
        if (node.geometry) {
            node.geometry.dispose();
        }

        if (node.material) {
            if (node.material instanceof THREE.MeshFaceMaterial) {
                $.each(node.material.materials, function(idx, mtrl) {
                    if (mtrl.map) mtrl.map.dispose();
                    if (mtrl.lightMap) mtrl.lightMap.dispose();
                    if (mtrl.bumpMap) mtrl.bumpMap.dispose();
                    if (mtrl.normalMap) mtrl.normalMap.dispose();
                    if (mtrl.specularMap) mtrl.specularMap.dispose();
                    if (mtrl.envMap) mtrl.envMap.dispose();

                    mtrl.dispose(); // disposes any programs associated with the material
                });
            } else {
                if (node.material.map) node.material.map.dispose();
                if (node.material.lightMap) node.material.lightMap.dispose();
                if (node.material.bumpMap) node.material.bumpMap.dispose();
                if (node.material.normalMap) node.material.normalMap.dispose();
                if (node.material.specularMap) node.material.specularMap.dispose();
                if (node.material.envMap) node.material.envMap.dispose();

                node.material.dispose(); // disposes any programs associated with the material
            }
        }
    }
}

function log(p) {
    console.log("X:" + p.x + "," + "Y:" + p.y + "," + "Z:" + p.z);
}