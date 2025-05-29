document.addEventListener('DOMContentLoaded', function() {
    // Lógica Menú Hamburguesa
    const adminMenuToggle = document.getElementById('adminMenuToggle');
    const adminMenu = document.getElementById('adminMenu'); 
    if (adminMenuToggle && adminMenu) {
        adminMenuToggle.addEventListener('click', function() {
        adminMenu.classList.toggle('admin-menu-open');
        const isExpanded = adminMenu.classList.contains('admin-menu-open');
        this.setAttribute('aria-expanded', isExpanded);
        this.innerHTML = isExpanded ? '&times;' : '&#9776;';
        this.setAttribute('aria-label', isExpanded ? 'Cerrar menú' : 'Abrir menú');
        });
    }

    if (typeof db === 'undefined' || typeof FullCalendar === 'undefined') {
        console.error("Firebase (db) o FullCalendar no están inicializados.");
        alert("Error crítico: No se pudo cargar la agenda. Revisa la consola.");
        return;
    }

    const calendarioEl = document.getElementById('calendario');
    const modalCita = document.getElementById('modal-cita');
    const btnCerrarModalCita = document.getElementById('cerrar-modal-cita');
    const formCita = document.getElementById('form-cita');
    const modalCitaTitulo = document.getElementById('modal-cita-titulo');
    const citaIdInput = document.getElementById('cita-id');
    const citaTituloInput = document.getElementById('cita-titulo');
    const citaTipoSelect = document.getElementById('cita-tipo');
    const citaFechaInicioInput = document.getElementById('cita-fecha-inicio');
    const citaFechaFinInput = document.getElementById('cita-fecha-fin');
    const citaTodoElDiaCheckbox = document.getElementById('cita-todo-el-dia');
    const citaVehiculoSelect = document.getElementById('cita-vehiculo');
    const infoVehiculoCitaDiv = document.getElementById('info-vehiculo-cita');
    const citaDescripcionTextarea = document.getElementById('cita-descripcion');
    const citaColorInput = document.getElementById('cita-color');
    const btnEliminarCita = document.getElementById('btn-eliminar-cita');
    const btnCrearCita = document.getElementById('btn-crear-cita');

    let calendario;
    let vehiculosCargados = []; // Para el select de vehículos

    // --- CARGAR VEHÍCULOS PARA EL SELECT ---
    async function cargarVehiculosParaSelect() {
        try {
            const snapshot = await db.collection("vehiculos").orderBy("patente").get();
            vehiculosCargados = [];
            citaVehiculoSelect.innerHTML = '<option value="">-- Ninguno --</option>'; // Opción por defecto
            snapshot.forEach(doc => {
                const v = doc.data();
                const vehiculo = { id: doc.id, ...v };
                vehiculosCargados.push(vehiculo);
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = `${v.patente || 'S/P'} - ${v.marca || 'S/M'} ${v.modelo || ''} (${v.clienteNombre || 'S/N'})`;
                citaVehiculoSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error cargando vehículos para el select de citas:", error);
        }
    }
    
    if (citaVehiculoSelect && infoVehiculoCitaDiv) {
        citaVehiculoSelect.addEventListener('change', function() {
            const selectedId = this.value;
            if (selectedId) {
                const vehiculo = vehiculosCargados.find(v => v.id === selectedId);
                if (vehiculo) {
                    infoVehiculoCitaDiv.textContent = `Cliente: ${vehiculo.clienteNombre || 'N/A'}, Tel: ${vehiculo.clienteTelefono || 'N/A'}`;
                } else {
                    infoVehiculoCitaDiv.textContent = '';
                }
            } else {
                infoVehiculoCitaDiv.textContent = '';
            }
        });
    }


    // --- MANEJO DEL MODAL DE CITAS ---
    function abrirModalCita(data = {}) { // data puede ser info de un clic en fecha o un evento existente
        formCita.reset();
        infoVehiculoCitaDiv.textContent = ''; // Limpiar info del vehículo
        citaIdInput.value = data.id || ''; // Si es un evento existente, tendrá id
        citaTituloInput.value = data.title || '';
        citaTipoSelect.value = data.extendedProps?.tipoCita || 'recepcion';
        citaColorInput.value = data.color || data.backgroundColor || '#ad0000';
        citaDescripcionTextarea.value = data.extendedProps?.description || '';
        
        citaTodoElDiaCheckbox.checked = data.allDay || false;
        citaFechaFinInput.disabled = data.allDay || false;


        if (data.start) { // Fecha de inicio
            // FullCalendar devuelve fechas en formato que datetime-local puede necesitar ajuste
            // Si data.start es un objeto Date de JS:
            let startStr = '';
            if (data.start instanceof Date) {
                startStr = data.allDay ? data.start.toISOString().substring(0, 10) + "T00:00" : data.start.toISOString().substring(0, 16);
            } else if (typeof data.startStr === 'string') { // Si es startStr de FullCalendar
                 startStr = data.allDay ? data.startStr.substring(0, 10) + "T00:00" : data.startStr.substring(0, 16);
            }
            citaFechaInicioInput.value = startStr;
        } else {
             // Poner fecha y hora actual por defecto si es nueva cita desde botón
            const ahora = new Date();
            ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset()); // Ajustar a zona horaria local para input
            citaFechaInicioInput.value = ahora.toISOString().substring(0, 16);
        }


        if (data.end) { // Fecha de fin
            let endStr = '';
            if (data.end instanceof Date) {
                endStr = data.allDay ? data.end.toISOString().substring(0, 10) + "T00:00" : data.end.toISOString().substring(0, 16);
            } else if (typeof data.endStr === 'string') {
                endStr = data.allDay ? data.endStr.substring(0, 10) + "T00:00" : data.endStr.substring(0, 16);
            }
             citaFechaFinInput.value = endStr;
        } else if (data.start && !data.allDay) { // Si hay inicio pero no fin, sugerir 1 hora después
            const inicio = new Date(citaFechaInicioInput.value);
            inicio.setHours(inicio.getHours() + 1);
            citaFechaFinInput.value = inicio.toISOString().substring(0,16);
        }


        if (data.extendedProps?.vehiculoId) {
            citaVehiculoSelect.value = data.extendedProps.vehiculoId;
            citaVehiculoSelect.dispatchEvent(new Event('change')); // Para mostrar info del vehículo
        }


        modalCitaTitulo.textContent = data.id ? "Editar Cita" : "Agregar Nueva Cita";
        btnEliminarCita.style.display = data.id ? 'inline-block' : 'none';
        modalCita.style.display = 'block';
    }

    if (btnCrearCita) {
        btnCrearCita.onclick = () => abrirModalCita();
    }
    if (btnCerrarModalCita && modalCita) {
        btnCerrarModalCita.onclick = () => { modalCita.style.display = 'none'; }
    }
    window.addEventListener('click', function(event) {
        if (event.target == modalCita && modalCita) modalCita.style.display = 'none';
    });
    
    citaTodoElDiaCheckbox.addEventListener('change', function() {
        citaFechaFinInput.disabled = this.checked;
        if (this.checked) {
            citaFechaFinInput.value = ''; // Limpiar fecha fin si es todo el día
            // Ajustar hora de inicio a las 00:00 si se marca todo el día
            const inicio = new Date(citaFechaInicioInput.value);
            inicio.setHours(0,0,0,0);
            citaFechaInicioInput.value = inicio.toISOString().substring(0,10) + "T00:00";

        } else {
             // Si se desmarca, y no hay fecha fin, poner una hora después del inicio
            if (!citaFechaFinInput.value && citaFechaInicioInput.value) {
                const inicio = new Date(citaFechaInicioInput.value);
                inicio.setHours(inicio.getHours() + 1);
                citaFechaFinInput.value = inicio.toISOString().substring(0,16);
            }
        }
    });


    // --- INICIALIZACIÓN DE FULLCALENDAR ---
    if (calendarioEl) {
        calendario = new FullCalendar.Calendar(calendarioEl, {
            locale: 'es', // Para idioma español
            initialView: 'dayGridMonth', // Vista inicial
            headerToolbar: {
                left: 'prev,next today btnCrearCitaDesdeHeader', // Añadido botón al header
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            },
            customButtons: {
                btnCrearCitaDesdeHeader: {
                    text: 'Nueva Cita',
                    click: function() {
                        abrirModalCita({ start: new Date() }); // Abrir modal con fecha actual
                    }
                }
            },
            editable: true,       // Permite arrastrar y redimensionar eventos
            selectable: true,     // Permite seleccionar fechas/horas
            selectMirror: true,
            dayMaxEvents: true,   // Permite "more" link cuando hay muchos eventos
            events: cargarCitasDesdeFirestore, // Función que carga los eventos

            select: function(arg) { // Al seleccionar un rango de fechas/horas
                abrirModalCita({ start: arg.start, end: arg.end, allDay: arg.allDay });
            },
            eventClick: function(arg) { // Al hacer clic en un evento existente
                const data = {
                    id: arg.event.id,
                    title: arg.event.title,
                    start: arg.event.start,
                    end: arg.event.end,
                    allDay: arg.event.allDay,
                    color: arg.event.backgroundColor,
                    extendedProps: arg.event.extendedProps
                };
                abrirModalCita(data);
            },
            eventDrop: async function(arg) { // Al arrastrar un evento a una nueva fecha/hora
                try {
                    await db.collection('citas').doc(arg.event.id).update({
                        start: firebase.firestore.Timestamp.fromDate(arg.event.start),
                        end: arg.event.end ? firebase.firestore.Timestamp.fromDate(arg.event.end) : null,
                        allDay: arg.event.allDay
                    });
                    console.log("Cita actualizada por arrastre.");
                } catch (error) {
                    console.error("Error actualizando cita por arrastre:", error);
                    arg.revert(); // Revertir el cambio visual si falla la BD
                    alert("Error al mover la cita.");
                }
            },
            // eventResize: function(arg) { ... } // Para cuando se redimensiona un evento
        });
        calendario.render();
        cargarVehiculosParaSelect(); // Cargar vehículos al inicio
    }


    // --- CARGAR CITAS DESDE FIRESTORE ---
    function cargarCitasDesdeFirestore(fetchInfo, successCallback, failureCallback) {
        db.collection('citas').onSnapshot(snapshot => {
            const eventos = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                eventos.push({
                    id: doc.id,
                    title: data.title,
                    start: data.start.toDate(), // Convertir Timestamp de Firestore a Date de JS
                    end: data.end ? data.end.toDate() : null,
                    allDay: data.allDay || false,
                    backgroundColor: data.color || '#ad0000', // Usar color guardado o default
                    borderColor: data.color ? darkenColor(data.color, 20) : '#830000',
                    extendedProps: {
                        description: data.description,
                        vehiculoId: data.vehiculoId,
                        patenteVehiculo: data.patenteVehiculo,
                        clienteNombre: data.clienteNombre,
                        tipoCita: data.tipoCita
                    }
                });
            });
            successCallback(eventos);
        }, error => {
            console.error("Error cargando citas: ", error);
            failureCallback(error);
        });
    }
    
    function darkenColor(color, percent) { // Helper para oscurecer el borde
        let num = parseInt(color.replace("#",""),16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) - amt,
        G = (num >> 8 & 0x00FF) - amt,
        B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
    }


    // --- GUARDAR/ACTUALIZAR CITA ---
    if (formCita) {
        formCita.addEventListener('submit', async function(event) {
            event.preventDefault();
            const id = citaIdInput.value;
            const titulo = citaTituloInput.value.trim();
            const tipo = citaTipoSelect.value;
            const fechaInicioStr = citaFechaInicioInput.value;
            const fechaFinStr = citaFechaFinInput.value;
            const todoElDia = citaTodoElDiaCheckbox.checked;
            const vehiculoId = citaVehiculoSelect.value;
            const descripcion = citaDescripcionTextarea.value.trim();
            const colorEvento = citaColorInput.value;

            if (!titulo || !fechaInicioStr) {
                alert("El título y la fecha de inicio son obligatorios.");
                return;
            }

            let vehiculoSeleccionado = null;
            let patenteDelVehiculo = '';
            let nombreDelCliente = '';
            if (vehiculoId) {
                vehiculoSeleccionado = vehiculosCargados.find(v => v.id === vehiculoId);
                if (vehiculoSeleccionado) {
                    patenteDelVehiculo = vehiculoSeleccionado.patente || '';
                    nombreDelCliente = vehiculoSeleccionado.clienteNombre || '';
                }
            }
            
            const evento = {
                title: `${titulo} ${patenteDelVehiculo ? '('+patenteDelVehiculo+')': ''} ${nombreDelCliente ? '- '+nombreDelCliente : ''}`.trim(),
                start: firebase.firestore.Timestamp.fromDate(new Date(fechaInicioStr)),
                allDay: todoElDia,
                description: descripcion,
                vehiculoId: vehiculoId || null,
                patenteVehiculo: patenteDelVehiculo,
                clienteNombre: nombreDelCliente,
                tipoCita: tipo,
                color: colorEvento
            };

            if (!todoElDia && fechaFinStr) {
                evento.end = firebase.firestore.Timestamp.fromDate(new Date(fechaFinStr));
            } else if (todoElDia) {
                evento.end = null; // O ajustar el 'end' para que cubra todo el día según FullCalendar
            }


            try {
                if (id) { // Actualizar cita existente
                    await db.collection('citas').doc(id).update(evento);
                    alert("Cita actualizada con éxito.");
                } else { // Crear nueva cita
                    await db.collection('citas').add(evento);
                    alert("Cita creada con éxito.");
                }
                modalCita.style.display = 'none';
                if (calendario) calendario.refetchEvents(); // Recargar eventos en el calendario
            } catch (error) {
                console.error("Error guardando cita:", error);
                alert("Error al guardar la cita: " + error.message);
            }
        });
    }

    // --- ELIMINAR CITA ---
    if (btnEliminarCita) {
        btnEliminarCita.addEventListener('click', async function() {
            const id = citaIdInput.value;
            if (!id) {
                alert("No hay cita seleccionada para eliminar.");
                return;
            }
            if (confirm("¿Estás seguro de que quieres eliminar esta cita?")) {
                try {
                    await db.collection('citas').doc(id).delete();
                    alert("Cita eliminada con éxito.");
                    modalCita.style.display = 'none';
                    if (calendario) calendario.refetchEvents();
                } catch (error) {
                    console.error("Error eliminando cita:", error);
                    alert("Error al eliminar la cita: " + error.message);
                }
            }
        });
    }
});