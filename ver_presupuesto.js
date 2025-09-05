document.addEventListener('DOMContentLoaded', function() {
    const detalleContainer = document.getElementById('presupuesto-detalle-container');
    const btnDescargar = document.getElementById('btn-descargar-pdf');

    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];

    const urlParams = new URLSearchParams(window.location.search);
    const presupuestoId = parseInt(urlParams.get('id'), 10);

    if (isNaN(presupuestoId) || !presupuestos[presupuestoId]) {
        detalleContainer.innerHTML = '<h2>Error: Presupuesto no encontrado.</h2>';
        btnDescargar.disabled = true;
        return;
    }

    const presupuesto = presupuestos[presupuestoId];
    const clienteIndex = parseInt(presupuesto.clienteIndex, 10);
    const cliente = clientes[clienteIndex];

    if (!cliente) {
        detalleContainer.innerHTML = '<h2>Error: Cliente asociado no encontrado.</h2>';
        btnDescargar.disabled = true;
        return;
    }

    let repuestosHTML = '<tr><td colspan="2" style="text-align:center;">- Sin repuestos detallados -</td></tr>';
    if (presupuesto.repuestos && presupuesto.repuestos.length > 0) {
        repuestosHTML = presupuesto.repuestos.map(rep => `
            <tr>
                <td>${rep.nombre}</td>
                <td class="monto">${(rep.monto).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</td>
            </tr>
        `).join('');
    }

    detalleContainer.innerHTML = `
        <div class="info-header">
            <p><strong>Fecha:</strong> ${presupuesto.fecha}</p>
            <p><strong>Presupuesto N°:</strong> ${String(presupuestoId + 1).padStart(4, '0')}</p>
        </div>
        <div class="seccion-presupuesto">
            <h2>Datos del Cliente</h2>
            <p><strong>Nombre:</strong> ${cliente.nombre}</p><p><strong>Teléfono:</strong> ${cliente.telefono}</p>
            <p><strong>Vehículo:</strong> ${cliente.marca} ${cliente.modelo} (${cliente.anio})</p><p><strong>Patente:</strong> ${cliente.patente}</p>
        </div>
        <div class="seccion-presupuesto">
            <h2>Diagnóstico / Trabajo a Realizar</h2>
            <p>${presupuesto.diagnostico || 'No especificado.'}</p>
        </div>
        <div class="seccion-presupuesto">
            <h2>Detalle de Costos</h2>
            <table class="tabla-costos">
                <thead><tr><th>Descripción</th><th>Monto</th></tr></thead>
                <tbody>
                    <tr><td>Mano de Obra</td><td class="monto">${(presupuesto.manoObra).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</td></tr>
                    ${repuestosHTML}
                </tbody>
                <tfoot><tr><th>Total Estimado</th><th class="monto">${(presupuesto.total).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</th></tr></tfoot>
            </table>
        </div>
        <div class="footer-presupuesto">
            <p>Este presupuesto es válido por 15 días.</p><p>Gracias por su preferencia.</p>
        </div>
    `;

    btnDescargar.addEventListener('click', function() {
        const elementoParaExportar = document.getElementById('presupuesto-a-exportar');
        const nombreArchivo = `Presupuesto_${cliente.nombre.replace(/ /g, '_')}_${cliente.patente}.pdf`;
        const opt = {
            margin: 0.5,
            filename: nombreArchivo,
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // --- ANÁLISIS DEL CAMBIO FINAL ---
        // Volvemos a modificar el elemento original, pero añadiendo una clase temporal
        // a los elementos PADRE (body, main) para neutralizarlos.

        const body = document.body;
        const mainContainer = document.querySelector('.container');
        
        // 1. Añadimos una clase que elimina márgenes y padding de los contenedores.
        body.classList.add('pdf-export-parent');
        mainContainer.classList.add('pdf-export-parent');
        
        // 2. Aplicamos los estilos de tema blanco directamente al elemento a exportar.
        elementoParaExportar.classList.add('pdf-export-mode');

        html2pdf().from(elementoParaExportar).set(opt).save().then(() => {
            // 3. Limpiamos las clases una vez que el PDF se ha guardado.
            body.classList.remove('pdf-export-parent');
            mainContainer.classList.remove('pdf-export-parent');
            elementoParaExportar.classList.remove('pdf-export-mode');
        });
    });
});