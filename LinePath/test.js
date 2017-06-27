// scene global variables
var renderer, scene,controls;
var container;
var activeCamera;
var cameraPerspective, cameraOrtho;

var dibanObjects = []; //相交对象
var isAddPoint=false;//是否开始绘制点

var mouse = {
  x: 1,
  y: 1
};
var raycaster=new THREE.Raycaster() ;



var boxGeometry, boxMaterial;
var bbox, points = [];
var AllObject = [];
var mbox ;

function setup() {

  // set up all the 3D objects in the scene 
  createScene();

  getExhibitionHallInfo();
  getPointInfo();
  animate();

}

function createScene() {
  if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
  }

  // set the scene size
  var WIDTH =$(".cont").width();// window.innerWidth,
    HEIGHT =$(".cont").height();// window.innerHeight;

  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setClearColor(0x343d56);
  // renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(WIDTH, HEIGHT);
  container = document.getElementById('pathCanvas');
  container.appendChild(renderer.domElement);

  // Environment camera
  scene = new THREE.Scene();

  cameraPerspective = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 0.01, 200000);
  // 正交相机--left, right, top, bottom, near, far
  var zoom=45;
  cameraOrtho = new THREE.OrthographicCamera(WIDTH/-zoom,WIDTH/zoom,HEIGHT/zoom,HEIGHT/-zoom,-200000,200000);

  // cameraOrtho.zoom=20;
  // cameraOrtho.updateProjectionMatrix();

  activeCamera=cameraOrtho.clone();
  // camera = new THREE.CombinedCamera( WIDTH / 2, HEIGHT / 2, 60, 0.01, 1000, - 50000, 30000 );
  activeCamera.position.set(0, 28, 0);
  // camera.position.set(0, 28, 0);
  // camera.lookAt(new THREE.Vector3(0, 0, 0));
  // camera.toOrthographic();
  // camera.toTopView();
  // camera.setFov( 2.5 );
  // camera.setLens( 105 );
  //Axis Helper
  // var axes = new THREE.AxisHelper(30);
  // scene.add(axes);
  controls = new THREE.OrbitControls(activeCamera,renderer.domElement);
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
  THREEx.WindowResize(renderer, activeCamera,"cont");

  // STATS
  // stats = new Stats();
  // stats.domElement.style.position = 'absolute';
  // stats.domElement.style.top = '0px';
  // stats.domElement.style.zIndex = 100;
  // container.appendChild(stats.domElement);

  // Light
  directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
  directionalLight.position.set(0, 5, -5);
  scene.add(directionalLight);

  directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
  directionalLight.position.set(-5, 5, 5);
  scene.add(directionalLight);

  directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  var ambienlLight = new THREE.AmbientLight(0xffffff, 0.6);
  ambienlLight.position.set(0, 0, 0);
  scene.add(ambienlLight);

  //单独监听canvas点击事件---区分canvas点击和div点击
  renderer.domElement.addEventListener('mousedown', onCanvasMouseDown, false);


  renderer.domElement.addEventListener('mousemove', onCanvasMouseMove, false);

}

/**
 * 根据方案guid获取展厅详情
 * @return {[type]} [description]
 */
function getExhibitionHallInfo(){
  $.ajax({
    url: 'http://124.202.158.212:8032/api/WebApi/GetExhibitionHallList',
    type: 'GET',
    cache: true,
    dataType: 'json',
    success: function(data) {
      data = $.parseJSON(data);
      var str = "";
      loadModel();
    },
    error: function() {

    }
  });
}

function loadModel() {

  var mtlLoader = new THREE.MTLLoader();
  //http://124.202.158.212:8001/Zjbwg/ModelUrl/%e5%b1%95%e5%8e%85%e6%a8%a1%e5%9e%8b%2fzjsb/zjsb.js
  mtlLoader.setCrossOrigin('');
  mtlLoader.setPath("http://124.202.158.212:8001/Zjbwg/ModelUrl/ztmx/wugai/");
  mtlLoader.load('zjsb.mtl', function(materials) {
    materials.preload();

    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath("http://124.202.158.212:8001/Zjbwg/ModelUrl/ztmx/wugai/");
    objLoader.load('zjsb.obj', function(object) {

      scene.add(object);
    });

    objLoader.load('diban.obj', function(object) {
      dibanObjects.push(object); //AllObject

    });

  });

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
function startAddPoint(){
  isAddPoint=true;
}

function onCanvasMouseDown(event) {
  event.preventDefault();

  if (isAddPoint) {
    var intersects = raycaster.intersectObjects(dibanObjects,true);

    if (intersects.length > 0) {
      var click = intersects[0];
      // scene.remove(bbox);
      bbox = new THREE.Mesh(boxGeometry, boxMaterial);
      bbox.name="point";
      scene.add(bbox);
      bbox.position.copy(click.point);

      points.push(click.point);
      if(points.length>1){
        dragCurve();
      }
      

    }
    // renderer.domElement.addEventListener('mousemove', onCanvasMouseMove, false);


  }
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
      curve=new THREE.CatmullRomCurve3(arrPoints);
    } else {
      curve=new THREE.CatmullRomCurve3(points)
    }
    var geometry = new THREE.Geometry();
    geometry.vertices = curve.getPoints(50);
    // geometry.vertices=points;
    var material = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth:2
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
  controls.update();
  render();
  //time = Date.now();

}

function swichmodel(type) {
  //根据相机类型切换模型
  controls=null;
  // if (activeCamera instanceof THREE.PerspectiveCamera) {
  if (type=="pm") {
    activeCamera = cameraOrtho.clone();
    controls = new THREE.OrbitControls(activeCamera, renderer.domElement);
    controls.enableRotate=false;
    activeCamera.position.set(0, 28, 0);
  } else {
    activeCamera = cameraPerspective.clone(); //三维切换
    controls = new THREE.OrbitControls(activeCamera, renderer.domElement);
    activeCamera.position.y = 20;
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

  var WIDTH =$(".cont").width();// window.innerWidth,
    HEIGHT =$(".cont").height();// window.innerHeight;

    mouse.x = (event.layerX / WIDTH) * 2 - 1;
    mouse.y = -(event.layerY / HEIGHT) * 2 + 1;

    raycaster.setFromCamera( mouse, activeCamera );

  }

  /**
   * 清空路线点
   * @return {[type]} [description]
   */
  function clearPoint(){
    disposeNode(scene.getObjectByName("curve"));
    disposeNodeByName("point");
    points=[];
    isAddPoint=false;
  }

/**
 * 保存路线
 * @return {[type]} [description]
 */
function savePoint() {
    var position = JSON.stringify(points);//.replace(/\"/g, "'");
    var param = "SchemeGuid=" + GetQueryString("guid") +  "&Name=线路" + "一" + "&Position="+position;
    $.ajax({
      url: 'http://124.202.158.212:8032/api/WebApi/SavePathLineInfo',
      data:param+"&rnd="+new Date().getMilliseconds(),
      type: 'POST',
      // cache: true,
      dataType: 'json',
      success: function(data) {
        // data = $.parseJSON(data);
        // var str = "";
        // console.log(data);
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
    url: 'http://124.202.158.212:8032/api/WebApi/GetPathLineInfo',
    data: param + "&rnd=" + new Date().getMilliseconds(),
    type: 'GET',
    // cache: true,
    dataType: 'json',
    success: function(data) {
      data = $.parseJSON(data);
      var position = $.parseJSON(data.Position);
      var str = "";
      // for (var i = 0; i < data.length; i++) {

      str += "<li>" + data.Name + "</li>";
      // }
      // var str = "";

      // console.log(data);
      $(".lxlist ul").html(str);
      // points=$.parseJSON(data.Position);//--将point转换成Vertor3对象
      var pointsData = [];
      for (var i = position.length - 1; i >= 0; i--) {
        var point = position[i];
        pointsData.push(new THREE.Vector3(point.x, point.y, point.z));
        // position[i].constructor=new THREE.Vector3().prototype;
      }
      $(".lxlist li").mouseover(function(event) {
        if (!isAddPoint) {
          dragCurve(pointsData);
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


  function render() {
    // log(activeCamera.position);
    renderer.render(scene,activeCamera);
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

function log(p) {
  console.log("X:" + p.x + "," + "Y:" + p.y + "," + "Z:" + p.z);
}
