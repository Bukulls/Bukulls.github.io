document.addEventListener('DOMContentLoaded', function() {
    // --- ELEMENTOS DEL DOM ---
    const dashboardGrid = document.querySelector('.dashboard-grid');
    const colPendientes = document.getElementById('col-pendientes');
    const colAceptados = document.getElementById('col-aceptados');
    const colFinalizados = document.getElementById('col-finalizados');

    // --- OBTENER DATOS ---
    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];
    const trabajosFinalizados = JSON.parse(localStorage.getItem('trabajosFinalizados')) || [];

    // --- FUNCIÓN MODIFICADA PARA CREAR TARJETA CON ENLACE CONTEXTUAL ---
    function crearTarjeta(trabajo, presupuestoId, estado) {
        const cliente = clientes[trabajo.clienteIndex];
        if (!cliente) return ''; 

        const totalFormateado = (trabajo.total).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

        // --- LÓGICA PARA DEFINIR EL ENLACE Y EL TEXTO DEL BOTÓN ---
        let enlaceDetalle = '';
        let textoBoton = 'Ver Detalle';

        switch (estado) {
            case 'pendiente':
                enlaceDetalle = `ver_presupuesto.html?id=${presupuestoId}`;
                textoBoton = 'Ver Presupuesto';
                break;
            case 'aceptado':
                enlaceDetalle = `orden_trabajo.html?id=${presupuestoId}`;
                textoBoton = 'Ver Orden de Trabajo';
                break;
            case 'finalizado':
                // Para los finalizados, el ID de enlace correcto es el del presupuesto original
                enlaceDetalle = `finalizacion_trabajo.html?id=${presupuestoId}`;
                textoBoton = 'Ver Informe Final';
                break;
        }
        // --- FIN DE LA LÓGICA ---

        return `
            <div class="trabajo-card">
                <div class="card-header">
                    <h3>${cliente.nombre}</h3>
                    <span class="toggle-icon">+</span>
                </div>
                <div class="card-body">
                    <p><strong>Vehículo:</strong> ${cliente.marca} ${cliente.modelo} (${cliente.patente})</p>
                    <p><strong>Total:</strong> ${totalFormateado}</p>
                    <div class="card-footer">
                        <a href="${enlaceDetalle}" class="btn-accion btn-ver">${textoBoton}</a>
                    </div>
                </div>
            </div>
        `;
    }

    // Limpiar columnas
    colPendientes.innerHTML = '';
    colAceptados.innerHTML = '';
    colFinalizados.innerHTML = '';

    // Llenar columnas de Pendientes y Aceptados
    presupuestos.forEach((presupuesto, index) => {
        if (!presupuesto) return; // Omitir presupuestos finalizados

        if (presupuesto.status === 'pendiente') {
            colPendientes.innerHTML += crearTarjeta(presupuesto, index, 'pendiente');
        } else if (presupuesto.status === 'aceptado') {
            colAceptados.innerHTML += crearTarjeta(presupuesto, index, 'aceptado');
        }
    });

    // Llenar columna de Finalizados
    if (trabajosFinalizados.length > 0) {
        trabajosFinalizados.forEach(trabajo => {
            // Creamos un objeto temporal para la tarjeta con la info necesaria
            const infoTarjeta = {
                clienteIndex: trabajo.clienteIndex,
                total: trabajo.total
            };
            // El ID que pasamos es el del presupuesto original que guardamos
            colFinalizados.innerHTML += crearTarjeta(infoTarjeta, trabajo.presupuestoId, 'finalizado');
        });
    }
    
    // Mensajes si las columnas están vacías
    if (colPendientes.innerHTML === '') colPendientes.innerHTML = '<p class="empty-col-msg">No hay trabajos pendientes.</p>';
    if (colAceptados.innerHTML === '') colAceptados.innerHTML = '<p class="empty-col-msg">No hay trabajos aceptados.</p>';
    if (colFinalizados.innerHTML === '') colFinalizados.innerHTML = '<p class="empty-col-msg">No hay trabajos finalizados.</p>';

    // Event Listener para el efecto desplegable (sin cambios)
    dashboardGrid.addEventListener('click', function(e) {
        const header = e.target.closest('.card-header');
        if (header) {
            const card = header.parentElement;
            const body = card.querySelector('.card-body');
            const icon = header.querySelector('.toggle-icon');

            card.classList.toggle('active');

            if (card.classList.contains('active')) {
                body.style.maxHeight = body.scrollHeight + "px";
                icon.textContent = '−';
            } else {
                body.style.maxHeight = null;
                icon.textContent = '+';
            }
        }
    });
});