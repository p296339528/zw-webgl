/**
 * @author arodic / https://github.com/arodic
 */
/*jshint sub:true*/

(function() {

    'use strict';

    var GizmoMaterial = function(parameters) {

        THREE.MeshBasicMaterial.call(this);

        this.depthTest = false;
        this.depthWrite = false;
        // this.side = THREE.FrontSide;
        this.side = THREE.DoubleSide;
        this.transparent = true;

        this.setValues(parameters);

        this.oldColor = this.color.clone();
        this.oldOpacity = this.opacity;

        this.highlight = function(highlighted) {

            if (highlighted) {

                this.color.setRGB(255, 255, 255);
                this.opacity = 1;

            } else {

                this.color.copy(this.oldColor);
                this.opacity = this.oldOpacity;

            }

        };

    };

    GizmoMaterial.prototype = Object.create(THREE.MeshBasicMaterial.prototype);
    GizmoMaterial.prototype.constructor = GizmoMaterial;

    var GizmoSpriteMaterial = function(parameters) {

        THREE.SpriteMaterial.call(this);

        this.depthTest = false;
        // this.depthWrite = false;
        this.setValues(parameters);
        this.oldMap = this.map;
        this.highMap = THREE.ImageUtils.loadTexture("images/" + parameters.asix + "_hover.png");
        this.highlight = function(highlighted) {

            if (highlighted) {

                // this.color.setRGB( 1, 1, 0 );

                this.map = this.highMap;
                // }
                // console.log("s");
                // this.map=

            } else {

                // this.color.copy( this.oldColor );
                this.map = this.oldMap;

            }

        };

    };

    GizmoSpriteMaterial.prototype = Object.create(THREE.SpriteMaterial.prototype);
    GizmoSpriteMaterial.prototype.constructor = GizmoSpriteMaterial;

    var GizmoLineMaterial = function(parameters) {

        THREE.LineBasicMaterial.call(this);

        this.depthTest = false;
        this.depthWrite = false;
        this.transparent = true;
        this.linewidth = 1;

        this.setValues(parameters);

        this.oldColor = this.color.clone();
        this.oldOpacity = this.opacity;

        this.highlight = function(highlighted) {

            if (highlighted) {

                this.color.setRGB(255, 255, 255);
                this.opacity = 1;

            } else {

                this.color.copy(this.oldColor);
                this.opacity = this.oldOpacity;

            }

        };

    };

    GizmoLineMaterial.prototype = Object.create(THREE.LineBasicMaterial.prototype);
    GizmoLineMaterial.prototype.constructor = GizmoLineMaterial;


    var pickerMaterial = new GizmoMaterial({ visible: false, transparent: false });


    THREE.TransformGizmo = function() {

        var scope = this;

        this.init = function() {

            THREE.Object3D.call(this);

            this.handles = new THREE.Object3D();
            this.pickers = new THREE.Object3D();
            this.planes = new THREE.Object3D();

            this.add(this.handles);
            this.add(this.pickers);
            this.add(this.planes);

            //// PLANES

            var planeGeometry = new THREE.PlaneBufferGeometry(50, 50, 2, 2);
            var planeMaterial = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });

            var planes = {
                "XY": new THREE.Mesh(planeGeometry, planeMaterial),
                "YZ": new THREE.Mesh(planeGeometry, planeMaterial),
                "R": new THREE.Mesh(planeGeometry, planeMaterial),
                "XZ": new THREE.Mesh(planeGeometry, planeMaterial),
                "XYZE": new THREE.Mesh(planeGeometry, planeMaterial)
            };

            this.activePlane = planes["XYZE"];

            // planes[ "YZ" ].rotation.set( 0, Math.PI / 2, 0 );
            planes["XZ"].rotation.set(-Math.PI / 2, 0, 0);
            planes["R"].rotation.set(-Math.PI / 2, 0, 0);

            for (var i in planes) {

                planes[i].name = i;
                this.planes.add(planes[i]);
                this.planes[i] = planes[i];

            }

            //// HANDLES AND PICKERS

            var setupGizmos = function(gizmoMap, parent) {

                for (var name in gizmoMap) {

                    for (i = gizmoMap[name].length; i--;) {

                        var object = gizmoMap[name][i][0];
                        var position = gizmoMap[name][i][1];
                        var rotation = gizmoMap[name][i][2];


                        object.name = name;

                        if (position) object.position.set(position[0], position[1], position[2]);
                        if (rotation) object.rotation.set(rotation[0], rotation[1], rotation[2]);

                        parent.add(object);

                    }

                }

            };

            setupGizmos(this.handleGizmos, this.handles);
            setupGizmos(this.pickerGizmos, this.pickers);

            // reset Transformations

            this.traverse(function(child) {

                if (child instanceof THREE.Mesh) {

                    child.updateMatrix();

                    var tempGeometry = child.geometry.clone();
                    tempGeometry.applyMatrix(child.matrix);
                    child.geometry = tempGeometry;

                    child.position.set(0, 0, 0);
                    child.rotation.set(0, 0, 0);
                    child.scale.set(1, 1, 1);

                }

            });

        };

        this.highlight = function(axis) {

            this.traverse(function(child) {

                if (child.material && child.material.highlight) {

                    if (child.name === axis) {

                        child.material.highlight(true);

                    } else {

                        child.material.highlight(false);

                    }

                }

            });

        };

    };

    THREE.TransformGizmo.prototype = Object.create(THREE.Object3D.prototype);
    THREE.TransformGizmo.prototype.constructor = THREE.TransformGizmo;

    THREE.TransformGizmo.prototype.update = function(rotation, eye) {
        // console.log(rotation);

        var vec1 = new THREE.Vector3(0, 0, 0);
        var vec2 = new THREE.Vector3(0, 1, 0);
        var lookAtMatrix = new THREE.Matrix4();

        this.traverse(function(child) {

            if (child.name.search("E") !== -1) {

                child.quaternion.setFromRotationMatrix(lookAtMatrix.lookAt(eye, vec1, vec2));

            } else if (child.name.search("X") !== -1 || child.name.search("Y") !== -1 || child.name.search("Z") !== -1) {

                child.quaternion.setFromEuler(rotation);

            }

        });

    };

    THREE.TransformGizmoTranslate = function() {

        THREE.TransformGizmo.call(this);
        var that = this;
        var arrowGeometry = new THREE.Geometry();
        var mesh = new THREE.Mesh(new THREE.CylinderGeometry(0, 0.06, 0.20, 12, 1, false));
        mesh.position.y = 0.5;
        mesh.updateMatrix();

        arrowGeometry.merge(mesh.geometry, mesh.matrix);

        var planeYGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 12, 1);
        // var meshplane = new THREE.Mesh( new THREE.CylinderGeometry(0.07,0.07,1,12,1));
        // meshplane.position.y = 0.5;
        // meshplane.updateMatrix();
        // planeYGeometry.merge( meshplane.geometry, meshplane.matrix );

        var lineXGeometry = new THREE.BufferGeometry();
        lineXGeometry.addAttribute('position', new THREE.Float32Attribute([0, 0, 0, 1, 0, 0], 3));

        var lineYGeometry = new THREE.BufferGeometry();
        lineYGeometry.addAttribute('position', new THREE.Float32Attribute([0, 0, 0, 0, 1, 0], 3));


        var lineZGeometry = new THREE.BufferGeometry();
        lineZGeometry.addAttribute('position', new THREE.Float32Attribute([0, 0, 0, 0, 0, 1], 3));
        //----------------------
        var texture = THREE.ImageUtils.loadTexture("images/XZ.png");
        texture.needsUpdate = true;

        var spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        // spriteMaterial.transparent=1;
        // spriteMaterial.depthTest=false;
        //{ map: texture, useScreenCoordinates: false} );
        var sprite = new THREE.Sprite(new GizmoSpriteMaterial({ map: texture, asix: "XZ" }));
        sprite.scale.set(0.5, 0.5, 0.5);

        // var arrowtexture=THREE.ImageUtils.loadTexture("images/jttop.png");
        // var arrowSprite=new THREE.Sprite( new THREE.SpriteMaterial( { map: arrowtexture,depthTest:false,transparent:1} ) );
        // arrowSprite.scale.set(0.3,0.3,0.3);


        var torusGeometry = new THREE.TorusGeometry(0.7, 0.07, 64, 100);
        // var tubeMesh=new Mesh();

        var rotatetexture = THREE.ImageUtils.loadTexture("images/R.png");
        // var rotateSprite=new THREE.Sprite( new THREE.SpriteMaterial( { map: rotatetexture,depthTest:false,transparent:1} ) );
        var rotateSprite = new THREE.Sprite(new GizmoSpriteMaterial({ map: rotatetexture, asix: "R" }));
        rotateSprite.scale.set(1.6, 1.6, 1.6);
        //----------------------
        //显示用
        this.handleGizmos = {

            // X: [
            // 	[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0xff0000 } ) ), [ 0.5, 0, 0 ], [ 0, 0, - Math.PI / 2 ] ],
            // 	[ new THREE.Line( lineXGeometry, new GizmoLineMaterial( { color: 0xff0000 } ) ) ]
            // ],ffffff

            Y: [
                [new THREE.Mesh(arrowGeometry, new GizmoMaterial({ color: 0xb7bab4, opacity: 0.75 })), [0, 0.5, 0]],
                // [ arrowSprite, [ 0, 1, 0 ] ]
                [new THREE.Mesh(planeYGeometry, new GizmoMaterial({ color: 0xb7bab4, opacity: 0.75 })), [0, 0.8, 0]]
            ],

            // Z: [
            // 	[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0x0000ff } ) ), [ 0, 0, 0.5 ], [ Math.PI / 2, 0, 0 ] ],
            // 	[ new THREE.Line( lineZGeometry, new GizmoLineMaterial( { color: 0x0000ff } ) ) ]
            // ],



            // XY: [
            // 	[ new THREE.Mesh( new THREE.PlaneBufferGeometry( 0.29, 0.29 ), new GizmoMaterial( { color: 0xffff00, opacity: 0.25 } ) ), [ 0.15, 0.15, 0 ] ]
            // ],

            // YZ: [
            // 	[ new THREE.Mesh( new THREE.PlaneBufferGeometry( 0.29, 0.29 ), new GizmoMaterial( { color: 0x00ffff, opacity: 0.25 } ) ), [ 0, 0.15, 0.15 ], [ 0, Math.PI / 2, 0 ] ]
            // ],
            R: [
                [rotateSprite, [0, 0.001, 0],
                    [Math.PI / 2, 0, 0]
                ]
                // [ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0xb7bab4,opacity: 0.75 } ) ), [ 0.8, 0, 0 ] ,[Math.PI / 2, 0, 0]],

            ],

            XZ: [
                // [ new THREE.Mesh( new THREE.PlaneBufferGeometry( 0.29, 0.29 ), new GizmoMaterial( { color: 0xff00ff, opacity: 0.25 } ) ), [ 0, 0, 0 ], [ - Math.PI / 2, 0, 0 ] ]
                // [ new THREE.Mesh(new THREE.CircleGeometry(0.3, 50),new GizmoMaterial({opacity:0.25,color: 0xc2c2c2})), [ 0, 0, 0 ], [  -Math.PI / 2, 0, 0 ] ]
                [sprite, [0, 0, 0],
                    [0, 0, 0]
                ]
            ]

        };
        //操作用 
        this.pickerGizmos = {

            // X: [
            // 	[ new THREE.Mesh( new THREE.CylinderBufferGeometry( 0.2, 0, 1, 4, 1, false ), pickerMaterial ), [ 0.6, 0, 0 ], [ 0, 0, - Math.PI / 2 ] ]
            // ],

            Y: [
                [new THREE.Mesh(new THREE.CylinderBufferGeometry(0.1, 0.03, 0.6, 4, 1, false), pickerMaterial), [0, 0.8, 0]]
                // [ arrowSprite, [ 0, 1.2, 0 ] ]
            ],

            // Z: [
            // 	[ new THREE.Mesh( new THREE.CylinderBufferGeometry( 0.2, 0, 1, 4, 1, false ), pickerMaterial ), [ 0, 0, 0.6 ], [ Math.PI / 2, 0, 0 ] ]
            // ],



            // XY: [
            // 	[ new THREE.Mesh( new THREE.PlaneBufferGeometry( 0.4, 0.4 ), pickerMaterial ), [ 0.2, 0.2, 0 ] ]
            // ],

            // YZ: [
            // 	[ new THREE.Mesh( new THREE.PlaneBufferGeometry( 0.4, 0.4 ), pickerMaterial ), [ 0, 0.2, 0.2 ], [ 0, Math.PI / 2, 0 ] ]
            // ],//自定义圆环new GizmoMaterial()
            R: [
                [new THREE.Mesh(torusGeometry, pickerMaterial), [0, 0.1, 0],
                    [Math.PI / 2, 0, 0]
                ]
            ],
            XZ: [
                // [ new THREE.Mesh( new THREE.PlaneBufferGeometry( 0.4, 0.4 ), pickerMaterial ), [ 0, 0, 0 ], [ - Math.PI / 2, 0, 0 ] ]
                // [ new THREE.Mesh( new THREE.CircleGeometry(0.35, 50), new GizmoMaterial({opacity:0.25,color: 0xc2c2c2}) ), [ 0, 0, 0 ], [ - Math.PI / 2, 0, 0 ] ]
                [sprite, [0, 0, 0],
                    [0, 0, 0]
                ]
            ]

        };

        this.setActivePlane = function(axis, eye) {

            var tempMatrix = new THREE.Matrix4();
            eye.applyMatrix4(tempMatrix.getInverse(tempMatrix.extractRotation(this.planes["XY"].matrixWorld)));

            if (axis === "X") {

                this.activePlane = this.planes["XY"];

                if (Math.abs(eye.y) > Math.abs(eye.z)) this.activePlane = this.planes["XZ"];

            }

            if (axis === "Y") {

                this.activePlane = this.planes["XY"];

                if (Math.abs(eye.x) > Math.abs(eye.z)) {
                    this.activePlane = this.planes["YZ"];
                    // console.log("YZ");
                }
                // this.activePlane.material.visible=true;

            }

            if (axis === "Z") {

                this.activePlane = this.planes["XZ"];

                if (Math.abs(eye.x) > Math.abs(eye.y)) this.activePlane = this.planes["YZ"];

            }
            if (axis === "R") {

                this.activePlane = this.planes["R"];
                // this.planes[ "R" ].material.visible=true;

                // if ( Math.abs( eye.y ) > Math.abs( eye.z ) ) this.activePlane = this.planes[ "XZ" ];

            }

            if (axis === "XYZ") this.activePlane = this.planes["XYZE"];

            if (axis === "XY") this.activePlane = this.planes["XY"];

            if (axis === "YZ") this.activePlane = this.planes["YZ"];

            if (axis === "XZ") {
                this.activePlane = this.planes["XZ"];
                // this.planes[ "XZ" ].material.visible=true;
            }

        };

        this.init();

    };

    THREE.TransformGizmoTranslate.prototype = Object.create(THREE.TransformGizmo.prototype);
    THREE.TransformGizmoTranslate.prototype.constructor = THREE.TransformGizmoTranslate;





    THREE.TransformControls = function(camera, domElement) {

        // TODO: Make non-uniform scale and rotate play nice in hierarchies
        // TODO: ADD RXYZ contol

        THREE.Object3D.call(this);

        domElement = (domElement !== undefined) ? domElement : document;

        this.object = undefined;
        this.visible = false;
        this.translationSnap = null;
        this.rotationSnap = null;
        this.space = "world";
        this.size = 2;
        this.axis = null;

        // this.dragging=false;

        var scope = this;

        var _mode = "translate";
        var _dragging = false;
        var _plane = "XY";
        var _gizmo = {

            "translate": new THREE.TransformGizmoTranslate()

        };

        var _downed = false;

        for (var type in _gizmo) {

            var gizmoObj = _gizmo[type];

            gizmoObj.visible = (type === _mode);
            this.add(gizmoObj);

        }

        var changeEvent = { type: "change" };
        var mouseDownEvent = { type: "mouseDown" };
        var mouseUpEvent = { type: "mouseUp", mode: _mode };
        var objectChangeEvent = { type: "objectChange" };

        var ray = new THREE.Raycaster();
        var pointerVector = new THREE.Vector2();

        var point = new THREE.Vector3();
        var offset = new THREE.Vector3();

        var rotation = new THREE.Vector3();
        var offsetRotation = new THREE.Vector3();
        var scale = 1;

        var lookAtMatrix = new THREE.Matrix4();
        var eye = new THREE.Vector3();

        var tempMatrix = new THREE.Matrix4();
        var tempVector = new THREE.Vector3();
        var tempQuaternion = new THREE.Quaternion();
        var unitX = new THREE.Vector3(1, 0, 0);
        var unitY = new THREE.Vector3(0, 1, 0);
        var unitZ = new THREE.Vector3(0, 0, 1);

        var quaternionXYZ = new THREE.Quaternion();
        var quaternionX = new THREE.Quaternion();
        var quaternionY = new THREE.Quaternion();
        var quaternionZ = new THREE.Quaternion();
        var quaternionE = new THREE.Quaternion();

        var oldPosition = new THREE.Vector3();
        var oldScale = new THREE.Vector3();
        var oldRotationMatrix = new THREE.Matrix4();

        var parentRotationMatrix = new THREE.Matrix4();
        var parentScale = new THREE.Vector3();

        var worldPosition = new THREE.Vector3();
        var worldRotation = new THREE.Euler();
        var worldRotationMatrix = new THREE.Matrix4();
        var camPosition = new THREE.Vector3();
        var camRotation = new THREE.Euler();

        domElement.addEventListener("mousedown", onPointerDown, false);
        domElement.addEventListener("touchstart", onPointerDown, false);

        domElement.addEventListener("mousemove", onPointerHover, false);
        domElement.addEventListener("touchmove", onPointerHover, false);

        domElement.addEventListener("mousemove", onPointerMove, false);
        domElement.addEventListener("touchmove", onPointerMove, false);

        domElement.addEventListener("mouseup", onPointerUp, false);
        domElement.addEventListener("mouseout", onPointerUp, false);
        domElement.addEventListener("touchend", onPointerUp, false);
        domElement.addEventListener("touchcancel", onPointerUp, false);
        domElement.addEventListener("touchleave", onPointerUp, false);

        this.dispose = function() {

            domElement.removeEventListener("mousedown", onPointerDown);
            domElement.removeEventListener("touchstart", onPointerDown);

            domElement.removeEventListener("mousemove", onPointerHover);
            domElement.removeEventListener("touchmove", onPointerHover);

            domElement.removeEventListener("mousemove", onPointerMove);
            domElement.removeEventListener("touchmove", onPointerMove);

            domElement.removeEventListener("mouseup", onPointerUp);
            domElement.removeEventListener("mouseout", onPointerUp);
            domElement.removeEventListener("touchend", onPointerUp);
            domElement.removeEventListener("touchcancel", onPointerUp);
            domElement.removeEventListener("touchleave", onPointerUp);

        };

        this.attach = function(object) {

            this.object = object;
            this.visible = true;
            this.update();

        };

        this.detach = function() {

            this.object = undefined;
            this.visible = false;
            this.axis = null;

        };

        this.setDrag = function(flag) {
            _dragging = flag;
            // scope.dragging=flag;
        }

        this.getMode = function() {

            return _mode;

        };

        this.setMode = function(mode) {

            _mode = mode ? mode : _mode;

            if (_mode === "scale") scope.space = "local";

            for (var type in _gizmo) _gizmo[type].visible = (type === _mode);

            this.update();
            scope.dispatchEvent(changeEvent);

        };

        this.setTranslationSnap = function(translationSnap) {

            scope.translationSnap = translationSnap;

        };

        this.setRotationSnap = function(rotationSnap) {

            scope.rotationSnap = rotationSnap;

        };

        this.setSize = function(size) {

            scope.size = size;
            this.update();
            scope.dispatchEvent(changeEvent);

        };

        this.setSpace = function(space) {

            scope.space = space;
            this.update();
            scope.dispatchEvent(changeEvent);

        };

        this.update = function() {

            if (scope.object === undefined) return;

            scope.object.updateMatrixWorld();
            // if (scope.object.type == "Group") {
            // 	worldPosition.setFromMatrixPosition(scope.object.children[0].matrixWorld);
            // 	worldRotation.setFromRotationMatrix(tempMatrix.extractRotation(scope.object.children[0].matrixWorld));
            // } else {
            // 	worldPosition.setFromMatrixPosition(scope.object.matrixWorld);
            // 	worldRotation.setFromRotationMatrix(tempMatrix.extractRotation(scope.object.matrixWorld));
            // }
            worldPosition.setFromMatrixPosition(scope.object.matrixWorld);
            worldRotation.setFromRotationMatrix(tempMatrix.extractRotation(scope.object.matrixWorld));

            camera.updateMatrixWorld();
            camPosition.setFromMatrixPosition(camera.matrixWorld);
            camRotation.setFromRotationMatrix(tempMatrix.extractRotation(camera.matrixWorld));

            scale = worldPosition.distanceTo(camPosition) / 6 * scope.size;
            this.position.copy(worldPosition);
            this.scale.set(0.8, 0.8, 0.8);

            eye.copy(camPosition).sub(worldPosition).normalize();

            // scope.
            if (scope.space === "local") {

                _gizmo[_mode].update(worldRotation, eye);

            } else if (scope.space === "world") {

                _gizmo[_mode].update(new THREE.Euler(), eye);

            }

            _gizmo[_mode].highlight(scope.axis);
            
            // scope.dragging=_dragging;

        };

        function onPointerHover(event) {

            if (scope.object === undefined || _dragging === true || (event.button !== undefined && event.button !== 0)) return;

            var pointer = event.changedTouches ? event.changedTouches[0] : event;

            var intersect = intersectObjects(pointer, _gizmo[_mode].pickers.children);

            var axis = null;

            if (intersect) {

                axis = intersect.object.name;
                // var map=intersect.object.material.map;
                // if(axis=="XZ" || axis=="R"){

                // 	intersect.object.material.map=THREE.TextureLoader("images/"+axis+"_hover.png");
                // }

                event.preventDefault();

            }

            if (scope.axis !== axis) {

                scope.axis = axis;
                scope.update();
                scope.dispatchEvent(changeEvent);

            }

        }

        function onPointerDown(event) {



            if (scope.object === undefined || _dragging === true || (event.button !== undefined && event.button !== 0)) return;

            var pointer = event.changedTouches ? event.changedTouches[0] : event;

            if (pointer.button === 0 || pointer.button === undefined) {

                var intersect = intersectObjects(pointer, _gizmo[_mode].pickers.children);

                if (intersect) {
                    // console.log("Transform--intersect---down");

                    event.preventDefault();
                    event.stopPropagation();

                    scope.dispatchEvent(mouseDownEvent);

                    scope.axis = intersect.object.name;
                    // console.log(scope.axis);
                    scope.update();

                    eye.copy(camPosition).sub(worldPosition).normalize();

                    _gizmo[_mode].setActivePlane(scope.axis, eye);

                    var planeIntersect = intersectObjects(pointer, [_gizmo[_mode].activePlane]);
                    // console.log(planeIntersect);
                    if (planeIntersect) {
                        // console.log("Transform--plane---down");
                        oldPosition.copy(scope.object.position);

                        oldScale.copy(scope.object.scale);

                        oldRotationMatrix.extractRotation(scope.object.matrix);
                        worldRotationMatrix.extractRotation(scope.object.matrixWorld);

                        parentRotationMatrix.extractRotation(scope.object.parent.matrixWorld);
                        parentScale.setFromMatrixScale(tempMatrix.getInverse(scope.object.parent.matrixWorld));

                        offset.copy(planeIntersect.point);
                        _downed = true;
                    }

                }

            }

            _dragging = true;
            // scope.dragging=true;

        }
        var mx = 0,
            my = 0;


        function onPointerMove(event) {
            var IEx, IEy;
            // console.log('move');
            if (scope.object === undefined || scope.axis === null || _dragging === false || (event.button !== undefined && event.button !== 0)) return;

            var pointer = event.changedTouches ? event.changedTouches[0] : event;

            var planeIntersect = intersectObjects(pointer, [_gizmo[_mode].activePlane]);

            if (planeIntersect === false || _downed === false) return;

            event.preventDefault();
            event.stopPropagation();

            point.copy(planeIntersect.point);

            if (_mode === "translate") {

                point.sub(offset);
                point.multiply(parentScale);

                if (scope.space === "local") {

                    point.applyMatrix4(tempMatrix.getInverse(worldRotationMatrix));

                    if (scope.axis.search("X") === -1) point.x = 0;
                    if (scope.axis.search("Y") === -1) point.y = 0;
                    if (scope.axis.search("Z") === -1) point.z = 0;

                    point.applyMatrix4(oldRotationMatrix);

                    scope.object.position.copy(oldPosition);
                    scope.object.position.add(point);

                }

                if (scope.space === "world" || scope.axis.search("XYZ") !== -1) {
                    // point.y = 0;
                    if (scope.axis.search("X") === -1) point.x = 0;
                    if (scope.axis.search("Y") === -1) point.y = 0;
                    if (scope.axis.search("Z") === -1) point.z = 0;

                    if (scope.axis.search("R") !== -1) {
                        // console.log(pointer.movementX,pointer.movementY);
                        // console.log(pointer.movementX);
                        if (!pointer.movementX) {
                            IEx = pointer.screenX - mx;
                            IEy = pointer.screenY - my;
                        }
                        // var xxx = pointer.screenX - mx;


                        mx = pointer.screenX;
                        my = pointer.screenY;

                        if (Math.abs(pointer.movementY || IEy) > Math.abs(pointer.movementX || IEx)) {
                            scope.object.rotateOnAxis(new THREE.Vector3(0, 1, 0), (Math.PI / 180) * (pointer.movementY || IEy));
                        } else {
                            scope.object.rotateOnAxis(new THREE.Vector3(0, 1, 0), (Math.PI / 180) * (pointer.movementX || IEx));
                        }
                    }
                    point.applyMatrix4(tempMatrix.getInverse(parentRotationMatrix));

                    scope.object.position.copy(oldPosition);
                    // if(point.y>1){
                    // 	point.y-=0.5;
                    // }
                    // if(point.y<-1){
                    // 	point.y+=0.5;
                    // }
                    // console.log(point);

                    scope.object.position.add(point);
                    // console.log(oldPosition,scope.object.position,point);

                }

                if (scope.translationSnap !== null) {

                    if (scope.space === "local") {

                        scope.object.position.applyMatrix4(tempMatrix.getInverse(worldRotationMatrix));

                    }

                    if (scope.axis.search("X") !== -1) scope.object.position.x = Math.round(scope.object.position.x / scope.translationSnap) * scope.translationSnap;
                    if (scope.axis.search("Y") !== -1) scope.object.position.y = Math.round(scope.object.position.y / scope.translationSnap) * scope.translationSnap;
                    if (scope.axis.search("Z") !== -1) scope.object.position.z = Math.round(scope.object.position.z / scope.translationSnap) * scope.translationSnap;

                    if (scope.space === "local") {

                        scope.object.position.applyMatrix4(worldRotationMatrix);

                    }

                }

            }

            // console.log(scope.object.rotation);

            scope.update();
            scope.dispatchEvent(changeEvent);
            scope.dispatchEvent(objectChangeEvent);
            // console.log(scope.object);


        }

        function onPointerUp(event) {

            if (event.button !== undefined && event.button !== 0) return;

            if (_dragging && (scope.axis !== null)) {

                mouseUpEvent.mode = _mode;
                scope.dispatchEvent(mouseUpEvent)

            }

            _dragging = false;
            // scope.dragging=false;
            // console.log("transup",scope.dragging);
            _downed = false;
            onPointerHover(event);

        }

        function intersectObjects(pointer, objects) {

            var rect = domElement.getBoundingClientRect();
            var x = (pointer.clientX - rect.left) / rect.width;
            var y = (pointer.clientY - rect.top) / rect.height;

            pointerVector.set((x * 2) - 1, -(y * 2) + 1);
            ray.setFromCamera(pointerVector, camera);

            var intersections = ray.intersectObjects(objects, true);
            return intersections[0] ? intersections[0] : false;

        }

    };

    THREE.TransformControls.prototype = Object.create(THREE.Object3D.prototype);
    THREE.TransformControls.prototype.constructor = THREE.TransformControls;

}());