document.addEventListener('DOMContentLoaded', function() {
    // --- ELEMENTOS DEL DOM ---
    const detalleContainer = document.getElementById('presupuesto-a-exportar');
    const btnDescargar = document.getElementById('btn-descargar-pdf');

    // --- OBTENER DATOS ---
    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];
    const urlParams = new URLSearchParams(window.location.search);
    const presupuestoId = parseInt(urlParams.get('id'), 10);

    // --- FUNCIÓN PARA FORMATEAR MONEDA ---
    const formatearMoneda = (valor) => {
        return valor.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
    };

    // --- FUNCIÓN PARA RENDERIZAR EL PRESUPUESTO ---
    function renderizarPresupuesto() {
        if (isNaN(presupuestoId) || !presupuestos[presupuestoId]) {
            detalleContainer.innerHTML = '<h2>Error: Presupuesto no encontrado.</h2>';
            btnDescargar.style.display = 'none';
            return;
        }

        const presupuesto = presupuestos[presupuestoId];
        const cliente = clientes[presupuesto.clienteIndex];

        if (!cliente) {
            detalleContainer.innerHTML = '<h2>Error: Cliente asociado no encontrado.</h2>';
            btnDescargar.style.display = 'none';
            return;
        }

        // Generar filas de la tabla de repuestos
        let repuestosHTML = '';
        if (presupuesto.repuestos && presupuesto.repuestos.length > 0) {
            repuestosHTML = presupuesto.repuestos.map(rep => `
                <tr>
                    <td>Repuesto: ${rep.nombre}</td>
                    <td class="monto">${formatearMoneda(rep.monto)}</td>
                </tr>
            `).join('');
        }

        // Plantilla HTML completa del presupuesto
        detalleContainer.innerHTML = `
            <div class="cabecera-presupuesto">
                <img src="logo_pdf.png" alt="Logo Automat Astudillo" class="logo">
                <div class="info-empresa">
                    <h1>Presupuesto de Reparación</h1>
                    <p>Automat Astudillo</p>
                    <p>Bernardo Leighton #0334B, Villa Alemana</p>
                    <p>Teléfono: +56 9 XXXXXXXX</p>
                </div>
            </div>
            <div class="info-header">
                <p><strong>Fecha:</strong> ${presupuesto.fecha}</p>
                <p><strong>Presupuesto N°:</strong> ${String(presupuestoId + 1).padStart(4, '0')}</p>
            </div>
            <div class="seccion-presupuesto">
                <h2>Datos del Cliente</h2>
                <div class="datos-cliente-grid">
                    <p><strong>Nombre:</strong> ${cliente.nombre}</p>
                    <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
                    <p><strong>Vehículo:</strong> ${cliente.marca} ${cliente.modelo} (${cliente.anio})</p>
                    <p><strong>Patente:</strong> ${cliente.patente}</p>
                </div>
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
                            <td class="monto">${formatearMoneda(presupuesto.manoObra)}</td>
                        </tr>
                        ${repuestosHTML}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>Total Estimado</th>
                            <th class="monto">${formatearMoneda(presupuesto.total)}</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div class="footer-presupuesto">
                <p>Este presupuesto es válido por 15 días. Gracias por su preferencia.</p>
            </div>
        `;
    }
    
    // --- FUNCIÓN PARA GENERAR Y DESCARGAR EL PDF ---
    function descargarPDF() {
        const presupuesto = presupuestos[presupuestoId];
        const cliente = clientes[presupuesto.clienteIndex];
        const nombreArchivo = `Presupuesto_${String(presupuestoId + 1).padStart(4, '0')}_${cliente.nombre.replace(/ /g, '_')}_${cliente.patente}.pdf`;

        // 1. Clonar el elemento que queremos exportar
        const elementoParaExportar = detalleContainer.cloneNode(true);

        // 2. Aplicar la clase de tema claro al clon
        elementoParaExportar.classList.add('theme-light');
        
        // 3. Opciones de html2pdf
        const opt = {
            margin:       [0.5, 0.5, 0.5, 0.5], // Arriba, Izquierda, Abajo, Derecha (en pulgadas)
            filename:     nombreArchivo,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // 4. Generar el PDF desde el clon estilizado
        html2pdf().from(elementoParaExportar).set(opt).save();
    }

    // --- ASIGNAR EVENTOS Y EJECUTAR ---
    btnDescargar.addEventListener('click', descargarPDF);
    renderizarPresupuesto();
});