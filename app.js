// =======================
// Estado y referencias
// =======================
let pasajeros = [];
let filtros = {
  texto: "",
  estado: "all", // all | boarded | pending
  hotel: "",
  aerolinea: ""
};

let elements = {};

document.addEventListener("DOMContentLoaded", () => {
  elements = {
    fileInput: document.getElementById("file-input"),
    searchInput: document.getElementById("search-input"),
    hotelFilter: document.getElementById("hotel-filter"),
    airlineFilter: document.getElementById("airline-filter"),
    chips: Array.from(document.querySelectorAll(".chip")),
    list: document.getElementById("passengers-list"),
    totalCount: document.getElementById("total-count"),
    boardedCount: document.getElementById("boarded-count"),
    missingCount: document.getElementById("missing-count"),
    showMissingBtn: document.getElementById("show-missing-btn"),
    resetBtn: document.getElementById("reset-btn")
  };

  // Eventos
  elements.fileInput.addEventListener("change", handleFile);
  elements.searchInput.addEventListener("input", handleSearch);

  elements.hotelFilter.addEventListener("change", () => {
    filtros.hotel = elements.hotelFilter.value;
    renderList();
  });

  elements.airlineFilter.addEventListener("change", () => {
    filtros.aerolinea = elements.airlineFilter.value;
    renderList();
  });

  elements.chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const status = chip.dataset.filterStatus;
      filtros.estado = status;
      elements.chips.forEach((c) => c.classList.toggle("active", c === chip));
      renderList();
    });
  });

  elements.showMissingBtn.addEventListener("click", () => {
    filtros.estado = "pending";
    elements.chips.forEach((c) =>
      c.classList.toggle("active", c.dataset.filterStatus === "pending")
    );
    renderList();
  });

  elements.resetBtn.addEventListener("click", () => {
    pasajeros.forEach((p) => (p.status = "pending"));
    filtros = { texto: "", estado: "all", hotel: "", aerolinea: "" };
    elements.searchInput.value = "";
    elements.hotelFilter.value = "";
    elements.airlineFilter.value = "";
    elements.chips.forEach((c) =>
      c.classList.toggle("active", c.dataset.filterStatus === "all")
    );
    renderList();
  });

  // Estado inicial
  renderEmpty();
});

// =======================
// Búsqueda
// =======================
function handleSearch(e) {
  filtros.texto = e.target.value.toLowerCase();
  renderList();
}

// =======================
// Carga de Excel (por columnas)
// =======================
function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // rows: matriz [ [FOLIO, NOMBRE, PUESTO, HOTEL, AEROLINEA, HORARIO], ... ]
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: ""
      });

      if (!rows.length) {
        alert("El archivo Excel está vacío o la primera hoja no tiene datos.");
        pasajeros = [];
        renderEmpty();
        return;
      }

      const dataRows = rows.slice(1); // saltamos encabezados

      pasajeros = dataRows
        .map((cols) => {
          const folio = cols[0];
          const nombre = cols[1];
          const puesto = cols[2];
          const hotel = cols[3];
          const aerolinea = cols[4];
          const horario = cols[5];

          if (
            !folio &&
            !nombre &&
            !puesto &&
            !hotel &&
            !aerolinea &&
            !horario
          ) {
            return null;
          }

          return {
            folio: folio,
            nombre: String(nombre).trim(),
            puesto: String(puesto).trim(),
            hotel: String(hotel).trim(),
            aerolinea: String(aerolinea).trim(),
            horario: String(horario).trim(),
            status: "pending"
          };
        })
        .filter(Boolean);

      if (!pasajeros.length) {
        alert(
          "Se leyó el archivo, pero no se encontraron filas con datos.\nRevisa que la primera hoja tenga: FOLIO, NOMBRE, PUESTO, HOTEL, AEROLÍNEA, HORARIO."
        );
        renderEmpty();
        return;
      }

      initFilters();
      renderList();
      // alert(`Se cargaron ${pasajeros.length} personas.`);
    } catch (err) {
      console.error(err);
      alert("Hubo un problema leyendo el Excel. Revisa que sea .xlsx válido.");
      pasajeros = [];
      renderEmpty();
    }
  };

  reader.readAsArrayBuffer(file);
}

// =======================
// Filtros desplegables
// =======================
function initFilters() {
  const hoteles = Array.from(
    new Set(pasajeros.map((p) => p.hotel).filter((h) => h && h.trim() !== ""))
  ).sort();

  const aerolineas = Array.from(
    new Set(
      pasajeros
        .map((p) => p.aerolinea)
        .filter((a) => a && a.trim() !== "")
    )
  ).sort();

  elements.hotelFilter.innerHTML = '<option value="">Todos los hoteles</option>';
  hoteles.forEach((h) => {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = h;
    elements.hotelFilter.appendChild(opt);
  });

  elements.airlineFilter.innerHTML =
    '<option value="">Todas las aerolíneas</option>';
  aerolineas.forEach((a) => {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
    elements.airlineFilter.appendChild(opt);
  });
}

// =======================
// Render vacío
// =======================
function renderEmpty() {
  elements.list.innerHTML = `
    <li class="empty-state">
      Carga el archivo Excel de esta salida para comenzar a pasar lista.
    </li>
  `;
  updateSummary();
}

// =======================
// Render lista + filtros
// =======================
function renderList() {
  if (!pasajeros.length) {
    renderEmpty();
    return;
  }

  const { texto, estado, hotel, aerolinea } = filtros;
  let data = pasajeros.slice();

  if (estado === "boarded") {
    data = data.filter((p) => p.status === "boarded");
  } else if (estado === "pending") {
    data = data.filter((p) => p.status === "pending");
  }

  if (hotel) {
    data = data.filter((p) => p.hotel === hotel);
  }

  if (aerolinea) {
    data = data.filter((p) => p.aerolinea === aerolinea);
  }

  if (texto) {
    data = data.filter((p) => {
      const target = `${p.folio} ${p.nombre} ${p.puesto} ${p.hotel} ${p.aerolinea}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const t = texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return target.includes(t);
    });
  }

  // Orden por folio numérico si se puede
  data.sort((a, b) => {
    const fa = parseInt(a.folio, 10);
    const fb = parseInt(b.folio, 10);
    if (isNaN(fa) || isNaN(fb)) {
      return String(a.folio).localeCompare(String(b.folio));
    }
    return fa - fb;
  });

  if (!data.length) {
    elements.list.innerHTML = `
      <li class="empty-state">
        No se encontraron personas con los filtros/búsqueda actuales.
      </li>
    `;
    updateSummary();
    return;
  }

  elements.list.innerHTML = "";

  data.forEach((p) => {
    const li = document.createElement("li");
    li.className =
      "passenger-row " + (p.status === "boarded" ? "is-boarded" : "is-pending");

    li.innerHTML = `
      <div class="row-main">
        <div class="name-line">
          <span class="folio-tag">#${p.folio ?? ""}</span>
          <span class="name-text">${escapeHtml(p.nombre || "")}</span>
        </div>
        <div class="details-line">
          ${p.puesto ? `<span>${escapeHtml(p.puesto)}</span>` : ""}
          ${p.puesto && p.hotel ? `<span class="detail-dot">•</span>` : ""}
          ${p.hotel ? `<span>${escapeHtml(p.hotel)}</span>` : ""}
          ${p.hotel && p.aerolinea ? `<span class="detail-dot">•</span>` : ""}
          ${p.aerolinea ? `<span>${escapeHtml(p.aerolinea)}</span>` : ""}
          ${p.horario ? `<span class="detail-right">${escapeHtml(p.horario)}</span>` : ""}
        </div>
      </div>
      <button class="status-btn ${
        p.status === "boarded" ? "boarded" : "pending"
      }">
        ${p.status === "boarded" ? "Abordó ✅" : "Pendiente"}
      </button>
    `;

    const btn = li.querySelector(".status-btn");

    const toggle = (ev) => {
      if (ev) ev.stopPropagation();
      p.status = p.status === "boarded" ? "pending" : "boarded";
      renderList();
    };

    btn.addEventListener("click", toggle);
    li.addEventListener("click", toggle);

    elements.list.appendChild(li);
  });

  updateSummary();
}

// =======================
// Resumen
// =======================
function updateSummary() {
  const total = pasajeros.length;
  const abordaron = pasajeros.filter((p) => p.status === "boarded").length;
  const faltan = total - abordaron;

  elements.totalCount.textContent = total;
  elements.boardedCount.textContent = abordaron;
  elements.missingCount.textContent = faltan;
}

// =======================
// Utilidad
// =======================
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
