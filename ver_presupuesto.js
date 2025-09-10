document.addEventListener('DOMContentLoaded', function() {
    // --- ELEMENTOS DEL DOM ---
    const detalleContainer = document.getElementById('presupuesto-a-exportar');
    const btnDescargar = document.getElementById('btn-descargar-pdf');
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    const accionesContainer = document.querySelector('.acciones-container');

    // --- OBTENER DATOS ---
    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];
    const urlParams = new URLSearchParams(window.location.search);
    const presupuestoId = parseInt(urlParams.get('id'), 10);

    // --- FUNCIÓN PARA FORMATEAR MONEDA ---
    const formatearMoneda = (valor) => {
        if (typeof valor !== 'number') return '$0';
        return valor.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
    };

    // --- FUNCIÓN PARA RENDERIZAR EL PRESUPUESTO ---
 function renderizarPresupuesto() {
    try {
        // ... (la lógica para obtener los datos no cambia) ...
        
        let repuestosHTML = '';
        if (presupuesto.repuestos && presupuesto.repuestos.length > 0) {
            repuestosHTML = presupuesto.repuestos.map(rep => `<tr><td>${rep.nombre}</td><td class="monto">${formatearMoneda(rep.monto)}</td></tr>`).join('');
        }

        // --- NUEVA PLANTILLA HTML ESTANDARIZADA ---
        detalleContainer.innerHTML = `
            <div class="doc-header">
                <div class="doc-logo-info">
                    <img src="logo_pdf.png" alt="Logo Taller" class="logo">
                    <div class="doc-empresa-info">
                        <p><strong>Automat Astudillo</strong></p>
                        <p>Bernardo Leighton #0334B, Villa Alemana</p>
                        <p>Teléfono: +56 9 XXXXXXXX</p>
                    </div>
                </div>
                <div class="doc-title">
                    <h1>PRESUPUESTO</h1>
                    <h2>N°: <span id="ot-numero">${String(presupuestoId + 1).padStart(4, '0')}</span></h2>
                </div>
            </div>

            <div class="doc-section">
                <h3>DATOS DEL CLIENTE</h3>
                <div class="doc-grid">
                    <p><strong>Nombre:</strong> ${cliente.nombre}</p>
                    <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
                    <p><strong>Vehículo:</strong> ${cliente.marca} ${cliente.modelo} (${cliente.anio})</p>
                    <p><strong>Patente:</strong> ${cliente.patente}</p>
                </div>
            </div>

            <div class="doc-section">
                <h3>TRABAJO A REALIZAR</h3>
                <p>${presupuesto.diagnostico || 'No especificado.'}</p>
            </div>

            <div class="doc-section">
                <h3>DETALLE DE COSTOS</h3>
                <table class="doc-table">
                    <thead><tr><th>Descripción</th><th class="monto">Monto</th></tr></thead>
                    <tbody>
                        <tr><td>Mano de Obra</td><td class="monto">${formatearMoneda(presupuesto.manoObra)}</td></tr>
                        ${repuestosHTML}
                    </tbody>
                    <tfoot><tr><td>Total Estimado</td><td class="monto">${formatearMoneda(presupuesto.total)}</td></tr></tfoot>
                </table>
            </div>
        `;

    } catch (error) {
        // ... (el manejo de errores no cambia) ...
    }
}
    
    // --- FUNCIÓN PARA DESCARGAR EL PDF ---
    function descargarPDF() {
        const presupuesto = presupuestos[presupuestoId];
        const cliente = clientes[presupuesto.clienteIndex];
        const nombreArchivo = `Presupuesto_${String(presupuestoId + 1).padStart(4, '0')}_${cliente.nombre.replace(/ /g, '_')}_${cliente.patente}.pdf`;
        const elementoParaExportar = detalleContainer.cloneNode(true);
        elementoParaExportar.classList.add('theme-light');
        
        const opt = {
            margin:       [0.5, 0.5, 0.5, 0.5],
            filename:     nombreArchivo,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().from(elementoParaExportar).set(opt).save();
    }

    // --- FUNCIÓN DE WHATSAPP ACTUALIZADA PARA ENVIAR EL ARCHIVO PDF ---
    async function enviarPorWhatsapp() {
        try {
            const presupuesto = presupuestos[presupuestoId];
            const cliente = clientes[presupuesto.clienteIndex];
            const nombreArchivo = `Presupuesto_${String(presupuestoId + 1).padStart(4, '0')}_${cliente.patente}.pdf`;

            // Verificamos si el navegador soporta la API para compartir archivos
            if (navigator.share && navigator.canShare) {
                // --- Método 1: Compartir el archivo PDF directamente ---

                // 1. Clonamos y estilizamos el contenido para el PDF
                const elementoParaExportar = detalleContainer.cloneNode(true);
                elementoParaExportar.classList.add('theme-light');
                const opt = { 
                    margin: 0.5, 
                    filename: nombreArchivo, 
                    image: { type: 'jpeg', quality: 0.98 }, 
                    html2canvas: { scale: 2 }, 
                    jsPDF: { unit: 'in', format: 'letter' } 
                };

                // 2. Generamos el PDF como un objeto de datos (Blob)
                const pdfBlob = await html2pdf().from(elementoParaExportar).set(opt).output('blob');
                
                // 3. Creamos un archivo virtual a partir del Blob
                const pdfFile = new File([pdfBlob], nombreArchivo, { type: 'application/pdf' });

                // 4. Usamos la API de Compartir para abrir el menú del sistema
                await navigator.share({
                    title: `Presupuesto para ${cliente.nombre}`,
                    text: `Hola ${cliente.nombre.split(' ')[0]}, aquí está el presupuesto para tu ${cliente.marca} ${cliente.modelo}.`,
                    files: [pdfFile]
                });

            } else {
                // --- Método 2: Fallback para navegadores antiguos (enviar enlace) ---
                alert("Tu navegador no soporta compartir archivos directamente. Se enviará un enlace al presupuesto.");
                
                let telefonoCliente = cliente.telefono.replace(/\s+/g, '');
                if (!telefonoCliente.startsWith('56')) { telefonoCliente = '56' + telefonoCliente; }
                const nombreCliente = cliente.nombre.split(' ')[0];
                const vehiculo = `${cliente.marca} ${cliente.modelo}`;
                const total = formatearMoneda(presupuesto.total);
                const linkPresupuesto = window.location.href;

                const mensaje = `Hola ${nombreCliente}, te enviamos el presupuesto para tu ${vehiculo} desde Automat Astudillo.\n\n*Total Estimado: ${total}*\n\nPuedes ver el detalle completo aquí:\n${linkPresupuesto}`;
                const whatsappUrl = `https://wa.me/${telefonoCliente}?text=${encodeURIComponent(mensaje)}`;
                window.open(whatsappUrl, '_blank');
            }
        } catch (error) {
            // Ignoramos el error si el usuario simplemente cierra la ventana de compartir
            if (error.name === 'AbortError') {
                console.log('El usuario canceló la acción de compartir.');
            } else {
                console.error("Error al intentar compartir por WhatsApp:", error);
                alert("No se pudo compartir el presupuesto. Inténtalo de nuevo.");
            }
        }
    }

    // --- ASIGNAR EVENTOS Y EJECUTAR ---
    btnDescargar.addEventListener('click', descargarPDF);
    btnWhatsapp.addEventListener('click', enviarPorWhatsapp); 
    renderizarPresupuesto();
});