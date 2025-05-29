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
        const calendarioElCheck = document.getElementById('calendario');
        if (calendarioElCheck) {
            calendarioElCheck.innerHTML = '<p style="color:red; text-align:center;">Error al cargar la agenda. Verifique la consola del navegador.</p>';
        }
        // alert("Error crítico: No se pudo cargar la agenda. Revisa la consola.");
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
    let vehiculosCargados = []; 

    async function cargarVehiculosParaSelect() {
        try {
            const snapshot = await db.collection("vehiculos").orderBy("patente").get();
            vehiculosCargados = [];
            citaVehiculoSelect.innerHTML = '<option value="">-- Ninguno --</option>'; 
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
                } else { infoVehiculoCitaDiv.textContent = ''; }
            } else { infoVehiculoCitaDiv.textContent = ''; }
        });
    }

    function dateToLocalISOString(dateObj, includeTime = true) {
        if (!dateObj) return '';
        const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
        const localISOTime = (new Date(dateObj.getTime() - tzoffset)).toISOString().slice(0, -1);
        return includeTime ? localISOTime.substring(0, 16) : localISOTime.substring(0, 10);
    }
    
    function abrirModalCita(data = {}) { 
        formCita.reset();
        infoVehiculoCitaDiv.textContent = ''; 
        citaIdInput.value = data.id || ''; 
        citaTituloInput.value = data.title || '';
        citaTipoSelect.value = data.extendedProps?.tipoCita || 'recepcion';
        citaColorInput.value = data.color || data.backgroundColor || '#ad0000';
        citaDescripcionTextarea.value = data.extendedProps?.description || '';
        citaTodoElDiaCheckbox.checked = data.allDay || false;
        
        citaFechaFinInput.disabled = citaTodoElDiaCheckbox.checked;

        if (data.start) {
            citaFechaInicioInput.value = dateToLocalISOString(data.start, !data.allDay);
        } else {
            citaFechaInicioInput.value = dateToLocalISOString(new Date()); // Hora actual para nueva cita
        }

        if (data.end && !data.allDay) {
            citaFechaFinInput.value = dateToLocalISOString(data.end);
        } else if (data.start && !data.allDay && !data.end) { // Si hay inicio pero no fin (y no es todo el dia)
            const inicio = new Date(data.start);
            inicio.setHours(inicio.getHours() + 1);
            citaFechaFinInput.value = dateToLocalISOString(inicio);
        } else {
            citaFechaFinInput.value = ''; // Limpiar si es todo el día o no hay fin
        }
        
        if (citaTodoElDiaCheckbox.checked && citaFechaInicioInput.value) { // Ajustar hora a 00:00 si es todo el día
             citaFechaInicioInput.value = citaFechaInicioInput.value.substring(0,10) + "T00:00";
        }


        if (data.extendedProps?.vehiculoId) {
            citaVehiculoSelect.value = data.extendedProps.vehiculoId;
            citaVehiculoSelect.dispatchEvent(new Event('change')); 
        } else {
            citaVehiculoSelect.value = ""; // Deseleccionar si no hay vehiculoId
        }

        modalCitaTitulo.textContent = data.id ? "Editar Cita" : "Agregar Nueva Cita";
        btnEliminarCita.style.display = data.id ? 'inline-block' : 'none';
        modalCita.style.display = 'block';
    }

    if (btnCrearCita) btnCrearCita.onclick = () => abrirModalCita({start: new Date()}); // Pasar fecha actual
    if (btnCerrarModalCita && modalCita) btnCerrarModalCita.onclick = () => { modalCita.style.display = 'none'; }
    
    citaTodoElDiaCheckbox.addEventListener('change', function() {
        citaFechaFinInput.disabled = this.checked;
        const esTodoElDia = this.checked;
        let inicioVal = citaFechaInicioInput.value;

        if (esTodoElDia) {
            citaFechaFinInput.value = '';
            if (inicioVal) { // Si hay valor de inicio, ajustar a T00:00
                citaFechaInicioInput.value = inicioVal.substring(0,10) + "T00:00";
            }
        } else { // No es todo el día
            if (inicioVal && !citaFechaFinInput.value) { // Si hay inicio pero no fin
                const inicioDate = new Date(inicioVal);
                inicioDate.setHours(inicioDate.getHours() + 1); // Sugerir 1 hora después
                citaFechaFinInput.value = dateToLocalISOString(inicioDate);
            }
        }
    });

    if (calendarioEl) {
        calendario = new FullCalendar.Calendar(calendarioEl, {
            locale: 'es', 
            initialView: 'dayGridMonth', 
            headerToolbar: {
                left: 'prev,next today btnCrearCitaDesdeHeader', 
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            },
            customButtons: {
                btnCrearCitaDesdeHeader: { text: 'Nueva Cita', click: () => abrirModalCita({start: new Date()}) }
            },
            editable: true,      
            selectable: true,    
            selectMirror: true,
            dayMaxEvents: true,  
            events: cargarCitasDesdeFirestore, 
            select: (arg) => abrirModalCita({ start: arg.start, end: arg.end, allDay: arg.allDay }),
            eventClick: (arg) => {
                abrirModalCita({
                    id: arg.event.id, title: arg.event.title,
                    start: arg.event.start, end: arg.event.end,
                    allDay: arg.event.allDay, color: arg.event.backgroundColor,
                    extendedProps: arg.event.extendedProps
                });
            },
            eventDrop: async (arg) => {
                try {
                    await db.collection('citas').doc(arg.event.id).update({
                        start: firebase.firestore.Timestamp.fromDate(arg.event.start),
                        end: arg.event.end ? firebase.firestore.Timestamp.fromDate(arg.event.end) : null,
                        allDay: arg.event.allDay
                    });
                } catch (error) { console.error("Error actualizando cita por arrastre:", error); arg.revert(); alert("Error al mover la cita."); }
            },
            eventResize: async (arg) => { // Manejar redimensionamiento
                 try {
                    await db.collection('citas').doc(arg.event.id).update({
                        start: firebase.firestore.Timestamp.fromDate(arg.event.start),
                        end: firebase.firestore.Timestamp.fromDate(arg.event.end), // End siempre existe al redimensionar
                        allDay: arg.event.allDay
                    });
                } catch (error) { console.error("Error actualizando cita por redimensionar:", error); arg.revert(); alert("Error al redimensionar la cita."); }
            }
        });
        calendario.render();
        cargarVehiculosParaSelect(); 
    }

    function cargarCitasDesdeFirestore(fetchInfo, successCallback, failureCallback) {
        db.collection('citas').onSnapshot(snapshot => {
            const eventos = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                eventos.push({
                    id: doc.id, title: data.title,
                    start: data.start.toDate(), 
                    end: data.end ? data.end.toDate() : null,
                    allDay: data.allDay || false,
                    backgroundColor: data.color || '#ad0000', 
                    borderColor: data.color ? darkenColor(data.color, 20) : '#830000',
                    extendedProps: {
                        description: data.description, vehiculoId: data.vehiculoId,
                        patenteVehiculo: data.patenteVehiculo, clienteNombre: data.clienteNombre,
                        tipoCita: data.tipoCita
                    }
                });
            });
            successCallback(eventos);
        }, error => { console.error("Error cargando citas: ", error); failureCallback(error); });
    }
    
    function darkenColor(color, percent) {
        let num = parseInt(color.replace("#",""),16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) - amt, G = (num >> 8 & 0x00FF) - amt, B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
    }

    if (formCita) {
        formCita.addEventListener('submit', async function(event) {
            event.preventDefault();
            const id = citaIdInput.value;
            const tituloForm = citaTituloInput.value.trim(); // Renombrado para evitar confusión
            const tipo = citaTipoSelect.value;
            const fechaInicioStr = citaFechaInicioInput.value;
            const fechaFinStr = citaFechaFinInput.value;
            const todoElDia = citaTodoElDiaCheckbox.checked;
            const vehiculoId = citaVehiculoSelect.value;
            const descripcion = citaDescripcionTextarea.value.trim();
            const colorEvento = citaColorInput.value;

            if (!tituloForm || !fechaInicioStr) {
                alert("El título y la fecha de inicio son obligatorios."); return;
            }
            let vehiculoSeleccionado = null, patenteDelVehiculo = '', nombreDelCliente = '';
            if (vehiculoId) {
                vehiculoSeleccionado = vehiculosCargados.find(v => v.id === vehiculoId);
                if (vehiculoSeleccionado) {
                    patenteDelVehiculo = vehiculoSeleccionado.patente || '';
                    nombreDelCliente = vehiculoSeleccionado.clienteNombre || '';
                }
            }
            
            const tituloCompleto = `${tituloForm} ${patenteDelVehiculo ? '('+patenteDelVehiculo+')': ''} ${nombreDelCliente ? '- '+nombreDelCliente : ''}`.trim();

            const evento = {
                title: tituloCompleto,
                start: firebase.firestore.Timestamp.fromDate(new Date(fechaInicioStr)),
                allDay: todoElDia,
                description: descripcion,
                vehiculoId: vehiculoId || firebase.firestore.FieldValue.delete(), // Eliminar si está vacío
                patenteVehiculo: patenteDelVehiculo,
                clienteNombre: nombreDelCliente,
                tipoCita: tipo,
                color: colorEvento
            };
            if (!todoElDia && fechaFinStr) {
                evento.end = firebase.firestore.Timestamp.fromDate(new Date(fechaFinStr));
            } else { // Si es todo el día o no hay fecha fin, no guardamos 'end' o lo ponemos a null
                evento.end = null; // O firebase.firestore.FieldValue.delete()
            }
            try {
                if (id) { 
                    await db.collection('citas').doc(id).update(evento);
                    alert("Cita actualizada.");
                } else { 
                    await db.collection('citas').add(evento);
                    alert("Cita creada.");
                }
                modalCita.style.display = 'none';
            } catch (error) {
                console.error("Error guardando cita:", error);
                alert("Error al guardar: " + error.message);
            }
        });
    }

    if (btnEliminarCita) {
        btnEliminarCita.addEventListener('click', async function() {
            const id = citaIdInput.value;
            if (!id) return;
            if (confirm("¿Eliminar esta cita?")) {
                try {
                    await db.collection('citas').doc(id).delete();
                    alert("Cita eliminada.");
                    modalCita.style.display = 'none';
                } catch (error) { console.error("Error eliminando:", error); alert("Error al eliminar: " + error.message); }
            }
        });
    }
});