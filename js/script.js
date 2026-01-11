let numeroSerie = 0;
let intervaloCronometro = null;
let ultimoTimestamp = null;
let botonesFijos = null;

// Función para detectar si es móvil
function esDispositivoMovil() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Función para manejar el viewport en móviles
function ajustarViewportMovil() {
    if (esDispositivoMovil()) {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
    }
}

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
        
        setTimeout(() => {
            cronometroContainer.classList.add('mostrar');
        }, 100);

        // Mostrar botones fijos con animación
        botonesFijos.classList.add('visible');
        botonesFijos.style.display = 'flex';
        
        // Forzar reflow para asegurar renderizado
        void botonesFijos.offsetWidth;

        // Ajustar posición en móviles
        if (esDispositivoMovil()) {
            const footerHeight = getComputedStyle(document.documentElement).getPropertyValue('--altura-footer');
            botonesFijos.style.bottom = `calc(${footerHeight} + 15px)`;
        }

        // Asegurar que la tabla tenga scroll si hay muchas series
        const tablaContainer = document.querySelector('.tabla-container');
        if (seriesGuardadas.length > 3) {
            tablaContainer.classList.add('con-registros');
            setTimeout(() => {
                tablaContainer.style.maxHeight = '35vh';
            }, 50);
        }

    } else {
        cronometroContainer.classList.remove('mostrar');
        setTimeout(() => {
            cronometroContainer.style.display = 'none';
            fechaContainer.style.display = 'none';
        }, 300);
        
        document.querySelector('.tabla-container').classList.remove('con-registros');
        document.querySelector('.tabla-container').style.maxHeight = '0';
        
        botonesFijos.classList.remove('visible');
        setTimeout(() => {
            botonesFijos.style.display = 'none';
        }, 300);
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
    if (intervaloCronometro) {
        clearInterval(intervaloCronometro);
        intervaloCronometro = null;
    }
    
    if (!ultimoTimestamp) return;
    
    intervaloCronometro = setInterval(() => {
        const ahora = new Date().getTime();
        const segundosTranscurridos = Math.floor((ahora - ultimoTimestamp) / 1000);
        const cronometro = document.getElementById('cronometro');
        if (cronometro) {
            cronometro.textContent = formatearTiempo(segundosTranscurridos);
            
            // Cambiar color cada hora
            if (segundosTranscurridos >= 3600) {
                cronometro.style.color = '#ff6b6b';
            } else if (segundosTranscurridos >= 1800) {
                cronometro.style.color = '#ffa726';
            } else {
                cronometro.style.color = '#333';
            }
        }
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
        
        contenidoSerie.firstChild.textContent = `Serie ${nuevoNumero}`;
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
        const cronometro = document.getElementById('cronometro');
        if (cronometro) {
            cronometro.textContent = '00:00:00';
            cronometro.style.color = '#333';
        }
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
    nuevaFila.style.animation = 'slideUp 0.3s ease';
    
    const celdaSerie = nuevaFila.insertCell(0);
    const celdaHora = nuevaFila.insertCell(1);
    
    const contenidoSerie = document.createElement('div');
    contenidoSerie.className = 'contenido-celda';
    
    const textoSerie = document.createElement('span');
    textoSerie.textContent = `Serie ${numeroSerie}`;
    contenidoSerie.appendChild(textoSerie);
    
    const botonEliminar = document.createElement('button');
    botonEliminar.className = 'boton-eliminar';
    botonEliminar.textContent = '×';
    botonEliminar.dataset.numeroOriginal = numeroSerie;
    botonEliminar.dataset.numeroActual = numeroSerie;
    botonEliminar.setAttribute('aria-label', `Eliminar serie ${numeroSerie}`);
    botonEliminar.setAttribute('title', 'Eliminar esta serie');
    
    botonEliminar.onclick = function (e) {
        e.stopPropagation();
        if (confirm('¿Estás seguro de que quieres eliminar esta serie?')) {
            nuevaFila.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                nuevaFila.remove();
                actualizarNumerosSeries();
            }, 300);
        }
    };
    
    // Para móviles: también permitir eliminar con toque largo
    let touchTimer;
    botonEliminar.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchTimer = setTimeout(() => {
            if (confirm('¿Eliminar esta serie?')) {
                nuevaFila.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    nuevaFila.remove();
                    actualizarNumerosSeries();
                }, 300);
            }
        }, 1000);
    });
    
    botonEliminar.addEventListener('touchend', function(e) {
        e.preventDefault();
        clearTimeout(touchTimer);
    });
    
    contenidoSerie.appendChild(botonEliminar);
    celdaSerie.appendChild(contenidoSerie);
    celdaHora.textContent = horaFormateada;
    
    // Agregar animación a la celda de hora
    celdaHora.style.animation = 'pulse 0.5s ease';
    setTimeout(() => {
        celdaHora.style.animation = '';
    }, 500);
    
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
    
    // Feedback táctil en móviles
    if ('vibrate' in navigator && esDispositivoMovil()) {
        navigator.vibrate(50);
    }
}

function borrarDatos() {
    if (confirm('¿Estás seguro de que quieres borrar todas las series registradas? Esta acción no se puede deshacer.')) {
        const filas = document.querySelectorAll('#tablaSeries tbody tr');
        
        // Animación de eliminación
        filas.forEach((fila, index) => {
            fila.style.animation = 'fadeOut 0.3s ease';
            fila.style.animationDelay = `${index * 0.1}s`;
        });
        
        setTimeout(() => {
            document.getElementById('tablaSeries').getElementsByTagName('tbody')[0].innerHTML = '';
            numeroSerie = 0;
            document.getElementById('fechaContainer').textContent = '';
            localStorage.removeItem('seriesSentadillas');
            ultimoTimestamp = null;
            
            const cronometro = document.getElementById('cronometro');
            if (cronometro) {
                cronometro.textContent = '00:00:00';
                cronometro.style.color = '#333';
            }
            
            if (intervaloCronometro) {
                clearInterval(intervaloCronometro);
                intervaloCronometro = null;
            }
            
            actualizarDisposicionElementos();
            
            // Feedback táctil en móviles
            if ('vibrate' in navigator && esDispositivoMovil()) {
                navigator.vibrate([100, 50, 100]);
            }
        }, filas.length * 100);
    }
}

function iniciarEntrenamiento() {
    const estadoInicial = document.getElementById('estadoInicial');
    const botonComenzar = document.getElementById('botonComenzar');
    
    // Animación de salida
    estadoInicial.style.animation = 'fadeOut 0.5s ease';
    botonComenzar.disabled = true;
    
    setTimeout(() => {
        document.getElementById('tablaSeries').getElementsByTagName('tbody')[0].innerHTML = '';
        numeroSerie = 0;
        localStorage.removeItem('seriesSentadillas');
        ultimoTimestamp = null;
        
        const cronometro = document.getElementById('cronometro');
        if (cronometro) {
            cronometro.textContent = '00:00:00';
            cronometro.style.color = '#333';
        }
        
        if (intervaloCronometro) {
            clearInterval(intervaloCronometro);
            intervaloCronometro = null;
        }

        document.getElementById('contenedorPrincipal').classList.add('con-registros');
        const ahora = new Date();
        document.getElementById('fechaContainer').textContent = obtenerFechaFormateada(ahora);
        
        actualizarDisposicionElementos();
        
        // Feedback táctil en móviles
        if ('vibrate' in navigator && esDispositivoMovil()) {
            navigator.vibrate(100);
        }
    }, 500);
}

function inicializarEventos() {
    // Botón Comenzar
    const botonComenzar = document.getElementById('botonComenzar');
    if (botonComenzar) {
        botonComenzar.addEventListener('click', iniciarEntrenamiento);
        
        // Mejorar accesibilidad táctil
        botonComenzar.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        botonComenzar.addEventListener('touchend', function() {
            this.style.transform = '';
        });
    }
    
    // Botones fijos - mejoras táctiles
    const botonRegistrar = document.querySelector('.boton-registrar');
    const botonBorrar = document.querySelector('.boton-borrar');
    
    [botonRegistrar, botonBorrar].forEach(boton => {
        if (boton) {
            boton.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
            });
            
            boton.addEventListener('touchend', function() {
                this.style.transform = '';
            });
        }
    });
    
    // Prevenir zoom con doble toque en móviles
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Ajustar en redimensionamiento
    window.addEventListener('resize', function() {
        actualizarDisposicionElementos();
    });
    
    // Manejar cambios de orientación en móviles
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            actualizarDisposicionElementos();
            if (esDispositivoMovil()) {
                ajustarViewportMovil();
            }
        }, 300);
    });
}

window.onload = function () {
    // Ajustar viewport para móviles
    ajustarViewportMovil();
    
    // Inicializar eventos
    inicializarEventos();
    
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
            
            const textoSerie = document.createElement('span');
            textoSerie.textContent = `Serie ${serie.numero}`;
            contenidoSerie.appendChild(textoSerie);
            
            const botonEliminar = document.createElement('button');
            botonEliminar.className = 'boton-eliminar';
            botonEliminar.textContent = '×';
            botonEliminar.dataset.numeroOriginal = serie.numero;
            botonEliminar.dataset.numeroActual = serie.numero;
            botonEliminar.setAttribute('aria-label', `Eliminar serie ${serie.numero}`);
            botonEliminar.setAttribute('title', 'Eliminar esta serie');
            
            botonEliminar.onclick = function (e) {
                e.stopPropagation();
                if (confirm('¿Estás seguro de que quieres eliminar esta serie?')) {
                    nuevaFila.style.animation = 'fadeOut 0.3s ease';
                    setTimeout(() => {
                        nuevaFila.remove();
                        actualizarNumerosSeries();
                    }, 300);
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
        
        // Asegurar que todo se renderice correctamente
        setTimeout(() => {
            actualizarDisposicionElementos();
            document.querySelector('.cronometro-container').classList.add('mostrar');
            
            // Forzar renderizado en móviles
            if (esDispositivoMovil()) {
                document.body.style.overflow = 'hidden';
                setTimeout(() => {
                    document.body.style.overflow = '';
                }, 100);
            }
        }, 100);
    } else {
        actualizarDisposicionElementos();
    }
    
    // Asegurar que los botones fijos estén inicializados
    botonesFijos = document.getElementById('botonesFijos');
    if (botonesFijos) {
        botonesFijos.style.display = 'none';
    }
};

// Añadir animación para fadeOut (si no está definida en CSS)
if (!document.querySelector('#fadeOutAnimation')) {
    const style = document.createElement('style');
    style.id = 'fadeOutAnimation';
    style.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); }
        }
    `;
    document.head.appendChild(style);
}

// Service Worker para PWA (opcional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
        }
