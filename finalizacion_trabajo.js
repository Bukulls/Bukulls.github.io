document.addEventListener('DOMContentLoaded', function() {
    // --- OBTENER DATOS DE LOCALSTORAGE ---
    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    let presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];
    let trabajosFinalizados = JSON.parse(localStorage.getItem('trabajosFinalizados')) || [];
    
    // --- OBTENER EL ID DE LA URL ---
    const urlParams = new URLSearchParams(window.location.search);
    // Lo llamamos 'id' porque puede ser un presupuestoId o un índice de trabajo finalizado
    const id = parseInt(urlParams.get('id'), 10);

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
        return total;
    }

    // --- FUNCIÓN DE CARGA DE DATOS CORREGIDA ---
    function cargarDatos() {
        if (isNaN(id)) {
            alert("Error: ID no válido.");
            return;
        }

        // Buscamos si este ID corresponde a un trabajo ya finalizado
        const trabajoFinalizado = trabajosFinalizados.find(t => t.presupuestoId === id);
        
        if (trabajoFinalizado) {
            // --- MODO VISTA: Cargar datos desde un trabajo ya guardado ---
            const cliente = clientes[trabajoFinalizado.clienteIndex];
            if (!cliente) { alert("Error: Cliente del trabajo finalizado no encontrado."); return; }

            document.getElementById('ot-numero').textContent = String(id + 1).padStart(4, '0');
            document.getElementById('cliente-nombre').value = cliente.nombre || '';
            document.getElementById('cliente-rut').value = cliente.rut || '';
            document.getElementById('vehiculo-info').value = `${cliente.marca} ${cliente.modelo} (${cliente.anio})`;
            document.getElementById('vehiculo-patente').value = cliente.patente || '';
            document.getElementById('fecha-ingreso').value = trabajoFinalizado.fechaIngreso || 'No registrada';
            document.getElementById('fecha-entrega').value = trabajoFinalizado.fechaFinalizacion;
            document.getElementById('trabajos-realizados').value = trabajoFinalizado.trabajosRealizados;
            document.getElementById('recomendaciones').value = trabajoFinalizado.recomendaciones;
            document.getElementById('meses-garantia').value = trabajoFinalizado.garantia;
            totalFinalSpan.textContent = formatearMoneda(trabajoFinalizado.total);
            
            // Deshabilitamos la edición ya que solo es para visualización
            document.getElementById('trabajos-realizados').readOnly = true;
            document.getElementById('recomendaciones').readOnly = true;
            document.getElementById('meses-garantia').readOnly = true;
            costosContainer.innerHTML = `<p>El detalle de costos se encuentra en el presupuesto original.</p>`;
            btnGuardar.style.display = 'none'; // Ocultamos el botón de guardar

        } else if (presupuestos[id]) {
            // --- MODO EDICIÓN: Cargar datos desde un presupuesto activo para finalizarlo ---
            const presupuesto = presupuestos[id];
            const cliente = clientes[presupuesto.clienteIndex];
            if (!cliente) { alert("Error: Cliente del presupuesto no encontrado."); return; }

            document.getElementById('ot-numero').textContent = String(id + 1).padStart(4, '0');
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

        } else {
            // Si no se encuentra en ninguna de las dos listas, mostramos un error
            alert("Error: No se encontró ni un presupuesto activo ni un trabajo finalizado con este ID.");
            document.body.innerHTML = "<h1>Error: Trabajo no encontrado</h1>";
        }
    }

    // --- LÓGICA PARA GUARDAR EL TRABAJO FINALIZADO ---
    btnGuardar.addEventListener('click', () => {
        const presupuestoOriginal = presupuestos[id];
        if (!presupuestoOriginal) {
            alert("Error: No se puede guardar, el presupuesto original no fue encontrado.");
            return;
        }

        const trabajoFinalizadoData = {
            presupuestoId: id,
            clienteIndex: presupuestoOriginal.clienteIndex,
            fechaIngreso: presupuestoOriginal.fecha, // Guardamos la fecha original
            fechaFinalizacion: document.getElementById('fecha-entrega').value,
            trabajosRealizados: document.getElementById('trabajos-realizados').value,
            recomendaciones: document.getElementById('recomendaciones').value,
            garantia: document.getElementById('meses-garantia').value,
            total: calcularTotalFinal()
        };

        trabajosFinalizados.push(trabajoFinalizadoData);
        localStorage.setItem('trabajosFinalizados', JSON.stringify(trabajosFinalizados));

        // Marcamos el presupuesto como null y luego lo filtramos para eliminarlo
        presupuestos[id] = null;
        const presupuestosActivos = presupuestos.filter(p => p !== null);
        localStorage.setItem('presupuestos', JSON.stringify(presupuestosActivos));

        alert("¡Trabajo finalizado y guardado con éxito!");
        window.location.href = 'index.html';
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