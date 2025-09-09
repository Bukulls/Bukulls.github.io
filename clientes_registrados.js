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
            
            const presupuestoIndex = presupuestos.map(p => p.clienteIndex).lastIndexOf(index.toString());
            
            let botonesPresupuestoHTML = '';
           if (presupuestoIndex !== -1) {
    // Creamos los botones de Ver, Editar y el nuevo de Crear OT
    botonesPresupuestoHTML = `
        <a href="ver_presupuesto.html?id=${presupuestoIndex}" class="btn-accion btn-ver">Ver Ppto.</a>
        <a href="presupuesto.html?editar_id=${presupuestoIndex}" class="btn-accion btn-editar">Editar Ppto.</a>
        <a href="orden_trabajo.html?id=${presupuestoIndex}" class="btn-accion btn-crear-ot">Crear OT</a>
    `;
}

            fila.innerHTML = `
                <td>${cliente.nombre}</td>
                <td>${cliente.telefono}</td>
                <td>${cliente.patente}</td>
                <td>${cliente.marca}</td>
                <td>${cliente.modelo}</td>
                <td>${cliente.anio}</td>
                <td class="acciones-cell">
                    <a href="admin_ingreso.html?editar=${index}" class="btn-accion btn-editar">Editar Cliente</a>
                    ${botonesPresupuestoHTML} <button class="btn-accion btn-eliminar" data-index="${index}">Eliminar</button>
                </td>
            `;
            
            tablaBody.appendChild(fila);
        });
    }

    tablaBody.addEventListener('click', function(evento) {
        if (evento.target.classList.contains('btn-eliminar')) {
            const index = evento.target.getAttribute('data-index');
            
            const confirmar = confirm('¿Estás seguro de que deseas eliminar este cliente?');
            if (confirmar) {
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