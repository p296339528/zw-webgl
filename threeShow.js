var container;
var camera, controls, scene, renderer;

var manager = new THREE.LoadingManager();
manager.onLoad = function() {
	$("#loaderdiv").hide();
	// document.getElementById("loaderdiv").style.display="none"
};

var onProgress=function(xhr){
	if (xhr.lengthComputable) {
		var percentComplete = xhr.loaded / xhr.total * 100;
		// console.log(percentComplete);

		$("#bar")[0].style.width = Math.round(percentComplete, 2) + "%";
		$("#bar").html(Math.round(percentComplete, 2)+ "%");
		if(Math.round(percentComplete, 2)==100){
			$("#loaderdiv").hide();
		}
	}
}

// 参数说明
// near 最近面距离
// position 相机位置
// modelpath 模型路径

function init() {
	
	// light
	var ambienlLight = new THREE.AmbientLight( 0xffffff);
	
	//ambienlLight.position.set( 0, 0, 0 );
	scene.add( ambienlLight );

	//background
	var backgroundMesh;
	backgroundScene = new THREE.Scene();
	backgroundCamera = new THREE.Camera();
	var textureloader = new THREE.TextureLoader()
	textureloader.load('./images/bg.png', function(texture) {
			backgroundMesh = new THREE.Mesh(
					new THREE.PlaneGeometry(2, 2, 0),
					new THREE.MeshBasicMaterial({
							map: texture
					}));

			backgroundMesh.material.depthTest = false;
			backgroundMesh.material.depthWrite = false;
			backgroundScene.add(backgroundCamera);
			backgroundScene.add(backgroundMesh);
			


	});

	// renderer
	renderer = new THREE.WebGLRenderer({antialias: true,preserveDrawingBuffer: true});
	renderer.setClearColor(0xffffff, 1);
	renderer.setSize(window.innerWidth, window.innerHeight);
	container = document.getElementById( 'ThreeJS' );
	container.appendChild( renderer.domElement );
	window.addEventListener('resize', onWindowResize, false);
	animate();

}

// 获取展品详情信息
function getExhibitInfoByGuid() {
	var pGuid = GetQueryString("pGuid");
	var guid = GetQueryString("guid");
	var param = "SchemeGuid=" + pGuid + "&ExhibitGuid=" + guid;
	$.ajax({
		url:'data/ExhibtInfo.json',
		// url: config.hostUrl + '/api/WebApi/GetExhibitByGuid',
		// data: param + "&rnd=" + new Date().getMilliseconds(),
		type: 'GET',
		// cache: true,
		dataType: 'json',
		success: function(data) {
			// data = $.parseJSON(data);
			if (data == null) {
				return;
			}
			scene = new THREE.Scene();
			var index=data.ModelUrl.lastIndexOf("\/");//最后一个/分隔
			var pathBase=data.ModelUrl.substr(0,index+1);//setPath
			var pathBehind=data.ModelUrl.substr(index+1);
			var filename=pathBehind.substr(0,pathBehind.lastIndexOf("."));
			var fileExt=pathBehind.substr(pathBehind.lastIndexOf(".")+1);
			var opts={modelUrl:data.ModelUrl,baseUrl:pathBase,name:filename,callback:adjustSceneParam};
			if(fileExt=="js"){
				binaryLoader(opts);
			}else{
				objLoader(opts);
			}
			document.title=data.Title;
		},
		error: function() {

		}
	});
}



function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);

	controls.handleResize();

}

function animate() {

	requestAnimationFrame(animate);

	controls.update();

	renderer.autoClear = false;
	renderer.clear();
	renderer.render(backgroundScene,backgroundCamera)
	renderer.render(scene, camera);

}

// binary加载器
function binaryLoader(opts) {
    var binaryLoader = new THREE.BinaryLoader(manager);
    binaryLoader.setCrossOrigin('');
    binaryLoader.load(opts.modelUrl, function (geo, mtl) {
        var material = new THREE.MultiMaterial(mtl);
        var mesh = new THREE.Mesh(geo, material);
        scene.add(mesh);
        if(opts.callback){
        	opts.callback(mesh);
        }
    }, onProgress);
}

function objLoader(opts){
	var mtlLoader = new THREE.MTLLoader(manager);
	mtlLoader.setCrossOrigin('');
	// mtlLoader.setPath("http://124.202.158.212:8001/Zjbwg/ModelUrl/ztmx/zjsb/");
	mtlLoader.setPath(opts.baseUrl);
	mtlLoader.load(options.name+'.mtl', function(materials) {
		materials.preload();
		var objLoader = new THREE.OBJLoader(manager);
		objLoader.setMaterials(materials);
		objLoader.setPath(opts.baseUrl);
		objLoader.load(options.name+'.obj', function(object) {
			scene.add(object);
			if(opts.callback){
				opts.callback(object);
			}

		},onProgress);

	});
}

function adjustSceneParam(object){
	var box3=new THREE.Box3().setFromObject(object);
	var size=box3.size();
	var width=size.x;
	var height=(window.innerHeight /window.innerWidth)*width;
	if(height<size.y){
		height=size.y;
		width=(window.innerWidth /window.innerHeight)*height;
	}

	// //根据尺寸调整灯光位置
	// var dirLight1 = new THREE.DirectionalLight(0xffffff,1);
	// dirLight1.position.set(-size.x, size.y, size.z);
	// scene.add( dirLight1 );
	
	// var dirLight2 = new THREE.DirectionalLight(0xffffff,1);
	// dirLight2.position.set(-size.x, size.y, -size.z);
	// scene.add( dirLight2 );
	
	// var dirLight3 = new THREE.DirectionalLight(0xffffff,1);
	// dirLight3.position.set(size.x, -size.y, size.z);
	// scene.add( dirLight3 );
	
	// var dirLight4 = new THREE.DirectionalLight(0xffffff,1);
	// dirLight4.position.set(size.x, -size.y, -size.z);
	// scene.add( dirLight4 );
	
	var near=0.001*Math.min.apply(null, [size.x,size.y,size.z]);
	var far=10*Math.max.apply(null, [size.x,size.y,size.z]);
	camera = new THREE.PerspectiveCamera(60, window.innerWidth /window.innerHeight, near, far);
	// camera.updateProjectionMatrix(); //更新相机
	controls = new THREE.TrackballControls(camera);
	controls.rotateSpeed = 3.0;
	controls.zoomSpeed = 2;
	controls.panSpeed = 2;
	controls.noZoom = false;
	controls.noPan = false;
	controls.staticMoving = false;
	camera.position.set(0, 0, 1.5*height);


	controls.minDistance=0.5*height;
	controls.maxDistance=3*height;
	init();
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
