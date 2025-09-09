document.addEventListener('DOMContentLoaded', function() {
    // --- ELEMENTOS DEL DOM ---
    const dashboardGrid = document.querySelector('.dashboard-grid'); // Seleccionamos el contenedor principal
    const colPendientes = document.getElementById('col-pendientes');
    const colAceptados = document.getElementById('col-aceptados');
    const colFinalizados = document.getElementById('col-finalizados');

    // --- OBTENER DATOS ---
    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];
    const trabajosFinalizados = JSON.parse(localStorage.getItem('trabajosFinalizados')) || [];

    // --- FUNCIÓN MODIFICADA PARA CREAR TARJETA DESPLEGABLE ---
    function crearTarjeta(trabajo, presupuestoId) {
        const cliente = clientes[trabajo.clienteIndex];
        if (!cliente) return ''; 

        const totalFormateado = (trabajo.total).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

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
                        <a href="ver_presupuesto.html?id=${presupuestoId}" class="btn-accion btn-ver">Ver Detalle</a>
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
        if (!presupuesto) return;
        if (presupuesto.status === 'pendiente') {
            colPendientes.innerHTML += crearTarjeta(presupuesto, index);
        } else if (presupuesto.status === 'aceptado') {
            colAceptados.innerHTML += crearTarjeta(presupuesto, index);
        }
    });

    // Llenar columna de Finalizados
    if (trabajosFinalizados.length > 0) {
        trabajosFinalizados.forEach(trabajo => {
            const presupuestoOriginal = {
                clienteIndex: trabajo.clienteIndex,
                total: trabajo.total
            };
            colFinalizados.innerHTML += crearTarjeta(presupuestoOriginal, trabajo.presupuestoId);
        });
    }
    
    // Mensajes si las columnas están vacías
    if (colPendientes.innerHTML === '') colPendientes.innerHTML = '<p class="empty-col-msg">No hay trabajos pendientes.</p>';
    if (colAceptados.innerHTML === '') colAceptados.innerHTML = '<p class="empty-col-msg">No hay trabajos aceptados.</p>';
    if (colFinalizados.innerHTML === '') colFinalizados.innerHTML = '<p class="empty-col-msg">No hay trabajos finalizados.</p>';

    // --- EVENT LISTENER PARA EL EFECTO DESPLEGABLE ---
    dashboardGrid.addEventListener('click', function(e) {
        // Buscamos si el clic fue en el encabezado de una tarjeta
        const header = e.target.closest('.card-header');
        if (header) {
            const card = header.parentElement;
            const body = card.querySelector('.card-body');
            const icon = header.querySelector('.toggle-icon');

            // Alternamos la clase 'active' en la tarjeta
            card.classList.toggle('active');

            // Mostramos u ocultamos el cuerpo y cambiamos el ícono
            if (card.classList.contains('active')) {
                body.style.maxHeight = body.scrollHeight + "px"; // Expandir al alto del contenido
                icon.textContent = '−'; // Signo de menos
            } else {
                body.style.maxHeight = null; // Colapsar
                icon.textContent = '+';
            }
        }
    });
});