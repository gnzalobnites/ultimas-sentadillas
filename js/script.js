let numeroSerie = 0;
let intervaloCronometro = null;
let ultimoTimestamp = null;

function actualizarDisposicionElementos() {
    const cronometro = document.querySelector('.cronometro-container');
    const tablaContainer = document.querySelector('.tabla-container');
    const seriesGuardadas = JSON.parse(localStorage.getItem('seriesSentadillas') || '[]');
    
    const hayRegistros = seriesGuardadas.length > 0;
    
    if (hayRegistros) {
        cronometro.classList.add('fijo-arriba-botones');
        tablaContainer.classList.add('con-registros');
        
        // CÁLCULO EXACTO DE ALTURA DISPONIBLE PARA TABLA
        const alturaVentana = window.innerHeight;
        
        // Altura de elementos FIJOS (en píxeles)
        const alturaTitulo = 110;       // Título + fecha + márgenes
        const alturaCronometro = 70;    // Cronómetro
        const alturaBotones = 80;       // Botones circulares
        const alturaFooter = 70;        // Footer
        const separacionesFijas = 140;  // Suma de todos los espacios
        
        // Cálculo exacto
        const espacioFijo = alturaTitulo + alturaCronometro + alturaBotones + 
                           alturaFooter + separacionesFijas;
        
        // 20px de margen entre tabla y cronómetro
        const margenTablaCronometro = 20;
        
        const alturaDisponible = alturaVentana - espacioFijo - margenTablaCronometro;
        
        // Limitar altura máxima (55% de la pantalla) y mínima (100px)
        const alturaCalculada = Math.max(100, Math.min(alturaDisponible, alturaVentana * 0.55));
        
        console.log('Cálculo altura tabla:', {
            alturaVentana,
            espacioFijo,
            margenTablaCronometro,
            alturaDisponible,
            alturaCalculada
        });
        
        tablaContainer.style.maxHeight = alturaCalculada + 'px';
        
        // Asegurar que la tabla NO llegue al cronómetro
        const tablaRect = tablaContainer.getBoundingClientRect();
        const cronometroRect = cronometro.getBoundingClientRect();
        
        if (tablaRect.bottom + 20 > cronometroRect.top) {
            // Ajuste adicional si se está superponiendo
            const ajusteNecesario = (tablaRect.bottom + 20) - cronometroRect.top;
            tablaContainer.style.maxHeight = (alturaCalculada - ajusteNecesario) + 'px';
        }
    } else {
        cronometro.classList.remove('fijo-arriba-botones');
        tablaContainer.classList.remove('con-registros');
        tablaContainer.style.maxHeight = '0';
    }
}

window.addEventListener('resize', actualizarDisposicionElementos);

// El resto del código JavaScript permanece IGUAL
// ... (todas las demás funciones sin cambios)

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
    if (intervaloCronometro) {
        clearInterval(intervaloCronometro);
    }
    
    if (ultimoTimestamp) {
        intervaloCronometro = setInterval(() => {
            const ahora = new Date().getTime();
            const segundosTranscurridos = Math.floor((ahora - ultimoTimestamp) / 1000);
            document.getElementById('cronometro').textContent = formatearTiempo(segundosTranscurridos);
        }, 1000);
    }
}

function actualizarNumerosSeries() {
    const filas = document.querySelectorAll('#tablaSeries tbody tr');
    let seriesActualizadas = [];
    let nuevoNumero = 1;
    
    filas.forEach(fila => {
        const celdaSerie = fila.cells[0];
        const contenidoDiv = celdaSerie.querySelector('.contenido-celda');
        const botonEliminar = contenidoDiv.querySelector('.boton-eliminar');
        const numeroOriginal = parseInt(botonEliminar.dataset.numeroOriginal);
        
        contenidoDiv.firstChild.textContent = `Serie ${nuevoNumero}`;
        botonEliminar.dataset.numeroActual = nuevoNumero;
        
        const serieGuardada = JSON.parse(localStorage.getItem('seriesSentadillas') || '[]')
            .find(s => s.numero === numeroOriginal);
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
    numeroSerie = seriesActualizadas.length > 0 ? seriesActualizadas.length : 0;
    
    if (seriesActualizadas.length > 0) {
        const primeraSerie = seriesActualizadas.reduce((min, serie) => {
            return serie.timestamp < min.timestamp ? serie : min;
        }, seriesActualizadas[0]);
        document.getElementById('fechaContainer').textContent = obtenerFechaFormateada(new Date(primeraSerie.timestamp));
        
        const ultimaSerie = seriesActualizadas.reduce((max, serie) => {
            return serie.timestamp > max.timestamp ? serie : max;
        }, seriesActualizadas[0]);
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
    contenidoSerie.innerHTML = `Serie ${numeroSerie}`;
    
    const botonEliminar = document.createElement('button');
    botonEliminar.className = 'boton-eliminar';
    botonEliminar.textContent = '×';
    botonEliminar.dataset.numeroOriginal = numeroSerie;
    botonEliminar.dataset.numeroActual = numeroSerie;
    botonEliminar.onclick = function() {
        if (confirm('¿Estás seguro de que quieres eliminar esta serie?')) {
            nuevaFila.remove();
            actualizarNumerosSeries();
        }
    };
    
    contenidoSerie.appendChild(botonEliminar);
    celdaSerie.appendChild(contenidoSerie);
    
    celdaHora.textContent = horaFormateada;
    
    const series = JSON.parse(localStorage.getItem('seriesSentadillas') || '[]');
    series.push({
        numero: numeroSerie,
        hora: horaFormateada,
        timestamp: ahora.getTime()
    });
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
        const tabla = document.getElementById('tablaSeries').getElementsByTagName('tbody')[0];
        tabla.innerHTML = '';
        
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

window.onload = function() {
    const seriesGuardadas = JSON.parse(localStorage.getItem('seriesSentadillas') || '[]');
    if (seriesGuardadas.length > 0) {
        const tabla = document.getElementById('tablaSeries').getElementsByTagName('tbody')[0];
        
        seriesGuardadas.sort((a, b) => a.timestamp - b.timestamp);
        
        seriesGuardadas.forEach(serie => {
            const nuevaFila = tabla.insertRow();
            
            const celdaSerie = nuevaFila.insertCell(0);
            const celdaHora = nuevaFila.insertCell(1);
            
            const contenidoSerie = document.createElement('div');
            contenidoSerie.className = 'contenido-celda';
            contenidoSerie.innerHTML = `Serie ${serie.numero}`;
            
            const botonEliminar = document.createElement('button');
            botonEliminar.className = 'boton-eliminar';
            botonEliminar.textContent = '×';
            botonEliminar.dataset.numeroOriginal = serie.numero;
            botonEliminar.dataset.numeroActual = serie.numero;
            botonEliminar.onclick = function() {
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
        
        const primeraSerie = seriesGuardadas.reduce((min, s) => s.timestamp < min.timestamp ? s : min, seriesGuardadas[0]);
        document.getElementById('fechaContainer').textContent = obtenerFechaFormateada(new Date(primeraSerie.timestamp));
        
        const ultimaSerie = seriesGuardadas.reduce((max, s) => s.timestamp > max.timestamp ? s : max, seriesGuardadas[0]);
        ultimoTimestamp = ultimaSerie.timestamp;
        iniciarCronometro();
    }
    
    actualizarDisposicionElementos();
};
