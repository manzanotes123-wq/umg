// Lee ?id=... de la URL
const params = new URLSearchParams(window.location.search);
const encuestaId = params.get("id");

// Puntero al doc en Firestore (usa 'db' que viene desde firebaseconfig.js)
const dbRef = encuestaId ? db.collection("encuestas").doc(encuestaId) : null;

// Elementos del DOM
const tituloEl = document.getElementById("tituloEncuesta");
const idTextEl = document.getElementById("encuestaIdText");
const copiarBtn = document.getElementById("copiarIdBtn");
const ganadoraEl = document.getElementById("ganadora");
const canvas = document.getElementById("graficaFinal");

// Mostrar el ID en pantalla y habilitar copiar
idTextEl.textContent = encuestaId || "—";
copiarBtn.onclick = () => {
  if (!encuestaId) return;
  navigator.clipboard.writeText(encuestaId).then(() => {
    copiarBtn.textContent = "✅ Copiado";
    setTimeout(() => (copiarBtn.textContent = "📋 Copiar ID"), 1200);
  });
};

async function cargarResultados() {
  if (!encuestaId || !dbRef) {
    alert("ID de encuesta no encontrado.");
    return;
  }

  const doc = await dbRef.get();
  if (!doc.exists) {
    alert("Encuesta no encontrada en Firestore.");
    return;
  }

  const encuesta = doc.data();
  tituloEl.textContent = `Resultados – ${encuesta.titulo || "Señorita UMG"}`;

  // Inicializa contadores por candidata
  const sumaVotos = {};
  (encuesta.candidatas || []).forEach(c => {
    // cada candidata es { nombre, carrera, fotoUrl }
    sumaVotos[c.nombre] = 0;
  });

  // Sumar votos de cada categoría. Se espera campos: votos_<categoria_sin_espacios>
  (encuesta.categorias || []).forEach(cat => {
    const campo = `votos_${cat.replace(/\s+/g, "_")}`;
    const votosCat = encuesta[campo] || {};
    for (const nombre in votosCat) {
      if (sumaVotos[nombre] !== undefined) {
        sumaVotos[nombre] += Number(votosCat[nombre]) || 0;
      }
    }
  });

  // Ordenar por total
  const ordenados = Object.entries(sumaVotos).sort((a, b) => b[1] - a[1]);
  const labels = ordenados.map(([nombre]) => nombre);
  const data = ordenados.map(([_, total]) => total);

  // Mostrar ganadora
  if (labels.length > 0) {
    const nombreGanadora = labels[0];
    const candidataInfo = (encuesta.candidatas || []).find(c => c.nombre === nombreGanadora);
    const carreraTxt = candidataInfo?.carrera ? ` (${candidataInfo.carrera})` : "";
    ganadoraEl.textContent = `👑 Señorita UMG: ${nombreGanadora}${carreraTxt}`;
    ganadoraEl.style.display = "block";
  } else {
    ganadoraEl.style.display = "none";
  }

  // Colores: oro, azul, bronce, resto gris
  const colores = data.map((_, i) => {
    if (i === 0) return "gold";
    if (i === 1) return "dodgerblue";
    if (i === 2) return "peru";
    return "gray";
  });

  // Dibuja gráfica
  const ctx = canvas.getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Votos Totales",
        data,
        backgroundColor: colores
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

// Carga
cargarResultados().catch(err => {
  console.error(err);
  alert("Error al cargar los resultados.");
});

