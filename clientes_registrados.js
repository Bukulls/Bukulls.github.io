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
            
            const presupuestosDelClienteIndices = [];
            presupuestos.forEach((p, pIndex) => {
                // Se verifica que el presupuesto no sea null (en caso de haber sido eliminado)
                if (p && p.clienteIndex == index) { 
                    presupuestosDelClienteIndices.push(pIndex);
                }
            });

            let presupuestosHTML = '';
            if (presupuestosDelClienteIndices.length > 0) {
                presupuestosDelClienteIndices.forEach(presupuestoIndex => {
                    const presupuesto = presupuestos[presupuestoIndex];
                    const statusClass = presupuesto.status === 'aceptado' ? 'status-aceptado' : 'status-pendiente';

                    presupuestosHTML += `
                        <div class="presupuesto-accion-grupo">
                            <div class="presupuesto-header">
                                <span class="presupuesto-info">Ppto. N°${String(presupuestoIndex + 1).padStart(4, '0')}</span>
                                <span class="status-badge ${statusClass}">${presupuesto.status}</span>
                            </div>
                            <div class="estado-control">
                                <label>Cambiar estado:</label>
                                <select class="select-estado" data-index="${presupuestoIndex}">
                                    <option value="pendiente" ${presupuesto.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                                    <option value="aceptado" ${presupuesto.status === 'aceptado' ? 'selected' : ''}>Aceptado</option>
                                </select>
                            </div>
                            <hr class="acciones-divisor-inner">
                            <div class="botones-grupo">
                                <a href="ver_presupuesto.html?id=${presupuestoIndex}" class="btn-accion btn-ver">Ver</a>
                                <a href="presupuesto.html?editar_id=${presupuestoIndex}" class="btn-accion btn-editar">Editar</a>
                                <a href="orden_trabajo.html?id=${presupuestoIndex}" class="btn-accion btn-crear-ot">Crear OT</a>
                                <a href="finalizacion_trabajo.html?id=${presupuestoIndex}" class="btn-accion btn-finalizar">Finalizar</a>
                                <button class="btn-accion btn-eliminar btn-eliminar-presupuesto" data-index="${presupuestoIndex}">×</button>
                            </div>
                        </div>
                    `;
                });
            } else {
                presupuestosHTML = '<span>Aún no tiene presupuestos</span>';
            }

            fila.innerHTML = `
                <td>${cliente.nombre}</td>
                <td>${cliente.telefono}</td>
                <td>${cliente.patente}</td>
                <td>${cliente.marca}</td>
                <td>${cliente.modelo}</td>
                <td>${cliente.anio}</td>
                <td class="acciones-cell">
                    <div class="acciones-grupo-header">Acciones del Cliente</div>
                    <div class="cliente-acciones">
                        <a href="admin_ingreso.html?editar=${index}" class="btn-accion btn-editar">Editar Cliente</a>
                        <button class="btn-accion btn-eliminar" data-index="${index}">Eliminar Cliente</button>
                    </div>
                    <hr class="acciones-divisor">
                    <div class="acciones-grupo-header">Presupuestos</div>
                    ${presupuestosHTML}
                </td>
            `;
            
            tablaBody.appendChild(fila);
        });
    }

    tablaBody.addEventListener('click', function(evento) {
        // Lógica para eliminar el CLIENTE COMPLETO
        if (evento.target.classList.contains('btn-eliminar') && !evento.target.classList.contains('btn-eliminar-presupuesto')) {
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

        // --- INICIO DE LA NUEVA LÓGICA: Eliminar UN SOLO PRESUPUESTO ---
        if (evento.target.classList.contains('btn-eliminar-presupuesto')) {
            const presupuestoIndex = evento.target.getAttribute('data-index');
            const confirmar = confirm(`¿Estás seguro de que deseas eliminar el presupuesto N°${String(parseInt(presupuestoIndex) + 1).padStart(4, '0')}? Esta acción no se puede deshacer.`);
            
            if (confirmar) {
                // En lugar de eliminarlo directamente, lo marcamos como null
                // Esto es más seguro para no desordenar los índices de los demás presupuestos en la sesión actual
                presupuestos[presupuestoIndex] = null;
                
                // Luego, creamos un nuevo array limpio sin los elementos null para guardarlo
                const presupuestosActualizados = presupuestos.filter(p => p !== null);
                
                localStorage.setItem('presupuestos', JSON.stringify(presupuestosActualizados));
                
                // Recargamos la página. Es la forma más fiable de asegurar que todos los datos (clientes, presupuestos) se resincronicen correctamente desde el localStorage.
                location.reload();
            }
        }
        // --- FIN DE LA NUEVA LÓGICA ---
    });

    tablaBody.addEventListener('change', function(evento) {
        if (evento.target.classList.contains('select-estado')) {
            const presupuestoIndex = evento.target.getAttribute('data-index');
            const nuevoEstado = evento.target.value;

            presupuestos[presupuestoIndex].status = nuevoEstado;
            localStorage.setItem('presupuestos', JSON.stringify(presupuestos));
            
            alert(`El estado del presupuesto N°${String(parseInt(presupuestoIndex, 10) + 1).padStart(4, '0')} ha sido actualizado a "${nuevoEstado}".`);
            
            filtrarYRenderizar();
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