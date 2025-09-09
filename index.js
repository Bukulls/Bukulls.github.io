document.addEventListener('DOMContentLoaded', function() {
    const colPendientes = document.getElementById('col-pendientes');
    const colAceptados = document.getElementById('col-aceptados');
    const colFinalizados = document.getElementById('col-finalizados');

    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];
    const trabajosFinalizados = JSON.parse(localStorage.getItem('trabajosFinalizados')) || []; // Asumimos que existirá

    // Función para crear la tarjeta HTML de un trabajo
    function crearTarjeta(trabajo, tipo) {
        const cliente = clientes[trabajo.clienteIndex];
        if (!cliente) return ''; // Si no hay cliente, no mostrar la tarjeta

        const totalFormateado = (trabajo.total).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

        return `
            <div class="trabajo-card">
                <h3>${cliente.nombre}</h3>
                <p><strong>Vehículo:</strong> ${cliente.marca} ${cliente.modelo} (${cliente.patente})</p>
                <p><strong>Total:</strong> ${totalFormateado}</p>
                <div class="card-footer">
                    <a href="ver_presupuesto.html?id=${trabajo.id}" class="btn-accion btn-ver">Ver Detalle</a>
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
        // Añadimos el ID al objeto para usarlo en el enlace
        presupuesto.id = index; 

        if (presupuesto.status === 'pendiente') {
            colPendientes.innerHTML += crearTarjeta(presupuesto);
        } else if (presupuesto.status === 'aceptado') {
            colAceptados.innerHTML += crearTarjeta(presupuesto);
        }
    });

    // Llenar columna de Finalizados (esto es a futuro, cuando se guarde el trabajo finalizado)
    if (trabajosFinalizados.length === 0) {
        colFinalizados.innerHTML = '<p style="color: var(--color-texto-secundario); text-align: center;">No hay trabajos finalizados.</p>';
    } else {
        // ... aquí iría la lógica para mostrar los trabajos finalizados
    }
});