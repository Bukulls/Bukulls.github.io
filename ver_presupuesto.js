document.addEventListener('DOMContentLoaded', function() {
    const detalleContainer = document.getElementById('presupuesto-detalle-container');
    const btnDescargar = document.getElementById('btn-descargar-pdf');

    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];

    const urlParams = new URLSearchParams(window.location.search);
    const presupuestoId = parseInt(urlParams.get('id'), 10);

    if (isNaN(presupuestoId) || !presupuestos[presupuestoId]) {
        detalleContainer.innerHTML = '<h2>Error: Presupuesto no encontrado.</h2>';
        return;
    }

    const presupuesto = presupuestos[presupuestoId];
    const clienteIndex = parseInt(presupuesto.clienteIndex, 10);
    const cliente = clientes[clienteIndex];

    if (!cliente) {
        detalleContainer.innerHTML = '<h2>Error: Cliente asociado no encontrado.</h2>';
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

    // --- ANÁLISIS DEL CAMBIO ---
    // Se ha modificado la lógica del botón de descarga.
    btnDescargar.addEventListener('click', function() {
        const elementoParaExportar = document.getElementById('presupuesto-a-exportar');
        const nombreArchivo = `Presupuesto_${cliente.nombre.replace(' ', '_')}_${cliente.patente}.pdf`;

        const opt = {
          margin:       0.5,
          filename:     nombreArchivo,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // 1. Añadimos la clase 'pdf-export-mode' para cambiar los estilos a blanco.
        elementoParaExportar.classList.add('pdf-export-mode');

        // 2. Generamos el PDF. El método save() devuelve una promesa.
        html2pdf().from(elementoParaExportar).set(opt).save().then(function() {
            // 3. Una vez que el PDF se ha guardado, quitamos la clase para que la vista en pantalla vuelva a la normalidad.
            elementoParaExportar.classList.remove('pdf-export-mode');
        });
    });
});