document.addEventListener('DOMContentLoaded', function() {
    // --- OBTENER DATOS ---
    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];
    const trabajosFinalizados = JSON.parse(localStorage.getItem('trabajosFinalizados')) || [];
    
    // --- OBTENER ID DEL CLIENTE DE LA URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const clienteIndex = parseInt(urlParams.get('clienteIndex'), 10);

    // --- ELEMENTOS DEL DOM ---
    const infoClienteHeader = document.getElementById('info-cliente-header');
    const historialContainer = document.getElementById('historial-container');

    if (isNaN(clienteIndex) || !clientes[clienteIndex]) {
        document.querySelector('.container').innerHTML = '<h1>Error: Cliente no encontrado.</h1>';
        return;
    }

    const cliente = clientes[clienteIndex];

    // 1. Mostrar información principal del cliente
    infoClienteHeader.innerHTML = `
        <h1>${cliente.nombre}</h1>
        <p><strong>RUT:</strong> ${cliente.rut || 'No ingresado'}</p>
        <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
        <p><strong>Vehículo:</strong> ${cliente.marca} ${cliente.modelo} (${cliente.anio}) - <strong>Patente:</strong> ${cliente.patente}</p>
    `;

    // 2. Recopilar todo el historial del cliente
    let historialCompleto = [];

    // Añadir presupuestos activos
    presupuestos.forEach((presupuesto, index) => {
        // La comparación se hace con '==' (igualdad flexible) para evitar problemas de tipo (número vs string)
        if (presupuesto && presupuesto.clienteIndex == clienteIndex) {
            historialCompleto.push({
                tipo: 'presupuesto',
                id: index,
                fecha: presupuesto.fecha,
                total: presupuesto.total,
                status: presupuesto.status
            });
        }
    });

    // Añadir trabajos finalizados
    trabajosFinalizados.forEach(trabajo => {
        // --- CORRECCIÓN CLAVE AQUÍ ---
        // Se usa '==' en lugar de '===' para asegurar que la comparación funcione
        // aunque uno sea número y el otro texto.
        if (trabajo.clienteIndex == clienteIndex) {
            historialCompleto.push({
                tipo: 'finalizado',
                id: trabajo.presupuestoId,
                fecha: trabajo.fechaFinalizacion,
                total: trabajo.total,
                status: 'finalizado'
            });
        }
    });
    
    // 3. Ordenar el historial por fecha (opcional, pero recomendado)
    // Nota: Esto requiere que las fechas estén en un formato comparable. 'DD/MM/YYYY' no es ideal.
    // Por ahora, lo mostraremos en el orden en que se encontró.

    // 4. Renderizar el historial en la página
    historialContainer.innerHTML = ''; // Limpiar por si acaso
    if (historialCompleto.length === 0) {
        historialContainer.innerHTML = '<p>Este cliente no tiene ningún historial de trabajos.</p>';
        return;
    }

    historialCompleto.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'historial-item';
        const statusClass = `status-${item.status}`;

        let botonesHTML = '';
        if (item.tipo === 'presupuesto') {
            botonesHTML = `
                <a href="ver_presupuesto.html?id=${item.id}" class="btn-accion btn-ver">Ver Presupuesto</a>
                <a href="orden_trabajo.html?id=${item.id}" class="btn-accion btn-crear-ot">Ver OT</a>
            `;
        } else if (item.tipo === 'finalizado') {
            botonesHTML = `
                <a href="finalizacion_trabajo.html?id=${item.id}" class="btn-accion btn-finalizar">Ver Informe Final</a>
            `;
        }

        itemDiv.innerHTML = `
            <div class="historial-item-header">
                <h3>Presupuesto N°${String(item.id + 1).padStart(4, '0')}</h3>
                <span class="status-badge ${statusClass}">${item.status}</span>
            </div>
            <div class="historial-item-body">
                <p><strong>Fecha:</strong> ${item.fecha}</p>
                <p><strong>Monto Total:</strong> ${item.total.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</p>
            </div>
            <div class="historial-item-footer">
                ${botonesHTML}
            </div>
        `;
        historialContainer.appendChild(itemDiv);
    });
});