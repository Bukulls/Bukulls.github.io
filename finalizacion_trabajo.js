document.addEventListener('DOMContentLoaded', function() {
    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];
    const urlParams = new URLSearchParams(window.location.search);
    const presupuestoId = parseInt(urlParams.get('id'), 10);

    const costosContainer = document.getElementById('costos-finales-container');
    const totalFinalSpan = document.getElementById('total-final');

    const formatearMoneda = (valor) => {
        return valor.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
    };

    function calcularTotalFinal() {
        let total = 0;
        document.querySelectorAll('.monto-item').forEach(input => {
            total += parseFloat(input.value) || 0;
        });
        totalFinalSpan.textContent = formatearMoneda(total);
    }

    function cargarDatos() {
        if (isNaN(presupuestoId) || !presupuestos[presupuestoId]) {
            alert("Error: Presupuesto no encontrado."); return;
        }

        const presupuesto = presupuestos[presupuestoId];
        const cliente = clientes[presupuesto.clienteIndex];
        if (!cliente) { alert("Error: Cliente no encontrado."); return; }

        // Llenar datos de cabecera
        document.getElementById('ot-numero').textContent = String(presupuestoId + 1).padStart(4, '0');
        document.getElementById('cliente-nombre').value = cliente.nombre || '';
        document.getElementById('cliente-rut').value = cliente.rut || '';
        document.getElementById('vehiculo-info').value = `${cliente.marca} ${cliente.modelo} (${cliente.anio})`;
        document.getElementById('vehiculo-patente').value = cliente.patente || '';
        document.getElementById('fecha-ingreso').value = presupuesto.fecha || 'No registrada';
        document.getElementById('fecha-entrega').value = new Date().toLocaleDateString('es-CL');
        document.getElementById('trabajos-realizados').value = presupuesto.diagnostico || '';

        // Llenar costos (haciéndolos editables)
        costosContainer.innerHTML = ''; // Limpiar
        
        // Mano de obra
        const moHTML = `
            <div class="repuesto-item">
                <input type="text" class="nombre-item" value="Mano de Obra" readonly>
                <input type="number" class="monto-item" value="${presupuesto.manoObra}">
            </div>`;
        costosContainer.insertAdjacentHTML('beforeend', moHTML);

        // Repuestos
        if (presupuesto.repuestos && presupuesto.repuestos.length > 0) {
            presupuesto.repuestos.forEach(rep => {
                const repHTML = `
                    <div class="repuesto-item">
                        <input type="text" class="nombre-item" value="${rep.nombre}">
                        <input type="number" class="monto-item" value="${rep.monto}">
                    </div>`;
                costosContainer.insertAdjacentHTML('beforeend', repHTML);
            });
        }
        
        calcularTotalFinal();
    }

    // Event listener para recalcular el total si se cambia un monto
    costosContainer.addEventListener('input', (e) => {
        if (e.target.classList.contains('monto-item')) {
            calcularTotalFinal();
        }
    });

    // Botón Imprimir
    document.getElementById('btn-imprimir').addEventListener('click', () => {
        window.print();
    });

    cargarDatos();
});