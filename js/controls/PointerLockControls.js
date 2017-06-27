/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.PointerLockControls = function ( camera ) {

	var scope = this;
	var center = new THREE.Vector3();
	var normalMatrix = new THREE.Matrix3();
	camera.rotation.set( 0, 0, 0 );

	var pitchObject = new THREE.Object3D();
	pitchObject.add( camera );

	var yawObject = new THREE.Object3D();
	yawObject.position.y = 10;
	yawObject.add( pitchObject );

	var PI_2 = Math.PI / 2;

	var onMouseMove = function ( event ) {

		if ( scope.enabled === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		yawObject.rotation.y -= movementX * 0.002;
		pitchObject.rotation.x -= movementY * 0.002;

		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

	};
	var onMouseWheel=function( event ) {

			event.preventDefault();

			// if ( scope.enabled === false ) return;

			var delta = 0;

			if ( event.wheelDelta ) {

				// WebKit / Opera / Explorer 9

				delta = - event.wheelDelta;

			} else if ( event.detail ) {

				// Firefox

				delta = event.detail * 10;

			}

			zoom( new THREE.Vector3( 0, 0, delta ) );

	};
	function zoom( delta ) {

		var distance = camera.position.distanceTo( center );

		delta.multiplyScalar( distance * 0.001 );

		if ( delta.length() > distance ) return;

		delta.applyMatrix3( normalMatrix.getNormalMatrix( camera.matrix ) );

		camera.position.add( delta );

		

	};

	this.dispose = function() {

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mousewheel', onMouseWheel, false );

	};

	document.addEventListener( 'mousemove', onMouseMove, false );
	document.addEventListener( 'mousewheel', onMouseWheel, false );

	this.enabled = false;

	this.getObject = function () {

		return yawObject;

	};

	this.getDirection = function() {

		// assumes the camera itself is not rotated

		var direction = new THREE.Vector3( 0, 0, - 1 );
		var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );

		return function( v ) {

			rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );

			v.copy( direction ).applyEuler( rotation );

			return v;

		};

	}();

};
