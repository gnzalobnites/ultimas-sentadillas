let numeroSerie = 0;
let intervaloCronometro = null;
let ultimoTimestamp = null;

function actualizarDisposicionElementos() {
    const contenedorPrincipal = document.getElementById('contenedorPrincipal');
    const cronometroContainer = document.querySelector('.cronometro-container');
    const fechaContainer = document.getElementById('fechaContainer');
    const botonesFijos = document.getElementById('botonesFijos');
    const seriesGuardadas = JSON.parse(localStorage.getItem('seriesSentadillas') || '[]');
    
    const modoEntrenamientoIniciado = contenedorPrincipal.classList.contains('con-registros');

    if (modoEntrenamientoIniciado) {
        fechaContainer.style.display = 'block';
        cronometroContainer.style.display = 'block';
        setTimeout(() => cronometroContainer.classList.add('mostrar'), 100);
        
        // SOLUCIÓN: Usar clase para mostrar botones
        botonesFijos.classList.add('visible');
        
        // Forzar reflow para Chrome Android
        setTimeout(() => {
            botonesFijos.style.display = 'flex';
        }, 10);

        // Ya no mostramos ninguna instrucción especial si no hay registros
        document.querySelector('.tabla-container').classList.toggle('con-registros', seriesGuardadas.length > 0);
    } else {
        cronometroContainer.classList.remove('mostrar');
        setTimeout(() => {
            cronometroContainer.style.display = 'none';
            fechaContainer.style.display = 'none';
        }, 300);
        document.querySelector('.tabla-container').classList.remove('con-registros');
        
        // SOLUCIÓN: Usar clase para ocultar botones
        botonesFijos.classList.remove('visible');
        setTimeout(() => {
            botonesFijos.style.display = 'none';
        }, 10);
    }
}

function obtenerFechaFormateada(fecha) {
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const diaSemana = dias[fecha.getDay()];
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();
    return `${diaSemana} ${dia} de ${mes} de ${año}`;
}

function formatearTiempo(segundos) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
}

function iniciarCronometro() {
    if (intervaloCronometro) clearInterval(intervaloCronometro);
    if (!ultimoTimestamp) return;
    
    intervaloCronometro = setInterval(() => {
        const ahora = new Date().getTime();
        const segundosTranscurridos = Math.floor((ahora - ultimoTimestamp) / 1000);
        document.getElementById('cronometro').textContent = formatearTiempo(segundosTranscurridos);
    }, 1000);
}

function actualizarNumerosSeries() {
    const filas = document.querySelectorAll('#tablaSeries tbody tr');
    let seriesActualizadas = [];
    let nuevoNumero = 1;
    
    filas.forEach(fila => {
        const celdaSerie = fila.cells[0];
        const contenidoDiv = celdaSerie.querySelector('.contenido-celda');
        const botonEliminar = contenidoDiv.querySelector('.boton-eliminar');
        
        contenidoDiv.firstChild.textContent = `Serie ${nuevoNumero}`;
        botonEliminar.dataset.numeroActual = nuevoNumero;
        
        const serieGuardada = JSON.parse(localStorage.getItem('seriesSentadillas') || '[]')
            .find(s => s.numero == botonEliminar.dataset.numeroOriginal);
        if (serieGuardada) {
            seriesActualizadas.push({
                numero: nuevoNumero,
                hora: serieGuardada.hora,
                timestamp: serieGuardada.timestamp
            });
        }
        nuevoNumero++;
    });
    
    localStorage.setItem('seriesSentadillas', JSON.stringify(seriesActualizadas));
    numeroSerie = seriesActualizadas.length;
    
    if (seriesActualizadas.length > 0) {
        const primeraSerie = seriesActualizadas.reduce((min, s) => s.timestamp < min.timestamp ? s : min, seriesActualizadas[0]);
        document.getElementById('fechaContainer').textContent = obtenerFechaFormateada(new Date(primeraSerie.timestamp));
        const ultimaSerie = seriesActualizadas.reduce((max, s) => s.timestamp > max.timestamp ? s : max, seriesActualizadas[0]);
        ultimoTimestamp = ultimaSerie.timestamp;
        iniciarCronometro();
    } else {
        document.getElementById('fechaContainer').textContent = '';
        ultimoTimestamp = null;
        document.getElementById('cronometro').textContent = '00:00:00';
        if (intervaloCronometro) {
            clearInterval(intervaloCronometro);
            intervaloCronometro = null;
        }
    }
    
    actualizarDisposicionElementos();
}

function registrarSerie() {
    const ahora = new Date();
    const horaFormateada = ahora.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    numeroSerie++;
    
    const tabla = document.getElementById('tablaSeries').getElementsByTagName('tbody')[0];
    const nuevaFila = tabla.insertRow();
    
    const celdaSerie = nuevaFila.insertCell(0);
    const celdaHora = nuevaFila.insertCell(1);
    
    const contenidoSerie = document.createElement('div');
    contenidoSerie.className = 'contenido-celda';
    contenidoSerie.textContent = `Serie ${numeroSerie}`;
    
    const botonEliminar = document.createElement('button');
    botonEliminar.className = 'boton-eliminar';
    botonEliminar.textContent = '×';
    botonEliminar.dataset.numeroOriginal = numeroSerie;
    botonEliminar.dataset.numeroActual = numeroSerie;
    botonEliminar.setAttribute('aria-label', `Eliminar serie ${numeroSerie}`);
    botonEliminar.onclick = function () {
        if (confirm('¿Estás seguro de que quieres eliminar esta serie?')) {
            nuevaFila.remove();
            actualizarNumerosSeries();
        }
    };
    
    contenidoSerie.appendChild(botonEliminar);
    celdaSerie.appendChild(contenidoSerie);
    celdaHora.textContent = horaFormateada;
    
    const series = JSON.parse(localStorage.getItem('seriesSentadillas') || '[]');
    series.push({ numero: numeroSerie, hora: horaFormateada, timestamp: ahora.getTime() });
    localStorage.setItem('seriesSentadillas', JSON.stringify(series));
    
    if (series.length === 1) {
        document.getElementById('fechaContainer').textContent = obtenerFechaFormateada(ahora);
    }
    
    ultimoTimestamp = ahora.getTime();
    iniciarCronometro();
    actualizarDisposicionElementos();
}

function borrarDatos() {
    if (confirm('¿Estás seguro de que quieres borrar todas las series registradas? Esta acción no se puede deshacer.')) {
        document.getElementById('tablaSeries').getElementsByTagName('tbody')[0].innerHTML = '';
        numeroSerie = 0;
        document.getElementById('fechaContainer').textContent = '';
        localStorage.removeItem('seriesSentadillas');
        ultimoTimestamp = null;
        document.getElementById('cronometro').textContent = '00:00:00';
        if (intervaloCronometro) {
            clearInterval(intervaloCronometro);
            intervaloCronometro = null;
        }
        actualizarDisposicionElementos();
    }
}

function iniciarEntrenamiento() {
    document.getElementById('tablaSeries').getElementsByTagName('tbody')[0].innerHTML = '';
    numeroSerie = 0;
    localStorage.removeItem('seriesSentadillas');
    ultimoTimestamp = null;
    document.getElementById('cronometro').textContent = '00:00:00';
    if (intervaloCronometro) {
        clearInterval(intervaloCronometro);
        intervaloCronometro = null;
    }

    document.getElementById('contenedorPrincipal').classList.add('con-registros');
    const ahora = new Date();
    document.getElementById('fechaContainer').textContent = obtenerFechaFormateada(ahora);
    actualizarDisposicionElementos();
}

window.onload = function () {
    const seriesGuardadas = JSON.parse(localStorage.getItem('seriesSentadillas') || '[]');
    
    if (seriesGuardadas.length > 0) {
        document.getElementById('contenedorPrincipal').classList.add('con-registros');
        const tabla = document.getElementById('tablaSeries').getElementsByTagName('tbody')[0];
        seriesGuardadas.sort((a, b) => a.timestamp - b.timestamp);
        
        seriesGuardadas.forEach(serie => {
            const nuevaFila = tabla.insertRow();
            const celdaSerie = nuevaFila.insertCell(0);
            const celdaHora = nuevaFila.insertCell(1);
            
            const contenidoSerie = document.createElement('div');
            contenidoSerie.className = 'contenido-celda';
            contenidoSerie.textContent = `Serie ${serie.numero}`;
            
            const botonEliminar = document.createElement('button');
            botonEliminar.className = 'boton-eliminar';
            botonEliminar.textContent = '×';
            botonEliminar.dataset.numeroOriginal = serie.numero;
            botonEliminar.dataset.numeroActual = serie.numero;
            botonEliminar.setAttribute('aria-label', `Eliminar serie ${serie.numero}`);
            botonEliminar.onclick = function () {
                if (confirm('¿Estás seguro de que quieres eliminar esta serie?')) {
                    nuevaFila.remove();
                    actualizarNumerosSeries();
                }
            };
            
            contenidoSerie.appendChild(botonEliminar);
            celdaSerie.appendChild(contenidoSerie);
            celdaHora.textContent = serie.hora;
            numeroSerie = Math.max(numeroSerie, serie.numero);
        });
        
        const primeraSerie = seriesGuardadas[0];
        document.getElementById('fechaContainer').textContent = obtenerFechaFormateada(new Date(primeraSerie.timestamp));
        const ultimaSerie = seriesGuardadas[seriesGuardadas.length - 1];
        ultimoTimestamp = ultimaSerie.timestamp;
        iniciarCronometro();
        
        setTimeout(() => {
            document.querySelector('.cronometro-container').classList.add('mostrar');
        }, 300);
    }
    
    actualizarDisposicionElementos();

    const botonComenzar = document.getElementById('botonComenzar');
    if (botonComenzar) {
        botonComenzar.addEventListener('click', iniciarEntrenamiento);
    }
};
