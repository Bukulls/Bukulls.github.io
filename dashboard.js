document.addEventListener('DOMContentLoaded', function() {
    const colPendientes = document.getElementById('col-pendientes');
    const colAceptados = document.getElementById('col-aceptados');
    const colFinalizados = document.getElementById('col-finalizados');

    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];
    const trabajosFinalizados = JSON.parse(localStorage.getItem('trabajosFinalizados')) || [];

    // Función para crear la tarjeta HTML de un trabajo
    function crearTarjeta(trabajo, presupuestoId) {
        const cliente = clientes[trabajo.clienteIndex];
        if (!cliente) return ''; // Si no hay cliente, no mostrar la tarjeta

        const totalFormateado = (trabajo.total).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

        return `
            <div class="trabajo-card">
                <h3>${cliente.nombre}</h3>
                <p><strong>Vehículo:</strong> ${cliente.marca} ${cliente.modelo} (${cliente.patente})</p>
                <p><strong>Total:</strong> ${totalFormateado}</p>
                <div class="card-footer">
                    <a href="ver_presupuesto.html?id=${presupuestoId}" class="btn-accion btn-ver">Ver Detalle</a>
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
        if (!presupuesto) return; // Omitir presupuestos que ya fueron finalizados (marcados como null)

        if (presupuesto.status === 'pendiente') {
            colPendientes.innerHTML += crearTarjeta(presupuesto, index);
        } else if (presupuesto.status === 'aceptado') {
            colAceptados.innerHTML += crearTarjeta(presupuesto, index);
        }
    });

    // Llenar columna de Finalizados
    if (trabajosFinalizados.length > 0) {
        trabajosFinalizados.forEach(trabajo => {
            // Para la tarjeta de finalizados, necesitamos encontrar el presupuesto original
            // para obtener el total y otros datos que no guardamos en el obj de finalización
            // (esto podría mejorarse guardando toda la info en el obj finalizado)
            const presupuestoOriginal = {
                clienteIndex: trabajo.clienteIndex,
                total: trabajo.total
            };
            colFinalizados.innerHTML += crearTarjeta(presupuestoOriginal, trabajo.presupuestoId);
        });
    }

    // Mensajes si las columnas están vacías
    if (colPendientes.innerHTML === '') {
        colPendientes.innerHTML = '<p class="empty-col-msg">No hay trabajos pendientes.</p>';
    }
    if (colAceptados.innerHTML === '') {
        colAceptados.innerHTML = '<p class="empty-col-msg">No hay trabajos aceptados.</p>';
    }
    if (colFinalizados.innerHTML === '') {
        colFinalizados.innerHTML = '<p class="empty-col-msg">No hay trabajos finalizados.</p>';
    }
});