document.addEventListener('DOMContentLoaded', function() {
    // --- OBTENER DATOS ---
    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    let presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];
    let trabajosFinalizados = JSON.parse(localStorage.getItem('trabajosFinalizados')) || [];
    const urlParams = new URLSearchParams(window.location.search);
    const presupuestoId = parseInt(urlParams.get('id'), 10);

    // --- ELEMENTOS DEL DOM ---
    const costosContainer = document.getElementById('costos-finales-container');
    const totalFinalSpan = document.getElementById('total-final');
    const btnGuardar = document.getElementById('btn-guardar-finalizar');
    const btnImprimir = document.getElementById('btn-imprimir');

    const formatearMoneda = (valor) => {
        return valor.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
    };

    function calcularTotalFinal() {
        let total = 0;
        document.querySelectorAll('.monto-item').forEach(input => {
            total += parseFloat(input.value) || 0;
        });
        totalFinalSpan.textContent = formatearMoneda(total);
        return total; // Devolvemos el total para usarlo al guardar
    }

    function cargarDatos() {
        if (isNaN(presupuestoId) || !presupuestos[presupuestoId]) {
            alert("Error: Presupuesto no encontrado."); return;
        }
        const presupuesto = presupuestos[presupuestoId];
        const cliente = clientes[presupuesto.clienteIndex];
        if (!cliente) { alert("Error: Cliente no encontrado."); return; }

        document.getElementById('ot-numero').textContent = String(presupuestoId + 1).padStart(4, '0');
        document.getElementById('cliente-nombre').value = cliente.nombre || '';
        document.getElementById('cliente-rut').value = cliente.rut || '';
        document.getElementById('vehiculo-info').value = `${cliente.marca} ${cliente.modelo} (${cliente.anio})`;
        document.getElementById('vehiculo-patente').value = cliente.patente || '';
        document.getElementById('fecha-ingreso').value = presupuesto.fecha || 'No registrada';
        document.getElementById('fecha-entrega').value = new Date().toLocaleDateString('es-CL');
        document.getElementById('trabajos-realizados').value = presupuesto.diagnostico || '';

        costosContainer.innerHTML = '';
        const moHTML = `<div class="repuesto-item"><input type="text" class="nombre-item" value="Mano de Obra" readonly><input type="number" class="monto-item" value="${presupuesto.manoObra}"></div>`;
        costosContainer.insertAdjacentHTML('beforeend', moHTML);

        if (presupuesto.repuestos && presupuesto.repuestos.length > 0) {
            presupuesto.repuestos.forEach(rep => {
                const repHTML = `<div class="repuesto-item"><input type="text" class="nombre-item" value="${rep.nombre}"><input type="number" class="monto-item" value="${rep.monto}"></div>`;
                costosContainer.insertAdjacentHTML('beforeend', repHTML);
            });
        }
        calcularTotalFinal();
    }

    // --- LÓGICA PARA GUARDAR EL TRABAJO FINALIZADO ---
    btnGuardar.addEventListener('click', () => {
        const presupuestoOriginal = presupuestos[presupuestoId];
        if (!presupuestoOriginal) {
            alert("Error: No se puede guardar, el presupuesto original no fue encontrado.");
            return;
        }

        // Recolectar todos los datos del formulario
        const trabajoFinalizadoData = {
            presupuestoId: presupuestoId,
            clienteIndex: presupuestoOriginal.clienteIndex,
            fechaFinalizacion: document.getElementById('fecha-entrega').value,
            trabajosRealizados: document.getElementById('trabajos-realizados').value,
            recomendaciones: document.getElementById('recomendaciones').value,
            garantia: document.getElementById('meses-garantia').value,
            total: calcularTotalFinal() // Recalculamos por si hubo cambios
        };

        // Guardar en la lista de trabajos finalizados
        trabajosFinalizados.push(trabajoFinalizadoData);
        localStorage.setItem('trabajosFinalizados', JSON.stringify(trabajosFinalizados));

        // Marcar el presupuesto como "finalizado" para que no se muestre más
        // La mejor manera es simplemente eliminarlo de la lista activa de presupuestos.
        // Usamos un marcador 'null' para no afectar los índices de los demás.
        presupuestos[presupuestoId] = null;
        localStorage.setItem('presupuestos', JSON.stringify(presupuestos.filter(p => p !== null))); // Guardamos el array limpio

        alert("¡Trabajo finalizado y guardado con éxito!");
        window.location.href = 'index.html'; // Redirigir al dashboard
    });

    costosContainer.addEventListener('input', (e) => {
        if (e.target.classList.contains('monto-item')) {
            calcularTotalFinal();
        }
    });

    btnImprimir.addEventListener('click', () => {
        window.print();
    });

    cargarDatos();
});