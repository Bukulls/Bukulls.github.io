document.addEventListener('DOMContentLoaded', function() {

    // --- SELECCIÓN DE ELEMENTOS DEL DOM ---
    const tablaBody = document.getElementById('tabla-body');
    const filtroInput = document.getElementById('filtro-busqueda');

    // --- CARGAR DATOS DESDE LOCALSTORAGE ---
    let clientes = JSON.parse(localStorage.getItem('clientes')) || [];

    // --- FUNCIÓN PARA GUARDAR LOS CLIENTES EN LOCALSTORAGE ---
    function guardarClientes() {
        localStorage.setItem('clientes', JSON.stringify(clientes));
    }

    // --- FUNCIÓN PARA MOSTRAR LOS CLIENTES EN LA TABLA ---
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
            
            fila.innerHTML = `
                <td>${cliente.nombre}</td>
                <td>${cliente.telefono}</td>
                <td>${cliente.patente}</td>
                <td>${cliente.marca}</td>
                <td>${cliente.modelo}</td>
                <td>${cliente.anio}</td>
                <td>
                    <a href="admin_ingreso.html?editar=${index}" class="btn-accion btn-editar">Editar</a>
                    <button class="btn-accion btn-eliminar" data-index="${index}">Eliminar</button>
                </td>
            `;
            
            tablaBody.appendChild(fila);
        });
    }

    // --- EVENTO PARA ELIMINAR UN CLIENTE ---
    tablaBody.addEventListener('click', function(evento) {
        if (evento.target.classList.contains('btn-eliminar')) {
            const index = evento.target.getAttribute('data-index');
            
            const confirmar = confirm('¿Estás seguro de que deseas eliminar este cliente?');
            if (confirmar) {
                clientes.splice(index, 1);
                guardarClientes();
                // Si estamos filtrando, volvemos a filtrar, si no, renderizamos todo.
                filtrarYRenderizar(); 
            }
        }
    });

    // --- FUNCIÓN Y EVENTO PARA EL FILTRO DE BÚSQUEDA ---
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

    // --- INICIALIZACIÓN ---
    renderizarTabla();
});