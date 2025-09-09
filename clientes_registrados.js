document.addEventListener('DOMContentLoaded', function() {

    const tablaBody = document.getElementById('tabla-body');
    const filtroInput = document.getElementById('filtro-busqueda');

    let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    let presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];

    function guardarClientes() {
        localStorage.setItem('clientes', JSON.stringify(clientes));
    }

    function renderizarTabla(clientesAMostrar = clientes) {
        tablaBody.innerHTML = '';

        if (clientesAMostrar.length === 0) {
            const mensaje = filtroInput.value ? 'No hay clientes que coincidan con la búsqueda.' : 'Aún no hay clientes registrados.';
            tablaBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">${mensaje}</td></tr>`;
            return;
        }
        
        clientesAMostrar.forEach(cliente => {
            const index = clientes.findIndex(c => c.patente === cliente.patente);
            const fila = document.createElement('tr');
            
            // --- INICIO DE LA MODIFICACIÓN ---
            // Buscamos TODOS los presupuestos que coincidan con el índice del cliente
            const presupuestosDelClienteIndices = [];
            presupuestos.forEach((p, pIndex) => {
                // Se usa '==' para comparar de forma flexible (string vs número)
                if (p.clienteIndex == index) {
                    presupuestosDelClienteIndices.push(pIndex);
                }
            });

            let botonesPresupuestoHTML = '';
            if (presupuestosDelClienteIndices.length > 0) {
                // Si encontramos presupuestos, creamos un grupo de botones para cada uno
                presupuestosDelClienteIndices.forEach(presupuestoIndex => {
                    const presupuesto = presupuestos[presupuestoIndex];
                    botonesPresupuestoHTML += `
                        <div class="presupuesto-accion-grupo">
                            <span class="presupuesto-info">Ppto. N°${String(presupuestoIndex + 1).padStart(4, '0')} (${presupuesto.fecha || ''}):</span>
                            <div class="botones-grupo">
                                <a href="ver_presupuesto.html?id=${presupuestoIndex}" class="btn-accion btn-ver">Ver</a>
                                <a href="presupuesto.html?editar_id=${presupuestoIndex}" class="btn-accion btn-editar">Editar</a>
                                <a href="orden_trabajo.html?id=${presupuestoIndex}" class="btn-accion btn-crear-ot">Crear OT</a>
                                <a href="finalizacion_trabajo.html?id=${presupuestoIndex}" class="btn-accion btn-finalizar">Finalizar</a>
                                </div>
                        </div>
                    `;
                });
            } else {
                botonesPresupuestoHTML = '<span>Aún no tiene presupuestos</span>';
            }
            // --- FIN DE LA MODIFICACIÓN ---

            fila.innerHTML = `
                <td>${cliente.nombre}</td>
                <td>${cliente.telefono}</td>
                <td>${cliente.patente}</td>
                <td>${cliente.marca}</td>
                <td>${cliente.modelo}</td>
                <td>${cliente.anio}</td>
                <td class="acciones-cell">
                    <div class="cliente-acciones">
                        <a href="admin_ingreso.html?editar=${index}" class="btn-accion btn-editar">Editar Cliente</a>
                        <button class="btn-accion btn-eliminar" data-index="${index}">Eliminar</button>
                    </div>
                    <hr class="acciones-divisor">
                    ${botonesPresupuestoHTML}
                </td>
            `;
            
            tablaBody.appendChild(fila);
        });
    }

    tablaBody.addEventListener('click', function(evento) {
        if (evento.target.classList.contains('btn-eliminar')) {
            const index = evento.target.getAttribute('data-index');
            
            const confirmar = confirm('¿Estás seguro de que deseas eliminar este cliente? Se eliminarán también todos sus presupuestos asociados.');
            if (confirmar) {
                // Eliminar presupuestos asociados
                presupuestos = presupuestos.filter(p => p.clienteIndex != index);
                localStorage.setItem('presupuestos', JSON.stringify(presupuestos));
                
                // Eliminar cliente
                clientes.splice(index, 1);
                guardarClientes();
                filtrarYRenderizar(); 
            }
        }
    });

    function filtrarYRenderizar() {
        const terminoBusqueda = filtroInput.value.toLowerCase();
        const clientesFiltrados = clientes.filter(cliente => {
            return cliente.nombre.toLowerCase().includes(terminoBusqueda) ||
                   cliente.patente.toLowerCase().includes(terminoBusqueda) ||
                   cliente.telefono.includes(terminoBusqueda) ||
                   cliente.marca.toLowerCase().includes(terminoBusqueda) ||
                   cliente.modelo.toLowerCase().includes(terminoBusqueda);
        });
        renderizarTabla(clientesFiltrados);
    }

    filtroInput.addEventListener('keyup', filtrarYRenderizar);

    renderizarTabla();
});