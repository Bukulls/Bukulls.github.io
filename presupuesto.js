document.addEventListener('DOMContentLoaded', function() {
    
    const clienteSelect = document.getElementById('cliente-select');
    const clienteInfoCard = document.getElementById('cliente-info');
    const manoObraInput = document.getElementById('mano-obra-monto');
    const repuestosContainer = document.getElementById('repuestos-container');
    const btnAgregarRepuesto = document.getElementById('btn-agregar-repuesto');
    const totalSpan = document.getElementById('total-presupuesto');
    const presupuestoForm = document.getElementById('presupuesto-form');
    const btnSubmit = presupuestoForm.querySelector('.btn-submit');

    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    let presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];

    // --- LÓGICA DE EDICIÓN ---
    let modoEdicionPresupuesto = false;
    let presupuestoAEditarIndex = null;

    const urlParams = new URLSearchParams(window.location.search);
    const editarId = urlParams.get('editar_id');

    if (editarId !== null) {
        modoEdicionPresupuesto = true;
        presupuestoAEditarIndex = parseInt(editarId, 10);
        cargarDatosPresupuestoParaEdicion(presupuestoAEditarIndex);
    }
    // --- FIN LÓGICA DE EDICIÓN ---

    function cargarClientesEnSelect() {
        if (clientes.length === 0) {
            clienteSelect.innerHTML = '<option value="">No hay clientes registrados</option>';
            return;
        }
        clienteSelect.innerHTML = '<option value="">-- Seleccione un Cliente --</option>';
        clientes.forEach((cliente, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${cliente.nombre} - ${cliente.patente}`;
            clienteSelect.appendChild(option);
        });
    }
    
    function mostrarInfoCliente(selectedIndex) {
        if (selectedIndex !== null && selectedIndex !== "") {
            const cliente = clientes[selectedIndex];
            clienteInfoCard.innerHTML = `
                <p><strong>Vehículo:</strong> ${cliente.marca} ${cliente.modelo} (${cliente.anio})</p>
                <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
                <p><strong>Email:</strong> ${cliente.email || 'No ingresado'}</p>
            `;
            clienteInfoCard.style.display = 'block';
        } else {
            clienteInfoCard.style.display = 'none';
        }
    }

    clienteSelect.addEventListener('change', function() {
        mostrarInfoCliente(this.value);
    });

    function calcularTotal() {
        let total = 0;
        const manoObra = parseFloat(manoObraInput.value) || 0;
        total += manoObra;
        const montosRepuestos = document.querySelectorAll('.monto-repuesto');
        montosRepuestos.forEach(input => {
            total += parseFloat(input.value) || 0;
        });
        totalSpan.textContent = total.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
    }
    
    function agregarCampoRepuesto(nombre = '', monto = '') {
        const nuevoRepuesto = document.createElement('div');
        nuevoRepuesto.classList.add('repuesto-item');
        nuevoRepuesto.innerHTML = `
            <input type="text" class="nombre-repuesto" placeholder="Nombre del Repuesto" value="${nombre}">
            <input type="number" class="monto-repuesto" placeholder="Monto" min="0" value="${monto}">
            <button type="button" class="btn-eliminar-repuesto">-</button>
        `;
        repuestosContainer.appendChild(nuevoRepuesto);
    }

    btnAgregarRepuesto.addEventListener('click', function() {
        agregarCampoRepuesto();
    });

    repuestosContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-eliminar-repuesto')) {
            e.target.parentElement.remove();
            calcularTotal();
        }
    });

    presupuestoForm.addEventListener('input', function(e) {
        if (e.target.id === 'mano-obra-monto' || e.target.classList.contains('monto-repuesto')) {
            calcularTotal();
        }
    });
    
    function cargarDatosPresupuestoParaEdicion(index) {
        const presupuesto = presupuestos[index];
        if (!presupuesto) {
            alert('Error: No se encontró el presupuesto a editar.');
            return;
        }

        document.getElementById('diagnostico-obs').value = presupuesto.diagnostico;
        manoObraInput.value = presupuesto.manoObra;
        
        clienteSelect.value = presupuesto.clienteIndex;
        mostrarInfoCliente(presupuesto.clienteIndex);
        clienteSelect.disabled = true; // No se puede cambiar el cliente al editar

        repuestosContainer.innerHTML = ''; // Limpiar campos de repuestos
        if(presupuesto.repuestos) {
            presupuesto.repuestos.forEach(rep => {
                agregarCampoRepuesto(rep.nombre, rep.monto);
            });
        }

        btnSubmit.textContent = 'Guardar Cambios en Presupuesto';
        btnSubmit.style.backgroundColor = 'var(--color-editar)';
        calcularTotal();
    }

    // --- LÓGICA DE ENVÍO CORREGIDA ---
    presupuestoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Obtenemos el índice del cliente de forma segura
        let clienteIndexSeleccionado;
        if (modoEdicionPresupuesto) {
            // En modo edición, lo tomamos del presupuesto que se está editando
            clienteIndexSeleccionado = presupuestos[presupuestoAEditarIndex].clienteIndex;
        } else {
            // En modo creación, lo tomamos del <select>
            clienteIndexSeleccionado = clienteSelect.value;
        }

        // Validamos que se haya seleccionado un cliente
        if (clienteIndexSeleccionado === "") {
            alert('Error: Debe seleccionar un cliente.');
            return;
        }
        
        const manoObra = parseFloat(manoObraInput.value) || 0;
        if (manoObra <= 0) {
             alert('Error: El monto de la mano de obra debe ser mayor a cero.');
             return;
        }

        const repuestos = [];
        const repuestoItems = document.querySelectorAll('.repuesto-item');
        repuestoItems.forEach(item => {
            const nombre = item.querySelector('.nombre-repuesto').value.trim();
            const monto = parseFloat(item.querySelector('.monto-repuesto').value) || 0;
            if (nombre && monto > 0) {
                repuestos.push({ nombre, monto });
            }
        });

        const totalFinal = manoObra + repuestos.reduce((sum, rep) => sum + rep.monto, 0);

        const presupuestoData = {
            clienteIndex: clienteIndexSeleccionado,
            diagnostico: document.getElementById('diagnostico-obs').value,
            manoObra: manoObra,
            repuestos: repuestos,
            total: totalFinal,
            fecha: new Date().toLocaleDateString('es-CL')
        };

        if (modoEdicionPresupuesto) {
            // Si estamos editando, actualizamos el presupuesto existente
            presupuestos[presupuestoAEditarIndex] = presupuestoData;
            alert('¡Presupuesto actualizado exitosamente!');
        } else {
            // Si no, creamos uno nuevo
            presupuestos.push(presupuestoData);
            alert('¡Presupuesto guardado exitosamente!');
        }
        
        localStorage.setItem('presupuestos', JSON.stringify(presupuestos));
        
        window.location.href = 'clientes_registrados.html';
    });

    cargarClientesEnSelect();
});