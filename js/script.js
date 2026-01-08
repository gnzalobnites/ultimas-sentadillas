let series = JSON.parse(localStorage.getItem('series')) || [];
let primeraFecha = localStorage.getItem('primeraFecha');

document.addEventListener('DOMContentLoaded', () => {
  actualizarReloj();
  setInterval(actualizarReloj, 1000);
  cargarDatos();
});

function registrarSerie() {
  const ahora = new Date();
  const hora = ahora.toLocaleTimeString('es-ES', { hour12: false });
  const numero = series.length + 1;

  series.push({ numero, hora });
  localStorage.setItem('series', JSON.stringify(series));

  if (!primeraFecha) {
    primeraFecha = ahora.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    localStorage.setItem('primeraFecha', primeraFecha);
  }

  renderizarTabla();
}

function borrarDatos() {
  if (confirm('¿Borrar todos los registros? Esta acción no se puede deshacer.')) {
    series = [];
    primeraFecha = null;
    localStorage.removeItem('series');
    localStorage.removeItem('primeraFecha');
    cargarDatos();
  }
}

function cargarDatos() {
  const fechaElem = document.getElementById('fechaContainer');
  if (primeraFecha) {
    fechaElem.textContent = `Primera serie: ${primeraFecha}`;
  } else {
    fechaElem.textContent = '';
  }
  renderizarTabla();
}

function renderizarTabla() {
  const contenedor = document.getElementById('tablaSeries');
  if (series.length === 0) {
    contenedor.innerHTML = '<p style="text-align:center;color:#777;">Sin registros</p>';
    return;
  }

  let html = '<table><thead><tr><th>Serie</th><th>Hora</th></tr></thead><tbody>';
  series.forEach(item => {
    html += `<tr><td>${item.numero}</td><td>${item.hora}</td></tr>`;
  });
  html += '</tbody></table>';
  contenedor.innerHTML = html;
}

function actualizarReloj() {
  const ahora = new Date();
  const hora = ahora.toLocaleTimeString('es-ES', { hour12: false });
  document.getElementById('reloj').textContent = hora;
}
