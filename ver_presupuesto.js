document.addEventListener('DOMContentLoaded', function() {
    // --- ELEMENTOS DEL DOM ---
    const detalleContainer = document.getElementById('presupuesto-a-exportar');
    const btnDescargar = document.getElementById('btn-descargar-pdf');
    // AÑADIDO PARA WHATSAPP
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

    // --- FUNCIÓN PARA RENDERIZAR EL PRESUPUESTO (CON MANEJO DE ERRORES) ---
    function renderizarPresupuesto() {
        try {
            // 1. Validar el ID del presupuesto desde la URL
            if (isNaN(presupuestoId)) {
                throw new Error("La URL no contiene un ID de presupuesto válido.");
            }

            // 2. Encontrar el presupuesto usando el ID
            const presupuesto = presupuestos[presupuestoId];
            if (!presupuesto) {
                throw new Error(`No se encontró ningún presupuesto con el ID: ${presupuestoId}.`);
            }

            // 3. Validar y encontrar el cliente asociado
            const clienteIndex = presupuesto.clienteIndex;
            if (clienteIndex === undefined || clienteIndex === null) {
                throw new Error("Este presupuesto no tiene un cliente asociado correctamente.");
            }
            const cliente = clientes[clienteIndex];
            if (!cliente) {
                throw new Error(`El cliente asociado (ID: ${clienteIndex}) no fue encontrado. Es posible que haya sido eliminado.`);
            }

            // --- Si todas las validaciones pasan, construimos el HTML ---

            let repuestosHTML = '';
            if (presupuesto.repuestos && presupuesto.repuestos.length > 0) {
                repuestosHTML = presupuesto.repuestos.map(rep => `
                    <tr>
                        <td>Repuesto: ${rep.nombre || 'Sin nombre'}</td>
                        <td class="monto">${formatearMoneda(rep.monto)}</td>
                    </tr>
                `).join('');
            }

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
                    <p><strong>Fecha:</strong> ${presupuesto.fecha || 'No definida'}</p>
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

        } catch (error) {
            // --- Bloque CATCH: Si algo falla, se ejecuta esto ---
            console.error("Error al renderizar el presupuesto:", error);
            detalleContainer.innerHTML = `
                <div class="error-card">
                    <h2>Oops! Hubo un problema al cargar</h2>
                    <p>No se pudieron mostrar los detalles del presupuesto.</p>
                    <p><strong>Motivo:</strong> ${error.message}</p>
                </div>
            `;
            // Se actualiza para ocultar el contenedor de ambos botones en caso de error
            if (accionesContainer) accionesContainer.style.display = 'none';
        }
    }
    
    // --- FUNCIÓN PARA DESCARGAR EL PDF (SIN CAMBIOS) ---
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

    // --- FUNCIÓN AÑADIDA PARA ENVIAR POR WHATSAPP ---
    function enviarPorWhatsapp() {
        try {
            const presupuesto = presupuestos[presupuestoId];
            const cliente = clientes[presupuesto.clienteIndex];

            // Limpia y formatea el número de teléfono para el estándar internacional
            let telefonoCliente = cliente.telefono.replace(/\s+/g, '');
            if (!telefonoCliente.startsWith('56')) {
                telefonoCliente = '56' + telefonoCliente;
            }

            const nombreCliente = cliente.nombre.split(' ')[0]; // Solo el primer nombre
            const vehiculo = `${cliente.marca} ${cliente.modelo}`;
            const total = formatearMoneda(presupuesto.total);
            const linkPresupuesto = window.location.href;

            // Mensaje predefinido
            const mensaje = `Hola ${nombreCliente}, te enviamos el presupuesto para tu ${vehiculo} desde Automat Astudillo.\n\n*Total Estimado: ${total}*\n\nPuedes ver el detalle completo aquí:\n${linkPresupuesto}`;
            
            // Crea y abre la URL de WhatsApp
            const whatsappUrl = `https://wa.me/${telefonoCliente}?text=${encodeURIComponent(mensaje)}`;
            window.open(whatsappUrl, '_blank');

        } catch (error) {
            console.error("Error al generar enlace de WhatsApp:", error);
            alert("No se pudo crear el mensaje de WhatsApp. Verifique los datos del cliente.");
        }
    }

    // --- ASIGNAR EVENTOS Y EJECUTAR ---
    btnDescargar.addEventListener('click', descargarPDF);
    // EVENTO AÑADIDO PARA EL BOTÓN DE WHATSAPP
    btnWhatsapp.addEventListener('click', enviarPorWhatsapp); 
    renderizarPresupuesto();
});document.addEventListener('DOMContentLoaded', function() {
    // --- ELEMENTOS DEL DOM ---
    const detalleContainer = document.getElementById('presupuesto-a-exportar');
    const btnDescargar = document.getElementById('btn-descargar-pdf');
    // AÑADIDO PARA WHATSAPP
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

    // --- FUNCIÓN PARA RENDERIZAR EL PRESUPUESTO (CON MANEJO DE ERRORES) ---
    function renderizarPresupuesto() {
        try {
            // 1. Validar el ID del presupuesto desde la URL
            if (isNaN(presupuestoId)) {
                throw new Error("La URL no contiene un ID de presupuesto válido.");
            }

            // 2. Encontrar el presupuesto usando el ID
            const presupuesto = presupuestos[presupuestoId];
            if (!presupuesto) {
                throw new Error(`No se encontró ningún presupuesto con el ID: ${presupuestoId}.`);
            }

            // 3. Validar y encontrar el cliente asociado
            const clienteIndex = presupuesto.clienteIndex;
            if (clienteIndex === undefined || clienteIndex === null) {
                throw new Error("Este presupuesto no tiene un cliente asociado correctamente.");
            }
            const cliente = clientes[clienteIndex];
            if (!cliente) {
                throw new Error(`El cliente asociado (ID: ${clienteIndex}) no fue encontrado. Es posible que haya sido eliminado.`);
            }

            // --- Si todas las validaciones pasan, construimos el HTML ---

            let repuestosHTML = '';
            if (presupuesto.repuestos && presupuesto.repuestos.length > 0) {
                repuestosHTML = presupuesto.repuestos.map(rep => `
                    <tr>
                        <td>Repuesto: ${rep.nombre || 'Sin nombre'}</td>
                        <td class="monto">${formatearMoneda(rep.monto)}</td>
                    </tr>
                `).join('');
            }

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
                    <p><strong>Fecha:</strong> ${presupuesto.fecha || 'No definida'}</p>
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

        } catch (error) {
            // --- Bloque CATCH: Si algo falla, se ejecuta esto ---
            console.error("Error al renderizar el presupuesto:", error);
            detalleContainer.innerHTML = `
                <div class="error-card">
                    <h2>Oops! Hubo un problema al cargar</h2>
                    <p>No se pudieron mostrar los detalles del presupuesto.</p>
                    <p><strong>Motivo:</strong> ${error.message}</p>
                </div>
            `;
            // Se actualiza para ocultar el contenedor de ambos botones en caso de error
            if (accionesContainer) accionesContainer.style.display = 'none';
        }
    }
    
    // --- FUNCIÓN PARA DESCARGAR EL PDF (SIN CAMBIOS) ---
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

    // --- FUNCIÓN AÑADIDA PARA ENVIAR POR WHATSAPP ---
    function enviarPorWhatsapp() {
        try {
            const presupuesto = presupuestos[presupuestoId];
            const cliente = clientes[presupuesto.clienteIndex];

            // Limpia y formatea el número de teléfono para el estándar internacional
            let telefonoCliente = cliente.telefono.replace(/\s+/g, '');
            if (!telefonoCliente.startsWith('56')) {
                telefonoCliente = '56' + telefonoCliente;
            }

            const nombreCliente = cliente.nombre.split(' ')[0]; // Solo el primer nombre
            const vehiculo = `${cliente.marca} ${cliente.modelo}`;
            const total = formatearMoneda(presupuesto.total);
            const linkPresupuesto = window.location.href;

            // Mensaje predefinido
            const mensaje = `Hola ${nombreCliente}, te enviamos el presupuesto para tu ${vehiculo} desde Automat Astudillo.\n\n*Total Estimado: ${total}*\n\nPuedes ver el detalle completo aquí:\n${linkPresupuesto}`;
            
            // Crea y abre la URL de WhatsApp
            const whatsappUrl = `https://wa.me/${telefonoCliente}?text=${encodeURIComponent(mensaje)}`;
            window.open(whatsappUrl, '_blank');

        } catch (error) {
            console.error("Error al generar enlace de WhatsApp:", error);
            alert("No se pudo crear el mensaje de WhatsApp. Verifique los datos del cliente.");
        }
    }

    // --- ASIGNAR EVENTOS Y EJECUTAR ---
    btnDescargar.addEventListener('click', descargarPDF);
    // EVENTO AÑADIDO PARA EL BOTÓN DE WHATSAPP
    btnWhatsapp.addEventListener('click', enviarPorWhatsapp); 
    renderizarPresupuesto();
});