document.addEventListener('DOMContentLoaded', function() {
    const detalleContainer = document.getElementById('presupuesto-detalle-container');
    const btnImprimir = document.getElementById('btn-imprimir');

    // Cargar datos
    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];

    // Obtener el ID del presupuesto desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    const presupuestoId = parseInt(urlParams.get('id'), 10);

    // Validar que el ID sea válido y que el presupuesto exista
    if (isNaN(presupuestoId) || !presupuestos[presupuestoId]) {
        detalleContainer.innerHTML = '<h1>Error: Presupuesto no encontrado.</h1><p>Por favor, vuelve a la lista de clientes y selecciona un presupuesto válido.</p>';
        return;
    }

    const presupuesto = presupuestos[presupuestoId];
    
    // --- CORRECCIÓN APLICADA AQUÍ ---
    // Convertimos el `clienteIndex` (que se guarda como texto) a un número entero.
    // Esta es la única línea que cambia respecto al código original que te di.
    const clienteIndex = parseInt(presupuesto.clienteIndex, 10); 
    const cliente = clientes[clienteIndex]; // Usamos el índice ya convertido a número.

    // Ahora, con el índice corregido, esta validación funcionará y no se quedará "cargando".
    if (!cliente) {
        detalleContainer.innerHTML = '<h1>Error: No se encontró el cliente asociado a este presupuesto.</h1>';
        return;
    }

    // Generar HTML para la lista de repuestos
    let repuestosHTML = '<tr><td colspan="2" style="text-align:center;">- Sin repuestos detallados -</td></tr>';
    if (presupuesto.repuestos && presupuesto.repuestos.length > 0) {
        repuestosHTML = presupuesto.repuestos.map(rep => `
            <tr>
                <td>${rep.nombre}</td>
                <td class="monto">${(rep.monto).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</td>
            </tr>
        `).join('');
    }

    // Construir el HTML final del detalle del presupuesto
    // Toda esta sección se mantiene exactamente igual.
    detalleContainer.innerHTML = `
        <h1>Detalle de Presupuesto</h1>
        <div class="info-header">
            <p><strong>Fecha:</strong> ${presupuesto.fecha}</p>
            <p><strong>Presupuesto N°:</strong> ${String(presupuestoId + 1).padStart(4, '0')}</p>
        </div>
        
        <div class="seccion-presupuesto">
            <h2>Datos del Cliente</h2>
            <p><strong>Nombre:</strong> ${cliente.nombre}</p>
            <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
            <p><strong>Vehículo:</strong> ${cliente.marca} ${cliente.modelo} (${cliente.anio})</p>
            <p><strong>Patente:</strong> ${cliente.patente}</p>
        </div>

        <div class="seccion-presupuesto">
            <h2>Diagnóstico / Trabajo a Realizar</h2>
            <p>${presupuesto.diagnostico || 'No especificado.'}</p>
        </div>

        <div class="seccion-presupuesto">
            <h2>Detalle de Costos</h2>
            <table class="tabla-costos">
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th>Monto</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Mano de Obra</td>
                        <td class="monto">${(presupuesto.manoObra).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</td>
                    </tr>
                    ${repuestosHTML}
                </tbody>
                <tfoot>
                    <tr>
                        <th>Total Estimado</th>
                        <th class="monto">${(presupuesto.total).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</th>
                    </tr>
                </tfoot>
            </table>
        </div>
        <div class="footer-presupuesto">
            <p>Este presupuesto es válido por 15 días.</p>
            <p>Gracias por su preferencia.</p>
        </div>
    `;

    // Funcionalidad del botón imprimir, sin cambios.
    btnImprimir.addEventListener('click', function() {
        window.print();
    });
});