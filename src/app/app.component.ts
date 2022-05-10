import { Component, OnInit, VERSION } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import Stats from 'three/examples/jsm/libs/stats.module';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min';
import {
  CSS2DRenderer,
  CSS2DObject,
} from 'three/examples/jsm/renderers/CSS2DRenderer';
@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  name = 'Angular ' + VERSION.major;
  constructor() {}
  ngOnInit() {
    this.load3DModal();
  }
  load3DModal() {
    let annotations = [];
    const annotationMarkers = [];
    const scene = new THREE.Scene();
    var light = new THREE.DirectionalLight();
    light.position.set(-30, 30, 30);
    scene.add(light);
    var light2 = new THREE.DirectionalLight();
    light2.position.set(30, 30, -30);
    scene.add(light2);
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.x = 10;
    camera.position.y = 5;
    camera.position.z = 8;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(labelRenderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.dampingFactor = 0.2;
    controls.enableDamping = true;
    controls.target.set(8, 3, 4);
    const raycaster = new THREE.Raycaster();
    const sceneMeshes = new Array();
    const circleTexture = new THREE.TextureLoader().load('img/circle.png');
    const mtlLoader = new MTLLoader();
    mtlLoader.load(
      'assets/models/house_water.mtl',
      (materials) => {
        materials.preload();
        const progressBar: any = document.getElementById('progressBar');
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load(
          'assets/models/house_water.obj',
          (object) => {
            object.scale.set(0.01, 0.01, 0.01);
            scene.add(object);
            sceneMeshes.push(object);
            // const annotationsDownload = new XMLHttpRequest();
            // annotationsDownload.open('GET', 'assets/data/annotations.json');
            // annotationsDownload.onreadystatechange = function () {
            //   if (annotationsDownload.readyState === 4) {
                // console.log(annotationsDownload.responseText);
                // annotations = JSON.parse(annotationsDownload.responseText);
                const annotationsPanel =
                  document.getElementById('annotationsPanel');
                const ul = document.createElement('UL');
                const ulElem = annotationsPanel.appendChild(ul);
                Object.keys(annotations).forEach((a) => {
                  const li = document.createElement('UL');
                  const liElem = ulElem.appendChild(li);
                  const button = document.createElement('BUTTON');
                  button.innerHTML = a + ' : ' + annotations[a].title;
                  button.className = 'annotationButton';
                  button.addEventListener('click', function () {
                    gotoAnnotation(annotations[a]);
                  });
                  liElem.appendChild(button);
                  const annotationSpriteMaterial = new THREE.SpriteMaterial({
                    map: circleTexture,
                    depthTest: false,
                    depthWrite: false,
                    sizeAttenuation: false,
                  });
                  const annotationSprite = new THREE.Sprite(
                    annotationSpriteMaterial
                  );
                  annotationSprite.scale.set(0.1, 0.1, 0.1);
                  annotationSprite.position.copy(annotations[a].lookAt);
                  annotationSprite.userData.id = a;
                  scene.add(annotationSprite);
                  annotationMarkers.push(annotationSprite);
                  const annotationDiv = document.createElement('div');
                  annotationDiv.className = 'annotationLabel';
                  annotationDiv.innerHTML = a;
                  const annotationLabel = new CSS2DObject(annotationDiv);
                  annotationLabel.position.copy(annotations[a].lookAt);
                  scene.add(annotationLabel);
                  if (annotations[a].description) {
                    const annotationDescriptionDiv =
                      document.createElement('div');
                    annotationDescriptionDiv.className =
                      'annotationDescription';
                    annotationDescriptionDiv.innerHTML =
                      annotations[a].description;
                    annotationDiv.appendChild(annotationDescriptionDiv);
                    annotations[a].descriptionDomElement =
                      annotationDescriptionDiv;
                  }
                });
                progressBar.style.display = 'none';
          //     }
          //   };
          //   annotationsDownload.send();
          // },
          // (xhr) => {
          //   if (xhr.lengthComputable) {
          //     let percentComplete = (xhr.loaded / xhr.total) * 100;
          //     progressBar.value = percentComplete;
          //     progressBar.style.display = 'block';
          //   }
          // },
          // (error) => {
          //   console.log('An error happened');
          // }
        // );
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      },
      (error) => {
        console.log('An error happened');
      }
    );
    window.addEventListener('resize', onWindowResize, false);
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      labelRenderer.setSize(window.innerWidth, window.innerHeight);
      render();
    }
    renderer.domElement.addEventListener('pointerdown', onClick, false);
    function onClick(event) {
      raycaster.setFromCamera(
        {
          x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
          y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1,
        },
        camera
      );
      const intersects = raycaster.intersectObjects(annotationMarkers, true);
      if (
        intersects[0].object.userData &&
        intersects[0].object &&
        intersects[0].object.userData &&
        intersects[0].object.userData.id
      ) {
        gotoAnnotation(annotations[intersects[0].object.userData.id]);
      }
    }
    renderer.domElement.addEventListener('dblclick', onDoubleClick, false);
    function onDoubleClick(event) {
      raycaster.setFromCamera(
        {
          x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
          y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1,
        },
        camera
      );
      const intersects = raycaster.intersectObjects(sceneMeshes, true);
      if (intersects.length > 0) {
        const p = intersects[0].point;
        new TWEEN.Tween(controls.target)
          .to(
            {
              x: p.x,
              y: p.y,
              z: p.z,
            },
            500
          )
          .easing(TWEEN.Easing.Cubic.Out)
          .start();
        // .onComplete(() => {
        //     console.log(camera.position)
        //     console.log(controls.target)
        // })
      }
    }
    function gotoAnnotation(a) {
      new TWEEN.Tween(camera.position)
        .to(
          {
            x: a.camPos.x,
            y: a.camPos.y,
            z: a.camPos.z,
          },
          500
        )
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
      new TWEEN.Tween(controls.target)
        .to(
          {
            x: a.lookAt.x,
            y: a.lookAt.y,
            z: a.lookAt.z,
          },
          500
        )
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
      Object.keys(annotations).forEach((annotation) => {
        if (annotations[annotation].descriptionDomElement) {
          annotations[annotation].descriptionDomElement.style.display = 'none';
        }
      });
      if (a.descriptionDomElement) {
        console.log(a.descriptionDomElement.style.display);
        a.descriptionDomElement.style.display = 'block';
      }
    }
    const stats = Stats();
    document.body.appendChild(stats.dom);
    var animate = function () {
      requestAnimationFrame(animate);
      controls.update();
      // TWEEN.update()
      render();
      stats.update();
    };
    function render() {
      labelRenderer.render(scene, camera);
      renderer.render(scene, camera);
    }
    animate();
  }
}
