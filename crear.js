// ===== crear.js (Firebase v8 + Firestore) =====
window.candidatas = [];

function agregarCandidata() {
  const nombre = document.getElementById("nombre").value.trim();
  const carrera = document.getElementById("carrera").value.trim();
  const fotoUrl = document.getElementById("fotoUrl").value.trim();

  if (!nombre || !carrera) {
    alert("Por favor, completa nombre y carrera.");
    return;
  }

  window.candidatas.push({ nombre, carrera, fotoUrl });
  mostrarCandidatas();

  document.getElementById("nombre").value = "";
  document.getElementById("carrera").value = "";
  document.getElementById("fotoUrl").value = "";
  document.getElementById("nombre").focus();
}

function mostrarCandidatas() {
  const contenedor = document.getElementById("listaCandidatas");
  contenedor.innerHTML = "<h3 style='margin-top:0'>Candidatas añadidas:</h3>";

  window.candidatas.forEach((c) => {
    const foto = c.fotoUrl && c.fotoUrl.trim() !== ""
      ? c.fotoUrl
      : "https://via.placeholder.com/80?text=Foto";

    contenedor.innerHTML += `
      <div class="candidata-card">
        <img src="${foto}" alt="Foto">
        <div>
          <strong>${c.nombre}</strong><br>
          <em>${c.carrera}</em>
        </div>
      </div>
    `;
  });
}

function generarID() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID().slice(0, 8);
  return Math.random().toString(36).substring(2, 10);
}

async function guardarEncuesta() {
  const titulo = document.getElementById("titulo").value.trim();
  const categoriasTexto = document.getElementById("categorias").value.trim();

  if (!titulo || !categoriasTexto || window.candidatas.length === 0) {
    alert("Completa todos los campos y agrega al menos una candidata.");
    return;
  }

  const categorias = categoriasTexto
    .split(",")
    .map(c => c.trim())
    .filter(Boolean);

  const idEncuesta = generarID();

  const encuesta = {
    titulo,
    categorias,
    candidatas: window.candidatas,
    creadaEn: Date.now()
  };

  try {
    // Requiere que firebaseconfig.js ya haya cargado y definido: const db = firebase.firestore();
    await db.collection("encuestas").doc(idEncuesta).set(encuesta, { merge: true });

    const link = `${location.origin}/votar.html?id=${idEncuesta}`;
    const contenedor = document.getElementById("listaCandidatas");
    contenedor.innerHTML += `
      <div style="margin-top: 20px; padding: 10px; background: #f3f0ff; border-radius: 10px;">
        <strong>✅ Encuesta guardada con éxito.</strong><br><br>
        <label><b>ID de la encuesta:</b></label><br>
        <input type="text" id="codigoEncuesta" value="${idEncuesta}" readonly style="width: 100%; padding: 8px; margin-bottom: 10px;">
        <button onclick="copiarTexto('codigoEncuesta')">📋 Copiar ID</button>
        <br><br>
        <label><b>Enlace para votar:</b></label><br>
        <input type="text" id="enlaceEncuesta" value="${link}" readonly style="width: 100%; padding: 8px;">
        <button onclick="copiarTexto('enlaceEncuesta')">📋 Copiar Enlace</button>
      </div>
    `;
  } catch (e) {
    console.error(e);
    alert("Error guardando la encuesta en Firestore. Revisa la consola y tus reglas.");
  }
}

function copiarTexto(idCampo) {
  const input = document.getElementById(idCampo);
  input.select();
  input.setSelectionRange(0, 99999);
  document.execCommand("copy");
  alert("Texto copiado al portapapeles");
}
