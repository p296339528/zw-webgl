/**
 * @author pzw / http://mrdoob.com/
 * @time 2016-08-25
 */

THREE.FirstPersonControls = function ( object, domElement ) {

	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// API

	// Set to false to disable this control
	this.enabled = true;

	this.movedState=false;

	//"target" sets the location of focus
	this.target = new THREE.Vector3();

	this.cameraDirection=new THREE.Vector3();

	this.relateMesh=[];//new THREE.Mesh( directgeometry, new THREE.MeshBasicMaterial( {color:0xffffff,side:THREE.DoubleSide,transparent:true,opacity:0.5} ));

	// Limits to how far you can look
	// zoom 限制缩放--通过控制相机Fov属性
	this.noZoom = false;
	this.zoomSpeed=1;
	this.minFov = 50;//55
	this.maxFov = 85;

	// Set to move speed
	this.movementSpeed = 1.0;
	this.lookSpeed = 0.4;

	this.heightMin = 0.0;
	this.heightMax = 1.0;
	//set camare position.y
	this.CameraPostionY=10;

	// Limits to  you can look vertical  限制仰视、俯视
	this.lookVertical = true;
	this.constrainVertical = false;
	this.verticalMin = 0;
	this.verticalMax = Math.PI;


	// Set to true to disable use of the keys
	this.noKeys = false;
	// The arrow keys
	this.keys = { LEFT: 37, FORWARD: 38, RIGHT: 39, BACK: 40 ,A: 65,S: 83,W: 87,D: 68};
	this.moveForward = false;
	this.moveBackward = false;
	this.moveLeft = false;
	this.moveRight = false;

	this.lockMoveForward = false;
	this.lockMoveBackward = false;
	this.lockMoveLeft = false;
	this.lockMoveRight = false;

	this.lat = 0;
	this.lon = 0;
	this.phi = 0;
	this.theta = 0;

	// for reset

	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();


	// internals
	var scope = this;
	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();
	
	this.getVectorDelta=function(){
		return rotateDelta;
	}

	//update the camare position
	this.updatePosition=function(delta){
		if ( !this.enabled ) {
			return;
		}
		

		var actualMoveSpeed = delta * this.movementSpeed;
		if ( this.moveForward && this.lockMoveForward) {
			this.object.translateZ( -actualMoveSpeed );
			// console.log("up");
			this.update();
		}
		if ( this.moveBackward && this.lockMoveBackward) {
			this.object.translateZ(  actualMoveSpeed );
			// console.log("down");
			this.update();
		}
		if ( this.moveLeft && this.lockMoveLeft) {
			this.object.translateX( - actualMoveSpeed );
			// console.log("left");
			this.update();
		}
		if ( this.moveRight && this.lockMoveRight) {
			this.object.translateX( actualMoveSpeed );
			// console.log("right");
			this.update();
		}
		// this.update();//朝向不受行路方向影响
	};

	this.update = function() {
		if ( !this.enabled ) {
			return;
		}

		var actualLookSpeed = 1 * this.lookSpeed;

		var verticalLookRatio = 1;

		if ( this.constrainVertical ) {

			verticalLookRatio = Math.PI / ( this.verticalMax - this.verticalMin );

		}

		this.lon += rotateDelta.x * actualLookSpeed;
		
		if( this.lookVertical ) {
			this.lat -= rotateDelta.y * actualLookSpeed * verticalLookRatio;
		}
		
		this.lat = Math.max( - 85, Math.min( 85, this.lat ) );

		// console.log(this.lat+","+rotateDelta.y);
		this.phi = THREE.Math.degToRad( 90 - this.lat );

		this.theta = THREE.Math.degToRad( this.lon );

		if ( this.constrainVertical ) {

			this.phi = THREE.Math.mapLinear( this.phi, 0, Math.PI, this.verticalMin, this.verticalMax );

		}

		var targetPosition = this.target;
		var	position = this.object.position;

		position.y=this.CameraPostionY;
		// position.y=THREE.Math.clamp( scope.object.fov, this.CameraPostionY, this.CameraPostionY+1000 );
		targetPosition.x = position.x + 1 * Math.sin( this.phi ) * Math.cos( this.theta );
		targetPosition.y = position.y + 1 * Math.cos( this.phi );
		targetPosition.z = position.z + 1 * Math.sin( this.phi ) * Math.sin( this.theta );

		this.object.lookAt( targetPosition );
		// console.log("X:"+position.x+","+targetPosition.x);
		// console.log("Y:"+position.y+","+targetPosition.y);
		// console.log("Z:"+","+position.z+","+targetPosition.z);
		// console.log("lon:"+","+this.lon+",lat:"+this.lat);
		// console.log("----------------------------------------------");
		rotateDelta.x=0;
		rotateDelta.y=0;
		updateCameraDirection();

	};

	function updateCameraDirection(){
		scope.cameraDirection = scope.target.clone().sub(scope.object.position.clone());
	}

	function onMouseWheel(event){

		if ( scope.enabled === false || scope.noZoom === true) return;
		event.preventDefault();
		var delta=0;
        if ( event.wheelDelta !== undefined) { // WebKit / Opera / Explorer 9

            delta = event.wheelDelta;

        } else if ( event.detail !== undefined) { // Firefox

            delta = - event.detail;

        }

        if ( delta > 0 ) {//缩小

            scope.object.fov -= scope.zoomSpeed;

        } else {//放大

            scope.object.fov += scope.zoomSpeed;

        }
        var tempFov=scope.object.fov;
        scope.object.fov = THREE.Math.clamp( scope.object.fov, scope.minFov, scope.maxFov );

        scope.object.updateProjectionMatrix();
        if(tempFov>scope.maxFov || tempFov<scope.minFov) return;
        disposeNode(scope.relateMesh[0]);
        scope.relateMesh=[];
        var thetaLength=scope.object.fov*Math.PI/180;
        var thetaStart=3*Math.PI/2-thetaLength/2;
        var directgeometry=new THREE.CircleGeometry(5,10,thetaStart,thetaLength);
		var mesh  = new THREE.Mesh( directgeometry, new THREE.MeshBasicMaterial( {color:0xffffff,side:THREE.DoubleSide,transparent:true,opacity:0.5} ));
		scene.add(mesh);
		scope.relateMesh.push(mesh);
		// directmesh.position.copy(camera.position);
		// directmesh.position.y = 15;
		scope.relateMesh[0].rotation.x = Math.PI / 2;
		tempFov="";
	}

	function onMouseDown ( event ) {
		if ( scope.domElement !== document ) {

			scope.domElement.focus();

		}
		// if ( scope.enabled === false ) return;

		event.preventDefault();
		if ( event.button === 0 ) {

			rotateStart.set( event.clientX, event.clientY );
		}

		scope.domElement.addEventListener( 'mousemove', onMouseMove, false );
		scope.domElement.addEventListener( 'mouseup', onMouseUp, false );

	}

	function onMouseMove ( event ) {

		// if ( scope.enabled === false ) return;

		event.preventDefault();
		if (event.button === 0 ) {
			if(event.movementX!=0 && event.movementY!=0){
				scope.movedState=true;
			}
			
			rotateEnd.set( event.clientX, event.clientY );
			rotateDelta.subVectors( rotateEnd, rotateStart );
			rotateStart.copy( rotateEnd );
			scope.update();
		}

	}

	function onMouseUp ( event ) {

		// if ( scope.enabled === false ) return;
		event.preventDefault();
		event.stopPropagation();

		scope.domElement.removeEventListener( 'mousemove', onMouseMove, false );
		scope.domElement.removeEventListener( 'mouseup', onMouseUp, false );

	}

	function onKeyDown ( event ) {

		if ( scope.enabled === false || scope.noKeys === true) return;
		// event.preventDefault();

		switch ( event.keyCode ) {

			case scope.keys.FORWARD: /*up*/
			case scope.keys.W: /*W*/  scope.moveForward = true; break;

			case scope.keys.LEFT: /*left*/
			case scope.keys.A: /*A*/ scope.moveLeft = true; break;

			case scope.keys.BACK: /*down*/
			case scope.keys.S: /*S*/ scope.moveBackward = true; break;

			case scope.keys.RIGHT: /*right*/
			case scope.keys.D: /*D*/ scope.moveRight = true; break;

		}
		// console.log(event.keyCode);
		ToolManager.closeOperate();
		if(event.keyCode!=16){
			layer.closeAll();
		}
		if(RenderManager.isAutoProcess()){
			RenderManager.stopAutoRender();
		}
		// RenderManager.stopAutoRender();
	}

	function onKeyUp ( event ) {

		if ( scope.enabled === false || scope.noKeys === true) return;
		// event.preventDefault();
		switch( event.keyCode ) {

			case scope.keys.FORWARD: /*up*/
			case scope.keys.W: /*W*/  scope.moveForward = false; break;

			case scope.keys.LEFT: /*left*/
			case scope.keys.A: /*A*/ scope.moveLeft = false; break;

			case scope.keys.BACK: /*down*/
			case scope.keys.S: /*S*/ scope.moveBackward = false; break;

			case scope.keys.RIGHT: /*right*/
			case scope.keys.D: /*D*/ scope.moveRight = false; break;

		}
	}

	function disposeNode(node) {
		if (node instanceof THREE.Mesh) {
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

	this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
	this.domElement.addEventListener( 'mousedown', onMouseDown, false );
	this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
	this.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox
	// this.domElement.addEventListener( 'keydown',onKeyDown , false );
	// this.domElement.addEventListener( 'keyup', onKeyUp , false );

	window.addEventListener( 'keydown', onKeyDown, false );
	window.addEventListener( 'keyup', onKeyUp, false );

};

