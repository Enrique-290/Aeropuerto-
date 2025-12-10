// Lógica corregida para leer Excel por columnas
let pasajeros = [];
let filtros = { texto: "", estado: "all", hotel: "", aerolinea: "" };
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

  elements.fileInput.addEventListener("change", handleFile);
  renderEmpty();
});

function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    const dataRows = rows.slice(1);

    pasajeros = dataRows.map(cols => ({
      folio: cols[0],
      nombre: String(cols[1]).trim(),
      puesto: String(cols[2]).trim(),
      hotel: String(cols[3]).trim(),
      aerolinea: String(cols[4]).trim(),
      horario: String(cols[5]).trim(),
      status: "pending"
    }));

    renderList();
  };

  reader.readAsArrayBuffer(file);
}

function renderEmpty() {
  elements.list.innerHTML = "<li class='empty-state'>Carga el Excel para ver la lista.</li>";
}

function renderList() {
  if (!pasajeros.length) return renderEmpty();
  elements.list.innerHTML = "";
  pasajeros.forEach(p => {
    const li = document.createElement("li");
    li.textContent = p.folio + " - " + p.nombre;
    elements.list.appendChild(li);
  });

  elements.totalCount.textContent = pasajeros.length;
}
