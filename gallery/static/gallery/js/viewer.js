import * as THREE from "three";
// Подключаем "грузчика" для формата GLB
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export function loadModel(containerId, modelUrl) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // 1. Стандартная настройка сцены (как в прошлый раз)
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5f5f5); // Цвет фона под карточку

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000,
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);

  // Очищаем контейнер от текста "Wait..." и вставляем Canvas
  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  // 2. Свет (ВАЖНО! Без него модель будет черной)
  const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Мягкий свет
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 2); // Солнце
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  // 3. Загрузка Модели
  const loader = new GLTFLoader();
  let loadedModel = null;
  loader.load(
    modelUrl, // URL, который пришел из Django
    (gltf) => {
      // --- SUCCESS --
      loadedModel = gltf.scene;

      fitCameraToObject(camera, loadedModel, 1.5);
      scene.add(loadedModel);
    },
    undefined, // Progress (можно пропустить)
    (error) => {
      // --- ERROR --
      console.error("Ошибка загрузки:", error);
      container.innerHTML = "❌Error";
    },
  );
  // 4. Анимация (Loop)
  function animate() {
    requestAnimationFrame(animate);

    if (loadedModel) {
      loadedModel.rotation.y += 0.005; // Медленное вращение
    }

    renderer.render(scene, camera);
    // Можно добавить медленное вращение всей сцены или только модели
    // scene.rotation.y += 0.005;
  }
  animate();
  // Resize handler (как в прошлый раз)
  window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}

function fitCameraToObject(camera, object, offset = 1.25) {
  // 1. Вычисляем Bounding Box (коробку, в которую влезает модель)
  const boundingBox = new THREE.Box3();
  boundingBox.setFromObject(object);
  // 2. Находим центр этой коробки и её размер
  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());
  // 3. Самая длинная сторона модели (чтобы точно влезла)
  const maxDim = Math.max(size.x, size.y, size.z);
  // 4. Смещаем саму модель так, чтобы её центр стал в 0,0,0
  // Вместо того чтобы двигать камеру за моделью, проще притянуть модель к центру мира
  object.position.x = -center.x;
  object.position.y = -center.y; // Теперь модель стоит на "полу" центра
  object.position.z = -center.z;
  // 5. Отодвигаем камеру назад
  // Немного тригонометрии: вычисляем дистанцию в зависимости от угла обзора (FOV)
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
  // Умножаем на коэффициент (offset), чтобы модель не упиралась в края экрана
  cameraZ *= offset;
  // Устанавливаем камеру
  camera.position.set(0, maxDim * 0.5, cameraZ); // Чуть выше центра
  // Камера должна смотреть в центр мира (где теперь стоит модель)
  camera.lookAt(0, 0, 0);
  // Обновляем параметры камеры
  camera.updateProjectionMatrix();
}
