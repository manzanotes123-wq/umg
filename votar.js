// ===== votar.js (Firebase v8 + Firestore) =====
let encuesta;
let categoriaActual = 0;
let categoriasCompletadas = false;
let docRef; // /encuestas/{id}

function getParam(name) {
  const u = new URL(location.href);
  return u.searchParams.get(name);
}

window.onload = async () => {
  const id = getParam("id");
  if (!id) return alert("ID no encontrado en la URL");

  // Referencia al documento de la encuesta
  docRef = db.collection("encuestas").doc(id);

  try {
    const snap = await docRef.get();
    if (!snap.exists) return alert("Encuesta no encontrada con ese ID");

    encuesta = snap.data();
    if (!encuesta.categorias || !encuesta.candidatas) {
      console.log(encuesta);
      return alert("Encuesta sin datos válidos.");
    }

    inicializarProgreso();
    mostrarCategoria();
  } catch (e) {
    console.error("Error cargando la encuesta:", e);
    alert("No se pudo cargar la encuesta.");
  }
};

// --- Progreso ---
function inicializarProgreso() {
  const fill = document.getElementById("progress-fill");
  const text = document.getElementById("progress-text");
  if (fill) fill.style.width = "0%";
  if (text) text.textContent = "0% completado";
}

function actualizarProgreso() {
  const total = encuesta.categorias.length;
  const completadas = Math.min(categoriaActual, total);
  const pct = Math.round((completadas / total) * 100);
  const fill = document.getElementById("progress-fill");
  const text = document.getElementById("progress-text");
  if (fill) fill.style.width = pct + "%";
  if (text) text.textContent = `${pct}% completado`;
}

// --- UI de votación por categoría ---
function mostrarCategoria() {
  const contenedor = document.getElementById("categoria-container");
  contenedor.innerHTML = "";

  const btnFinalizar = document.getElementById("finalizarBtn");

  if (categoriaActual < encuesta.categorias.length) {
    const cat = encuesta.categorias[categoriaActual];
    const form = document.createElement("form");
    form.innerHTML = `<h2 style="margin-top:0">Categoría: ${cat}</h2>`;

    encuesta.candidatas.forEach((c, i) => {
      const foto = c.fotoUrl && c.fotoUrl.trim() !== "" ? c.fotoUrl : "https://via.placeholder.com/120?text=Foto";
      form.innerHTML += `
        <label class="opcion">
          <input type="radio" name="voto" value="${c.nombre}" ${i === 0 ? "checked" : ""}>
          <img class="foto" src="${foto}" alt="${c.nombre}">
          <div class="ops">
            <strong>${c.nombre}</strong><br>
            <em>${c.carrera}</em>
          </div>
        </label>
      `;
    });

    const boton = document.createElement("button");
    boton.className = "btn";
    boton.textContent = "Votar";
    boton.onclick = async (e) => {
      e.preventDefault();
      const seleccion = form.querySelector("input[name='voto']:checked");
      if (!seleccion) return;

      const nombre = seleccion.value;
      await registrarVoto(cat, nombre);

      categoriaActual++;
      actualizarProgreso();

      if (categoriaActual >= encuesta.categorias.length) {
        categoriasCompletadas = true;
        contenedor.innerHTML = `
          <h2>¡Listo!</h2>
          <p>Ya votaste en todas las categorías. Presiona <b>Finalizar votación</b> para ver el resultado final.</p>
        `;
        if (btnFinalizar) btnFinalizar.style.display = "inline-block";
        actualizarProgreso();
      } else {
        setTimeout(mostrarCategoria, 600);
      }
    };

    form.appendChild(boton);
    contenedor.appendChild(form);

    if (btnFinalizar) btnFinalizar.style.display = "none";
  } else {
    categoriasCompletadas = true;
    if (btnFinalizar) btnFinalizar.style.display = "inline-block";
    actualizarProgreso();
  }
}

// --- Evitar doble voto por dispositivo/categoría (sin login) ---
function yaVoto(idEncuesta, cat) {
  return localStorage.getItem(`votado_${idEncuesta}_${cat}`) === "1";
}
function marcarVoto(idEncuesta, cat) {
  localStorage.setItem(`votado_${idEncuesta}_${cat}`, "1");
}

// --- Guardar voto en Firestore ---
async function registrarVoto(cat, nombre) {
  const id = getParam("id");
  if (yaVoto(id, cat)) {
    alert("Ya votaste en esta categoría en este dispositivo.");
    return;
  }

  const campo = `votos_${cat.replace(/\s+/g, "_")}`; // p.ej.: votos_Pasarela

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      const data = snap.exists ? snap.data() : {};
      const mapa = Object.assign({}, data[campo] || {}); // { "Nombre candidata": conteo }
      mapa[nombre] = (Number(mapa[nombre]) || 0) + 1;
      tx.set(docRef, { [campo]: mapa }, { merge: true });
    });

    marcarVoto(id, cat);
    // Mostrar la gráfica de la categoría con los datos actualizados del servidor
    await mostrarGraficaCategoria(cat);

  } catch (e) {
    console.error("Error registrando voto:", e);
    alert("No se pudo registrar tu voto. Intenta de nuevo.");
  }
}

// --- Gráfica por categoría (lee totales actuales de Firestore) ---
async function mostrarGraficaCategoria(cat) {
  try {
    const snap = await docRef.get();
    const data = snap.data() || {};
    const campo = `votos_${cat.replace(/\s+/g, "_")}`;
    const mapa = data[campo] || {}; // { nombre: conteo }

    const labels = encuesta.candidatas.map(c => c.nombre);
    const valores = labels.map(n => Number(mapa[n] || 0));

    const ctx = document.getElementById("chartCanvas").getContext("2d");
    if (window.miGrafica) window.miGrafica.destroy();

    window.miGrafica = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: `Votos - ${cat}`,
          data: valores,
          backgroundColor: "rgba(124, 58, 237, 0.6)"
        }]
      },
      options: {
        plugins: {
          title: { display: true, text: `Resultados de ${cat}` },
          legend: { display: false }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  } catch (e) {
    console.error("No se pudo actualizar la gráfica:", e);
  }
}

// --- Finalizar (redirige a página de resultados globales) ---
function finalizarVotacion() {
  if (!categoriasCompletadas) {
    alert("Primero vota en todas las categorías.");
    return;
  }
  const id = getParam("id");
  location.href = `resultados.html?id=${id}`;
}
