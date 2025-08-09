let candidatas = [];

function agregarCandidata() {
    const nombre = document.getElementById("nombre").value;
    const carrera = document.getElementById("carrera").value;
    const fotoUrl = document.getElementById("fotoUrl").value;

    if (!nombre || !carrera) {
        alert("Por favor, completa nombre y carrera.");
        return;
    }

    const nuevaCandidata = { nombre, carrera, fotoUrl };
    candidatas.push(nuevaCandidata);

    mostrarCandidatas();
    document.getElementById("nombre").value = "";
    document.getElementById("carrera").value = "";
    document.getElementById("fotoUrl").value = "";
}

function mostrarCandidatas() {
    const contenedor = document.getElementById("listaCandidatas");
    contenedor.innerHTML = "<h3>Candidatas añadidas:</h3>";

    candidatas.forEach((candidata, index) => {
        contenedor.innerHTML += `
            <div style="border: 1px solid #ccc; padding: 10px; margin: 5px; border-radius: 10px;">
                <strong>${candidata.nombre}</strong><br>
                <em>${candidata.carrera}</em><br>
                ${candidata.fotoUrl ? `<img src="${candidata.fotoUrl}" alt="Foto" style="width:100px; margin-top: 5px;">` : ''}
            </div>
        `;
    });
}

function generarID() {
    return Math.random().toString(36).substring(2, 10);
}

function guardarEncuesta() {
    const titulo = document.getElementById("titulo").value;
    const categoriasTexto = document.getElementById("categorias").value;

    if (!titulo || !categoriasTexto || candidatas.length === 0) {
        alert("Completa todos los campos y agrega al menos una candidata.");
        return;
    }

    const categorias = categoriasTexto.split(",").map(c => c.trim());
    const idEncuesta = generarID();
    const encuesta = {
        id: idEncuesta,
        titulo,
        categorias,
        candidatas
    };

    localStorage.setItem("encuesta_" + idEncuesta, JSON.stringify(encuesta));

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
}

function copiarTexto(idCampo) {
    const input = document.getElementById(idCampo);
    input.select();
    input.setSelectionRange(0, 99999);
    document.execCommand("copy");
    alert("Texto copiado al portapapeles");
}
