import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export function loadModel(containerId, modelUrl) {
  const container = document.getElementById(containerId);
  if (!container) return;
  // 1. Сцена
  const scene = new THREE.Scene();
  scene.background = null; // Светло-серый фон
  // 2. Камера
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100,
  );
  // 3. Рендерер
  // outputColorSpace нужен для правильной цветопередачи (чтобы не было темно)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio); // Для четкости на Retina экранах

  renderer.outputColorSpace = THREE.SRGBColorSpace; // ВАЖНО для GLTF!
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  container.innerHTML = "";
  container.appendChild(renderer.domElement);
  // 4. Контролы
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 0.1;
  controls.maxDistance = 100;
  // 5. Окружение (Свет)
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(
    new RoomEnvironment(renderer),
  ).texture;
  // 6. Загрузка
  const loaderDiv = document.createElement("div");
  loaderDiv.className = "loader-overlay";
  loaderDiv.innerHTML = `
        <div style="color: #666; font-size: 0.9rem;">Loading...</div>
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
    `;
  container.appendChild(loaderDiv);
  // Находим полоску, чтобы менять её ширину
  const progressFill = loaderDiv.querySelector(".progress-fill");
  // --- 2. Обновляем вызов загрузчика --
  const loader = new GLTFLoader();
  loader.load(
    modelUrl,

    // A. ON LOAD (Успех)
    (gltf) => {
      const model = gltf.scene;
      fitCameraToObject(camera, model, controls);
      scene.add(model);

      // Скрываем лоадер
      loaderDiv.style.opacity = "0";
      setTimeout(() => {
        loaderDiv.remove(); // Удаляем из DOM через 0.3 сек
      }, 300);
    },

    // B. ON PROGRESS (Прогресс)
    (xhr) => {
      // xhr.total - общий вес файла в байтах
      // xhr.loaded - сколько скачалось
      if (xhr.total > 0) {
        const percent = (xhr.loaded / xhr.total) * 100;
        progressFill.style.width = percent + "%";
      }
    },

    // C. ON ERROR (Ошибка)
    (error) => {
      console.error("Ошибка загрузки:", error);
      loaderDiv.innerHTML = `<div class="error-msg">
                              ❌Ошибка загрузки<br>
                              <small>Проверьте файл</small>
                            </div>`;
    },
  );
  // 7. Loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
  // Resize
  window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}
// Вспомогательная функция центровки (обновленная)
function fitCameraToObject(camera, object, controls) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  // Сдвигаем модель в центр
  object.position.x = -center.x;
  object.position.y = -center.y;
  object.position.z = -center.z;
  // Ставим камеру
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
  camera.position.set(cameraZ, cameraZ * 0.5, cameraZ);
  camera.lookAt(0, 0, 0);
}
