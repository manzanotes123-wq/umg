let encuesta;
let votos = {};
let votosTotales = {};
let categoriaActual = 0;        // índice de categoría actual (0..N-1)
let categoriasCompletadas = false;

window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return alert("ID no encontrado en la URL");

  const datos = localStorage.getItem("encuesta_" + id);
  if (!datos) return alert("Encuesta no encontrada con ese ID");

  try {
    encuesta = JSON.parse(datos);
    if (!encuesta.categorias || !encuesta.candidatas) {
      console.log(encuesta);
      return alert("Encuesta sin datos válidos.");
    }

    inicializarVotos();
    actualizarProgreso();   // mostrar 0% al inicio
    mostrarCategoria();
  } catch (e) {
    console.error("Error al parsear la encuesta:", e);
    alert("Datos corruptos.");
  }
};

function inicializarVotos() {
  encuesta.categorias.forEach(cat => {
    votos[cat] = {};
    encuesta.candidatas.forEach(c => {
      votos[cat][c.nombre] = 0;
    });
  });

  encuesta.candidatas.forEach(c => {
    votosTotales[c.nombre] = 0;
  });
}

function actualizarProgreso() {
  const total = encuesta.categorias.length;
  // categorías ya completadas = categoriaActual (antes de mostrar la siguiente)
  const completadas = Math.min(categoriaActual, total);
  const pct = Math.round((completadas / total) * 100);

  const fill = document.getElementById("progress-fill");
  const text = document.getElementById("progress-text");
  if (fill) fill.style.width = pct + "%";
  if (text) text.textContent = `${pct}% completado`;
}

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
    boton.onclick = (e) => {
      e.preventDefault();
      const seleccion = form.querySelector("input[name='voto']:checked");
      if (!seleccion) return;

      const nombre = seleccion.value;
      const cat = encuesta.categorias[categoriaActual];
      votos[cat][nombre]++;
      votosTotales[nombre]++;
      mostrarGraficaCategoria(cat);

      // Avanzar categoría y actualizar progreso
      categoriaActual++;
      actualizarProgreso();

      if (categoriaActual >= encuesta.categorias.length) {
        categoriasCompletadas = true;
        // Mensaje final y mostrar botón Finalizar
        contenedor.innerHTML = `
          <h2>¡Listo!</h2>
          <p>Ya votaste en todas las categorías. Revisa la gráfica y presiona <b>Finalizar votación</b> para ver el resultado final.</p>
        `;
        if (btnFinalizar) btnFinalizar.style.display = "inline-block";

        // Asegurar 100% de progreso
        actualizarProgreso();
      } else {
        // Avanza a la siguiente categoría
        setTimeout(mostrarCategoria, 600);
      }
    };

    form.appendChild(boton);
    contenedor.appendChild(form);

    // Oculta el botón Finalizar mientras no se complete todo
    if (btnFinalizar) btnFinalizar.style.display = "none";
  } else {
    // Si se recarga en este estado
    categoriasCompletadas = true;
    if (btnFinalizar) btnFinalizar.style.display = "inline-block";
    actualizarProgreso();
  }
}

function mostrarGraficaCategoria(cat) {
  const ctx = document.getElementById("chartCanvas").getContext("2d");
  if (window.miGrafica) window.miGrafica.destroy();

  window.miGrafica = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: encuesta.candidatas.map(c => c.nombre),
      datasets: [{
        label: `Votos - ${cat}`,
        data: encuesta.candidatas.map(c => votos[cat][c.nombre]),
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
}

function mostrarGraficaFinal() {
  const ctx = document.getElementById("chartCanvas").getContext("2d");
  if (window.miGrafica) window.miGrafica.destroy();

  const ordenados = Object.entries(votosTotales).sort((a, b) => b[1] - a[1]);
  const labels = ordenados.map(([nombre]) => nombre);
  const data = ordenados.map(([_, cantidad]) => cantidad);

  const colores = ordenados.map((_, i) => {
    if (i === 0) return "gold";
    if (i === 1) return "dodgerblue";
    if (i === 2) return "peru";
    return "gray";
  });

  const labelsConCarrera = ordenados.map(([nombre], i) => {
    const candidata = encuesta.candidatas.find(c => c.nombre === nombre);
    let etiqueta = `${nombre} (${candidata.carrera})`;
    if (i === 0) etiqueta = `👑 Señorita UMG - ${etiqueta}`;
    return etiqueta;
  });

  window.miGrafica = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labelsConCarrera,
      datasets: [{
        label: "Votos Totales",
        data,
        backgroundColor: colores
      }]
    },
    options: {
      plugins: { title: { display: true, text: "Resultado Final" }, legend: { display: false } },
      responsive: true,
      maintainAspectRatio: false
    }
  });

  // Limpiar formulario al final
  const cont = document.getElementById("categoria-container");
  if (cont) cont.innerHTML = "";
}

function finalizarVotacion() {
  if (!categoriasCompletadas) {
    alert("Primero vota en todas las categorías.");
    return;
  }
  mostrarGraficaFinal();
}

